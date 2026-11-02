// ══════════════════════════════════════════════════════════════════════
//  GÉOGRAPHIE — module FEUILLE (vague 2, dé-cyclage du cluster moteur)
//  villeCotiere : propriété pure de proximité (Rivière/Mer). Extraite
//  de villes.ts car economie ET metiers la consomment : l'anneau
//  regimes→economie→metiers→villes→regimes est cassé par cette arête.
//  villes.ts ré-exporte le symbole (compat façade/UI).
// ══════════════════════════════════════════════════════════════════════

import type { City } from './types'

/** Ville « côtière » — arbitrage Thibaut 2026-10-22 : TOUTE
 *  proximité autre que « Plaine » (ou absente). Vague 2,
 *  arbitrage Ponton→proximité (2026-10-23) : le Ponton ne dépend
 *  plus d'une liste énumérée de proximités mais du CANAL
 *  proximité — une future proximité (Colline, Montagne…)
 *  comptera comme côtière SANS toucher au code. Utilisé par le
 *  Ponton : ses emplacements de Pêcheur et le bonus +0,5
 *  Bétail/tour par Pêcheur ne comptent QUE dans une ville
 *  côtière ; hors proximité, le bâtiment reste affiché mais
 *  n'a aucun effet moteur. */
export function villeCotiere(ville: City): boolean {
  return ville.proximite != null && ville.proximite !== 'Plaine'
}
