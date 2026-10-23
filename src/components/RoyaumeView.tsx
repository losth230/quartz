// ══════════════════════════════════════════════════════════════════════
//  Page « Royaume » (par joueur) — ORCHESTRATEUR (vague qualité
//  2026-10-24) : le contenu des cartes vit dans
//  src/components/royaume/ (une carte = un composant, logique pure
//  dans logiqueRoyaume.ts, docblocks d'arbitrage déplacés avec leur
//  code). Sémantique strictement identique (découpage mécanique).
//   · cadre « Joueur N » : identité éditable du pays (nom, peuple,
//     culture, régime) — déplacé ici depuis la page « Pays »,
//   · culture du pays (celle de la capitale), régime politique,
//     rang de pays (Féodal / Républicain — feuille « Pays » du
//     classeur) avec sacre, événement de dynastie (carte tirée au
//     hasard à CHAQUE tour — ce n'est pas la famille au pouvoir),
//   · vassaux : prêt de serment à un autre joueur, tribut automatique
//     (paramètre vassalPrelevement, appliqué en fin de tour par le moteur),
//   · personnages importants : Dirigeant, Héritier, Professeurs,
//     Commandants, famille royale.
//  (RETRAIT 2026-10-19, retour arbitre : le cadre « Faction » — fiche du
//   peuple, choix des règles d'Âge II / III — a été retiré avec le
//   système de bonus de faction ; le champ Peuple reste une identité
//   sans effets mécaniques. Système à refaire.)
//  L'arbre généalogique de la famille dirigeante est affiché sur la
//  page « Population ». Les technologies (feuille « Progrès ») sont
//  retirées de cette page — elles restent consultables dans
//  « 📚 Référentiels » → « Progrès ».
// ══════════════════════════════════════════════════════════════════════

import { useGame } from '../state/store'
import type { Player } from '../engine/types'
import { cfgOf } from '../engine/gameData'
import { Card } from './ui'
import { CarteIdentite } from './royaume/CarteIdentite'
import { CarteRoyaume } from './royaume/CarteRoyaume'
import { CarteVassalite } from './royaume/CarteVassalite'
import { CartePersonnagesImportants } from './royaume/CartePersonnagesImportants'

export function RoyaumeView({ joueur }: { joueur: number }) {
  const { state, update } = useGame()
  if (!state) return null
  const C = cfgOf(state.config)
  const p = state.players.find((x) => x.n === joueur)
  if (!p) return <Card>Joueur introuvable.</Card>

  const pop = state.population[p.n] ?? []
  const vivants = pop.filter((c) => c.statut !== 'Décédé')

  const setPlayer = (fn: (p: Player) => void) =>
    update((s) => {
      const target = s.players.find((x) => x.n === joueur)
      if (target) fn(target)
    })

  return (
    <div className="stack">
      <CarteIdentite p={p} C={C} joueur={joueur} setPlayer={setPlayer} update={update} />
      <CarteRoyaume state={state} p={p} C={C} joueur={joueur} setPlayer={setPlayer} update={update} />
      <CarteVassalite state={state} p={p} C={C} joueur={joueur} update={update} />
      <CartePersonnagesImportants p={p} vivants={vivants} C={C} />
    </div>
  )
}
