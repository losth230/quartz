// ══════════════════════════════════════════════════════════════════════
//  Vue joueur : ressources éditables, villes (taxes, bâtiments, gains),
//  dynastie, récap du dernier tour.
// ══════════════════════════════════════════════════════════════════════

import React from 'react'
import { useGame } from '../state/store'
import type { Player } from '../engine/types'
import { cfgOf } from '../engine/gameData'
import { Card, NumberInput, Select, TextInput, Button, fmt, TAX_OPTIONS } from './ui'

export function PlayerView({ joueur }: { joueur: number }) {
  const { state, update } = useGame()
  if (!state) return null
  const C = cfgOf(state.config)
  const p = state.players.find((x) => x.n === joueur)
  if (!p) return <Card>Joueur introuvable.</Card>

  const setPlayer = (fn: (p: Player) => void) =>
    update((s) => {
      const target = s.players.find((x) => x.n === joueur)
      if (target) fn(target)
    })

  return (
    <div className="stack">
      <Card title={`${p.nom} — peuple ${p.peuple}, culture ${p.culture}, régime ${p.regime}`}
        right={<span className="muted small">Dynastie : {p.dynastie ? `${p.dynastie.nom} — ${p.dynastie.description}` : '—'}</span>}
      >
        <div className="grid-2">
          <Field label="Nom du joueur">
            <TextInput value={p.nom} onChange={(v) => setPlayer((x) => { x.nom = v })} />
          </Field>
          <Field label="Peuple (faction du classeur)">
            <Select
              value={p.peuple}
              options={C.peuples.map((n) => ({ value: n, label: n }))}
              onChange={(v) => setPlayer((x) => { x.peuple = v })}
            />
          </Field>
          <Field label="Culture du pays (capitale)">
            <Select
              value={p.culture}
              options={C.cultures.map((c) => ({ value: c.nom, label: `${c.nom} (hérédité ${String(c.heredite).toLowerCase()})` }))}
              onChange={(v) => setPlayer((x) => { x.culture = v })}
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

      <Card title="Ressources (stock et production modifiables)">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Ressource</th><th>Stock</th><th>Production / tour</th></tr>
            </thead>
            <tbody>
              {C.ressources.map((r) => {
                const rs = p.resources[r] ?? { stock: 0, prod: 0 }
                return (
                  <tr key={r}>
                    <td><strong>{r}</strong></td>
                    <td className={(rs.stock < 0) ? 'neg' : ''}>
                      <NumberInput
                        value={rs.stock}
                        step={r === 'Habitants' ? 1 : 5}
                        onChange={(v) => setPlayer((x) => {
                          if (!x.resources[r]) x.resources[r] = { stock: 0, prod: 0 }
                          x.resources[r].stock = v
                        })}
                      />
                    </td>
                    <td>
                      <NumberInput
                        value={rs.prod}
                        step={0.5}
                        onChange={(v) => setPlayer((x) => {
                          if (!x.resources[r]) x.resources[r] = { stock: 0, prod: 0 }
                          x.resources[r].prod = v
                        })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Villes">
        <div className="grid-2">
          {p.villes.map((ville, idx) => {
            const nbVivants = (state.population[p.n] ?? [])
              .filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom).length
            return (
              <div key={idx} className="mini">
                <Field label="Nom">
                  <TextInput
                    value={ville.nom}
                    onChange={(v) => setPlayer((x) => {
                      const ancien = x.villes[idx].nom
                      x.villes[idx].nom = v
                      // mettre à jour la ville des habitants
                      for (const c of x.population[x.n] ?? []) {
                        if (c.ville === ancien) c.ville = v
                      }
                    })}
                  />
                </Field>
                <div className="muted small">
                  Culture majoritaire : <strong>{ville.culture}</strong> · {nbVivants} habitant(s) vivant(s)
                </div>
                <Field label="Niveau de taxes">
                  <Select
                    value={ville.taxes}
                    options={TAX_OPTIONS}
                    onChange={(v) => setPlayer((x) => { x.villes[idx].taxes = v })}
                  />
                </Field>
                <div className="batiments">
                  <strong className="small">Bâtiments :</strong>
                  {ville.batiments.length === 0 && <span className="muted small"> aucun</span>}
                  {ville.batiments.map((b, bi) => (
                    <span key={bi} className="badge badge-info">
                      {b}
                      <button
                        className="badge-x"
                        title="Démolir"
                        onClick={() => setPlayer((x) => { x.villes[idx].batiments.splice(bi, 1) })}
                      >×</button>
                    </span>
                  ))}
                </div>
                <div className="add-bat">
                  <Select
                    value=""
                    options={[{ value: '', label: '+ ajouter un bâtiment…' },
                      ...C.batiments.map((b) => ({ value: b.nom, label: `${b.nom} (${b.categorie})` }))]}
                    onChange={(v) => v && setPlayer((x) => {
                      if (!x.villes[idx].batiments.includes(v)) x.villes[idx].batiments.push(v)
                    })}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <Button onClick={() => setPlayer((x) => {
          const nom = `Ville ${x.villes.length + 1}`
          x.villes.push({ nom, culture: x.culture, taxes: 'Moyenne', batiments: [] })
        })}>+ Ajouter une ville</Button>
      </Card>

      <Card title="Récap du dernier tour">
        {p.recap ? (
          <div className="grid-2 small">
            <div>Conceptions : {dictToString(p.recap.conceptions)}</div>
            <div>Naissances : {dictToString(p.recap.naissances)}</div>
            <div>Décès : {dictToString(p.recap.deces)} (dont maladie : {p.recap.decesMaladie})</div>
            <div>Mariages nobles : {dictToString(p.recap.mariagesNobles)}</div>
            <div>Conversions : {dictToString(p.recap.conversions)}</div>
            <div>Titres attribués : {dictToString(p.recap.titresAttribues)}</div>
            {(p.recap.crises.length > 0 || p.recap.commandantTombe) && (
              <div className="neg">⚠ {p.recap.crises.join(' ; ')}{p.recap.commandantTombe ? ` Commandant tombé : ${p.recap.commandantTombe}` : ''}</div>
            )}
          </div>
        ) : (
          <p className="muted">Lancez un tour pour voir apparaître le récapitulatif (équivalent J{n}!A35 du classeur).</p>
        )}
      </Card>
    </div>
  )
}

function dictToString(dict: Record<string, number>): string {
  const entries = Object.entries(dict).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return '—'
  return entries.map(([k, v]) => `${k} : ${v}`).join(', ')
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export { fmt }
