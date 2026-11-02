// ═══════════════════════════════════════════════════════════════════════════
//  TESTS HABITATIONS — coût d'amélioration du rang en DONNÉES
//  (retour Thibaut 2026-10-27 « le coût ne doit plus être textuel —
//  idem bâtiments/aménagements ») :
//   · coutRang : agrégation des paires {ressource, valeur} du champ
//     `couts` (plus AUCUN analyse de texte — parseCoutTexte est
//     retiré du moteur) ;
//   · coutHabitation : lecture pour une ville de rang donné ;
//   · debiterCoutHabitation : le stock est débité des paires.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import { coutRang, coutHabitation, debiterCoutHabitation, habitationDef } from './habitations'
import type { GameState, Player, City } from './types'

function partieTemoin(): { state: GameState; p: Player; ville: City; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 424242, 'local')
  return { state, p: state.players[0], ville: state.players[0].villes[0], C }
}

test('2026-10-27 : le coût du rang se lit des paires `couts` (agrégées, plus de texte)', () => {
  const { ville, C } = partieTemoin()
  ville.type = 'Ville'
  ville.rang = 'Hameau'
  const hameau = habitationDef(ville, C)
  assert.ok(hameau, 'rang Hameau présent')
  // Hameau : 20 Or + 10 Bois + 6 Bétail — l ancienne chaîne texte,
  //  désormais en paires ressource/valeur.
  assert.deepEqual(coutRang(hameau), { Or: 20, Bois: 10, Bétail: 6 },
    'coût du Hameau agrégé depuis les paires')
  // rang inconnu / sans paires = gratuit (pas de crash)
  assert.deepEqual(coutRang(undefined), {}, 'rang inconnu : gratuit')
  // doublons de ressource dans les paires : AGRÉGÉS (même règle que
  //  les constructions — agregerCouts partagé).
  const doublon = { ...hameau, couts: [
    { ressource: 'Or', valeur: 5 }, { ressource: 'Or', valeur: 5 },
    { ressource: 'Pierres', valeur: 2 },
  ] }
  assert.deepEqual(coutRang(doublon), { Or: 10, Pierre: 2 },
    'paires agrégées et ressource normalisée (Pierres → Pierre)')
})

test('2026-10-27 : debiterCoutHabitation débite le stock du coût du rang courant', () => {
  const { state, p, ville, C } = partieTemoin()
  ville.rang = 'Hameau'
  ville.type = 'Ville'
  const orAvant = p.resources['Or']?.stock ?? 0
  const boisAvant = p.resources['Bois']?.stock ?? 0
  const bétailAvant = p.resources['Bétail']?.stock ?? 0
  const debite = debiterCoutHabitation(state, p, ville, C)
  assert.deepEqual(debite, { Or: 20, Bois: 10, Bétail: 6 },
    'le coût débité est celui des paires `couts`')
  assert.equal(p.resources['Or'].stock, orAvant - 20, 'Or débité')
  assert.equal(p.resources['Bois'].stock, boisAvant - 10, 'Bois débité')
  assert.equal(p.resources['Bétail'].stock, bétailAvant - 6, 'Bétail débité')
  // le log Système porte le coût débité
  const ligne = state.log[state.log.length - 1]
  assert.ok(ligne.texte.includes('20 Or'), 'le log cite le coût (20 Or)')
})

test('2026-10-27 : coutHabitation suit la ville (rang Château → paires du Donjon)', () => {
  const { ville, C } = partieTemoin()
  ville.type = 'Château'
  ville.rang = 'Donjon'
  // Donjon : 40 Or + 2 Bétail + 12 Pierre (l ancien « 12 Pierres »).
  assert.deepEqual(coutHabitation(ville, C), { Or: 40, Bétail: 2, Pierre: 12 },
    'coût du Donjon lu par type + rang de la ville')
})
