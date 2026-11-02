// ══════════════════════════════════════════════════════════════════════
//  INDEX DE POPULATION MONDE (module bas, vague 2 SOLID — arbitrage
//  Thibaut 2026-10-23 « tout dans la vague 2 ») : extrait de naissances
//  pour casser les cycles naissances<->sante et metiers->naissances.
//  Optimisation 2026-10-16 : carte id -> personnage vivant, construite
//  en O(N) au lieu d'être rescannée en O(N) PAR APPEL. Les 16 000+
//  personnages de fin de partie rendaient computeFecondite
//  quadratique (≈ 3,5 s/tour).
//  Vague scalabilité 2026-10-23 (CHIRURGICAL) : plus d'invalidation
//  systématique — chaque mort/naissance invalidait puis coûtait une
//  reconstruction O(N) à l'accès suivant (≈ 500 reconstructions/tour
//  à 16 000 habitants, ~19 % du temps de fin de tour). L'index mappe
//  id -> OBJET vivant : naissance = ajout O(1), décès = retrait O(1),
//  mariage = RIEN (les mutations de champs y sont visibles).
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

/** Invalide TOUT l'index (l'état change structurellement : migration
 *  entre joueurs, import, test). Coût O(1) — la prochaine lecture
 *  reconstruit en O(N). Le moteur n'en a plus besoin en fin de tour
 *  (vague scalabilité : morts et naissances sont chirurgicales). */
export function invaliderIndexPopulation(): void {
  cacheIndexPop = null
}

/** Ajout CHIRURGICAL d'un nouveau-né à l'index caché (vague
 *  scalabilité 2026-10-23) : O(1), au lieu d'invalider l'index et de
 *  le reconstruire en O(N) à l'accès suivant. No-op si l'index n'est
 *  pas caché pour cet état (la reconstruction part de l'état réel). */
export function ajouterALIndexPopulation(state: GameState, c: Character): void {
  if (cacheIndexPop && cacheIndexPop.state === state && c.statut !== 'Décédé') {
    cacheIndexPop.index.set(c.id, c)
  }
}

/** Retrait CHIRURGICAL d'un décédé de l'index caché (même motif).
 *  No-op si l'index n'est pas caché pour cet état. */
export function retirerDeLIndexPopulation(state: GameState, id: string): void {
  if (cacheIndexPop && cacheIndexPop.state === state) {
    cacheIndexPop.index.delete(id)
  }
}
