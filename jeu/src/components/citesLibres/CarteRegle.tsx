// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de CitesLibresView.tsx.
//  Carte « 🗼 Cités libres — règle et fonctionnement » : texte de la
//  règle du référentiel, résumé des mécanismes et décompte de la
//  suzeraineté par joueur.
// ══════════════════════════════════════════════════════════════════════

import type { Player } from '../../engine/types'
import type { Cfg } from '../../engine/gameData'
import type { CiteLibre } from '../../engine/types'
import { Card, Badge } from '../ui'
import { fmtNum } from './logiqueCitesLibres'

export function CarteRegle({ C, garnison, cites, players }: {
  C: Cfg
  garnison: number
  cites: CiteLibre[]
  players: Player[]
}) {
  return (
    <Card title="🗼 Cités libres — règle et fonctionnement">
      <p className="small muted pre-wrap">{C.config.regleCitesLibres}</p>
      <div className="badges-wrap">
        <Badge tone="good">✓ population : adultes avec métier (Chasseurs ×1,1 Nourriture) ; enfants sans métier (consomment, ne produisent pas)</Badge>
        <Badge tone="good">✓ garnison : 100 + 40 × rang de pays le plus haut (auto)</Badge>
        <Badge tone="good">✓ taxes au suzerain : versées à chaque fin de tour (canal « Cités libres »)</Badge>
        <Badge tone="good">✓ consommation de Nourriture : par habitant vivant, comme une ville de joueur</Badge>
      </div>
      <p className="muted small">
        Chaque cité libre sous suzeraineté verse ses taxes à son suzerain à chaque fin de tour
        (canal « Cités libres » du récap).
      </p>
      <p className="muted small">
        Garnison actuelle des cités libres : <strong>{fmtNum(garnison)}</strong>
        {' '}(100 + 40 × rang de pays du joueur au plus haut rang). Suzeraineté par joueur :
        {' '}{players.map((p) => {
          const nb = cites.filter((c) => c.suzerain === p.n).length
          return `${p.nom} : ${nb}`
        }).join(' · ')} — la voie Diplomatique demande 3 cités libres.
      </p>
    </Card>
  )
}
