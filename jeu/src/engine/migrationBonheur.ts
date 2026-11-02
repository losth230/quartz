// ══════════════════════════════════════════════════════════════════════
//  MIGRATION PAR BONHEUR (arbitrage Thibaut 2026-10-28)
//
//  « Un flux de migration en fonction du bonheur : plus le bonheur
//    est bas, plus un habitant a de chances de quitter sa ville,
//    pour une autre ville aléatoire, pondérée par la culture
//    similaire et le bonheur de chacune des villes. »
//
//  Arbitrages actés (2026-10-28) :
//   · PROBA DE DÉPART — LINÉAIRE, retour explicite Thibaut : « entre
//     0 % et 10 %, le 10 % étant à 0 de bonheur et le 0 % à 100 » —
//       p = migrationBonheurMax × (100 − bonheur) / 100
//     soit à défauts (0,10) : 0 % à 100 de bonheur, 5 % à 50,
//     10 % à 0. Un tirage PAR HABITANT vivant, à chaque fin de tour.
//   · DESTINATIONS — TOUTES les villes du monde, tous joueurs : un
//     habitant change de joueur au besoin (transfert physique de
//     son tableau de population, même principe que l'ancienne
//     migration scolaire retirée le 2026-10-28 ; les cités libres
//     ne sont PAS destinations — « toutes les villes du monde »
//     s'entend des villes des joueurs).
//   · QUI PART — tous les VIVANTS sauf Dirigeant et Héritier
//     (règle établie 2026-10-21 : ils ne déménagent jamais —
//     neDemenageJamais, cf. shared.ts) ET les soldats/commandants
//     en armée (c.armee — l'armée LIE l'habitant, arbitrage du
//     2026-10-28 « l'armée est liée à la population »).
//   · FOYER COMPLET (amendement du jour, 4e retour arbitre :
//     « lorsqu'un personnage déménage, il déménage avec son/sa
//     conjoint.e et leurs enfants non mariés » — étend l'amendement
//     « couples inséparables » du 2e retour, motivé par la CI rouge
//     du flux v1 : le tirage individuel séparait des couples entre
//     porteurs) : un départ emporte le conjoint de la MÊME VILLE et
//     leurs ENFANTS NON MARIÉS de la ville (un enfant = mereId/pereId
//     d'un membre du couple, sans mariageId — un enfant marié a son
//     propre foyer et reste) ; si le conjoint est ancré
//     (Dirigeant/Héritier/en armée), le foyer NE PART PAS ; si le
//     conjoint est absent de la ville (défunt ou domicilié
//     ailleurs), l'habitant part avec ses enfants non mariés ; un
//     enfant ancré (ex. Héritier, soldat) RESTE — il ne déménage
//     jamais (règle 2026-10-21) et n'entrave pas le départ du
//     reste du foyer. Un enfant éligible garde aussi son propre
//     tirage : parti seul (sans conjoint ni enfants), il est déjà
//     « déplacé » quand le tour des parents vient.
//   · CULTURES recalculées en fin de flux (updateCityCultures) :
//     les arrivées peuvent renverser la majorité — l'invariant
//     « ville.culture = majorité des vivants » (populationTurn
//     étape 3.6) doit tenir aussi après le flux.
//   · PONDÉRATION (pas filtrage) du tirage de destination — v2
//     (retour Thibaut, 3e arbitrage du jour) :
//       poids = (ville du MÊME JOUEUR ? migrationBonheurMemeJoueur : 1)
//               × (culture identique ? migrationBonheurCulture : 1)
//               × (1 + bonheur de la ville candidate / 100)
//     une ville du même joueur pèse 1,5× (défaut), une ville de SA
//     culture 1,25× (défaut — le ×4 du matin est REMPLACÉ), une ville
//     à 100 de bonheur 2× une ville à 0 — les trois effets se
//     multiplient.
//     AMENDEMENT v3 (6e arbitrage du flux, 2026-10-29 : « la formule
//     se base sur le bonheur et tous les autres modificateurs sont
//     additifs ») : poids = attrait × (1 + même joueur + culture +
//     bonus additifs du tiré) — l'attrait = 1 + bonheur/100 reste la
//     seule base multiplicative ×[1 ; 2] ; défauts +0,5 même joueur,
//     +0,25 culture, +1 emploi/logement pour qui manque (exemple
//     arbitre : culture + même joueur = attrait × 1,75). Le
//     multiplicatif v2 ci-dessus est REMPLACÉ (historisé).
//   · RETOUR POSSIBLE : un personnage peut migrer vers une ville
//     d'où il VIENT (retour Thibaut explicite : « ce n'est pas un
//     bug ») — aucune ville n'est interdite pour ses anciennes
//     résidences ; la seule exclue du tirage est la ville SOURCE
//     courante (par identité).
//   · CONSÉQUENCES — convention établie de tout changement de
//     résidence : perteDemenagement (métier ET domicile perdus,
//     retour Sans-emploi jusqu'à la réaffectation du tour suivant) ;
//     entrée de journal type « Système » avec le motif « cherche
//     meilleure vie ».
//   · PLACEMENT — étape 4bis du tour, APRÈS tous les moteurs de
//     population (étape 4) : un migrant n'est PAS retraité au même
//     tour (vieillissement, maladie, fécondité) chez son nouveau
//     porteur — l'ancienne migration scolaire vivait DANS
//     populationTurn et cumulait ces effets sur les migrants
//     inter-joueurs.
//   · Pas de plafond par ville (retour Thibaut : linéaire 0-10 %,
//     sans cap) ; un habitant ne migre qu'UNE fois par tour
//     (ensemble des déplacés de l'appel).
//   · FACTEURS EMPLOI & LOGEMENT (5e arbitrage, 2026-10-29 : « un
//     habitant sans métier qui migre a davantage d'intérêt à
//     rejoindre une ville avec des emplois disponibles, idem pour
//     le logement ») : le poids d'une candidate est multiplié par
//     migrationBonheurEmploi (défaut 1,5) si le TIRÉ est sans
//     métier et que la ville a des postes non pourvus
//     (offres > adultes en poste), et par
//     migrationBonheurLogement (défaut 1,5) s'il est sans
//     domicile et que la ville a des lits libres
//     (logements > vivants) — les deux se multiplient avec les
//     facteurs v2. Le statut regardé est celui du tiré AVANT
//     départ (à l'arrivée, perteDemenagement laisse TOUS les
//     migrants sans métier ni domicile) ; le foyer suit le statut
//     de son chef, sans influer sur le tirage.
//     AMENDEMENT v3 (6e arbitrage, 2026-10-29) : les facteurs
//     emploi/logement deviennent ADDITIFS — défaut +1 chacun (« on
//     peut mettre facteur emploi et facteur logement à ×2 » : la
//     ville pèse ×2 pour qui manque) ; le multiplicatif ×1,5 du 5e
//     arbitrage est REMPLACÉ (historisé) et les bonus S'ADDITIONNENT
//     aux modificateurs joueur/culture au lieu de se multiplier.
// ══════════════════════════════════════════════════════════════════════

