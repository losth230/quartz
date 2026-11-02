// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de CitesLibresView.tsx.
//  Carte « Créer une cité libre » : l'état local du formulaire (nom,
//  type, culture, nombre d'habitants) vit DANS la carte, il ne sert
//  qu'ici. Les habitants sont créés immédiatement via
//  ajouterHabitantsCiteLibre (moteur).
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { GameState, CiteLibre } from '../../engine/types'
import { ajouterHabitantsCiteLibre } from '../../engine/citesLibres'
import { Card, Select, TextInput, Button, NumberInput } from '../ui'

export function CarteCreation({ typeOptions, typesConfig, cultures, update }: {
  typeOptions: { value: string; label: string }[]
  typesConfig: { type: string; effet?: string }[]
  cultures: string[]
  update: (fn: (s: GameState) => void) => void
}) {
  const [newNom, setNewNom] = useState('')
  const [newType, setNewType] = useState('')
  const [newCulture, setNewCulture] = useState('')
  const [newNb, setNewNb] = useState(10)

  const creerCite = () => {
    const nb = Math.max(0, Math.round(newNb))
    update((s) => {
      const cites2 = s.citesLibres ?? (s.citesLibres = [])
      let nom = newNom.trim()
      if (!nom) {
        let n = cites2.length + 1
        nom = `Cité libre ${n}`
        while (cites2.some((c) => c.nom === nom)) nom = `Cité libre ${++n}`
      }
      if (cites2.some((c) => c.nom === nom)) return
      const cite: CiteLibre = {
        nom,
        type: newType || typesConfig[0]?.type || 'Ville',
        culture: newCulture || cultures[0] || '',
        taxes: 'Moyenne',
        suzerain: null,
        emissaires: {},
        population: [],
      }
      cites2.push(cite)
      if (nb > 0) ajouterHabitantsCiteLibre(s, cite, nb)
      s.log.push({
        turn: s.turn, type: 'Système', joueur: null,
        texte: `🗼 Nouvelle cité libre : ${cite.nom} (${cite.type.split('\n')[0]})${nb > 0 ? `, ${nb} habitant(s)` : ''}.`,
      })
    })
    setNewNom('')
  }

  return (
    <Card title="Créer une cité libre">
      <div className="grid-2">
        <TextInput value={newNom} onChange={setNewNom} placeholder="Nom (vide → auto)" />
        <Select
          value={newType || typeOptions[0]?.value || ''}
          options={typeOptions}
          onChange={setNewType}
        />
        <Select
          value={newCulture || cultures[0] || ''}
          options={cultures.map((c) => ({ value: c, label: c }))}
          onChange={setNewCulture}
        />
        <NumberInput value={newNb} onChange={setNewNb} min={0} />
      </div>
      <Button tone="primary" onClick={creerCite}>+ Créer la cité (et ses habitants)</Button>
    </Card>
  )
}
