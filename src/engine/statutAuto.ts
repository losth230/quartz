// ═══════════════════════════════════════════════════════════════════════
//  STATUT D'AUTOMATISME (retour Thibaut 2026-10-15) : pastille VERT /
//  JAUNE / ROUGE sur chaque règle affichée dans le jeu.
//    'auto'       (vert)   : appliqué automatiquement par le moteur ;
//    'possible'   (jaune)  : automatisable mais pas encore codé ;
//    'impossible' (rouge)  : exige le plateau ou un choix humain.
// ═════════════════════════════════════════════════════════════════════

export type StatutAuto = 'auto' | 'possible' | 'impossible'

// (RETRAIT 2026-10-24, retour arbitre : la table TECHS et statutTech ont
//  été retirées avec le système de progrès — les pastilles de statut ne
//  concernent plus que les merveilles.)

/** Statut d'une MERVEILLE par son nom. */
export function statutMerveille(nom: string): StatutAuto {
  switch (nom) {
    case 'Sanctuaire de Salmodiva': return 'auto'
    case "Jardins d'Alexandrie": return 'auto'
    case 'Mont Caracole': return 'possible'
    case 'Grands bains': return 'possible'
    case 'Temple de Bahamutt': return 'auto'
    case "Mus\u00e9e d'Arch\u00e9ologie": return 'auto'
    case 'Tour de Crystal': return 'auto'
    case "Antichambre d'Alexandrie": return 'auto'
    case 'Antre de la d\u00e9esse araign\u00e9e': return 'auto'
    case "Laboratoire d'exp\u00e9rimentations de Falheim": return 'auto'
    case 'Ordre des chevaliers de Notan': return 'possible'
    case 'Palais des empereurs de Lun': return 'auto'
    default: return 'possible'
  }
}

// (RETRAIT 2026-10-19, retour arbitre : la table FACTIONS et statutFaction
//  ont été retirées avec le système de bonus de faction — à refaire.)

/** Classe CSS d'un statut. */
export function pastilleClass(st: StatutAuto): string {
  return st === 'auto' ? 'p-auto' : st === 'possible' ? 'p-possible' : 'p-impossible'
}
