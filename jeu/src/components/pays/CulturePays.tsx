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
//  en attente (à choisir par le pontife de la culture).
//  (2e séance du 30/10, RETOUR DES DOGMES DÉFINITIFS — table des
//  12 dogmes retenus par Thibaut) : les dogmes pris s'affichent
//  avec leur description du référentiel, et le PONTIFE
//  choisit INTERACTIVEMENT un dogme par palier en attente (prop
//  `choisir`, branchée par PlayerView sur le mutateur du store —
//  choisirDogme valide et journalise ; les erreurs partent au
//  journal « Système »). Un dogme est unique par culture.
//  (8e RETOUR, 2026-11-01 — arbitrage Thibaut « retire le choix
//  des dogmes de l'onglet pays » : le CHOIX interactif vit
//  désormais UNIQUEMENT dans l'onglet 🕯 Dogmes (DogmesView,
//  5e/7e retours) — la prop `choisir`, les boutons « Choisir »
//  et la mention interactive sont RETIRÉS : cette carte est
//  LECTURE SEULE (Tourisme, paliers, dogmes pris) et renvoie à
//  l'onglet 🕯 Dogmes quand un palier attend un choix. Le
//  mutateur choisirDogme du moteur reste inchangé.)
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from '../../engine/types'
import { cultureDef, type Cfg } from '../../engine/gameData'
import { detailLoisHabitants } from '../../engine/regimes'
import {
  tourismeCulture, nbPaliersDogmes, dogmesCulture,
} from '../../engine/dogmes'
import { Badge, Card, fmt } from '../ui'

export function CulturePays({
  state, p, C,
}: {
  state: GameState
  p: Player
  C: Cfg
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
        const nomJoueur = (n: number) => state.players.find((q) => q.n === n)?.nom ?? `Joueur ${n}`
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
            {/* (8e retour) Plus de choix ici : un simple pointeur vers
                l'onglet 🕯 Dogmes quand un palier attend. */}
            {enAttente > 0 && (
              <div className="muted small">
                {enAttente > 1 ? `${enAttente} paliers franchis` : 'Palier franchi'} — le choix
                du dogme se fait dans l'onglet <strong>🕯 Dogmes</strong>.
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
