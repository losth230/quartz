// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de CitesLibresView.tsx.
//  Réserves d'émissaires (revue 2026-10-15) : ressource de chaque
//  joueur, dépensée en plaçant un émissaire dans une cité libre.
//  Les merveilles (Antre de la déesse araignée) créditent
//  automatiquement.
// ══════════════════════════════════════════════════════════════════════

import type { Player } from '../../engine/types'
import { Card, Button } from '../ui'

export function CarteReservesEmissaires({ players, recruterEmissaire }: {
  players: Player[]
  recruterEmissaire: (joueur: number, delta: number) => void
}) {
  return (
    <Card title="✉ Réserves d'émissaires">
      {players.map((p) => (
        <div key={p.n} className="cl-emiss">
          <span className="player-chip">J{p.n} · {p.nom}</span>
          <span className="badge badge-info">{p.emissaires ?? 0} en réserve</span>
          <Button onClick={() => recruterEmissaire(p.n, -1)}>−</Button>
          <Button onClick={() => recruterEmissaire(p.n, +1)}>+</Button>
        </div>
      ))}
    </Card>
  )
}
