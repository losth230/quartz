// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — découpage de ConfigTables.tsx.
//  Contrat commun des tables paramétrables (props config + mutateur
//  setCfg) et options de groupe des bâtiments. Sans dépendance React.
// ══════════════════════════════════════════════════════════════════════

import type { GameConfig } from '../../config/defaultConfig'

export interface TableProps {
  config: GameConfig
  setCfg: (fn: (c: GameConfig) => void) => void
}

export const GROUPES_BAT: { value: string; label: string }[] = [
  { value: 'Ville', label: 'Ville' },
  { value: 'Château', label: 'Château' },
  { value: 'Capitale', label: 'Capitale' },
]
