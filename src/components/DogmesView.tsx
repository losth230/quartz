// ══════════════════════════════════════════════════════════════════════
//  Page « Dogmes » (onglet de premier niveau — retour arbitre Thibaut
//  du 30/10, 5e retour : « il faudrait un onglet Dogmes, au même titre
//  qu'un onglet royaume et Pays ») : vue TOUTES CULTURES des dogmes
//  de culture — Tourisme de chaque culture présente, paliers franchis,
//  dogmes pris (descriptions du référentiel), paliers en attente et
//  CHOIX INTERACTIF au PONTIFE de la culture (6e retour 2026-10-30,
//  arbitrage Thibaut « remplace dominant par pontife » ; même
//  mutateur que la carte « Culture du pays » : choisirDogme valide
//  tout seul — palier franchi, non consommé, dogme au référentiel,
//  pontife — et journalise en « Culture » ; un refus part au
//  journal « Système »)
//  + table complète du référentiel (les 12 dogmes et leurs effets
//  moteur, avec les cultures qui les ont pris).
// ══════════════════════════════════════════════════════════════════════

import { useGame } from '../state/store'
import type { GameState } from '../engine/types'
import { cfgOf } from '../engine/gameData'
import {
  tourismeCulture, nbPaliersDogmes, dogmesCulture, joueurPontifeCulture,
  dogmesDisponiblesCulture, choisirDogme,
} from '../engine/dogmes'
import { Badge, Card, fmt } from './ui'

