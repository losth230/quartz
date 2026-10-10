// ══════════════════════════════════════════════════════════════════════
//  Bâtiments, événements, cartes dynastie — accès via la config.
// ══════════════════════════════════════════════════════════════════════

import { DEFAULT_CONFIG, type GameConfig, type BuildingDef, type EventDef, type DynastieDef } from '../config/defaultConfig'

export type { BuildingDef, EventDef, DynastieDef }
import type { Cfg } from '../config/defaultConfig'
export type { Cfg }

export const BUILDINGS: BuildingDef[] = DEFAULT_CONFIG.batiments
export const EVENTS: EventDef[] = DEFAULT_CONFIG.events
export const DYNASTIES: DynastieDef[] = DEFAULT_CONFIG.dynasties

export function buildingDef(nom: string, cfg?: GameConfig): BuildingDef | undefined {
  return (cfg ?? DEFAULT_CONFIG).batiments.find((b) => b.nom === nom)
}

/** Rang d'école le plus élevé d'une ville (0 = aucune école). */
export function schoolRankOf(batiments: string[], cfg?: GameConfig): number {
  let rank = 0
  for (const b of batiments) {
    const def = buildingDef(b, cfg)
    if (def && def.ecoleRang > rank) rank = def.ecoleRang
  }
  return rank
}

// Conditions de victoire (texte de référence, chapitre XII du livret)
export const VICTORY_TEXT: { nom: string; texte: string }[] = [
  { nom: 'Militaire', texte: 'Capturer un total de 5 habitations (rang IV de la voie Militaire).' },
  { nom: 'Économique', texte: 'Posséder 5 Guildes (rang IV de la voie Économique).' },
  { nom: 'Culturelle', texte: 'Posséder 360 Tourisme et 5 Merveilles (rang IV de la voie Culturelle).' },
  { nom: 'Scientifique', texte: 'Terminer le Progrès Futur (rang IV de la voie Scientifique).' },
  { nom: 'Démographique', texte: 'Posséder une population totale de 1500 habitants (rang IV de la voie Démographique).' },
  { nom: 'Diplomatique', texte: 'Être suzerain de 3 cités libres (rang IV de la voie Diplomatique).' },
]
