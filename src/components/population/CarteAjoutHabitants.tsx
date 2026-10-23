// ══════════════════════════════════════════════════════════════════════
//  CARTE « ➕ Ajouter des habitants » (vague qualité 2026-10-24) :
//  extraite de PopulationTable.tsx, sémantique identique — l'état
//  local (ville d'ajout, nombre) vit DANS la carte, il ne sert
//  qu'ici. Ajout manuel de roturiers ou d'une nouvelle famille
//  noble (culture pondérée par celles présentes dans la ville —
//  moteur ajouterHabitant / helpers cités libres).
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Card, Select, Button, NumberInput } from '../ui'

export function CarteAjoutHabitants({
  villes, onAjouter, onAjouterNobles,
}: {
  villes: string[]
  onAjouter: (villeEff: string, nb: number) => void
  onAjouterNobles: (villeEff: string, nb: number) => void
}) {
  const [addVille, setAddVille] = useState('')
  const [addNb, setAddNb] = useState(1)
  const addVilleEff = addVille || villes[0] || ''

  return (
    <Card title="➕ Ajouter des habitants">
      <div className="filters">
        <Select value={addVilleEff} options={villes.map((v) => ({ value: v, label: v }))} onChange={setAddVille} />
        <NumberInput value={addNb} min={1} max={200} onChange={(v) => setAddNb(Math.round(v))} />
        <Button onClick={() => onAjouter(addVilleEff, Math.max(1, Math.round(addNb)))}>+ Roturiers</Button>
        <Button onClick={() => onAjouterNobles(addVilleEff, Math.max(1, Math.round(addNb)))}>+ Nouvelle famille noble</Button>
      </div>
      <p className="muted small">
        Les nobles ajoutés apparaissent dans « La cour ».
      </p>
    </Card>
  )
}
