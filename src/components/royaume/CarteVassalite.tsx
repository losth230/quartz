// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de RoyaumeView.tsx.
//  Carte « 🤝 Vassalité » : prêt de serment à un autre joueur, tribut
//  automatique (paramètre vassalPrelevement, appliqué en fin de tour
//  par le moteur), chaîne de suzerains (anti-cycle), vassaux et cités
//  libres sous suzeraineté. Tourisme resynchronisé à chaque mutation
//  (retour Thibaut 2026-10-16 : stock recalculé = production).
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from '../../engine/types'
import type { Cfg } from '../../engine/gameData'
import { resynchroniserTourisme } from '../../engine/regimes'
import { rangParDefaut } from '../../engine/setup'
import { citesSuzerainesDe } from '../../engine/citesLibres'
import { Card, Select, Button, Badge } from '../ui'
import { chaineSuz } from './logiqueRoyaume'

export function CarteVassalite({ state, p, C, joueur, update }: {
  state: GameState
  p: Player
  C: Cfg
  joueur: number
  update: (fn: (s: GameState) => void) => void
}) {
  const suzerain = p.vassalDe != null ? state.players.find((x) => x.n === p.vassalDe) : undefined
  const vassaux = state.players.filter((q) => q.vassalDe === p.n)
  const pct = Math.round(C.p.vassalPrelevement * 100)

  const preterSerment = (suzerainN: number) =>
    update((s) => {
      const t = s.players.find((x) => x.n === joueur)
      const suz = s.players.find((x) => x.n === suzerainN)
      if (!t || !suz) return
      t.vassalDe = suzerainN
      // Tourisme (retour Thibaut 2026-10-16) : le bonus de vassalité
      //  entre dans la production — stock recalculé = production.
      resynchroniserTourisme(s, t, `serment à ${suz.nom}`)
      s.log.push({
        turn: s.turn, type: 'Système', joueur: t.n,
        texte: `🤝 ${t.nom} prête serment à ${suz.nom} et devient son vassal : il lui reverse ${pct} % des revenus de ses habitants à chaque fin de tour.`,
      })
    })

  const rompreSerment = () =>
    update((s) => {
      const t = s.players.find((x) => x.n === joueur)
      if (!t) return
      const ancien = s.players.find((x) => x.n === t.vassalDe)
      // Tourisme (retour Thibaut 2026-10-16) : le bonus de
      //  vassalité disparaît — stock recalculé = production.
      resynchroniserTourisme(s, t, 'serment rompu')
      t.vassalDe = null
      s.log.push({
        turn: s.turn, type: 'Système', joueur: t.n,
        texte: `⚔ ${t.nom} rompt son serment de vassalité${ancien ? ` envers ${ancien.nom}` : ''}.`,
      })
    })

  // Candidates au serment : tous les autres joueurs, sauf ceux dont la
  // chaîne de suzerains passe par ce joueur (ça créerait un cycle).
  const candidats = state.players.filter((q) => {
    if (q.n === p.n) return false
    if (q.vassalDe === p.n) return false
    return !chaineSuz(state.players, q.n).some((x) => x.n === p.n)
  })

  return (
    <Card title="🤝 Vassalité">
      <div className="grid-2">
        <div className="mini">
          <div className="mini-title">Serment de ce pays</div>
          {suzerain ? (
            <>
              <div>
                Vassal de <strong>{suzerain.nom}</strong>{' '}
                <Badge tone="warn">reverse {pct} % des revenus de ses habitants</Badge>
              </div>
              {chaineSuz(state.players, p.n).length > 1 && (
                <div className="muted small">
                  Chaîne de suzerains : {chaineSuz(state.players, p.n).map((s) => s.nom).join(' → ')}
                </div>
              )}
              <Button tone="danger" onClick={rompreSerment}>Rompre le serment</Button>
            </>
          ) : (
            <>
              <div className="muted small">
                Ce pays est indépendant. Il peut prêter serment à un autre joueur
                    et devient alors son vassal : à chaque fin de tour il lui reverse {' '}{pct} % des revenus d'Or de ses habitants (paramètre modifiable
                    dans l'onglet « 🎛 Paramètres », groupe « Vassaux »).
              </div>
              <Select
                value=""
                options={[
                  { value: '', label: 'Prêter serment à…' },
                  ...candidats.map((q) => ({ value: String(q.n), label: `${q.nom} (J${q.n})` })),
                ]}
                onChange={(v) => v && preterSerment(parseInt(v, 10))}
              />
              {candidats.length === 0 && (
                <div className="muted small">Aucun joueur disponible (serments croisés interdits).</div>
              )}
            </>
          )}
        </div>
        <div className="mini">
          <div className="mini-title">Vassaux de ce pays ({vassaux.length})</div>
          {vassaux.length === 0 && <div className="muted small">Aucun vassal.</div>}
          {vassaux.map((v) => (
            <div key={v.n}>
              <strong>{v.nom}</strong> <Badge tone="good">+{pct} % de ses revenus d'habitants</Badge>
              <div className="muted small">
                Rang : {v.rang ?? rangParDefaut(v.regime, C)}
                {chaineSuz(state.players, v.n).length > 1 && <> · sa chaîne : {chaineSuz(state.players, v.n).map((s) => s.nom).join(' → ')}</>}
              </div>
            </div>
          ))}
          {(() => {
            const cites = citesSuzerainesDe(state, p)
            return (
              <div style={{ marginTop: 8 }}>
                <div className="mini-title">🗼 Cités libres sous suzeraineté ({cites.length})</div>
                {cites.length === 0
                  ? <div className="muted small">Aucune — atteindre 3 émissaires auprès d'une cité libre (onglet « 🗼 Cités libres ») pour devenir son suzerain (voie Diplomatique : 3 cités).</div>
                  : cites.map((c) => (
                    <div key={c.nom} className="muted small">
                      <strong>{c.nom}</strong> — verse ses taxes à chaque fin de tour
                      (Chasseurs ×1,1 Nourriture, canal « Cités libres »).
                    </div>
                  ))}
              </div>
            )
          })()}
        </div>
      </div>
    </Card>
  )
}
