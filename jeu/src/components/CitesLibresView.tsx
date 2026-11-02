// ══════════════════════════════════════════════════════════════════════
//  Onglet « 🗼 Cités libres » — cités sans joueur (règle « Cités
//  libres » du référentiel). ORCHESTRATEUR (vague qualité
//  2026-10-24) : les cartes vivent dans src/components/citesLibres/
//  (une carte = un composant, mutations conservées ici et passées
//  par props, docblocks d'arbitrage déplacés avec leur code).
//  Sémantique strictement identique (découpage mécanique).
//    · chaque cité possède sa PROPRE POPULATION (habitants titrés,
//      roturiers OU nobles — les Chasseurs des cités libres produisent
//      1,1 × la Nourriture, la population consomme de la Nourriture
//      comme une ville de joueur). Retour Thibaut (2026-10-14, suite) :
//      la population n'est
//      PLUS gérée ici — elle vit dans l'onglet « 👥 Population »,
//      avec un onglet 🗼 par cité « comme si c'étaient des joueurs »
//      (mêmes tableaux, ajout, métiers, dons et mariages) ;
//    · garnison automatique : 100 + 40 par rang de pays du joueur
//      ayant le plus haut rang (batailles au plateau : manuel) ;
//    · émissaires : suivi manuel des tentatives d'émissaires (une par
//      saison au plateau) — à 3 émissaires, un joueur peut devenir
//      suzerain de la cité ;
//    · suzerain : à chaque fin de tour, la cité verse ses taxes à
//      son suzerain (production nette de ses habitants — métiers ×
//      niveau de taxes, moins leur consommation —, canal « Cités
//      libres » du récap ressources, appliqué automatiquement).
//  Une cité libre compte comme un Serment pour son suzerain
//  (voie Diplomatique : suzerain de 3 cités libres).
// ══════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { useGame } from '../state/store'
import { cfgOf } from '../engine/gameData'
import { citesLibresDe, garnisonCiteLibre } from '../engine/citesLibres'
import type { CiteLibre } from '../engine/types'
import { Card } from './ui'
import { CarteReservesEmissaires } from './citesLibres/CarteReservesEmissaires'
import { CarteRegle } from './citesLibres/CarteRegle'
import { CarteCreation } from './citesLibres/CarteCreation'
import { CarteCite } from './citesLibres/CarteCite'

