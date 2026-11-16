// ══════════════════════════════════════════════════════════════════════
//  CHASSE & PÊCHE — Accès aux référentiels
//  Les données vivent dans state.config (onglet « Paramètres ») ;
//  les helpers ci-dessous acceptent une config optionnelle et
//  retombent sur les valeurs par défaut sinon.
// ══════════════════════════════════════════════════════════════════════

import {
  DEFAULT_CONFIG, cfgOf, cloneDefaultConfig,
  couleurJoueur, couleurRessource, fondRessource, migrerCouleurs,
  COULEURS_JOUEURS_DEFAUT, COULEURS_RESSOURCES_DEFAUT, TRANSPARENCE_LIGNES_DEFAUT,
  type Cfg, type GameConfig, type MetierDef, type TraitDef, type CultureDef,
  type RegimeDef,
  type CouleursConfig,
} from '../config/defaultConfig'

export type { GameConfig, CultureDef, RegimeDef, Cfg, CouleursConfig }
export { couleurJoueur, couleurRessource, fondRessource, migrerCouleurs, COULEURS_JOUEURS_DEFAUT, COULEURS_RESSOURCES_DEFAUT, TRANSPARENCE_LIGNES_DEFAUT }

export const RESOURCES: string[] = DEFAULT_CONFIG.ressources
export const CULTURES: CultureDef[] = DEFAULT_CONFIG.cultures
export const REGIMES = DEFAULT_CONFIG.regimes
export { DEFAULT_CONFIG, cfgOf, cloneDefaultConfig }

// Peuples (référence : nom + banque de noms associée)
export interface PeupleDef {
  nom: string
  noms: string[]
  prenomsM: string[]
  prenomsF: string[]
}
export const PEUPLES: PeupleDef[] = DEFAULT_CONFIG.peuples.map((nom) => {
  const b = DEFAULT_CONFIG.banquesNoms[DEFAULT_CONFIG.peupleBanque[nom] ?? 0] ?? DEFAULT_CONFIG.banquesNoms[0]
  return { nom, noms: b.noms, prenomsM: b.prenomsM, prenomsF: b.prenomsF }
})

export function metierDef(metier: string, cfg?: GameConfig): MetierDef | undefined {
  return (cfg ?? DEFAULT_CONFIG).metiers.find((t) => t.metier === metier)
}
export function traitDef(name: string, cfg?: GameConfig): TraitDef | undefined {
  return (cfg ?? DEFAULT_CONFIG).traits.find((t) => t.name === name)
}
export function cultureDef(nom: string, cfg?: GameConfig): CultureDef | undefined {
  return (cfg ?? DEFAULT_CONFIG).cultures.find((c) => c.nom === nom)
}
/** Fiche d'un régime politique par nom (refonte « 8 lois » des
 *  régimes, 2026-10-29 : les lois chiffrées des régimes vivent sur
 *  la fiche — leveeOrParRangPays, departHabitantsMult, orParMigrant,
 *  consoNourrBourgeoisRegime, consoNourrNobleRegime,
 *  bonheurParHabitation, tributVassalMult — et sont lues par le
 *  MOTEUR là où elles agissent ; plus aucune loi de régime ne
 *  passe par la banque.) */
export function regimeDef(nom: string, cfg?: GameConfig): RegimeDef | undefined {
  return (cfg ?? DEFAULT_CONFIG).regimes.find((r) => r.nom === nom)
}
export function peupleDef(nom: string, cfg?: GameConfig): PeupleDef | undefined {
  const c = cfg ?? DEFAULT_CONFIG
  const b = c.banquesNoms[c.peupleBanque[nom] ?? 0] ?? c.banquesNoms[0]
  if (!b) return undefined
  return { nom, noms: b.noms, prenomsM: b.prenomsM, prenomsF: b.prenomsF }
}

/** Fiche d'effets d'un peuple (table effetsPeuple du référentiel,
 *  arbitrage Thibaut 2026-11-16 : le peuple d'un habitant offre un
 *  bonus, comme les cultures — cf. EffetPeupleDef, engine/types.ts). */
export function peupleEffetDef(nom: string, cfg?: GameConfig): import('./types').EffetPeupleDef | undefined {
  const c = cfg ?? DEFAULT_CONFIG
  return (c.effetsPeuple ?? []).find((e) => e.nom === nom)
}

/** Modificateur ADDITIF (points absolus) porté par le PEUPLE d'un
 *  habitant pour une clé d'effet (migrationBonheurMod,
 *  conversionProbaMod). Le peuple est hérité de la mère et ne
 *  change JAMAIS — un habitant sans peuple (vieille sauvegarde non
 *  rattrapée) ne porte aucun effet (0). Pure. */
export function modPeupleHabitant(
  c: import('./types').Character,
  key: 'migrationBonheurMod' | 'conversionProbaMod',
  C?: Cfg,
): number {
  return peupleEffetDef(c.peuple ?? '', C?.config)?.[key] ?? 0
}

/** (Arbitrage Thibaut 2026-11-16 « Isolationnistes », 3e clause —
 *  « poids x0,8 ») : multiplicateur du POIDS d'attraction des
 *  villes d'un joueur de ce peuple pour les migrants d'AUTRES
 *  joueurs (migration interne inchangée). Défaut 1. Porté par le
 *  peuple du JOUEUR DESTINATAIRE — cf. EffetPeupleDef.poidsArriveeMod.
 *  Pure. */
export function poidsArriveePeuple(joueur: { peuple?: string }, C?: Cfg): number {
  return peupleEffetDef(joueur.peuple ?? '', C?.config)?.poidsArriveeMod ?? 1
}
