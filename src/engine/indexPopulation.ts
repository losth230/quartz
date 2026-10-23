// ══════════════════════════════════════════════════════════════════════
//  INDEX DE POPULATION MONDE (module bas, vague 2 SOLID — arbitrage
//  Thibaut 2026-10-23 « tout dans la vague 2 ») : extrait de naissances
//  pour casser les cycles naissances<->sante et metiers->naissances.
//  Optimisation 2026-10-16 : carte id -> personnage vivant,
//  reconstruite UNE fois par tour (invalidée à chaque appel pour rester
//  correcte après migrations, mariages et naissances — mais construite
//  en O(N) au lieu d'être rescannée en O(N) PAR APPEL). Les 16 000+
//  personnages de fin de partie rendaient computeFecondite
//  quadratique (≈ 3,5 s/tour).
// ══════════════════════════════════════════════════════════════════════

import type { Character, GameState } from './types'

let cacheIndexPop: { state: object; index: Map<string, Character> } | null = null

/** Index id -> personnage VIVANT (joueurs + cités libres), caché par
 *  référence d'état. */
export function indexPopulationMonde(state: GameState): Map<string, Character> {
  if (cacheIndexPop && cacheIndexPop.state === state) return cacheIndexPop.index
  // M1 (2026-10-19) : index par ID (l'identité démographique n'est plus
  //  le nom complet — collisions possibles à 16 000 habitants).
  const index = new Map<string, Character>()
  for (const liste of Object.values(state.population ?? {})) {
    for (const c of liste ?? []) {
      if (c.statut !== 'Décédé') index.set(c.id, c)
    }
  }
  for (const cite of state.citesLibres ?? []) {
    for (const c of cite.population ?? []) {
      if (c.statut !== 'Décédé') index.set(c.id, c)
    }
  }
  cacheIndexPop = { state, index }
  return index
}

/** Invalide l'index (mariage, migration, naissance, mort : l'état
 *  change). Coût O(1). */
export function invaliderIndexPopulation(): void {
  cacheIndexPop = null
}
