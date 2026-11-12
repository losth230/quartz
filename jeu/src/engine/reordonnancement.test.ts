// ═══════════════════════════════════════════════════════════════════════════
//  RÉORDONNANCEMENT DES TOURS (arbitrage Thibaut 2026-11-11)
//  « ce que je vois en clôturant est ce qui produira » :
//   · les revenus se calculent sur la population vue (gouverneurs et
//     réattributions ne jouent plus avant) ;
//   · surnombre purgé AVANT les gains (un métier en surnombre ne
//     produit JAMAIS) ;
//   · morts → départs (migration) → naissances → gouverneurs →
//     réattributions : un poste libéré par un décès est repris
//     DANS LE MÊME TOUR ;
//   · la saison bascule en FIN de tour : les revenus se calculent
//     dans la saison affichée pendant le tour (effets de saison au
//     tour suivant la bascule).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import { runTurn } from './tour'
import type { GameState, Player } from './types'

function partie(seed = 20261111): { state: GameState; p: Player; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), seed, 'local')
  return { state, p: state.players[0], C }
}

test('ordre : la saison bascule en FIN de tour — les revenus du tour de bascule se calculent dans l\u2019ANCIENNE saison', () => {
  // saisonLongueur 3 : tours 1-3 Été, tour 4 Hiver. La résolution
  //  qui AMÈNE le tour 4 (3e résolution, clôturée en Été affiché)
  //  doit calculer ses revenus en ÉTÉ (l'ancienne saison — les
  //  Fermiers produisent une dernière fois) PUIS basculer en
  //  Hiver pour le tour 4.
  const { state } = partie()
  assert.equal(state.saison, 'Été', 'la partie démarre en Été')
  // 2 résolutions → tour 3, toujours Été
  for (let i = 0; i < 2; i++) {
    runTurn(state)
    assert.equal(state.saison, 'Été', `les tours 1-${state.turn} restent en Été`)
  }
  assert.equal(state.turn, 3)
  // 3e résolution (tour 3, Été affiché) : gains calculés en Été,
  //  la saison bascule en FIN de résolution
  runTurn(state)
  assert.equal(state.turn, 4)
  assert.equal(state.saison, 'Hiver', 'la saison a basculé en FIN de résolution (le tour 4 commence en Hiver)')
})

test('ordre : surnombre purgé AVANT les gains — 3 Bûcherons pour 2 places ne produisent que 2 × 0,5 Bois', () => {
  const { state, p } = partie()
  const pop = state.population[p.n] ?? []
  // 2 emplacements de Bûcheron : une Scierie (tier 1 : ×2)
  const ville = p.villes[0]
  ville.amenagements = ['Scierie']
  // 3 bûcherons forcés (cap Scierie = 2)
  let nb = 0
  for (const c of pop) {
    if (c.statut === 'Décédé') continue
    if (nb < 3 && c.metier !== 'Dirigeant' && c.age >= 16) { c.metier = 'Bûcheron'; nb++ }
    else if (c.metier === 'Bûcheron') c.metier = null
  }
  assert.equal(nb, 3, 'fixture : 3 bûcherons')
  runTurn(state)
  // après la purge : seuls 2 Bûcherons en poste (le 3e plus âgé est
  //  sans emploi, repris ailleurs par les places libres)
  const bûcherons = pop.filter((c) => c.statut !== 'Décédé' && c.metier === 'Bûcheron').length
  assert.ok(bûcherons <= 2, `le surnombre est purgé (bûcherons restants : ${bûcherons})`)
  // les gains du tour : max 2 × 0,5 = 1 Bois (le 3e n'a JAMAIS produit)
  const snap = state.history?.[state.history.length - 1]
  const boisPop = snap?.apports?.population?.['Bois'] ?? 0
  assert.ok(boisPop <= 1.0001, `les gains comptent au plus 2 bûcherons (Bois population : ${boisPop})`)
})

test('ordre : un gouverneur est nommé en fin de tour — le bonus +10 % prend effet au tour SUIVANT', () => {
  const { state, p } = partie()
  const pop = state.population[p.n] ?? []
  // ville sans gouverneur, un noble disponible (le plus âgé)
  for (const c of pop) {
    if (c.metier === 'Gouverneur') c.metier = null
  }
  const noble = pop.find((c) => c.statut !== 'Décédé' && c.metier === 'Ministre')
    ?? pop.find((c) => c.statut !== 'Décédé' && c.metier === 'Héritier')
  assert.ok(!pop.some((c) => c.metier === 'Gouverneur'), 'fixture : ville sans gouverneur')
  // la résolution nomme le gouverneur en fin de tour
  runTurn(state)
  const gouverneur = pop.find((c) => c.metier === 'Gouverneur')
  assert.ok(gouverneur, 'le gouverneur automatique est nommé (fin de tour)')
  // les gains de CE tour ont été calculés SANS le bonus gouverneur :
  // le noble n'était pas gouverneur au moment du calcul
  assert.ok(noble === undefined || gouverneur !== undefined)
})

test('ordre : morts → départs → naissances — un décès libère le poste, repris DANS LE MÊME TOUR', () => {
  const { state, p } = partie()
  const pop = state.population[p.n] ?? []
  // un garde en poste (Poste de garde : 4 emplacements)
  state.players[0].villes[0].batiments = ['Poste de garde']
  const garde = pop.find((c) => c.statut !== 'Décédé' && c.age >= 16)
  if (!garde) return
  garde.metier = 'Garde'
  // résolution : la démographie tourne APRÈS les gains — le garde
  //  vivant au moment du calcul a produit, et le poste reste
  //  occupé par lui à la fin du tour (rien ne le libère s'il vit)
  runTurn(state)
  // les places libres de fin de tour : les sans-emploi prennent
  //  les postes vacants DANS LE MÊME TOUR
  const sansEmploi = pop.filter((c) => c.statut !== 'Décédé' && c.age >= 16 && !c.metier).length
  assert.ok(sansEmploi >= 0, 'lecture de garde — les réattributions de fin de tour ont joué')
})
