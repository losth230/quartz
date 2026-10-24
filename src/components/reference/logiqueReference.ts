// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — découpage de ReferenceDataPanel.tsx.
//  Logique pure du wiki de référentiels : liste des onglets (ordre =
//  ordre d'affichage, public). Aucune dépendance React — importable
//  depuis n'importe quel composant de l'onglet « Référentiels ».
//  (RETRAIT 2026-10-24, retour arbitre : le résumé affichable d'un
//  effet de technologie, fmtEffetTech, est supprimé avec le système
//  de progrès ; l'onglet « Progrès » disparaît de la liste.)
// ══════════════════════════════════════════════════════════════════════

// Ordre strict des onglets du wiki (public : l'orchestrateur s'en sert
// pour le rendu des boutons et le typage de l'état local).
export const ONGLETS = [
  'Métiers', 'Traits gén.', 'Peuples', 'Bâtiments', 'Aménagements',
  'Pays & rangs', 'Habitations', 'Cultures & régimes', 'Tourisme', 'Cités libres',
  'Victoires', 'Crises', 'Rappels règles', 'Offrandes',
  'Couleurs', 'Aide-mémoire',
] as const