import type { Character, City, GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf, regimeDef, type Cfg } from './gameData'
import { fullName, neDemenageJamais, perteDemenagement } from './shared'
import { bonheurVilleComplete, emploisOffertsVille, logementsVille } from './bonheur'
import { updateCityCultures } from './culture'

/** Probabilité qu'un habitant quitte sa ville : LINÉAIRE en bonheur
 *  (arbitrage Thibaut 2026-10-28 : 0 % à 100, max à 0). Pure. */
export function probaDepartBonheur(bonheur: number, C: Cfg): number {
  return Math.max(0, (C.p.migrationBonheurMax * (100 - bonheur)) / 100)
}

/** (Refonte « 8 lois » des régimes, 2026-10-29, Autoritarisme
 *  « Frontières closes ») : multiplicateur des probabilités de
 *  DÉPART des habitants d'un joueur — 0,8 = 20 % de chances de
 *  moins de partir (arbitrage Thibaut : MULTIPLICATIF). Pure. */
export function multDepartRegime(p: Player, C: Cfg): number {
  return regimeDef(p.regime, C.config)?.departHabitantsMult ?? 1
}

/** Poids d'attraction d'une ville candidate pour un migrant — v3
 *  ADDITIVE (6e arbitrage Thibaut 2026-10-29 : « la formule se
 *  base sur le bonheur et tous les autres modificateurs sont
 *  additifs ») : poids = attrait × (1 + même joueur + culture +
 *  bonusAdditifs du tiré). L'attrait = 1 + bonheur/100, ×[1 ; 2],
 *  reste la seule base multiplicative ; défauts +0,5 même joueur,
 *  +0,25 culture, bonus emploi/logement +1 pour qui manque (le
 *  multiplicatif v2 ×1,5 ×1,25 ×attrait est REMPLACÉ — exemple
 *  arbitre : culture + même joueur = attrait × 1,75). Pure. */
export function poidsDestination(
  c: Character, ville: City, bonheur: number, C: Cfg,
  memeJoueur = false, bonusAdditifs = 0,
): number {
  const attrait = 1 + bonheur / 100
  const joueur = memeJoueur ? C.p.migrationBonheurMemeJoueur : 0
  const culture = (ville.culture ?? '') === c.culture ? C.p.migrationBonheurCulture : 0
  return attrait * (1 + joueur + culture + bonusAdditifs)
}

