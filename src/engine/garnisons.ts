// ══════════════════════════════════════════════════════════════════════
//  GARNISON DES HABITATIONS D'UNE VILLE (vague 2, dé-cyclage par arête)
//  Valeur d'état (jamais un flux). Extraite de regimes.ts pour que
//  progresAuto.ts puisse l'injecter comme PORT garnisonVille sans
//  importer regimes (qui importe déjà progresAuto — cycle réciproque
//  interdit). Dépendances : batiments + progresTech + rangs, JAMAIS
//  regimes. regimes.ts ré-exporte le symbole : façade/UI/mocks
//  inchangés (compat arrière).
// ══════════════════════════════════════════════════════════════════════

import type { City, GameState, Player } from './types'
import { type Cfg } from './gameData'
import { garnisonBatiment } from './batiments'
import { garnisonProgresVille, garnisonMinimaleProgres } from './progresTech'
import { rangNiveau } from './rangs'

/** Garnison des habitations d'une ville : garnisons statiques des
 *  bâtiments, bonus de la loi du régime (ex. Autoritarisme : +
 *  garnisonParRang × niveau du rang d'habitation), bonus de la
 *  règle de faction active (engine/factions.ts — état du jeu requis
 *  en 4e argument), Gardes en poste (vague 3a, arbitrage « les
 *  Gardes font tout » — la garnison de BASE des rangs est supprimée)
 *  et garnisons des technologies de progrès débloquées.
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
  // Technologies (revue 2026-10-15) : Milices civiles I/III/V, Fortifications,
  //  Pr\u00e9 carr\u00e9, Vasselit\u00e9 \u2014 le commentaire le promettait, c'est r\u00e9el.
  g += garnisonProgresVille(p, ville, C)
  const regime = C.regimes.find((r) => r.nom === p.regime)
  const bonus = regime?.garnisonParRang ?? 0
  if (bonus) g += bonus * rangNiveau(ville, C)
  // Plancher « Combler les lacunes » (engine/progresTech.ts) : les
  //  habitations ne descendent pas sous 30 si la tech est débloquée.
  return Math.max(g, garnisonMinimaleProgres(p, C))
}
