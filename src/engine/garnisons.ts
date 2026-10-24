// ══════════════════════════════════════════════════════════════════════
//  GARNISON DES HABITATIONS D'UNE VILLE (vague 2, dé-cyclage par arête)
//  Valeur d'état (jamais un flux). Extraite de regimes.ts (historique :
//  pour que progresAuto.ts puisse l'injecter comme PORT garnisonVille —
//  les technologies ont été supprimées du jeu le 2026-10-24, retour
//  arbitre). Dépendances : batiments + rangs, JAMAIS regimes.
//  regimes.ts ré-exporte le symbole : façade/UI/mocks
//  inchangés (compat arrière).
// ══════════════════════════════════════════════════════════════════════

import type { City, GameState, Player } from './types'
import { type Cfg } from './gameData'
import { garnisonBatiment } from './batiments'
import { rangNiveau } from './rangs'

/** Garnison des habitations d'une ville : garnisons statiques des
 *  bâtiments, bonus de la loi du régime (ex. Autoritarisme : +
 *  garnisonParRang × niveau du rang d'habitation), bonus de la
 *  règle de faction active (engine/factions.ts — état du jeu requis
 *  en 4e argument) et Gardes en poste (vague 3a, arbitrage « les
 *  Gardes font tout » — la garnison de BASE des rangs est supprimée).
 *  (RETRAIT 2026-10-24 : garnisons des technologies de progrès
 *  débloquées — supprimées avec le système de progrès.)
 *  Valeur d'état (pas un flux) : affichée sous la culture de chaque
 *  ville (page « Pays ») et du pays (page « Royaume »). */
export function garnisonHabitationVille(p: Player, ville: City, C: Cfg, state?: GameState): number {
  let g = 0
  for (const b of ville.batiments) g += garnisonBatiment(b, C, ville.type)
  // Garde (vague 3a, rework métiers & emplacements, arbitrage
  //  2026-10-21) : +garnisonParGarde Garnison STATIQUE par Garde en
  //  poste dans la ville — valeur d'ÉTAT, jamais un flux par tour
  //  (« la Garnison n'est jamais par tour ») : le bonus disparaît de
  //  lui-même si le Garde part, est renvoyé ou meurt.
  if (state) {
    const pop = state.population[p.n] ?? []
    g += C.p.garnisonParGarde * pop.filter(
      (c) => c.statut !== 'Décédé' && c.ville === ville.nom && c.metier === C.p.metierGarde,
    ).length
  }
  // (RETRAIT 2026-10-24 : plus de garnison des technologies — système
  //  de progrès supprimé, retour arbitre.)
  const regime = C.regimes.find((r) => r.nom === p.regime)
  const bonus = regime?.garnisonParRang ?? 0
  if (bonus) g += bonus * rangNiveau(ville, C)
  // (RETRAIT 2026-10-24 : le plancher « Combler les lacunes » des
  //  technologies n'existe plus — système de progrès supprimé.)
  return g
}
