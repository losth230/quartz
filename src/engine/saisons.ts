// ══════════════════════════════════════════════════════════════════════
//  SAISONS (FinDeTour, étape 1)
//  Sélection de la saison (Été / Hiver alternés tous les saisonLongueur tours).
//  Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
//
//  HISTORIQUE (règle 9 — mémoire des arbitrages) : ce module portait
//  aussi les événements de saison (applyEventEffect, table eventEffets,
//  params evMult*/dangerSeuil*, champ state.modDanger) et les cartes
//  dynastie (applyDynastieCard, table dynastieEffets). Les deux
//  systèmes ont été RETIRÉS le 2026-10-24 (retour arbitre Thibaut) :
//  tables events/dynasties supprimées du référentiel, étapes 1-2 de
//  runTurn simplifiées (la saison change sans tirage). L'ancien
//  contenu reste dans l'historique git et le journal technique.
// ══════════════════════════════════════════════════════════════════════

import { cfgOf, type Cfg } from './gameData'

export function saisonForTurn(turn: number, C: Cfg = cfgOf()): 'Été' | 'Hiver' {
  // Retour Thibaut (revue 2026-10-15) : l'Été initial dure les tours
  //  1 à saisonLongueur, l'Hiver commence au tour saisonLongueur+1
  //  (avant : floor(turn/L) démarrait l'Hiver au tour 3 avec L=3).
  return Math.floor(Math.max(0, turn - 1) / Math.max(1, C.p.saisonLongueur)) % 2 === 0 ? 'Été' : 'Hiver'
}
