// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — découpage de ReferenceDataPanel.tsx.
//  Logique pure du wiki de référentiels : liste des onglets (ordre =
//  ordre d'affichage, public) et résumé affichable d'un effet de
//  technologie (aide de jeu). Aucune dépendance React — importable
//  depuis n'importe quel composant de l'onglet « Référentiels ».
// ══════════════════════════════════════════════════════════════════════

import type { EffetProgres } from '../../config/defaultConfig'

// Ordre strict des onglets du wiki (public : l'orchestrateur s'en sert
// pour le rendu des boutons et le typage de l'état local).
export const ONGLETS = [
  'Métiers', 'Traits gén.', 'Peuples', 'Bâtiments', 'Aménagements', 'Progrès',
  'Pays & rangs', 'Habitations', 'Cultures & régimes', 'Tourisme', 'Cités libres',
  'Victoires', 'Crises', 'Rappels règles', 'Offrandes',
  'Couleurs', 'Aide-mémoire',
] as const

// ── Résumé affichable d'un effet de technologie (aide de jeu) ──────────

export function fmtEffetTech(e: EffetProgres): string {
  const m = `${e.montant > 0 ? '+' : ''}${e.montant}`
  switch (e.type) {
    case 'gain': return `${m} ${e.ressource ?? ''} au déblocage`
    case 'prodCapitale': return `${m} ${e.ressource ?? ''} / tour (capitale)`
    case 'prodParHabitation': return `${m} ${e.ressource ?? ''} / tour par habitation`
    case 'prodParMetier': return `${m} ${e.ressource ?? ''} / tour par métier « ${e.metier ?? ''} »`
    case 'prodParAmenagement': return `${m} ${e.ressource ?? ''} / tour par aménagement (${(e.amenagements ?? []).join(', ')})`
    case 'garnison': return `Garnison ${m} (${e.cible ?? 'habitations'})`
    default: return ''
  }
}
