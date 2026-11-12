// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de CitesLibresView.tsx.
//  Réserves d'émissaires (revue 2026-10-15) : ressource de chaque
//  joueur, dépensée en plaçant un émissaire dans une cité libre.
//  (RETRAIT 2026-10-27, audit : plus de crédit automatique par les
//  merveilles — la réserve est libre d'édition.)
//  (2026-11-03, arbitrage Thibaut : Délégation/Chancellerie/Ambassade)
//  les bâtiments accordent des émissaires TANT QU'ils sont construits
//  (emissairesApportes, valeur d'état) : la réserve MOBILISABLE =
//  réserve manuelle + bonus bâtiments — le bonus s'affiche ici.
// ══════════════════════════════════════════════════════════════════════

import type { Player } from '../../engine/types'
import type { Cfg } from '../../engine/gameData'
import { emissairesConstructionsJoueur } from '../../engine/batiments'
import { Card, Button } from '../ui'

export function CarteReservesEmissaires({ players, C, recruterEmissaire }: {
  players: Player[]
  C: Cfg
  recruterEmissaire: (joueur: number, delta: number) => void
}) {
  return (
    <Card title="✉ Réserves d'émissaires">
      {players.map((p) => {
        const bonus = emissairesConstructionsJoueur(p, C)
        const mobilisables = (p.emissaires ?? 0) + bonus
        return (
          <div key={p.n} className="cl-emiss">
            <span className="player-chip">J{p.n} · {p.nom}</span>
            <span className="badge badge-info">{p.emissaires ?? 0} en réserve</span>
            {bonus > 0 && (
              <span className="badge badge-warn" title="Émissaires accordés par les bâtiments (Délégation, Chancellerie, Ambassade) tant qu'ils sont construits">
                +{bonus} (bâtiments) → {mobilisables} mobilisables
              </span>
            )}
            <Button onClick={() => recruterEmissaire(p.n, -1)}>−</Button>
            <Button onClick={() => recruterEmissaire(p.n, +1)}>+</Button>
          </div>
        )
      })}
    </Card>
  )
}
