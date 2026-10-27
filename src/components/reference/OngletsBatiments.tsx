// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglets « Bâtiments » (wiki par groupe/rang/famille + bâtiments à
//  effet moteur) et « Aménagements ». Arbitrage Thibaut 2026-10-15
//  conservé : colonnes VILLE / CHÂTEAU, tri par rang puis famille.
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { resumeConstruction, coutConstructionRef } from '../../engine/constructions'
import { fmtCout } from '../pays/pays-utils'
import { Card } from '../ui'

export function OngletBatiments({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <>
      <Card title={`Wiki — bâtiments par groupe, rang et famille (${(cfg.constructions ?? []).filter((c) => c.categorie === 'Bâtiment' && (c.groupe === 'Ville' || c.groupe === 'Château')).length})`}>
        <p className="muted small">
          Effets calculés par le moteur : flux / tour, production d'été (canal
          « Nourr - été »), Garnison (valeur d'état), emplacements de métiers et
          logements apportés. Deux colonnes — VILLE et CHÂTEAU ; tri par RANG
          d'habitation puis par FAMILLE (Militaire, Économique, Guilde,
          Merveille, Capitale).
        </p>
        <div className="refbat-grid">
          {[['Ville', 'VILLES'], ['Château', 'CHÂTEAUX']].map(([groupe, label]) => (
            <div key={groupe}>
              <h3 className="refbat-metier">{label}</h3>
              {(() => {
                const bats = (cfg.constructions ?? [])
                  .filter((c) => c.categorie === 'Bâtiment' && c.groupe === groupe)
                  .sort((a, z) =>
                    ((a.rangMinHabitation ?? 99) - (z.rangMinHabitation ?? 99))
                    || (a.famille ?? '').localeCompare(z.famille ?? '')
                    || a.nom.localeCompare(z.nom))
                const familles: Array<[string, string]> = [
                  ['Militaire', 'Militaire'], ['Economique', 'Économique'],
                  ['Guilde', 'Guilde'],
                  ['Merveille', 'Merveille'], ['Capitale', 'Capitale'],
                ]
                return [1, 2, 3].map((rang) => {
                  const duRang = bats.filter((b) => (b.rangMinHabitation ?? 1) === rang)
                  if (duRang.length === 0) return null
                  return (
                    <div key={rang} className="refbat-rang">
                      <div className="refbat-rang-metier">Rang {rang}</div>
                      {familles.map(([fam, famLabel]) => {
                        const deLaFamille = duRang.filter((b) => (b.famille ?? '') === fam)
                        if (deLaFamille.length === 0) return null
                        return (
                          <div key={fam} className="refbat-famille">
                            <div className="refbat-famille-metier">{famLabel}</div>
                            {deLaFamille.map((b) => (
                              <div key={b.nom} className="refbat-bat">
                                <strong>{b.nom}</strong>
                                <span className="refbat-cout">{fmtCout(coutConstructionRef(b))}</span>
                                <span className="refbat-effets">
                                  {resumeConstruction(b, cfg) || '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              })()}
            </div>
          ))}
        </div>
      </Card>
      <Card title={`Bâtiments à effet moteur (santé, écoles)`}>
        <div className="table-wrap">
          <table className="tbl small">
            <thead><tr><th>Bâtiment</th><th>Maladie (contraction)</th><th>Guérison</th><th>Guérison globale</th><th>Rang école</th></tr></thead>
            <tbody>
              {C.batiments.filter((b) => b.malContraction || b.bonusGuerison || b.bonusGuerisonGlobal || b.ecoleRang).map((b) => (
                <tr key={b.nom}>
                  <td><strong>{b.nom}</strong></td>
                  <td>{b.malContraction || '—'}</td>
                  <td>{b.bonusGuerison || '—'}</td>
                  <td>{b.bonusGuerisonGlobal || '—'}</td>
                  <td>{b.ecoleRang || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

export function OngletAmenagements({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title={`Wiki — aménagements (${(cfg.constructions ?? []).filter((c) => c.categorie === 'Aménagement').length})`}>
      <p className="muted small">
        Effets calculés par le moteur : flux / tour, été, emplacements de métiers
        et logements apportés. Coût réduit par un « Camp de bâtisseurs » présent
        dans la ville (réduction : 5 Or et 1 Bois).
      </p>
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Aménagement</th><th>Terrain</th><th>Coût</th><th>Effets</th></tr></thead>
          <tbody>
            {(cfg.constructions ?? []).filter((c) => c.categorie === 'Aménagement').map((c, i) => (
              <tr key={i}>
                <td><strong>{c.nom}</strong></td>
                <td>{c.terrain || '—'}</td>
                <td>{fmtCout(coutConstructionRef(c))}</td>
                <td>{resumeConstruction(c, cfg) || <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
