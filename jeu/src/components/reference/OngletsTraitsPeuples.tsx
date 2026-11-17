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
//  (2026-11-17, retour Thibaut « dans le référentiel, les
//  descriptions des bonus de faction n'ont aucun sens » : l'onglet
//  annonçait encore « fiches vides / factions retirées » alors que
//  la fiche MOTEUR des Khazhags Nains existe (effetsPeuple +
//  talentsPeuple, arbitrages 2026-11-16/17) — et AUCUNE surface du
//  jeu ne la montrait. La fiche peuple est maintenant rendue depuis
//  les DONNÉES : EFFET DE BASE (table effetsPeuple, actif dès le
//  setup) puis TALENTS groupés par voie et triés par Laurier
//  (table talentsPeuple, actifs selon les Lauriers validés).)
// ══════════════════════════════════════════════════════════════════════

import type { Cfg } from '../../engine/gameData'
import { peupleEffetDef } from '../../engine/gameData'
import { talentsPeupleDef, type TalentPeupleDef } from '../../engine/talentsPeuple'
import { Card } from '../ui'

/** Chiffres romains des Lauriers (I à V — 5 Lauriers par voie depuis
 *  la refonte du 2026-11-16). */
const ROMAINS_LAURIERS = ['I', 'II', 'III', 'IV', 'V']

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
            Les fiches vivent dans le référentiel, comme tout le wiki :
            EFFET DE BASE (table effetsPeuple, actif dès le setup) et
            TALENTS (table talentsPeuple, actifs selon les Lauriers
            validés sur la voie). Un peuple sans fiche moteur n'en a
            aucun — les champs libres ci-dessous restent à la main de
            l'arbitre (description, lignes de classeur).
          </p>
          {liste.map((p) => {
            const effet = peupleEffetDef(p.nom, cfg)
            const talents = talentsPeupleDef(p.nom, cfg)
            // talents groupés par VOIE (ordre de première apparition
            //  au référentiel), triés par Laurier croissant dans la
            //  voie — la fiche Khazhags se lit : Économique I/III,
            //  Scientifique I, Militaire I/III.
            const parVoie: Array<[string, TalentPeupleDef[]]> = []
            for (const t of talents) {
              const groupe = parVoie.find(([voie]) => voie === t.voie)
              if (groupe) groupe[1].push(t)
              else parVoie.push([t.voie, [t]])
            }
            for (const [, groupe] of parVoie) groupe.sort((a, z) => a.laurierMin - z.laurierMin)
            return (
            <div key={p.nom} className="fiche-peuple">
              <div className="fiche-peuple-title">{p.nom}</div>
              <div className="small muted">{p.description}</div>
              {effet ? (
                <div className="small">
                  <strong>Effet de base :</strong> {effet.effet}
                </div>
              ) : null}
              {parVoie.map(([voie, groupe]) => (
                <div key={voie} className="frule frule-muted">
                  <div className="frule-title">Talents {voie}</div>
                  {groupe.map((t) => (
                    <div key={t.nom} className="frule-text">
                      <strong>Laurier {ROMAINS_LAURIERS[t.laurierMin - 1] ?? t.laurierMin} — {t.nom} :</strong> {t.texte}
                    </div>
                  ))}
                </div>
              ))}
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
            )
          })}
        </Card>
      ))}
    </>
  )
}
