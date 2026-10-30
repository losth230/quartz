// ══════════════════════════════════════════════════════════════════════
//  Culture du pays (refonte « 12 lois », 2026-10-29) : loi de VILLE et
//  loi d'HABITANT de la culture du pays (textes du référentiel) +
//  badges des lois d'habitant réellement ACTIVES dans la population
//  vivante (detailLoisHabitants — nobles « Foi supérieure » /
//  « Conseil des Sages », gardes « Corps de fer »).
//  REMPLACÉ l'ancienne carte « bonus automatiques » (règle de pays
//  +N par habitation de cette culture dans le monde, retirée avec la
//  refonte — historique git). (Extrait de PlayerView.tsx — un
//  fichier par UI.)
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from '../../engine/types'
import { cultureDef, type Cfg } from '../../engine/gameData'
import { detailLoisHabitants } from '../../engine/regimes'
import { Badge, Card, fmt } from '../ui'

export function CulturePays({ state, p, C }: { state: GameState; p: Player; C: Cfg }) {
  return (
    <Card title="🛕 Culture du pays — lois des cultures">
      {(() => {
        const cult = cultureDef(p.culture, C.config)
        const lois = detailLoisHabitants(state, p, C)
        const traits = cult
          ? `hérédité ${String(cult.heredite).toLowerCase()} · mariages homosexuels ${cult.homoAutorisee ? 'autorisés' : 'interdits'}`
          : ''
        return (
          <div className="stack">
            <div>
              <strong>{p.culture}</strong>
              {cult?.regleVille && <span className="muted small"> — loi de ville : {cult.regleVille}</span>}
            </div>
            {cult?.regleHabitant && (
              <div className="muted small">Loi d'habitant : {cult.regleHabitant}</div>
            )}
            {traits && <div className="muted small">{traits}</div>}
            {lois.length > 0 ? lois.map((d, i) => (
              <div key={i}>
                <Badge tone="good">+{fmt(d.total)} {d.res} / tour</Badge>{' '}
                <span className="muted small">
                  loi d'habitant « {d.loi} » ({d.culture}) : +{fmt(d.parHab)} × {d.nb} habitant(s) de cette culture chez toi.
                </span>
              </div>
            )) : null}
            <div className="muted small">
              Les lois de ville suivent la culture majoritaire de chaque cité ; les lois
              d'habitant suivent la culture propre de chaque personnage, où qu'il vive.
            </div>
          </div>
        )
      })()}
    </Card>
  )
}
