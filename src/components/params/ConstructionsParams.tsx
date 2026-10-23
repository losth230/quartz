// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ConfigTables.tsx.
//  Tables « Bâtiments » (Ville / Château / Capitale) et
//  « Aménagements » : éditeurs de la liste constructions, avec
//  l'éditeur d'EFFETS STRUCTURÉS du moteur (EffetsConstructionEditor).
// ══════════════════════════════════════════════════════════════════════

import { Card, TextInput, Button, Select } from '../ui'
import { GROUPES_BAT, type TableProps } from './logiqueParams'
import { EffetsConstructionEditor } from './EditeursEffets'

export function BatimentsParams({ config, setCfg }: TableProps) {
  return (
    <Card title={`Constructions — bâtiments (${(config.constructions ?? []).filter((c) => c.categorie === 'Bâtiment').length})`}>
      <p className="muted small">
        Le <strong>groupe</strong> détermine où le bâtiment est constructible (Ville / Château /
        Capitale). Le moteur lit les <strong>effets</strong> structurés (case ressource + case
        quantité) ; le texte « Production » reste affiché dans le wiki des Référentiels.
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Groupe</th><th>Bâtiment</th><th>Coût</th><th>Effets (moteur)</th><th>Production (texte)</th><th>Description</th><th></th></tr></thead>
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
                <td><TextInput value={c.cout} onChange={(v) => setCfg((cf) => { cf.constructions[i].cout = v })} /></td>
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
                <td><TextInput value={c.production} onChange={(v) => setCfg((cf) => { cf.constructions[i].production = v })} /></td>
                <td><TextInput value={c.description} onChange={(v) => setCfg((cf) => { cf.constructions[i].description = v })} /></td>
                <td><Button tone="danger" onClick={() => setCfg((cf) => { cf.constructions.splice(i, 1) })}>✕</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => setCfg((c) => {
        c.constructions.push({ categorie: 'Bâtiment', groupe: 'Ville', famille: '', nom: 'Nouveau bâtiment', cout: '', production: '', description: '', effets: [] })
      })}>+ Ajouter un bâtiment</Button>
    </Card>
  )
}

export function AmenagementsParams({ config, setCfg }: TableProps) {
  return (
    <Card title={`Aménagements (${(config.constructions ?? []).filter((c) => c.categorie === 'Aménagement').length})`}>
      <p className="muted small">
        La colonne <strong>Terrain</strong> est indicative (case de plateau requise) ; le moteur lit
        le <strong>coût</strong> et les <strong>effets</strong> structurés (case ressource + case
        quantité). Coût réduit par un « Camp de bâtisseurs » présent dans la ville (montant lu
        dans sa description).
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Aménagement</th><th>Terrain</th><th>Coût</th><th>Effets (moteur)</th><th>Production (texte)</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {(config.constructions ?? []).map((c, i) => ({ c, i })).filter(({ c }) => c.categorie === 'Aménagement').map(({ c, i }) => (
              <tr key={i}>
                <td><TextInput value={c.nom} onChange={(v) => setCfg((cf) => { cf.constructions[i].nom = v })} /></td>
                <td><TextInput value={c.terrain ?? ''} onChange={(v) => setCfg((cf) => { cf.constructions[i].terrain = v })} /></td>
                <td><TextInput value={c.cout} onChange={(v) => setCfg((cf) => { cf.constructions[i].cout = v })} /></td>
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
                <td><TextInput value={c.production} onChange={(v) => setCfg((cf) => { cf.constructions[i].production = v })} /></td>
                <td><TextInput value={c.description} onChange={(v) => setCfg((cf) => { cf.constructions[i].description = v })} /></td>
                <td><Button tone="danger" onClick={() => setCfg((cf) => { cf.constructions.splice(i, 1) })}>✕</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => setCfg((c) => {
        c.constructions.push({ categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Nouvel aménagement', terrain: '', cout: '', production: '', description: '', effets: [] })
      })}>+ Ajouter un aménagement</Button>
    </Card>
  )
}
