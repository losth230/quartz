// ══════════════════════════════════════════════════════════════════════
//  Page « Pays » (vue joueur) — ASSEMBLAGE des cartes :
//   · ressources : BARRE FLOTTANTE MINIMALISTE en haut de la page,
//     OUVERTE par défaut (retour Thibaut 2026-10-14) — stock modifiable,
//     production / tour CALCULÉE (base + habitants + bâtiments +
//     aménagements + autres + régimes & cultures + vassalité) —
//     invariant : stock du tour N = stock du tour N−1 + production
//     par tour,
//   · culture du pays — encadré « bonus automatiques » : règle de pays
//     chiffrée (ex. Lunisme : +4 Tourisme par ville luniste dans le
//     monde) avec le nombre de villes de cette culture et le bonus
//     adapté en conséquence (appliqué à chaque fin de tour, canal
//     « régimes & cultures » du récap ressources ; +N Science par
//     construction crédité à la construction),
//   · villes : rang d'habitation, AMÉNAGEMENTS au-dessus des
//     BÂTIMENTS, puis catégorie AUTRES — coût, production et
//     description EXACTS du référentiel (table `constructions`),
//     coût déduit du stock à la construction (+ Science par
//     construction selon la règle de culture, ex. Déisme),
//   · récap des ressources par tour : chaque ressource et D'OÙ elle
//     provient (tableau canal par canal + origine de chaque apport),
//   · récap ressources du dernier tour (apports cumulés, canal
//     « régimes & cultures » inclus),
//   · récap démographique.
//  Le cadre « Joueur N » (identité du joueur) vit sur la page
//  « Royaume ».
//
//  REFACTOR « UN FICHIER PAR UI » (2026-10-19, retour de revue
//  critique n°2 : le monolithe de ~1960 lignes a été découpé — chaque
//  CARTE de la page vit dans son propre fichier sous components/pays/,
//  ce fichier ne conserve que l'ASSEMBLAGE, l'état partagé (choix du
//  Surintendant des finances) et les calculs mémoïsés communs à
//  plusieurs cartes. Le corps de chaque carte est INCHANGÉ
//  (extraction byte à byte, indentée) ; la logique de construction
//  (construire + sélecteur par famille) vit dans pays/Constructions.ts.
// ══════════════════════════════════════════════════════════════════════

import React from 'react'
import { useGame } from '../state/store'
import type { GameState, Player } from '../engine/types'
import { cfgOf } from '../engine/gameData'
import { productionDetaillee } from '../engine/production'
import { impotPopulation, impotsVassaux } from '../engine/economie'
import { Card } from './ui'
import { RessourcesBar } from './pays/RessourcesBar'
import { AideAuto } from './pays/AideAuto'
import { CulturePays } from './pays/CulturePays'
import { choisirDogme } from '../engine/dogmes'
import { VillesCarte } from './pays/VillesCarte'
import { CommerceRoutes } from './pays/CommerceRoutes'
import { RecapParTour } from './pays/RecapParTour'
import { RecapDernierTour } from './pays/RecapDernierTour'
import { NotesJoueur } from './pays/NotesJoueur'
export function PlayerView({ joueur }: { joueur: number }) {
  // ── MARQUEUR (a) — RÈGLES DE HOOKS REACT : tous les useState AVANT tout
  //    retour anticipé. Les retours anticipés (`return null`, « Joueur
  //    introuvable ») se trouvaient AVANT ces hooks : si un rendu
  //    passait par un retour anticipé puis un autre par le rendu
  //    complet, l'ORDRE DES HOOKS changeait → erreur React « Rendered
  //    more hooks than during the previous render » → PAGE ENTIÈREMENT
  //    BLANCHE sans message. Les retours sont déplacés SOUS les hooks. ──
  const { state, update } = useGame()
  if (!state) return null
  const C = cfgOf(state.config)
  const p = state.players.find((x) => x.n === joueur)
  if (!p) return <Card>Joueur introuvable.</Card>

  // Le mutateur reçoit (joueur, état) : la population vit dans
  // state.population[joueur], PAS dans le Player (sinon crash « reading »).
  const setPlayer = (fn: (p: Player, s: GameState) => void) =>
    update((s) => {
      const target = s.players.find((x) => x.n === joueur)
      if (target) fn(target, s)
    })

  // ── Dogmes de culture (2e séance du 30/10) : le PONTIFE choisit
  //    un dogme par palier de Tourisme franchi par la culture. Le joueur
  //    est résolu DANS le mutateur (comme faireConstruire) — choisirDogme
  //    valide tout seul (palier franchi, non consommé, dogme au
  //    référentiel, pontife) et journalise en « Culture » ; un refus
  //    part au journal « Système » (la vue ne propose que des choix
  //    valides, ce garde-fou couvre les courses entre vues/joueurs).
  const choisirDogmeJoueur = (palier: number, nom: string) =>
    update((s) => {
      const t = s.players.find((x) => x.n === joueur)
      if (!t) return
      const err = choisirDogme(s, t.culture, palier, nom)
      if (err) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur: t.n,
          texte: `⚠ ${err}`,
        })
      }
    })

  // ── Production / tour détaillée (calculée, non modifiable) ────────────
  // OPTIMISATION RENDU 2026-10-16 : ces calculs parcourent les
  //  populations entières (~4 ms à 16 000 habitants) — mémoïsés par
  //  référence d'état : recalculés seulement quand l'état change,
  //  pas aux re-rendus internes du composant.
  const prodDetail = React.useMemo(
    () => productionDetaillee(state, p, C), [state, p, C])

  // Prévisualisation de l'impôt d'UN tour (population / vassaux) pour
  //  les boutons « Générer l'impôt » de la carte récap.
  const impotPopPrev = React.useMemo(
    () => impotPopulation(state, p, C), [state, p, C])
  const impotsVassPrev = React.useMemo(
    () => impotsVassaux(state, p, C), [state, p, C])

  return (
    <div className="stack">
      {/* Barre Ressources — flottante en haut de la page, ouverte par
          défaut, minimaliste (retour Thibaut 2026-10-14) */}
      <RessourcesBar p={p} C={C} prodDetail={prodDetail} setPlayer={setPlayer} />

      {/* Aide « QU'EST-CE QUI EST COMPTÉ AUTOMATIQUEMENT ? » (marqueur
          (a)) — bloc repliable en tête de page Pays. */}
      <AideAuto />

      {/* Culture du pays : règles de ville/habitant + dogmes (le pontife
          choisit — mutateur choisirDogmeJoueur ci-dessus). */}
      <CulturePays state={state} p={p} C={C} choisir={choisirDogmeJoueur} />

      {/* Villes : aménagements, bâtiments, autres, cultures, taxes. */}
      <VillesCarte
        joueur={joueur} p={p} C={C}
        setPlayer={setPlayer}
      />

      {/* Commerce (marqueur (t)) : routes commerciales dissociées
          (sous-vague 3b, 2026-10-24 — plus de marchand titulaire). */}
      <CommerceRoutes p={p} C={C} />

      {/* Récap des ressources par tour + impôts hors fin de tour. */}
      <RecapParTour
        joueur={joueur} p={p} C={C} prodDetail={prodDetail}
        impotPopPrev={impotPopPrev} impotsVassPrev={impotsVassPrev}
      />

      {/* Récap ressources du dernier tour (apports cumulés). */}
      <RecapDernierTour p={p} C={C} />

      {/* Notes libres du joueur (retour Thibaut 2026-10-15). */}
      <NotesJoueur p={p} setPlayer={setPlayer} />

    </div>
  )
}
