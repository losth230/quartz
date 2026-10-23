// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ConfigTables.tsx.
//  Les DEUX éditeurs d'effets structurés :
//  • EffetsConstructionEditor : une case RESSOURCE + une case QUANTITÉ
//    (+ case « été ») — plus de texte à analyser (retour Thibaut).
//    Tourisme et Garnison sont des ressources INSTANTANÉES : Tourisme
//    crédité UNE FOIS à la construction, Garnison = valeur d'état.
//  • EffetsTechEditor : champ « effets » de chaque tech de progrès —
//    AUCUN effet moteur (tout s'applique au plateau), ces lignes ne
//    servent qu'au résumé affiché sous la tech (aide de jeu).
// ══════════════════════════════════════════════════════════════════════

import type { EffetConstruction, EffetProgres, ProgresTechDef } from '../../config/defaultConfig'
import { TextInput, NumberInput, Button, Select } from '../ui'

export function EffetsConstructionEditor({ valeur, ressources, set }: {
  valeur: EffetConstruction[] | undefined
  ressources: string[]
  set: (fn: (effets: EffetConstruction[]) => void) => void
}) {
  const effets = valeur ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {effets.map((e, j) => (
        <div key={j} className="row small-gap" style={{ flexWrap: 'wrap' }}>
          <Select
            value={e.ressource}
            options={ressources.map((r) => ({ value: r, label: r }))}
            onChange={(v) => set((ef) => { if (ef[j]) ef[j] = { ...ef[j], ressource: v } })}
          />
          <NumberInput value={e.quantite} step={1} onChange={(v) => set((ef) => { if (ef[j]) ef[j] = { ...ef[j], quantite: v } })} />
          <label className="small" style={{ whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={!!e.ete}
              onChange={(ev) => set((ef) => { if (ef[j]) ef[j] = { ...ef[j], ete: ev.target.checked || undefined } })}
            />{' '}été
          </label>
          <Button tone="danger" onClick={() => set((ef) => { ef.splice(j, 1) })}>✕</Button>
        </div>
      ))}
      <Button onClick={() => set((ef) => {
        ef.push({ ressource: ressources[0] ?? 'Or', quantite: 0 })
      })}>+ effet</Button>
      <span className="muted small">
        Quantité négative = consommation / tour. « été » = production d'été uniquement (canal
        « Nourr - été »). Tourisme & Garnison = instantanés (Tourisme crédité UNE fois à la
        construction, Garnison = valeur d'état) — jamais de flux / tour.
      </span>
    </div>
  )
}

const TYPES_EFFETS: Array<{ value: EffetProgres['type']; label: string }> = [
  { value: 'gain', label: 'Gain au déblocage' },
  { value: 'prodCapitale', label: '+/tour (capitale)' },
  { value: 'prodParHabitation', label: '+/tour par habitation' },
  { value: 'prodParMetier', label: '+/tour par métier' },
  { value: 'prodParAmenagement', label: '+/tour par aménagement' },
  { value: 'garnison', label: 'Garnison (statique)' },
]

export function EffetsTechEditor({ tech, ressources, metiers, set }: {
  tech: ProgresTechDef | undefined
  ressources: string[]
  metiers: string[]
  /** applique une mutation au tableau « effets » de la tech (brouillon) */
  set: (fn: (effets: EffetProgres[]) => void) => void
}) {
  const effets = tech?.effets ?? []
  const maj = (j: number, patch: Partial<EffetProgres>) =>
    set((ef) => { if (ef[j]) ef[j] = { ...ef[j], ...patch } })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {effets.map((e, j) => (
        <div key={j} className="row small-gap" style={{ flexWrap: 'wrap' }}>
          <Select
            value={e.type}
            options={TYPES_EFFETS}
            onChange={(v) => maj(j, { type: v })}
          />
          {e.type === 'garnison' ? (
            <Select
              value={e.cible ?? 'habitations'}
              options={[
                { value: 'capitale', label: 'capitale' },
                { value: 'habitations', label: 'toutes les habitations' },
              ]}
              onChange={(v) => maj(j, { cible: v })}
            />
          ) : (
            <Select
              value={e.ressource ?? ''}
              options={ressources.map((r) => ({ value: r, label: r }))}
              onChange={(v) => maj(j, { ressource: v })}
            />
          )}
          <NumberInput value={e.montant} step={1} onChange={(v) => maj(j, { montant: v })} />
          {e.type === 'prodParMetier' && (
            <Select
              value={e.metier ?? ''}
              options={metiers.map((t) => ({ value: t, label: t }))}
              onChange={(v) => maj(j, { metier: v })}
            />
          )}
          {e.type === 'prodParAmenagement' && (
            <TextInput
              value={(e.amenagements ?? []).join(', ')}
              placeholder="ex. Champ, Rizière"
              onChange={(v) => maj(j, {
                amenagements: v.split(',').map((x) => x.trim()).filter(Boolean),
              })}
            />
          )}
          <Button tone="danger" onClick={() => set((ef) => { ef.splice(j, 1) })}>✕</Button>
        </div>
      ))}
      <Button onClick={() => set((ef) => {
        ef.push({ type: 'gain', ressource: ressources[0] ?? 'Or', montant: 0 })
      })}>+ effet automatique</Button>
    </div>
  )
}
