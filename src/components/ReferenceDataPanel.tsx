// ══════════════════════════════════════════════════════════════════════
//  Référentiels : consultation et édition des tables du jeu
//  (Titres, Traits, Cultures, Peuples, Bâtiments, Événements, Dynasties).
//  Les modifications s'appliquent à la session en cours ; pour les rendre
//  permanentes, reportez-les dans src/engine/gameData(.2).ts.
// ══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  RESOURCES, TITRES, TRAITS, ORIENTATIONS, CULTURES, PEUPLES, REGIMES,
} from '../engine/gameData'
import { BUILDINGS, EVENTS, DYNASTIES, VICTORY_TEXT } from '../engine/gameData2'
import { Card } from './ui'

const ONGLETS = ['Titres', 'Traits', 'Cultures', 'Peuples', 'Bâtiments', 'Événements', 'Dynasties']

export function ReferenceDataPanel() {
  const [onglet, setOnglet] = useState('Titres')

  return (
    <div className="stack">
      <Card title="Référentiels du jeu (tables du classeur)">
        <div className="tabs">
          {ONGLETS.map((o) => (
            <button key={o} className={`tab ${onglet === o ? 'tab-active' : ''}`} onClick={() => setOnglet(o)}>
              {o}
            </button>
          ))}
        </div>

        {onglet === 'Titres' && (
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr>
                  <th>Titre</th><th>Éducation</th><th>Gain 1</th><th>Gain 2</th>
                  <th>Noble seul</th><th>Genre</th><th>Attribution</th><th>Description</th>
                </tr>
              </thead>
              <tbody>
                {TITRES.map((t) => (
                  <tr key={t.titre}>
                    <td><strong>{t.titre}</strong></td>
                    <td>{t.education || '—'}</td>
                    <td>{t.valeur1} {t.ressource1}</td>
                    <td>{t.valeur2} {t.ressource2}</td>
                    <td>{t.nobleSeul ? 'oui' : 'non'}</td>
                    <td>{t.regleGenre}</td>
                    <td>{t.attribution}</td>
                    <td className="muted">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {onglet === 'Traits' && (
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr>
                  <th>Trait</th><th>Poids</th><th>Vie ±</th><th>Résurrection (1d6 ≥)</th>
                  <th>Fécondité ±</th><th>Héritable</th><th>Mariage ±</th><th>Description</th>
                </tr>
              </thead>
              <tbody>
                {TRAITS.map((t) => (
                  <tr key={t.name}>
                    <td><strong>{t.name}</strong></td>
                    <td>{t.weight}</td>
                    <td>{t.life_delta > 0 ? `+${t.life_delta}` : t.life_delta}</td>
                    <td>{t.resurrection_min_roll || '—'}</td>
                    <td>{t.fert_add > 0 ? `+${t.fert_add}` : t.fert_add}</td>
                    <td>{t.heritable ? 'oui' : 'non'}</td>
                    <td>{t.marriage_mod > 0 ? `+${t.marriage_mod}` : t.marriage_mod}</td>
                    <td className="muted">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {onglet === 'Cultures' && (
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr><th>Culture</th><th>Hérédité</th><th>Martialité</th><th>Homosexualité</th><th>Facteur fécondité</th></tr>
              </thead>
              <tbody>
                {CULTURES.map((c) => (
                  <tr key={c.nom}>
                    <td><strong>{c.nom}</strong></td>
                    <td>{c.heredite}</td>
                    <td>{c.martialite}</td>
                    <td>{c.homoAutorisee ? 'autorisée' : 'interdite'}</td>
                    <td>×{c.fertFactor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {onglet === 'Peuples' && (
          <div className="grid-2">
            {PEUPLES.map((p) => (
              <div key={p.nom} className="mini">
                <strong>{p.nom}</strong>
                <div className="small muted">{p.noms.length} noms · {p.prenomsM.length} prénoms M · {p.prenomsF.length} prénoms F</div>
                <div className="small">Noms : {p.noms.slice(0, 4).join(', ')}…</div>
                <div className="small">Prénoms M : {p.prenomsM.slice(0, 4).join(', ')}…</div>
                <div className="small">Prénoms F : {p.prenomsF.slice(0, 4).join(', ')}…</div>
              </div>
            ))}
          </div>
        )}

        {onglet === 'Bâtiments' && (
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr><th>Bâtiment</th><th>Catégorie</th><th>Rang école</th><th>Maladie (contraction)</th><th>Guérison</th><th>Guérison globale</th><th>Effet</th></tr>
              </thead>
              <tbody>
                {BUILDINGS.map((b) => (
                  <tr key={b.nom}>
                    <td><strong>{b.nom}</strong></td>
                    <td>{b.categorie}</td>
                    <td>{b.ecoleRang || '—'}</td>
                    <td>{b.malContraction || '—'}</td>
                    <td>{b.bonusGuerison || '—'}</td>
                    <td>{b.bonusGuerisonGlobal || '—'}</td>
                    <td className="muted">{b.effet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {onglet === 'Événements' && (
          <div className="table-wrap">
            <table className="tbl small">
              <thead>
                <tr><th>Événement</th><th>Saison</th><th>Poids</th><th>Dangereux (≤5)</th><th>Moyen (6-8)</th><th>Fort (9-10)</th><th>Extrême (11+)</th></tr>
              </thead>
              <tbody>
                {EVENTS.map((e) => (
                  <tr key={e.nom}>
                    <td><strong>{e.nom}</strong></td>
                    <td>{e.saison}</td>
                    <td>{e.poids}</td>
                    <td className="muted">{e.faible}</td>
                    <td className="muted">{e.moyenne}</td>
                    <td className="muted">{e.forte}</td>
                    <td className="muted">{e.extreme}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {onglet === 'Dynasties' && (
          <div className="grid-2">
            {DYNASTIES.map((d) => (
              <div key={d.nom} className="mini">
                <div className="mini-title">{d.nom}</div>
                <div className="small muted">{d.description}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Aide-mémoire">
        <div className="grid-2 small">
          <div>
            <strong>Ressources ({RESOURCES.length}) :</strong> {RESOURCES.join(', ')}
          </div>
          <div>
            <strong>Orientations (1d20) :</strong>{' '}
            {ORIENTATIONS.map((o) => `${o.nom} ×${o.poids}%`).join(' · ')}
          </div>
          <div>
            <strong>Régimes :</strong> {REGIMES.map((r) => r.nom).join(', ')}
          </div>
          <div>
            <strong>Conditions de victoire :</strong>
            <ul>{VICTORY_TEXT.map((v) => <li key={v.nom}>{v.nom} — {v.texte}</li>)}</ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