/** Bonus ADDITIF d'EMPLOI du tirage de destination (v3, 6e
 *  arbitrage Thibaut 2026-10-29) : un migrant SANS MÉTIER porte
 *  la candidate aux postes non pourvus à +migrationBonheurEmploi
 *  (défaut +1 : la ville pèse ×2 pour un chômeur — le
 *  multiplicatif ×1,5 du 5e arbitrage est REMPLACÉ). Renvoie 0
 *  quand le bonus ne parle pas. Pure. */
export function facteurEmploi(sansMetier: boolean, emploisLibres: boolean, C: Cfg): number {
  return sansMetier && emploisLibres ? C.p.migrationBonheurEmploi : 0
}

/** Bonus ADDITIF de LOGEMENT du tirage de destination (v3, 6e
 *  arbitrage Thibaut 2026-10-29) : un migrant SANS DOMICILE porte
 *  la candidate aux lits libres à +migrationBonheurLogement
 *  (défaut +1 : la ville pèse ×2 pour un sans-logement — le
 *  multiplicatif ×1,5 du 5e arbitrage est REMPLACÉ). Renvoie 0
 *  quand le bonus ne parle pas. Pure. */
export function facteurLogement(sansDomicile: boolean, logementsLibres: boolean, C: Cfg): number {
  return sansDomicile && logementsLibres ? C.p.migrationBonheurLogement : 0
}

/** Fiche d'une ville du monde pour le tirage — photographiée UNE
 *  fois par ville et par tour. Les disponibilités (5e arbitrage
 *  2026-10-29) sont figées au début du flux : les postes et lits
 *  ne sont crédités que par populationTurn et les constructions,
 *  jamais par le flux lui-même. */
interface FicheVille {
  joueur: Player
  ville: City
  bonheur: number
  /** La ville offre plus de postes qu'elle n'a d'adultes en poste. */
  emploisLibres: boolean
  /** La ville a plus de lits que d'habitants vivants. */
  logementsLibres: boolean
}

/** Flux de migration par bonheur — étape 4bis du tour (tour.ts).
 *  Parcourt les villes de chaque joueur, calcule le bonheur UNE fois
 *  par ville et par tour, tire chaque habitant éligible au départ,
 *  puis la destination pondérée parmi toutes les autres villes du
 *  monde (fiche source exclue par IDENTITÉ, pas par nom : plusieurs
 *  joueurs peuvent avoir une ville homonyme, ex. « Capitale »). */
