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
    // commandant mort ?
    const cmd = armee.commandant ? pop.find((x) => x.id === armee.commandant) : undefined
    // (Arbitrage Thibaut 2026-10-28 : puissances lues sur les lignes
    //  de métier Soldat / Commandant du référentiel.)
    const puissanceSoldat = puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat)
    const puissanceCommandant = puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral)
    const ages = agesRecrutementSoldat(C)
    let puissance = armee.soldats.length * puissanceSoldat
    if (cmd && cmd.statut !== 'Décédé') {
      puissance += puissanceCommandant
    } else if (armee.commandant) {
      armee.commandant = null
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

/** Recalcule la puissance affichée d'une armée (après édition manuelle).
 *  (Arbitrage Thibaut 2026-10-28 : puissances lues sur les lignes de
 *  métier — même lecture que recruitForArmies.) */
export function recomputeArmy(state: GameState, p: Player, armee: { nom: string; soldats: string[]; commandant: string | null; puissance: number }) {
  const C = cfgOf(state.config)
  const pop = state.population[p.n] ?? []
  const cmd = armee.commandant ? pop.find((x) => x.id === armee.commandant) : undefined
  armee.puissance =
    armee.soldats.filter((id) => {
      const s = pop.find((x) => x.id === id)
      return s && s.statut !== 'Décédé'
    }).length * puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat) + (cmd && cmd.statut !== 'Décédé' ? puissanceArmeeMetier(C.p.metierCommandant, C, C.p.puissanceGeneral) : 0)
}

/**
 * INFLIGER DES PERTES (revue 2026-10-17) : tue `nb` soldats d'une armée
 *  (l'ordre du tableau = l'ordre d'engagement), retire leurs ids de
 *  l'armée, et tue le commandant en premier si demandé. Les soldats
 *  tombés au combat : statut « Décédé », conjoint libéré, puissance
 *  recalculée. Retourne la liste des noms des soldats tués.
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
  if (tuerCommandant && armee.commandant) {
    const cmd = pop.find((x) => x.id === armee.commandant)
    if (cmd && cmd.statut !== 'Décédé') {
      tuer(cmd)
      armee.commandant = null
    }
  }
  for (const id of [...armee.soldats]) {
    if (tombes.length >= nb) break
    const c = pop.find((x) => x.id === id)
    if (c && c.statut !== 'Décédé') tuer(c)
  }
  recomputeArmy(state, p, armee)
  if (tombes.length > 0) {
    state.log.push({
      turn: state.turn, type: 'Armée', joueur: p.n,
      texte: `⚔ Pertes — ${armee.nom} : ${tombes.length} tombé(s) au combat (${tombes.join(', ')}). Puissance restante : ${Math.round(armee.puissance)}.`,
    })
  }
  return tombes
}

/**
 * FIN DE SERVICE (revue 2026-10-17) : N soldats quittent l'armée et
 *  redeviennent CHASSEURS (même convention que Dissoudre — ils restent
 *  vivants et productifs). Le commandant peut être démobilisé aussi.
 *  Puissance recalculée. Retourne les noms des soldats libérés.
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
  if (libererCommandant && armee.commandant) {
    const cmd = pop.find((x) => x.id === armee.commandant)
    if (cmd && cmd.statut !== 'Décédé') {
      liberer(cmd)
      armee.commandant = null
    }
  }
  for (const id of [...armee.soldats]) {
    if (liberes.length >= nb) break
    const c = pop.find((x) => x.id === id)
    if (c && c.statut !== 'Décédé') liberer(c)
  }
  recomputeArmy(state, p, armee)
  if (liberes.length > 0) {
    state.log.push({
      turn: state.turn, type: 'Armée', joueur: p.n,
      texte: `🕊 Fin de service — ${armee.nom} : ${liberes.length} soldat(s) libéré(s) comme Chasseur(s) (${liberes.join(', ')}). Puissance restante : ${Math.round(armee.puissance)}.`,
    })
  }
  return liberes
}

/** Prix de levée d'une armée : Or facturés pour sa puissance CIBLE,
 *  1 Or tous les 2 points de force (paramétrable via armeePrixOr /
 *  armeePriXPuissance). Payé UNE FOIS à la levée — pas d'entretien.
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
