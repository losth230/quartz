// ══════════════════════════════════════════════════════════════════════
//  HABITATIONS — TYPES DE VILLE (Ville / Château), MÉTIERS ET
//  DOMICILES DISPONIBLES PAR RANG (feuille « Ville » du classeur).
//  Les villes sont de deux types, chacun avec son échelle de rangs :
//    · Ville     : Hameau → Cité (120 hab.) → Grande Cité (200 hab.) ;
//    · Château   : Motte  → Donjon (120 hab.) → Forteresse (200 hab.).
//  Vague 3b (arbitrage 2026-10-22) : chaque rang définit les MÉTIERS
//  disponibles à la base (cap de base, ex. Hameau : 50 Chasseurs,
//  2 Gardes, 1 Commerçant, 1 Gouverneur) et les DOMICILES
//  disponibles (affichage seul pour l'instant). La consommation par
//  tour et la garnison de base des rangs sont SUPPRIMÉES : la
//  garnison vient des Gardes en poste (regimes.ts, vague 3a) —
//  (nettoyage 2026-10-22, retour Thibaut : les no-ops qui restaient
//  pour ne pas casser les appelants ont été retirées du code, avec
//  le canal « habitations » des récaps ressources).
//  Table entièrement paramétrable : Référentiels → « Habitations ».
//  Nettoyage 2026-10-23 (retour Thibaut, formats unifiés) : les
//  métiers de base vivent en TABLEAU STRUCTURÉ `metiersBase` (métiers
//  TOUJOURS AU SINGULIER — même format que les `emplacements` des
//  constructions) ; le parse du TEXTE historique n'existe plus côté
//  moteur (il reste au niveau SAISIE : éditeur Référentiels +
//  migration one-shot de cfgOf).
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { City, GameState, Player } from './types'
import { type Cfg } from './gameData'
import { parseCoutTexte } from './constructions'
import { reductionFondation } from './progresAuto'
import { aTech } from './progresTech'
import { nomRang, rangsDefsType } from './rangs'
export { nomRang, rangsDefsType } from './rangs'

/** Type d'habitation d'une ville (« Ville » ou « Château » ; défaut
 *  « Ville » pour les vieilles sauvegardes). */
export function typeVille(ville: City): string {
  return ville.type ?? 'Ville'
}

/** Définition d'un rang précis d'un type donné (noms de rang
 *  insensibles à la casse ; « Hameau : 20 Or… » → « Hameau »). */
export function rangDef(type: string, rang: string, C: Cfg): import('./types').HabitationDef | undefined {
  const nom = nomRang(rang).toLowerCase()
  return rangsDefsType(type, C).find((d) => nomRang(d.rang).toLowerCase() === nom)
}

/** Définition du rang d'habitation d'une ville (table typesHabitation). */
export function habitationDef(ville: City, C: Cfg): import('./types').HabitationDef | undefined {
  return rangDef(typeVille(ville), ville.rang ?? 'Hameau', C)
}

/** Rangs d'habitation disponibles pour un type donné
 *  (pour les listes déroulantes de la page « Pays »). */
export function rangsDisponibles(type: string, C: Cfg): string[] {
  return rangsDefsType(type, C).map((d) => d.rang)
}

/** Habitants requis pour le rang d'habitation d'une ville. */
export function habitantsRequisVille(ville: City, C: Cfg): number {
  return habitationDef(ville, C)?.habitantsRequis ?? 0
}

/** Coût d'un rang d'habitation (colonne « Coût d'amélioration » du
 *  référentiel, ex. « 20 Or + 10 Bois + 6 Bétail »), en quantités
 *  positives. Vide / inconnu = gratuit. */
export function coutHabitation(ville: City, C: Cfg): Record<string, number> {
  return parseCoutTexte(habitationDef(ville, C)?.cout ?? '')
}

/** Débite automatiquement du stock le coût d'habitation du rang
 *  ACTUEL de la ville (construction / amélioration — retour Thibaut
 *  2026-10-14) + log Système. Avertit (sans bloquer) si les
 *  habitants requis manquent. Retourne le coût débité. */
export function debiterCoutHabitation(
  state: GameState, p: Player, ville: City, C: Cfg,
  /** Fondation (nouvelle ville / château) et non simple amélioration :
   *  active les réductions des TECHS de fondation
   *  (reductionFondation : Colonialisme durable −5 Bois,
   *  Colonialisme économe −20 Or — plafonnés à 0).
   *  (Vague 2, arbitrage 2026-10-23 « Grand bailli : c'est un
   *  ministre, on supprime pour l'instant » : l'office n'existe
   *  plus, ce docblock ne cite que les effets réels.) */
  fondation = false,
): Record<string, number> {
  const def = habitationDef(ville, C)
  const cout = coutHabitation(ville, C)
  // Technologies (revue 2026-10-15) : Colonialisme durable (-5 Bois)
  //  et economome (-20 Or) sur les FONDATIONS d'habitation.
  // Expansion maritime s'applique aux côtières pour la fondation ET
  //  l'amélioration ; Colonialisme pour la fondation seule.
  const reducTechs = fondation
    ? reductionFondation(p, C, ville)
    : (ville.proximite === 'Mer' && aTech(p, 'Expansion maritime', C)
        ? { Bois: 3, Pierre: 3 } : {})
  for (const [r, v] of Object.entries(reducTechs)) {
    if (cout[r] !== undefined) cout[r] = Math.max(0, cout[r] - v)
  }
  for (const [res, v] of Object.entries(cout)) {
    const rs = p.resources[res]
    if (rs && v !== 0) rs.stock -= v
  }
  const parts = Object.entries(cout)
    .map(([r, v]) => `${v} ${r}`).join(' + ')
  const requis = def?.habitantsRequis ?? 0
  const vivants = (state.population[p.n] ?? [])
    .filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom).length
  state.log.push({
    turn: state.turn, type: 'Système', joueur: p.n,
    texte: `🏰 ${ville.nom} — ${def?.rang ?? typeVille(ville)} (${typeVille(ville)})` +
      (parts ? ` — coût débité du stock : ${parts}` : ' — gratuit') +
      (requis > 0 && vivants < requis
        ? ` ⚠ habitants insuffisants (${vivants}/${requis}).`
        : '.') +
      (def?.metiersBase?.length
      ? ` Métiers disponibles : ${def.metiersBase.map((e) => `${e.places} ${e.metier}`).join(', ')}.`
      : '') +
      (def?.domicilesDisponibles ? ` Domiciles disponibles : ${def.domicilesDisponibles}.` : ''),
  })
  return cout
}

// ── Métiers disponibles à la base du rang (vague 3b) ────────────────────
//  Nettoyage 2026-10-23 (retour Thibaut, formats unifiés) : la colonne
//  vit en TABLEAU STRUCTURÉ `metiersBase` (métiers au singulier — même
//  format que les `emplacements` des constructions). Plus de parse au
//  runtime : la migration ciblée de cfgOf a converti les configs
//  sauvegardées, l'éditeur Référentiels convertit la saisie texte.

/** Métiers disponibles à la BASE du rang d'habitation d'une ville
 *  (vague 3b) : cap de base par métier, avant les emplacements des
 *  bâtiments (metiers.ts les AJOUTE) — lecture directe du tableau
 *  `metiersBase` du rang (lookup unique via habitationDef). */
export function metiersDisponiblesRang(ville: City, C: Cfg): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of habitationDef(ville, C)?.metiersBase ?? []) {
    out[e.metier] = (out[e.metier] ?? 0) + e.places
  }
  return out
}
