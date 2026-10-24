// ══════════════════════════════════════════════════════════════════════
//  Bâtiments — accès via la config.
//  (Les événements et cartes dynastie qui vivaient ici ont été
//  retirés le 2026-10-24 avec les tables events/dynasties du
//  référentiel, retour arbitre Thibaut.)
// ══════════════════════════════════════════════════════════════════════

import { DEFAULT_CONFIG, type GameConfig, type BuildingDef } from '../config/defaultConfig'

import type { Cfg } from '../config/defaultConfig'
export type { Cfg }


/** Définition moteur (santé / écoles) d'un bâtiment — vue `batiments`
 *  dérivée de la table canonique `constructions` (retour Thibaut
 *  2026-10-23, retrait des tables legacy). Le classeur mélange les
 *  orthographes (« École » / « Ecole ») : appariement d'abord EXACT,
 *  puis insensible aux accents — les vieilles parties ne perdent ni
 *  leurs écoles ni leurs bonus de santé. */
export function buildingDef(nom: string, cfg?: GameConfig): BuildingDef | undefined {
  const liste = (cfg ?? DEFAULT_CONFIG).batiments
  const sansAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return liste.find((b) => b.nom === nom)
    ?? liste.find((b) => sansAccents(b.nom) === sansAccents(nom))
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

// (RETRAIT 2026-10-24, retour arbitre « supprimer les conditions de
//  victoire » : VICTORY_TEXT — textes des Lauriers IV du chapitre XII —
//  est supprimé, ainsi que les textes de conditions/bonus de la table
//  `victoires` du référentiel (Lauriers VIDÉS). La STRUCTURE reste :
//  6 voies × 4 Lauriers à cocher sur l'accueil, ordre strict, crise à
//  chaque Laurier I-III, radar — nouvelles conditions à arbitrer.
//  L'ancien contenu reste dans l'historique git (règle 9).)
