// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ConfigTables.tsx.
//  Les DEUX éditeurs d'effets structurés :
//  • EffetsConstructionEditor : une case RESSOURCE + une case QUANTITÉ
//    (+ case « été ») — plus de texte à analyser (retour Thibaut).
//    Tourisme et Garnison sont des ressources INSTANTANÉES : Tourisme
//    crédité UNE FOIS à la construction, Garnison = valeur d'état.
//  (RETRAIT 2026-10-24, retour arbitre : EffetsTechEditor — champ
//  « effets » des techs de progrès — est supprimé avec le système de
//  progrès ; ne reste que l'éditeur des effets de constructions.)
// ══════════════════════════════════════════════════════════════════════

import type { EffetConstruction } from '../../config/defaultConfig'
import { NumberInput, Button, Select } from '../ui'

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

// (2026-10-24 : TYPES_EFFETS et EffetsTechEditor supprimés avec le
//  système de progrès — l'ancien contenu reste dans l'historique git.)
