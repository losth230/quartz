// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglets « Métiers » : table des métiers (gains, règles de genre,
//  attribution) + effets de métier et coûts de révocation.
//  Sémantique strictement identique (découpage mécanique).
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { Card, Badge } from '../ui'

export function OngletsMetiers({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <>
      <Card title={`Métiers (${cfg.metiers.length})`}>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr><th>Métier</th><th>Gain 1 / tour</th><th>Gain 2 / tour</th><th>Noble seul</th><th>Genre</th><th>Attribution</th><th>Description</th></tr>
            </thead>
            <tbody>
              {cfg.metiers.map((t) => (
                <tr key={t.metier}>
                  <td><strong>{t.metier}</strong></td>
                  <td>{t.valeur1 ? `${t.valeur1} ${t.ressource1}${t.ete ? ' (été)' : ''}` : '—'}</td>
                  <td>{t.valeur2 ? `${t.valeur2} ${t.ressource2}` : '—'}</td>
                  <td>{t.nobleSeul ? <Badge tone="info">oui</Badge> : 'non'}</td>
                  <td>{t.regleGenre || '—'}</td>
                  <td>{t.attribution || '—'}</td>
                  <td className="muted">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Effets de métier & coûts de révocation">
        {cfg.metiersEffets.map((t, i) => (
          <div key={i} className="mini">
            <strong>{t.metier || '—'}</strong>
            <div className="small">{t.effet}</div>
            <div className="small muted">Révocation : {t.revocation || '—'}</div>
          </div>
        ))}
      </Card>
    </>
  )
}
