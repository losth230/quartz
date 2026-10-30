// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglets « Cultures & régimes », « Tourisme » et
//  « Cités libres ». (Dogmes retirés du référentiel le 2026-10-24,
//  retour arbitre Thibaut — l'onglet redevient « Tourisme », la
//  carte « Dogmes » disparaît. RETOUR DES DOGMES DÉFINITIFS le
//  2026-10-30 : la carte « Dogmes de culture » revient dans
//  l'onglet Tourisme — table des 12 dogmes retenus par Thibaut,
//  choisis en jeu par le pontife de chaque culture, cf.
//  engine/dogmes.ts.)
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { Card } from '../ui'

export function OngletsCulturesRegimes({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <>
      <Card title={`Wiki — cultures (${cfg.cultures.length})`}>
        <p className="muted small">
          Refonte « 12 lois » (2026-10-29) : chaque culture porte une LOI DE VILLE (culture
          majoritaire de la cité — logements, emplacements, fermiers d'été, routes, garnison)
          et une LOI D'HABITANT (culture propre de chaque personnage, où qu'il vive).
        </p>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr>
                <th>Culture</th><th>Hérédité</th><th>Homo autorisée</th>
                <th>Fécondité</th><th>Loi de ville</th><th>Loi d'habitant</th>
              </tr>
            </thead>
            <tbody>
              {cfg.cultures.map((t, i) => (
                <tr key={i}>
                  <td><strong>{t.nom}</strong></td>
                  <td>{t.heredite}</td>
                  <td>{t.homoAutorisee ? 'oui' : 'non'}</td>
                  <td>×{t.fertFactor}</td>
                  <td className="muted">{t.regleVille || '—'}</td>
                  <td className="muted">{t.regleHabitant || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title={`Wiki — régimes politiques (${cfg.regimes.length})`}>
        <p className="muted small">
          (Refonte « 8 lois », 2026-10-29) : chaque régime porte deux lois, lues
          automatiquement par le moteur là où elles agissent — plus aucune loi de
          régime ne passe par la banque.
        </p>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr>
                <th>Régime</th><th>Loi</th>
                <th>Conscription (−Or / rang du pays)</th>
                <th>Frontières closes (× départs)</th>
                <th>Terre d'accueil (Or / migrant)</th>
                <th>Redistribution (bourgeois)</th>
                <th>Redistribution (noble)</th>
                <th>Pouvoir du peuple (+Bonheur / habitation)</th>
                <th>Vassaux dévoués (× tribut reçu)</th>
              </tr>
            </thead>
            <tbody>
              {cfg.regimes.map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.nom}</strong></td>
                  <td>{r.loi || '—'}</td>
                  <td>{r.leveeOrParRangPays ?? '—'}</td>
                  <td>{r.departHabitantsMult ?? '—'}</td>
                  <td>{r.orParMigrant ?? '—'}</td>
                  <td>{r.consoNourrBourgeoisRegime ?? '—'}</td>
                  <td>{r.consoNourrNobleRegime ?? '—'}</td>
                  <td>{r.bonheurParHabitation ?? '—'}</td>
                  <td>{r.tributVassalMult ?? '—'}</td>
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
    <>
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
      {/* RETOUR DES DOGMES (2026-10-30) : la carte « Dogmes » retirée du
          wiki le 2026-10-24 revient — elle montre la table du
          référentiel (les chiffres lus par le moteur, source de
          vérité), PAS les dogmes pris en jeu (ça vit sur la page Pays
          de chaque joueur). */}
      <Card title={`Dogmes de culture (${cfg.dogmes?.length ?? 0})`}>
        <p className="muted small">
          À chaque palier de {Math.max(1, C.p.palierTourismeDogme)} de Tourisme cumulé par une
          culture (toutes les villes de la culture, tous joueurs, sans les cités libres),
          le joueur ayant le plus de Tourisme dans cette culture choisit UN dogme — les dogmes
          se cumulent à l'infini et ne sont jamais remplaçables.
        </p>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr><th>Dogme</th><th>Culture</th><th>Description</th><th>Effets (moteur)</th></tr>
            </thead>
            <tbody>
              {(cfg.dogmes ?? []).map((d, i) => (
                <tr key={i}>
                  <td><strong>{d.nom}</strong></td>
                  <td>{d.culture === '*' ? 'toutes' : d.culture}</td>
                  <td className="muted">{d.description}</td>
                  <td className="muted">
                    {(d.effets ?? []).length === 0
                      ? '—'
                      : (d.effets ?? []).map((e) => `${e.type} ${e.valeur > 0 ? '+' : ''}${e.valeur}`).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
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
