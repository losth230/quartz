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
// ══════════════════════════════════════════════════════════════════════

import type { Character, City, GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf, type Cfg } from './gameData'
import { fullName, neDemenageJamais, perteDemenagement } from './shared'
import { bonheurVilleComplete } from './bonheur'
import { updateCityCultures } from './culture'

/** Probabilité qu'un habitant quitte sa ville : LINÉAIRE en bonheur
 *  (arbitrage Thibaut 2026-10-28 : 0 % à 100, max à 0). Pure. */
export function probaDepartBonheur(bonheur: number, C: Cfg): number {
  return Math.max(0, (C.p.migrationBonheurMax * (100 - bonheur)) / 100)
}

/** Poids d'attraction d'une ville candidate pour un migrant :
 *  ville du même joueur ×1,5, culture identique ×1,25, bonheur
 *  ×(1 + b/100) — les trois effets se multiplient (v2, retour
 *  Thibaut du jour ; le culture ×4 du matin est REMPLACÉ). Pure. */
export function poidsDestination(
  c: Character, ville: City, bonheur: number, C: Cfg, memeJoueur = false,
): number {
  const joueur = memeJoueur ? C.p.migrationBonheurMemeJoueur : 1
  const culture = (ville.culture ?? '') === c.culture ? C.p.migrationBonheurCulture : 1
  return joueur * culture * (1 + bonheur / 100)
}

/** Fiche d'une ville du monde pour le tirage. */
interface FicheVille { joueur: Player; ville: City; bonheur: number }

/** Flux de migration par bonheur — étape 4bis du tour (tour.ts).
 *  Parcourt les villes de chaque joueur, calcule le bonheur UNE fois
 *  par ville et par tour, tire chaque habitant éligible au départ,
 *  puis la destination pondérée parmi toutes les autres villes du
 *  monde (fiche source exclue par IDENTITÉ, pas par nom : plusieurs
 *  joueurs peuvent avoir une ville homonyme, ex. « Capitale »). */
export function migrationBonheur(state: GameState, rng: Rng): void {
  const C = cfgOf(state.config)
  const fiches: FicheVille[] = state.players.flatMap((p) =>
    p.villes.map((v) => ({ joueur: p, ville: v, bonheur: bonheurVilleComplete(state, p, v, C) })),
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
        if (!rng.chance(probaDepartBonheur(src.bonheur, C))) continue
        const dest = rng.pickWeighted(
          candidats, (f) => poidsDestination(c, f.ville, f.bonheur, C, f.joueur.n === p.n))
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
      }
    }
  }

  // Cultures des villes recalculées : les arrivées peuvent renverser
  //  la majorité — l'invariant « ville.culture = majorité des vivants »
  //  (populationTurn étape 3.6) doit tenir aussi après le flux.
  for (const p of state.players) updateCityCultures(state, p)
}
