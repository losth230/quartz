// ══════════════════════════════════════════════════════════════════════
//  ARMÉES (RecruitForArmies)
//  Recrutement, pertes, commandants et puissance des armées.
//  Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf, metierDef } from './gameData'
import type { Cfg } from './gameData'
import { reductionLeveeBatiments } from './constructions'
import { emptyRecap, fullName } from './shared'

// ── Armées (RecruitForArmies) ────────────────────────────────────────────

// (Arbitrage Thibaut 2026-10-28 : « je me fiche qu'ils vivent dans les
//  paramètres, général et soldat sont des métiers, ils doivent donc
//  vivre dans la banque » — les PUISSANCES d'armée et les ÂGES de
//  recrutement vivent sur les LIGNES DE MÉTIER du référentiel
//  (champs données puissanceArmee / ageMin / ageMax, complétés par la
//  migration armeesBanque2026 depuis les paramètres sauvegardés) ;
//  repli sur les paramètres historiques si la ligne ne porte pas le
//  champ — les 4 paramètres restent des REFLIS de compatibilité.)

/** Puissance d'armée d'un porteur de métier — ligne de métier du
 *  référentiel (ex. Soldat : 15, Commandant : 45), repli sur le
 *  paramètre historique. */
export function puissanceArmeeMetier(nomMetier: string, C: Cfg, repli: number): number {
  return metierDef(nomMetier, C.config)?.puissanceArmee ?? repli
}

/** Bornes d'âge de recrutement des soldats — ligne du métier Soldat
 *  (ex. 16-30 ans), repli sur les paramètres soldatAgeMin/soldatAgeMax. */
export function agesRecrutementSoldat(C: Cfg): { min: number; max: number } {
  const def = metierDef(C.p.metierSoldat, C.config)
  return { min: def?.ageMin ?? C.p.soldatAgeMin, max: def?.ageMax ?? C.p.soldatAgeMax }
}

export function recruitForArmies(state: GameState, p: Player, rng: Rng) {
  const C = cfgOf(state.config)
  const pop = state.population[p.n] ?? []
  const recap = p.recap ?? emptyRecap()
  for (const armee of p.armees) {
    // retirer les soldats morts
    armee.soldats = armee.soldats.filter((id) => {
      const s = pop.find((x) => x.id === id)
      return s && s.statut !== 'Décédé'
    })
    // (Arbitrage Thibaut 2026-10-28, 2e retour « les pertes baissent
    //  ENCORE l'armée à 45 » : PLUS AUCUNE DÉRIVATION — la puissance
    //  STOCKÉE fait foi pour TOUTE armée, suivie ou non. Le modèle
    //  du matin (dérivation pour les armées suivies, migration par
    //  les recrues d'un renfort) est abandonné : une armée de
    //  plateau de 200 pts ne sera jamais couverte par ses
    //  recrues réelles, et la dérivation l'écrasait à son seul
    //  commandant (45) dès que ses rares recrues tombaient.)
    // commandant mort ? (sa chute coûte ses points à la stockée,
    //  comme une perte au combat.)
    const cmd = armee.commandant ? pop.find((x) => x.id === armee.commandant) : undefined
    // (Arbitrage Thibaut 2026-10-28 : puissances lues sur les lignes
    //  de métier Soldat / Commandant du référentiel.)
    const puissanceSoldat = puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat)
    const puissanceCommandant = puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral)
    const ages = agesRecrutementSoldat(C)
    let puissance = armee.puissance
    if (cmd && cmd.statut !== 'Décédé') {
      // commandant vivant : ses points sont déjà dans la stockée
      // (levée, renfort ou recrutement) — pas de double comptage
    } else if (armee.commandant) {
      armee.commandant = null
      puissance = Math.max(0, puissance - puissanceCommandant)
      recap.commandantTombe = armee.nom
      state.log.push({
        turn: state.turn + 1, type: 'Armée', joueur: p.n,
        texte: `${p.nom} : le commandant de l'armée « ${armee.nom} » est tombé — à remplacer !`,
      })
    }
    // recruter jusqu'à la puissance cible
    while (puissance < armee.puissanceCible) {
      const candidats = pop.filter(
        (c) =>
          c.statut !== 'Décédé' &&
          c.age >= ages.min && c.age <= ages.max &&
          !c.armee && (!c.metier || c.metier === C.p.metierChasseur),
      )
      if (candidats.length === 0) break
      const s = rng.pick(candidats)
      s.metier = C.p.metierSoldat
      s.armee = armee.nom
      armee.soldats.push(s.id)
      puissance += puissanceSoldat
      state.log.push({
        turn: state.turn + 1, type: 'Armée', joueur: p.n,
        texte: `${fullName(s)} rejoint l'armée « ${armee.nom} » comme soldat.`,
      })
    }
    armee.puissance = puissance
  }
}

