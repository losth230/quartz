// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de CitesLibresView.tsx.
//  Formatage nombre (fr-FR, 1 décimale max) pour garnisons et taxes
//  des cités libres. Sans dépendance React.
// ══════════════════════════════════════════════════════════════════════

export function fmtNum(v: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v)
}
