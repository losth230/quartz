// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglet « Progrès » : arbres de progrès par âge (branches A/B +
//  tech C optionnelle). Règles d'arborescence conservées dans
//  l'intitulé (tech 2 exige tech 1, tech C exige les 2 techs d'une
//  même branche, 3 arbres de l'âge N-1 ouvrent l'âge N).
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { Card } from '../ui'
import { fmtEffetTech } from './logiqueReference'

export function OngletProgres({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title={`Wiki — arbres de progrès (${cfg.progres.length})`}>
      <p className="muted small">
        Tech 2 exige la tech 1 de sa branche ; tech C exige les 2 techs d'une même branche ;
        arbre terminé à 3 technologies ; 3 arbres de l'âge N-1 ouvrent l'âge N.
      </p>
      {[1, 2, 3].map((age) => (
        <div key={age} className="mb">
          <h4>Âge {age}</h4>
          {cfg.progres.every((a) => a.age !== age) && (
            <p className="muted small">Aucun arbre à cet âge.</p>
          )}
          {cfg.progres.map((arbre, i) => arbre.age !== age ? null : (
            <div key={i} className="mini mb">
              <div className="row">
                <strong>{arbre.nom}</strong>
                {arbre.tags ? <span className="muted small">{arbre.tags}</span> : null}
              </div>
              <div className="table-wrap">
                <table className="tbl small">
                  <thead><tr><th>Emplacement</th><th>Technologie</th><th>Coût (Science)</th><th>Description (effet)</th><th>Effets (aide de jeu)</th></tr></thead>
                  <tbody>
                    {([['A.1', 'brancheA', 0], ['A.2', 'brancheA', 1], ['B.1', 'brancheB', 0], ['B.2', 'brancheB', 1]] as [string, 'brancheA' | 'brancheB', number][]).map(([label, br, idx]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td><strong>{arbre[br][idx]?.nom || '—'}</strong></td>
                        <td>{arbre[br][idx]?.cout || '—'}</td>
                        <td>{arbre[br][idx]?.description || '—'}</td>
                        <td>{(arbre[br][idx]?.effets ?? []).map(fmtEffetTech).join(' · ') || <span className="muted">—</span>}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>C (optionnelle)</td>
                      <td><strong>{arbre.techC?.nom || '—'}</strong></td>
                      <td>{arbre.techC?.cout || '—'}</td>
                      <td>{arbre.techC?.description || '—'}</td>
                      <td>{(arbre.techC?.effets ?? []).map(fmtEffetTech).join(' · ') || <span className="muted">—</span>}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </Card>
  )
}
