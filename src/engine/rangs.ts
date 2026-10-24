// ══════════════════════════════════════════════════════════════════════
//  RANGS D'HABITATION — module FEUILLE (vague 2, dé-cyclage par arête)
//  Lookups purs sur la table typesHabitation : nomRang, rangsDefsType,
//  rangNiveau. Extraits de habitations.ts / regimes.ts (historique :
//  pour que les sites d'application de règles puissent injecter les
//  PORTS sans importer regimes — cycle réciproque interdit ;
//  progresAuto.ts, consommateur d'origine, supprimé le 2026-10-24
//  avec le système de progrès). habitations.ts et regimes.ts
//  ré-exportent ces symboles : les consommateurs (UI, garnisons)
//  restent inchangés (compat arrière).
// ══════════════════════════════════════════════════════════════════════

import type { City } from './types'
import { type Cfg } from './gameData'

/** Nom court d'un rang d'habitation (« Hameau : 20 Or… » → « Hameau »). */
export function nomRang(rang: string): string {
  return rang.split(':')[0].trim()
}

/** Rangs d'habitation d'un type donné (table typesHabitation) — LE
 *  lookup unique du domaine (retour Thibaut 2026-10-23,
 *  déduplication : habitationDef, metiersDisponiblesRang et
 *  rangNiveau passent tous par ici). */
export function rangsDefsType(type: string, C: Cfg): import('./types').HabitationDef[] {
  return (C.config.typesHabitation ?? []).filter((d) => d.type.toLowerCase() === type.toLowerCase())
}

/** Niveau du rang d'habitation d'une ville (1 = Hameau / Motte, 2 = Cité /
 *  Donjon, 3 = Grande Cité / Forteresse — ordre de la table
 *  typesHabitation pour le type de la ville). Défaut : 1. */
export function rangNiveau(ville: City, C: Cfg): number {
  const nom = nomRang(ville.rang ?? 'Hameau').toLowerCase()
  // niveau DANS l'échelle du type de la ville (1er rang du type = 1)
  // — lookup unique via rangsDefsType (habitations.ts, retour
  // Thibaut 2026-10-23 : déduplication des lookups de rangs).
  const idx = rangsDefsType(ville.type ?? 'Ville', C)
    .findIndex((d) => nomRang(d.rang).toLowerCase() === nom)
  return idx >= 0 ? idx + 1 : 1
}