export function migrationBonheur(state: GameState, rng: Rng): void {
  const C = cfgOf(state.config)
  const fiches: FicheVille[] = state.players.flatMap((p) =>
    p.villes.map((v) => {
      // Disponibilités photographiées ici (5e arbitrage 2026-10-29) :
      //  postes non pourvus = postes offerts − adultes en poste ;
      //  lits libres = stock de logements − vivants. Les arrivées
      //  du flux n'occupent ni poste ni lit (les migrants arrivent
      //  sans métier ni domicile, réaffectés au tour suivant).
      const vivants = (state.population[p.n] ?? []).filter(
        (c) => c.statut !== 'Décédé' && c.ville === v.nom,
      )
      const enPoste = vivants.filter((c) => c.metier && c.age >= C.p.adultAge).length
      return {
        joueur: p, ville: v,
        bonheur: bonheurVilleComplete(state, p, v, C),
        emploisLibres: emploisOffertsVille(state, p, v, C) > enPoste,
        logementsLibres: logementsVille(v, C, state) > vivants.length,
      }
    }),
  )
  // Une seule ville au monde : nulle part où aller.
  if (fiches.length < 2) return
  /** ids déjà déplacés CET appel (pas de double migration). */
  const deplaces = new Set<string>()

  for (const p of state.players) {
    // Habitants éligibles par ville — PHOTO AVANT tout déplacement :
    //  les migrants arrivés chez p au fil de l'appel ne sont pas
    //  re-tirés (même garantie que l'ancienne migration scolaire).
    const parVille = new Map<string, Character[]>()
    /** Vivants de la ville, ancrés inclus — le conjoint ancré d'un
     *  marié y figure : le foyer ne doit pas partir sans lui. */
    const parVilleTous = new Map<string, Character[]>()
    for (const c of state.population[p.n] ?? []) {
      if (c.statut === 'Décédé') continue
      const lt = parVilleTous.get(c.ville)
      if (lt) lt.push(c)
      else parVilleTous.set(c.ville, [c])
      if (neDemenageJamais(c, C) || c.armee) continue
      const l = parVille.get(c.ville)
      if (l) l.push(c)
      else parVille.set(c.ville, [c])
    }
    for (const v of p.villes) {
      const habitants = parVille.get(v.nom)
      if (!habitants || habitants.length === 0) continue
      const src = fiches.find((f) => f.joueur.n === p.n && f.ville.nom === v.nom)
      if (!src) continue
      const candidats = fiches.filter((f) => f !== src)
      for (const c of [...habitants]) {
        if (deplaces.has(c.id)) continue
        // FOYER COMPLET : le départ emporte le conjoint de la MÊME
        //  VILLE et leurs enfants NON MARIÉS de la ville ; conjoint
        //  ancré → le foyer reste.
        let conj: Character | undefined
        if (c.mariageId) {
          conj = (parVilleTous.get(v.nom) ?? []).find((x) => x.id === c.mariageId)
          if (conj && (neDemenageJamais(conj, C) || conj.armee)) continue
        }
        // Enfants du foyer : mereId/pereId d'un membre du couple, non
        //  mariés, vivants, de la même ville. Les ancrés (Héritier,
        //  soldat…) RESTENT — ils ne déménagent jamais et
        //  n'entravent pas le départ du reste du foyer.
        const idsFoyer = new Set<string>([c.id, ...(conj ? [conj.id] : [])])
        const enfantsFoyer = (parVilleTous.get(v.nom) ?? []).filter((e) =>
          !e.mariageId && !deplaces.has(e.id) && !neDemenageJamais(e, C) && !e.armee &&
          (idsFoyer.has(e.mereId ?? '') || idsFoyer.has(e.pereId ?? '')))
        // (Refonte « 8 lois » des régimes, 2026-10-29,
        //  Autoritarisme « Frontières closes ») : probabilité de
        //  départ × departHabitantsMult (0,8 = 20 % de chances de
        //  moins de partir).
        if (!rng.chance(probaDepartBonheur(src.bonheur, C) * multDepartRegime(p, C))) continue
        // Bonus emploi & logement (v3 ADDITIVE, 6e arbitrage
        //  2026-10-29) : S'ADDITIONNENT dans la parenthèse sur la
        //  base d'attrait du bonheur — le statut regardé est celui
        //  du TIRÉ avant départ, le foyer (conjoint, enfants) suit
        //  sans influer.
        const dest = rng.pickWeighted(candidats, (f) =>
          poidsDestination(c, f.ville, f.bonheur, C, f.joueur.n === p.n,
            facteurEmploi(!c.metier, f.emploisLibres, C)
            + facteurLogement(!c.domicile, f.logementsLibres, C)))
        // Transfert physique du FOYER chez le porteur de la ville de
        //  destination (principe conservé de l'ancienne migration
        //  scolaire) — conjoint et enfants suivent sans tirage propre.
        const foyer = [c, ...(conj ? [conj] : []), ...enfantsFoyer]
        for (const m of foyer) {
          if (dest.joueur.n !== p.n) {
            const src2 = state.population[p.n] ?? []
            const i = src2.indexOf(m)
            if (i >= 0) src2.splice(i, 1)
            const dst = state.population[dest.joueur.n] ?? (state.population[dest.joueur.n] = [])
            dst.push(m)
          }
          const avant = m.ville
          m.ville = dest.ville.nom
          perteDemenagement(m, C)
          deplaces.add(m.id)
          const chez = dest.joueur.n === p.n ? '' : ` chez ${dest.joueur.nom}`
          const verbe = m === c ? 'quitte' : `suit ${fullName(c)} — quitte`
          state.log.push({
            turn: state.turn + 1, type: 'Système', joueur: p.n,
            texte: `${fullName(m)} ${verbe} ${avant} pour ${dest.ville.nom}${chez} (bonheur ${src.bonheur}/100 — cherche meilleure vie).`,
          })
        }
        // (Refonte « 8 lois » des régimes, 2026-10-29, Socialisme
        //  « Terre d'accueil ») : le joueur destinataire reçoit +N
        //  Or par MIGRANT ARRIVANT dans une de ses villes — le foyer
        //  ENTIER compte (conjoint, enfants), déménagements
        //  INTERNES inclus (arbitrage Thibaut : la loi récompense
        //  l'ARRIVÉE, pas le franchissement d'une frontière).
        const orParMig = regimeDef(dest.joueur.regime, C.config)?.orParMigrant ?? 0
        if (orParMig > 0) {
          for (const m of foyer) {
            const rs = dest.joueur.resources['Or']
            if (rs) rs.stock += orParMig
            state.log.push({
              turn: state.turn + 1, type: 'Système', joueur: dest.joueur.n,
              texte: `🌍 Terre d'accueil — ${dest.joueur.nom} reçoit ${orParMig} Or (1 migrant(s) arrivé(s) : ${fullName(m)}).`,
            })
          }
        }
      }
    }
  }

  // Cultures des villes recalculées : les arrivées peuvent renverser
  //  la majorité — l'invariant « ville.culture = majorité des vivants »
  //  (populationTurn étape 3.6) doit tenir aussi après le flux.
  for (const p of state.players) updateCityCultures(state, p)
}
