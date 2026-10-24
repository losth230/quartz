// ═══════════════════════════════════════════════════════════════════════════
//  BONHEUR DES VILLES — 5 FACTEURS (design domiciles/bonheur 2026-10-24)
//
//  ARBITRAGES Thibaut FINAUX (2026-10-24, v3 — simulation scripts/sim-bonheur.ts) :
//   · EMPLOI, LOGEMENT, SÉCURITÉ : formule OPTIMUM symétrique —
//       100 seulement si l'offre ÉGALE exactement la demande
//       (manque ET excès pénalisent IDENTIQUEMENT : ±25 % → 75,
//       ×2 → 0) ;
//   · LOGEMENT : PAR HABITANT (1 logement = 1 habitant logé) ;
//   · SÉCURITÉ : cible = 100 × rang d'habitation (0 si nulle,
//       0 aussi à 2× la cible — optimum symétrique) ;
//   · SANTÉ : 100 − pourcentage de malades (linéaire) ;
//   · TOURISME : part du joueur dans le tourisme MONDIAL (plafonnée
//       à 100) — une course entre joueurs, pas une gestion seule ;
//   · BONHEUR DE LA VILLE : MOYENNE SIMPLE des 5 facteurs.
//
//  Le bonheur est CALCULÉ (fonction pure, aucun état stocké) : il se
//  lit à la demande de l'UI et des futures mécaniques (ascension
//  sociale, effets natalité/impôts — à arbitrer). Aucune écriture
//  dans GameState pour l'instant.
//
//  SIMULATIONS : scripts/sim-bonheur.ts (courbes + scénarios sur
//  partie réelle — sortie consignée dans docs/ia/journal-technique.md).
//
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ═══════════════════════════════════════════════════════════════════════════

import type { City, GameState, Player } from './types'
import { type Cfg } from './gameData'
import { garnisonHabitationVille } from './garnisons'
import { capMetierVille } from './metiers'
import { metiersDisponiblesRang } from './habitations'
import { rangNiveau, rangsDefsType, nomRang } from './rangs'
import { tourismeCourant } from './regimes'

// ── Formules pures (testées isolément) ───────────────────────────────

/** OPTIMUM SYMÉTRIQUE : 100 si offre = demande EXACTEMENT, malus
 *  relatif IDENTIQUE en manque et en excès (±25 % → 75, ×2 → 0).
 *  borné [0, 100]. Cas limites : demande ≤ 0 → 100 seulement si
 *  offre nulle aussi (une ville sans travailleurs n'a pas de
 *  demande d'emplois). */
export function scoreOptimum(offre: number, demande: number): number {
  if (demande <= 0) return offre <= 0 ? 100 : 0
  if (offre <= 0) return 0
  const malus = Math.abs(1 - offre / demande)
  return Math.max(0, Math.min(100, Math.round(100 * (1 - malus))))
}

/** SANTÉ : 100 − pourcentage de malades (linéaire, arbitrage v3). */
export function scoreSante(malades: number, habitants: number): number {
  if (habitants <= 0) return 100
  return Math.max(0, Math.min(100, Math.round(100 - (100 * malades) / habitants)))
}

/** TOURISME : part du joueur dans le tourisme MONDIAL (arbitrage v3)
 *  — plafonnée à 100. Mondial nul (personne ne produit) → 0 : sans
 *  course, pas de score. */
export function scoreTourisme(tourismeJoueur: number, tourismeMondial: number): number {
  if (tourismeMondial <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((100 * tourismeJoueur) / tourismeMondial)))
}

/** Les 5 scores d'une ville (tous bornés [0, 100]). */
export interface ScoresVille {
  emploi: number
  logement: number
  securite: number
  tourisme: number
  sante: number
}

/** Bonheur de la ville : MOYENNE SIMPLE des 5 facteurs
 *  (arbitrage v3 — pas de pondération). */
export function bonheurVille(s: ScoresVille): number {
  const v = [s.emploi, s.logement, s.securite, s.tourisme, s.sante]
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length)
}

// ── Données réelles d'une ville ─────────────────────────────────────

