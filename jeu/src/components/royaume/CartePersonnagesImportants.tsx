// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de RoyaumeView.tsx.
//  Carte « 👤 Personnages importants » : Dirigeant, Héritier,
//  Professeurs, Commandants, famille royale (vivants de la dynastie
//  du Dirigeant — ou de la carte dynastie en cours s'il n'y a pas de
//  Dirigeant —, roturiers exclus).
// ══════════════════════════════════════════════════════════════════════

import type { Character, Player } from '../../engine/types'
import type { Cfg } from '../../engine/gameData'
import { Card } from '../ui'
import { pers } from './logiqueRoyaume'

export function CartePersonnagesImportants({ p, vivants, C }: {
  p: Player
  vivants: Character[]
  C: Cfg
}) {
  const dirigeant = vivants.find((c) => c.metier === C.p.metierDirigeant)
  const heritier = vivants.find((c) => c.metier === C.p.metierHeritierStr)
  const professeurs = vivants.filter((c) => c.metier === C.p.metierProfesseur)
  const commandants = vivants.filter((c) => c.metier === C.p.metierCommandant)
  // Famille royale = vivants de la dynastie du Dirigeant (ou de la carte
  // dynastie en cours s'il n'y a pas de Dirigeant), roturiers exclus.
  const dynRoyale = dirigeant?.dynastie ?? p.dynastie?.nom ?? null
  const familleRoyale = dynRoyale && dynRoyale !== C.p.dynastieRoturier
    ? vivants.filter((c) => c.dynastie === dynRoyale)
    : []

  return (
    <Card title="👤 Personnages importants">
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Rôle</th><th>Personnage</th><th>Métier</th><th>Ville</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{C.p.metierDirigeant}</strong></td>
              <td>{dirigeant ? pers(dirigeant) : <span className="neg">poste vacant</span>}</td>
              <td>{dirigeant?.metier ?? '—'}</td>
              <td>{dirigeant?.ville ?? '—'}</td>
            </tr>
            <tr>
              <td><strong>{C.p.metierHeritierStr}</strong></td>
              <td>{heritier ? pers(heritier) : <span className="muted">aucun</span>}</td>
              <td>{heritier?.metier ?? '—'}</td>
              <td>{heritier?.ville ?? '—'}</td>
            </tr>
            <tr>
              <td><strong>{C.p.metierProfesseur}s</strong> ({professeurs.length})</td>
              <td>{professeurs.length ? professeurs.map(pers).join(' · ') : <span className="muted">aucun</span>}</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr>
              <td><strong>{C.p.metierCommandant}s</strong> ({commandants.length})</td>
              <td>{commandants.length ? commandants.map(pers).join(' · ') : <span className="muted">aucun</span>}</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr>
              <td><strong>Famille royale</strong> ({familleRoyale.length})
                <div className="muted small">dynastie {dynRoyale ?? '—'}</div>
              </td>
              <td colSpan={3}>
                {familleRoyale.length
                  ? familleRoyale.map((c) => (
                    <span key={c.id} className="badge badge-info" style={{ marginRight: 4 }}>
                      {pers(c)}{c.metier ? ` — ${c.metier}` : ''}
                    </span>
                  ))
                  : <span className="muted">aucun membre vivant</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
