// ══════════════════════════════════════════════════════════════════════
//  TABLES PARAMÉTRABLES (marqueur (s)) — éditeurs déplacés depuis la
//  page « Référentiels » : TOUT ce qui est éditable vit désormais dans
//  l'onglet « 🎛 Paramètres ». La page « Référentiels » devient un wiki
//  de règles EN LECTURE SEULE qui affiche ces valeurs.
//
//  VAGUE QUALITÉ (2026-10-24) : le contenu des tables vit désormais dans
//  src/components/params/ (un fichier par table, éditeurs d'effets
//  séparés, docblocks d'arbitrage déplacés avec leur code). Ce fichier
//  reste le POINT D'ENTRÉE public : il ré-exporte l'API d'origine à
//  l'identique (aucun consommateur à re-câbler).
// ══════════════════════════════════════════════════════════════════════

export type { TableProps } from './params/logiqueParams'
// (RETRAIT 2026-10-24 : EffetsTechEditor — éditeur des « effets » des
//  techs de progrès — supprimé avec le système de progrès.)
export { EffetsConstructionEditor } from './params/EditeursEffets'
export { BatimentsParams, AmenagementsParams } from './params/ConstructionsParams'
export { PaysRangsParams, HabitationsParams, DomicilesParams } from './params/PaysHabitationsParams'
export { CouleursParams } from './params/CouleursParams'