/** EMPLOI — offres : toutes les places de métiers plafonnées de la
 *  ville (caps du rang + emplacements des bâtiments, via la même
 *  source que l'affectation réelle) ; demande : les travailleurs
 *  (adultes vivants). Les postes POURVUS comptent double : un poste
 *  vacant est un excès d'offre, un travailleur sans poste un
 *  chômage — on prend le pire des deux écarts (formule simulée v3 :
 *  moyenne des deux scores, insensible à l'ordre). */
export function emploisOffertsVille(state: GameState, p: Player, ville: City, C: Cfg): number {
  let offres = 0
  for (const m of Object.keys(metiersDisponiblesRang(ville, C))) {
    const cap = capMetierVille(m, ville, C, { state, joueur: p } as never)
    if (Number.isFinite(cap)) offres += Math.floor(cap)
  }
  return offres
}

/** Logements d'une ville : les domiciles disponibles du rang
 *  (SIMULATION v3 : parsés du texte `domicilesDisponibles` du rang —
 *  « 50 maisons, 10 Auberge » → 60 ; la vague domiciles remplacera
 *  par la table structurée). 1 logement = 1 habitant logé. */
export function logementsVille(ville: City, C: Cfg): number {
  const def = rangsDefsType(ville.type ?? 'Ville', C).find(
    (d) => nomRang(d.rang).toLowerCase() === nomRang(ville.rang ?? 'Hameau').toLowerCase(),
  )
  const txt = def?.domicilesDisponibles ?? ''
  let total = 0
  for (const part of txt.split(',')) {
    const m = part.trim().match(/^(\d+)\s/)
    if (m) total += Number(m[1])
  }
  return total
}

// ── Scores d'une ville réelle ────────────────────────────────────────

export function scoresVille(state: GameState, p: Player, ville: City, C: Cfg): ScoresVille {
  const pop = (state.population[p.n] ?? []).filter(
    (c) => c.statut !== 'Décédé' && c.ville === ville.nom,
  )
  const habitants = pop.length
  const travailleurs = pop.filter((c) => c.age >= C.p.adultAge).length
  const enPoste = pop.filter((c) => c.metier).length
  const malades = pop.filter((c) => c.statut === 'Malade').length

  // EMPLOI : moyenne des deux écarts (structure + pourvu)
  const offres = emploisOffertsVille(state, p, ville, C)
  const structure = scoreOptimum(offres, travailleurs)
  const pourvu = scoreOptimum(enPoste, travailleurs)
  const emploi = Math.round((structure + pourvu) / 2)

  // LOGEMENT : par habitant (arbitrage v3)
  const logement = scoreOptimum(logementsVille(ville, C), habitants)

  // SÉCURITÉ : cible 100 × rang (arbitrage v3)
  const securite = scoreOptimum(garnisonHabitationVille(p, ville, C, state), 100 * rangNiveau(ville, C))

  // TOURISME : part du joueur dans le mondial (arbitrage v3) — le
  //  Tourisme est une course entre joueurs, calculée par ville sur
  //  la production du joueur (mêmes canaux que le récap).
  const tJoueur = tourismeCourant(state, p, C)
  const tMondial = state.players.reduce((acc, q) => acc + tourismeCourant(state, q, C), 0)
  const tourisme = scoreTourisme(tJoueur, tMondial)

  // SANTÉ : 100 − % malades
  const sante = scoreSante(malades, habitants)

  return { emploi, logement, securite, tourisme, sante }
}

/** Bonheur complet d'une ville (moyenne simple des 5 scores). */
export function bonheurVilleComplete(state: GameState, p: Player, ville: City, C: Cfg): number {
  return bonheurVille(scoresVille(state, p, ville, C))
}

/** Bonheur d'un joueur : moyenne des bonheurs de ses villes
 *  (affichage Dashboard — à brancher en vague UI). */
export function bonheurJoueur(state: GameState, p: Player, C: Cfg): number {
  if (p.villes.length === 0) return 0
  const total = p.villes.reduce((acc, v) => acc + bonheurVilleComplete(state, p, v, C), 0)
  return Math.round(total / p.villes.length)
}
