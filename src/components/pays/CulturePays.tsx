// ══════════════════════════════════════════════════════════════════════
//  Culture du pays (refonte « 12 lois », 2026-10-29) : loi de VILLE et
//  loi d'HABITANT de la culture du pays (textes du référentiel) + badges
//  des lois d'habitant réellement ACTIVES dans la population vivante
//  (detailLoisHabitants — nobles « Foi supérieure » /
//  « Conseil des Sages », gardes « Corps de fer »).
//  REMPLACÉ l'ancienne carte « bonus automatiques » (règle de pays
//  +N par habitation de cette culture dans le monde, retirée avec la
//  refonte — historique git). (Extrait de PlayerView.tsx — un
//  fichier par UI.)
//
//  (2026-10-30, fondations « dogmes de culture » — arbitrages
//  Thibaut, cf. engine/dogmes.ts) : section DOGMES — Tourisme de la
//  culture (tous joueurs), palier en cours, dogmes pris et palier
//  en attente (à choisir par le joueur dominant de la culture).
//  (2e séance du 30/10, RETOUR DES DOGMES DÉFINITIFS — table des
//  12 dogmes retenus par Thibaut) : les dogmes pris s'affichent
//  avec leur description du référentiel, et le joueur DOMINANT
//  choisit INTERACTIVEMENT un dogme par palier en attente (prop
//  `choisir`, branchée par PlayerView sur le mutateur du store —
//  choisirDogme valide et journalise ; les erreurs partent au
//  journal « Système »). Un dogme est unique par culture.
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from '../../engine/types'
import { cultureDef, type Cfg } from '../../engine/gameData'
import { detailLoisHabitants } from '../../engine/regimes'
import {
  tourismeCulture, nbPaliersDogmes, dogmesCulture, joueurDominantCulture,
  dogmesDisponiblesCulture,
} from '../../engine/dogmes'
import { Badge, Card, fmt } from '../ui'

export function CulturePays({
  state, p, C, choisir,
}: {
  state: GameState
  p: Player
  C: Cfg
  /** Mutateur du choix de dogme (PlayerView) — absent : carte de
   *  lecture seule (tests de rendu). */
  choisir?: (palier: number, nom: string) => void
}) {
  return (
    <Card title="🛕 Culture du pays — lois des cultures">
      {(() => {
        const cult = cultureDef(p.culture, C.config)
        const lois = detailLoisHabitants(state, p, C)
        const traits = cult
          ? `hérédité ${String(cult.heredite).toLowerCase()} · mariages homosexuels ${cult.homoAutorisee ? 'autorisés' : 'interdits'}`
          : ''
        // ── Dogmes de culture (fondations 2026-10-30) ──
        const pas = Math.max(1, C.p.palierTourismeDogme)
        const tCult = tourismeCulture(state, p.culture, C)
        const paliersFranchis = nbPaliersDogmes(tCult, C)
        const pris = dogmesCulture(state, p.culture)
        const enAttente = paliersFranchis - pris.length
        const prochainPalier = (pris.length + 1) * pas
        const dominant = joueurDominantCulture(state, p.culture, C)
        const nomJoueur = (n: number) => state.players.find((q) => q.n === n)?.nom ?? `Joueur ${n}`
        // Dogmes du référentiel encore disponibles au choix de cette
        //  culture (génériques '*' inclus, déjà pris exclus).
        const disponibles = dogmesDisponiblesCulture(state, p.culture, C)
        return (
          <div className="stack">
            <div>
              <strong>{p.culture}</strong>
              {cult?.regleVille && <span className="muted small"> — loi de ville : {cult.regleVille}</span>}
            </div>
            {cult?.regleHabitant && (
              <div className="muted small">Loi d'habitant : {cult.regleHabitant}</div>
            )}
            {traits && <div className="muted small">{traits}</div>}
            {lois.length > 0 ? lois.map((d, i) => (
              <div key={i}>
                <Badge tone="good">+{fmt(d.total)} {d.res} / tour</Badge>{' '}
                <span className="muted small">
                  loi d'habitant « {d.loi} » ({d.culture}) : +{fmt(d.parHab)} × {d.nb} habitant(s) de cette culture chez toi.
                </span>
              </div>
            )) : null}
            <div className="muted small">
              Les lois de ville suivent la culture majoritaire de chaque cité ; les lois
              d'habitant suivent la culture propre de chaque personnage, où qu'il vive.
            </div>
            <div>
              <strong>Dogmes de la culture</strong>{' '}
              <Badge tone={enAttente > 0 ? 'warn' : 'neutral'}>
                {fmt(tCult)} Tourisme · palier {prochainPalier}
              </Badge>
              <div className="muted small">
                Tourisme de la culture {p.culture} : {fmt(tCult)} (toutes les villes de cette
                culture, tous joueurs, sans les cités libres) — {paliersFranchis} palier(s)
                franchi(s) tous les {pas}, {pris.length} dogme(s) choisi(s).
              </div>
            </div>
            {pris.length > 0 ? pris.map((d) => {
              // Description du référentiel (effets réels branchés moteur
              //  — la table est la source de vérité des chiffres).
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
            }) : null}
            {enAttente > 0 && (
              <div>
                {dominant && dominant.joueur.n === p.n ? (
                  <>
                    <Badge tone="warn">Palier {prochainPalier} franchi</Badge>{' '}
                    <span className="small">
                      c'est à <strong>toi</strong> de choisir {enAttente > 1 ? `${enAttente} dogmes (un par palier)` : 'un dogme'}
                      {' '}pour la culture {p.culture}.
                    </span>
                    {choisir ? (
                      <div className="stack">
                        {disponibles.length === 0 ? (
                          <div className="muted small">
                            Aucun dogme disponible — la table du référentiel est vide ou tous
                            les dogmes sont déjà pris par cette culture.
                          </div>
                        ) : disponibles.map((d) => (
                          <div key={d.nom} className="mini">
                            <strong>{d.nom}</strong>
                            <div className="small">{d.description}</div>
                            <button
                              className="btn btn-small"
                              onClick={() => choisir(prochainPalier, d.nom)}
                            >
                              Choisir « {d.nom} » (palier {prochainPalier})
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Badge tone="warn">Palier {prochainPalier} franchi</Badge>{' '}
                    <span className="small">
                      dogme à choisir par{' '}
                      {dominant ? <strong>{dominant.joueur.nom}</strong> : '—'}{' '}
                      (joueur dominant de la culture : le plus de Tourisme).
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="muted small">
              Dogmes : un dogme à chaque palier de Tourisme de la culture, choisi par le joueur
              ayant le plus de Tourisme dans cette culture ; les dogmes se cumulent à l'infini et
              ne sont jamais remplaçables ; dogmes, lois et effets de culture se cumulent.
            </div>
          </div>
        )
      })()}
    </Card>
  )
}
