// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ConfigTables.tsx.
//  Tables « Bâtiments » (Ville / Château / Capitale) et
//  « Aménagements » : éditeurs de la liste constructions, avec
//  l'éditeur d'EFFETS STRUCTURÉS du moteur (EffetsConstructionEditor)
//  et l'éditeur de COÛT STRUCTURÉ (CoutEditor — retour Thibaut
//  2026-10-27 : le coût n'est plus un texte à analyser, chaque ligne
//  porte des paires {ressource, valeur} ; le PRÉREQUIS est un champ
//  dédié `requis`).
// ══════════════════════════════════════════════════════════════════════

import { Card, TextInput, Button, Select, NumberInput } from '../ui'
import { GROUPES_BAT, type TableProps } from './logiqueParams'
import { EffetsConstructionEditor } from './EditeursEffets'
import type { CoutRef } from '../../config/defaultConfig'

/** Éditeur d'un coût structuré : une ligne par paire {ressource, valeur}
 *  (+ bouton d'ajout / suppression). */
export function CoutEditor({ valeur, ressources, set }: {
  valeur: CoutRef[] | undefined
  ressources: string[]
  set: (fn: (couts: CoutRef[]) => void) => void
}) {
  const couts = valeur ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {couts.map((c, j) => (
        <div key={j} className="row small-gap" style={{ flexWrap: 'wrap' }}>
          <Select
            value={c.ressource}
            options={ressources.map((r) => ({ value: r, label: r }))}
            onChange={(v) => set((cs) => { if (cs[j]) cs[j] = { ...cs[j], ressource: v } })}
          />
          <NumberInput value={c.valeur} step={1} min={0}
            onChange={(v) => set((cs) => { if (cs[j]) cs[j] = { ...cs[j], valeur: v } })} />
          <Button tone="danger" onClick={() => set((cs) => { cs.splice(j, 1) })}>✕</Button>
        </div>
      ))}
      <Button onClick={() => set((cs) => {
        cs.push({ ressource: ressources[0] ?? 'Or', valeur: 0 })
      })}>+ coût</Button>
    </div>
  )
}

export function BatimentsParams({ config, setCfg }: TableProps) {
  return (
    <Card title={`Constructions — bâtiments (${(config.constructions ?? []).filter((c) => c.categorie === 'Bâtiment').length})`}>
      <p className="muted small">
        Le <strong>groupe</strong> détermine où le bâtiment est constructible (Ville / Château /
        Capitale). Le moteur lit le <strong>coût</strong> en paires ressource / valeur, le
        <strong> prérequis</strong> (même ville) et les <strong>effets</strong> structurés.
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Groupe</th><th>Bâtiment</th><th>Coût</th><th>Prérequis</th><th>Effets (moteur)</th><th>Réduc. levée (Or)</th><th></th></tr></thead>
          <tbody>
            {(config.constructions ?? []).map((c, i) => ({ c, i })).filter(({ c }) => c.categorie === 'Bâtiment').map(({ c, i }) => (
              <tr key={i}>
                <td>
                  <Select
                    value={c.groupe}
                    options={GROUPES_BAT}
                    onChange={(v) => setCfg((cf) => { cf.constructions[i].groupe = v })}
                  />
                </td>
                <td><TextInput value={c.nom} onChange={(v) => setCfg((cf) => { cf.constructions[i].nom = v })} /></td>
                <td>
                  <CoutEditor
                    valeur={c.couts}
                    ressources={config.ressources}
                    set={(fn) => setCfg((cf) => {
                      const t = cf.constructions[i]
                      if (!t) return
                      if (!t.couts) t.couts = []
                      fn(t.couts)
                    })}
                  />
                </td>
                <td><TextInput value={c.requis ?? ''} onChange={(v) => setCfg((cf) => { cf.constructions[i].requis = v })} /></td>
                <td>
                  <EffetsConstructionEditor
                    valeur={c.effets}
                    ressources={config.ressources}
                    set={(fn) => setCfg((cf) => {
                      const t = cf.constructions[i]
                      if (!t) return
                      if (!t.effets) t.effets = []
                      fn(t.effets)
                    })}
                  />
                </td>
                {/* (Arbitrage Thibaut 2026-10-28 : « les armées, et surtout
                    les réductions de levée, rejoignent la banque » — la
                    réduction de levée d'armée est un champ DONNÉES de la
                    fiche de construction, éditable ici.) */}
                <td>
                  <NumberInput
                    value={c.reductionLeveeArmee ?? 0}
                    step={1} min={0} max={999}
                    onChange={(v) => setCfg((cf) => {
                      const t = cf.constructions[i]
                      if (!t) return
                      t.reductionLeveeArmee = Math.round(v)
                    })}
                  />
                </td>
                <td><Button tone="danger" onClick={() => setCfg((cf) => { cf.constructions.splice(i, 1) })}>✕</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => setCfg((c) => {
        c.constructions.push({ categorie: 'Bâtiment', groupe: 'Ville', famille: '', nom: 'Nouveau bâtiment', couts: [], effets: [] })
      })}>+ Ajouter un bâtiment</Button>
    </Card>
  )
}

export function AmenagementsParams({ config, setCfg }: TableProps) {
  return (
    <Card title={`Aménagements (${(config.constructions ?? []).filter((c) => c.categorie === 'Aménagement').length})`}>
      <p className="muted small">
        La colonne <strong>Terrain</strong> est indicative (case de plateau requise) ; le moteur
        lit le <strong>coût</strong> en paires ressource / valeur et les <strong>effets</strong>
        {' '}structurés. Coût réduit par un « Camp de bâtisseurs » présent dans la ville
        (réduction : 5 Or et 1 Bois).
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Aménagement</th><th>Terrain</th><th>Coût</th><th>Effets (moteur)</th><th></th></tr></thead>
          <tbody>
            {(config.constructions ?? []).map((c, i) => ({ c, i })).filter(({ c }) => c.categorie === 'Aménagement').map(({ c, i }) => (
              <tr key={i}>
                <td><TextInput value={c.nom} onChange={(v) => setCfg((cf) => { cf.constructions[i].nom = v })} /></td>
                <td><TextInput value={c.terrain ?? ''} onChange={(v) => setCfg((cf) => { cf.constructions[i].terrain = v })} /></td>
                <td>
                  <CoutEditor
                    valeur={c.couts}
                    ressources={config.ressources}
                    set={(fn) => setCfg((cf) => {
                      const t = cf.constructions[i]
                      if (!t) return
                      if (!t.couts) t.couts = []
                      fn(t.couts)
                    })}
                  />
                </td>
                <td>
                  <EffetsConstructionEditor
                    valeur={c.effets}
                    ressources={config.ressources}
                    set={(fn) => setCfg((cf) => {
                      const t = cf.constructions[i]
                      if (!t) return
                      if (!t.effets) t.effets = []
                      fn(t.effets)
                    })}
                  />
                </td>
                <td><Button tone="danger" onClick={() => setCfg((cf) => { cf.constructions.splice(i, 1) })}>✕</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => setCfg((c) => {
        c.constructions.push({ categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Nouvel aménagement', terrain: '', couts: [], effets: [] })
      })}>+ Ajouter un aménagement</Button>
    </Card>
  )
}
