// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglets « Cultures & régimes », « Tourisme » et
//  « Cités libres ». (Dogmes retirés du référentiel le 2026-10-24,
//  retour arbitre Thibaut — l'onglet redevient « Tourisme », la
//  carte « Dogmes » disparaît.)
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { Card } from '../ui'

export function OngletsCulturesRegimes({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <>
      <Card title={`Wiki — cultures (${cfg.cultures.length})`}>
        <p className="muted small">
          Lois chiffrées appliquées à chaque fin de tour : +N ressource par habitation de
          cette culture dans le monde (capitale), +N Science par construction.
        </p>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr>
                <th>Culture</th><th>Hérédité</th><th>Homo autorisée</th>
                <th>Fécondité</th><th>Nourr / hab (monde)</th>
                <th>Tourisme / hab</th><th>Or / hab</th>
                <th>Science / constr.</th><th>Règle du pays</th><th>Règle des personnages</th>
              </tr>
            </thead>
            <tbody>
              {cfg.cultures.map((t, i) => (
                <tr key={i}>
                  <td><strong>{t.nom}</strong></td>
                  <td>{t.heredite}</td>
                  <td>{t.homoAutorisee ? 'oui' : 'non'}</td>
                  <td>×{t.fertFactor}</td>
                  <td>{t.capitalNourrParHabMonde || '—'}</td>
                  <td>{t.capitalTourismeParHabMonde || '—'}</td>
                  <td>{t.capitalOrParHabMonde || '—'}</td>
                  <td>{t.scienceParConstruction || '—'}</td>
                  <td className="muted">{t.reglePays || '—'}</td>
                  <td className="muted">{t.reglePerso || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title={`Wiki — régimes politiques (${cfg.regimes.length})`}>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr>
                <th>Régime</th><th>Loi</th>
                <th>Garnison / rang d'habitation</th>
                <th>Nourriture été / champ & rizière</th>
              </tr>
            </thead>
            <tbody>
              {cfg.regimes.map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.nom}</strong></td>
                  <td>{r.loi || '—'}</td>
                  <td>{r.garnisonParRang || '—'}</td>
                  <td>{r.nourrEteChampRiziere || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

export function OngletTourisme({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title="Seuils de tourisme">
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Seuil</th><th>Bonus</th></tr></thead>
          <tbody>
            {cfg.tourismeSeuils.map((t, i) => (
              <tr key={i}><td>{t.seuil}</td><td>{t.bonus}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function OngletCitesLibres({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title="Cités libres">
      <p className="small muted">{cfg.regleCitesLibres}</p>
      <div className="grid-2">
        {cfg.citesLibres.map((c, i) => (
          <div key={i} className="mini">
            <strong>{c.type}</strong>
            <div className="small">{c.effet}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
