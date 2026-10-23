// ══════════════════════════════════════════════════════════════════════
//  TECHS DE PROGRÈS — PRIMITIVES BASSES (vague 2, dé-cyclage par arête)
//  aTech (résolution nom → clés via le REGISTRE) + garnison des techs
//  (lignes/garnisonProgresVille/garnisonMinimaleProgres). Extraits de
//  progresAuto.ts : garnisons.ts (garnisonHabitationVille) peut les
//  consommer SANS que progresAuto importe regimes (cycle réciproque
//  interdit — regimes importe déjà progresAuto pour fluxProgresJoueur).
//  progresAuto.ts ré-exporte ces symboles : compat façade/UI/tests.
// ══════════════════════════════════════════════════════════════════════

import type { City, Player } from './types'
import { type Cfg } from './gameData'
import { capitaleDe } from './factions'
import { clesTechsParNom } from '../rules/registry'

/** Le joueur a-t-il débloqué la tech portant ce NOM ? (les homonymes
 *  de plusieurs arbres matchent — la résolution nom → clés
 *  `<arbre>:<slot>` vit dans le REGISTRE, clesTechsParNom : une
 *  seule vérité entre moteur et banque, brûlage #3 source 3/3.) */
export function aTech(p: Player, nomTech: string, C: Cfg): boolean {
  const set = new Set(p.progresDebloques ?? [])
  return clesTechsParNom(C, nomTech).some((k) => set.has(k))
}

/** Garnison accordée par les techs débloquées à UNE ville
 *  (valeur d'état, intégrée à garnisonHabitationVille). */
export interface LigneGarnison { label: string; valeur: number }

export function garnisonProgresVille(p: Player, ville: City, C: Cfg): number {
  return lignesGarnisonProgresVille(p, ville, C).reduce((n, l) => n + l.valeur, 0)
}

/** Détail chiffré de la garnison des technologies d'une ville (une
 *  ligne par tech active — moteur et interface partagent le calcul). */
export function lignesGarnisonProgresVille(p: Player, ville: City, C: Cfg): LigneGarnison[] {
  const cap = capitaleDe(p)
  const estCap = cap?.nom === ville.nom
  const out: LigneGarnison[] = []
  if (aTech(p, 'Milices civiles I', C) && estCap) out.push({ label: 'Milices civiles I (capitale)', valeur: 30 })
  if (aTech(p, 'Fortifications solides', C)) out.push({ label: 'Fortifications solides', valeur: 15 })
  if (aTech(p, 'Milices civiles', C)) out.push({ label: 'Milices civiles (toutes habitations)', valeur: 30 })
  if (aTech(p, 'Muraille', C)) out.push({ label: 'Muraille', valeur: 40 })
  if (aTech(p, 'Progrès de la défense nationale A1', C)) out.push({ label: 'Défense nationale A1', valeur: 40 })
  if (aTech(p, 'Milices civiles III', C)) out.push({ label: 'Milices civiles III', valeur: 20 })
  if (aTech(p, 'Milices civiles V', C)) out.push({ label: 'Milices civiles V', valeur: 40 })
  if (aTech(p, 'Pr\u00e9 carr\u00e9', C)) out.push({ label: 'Pr\u00e9 carr\u00e9', valeur: 20 })
  if (aTech(p, 'Vasselit\u00e9', C) && p.vassalDe != null) out.push({ label: 'Vasselit\u00e9 (vassal)', valeur: 20 })
  return out
}

/** Garnison MINIMALE des habitations (retour Thibaut 2026-10-15) :
 *  « Combler les lacunes » — vos habitations ne peuvent avoir moins de
 *  30 Garnison. Retourne le plancher (0 si la tech n'est pas débloquée) ;
 *  garnisonHabitationVille prend le max. */
export function garnisonMinimaleProgres(p: Player, C: Cfg): number {
  return aTech(p, 'Combler les lacunes', C) ? 30 : 0
}
