// ══════════════════════════════════════════════════════════════════════
//  Table de population : filtres, tri, édition des titres (validée),
//  affichage des traits / mariages / parenté (table P_j du classeur).
// ════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react'
import { useGame } from '../state/store'
import type { Character, Player } from '../engine/types'
import { cfgOf } from '../engine/gameData'
import { validateTitleAssignment } from '../engine/validation'
import { Card, Select, TextInput, Button, fmt } from './ui'

type SortKey = 'nom' | 'age' | 'dynastie' | 'ville' | 'titre' | 'statut'

export function PopulationTable({ joueur }: { joueur: number }) {
  const { state, update } = useGame()
  const [filtreDyn, setFiltreDyn] = useState('')
  const [filtreVille, setFiltreVille] = useState('')
  const [filtreTitre, setFiltreTitre] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Vivants')
  const [tri, setTri] = useState<SortKey>('age')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const p = state?.players.find((x) => x.n === joueur)
  const pop = state?.population[joueur] ?? []

  const rows = useMemo(() => {
    let list = [...pop]
    if (filtreStatut === 'Vivants') list = list.filter((c) => c.statut !== 'Décédé')
    else if (filtreStatut === 'Décédés') list = list.filter((c) => c.statut === 'Décédé')
    else if (filtreStatut === 'Enfants') list = list.filter((c) => c.statut !== 'Décédé' && c.age < 16)
    else if (filtreStatut === 'Nobles') list = list.filter((c) => c.statut !== 'Décédé' && c.dynastie !== 'Roturier' && c.dynastie !== '')
    if (filtreDyn) list = list.filter((c) => c.dynastie.toLowerCase().includes(filtreDyn.toLowerCase()))
    if (filtreVille) list = list.filter((c) => c.ville === filtreVille)
    if (filtreTitre) list = list.filter((c) => (c.titre ?? '') === filtreTitre)
    const cmp: Record<SortKey, (a: Character, b: Character) => number> = {
      nom: (a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr'),
      age: (a, b) => b.age - a.age,
      dynastie: (a, b) => a.dynastie.localeCompare(b.dynastie, 'fr'),
      ville: (a, b) => a.ville.localeCompare(b.ville, 'fr'),
      titre: (a, b) => (a.titre ?? '').localeCompare(b.titre ?? '', 'fr'),
      statut: (a, b) => a.statut.localeCompare(b.statut, 'fr'),
    }
    list.sort(cmp[tri])
    return list
  }, [pop, filtreDyn, filtreVille, filtreTitre, filtreStatut, tri])

  if (!state || !p) return null

  // Aucune contrainte bloquante : le titre est TOUJOURS appliqué ;
  // le contrôle de cohérence n'affiche qu'un avertissement (ignorable).
  const changeTitre = (c: Character, titre: string) => {
    const issue = validateTitleAssignment(state, p, c, titre)
    setErrors((e) => {
      const copy = { ...e }
      if (issue.ok) delete copy[c.id]
      else copy[c.id] = issue.message
      return copy
    })
    update((s) => {
      const target = (s.population[joueur] ?? []).find((x) => x.id === c.id)
      if (target) target.titre = titre
    })
  }

  const dynasties = [...new Set(pop.map((c) => c.dynastie))].sort((a, b) => a.localeCompare(b, 'fr'))
  const villes = [...new Set(pop.map((c) => c.ville))]

  return (
    <div className="stack">
      <Card title={`Population de ${p.nom} — ${pop.filter((c) => c.statut !== 'Décédé').length} vivants / ${pop.length} au total`}>
        <div className="filters">
          <Select value={filtreStatut} options={[
            { value: 'Vivants', label: 'Vivants' },
            { value: 'Décédés', label: 'Décédés' },
            { value: 'Enfants', label: 'Enfants (<16)' },
            { value: 'Nobles', label: 'Nobles' },
            { value: 'Tous', label: 'Tous' },
          ]} onChange={setFiltreStatut} />
          <Select value={filtreVille} options={[
            { value: '', label: 'Toutes les villes' },
            ...villes.map((v) => ({ value: v, label: v })),
          ]} onChange={setFiltreVille} />
          <Select value={filtreTitre} options={[
            { value: '', label: 'Tous les titres' },
            ...cfgOf(state?.config).titres.map((t) => ({ value: t.titre, label: t.titre })),
          ]} onChange={setFiltreTitre} />
          <TextInput value={filtreDyn} onChange={setFiltreDyn} placeholder="Filtrer dynastie…" />
          <Select value={tri} options={[
            { value: 'age', label: 'Trier : âge' },
            { value: 'nom', label: 'Trier : nom' },
            { value: 'dynastie', label: 'Trier : dynastie' },
            { value: 'ville', label: 'Trier : ville' },
            { value: 'titre', label: 'Trier : titre' },
          ]} onChange={(v) => setTri(v as SortKey)} />
        </div>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr>
                <th>Nom</th><th>Dynastie</th><th>Sx</th><th>Âge</th><th>Ville</th>
                <th>Culture</th><th>Titre</th><th>Éducation</th><th>Traits</th>
                <th>Statut</th><th>Mariage</th><th>Fécondité</th><th>Âge max</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={c.statut === 'Décédé' ? 'dead' : c.titre === 'Dirigeant' ? 'lead' : ''}>
                  <td><strong>{c.prenom} {c.nom}</strong></td>
                  <td>{c.dynastie}</td>
                  <td>{c.sexe}</td>
                  <td>{c.age}</td>
                  <td>{c.ville}</td>
                  <td>{c.culture}</td>
                  <td>
                    <Select
                      value={c.titre ?? ''}
                      options={[
                        ...(c.titre ? [{ value: c.titre, label: c.titre }] : []),
                        { value: '', label: c.statut === 'Décédé' ? '—' : '(retirer)' },
                        ...cfgOf(state?.config).titres
                          .filter((t) => t.titre !== c.titre && t.attribution !== 'Armée')
                          .map((t) => ({ value: t.titre, label: t.titre })),
                      ]}
                      onChange={(v) => changeTitre(c, v)}
                    />
                    {errors[c.id] && <div className="neg small">⚠ {errors[c.id]}</div>}
                  </td>
                  <td>{c.education ?? '—'}</td>
                  <td className="small">
                    {c.traits.filter(Boolean).map((t) => (
                      <span key={t} className={`badge ${t === 'Bâtard' || t === 'Consanguin' ? 'badge-bad' : 'badge-neutral'}`}>{t}</span>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${c.statut === 'Sain' ? 'badge-good' : c.statut === 'Décédé' ? 'badge-bad' : 'badge-warn'}`}>
                      {c.statut}
                    </span>
                  </td>
                  <td className="small">{c.mariage ?? '—'}</td>
                  <td>{c.fecondite > 0 ? fmt(c.fecondite, 2) : '—'}</td>
                  <td>{c.ageMax || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Les titres « Soldat » et « Commandant » s'obtiennent via l'onglet Armées (attribution « Armée »),
          comme dans le classeur. L'attribution manuelle applique toutes les règles du VBA
          (noblesse, genre, éducation requise, unicité Dirigeant/Héritier/Gouverneur, plafond des Professeurs).
        </p>
      </Card>
      <Card title="Dynasties de la population">
        <div className="badges-wrap">
          {dynasties.map((d) => {
            const nb = pop.filter((c) => c.dynastie === d && c.statut !== 'Décédé').length
            return (
              <button key={d} className="badge badge-neutral clickable" onClick={() => setFiltreDyn(d)}>
                {d} : {nb}
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