export function DogmesView({ joueur }: { joueur: number }) {
  const { state, update } = useGame()
  if (!state) return null
  const C = cfgOf(state.config)

  // Même mutateur que PlayerView (choisirDogmeJoueur), généralisé à
  //  TOUTE culture : le joueur SÉLECTIONNÉ (barre J1..J8) choisit pour
  //  une culture quand il en est le PONTIFE — choisirDogme valide et
  //  journalise au nom du pontife, un refus part au journal « Système ».
  const choisirDogmeJoueur = (culture: string, palier: number, nom: string) =>
    update((s: GameState) => {
      const t = s.players.find((x) => x.n === joueur)
      if (!t) return
      const err = choisirDogme(s, culture, palier, nom)
      if (err) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur: t.n,
          texte: `⚠ ${err}`,
        })
      }
    })

  // Cultures PRÉSENTES chez les joueurs (arbitrage n°2 : les cités
  //  libres sont hors champ du Tourisme de culture, donc de ses paliers).
  const cultures = [...new Set(state.players.flatMap((q) => q.villes.map((v) => v.culture)))]
  const pas = Math.max(1, C.p.palierTourismeDogme)
  const nomJoueur = (n: number) => state.players.find((q) => q.n === n)?.nom ?? `Joueur ${n}`

  return (
    <div className="stack">
      <Card title="🕯 Dogmes de culture">
        <div className="stack">
          <div>
            À chaque palier de <strong>{pas} de Tourisme</strong> cumulé par une <strong>culture</strong>{' '}
            (toutes les villes de cette culture, tous joueurs, sans les cités libres), le joueur
            ayant le plus de Tourisme dans cette culture — le <strong>pontife</strong> — choisit
            UN dogme pour elle.
          </div>
          <div className="muted small">
            Un dogme à chaque palier ; les dogmes se cumulent à l'infini, ne sont jamais retirés ni
            remplaçables, et un dogme est unique par culture (le cumul porte sur des dogmes
            différents). Dogmes, lois et effets de culture se cumulent. Aucun dogme n'affecte les
            personnages des autres cultures : seuls les habitants de la culture porteuse ou les
            villes de la culture sont touchés.
          </div>
          <div className="muted small">
            Sélectionne un joueur dans la barre ci-dessus : s'il est pontife d'une culture avec un
            palier en attente, le choix interactif apparaît dans la carte de cette culture.
          </div>
        </div>
      </Card>

      {cultures.map((culture) => {
        const tCult = tourismeCulture(state, culture, C)
        const paliersFranchis = nbPaliersDogmes(tCult, C)
        const pris = dogmesCulture(state, culture)
        const enAttente = paliersFranchis - pris.length
        const prochainPalier = (pris.length + 1) * pas
        const pontife = joueurPontifeCulture(state, culture, C)
        const disponibles = dogmesDisponiblesCulture(state, culture, C)
        return (
          <Card key={culture} title={`🛕 ${culture}`}>
            <div className="stack">
              <div>
                <Badge tone={enAttente > 0 ? 'warn' : 'neutral'}>
                  {fmt(tCult)} Tourisme · palier {prochainPalier}
                </Badge>{' '}
                {enAttente > 0
                  ? <Badge tone="warn">{enAttente} dogme(s) à choisir</Badge>
                  : <Badge tone="good">{pris.length} dogme(s) choisi(s)</Badge>}
              </div>
              <div className="muted small">
                Tourisme de la culture {culture} : {fmt(tCult)} (toutes les villes de cette culture,
                tous joueurs, sans les cités libres) — {paliersFranchis} palier(s) franchi(s) tous
                les {pas}, {pris.length} dogme(s) choisi(s). Pontife :{' '}
                {pontife ? <strong>{pontife.joueur.nom}</strong> : '—'}
                {pontife ? ` (${fmt(pontife.tourisme)} Tourisme)` : ''}.
              </div>
              {pris.length > 0 ? pris.map((d) => {
                const ref = (C.config.dogmes ?? []).find((r) => r.nom === d.nom)
                return (
                  <div key={`${d.culture}-${d.palier}`}>
                    <Badge tone="good">Palier {d.palier}</Badge>{' '}
                    <span className="small">
                      dogme « {d.nom} » — choisi par {nomJoueur(d.choisiPar)} (tour {d.choisiAuTour})
                      {ref?.description ? <span className="muted"> — {ref.description}</span> : null}
                      <span className="muted"> Jamais remplaçable.</span>
                    </span>
                  </div>
                )
              }) : <div className="muted small">Aucun dogme choisi pour cette culture.</div>}
              {enAttente > 0 && (
                <div>
                  {pontife && pontife.joueur.n === joueur ? (
                    <>
                      <Badge tone="warn">Palier {prochainPalier} franchi</Badge>{' '}
                      <span className="small">
                        c'est à <strong>toi</strong> de choisir {enAttente > 1 ? `${enAttente} dogmes (un par palier)` : 'un dogme'}
                        {' '}pour la culture {culture}.
                      </span>
                      {disponibles.length === 0 ? (
                        <div className="muted small">
                          Aucun dogme disponible — la table du référentiel est vide ou tous les
                          dogmes sont déjà pris par cette culture.
                        </div>
                      ) : (
                        <div className="stack">
                          {disponibles.map((d) => (
                            <div key={d.nom} className="mini">
                              <strong>{d.nom}</strong>
                              <div className="small">{d.description}</div>
                              <button
                                className="btn btn-small"
                                onClick={() => choisirDogmeJoueur(culture, prochainPalier, d.nom)}
                              >
                                Choisir « {d.nom} » (palier {prochainPalier})
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Badge tone="warn">Palier {prochainPalier} franchi</Badge>{' '}
                      <span className="small">
                        dogme à choisir par{' '}
                        {pontife ? <strong>{pontife.joueur.nom}</strong> : '—'}{' '}
                        (pontife de la culture : le plus de Tourisme).
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        )
      })}

      {/* Table du référentiel — les chiffres lus par le moteur (source
          de vérité), avec les cultures qui ont pris chaque dogme. */}
      <Card title={`Les dogmes du référentiel (${C.config.dogmes?.length ?? 0})`}>
        <div className="table-wrap">
          <table className="tbl small">
            <thead>
              <tr><th>Dogme</th><th>Culture</th><th>Description</th><th>Effets (moteur)</th><th>Pris par</th></tr>
            </thead>
            <tbody>
              {(C.config.dogmes ?? []).map((d, i) => {
                const prises = [...new Set((state.dogmes ?? [])
                  .filter((x) => x.nom === d.nom).map((x) => x.culture))]
                return (
                  <tr key={i}>
                    <td><strong>{d.nom}</strong></td>
                    <td>{d.culture === '*' ? 'toutes' : d.culture}</td>
                    <td className="muted">{d.description}</td>
                    <td className="muted">
                      {(d.effets ?? []).length === 0
                        ? '—'
                        : (d.effets ?? []).map((e) => `${e.type} ${e.valeur > 0 ? '+' : ''}${e.valeur}`).join(' · ')}
                    </td>
                    <td>{prises.length === 0 ? <span className="muted">—</span> : prises.join(', ')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
