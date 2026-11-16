// ══════════════════════════════════════════════════════════════════════
//  TALENTS DE PEUPLE — débloqués par LAURIERS de voies de victoire
//
//  Système de factions (arbitrages Thibaut 2026-11-16) : chaque joueur
//  porte un PEUPLE (champ peuple, hérité par la mère pour ses
//  habitants) ; la fiche de peuple a une strate de base (table
//  effetsPeuple, active dès le setup) et des TALENTS qui se
//  débloquent quand le joueur valide des LAURIERS de ses voies de
//  victoire (radar de l'accueil, cochage manuel — cf. victory.ts).
//
//  PRINCIPE CLÉ (arbitrage « base au setup + chaque palier de
//  victoire atteint déverrouille un talent de faction ») : le talent
//  est ENTIÈREMENT DÉRIVÉ de p.lauriers — aucun état supplémentaire à
//  stocker ni à synchroniser (multijoueur : la fusion de sections ne
//  transporte jamais de champ de talent, chaque joueur le recalcule
//  depuis ses Lauriers). Un talent est actif dès que le joueur de ce
//  peuple a validé le Laurier `laurierMin` de sa voie ; les entrées
//  d'une même voie s'additionnent (L1 + L3 cumulés à partir du
//  Laurier III).
//
//  Lecture des effets : cf. TalentPeupleDef (engine/types.ts) —
//  emplacementsParRoute (metiers.ts), fluxParMetier (economie.ts),
//  reductionLeveeParBatiment (armees.ts) ; une entrée sans champ
//  d'effet est une règle de PLATEAU (aide de jeu, jamais moteur,
//  même convention que les dogmes).
// ══════════════════════════════════════════════════════════════════════

import type { Player, TalentPeupleDef } from './types'
import type { GameConfig } from '../config/defaultConfig'
import { cfgOf, type Cfg } from './gameData'
import { nbLauriers } from './victory'

/** Toutes les fiches de talents du référentiel pour un peuple
 *  (ordre du référentiel). Peuple inconnu : vide. Pure. */
export function talentsPeupleDef(peuple: string, config?: GameConfig): TalentPeupleDef[] {
  return cfgOf(config).config.talentsPeuple.filter((t) => t.peuple === peuple)
}

/** Talents de peuple ACTIFS d'un joueur : fiche de son peuple,
 *  filtrée par ses Lauriers validés (nbLauriers >= laurierMin).
 *  `p` accepte le type structurel { peuple?, lauriers? } pour être
 *  appelé depuis des signatures minimales (prixArmee). Pure. */
export function talentsActifs(
  p: { peuple?: string; lauriers?: Record<string, number> } | undefined,
  C: Cfg,
): TalentPeupleDef[] {
  if (!p?.peuple) return []
  return talentsPeupleDef(p.peuple, C.config).filter(
    (t) => nbLauriers(p as Player, t.voie) >= t.laurierMin,
  )
}