// (RETRAIT 2026-10-28, 2e retour arbitre « les pertes baissent encore
//  l'armée à 45 » : recomputeArmy — dérivation « soldats × pts +
//  commandant » — est SUPPRIMÉ. Il écrasait la puissance stockée
//  d'une armée dont les recrues réelles ne couvraient qu'une
//  fraction des points de plateau : une armée de 200 pts suivie de
//  2 recrues perdant ses 2 soldats retombait à 45 (son seul
//  commandant). La puissance STOCKÉE fait foi pour TOUTE armée :
//  pertes et fin de service sont soustractives sur la puissance ET
//  la cible (pas de remplissage automatique), recruitForArmies
//  recrute au-dessus de la stockée vers la cible. Historique :
//  « Recalcule la puissance affichée d'une armée (après édition
//  manuelle) — arbitrage 2026-10-28 : puissances lues sur les
//  lignes de métier, même lecture que recruitForArmies ». RESTAURÉ
//  si un besoin d'alignement manuel émerge.)

/**
 * INFLIGER DES PERTES (revue 2026-10-17 ; arbitrage Thibaut 2026-10-28,
 *  2e retour) : `nb` pertes coûtent `nb` × points du Soldat, sur la
 *  puissance ET la puissance CIBLE (le commandant tué en premier si
 *  demandé coûte ses points en plus). Les soldats réellement suivis
 *  meurent dans l'ordre d'engagement (statut « Décédé », conjoint
 *  libéré) ; une armée non suivie ne perd que des points. PLUS
 *  AUCUNE DÉRIVATION : la puissance stockée fait foi, et la cible
 *  suit les pertes — pas de remplissage automatique au tour
 *  suivant (arbitrage Thibaut 2026-10-28). Retourne les noms des
 *  soldats tués.
 */
export function infligerPertes(
  state: GameState, p: Player, idxArmee: number, nb: number,
  tuerCommandant = false,
): string[] {
  const armee = p.armees?.[idxArmee]
  if (!armee || nb <= 0) return []
  const pop = state.population[p.n] ?? []
  const tombes: string[] = []
  const tuer = (c: import('./types').Character) => {
    c.statut = 'Décédé'
    // M1 (2026-10-19) : veuvage par ID (les noms complets ne sont plus
    //  une identité fiable à 16 000 habitants).
    if (c.mariageId) {
      for (const liste of Object.values(state.population ?? {})) {
        for (const x of liste ?? []) {
          if (x.mariageId === c.id) { x.mariage = null; x.mariageId = null }
        }
      }
    }
    armee.soldats = armee.soldats.filter((id) => id !== c.id)
    c.armee = null
    tombes.push(fullName(c))
  }
  // (Arbitrage Thibaut 2026-10-28, 2e retour « les pertes baissent
  //  encore l'armée à 45 » : modèle UNIFIÉ — la puissance STOCKÉE
  //  fait foi pour TOUTE armée, suivie ou non. Les pertes sont
  //  SOUSTRACTIVES sur la puissance ET la puissance CIBLE (nb ×
  //  points du soldat, + points du commandant s'il tombe), sans
  //  AUCUNE dérivation : les recrues réelles d'une armée de
  //  plateau n'en couvrent qu'une fraction, la dérivation
  //  l'écrasait à son seul commandant. Les soldats réellement
  //  suivis meurent dans l'ordre d'engagement, jusqu'à nb.)
  const C = cfgOf(state.config)
  const puSoldat = puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat)
  const puCmd = puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral)
  let cmdTomb = false
  if (tuerCommandant && armee.commandant) {
    const cmd = pop.find((x) => x.id === armee.commandant)
    if (cmd && cmd.statut !== 'Décédé') {
      tuer(cmd)
      armee.commandant = null
      cmdTomb = true
    }
  }
  for (const id of [...armee.soldats]) {
    if (tombes.length >= nb) break
    const c = pop.find((x) => x.id === id)
    if (c && c.statut !== 'Décédé') tuer(c)
  }
  const perte = nb * puSoldat + (cmdTomb ? puCmd : 0)
  armee.puissance = Math.max(0, armee.puissance - perte)
  armee.puissanceCible = Math.max(0, armee.puissanceCible - perte)
  state.log.push({
    turn: state.turn, type: 'Armée', joueur: p.n,
    texte: `⚔ Pertes — ${armee.nom} : ${nb} perte(s) au combat${cmdTomb ? ` — et le commandant (${tombes[0]})` : ''} (−${perte} pts sur la puissance et la cible). Puissance restante : ${Math.round(armee.puissance)} (cible ${Math.round(armee.puissanceCible)}).`,
  })
  return tombes
}

/**
 * FIN DE SERVICE (revue 2026-10-17 ; arbitrage Thibaut 2026-10-28,
 *  2e retour) : N soldats quittent l'armée et redeviennent CHASSEURS
 *  (même convention que Dissoudre — ils restent vivants et
 *  productifs) ; le commandant peut être démobilisé aussi. Comme
 *  les pertes : SOUSTRACTIF sur la puissance ET la puissance cible
 *  (nb × points du soldat, + points du commandant), sans AUCUNE
 *  dérivation — la puissance stockée fait foi, la cible suit, pas
 *  de remplissage automatique. Retourne les noms des soldats
 *  libérés.
 */
