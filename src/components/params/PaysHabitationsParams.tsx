// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ConfigTables.tsx.
//  Tables « Pays & rangs » (échelle féodale, avec auto-migration des
//  configurations antérieures à la refonte) et « Habitations »
//  (types & rangs — arbitrage 2026-10-22 conservé : consommation / tour
//  et garnison de base supprimées).
// ══════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { DEFAULT_CONFIG, parseMetiersBaseTexte } from '../../config/defaultConfig'
import { Card, TextInput, NumberInput, Button, Select } from '../ui'
import type { TableProps } from './logiqueParams'

export function PaysRangsParams({ config, setCfg }: TableProps) {
  // Auto-migration des rangs de pays : une configuration antérieure à la
  // refonte (ancienne table à blocs Féodal/Républicain) repasse sur la
  // nouvelle échelle (coutOr/coutNourriture/serments) pour que
  // l'éditeur écrive au bon format.
  useEffect(() => {
    const raw = config.paysRangs
    if (
      !Array.isArray(raw) || raw.length === 0
      || typeof (raw[0] as { coutOr?: unknown })?.coutOr !== 'number'
    ) {
      setCfg((c) => {
        c.paysRangs = DEFAULT_CONFIG.paysRangs.map((r) => ({ ...r }))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Card title="Rangs de pays — échelle féodale unique">
      <p className="muted small">
        Montée par <strong>sacre</strong> : payer Or + Nourriture et posséder les <strong>serments</strong>
        requis (vassal ou cité libre sous suzeraineté).
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Rang</th><th>Sacre (Or)</th><th>Sacre (Nourriture)</th><th>Serments requis</th><th>Bonus (plateau)</th><th></th></tr></thead>
          <tbody>
            {config.paysRangs.map((r, i) => (
              <tr key={i}>
                <td><TextInput value={r.nom} onChange={(v) => setCfg((c) => { c.paysRangs[i].nom = v })} /></td>
                <td><NumberInput value={r.coutOr} min={0} onChange={(v) => setCfg((c) => { c.paysRangs[i].coutOr = v })} /></td>
                <td><NumberInput value={r.coutNourriture} min={0} onChange={(v) => setCfg((c) => { c.paysRangs[i].coutNourriture = v })} /></td>
                <td><NumberInput value={r.serments} min={0} onChange={(v) => setCfg((c) => { c.paysRangs[i].serments = v })} /></td>
                <td><TextInput value={r.bonus} onChange={(v) => setCfg((c) => { c.paysRangs[i].bonus = v })} /></td>
                <td>
                  <Button tone="danger" onClick={() => setCfg((c) => { c.paysRangs.splice(i, 1) })}>✕</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => setCfg((c) => {
        c.paysRangs.push({ nom: 'Nouveau rang', coutOr: 0, coutNourriture: 0, serments: 0, bonus: '' })
      })}>+ Ajouter un rang</Button>
    </Card>
  )
}

export function HabitationsParams({ config, setCfg }: TableProps) {
  return (
    <Card title={`Types & rangs d'habitation (${config.typesHabitation.length}) — métiers & domiciles disponibles`}>
      <p className="muted small">
        Coût d'amélioration : débité automatiquement du stock à la construction /
        amélioration du rang (page Pays). « Métiers disponibles » : cap de BASE du
        rang (vague 3b — les emplacements des bâtiments s'y ajoutent) ;
        « Domiciles disponibles » : affichage seul pour l'instant.
        Consommation / tour et garnison de base : supprimées (arbitrage 2026-10-22).
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead>
            <tr>
              <th>Type</th><th>Rang</th><th>Coût d'amélioration</th>
              <th>Habitants requis</th><th>Métiers disponibles</th><th>Domiciles disponibles</th><th></th>
            </tr>
          </thead>
          <tbody>
            {config.typesHabitation.map((h, i) => (
              <tr key={i}>
                <td>
                  <Select
                    value={h.type}
                    options={[{ value: 'Ville', label: 'Ville' }, { value: 'Château', label: 'Château' }]}
                    onChange={(v) => setCfg((c) => { c.typesHabitation[i].type = v })}
                  />
                </td>
                <td><TextInput value={h.rang} onChange={(v) => setCfg((c) => { c.typesHabitation[i].rang = v })} /></td>
                <td><TextInput value={h.cout} onChange={(v) => setCfg((c) => { c.typesHabitation[i].cout = v })} /></td>
                <td><NumberInput value={h.habitantsRequis} step={10} min={0} onChange={(v) => setCfg((c) => { c.typesHabitation[i].habitantsRequis = v })} /></td>
                <td><TextInput value={(h.metiersBase ?? []).map((e) => `${e.places} ${e.metier}`).join(', ')} onChange={(v) => setCfg((c) => { c.typesHabitation[i].metiersBase = parseMetiersBaseTexte(v, c.metiers.map((m) => m.metier)) })} /></td>
                <td><TextInput value={h.domicilesDisponibles ?? ''} onChange={(v) => setCfg((c) => { c.typesHabitation[i].domicilesDisponibles = v })} /></td>
                <td>
                  <Button tone="danger" onClick={() => setCfg((c) => { c.typesHabitation.splice(i, 1) })}>✕</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => setCfg((c) => {
        c.typesHabitation.push({ type: 'Ville', rang: 'Nouveau rang', cout: '', habitantsRequis: 0, metiersBase: [], domicilesDisponibles: '' })
      })}>+ Ajouter un rang d'habitation</Button>
    </Card>
  )
}
