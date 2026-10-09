// ══════════════════════════════════════════════════════════════════════
//  Création de partie : 8 joueurs (peuple, culture, régime, population
//  initiale, % mariages, villes), graine, mode local ou Supabase.
//  Équivalent du formulaire frmInitPop du classeur.
// ══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { useGame, type Mode } from '../state/store'
import type { SetupLine } from '../engine/setup'
import { defaultSetups } from '../engine/setup'
import { CULTURES, PEUPLES } from '../engine/gameData'
import { REGIMES } from '../engine/gameData'
import { newSeed } from '../engine/rng'
import { supabaseAvailable } from '../supabase/client'
import { Card, NumberInput, Select, TextInput, Button } from './ui'

export function SetupPanel() {
  const { newGame } = useGame()
  const [setups, setSetups] = useState<SetupLine[]>(() => defaultSetups().map((s, i) => ({
    ...s,
    culture: CULTURES[i % CULTURES.length].nom,
    villes: ['Capitale', 'Bourg'],
  })))
  const [seed, setSeed] = useState<number>(() => newSeed())
  const [mode, setMode] = useState<Mode>('local')
  const [salon, setSalon] = useState('chasse-peche')

  const setLine = (i: number, patch: Partial<SetupLine>) =>
    setSetups((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))

  const culturesPrises = setups.map((s) => s.culture)

  return (
    <div className="stack">
      <Card title="Nouvelle campagne — 8 joueurs">
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr>
                <th>#</th><th>Nom</th><th>Peuple (faction)</th><th>Culture</th>
                <th>Régime</th><th>Pop. init.</th><th>% mariés</th><th>Villes (séparées par ,)</th>
              </tr>
            </thead>
            <tbody>
              {setups.map((s, i) => (
                <tr key={i}>
                  <td><strong>J{i + 1}</strong></td>
                  <td><TextInput value={s.nom} onChange={(v) => setLine(i, { nom: v })} /></td>
                  <td>
                    <Select
                      value={s.peuple}
                      options={PEUPLES.map((p) => ({ value: p.nom, label: p.nom }))}
                      onChange={(v) => setLine(i, { peuple: v })}
                    />
                  </td>
                  <td>
                    <Select
                      value={s.culture}
                      options={CULTURES.map((c) => ({
                        value: c.nom,
                        label: `${c.nom}${culturesPrises.filter((x) => x === c.nom).length > 1 ? ' (déjà prise)' : ''}`,
                      }))}
                      onChange={(v) => setLine(i, { culture: v })}
                    />
                  </td>
                  <td>
                    <Select
                      value={s.regime}
                      options={REGIMES.map((r) => ({ value: r.nom, label: r.nom }))}
                      onChange={(v) => setLine(i, { regime: v })}
                    />
                  </td>
                  <td>
                    <NumberInput value={s.taillePopulation} min={10} max={200}
                      onChange={(v) => setLine(i, { taillePopulation: Math.round(v) })} />
                  </td>
                  <td>
                    <NumberInput value={s.pourcentageMariages} min={0} max={100}
                      onChange={(v) => setLine(i, { pourcentageMariages: Math.round(v) })} />
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <TextInput value={s.villes.join(', ')}
                      onChange={(v) => setLine(i, { villes: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Options de la partie">
        <div className="grid-3">
          <label className="field">
            <span className="field-label">Graine (déterminisme)</span>
            <div className="row">
              <NumberInput value={seed} min={1} onChange={(v) => setSeed(Math.max(1, Math.round(v)))} />
              <Button onClick={() => setSeed(newSeed())} title="Nouvelle graine aléatoire">🎲</Button>
            </div>
          </label>
          <label className="field">
            <span className="field-label">Mode de jeu</span>
            <Select value={mode} options={[
              { value: 'local', label: 'Local (hotseat, localStorage)' },
              ...(supabaseAvailable()
                ? [{ value: 'supabase', label: 'Multijoueur Supabase (temps réel)' }]
                : [{ value: 'supabase', label: 'Multijoueur — clés .env manquantes' }]),
            ]} onChange={(v) => setMode(v as Mode)} />
          </label>
          <label className="field">
            <span className="field-label">Code du salon (mode multijoueur)</span>
            <TextInput value={salon} onChange={setSalon} />
          </label>
        </div>
        <Button
          tone="primary"
          disabled={mode === 'supabase' && !supabaseAvailable()}
          onClick={() => newGame(setups, seed, mode, salon)}
        >
          ▶ Créer la partie
        </Button>
        <p className="muted small">
          Astuce : deux joueurs qui choisissent le même code de salon et le même mode multijoueur
          jouent la même partie en temps réel (un seul bouton « Tour suivant » à la fois recommandé).
          Sans clés Supabase, tout reste jouable en local sur un même écran.
        </p>
      </Card>
    </div>
  )
}