export function CitesLibresView() {
  const { state, update } = useGame()
  // Joueur acquéreur sélectionné pour chaque cité (annexion → ville)
  const [annexions, setAnnexions] = useState<Record<string, string>>({})
  if (!state) return null
  const C = cfgOf(state.config)
  const cites = citesLibresDe(state)
  const garnison = garnisonCiteLibre(state, C)
  const typesConfig = C.config.citesLibres ?? []
  const typeOptions = typesConfig.map((t) => ({
    value: t.type,
    label: t.type.split('\n')[0].trim(),
  }))
  const cultures = C.cultures.map((c) => c.nom)

  // ── Mutations (via le store, comme les autres vues) ────────────────
  const mutCite = (nom: string, fn: (c: CiteLibre) => void) =>
    update((s) => {
      const c = (s.citesLibres ?? []).find((x) => x.nom === nom)
      if (c) fn(c)
    })

  /** Recrute un émissaire pour un joueur (coût/rythme arbitres au
   *  plateau : la réserve est libre d'édition). */
  const recruterEmissaire = (joueur: number, delta: number) =>
    update((s) => {
      const p = s.players.find((x) => x.n === joueur)
      if (!p) return
      const v = Math.max(0, (p.emissaires ?? 0) + delta)
      const dv = v - (p.emissaires ?? 0)
      p.emissaires = v
      if (dv !== 0) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur,
          texte: `✉ ${p.nom} : réserve d'émissaires ${v} (${dv > 0 ? '+' : ''}${dv}, saisie manuelle).`,
        })
      }
    })

  const supprimerCite = (nom: string) =>
    update((s) => {
      // La population de la cité disparaît AVEC elle (revue
      //  2026-10-16) : une cité détruite/annexée hors « → Ville »
      //  n'a nulle part où aller.
      const cite = (s.citesLibres ?? []).find((c) => c.nom === nom)
      const nbVivants = (cite?.population ?? []).filter((c) => c.statut !== 'Décédé').length
      s.citesLibres = (s.citesLibres ?? []).filter((c) => c.nom !== nom)
      s.log.push({
        turn: s.turn, type: 'Système', joueur: null,
        texte: `🏬 La cité libre ${nom} n'est plus une cité libre (annexée ou détruite)${nbVivants > 0 ? ` — ses ${nbVivants} habitant(s) vivant(s) disparaissent avec elle` : ''}.`,
      })
    })

  const changerEmissaires = (nom: string, joueur: number, delta: number) =>
    update((s) => {
      const c = (s.citesLibres ?? []).find((x) => x.nom === nom)
      if (!c) return
      const p = s.players.find((x) => x.n === joueur)
      if (!p) return
      // Revue 2026-10-15 : les émissaires sont une RESSOURCE du joueur
      //  (p.emissaires) — placer un émissaire dans une cité le DÉPENSE,
      //  le retirer le RECREDITE. Impossible de placer sans réserve.
      const e = c.emissaires ?? (c.emissaires = {})
      const places = e[joueur] ?? 0
      const reserve = p.emissaires ?? 0
      if (delta > 0 && reserve <= 0) return
      const v = Math.max(0, places + delta)
      const dv = v - places
      p.emissaires = Math.max(0, reserve - dv)
      if (v === 0) delete e[joueur]
      else e[joueur] = v
      if (dv !== 0) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur,
          texte: dv > 0
            ? `✉ ${p.nom} place un émissaire à ${c.nom} (réserve : ${p.emissaires}).`
            : `✉ ${p.nom} retire un émissaire de ${c.nom} (réserve : ${p.emissaires}).`,
        })
      }
    })

  const changerSuzerain = (nom: string, v: string) =>
    update((s) => {
      const c = (s.citesLibres ?? []).find((x) => x.nom === nom)
      if (!c) return
      const ancienNom = c.suzerain != null ? s.players.find((p) => p.n === c.suzerain)?.nom : null
      const n = v ? parseInt(v, 10) : null
      const suzNom = n != null ? s.players.find((p) => p.n === n)?.nom : null
      c.suzerain = n
      s.log.push({
        turn: s.turn, type: 'Système', joueur: n ?? null,
        texte: suzNom
          ? `🗼 ${suzNom} devient suzerain de ${nom} — la cité lui verse ses taxes à chaque fin de tour et compte comme un serment.`
          : `🗼 ${nom} n'a plus de suzerain${ancienNom ? ` (fin du serment de ${ancienNom})` : ''}.`,
      })
    })

  return (
    <div className="stack">
      <CarteReservesEmissaires players={state.players} recruterEmissaire={recruterEmissaire} />
      <CarteRegle C={C} garnison={garnison} cites={cites} players={state.players} />
      <CarteCreation typeOptions={typeOptions} typesConfig={typesConfig} cultures={cultures} update={update} />

      {cites.length === 0 && (
        <Card>
          <p className="muted">
            Aucune cité libre pour l'instant. Créez-en une ci-dessus lorsqu'une habitation
            devient libre (perdue par tout autre moyen que l'action directe d'un autre joueur).
          </p>
        </Card>
      )}
      <div className="cl-grid">
      {cites.map((cite) => (
        <CarteCite
          key={cite.nom}
          cite={cite}
          state={state}
          C={C}
          garnison={garnison}
          typeOptions={typeOptions}
          typesConfig={typesConfig}
          cultures={cultures}
          annexions={annexions}
          setAnnexions={setAnnexions}
          mutCite={mutCite}
          supprimerCite={supprimerCite}
          changerEmissaires={changerEmissaires}
          changerSuzerain={changerSuzerain}
          update={update}
        />
      ))}
      </div>

    </div>
  )
}
