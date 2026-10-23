// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de RoyaumeView.tsx.
//  Logique pure de la page « Royaume » : chaîne des suzerains
//  (garde anti-boucle infinie) et libellé d'un personnage.
// ══════════════════════════════════════════════════════════════════════

import type { Character, Player } from '../../engine/types'

/** Chaîne des suzerains au-dessus d'un joueur (sans boucle infinie). */
export function chaineSuz(players: Player[], n: number): Player[] {
  const out: Player[] = []
  const vus = new Set<number>([n])
  let cur = players.find((x) => x.n === n)
  while (cur && cur.vassalDe != null && !vus.has(cur.vassalDe)) {
    const s = players.find((x) => x.n === cur!.vassalDe)
    if (!s) break
    out.push(s)
    vus.add(s.n)
    cur = s
  }
  return out
}

export function pers(c: Character): string {
  return `${c.prenom} ${c.nom} (${c.age} ans${c.ville ? `, ${c.ville}` : ''})`
}
