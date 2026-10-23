// ══════════════════════════════════════════════════════════════════════
//  CARTE « 🏘️ Métiers et places par ville » (vague qualité 2026-10-24) :
//  extraite de PopulationTable.tsx, sémantique identique. Écran
//  vague 2 UI (rework habitants 2026-10-20) : par ville, une ligne
//  par métier occupé ou plafonné — en poste, capacité, places
//  libres — la ligne Sans-emploi (rôle neutre : impôt nul, aucun
//  effet) est toujours présente. Helper moteur
//  occupationsMetierVille (testé).
// ══════════════════════════════════════════════════════════════════════

import type { Character, City, GameState } from '../../engine/types'
import type { Cfg } from '../../config/defaultConfig'
import { occupationsMetierVille } from '../../engine/metiers'
import { Card } from '../ui'

export function CarteMetiersPlaces({
  vivants, villesOcc, villesDuJoueur, estCite, C, descMetier, state, joueur,
}: {
  vivants: Character[]
  villesOcc: Array<{ nom: string }>
  villesDuJoueur: City[] | undefined
  estCite: boolean
  C: Cfg
  descMetier: (t: string) => string
  /** Sous-vague 3b (2026-10-24) : ctx routes commerciales pour les
   *  emplacements de Marchand (+1 par route, chaque côté) — absent
   *  pour une cité libre (hors du champ des caps). */
  state?: GameState
  joueur?: number
}) {
  // ctx optionnel : les routes ne comptent que pour une ville de joueur.
  const ctx = state !== undefined && joueur !== undefined ? { state, joueur } : undefined
  return (
    <Card title="🏘️ Métiers et places par ville">
      <div className="table-wrap">
        <table className="tbl small">
          <thead><tr><th>Ville</th><th>Métier</th><th>En poste</th><th>Places max</th><th>Places libres</th><th>Vivants</th></tr></thead>
          <tbody>
            {villesOcc.map((v) => {
              const habitants = vivants.filter((c) => c.ville === v.nom)
              const villeObj = villesDuJoueur?.find((vv) => vv.nom === v.nom) ?? null
              const lignes = occupationsMetierVille(habitants, villeObj, C, ctx)
              return lignes.map((l, i) => (
                <tr key={`${v.nom}-${l.metier ?? 'sans'}`}>
                  <td>
                    {i === 0
                      ? <strong>{v.nom}{villeObj?.type ? ` (${villeObj.type})` : estCite ? ' (cité libre)' : ''}</strong>
                      : <span className="muted">〃</span>}
                  </td>
                  <td>
                    <span
                      className={`badge ${l.metier ? 'badge-info' : 'badge-neutral'}`}
                      title={l.metier ? (descMetier(l.metier) || undefined) : 'Sans-emploi : rôle neutre — impôt nul, aucun effet'}
                    >
                      {l.metier ?? 'Sans-emploi'}
                    </span>
                  </td>
                  <td>{l.enPoste}</td>
                  <td>{Number.isFinite(l.cap) ? l.cap : '∞'}</td>
                  <td>
                    {Number.isFinite(l.cap)
                      ? <span className={l.cap - l.enPoste < 0 ? 'neg' : ''}>{l.cap - l.enPoste}</span>
                      : <span className="muted">—</span>}
                  </td>
                  <td>{i === 0 ? habitants.length : ''}</td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Vague 3b — caps CUMULATIVES : cap d'un métier = BASE DU RANG d'habitation
        (colonne « Métiers disponibles », ex. Hameau : 50 Chasseurs, 2 Gardes,
        1 Commerçant, 1 Gouverneur) + EMPLACEMENTS des bâtiments et aménagements de
        la ville (ex. Poste de garde : +4 Garde). Les métiers sans base, sans
        emplacement et non productifs (Banquier, Troubadour, Dirigeant/Héritier,
        rôles de cour/armée) ne sont pas plafonnés ici (∞ = règles propres) ;
        chaque route commerciale ouvre +1 emplacement de Marchand de chaque
        côté (sous-vague 3b « routes dissociées », 2026-10-24 — plus de
        marchand titulaire : les emplacements des routes sont portés par le
        cap lui-même). La
        réaffectation automatique tourne à chaque fin de tour : surnombre →
        les plus âgés passent Sans-emploi ; places libres (ordre « n'importe quel
        métier → Chasseur → sans métier ») → les Sans-emploi adultes prennent un
        poste (autre que Chasseur en priorité ; jamais les postes nobles ni les
        nominations d'école/armée) et les Chasseurs CHANGENT de métier dès qu'un
        autre poste est disponible — le Chasseur n'est jamais qu'un poste de
        repli. Les cités libres ne sont pas concernées par les caps.
      </p>
    </Card>
  )
}
