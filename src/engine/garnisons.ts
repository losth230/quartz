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
import { cultureDef, type Cfg } from './gameData'
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
    const gardes = pop.filter(
      (c) => c.statut !== 'Décédé' && c.ville === ville.nom && c.metier === C.p.metierGarde,
    )
    g += C.p.garnisonParGarde * gardes.length
    // (Refonte 12 lois, 2026-10-29, Zélotisme « Corps de fer » : +N
    //  Garnison STATIQUE par Garde de culture porteuse de la loi
    //  (champ garnisonParGardeCulture, défaut Zélotisme 10) — SE
    //  CUMULE au défaut moteur garnisonParGarde : un Garde zélotiste
    //  vaut garnisonParGarde + garnisonParGardeCulture (20 par
    //  défaut). Même nature : valeur d'ÉTAT, jamais un flux.)
    for (const c of gardes) {
      g += cultureDef(c.culture, C.config)?.garnisonParGardeCulture ?? 0
    }
  }
  // (RETRAIT 2026-10-24 : plus de garnison des technologies — système
  //  de progrès supprimé, retour arbitre.)
  // (RETRAIT 2026-10-29, refonte « 8 lois » des régimes : la loi
  //  « Conscription » de l'Autoritarisme — garnison des habitations
  //  +N par rang d'habitation (champ garnisonParRang) — est
  //  REMPLACÉE par la réduction du prix de levée d'armée
  //  (leveeOrParRangPays, engine/armees.ts) : plus de bonus de
  //  garnison du régime.
  // (Refonte 12 lois, 2026-10-29, Zélotisme « Ferveur
  //  martiale » : si au moins une ville de culture porteuse de la
  //  loi existe dans le MONDE (villes des JOUEURS, cités libres
  //  hors champ), la garnison d'une habitation qui n'est PAS de
  //  cette culture perd garnisonHorsCultureParRang × rang de
  //  l'habitation — malus MONDIAL appliqué UNE fois par habitation,
  //  sans cumul si plusieurs villes de la culture.)
  if (state) g -= malusFerveurMartiale(state, ville, C)
  // (RETRAIT 2026-10-24 : le plancher « Combler les lacunes » des
  //  technologies n'existe plus — système de progrès supprimé.
  //  NOUVEAU PLANCHER 0 (refonte 12 lois, 2026-10-29) : la Ferveur
  //  martiale ne peut pas rendre la garnison négative.)
  return Math.max(0, g)
}

/** Malus de FERVEUR MARTIALE (refonte 12 lois, 2026-10-29) : les lois
 *  `garnisonHorsCultureParRang` dont la culture est PRÉSENTE dans le
 *  monde (au moins une ville d'un JOUEUR de cette culture — les
 *  cités libres sont hors champ) réduisent la garnison des
 *  habitations qui ne sont PAS de leur culture de N × rang de
 *  l'habitation (rangNiveau). Malus appliqué UNE fois par
 *  habitation ET PAR CULTURE martiale présente (CORRECTIF audit a1
 *  du 2026-10-30 : la boucle historique s'arrêtait à la première
 *  culture martiale présente — une deuxième loi présente dans le
 *  monde était ignorée ; une habitation d'une culture martiale est
 *  protégée de SA loi mais subit celle des autres cultures
 *  martiales présentes ; à une seule culture martiale, Zélotisme,
 *  le comportement est INCHANGÉ), sans cumul si plusieurs villes
 *  d'une même culture. Plancher 0 dans garnisonHabitationVille.
 *  Exporté pour le détail UI (regimes.ts — ligne « culture » du
 *  tableau garnison). */
export function malusFerveurMartiale(state: GameState, ville: City, C: Cfg): number {
  // (CORRECTIF 2026-10-30, audit a1 : la boucle historique s'arrêtait
  //  à la PREMIÈRE culture martiale présente (return) — une deuxième
  //  loi garnisonHorsCultureParRang présente dans le monde était
  //  ignorée. Chaque culture martiale présente applique maintenant
  //  SA loi, une fois par habitation et par culture.)
  let malus = 0
  for (const cult of C.config.cultures) {
    const n = cult.garnisonHorsCultureParRang ?? 0
    if (!n) continue
    const presente = state.players.some((q) => q.villes.some((v) => v.culture === cult.nom))
    if (!presente) continue
    if (ville.culture === cult.nom) continue
    malus += n * rangNiveau(ville, C)
  }
  return malus
}
