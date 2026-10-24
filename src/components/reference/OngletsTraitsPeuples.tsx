// ══════════════════════════════════════════════════════════════════════
//  VAGUE QUALITÉ (2026-10-24) — extrait de ReferenceDataPanel.tsx.
//  Onglets « Traits gén. » (table des traits génétiques) et
//  « Peuples » (fiches documentaires — système de faction retiré
//  du jeu le 2026-10-19, retour arbitre, cf. docblock d'origine).
//  (RETRAIT 2026-10-24 : les RÈGLES DE FACTIONS partent
//  INTÉGRALEMENT des fiches — retour arbitre « vide toutes les
//  lignes de règles + les descriptions, ne garde que les noms » ;
//  les fiches n'affichent plus que le nom, la structure (champs
//  description/lignes) reste pour les recevoir à nouveau.)
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { Card } from '../ui'

export function OngletTraitsGen({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <Card title={`Traits génétiques (${cfg.traitsGenetiques.length})`}>
      <div className="table-wrap">
        <table className="tbl small">
          <thead>
            <tr><th>#</th><th>Trait</th><th>Poids</th><th>Héritable</th><th>Mariage ±</th><th>Fécondité ±</th><th>Vie ±</th><th>Résurrection</th><th>Description</th></tr>
          </thead>
          <tbody>
            {cfg.traitsGenetiques.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td><strong>{t.name}</strong></td>
                <td>{t.weight}</td>
                <td>{t.heritable ? 'oui' : 'non'}</td>
                <td>{t.marriageMod}</td>
                <td>{t.fertAdd}</td>
                <td>{t.lifeDelta}</td>
                <td>{t.resurrectionMinRoll || '—'}</td>
                <td className="muted">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function OngletPeuples({ C }: { C: Cfg }) {
  const cfg = C.config
  return (
    <>
      {([
        ['Peuples libres (jouables)', cfg.peuplesLibres],
        ['Autres peuples (PNJ du monde)', cfg.peuplesAutres],
      ] as const).map(([metier, liste]) => (
        <Card key={metier} title={metier}>
          <p className="muted small">
            Règles de factions retirées intégralement le 2026-10-24
            (retour arbitre) : seuls les noms des peuples sont conservés,
            les fiches sont vides — à redéfinir par l'arbitre.
          </p>
          {liste.map((p) => (
            <div key={p.nom} className="fiche-peuple">
              <div className="fiche-peuple-title">{p.nom}</div>
              <div className="small muted">{p.description}</div>
              {(p.reglesBase || p.ageII || p.ageIII) ? (
                <>
                  <div className="frule-row">
                    {(p.reglesBase ?? []).map((r) => (
                      <div key={r.nom} className="frule frule-muted">
                        <div className="frule-title">{r.nom}</div>
                        <div className="frule-text">{r.texte}</div>
                      </div>
                    ))}
                  </div>
                  <div className="frule-age"><strong>Âge II</strong> <span className="muted small">— choisir 1 règle parmi 3 à la montée d'âge</span></div>
                  <div className="frule-row">
                    {(p.ageII ?? []).map((r) => (
                      <div key={r.nom} className="frule frule-age2">
                        <div className="frule-title">{r.nom}</div>
                        <div className="frule-text">{r.texte}</div>
                      </div>
                    ))}
                  </div>
                  <div className="frule-age"><strong>Âge III</strong> <span className="muted small">— choisir 1 règle parmi 3 à la montée d'âge</span></div>
                  <div className="frule-row">
                    {(p.ageIII ?? []).map((r) => (
                      <div key={r.nom} className="frule frule-age3">
                        <div className="frule-title">{r.nom}</div>
                        <div className="frule-text">{r.texte}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                p.lignes?.map((l, i) => (
                  <div key={i} className="small"><strong>{l.label} :</strong> {l.texte}</div>
                ))
              )}
            </div>
          ))}
        </Card>
      ))}
    </>
  )
}
