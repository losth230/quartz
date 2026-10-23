// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de RoyaumeView.tsx.
//  Cadre « Joueur N » : identité éditable du pays (nom, peuple,
//  culture, régime) — déplacé ici depuis la page « Pays ».
//  Changement de culture : le stock de Tourisme est recalculé
//  immédiatement (retour Thibaut 2026-10-16).
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from '../../engine/types'
import type { Cfg } from '../../engine/gameData'
import { resynchroniserTourisme } from '../../engine/regimes'
import { Card, Select, TextInput, Field } from '../ui'

export function CarteIdentite({ p, C, joueur, setPlayer, update }: {
  p: Player
  C: Cfg
  joueur: number
  setPlayer: (fn: (p: Player) => void) => void
  update: (fn: (s: GameState) => void) => void
}) {
  return (
    <Card
      title={`Joueur ${p.n} — ${p.nom}`}
      right={<span className="muted small">{p.peuple} · {p.villes.length} ville(s)</span>}
    >
      <div className="grid-2">
        <Field label="Nom du joueur">
          <TextInput value={p.nom} onChange={(v) => setPlayer((x) => { x.nom = v })} />
        </Field>
        <Field label="Peuple">
          <Select
            value={p.peuple}
            options={C.peuples.map((n) => ({ value: n, label: n }))}
            onChange={(v) => setPlayer((x) => { x.peuple = v })}
          />
        </Field>
        <Field label="Culture du pays (capitale)">
          <Select
            value={p.culture}
            options={C.cultures.map((c) => ({
              value: c.nom, label: `${c.nom} (hérédité ${String(c.heredite).toLowerCase()})`,
            }))}
            onChange={(v) => update((s) => {
              const x = s.players.find((q) => q.n === joueur)
              if (!x || x.culture === v) return
              const ancienne = x.culture
              x.culture = v
              // Tourisme (retour Thibaut 2026-10-16) : le stock est
              //  recalculé immédiatement — la loi de pays de
              //  l'ancienne culture (ex. Lunisme) disparaît tout
              //  de suite, celle de la nouvelle s'applique.
              resynchroniserTourisme(s, x, `culture ${ancienne} → ${v}`)
            })}
          />
        </Field>
        <Field label="Régime politique">
          <Select
            value={p.regime}
            options={C.regimes.map((r) => ({ value: r.nom, label: r.nom }))}
            onChange={(v) => setPlayer((x) => { x.regime = v })}
          />
        </Field>
      </div>
    </Card>
  )
}