export function libererSoldats(
  state: GameState, p: Player, idxArmee: number, nb: number,
  libererCommandant = false,
): string[] {
  const armee = p.armees?.[idxArmee]
  if (!armee || nb <= 0) return []
  const pop = state.population[p.n] ?? []
  const liberes: string[] = []
  const liberer = (c: import('./types').Character) => {
    c.armee = null
    c.metier = 'Chasseur' // re-titré comme Dissoudre / RetirerArmee
    armee.soldats = armee.soldats.filter((id) => id !== c.id)
    liberes.push(fullName(c))
  }
  // (Arbitrage Thibaut 2026-10-28, 2e retour : modèle UNIFIÉ —
  //  SOUSTRACTIF sur la puissance ET la puissance cible, comme
  //  les pertes, sans AUCUNE dérivation. Les soldats réellement
  //  suivis redeviennent Chasseurs, jusqu'à nb.)
  const C = cfgOf(state.config)
  const puSoldat = puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat)
  const puCmd = puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral)
  let cmdLibere = false
  if (libererCommandant && armee.commandant) {
    const cmd = pop.find((x) => x.id === armee.commandant)
    if (cmd && cmd.statut !== 'Décédé') {
      liberer(cmd)
      armee.commandant = null
      cmdLibere = true
    }
  }
  for (const id of [...armee.soldats]) {
    if (liberes.length >= nb) break
    const c = pop.find((x) => x.id === id)
    if (c && c.statut !== 'Décédé') liberer(c)
  }
  const perte = nb * puSoldat + (cmdLibere ? puCmd : 0)
  armee.puissance = Math.max(0, armee.puissance - perte)
  armee.puissanceCible = Math.max(0, armee.puissanceCible - perte)
  state.log.push({
    turn: state.turn, type: 'Armée', joueur: p.n,
    texte: `🕊 Fin de service — ${armee.nom} : ${nb} soldat(s) démobilisé(s)${cmdLibere ? ' et le commandant' : ''} (−${perte} pts sur la puissance et la cible)${liberes.length > (cmdLibere ? 1 : 0) ? ` — libérés : ${liberes.slice(cmdLibere ? 1 : 0).join(', ')}` : ''}. Puissance restante : ${Math.round(armee.puissance)} (cible ${Math.round(armee.puissanceCible)}).`,
  })
  return liberes
}

/** Prix de levée d'une armée : Or facturés pour sa puissance CIBLE,
 *  1 Or tous les 2 points de force (paramétrable via armeePrixOr /
 *  armeePriXPuissance). Payé UNE FOIS à la levée — pas d'entretien.
 *  (Arbitrage Thibaut 2026-10-28 : le RENFORT est EN TOUT POINT une
 *  levée au sein d'une armée existante — même prix, mêmes réductions
 *  de la ville de renfort ; la puissance cible est relevée de N et
 *  le recrutement de chaque tour comble l'écart.)
 *  (Arbitrage Thibaut 2026-10-28 : « les armées, et surtout les
 *  réductions de levée, rejoignent la banque » — les réductions de
 *  levée ne sont plus codées en dur par NOM de bâtiment : le champ
 *  reductionLeveeArmee vit sur les fiches de construction (Terrain
 *  d'entrainement : 10, Ecole militaire : 25, Grande caserne : 8,
 *  Guilde des explorateurs : 20), passe par le canal de banque
 *  reductionLeveeArmee et se lit par reductionLeveeBatiments(ville,
 *  C) pour la ville de levée — la levée se passe DANS une
 *  habitation, retour Thibaut 2026-10-15.)
 *  Le flag `prochaineArmeeReduite` (Stratégies militaires I, −50 Or
 *  sur la prochaine levée — revue 2026-10-15) est RETIRÉ : mort
 *  depuis la purge du système de progrès du 2026-10-24 (aucun
 *  producteur ne le posait plus) ; un champ résiduel d'une vieille
 *  sauvegarde est simplement ignoré.
 *  Historique préservé : (RETRAIT 2026-10-27, audit — merveilles
 *  supprimées : plus de réduction de levée par merveille) ;
 *  (RETRAIT 2026-10-24 : Conscription I −10 Or supprimée avec le
 *  système de progrès, retour arbitre).) */
export function prixArmee(
  puissanceCible: number,
  C: Cfg,
  ville?: { batiments?: string[] },
): number {
  const tranche = Math.max(1, C.p.armeePriXPuissance)
  if (puissanceCible <= 0) return 0
  const prix = (puissanceCible / tranche) * C.p.armeePrixOr
  const reduction = ville ? reductionLeveeBatiments(ville, C) : 0
  return Math.max(0, Math.round(prix - reduction))
}

/** Plafond d'armées — SUPPRIMÉ (retour joueur 2026-10-18) : plus aucun
 *  hardcap, le paramètre maxArmees est ignoré. Fonction conservée pour la
 *  compatibilité de l'API (autres modules) mais ne plafonne plus. */
export function maxArmeesJoueur(
  _p: Player,
  _C: { p: { maxArmees: number } } & import('./gameData').Cfg,
): number {
  return Number.POSITIVE_INFINITY
}
