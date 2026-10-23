// ══════════════════════════════════════════════════════════════════════
//  LIGNE D'UN PERSONNAGE (vague qualité 2026-10-24) : extraite de
//  PopulationTable.tsx (renderLigne), SÉMANTIQUE IDENTIQUE — commune
//  aux deux tableaux « La cour » / « Population ». avecMariage : le
//  bouton « Marier avec… » n'apparaît que pour la cour (le mariage
//  manuel unit deux nobles — le reste de la population se marie au
//  fil des tours).
// ══════════════════════════════════════════════════════════════════════

import type { Character } from '../../engine/types'
import type { Cfg } from '../../config/defaultConfig'
import { traitDef } from '../../engine/gameData'
import { Select, Button, fmt } from '../ui'
import { ChoicePicker } from '../Picker'
import { STATUTS } from './logiquePopulation'

export interface PropsLignePersonnage {
  c: Character
  avecMariage: boolean
  /** Mode cité libre : le statut est éditable (les cités libres ne
   *  passent pas au moteur démographique). */
  estCite: boolean
  C: Cfg
  accessibles: string[]
  errors: Record<string, string>
  descMetier: (t: string) => string
  resumeMetier: (t: string) => string
  optionsDon: Array<{ value: string; label: string }>
  optionsMariage: (c: Character) => Array<{ value: string; label: string }>
  changeMetier: (c: Character, metier: string) => void
  changerStatut: (c: Character, v: string) => void
  donnerA: (c: Character, v: string) => void
  marierAvec: (c: Character, v: string) => void
}

export function LignePersonnage({
  c, avecMariage, estCite, C, accessibles, errors,
  descMetier, resumeMetier, optionsDon, optionsMariage,
  changeMetier, changerStatut, donnerA, marierAvec,
}: PropsLignePersonnage) {
  return (
    <tr key={c.id} className={c.statut === 'Décédé' ? 'dead' : (c.metier === C.p.metierDirigeant || c.metier === C.p.metierHeritierStr) ? 'lead' : ''}>
      <td><strong>{c.prenom} {c.nom}</strong></td>
      <td>{c.dynastie}</td>
      <td>{c.sexe}</td>
      <td>{c.age}</td>
      <td>{c.ville}</td>
      <td>{c.culture}</td>
      <td>
        {/* Marqueur (y), retour Thibaut : attribution de métier avec
            DESCRIPTION (gains du métier, noblesse, éducation) AVANT
            le choix — badge du métier actuel + bouton Retirer. */}
        <div className="row" style={{ alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span className={`badge ${c.metier ? 'badge-info' : 'badge-neutral'}`}>
            {c.metier ?? '(sans métier)'}
          </span>
          {c.statut !== 'Décédé' && (
            <ChoicePicker
              bouton="Attribuer…"
              categories={[
                {
                  label: 'Métiers accessibles',
                  options: accessibles
                    .filter((t) => t !== c.metier)
                    .map((t) => ({
                      value: t,
                      metier: t,
                      droite: resumeMetier(t),
                      description: descMetier(t),
                    })),
                },
              ]}
              onPick={(v) => changeMetier(c, v)}
            />
          )}
          {c.metier && c.statut !== 'Décédé' && (
            <Button tone="danger" title="Retirer le métier" onClick={() => changeMetier(c, '')}>✕</Button>
          )}
        </div>
        {errors[c.id] && <div className="neg small">⚠ {errors[c.id]}</div>}
      </td>
      <td className="small" title={c.domicile ? `Logement : ${c.domicile}` : 'Sans domicile — les bâtiments de logement arrivent (vague 3)'}>
        {c.domicile ?? '—'}
      </td>
      <td className="small">
        {(c.traits ?? []).filter(Boolean).map((t) => (
          <span key={t} title={traitDef(t, C.config)?.description || undefined}
            className={`badge ${t === 'Bâtard' || t === 'Consanguin' ? 'badge-bad' : 'badge-neutral'}`}>{t}</span>
        ))}
      </td>
      <td>
        {estCite ? (
          <Select
            value={c.statut}
            options={STATUTS.map((st) => ({ value: st, label: st }))}
            onChange={(v) => changerStatut(c, v)}
          />
        ) : (
          <span className={`badge ${c.statut === 'Sain' ? 'badge-good' : c.statut === 'Décédé' ? 'badge-bad' : 'badge-warn'}`}>
            {c.statut}
          </span>
        )}
      </td>
      <td className="small">{c.mariage ?? '—'}</td>
      <td>{c.fecondite > 0 ? fmt(c.fecondite, 2) : '—'}</td>
      <td className="small">
        {c.statut !== 'Décédé' && (
          <div className="act-row">
            <Select
              value=""
              options={[
                { value: '' as const, label: '➡ Donner à…' },
                ...optionsDon,
              ]}
              onChange={(v) => donnerA(c, v)}
            />
            {avecMariage && (
              <Select
                value=""
                options={[
                  { value: '' as const, label: '💍 Marier avec…' },
                  ...optionsMariage(c),
                ]}
                onChange={(v) => marierAvec(c, v)}
              />
            )}
          </div>
        )}
      </td>
    </tr>
  )
}
