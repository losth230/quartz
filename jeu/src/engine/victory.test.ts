// ═══════════════════════════════════════════════════════════════════════════
//  TESTS LAURIERS I à V (arbitrages Thibaut 2026-11-16)
//
//  Référentiel : 5 Lauriers par voie — I spécifique, II habitation
//  rang 2, III spécifique, IV COMMUN « habitation de rang 3 » (Grande
//  Cité ou Forteresse), V triomphe (l'ancien Laurier IV de chaque
//  voie). Voie Scientifique : Lauriers VIDES (différée).
//  Moteur : ordre strict 1-5, crise à tirer aux LAURIERS I et III
//  uniquement, Laurier V = victoire (victoireAtteinte n >= 5),
//  radar = Lauriers validés / 5.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import { cfgOf } from './gameData'
import { cocherLaurier, nbLauriers, victoireAtteinte, victoryProgress, LAURIERS_CRISE } from './victory'

const SETUP: SetupLine[] = [
  { nom: 'Nains', peuple: 'Khazhags Nains', culture: 'Culture Nordique', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale'] },
]

const RANG3 = 'Améliorer une habitation au rang 3 (Grande Cité ou Forteresse).'
const TRIOMPHE: Record<string, string> = {
  'Culturelle': 'Toutes les habitations du monde (y compris chez les autres joueurs) sont de ta culture.',
  'Démographique': 'Atteindre 90 de bonheur dans toutes tes habitations.',
  'Diplomatique': 'Placer 12 émissaires dans la même cité libre.',
  'Économique': 'Posséder 5 guildes.',
  'Militaire': 'Atteindre -100 Or de levée d\'armée dans une de tes habitations.',
}

test('référentiel : 5 Lauriers par voie, IV commun rang 3, V = triomphe, Scientifique vide', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const victoires = cfgOf(state.config).config.victoires
  assert.equal(victoires.length, 6, '6 voies')
  for (const v of victoires) {
    assert.equal(v.lauriers.length, 5, `${v.voie} : 5 Lauriers`)
    assert.equal(v.lauriers[3].laurier, 'Laurier IV')
    assert.equal(v.lauriers[4].laurier, 'Laurier V')
    if (v.voie === 'Scientifique') {
      for (const l of v.lauriers) assert.equal(l.condition, '', 'Scientifique différée : Lauriers vides')
    } else {
      assert.equal(v.lauriers[3].condition, RANG3, `${v.voie} : Laurier IV commun rang 3`)
      assert.ok(v.lauriers[0].condition, `${v.voie} : Laurier I défini`)
      assert.equal(v.lauriers[1].condition, 'Améliorer une habitation au rang 2 (Cité ou Donjon).', `${v.voie} : Laurier II rang 2`)
      assert.ok(v.lauriers[2].condition, `${v.voie} : Laurier III défini`)
      assert.equal(v.lauriers[4].condition, TRIOMPHE[v.voie], `${v.voie} : Laurier V = ancien triomphe`)
    }
  }
  const mil = victoires.find((v) => v.voie === 'Militaire')
  assert.equal(mil?.lauriers[2].condition, 'Posséder une habitation avec 4 bâtiments militaires.',
    'Militaire III = 4 bâtiments militaires (arbitrage Thibaut)')
})

test('cocherLaurier : ordre strict 1-5, pas de saut, décoche au niveau 0', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const p = state.players[0]
  assert.equal(cocherLaurier(state, p, 'Culturelle', 3), -1, 'saut interdit (3 sans le 2)')
  assert.equal(cocherLaurier(state, p, 'Culturelle', 6), -1, 'pas de Laurier VI')
  assert.equal(cocherLaurier(state, p, 'Culturelle', 1), 1)
  assert.equal(cocherLaurier(state, p, 'Culturelle', 2), 2)
  assert.equal(cocherLaurier(state, p, 'Culturelle', 2), -1, 're-cocher le même niveau interdit')
  assert.equal(cocherLaurier(state, p, 'Culturelle', 5), -1, 'pas de saut 2 → 5')
  assert.equal(cocherLaurier(state, p, 'Culturelle', 3), 3)
  assert.equal(cocherLaurier(state, p, 'Culturelle', 4), 4)
  assert.equal(cocherLaurier(state, p, 'Culturelle', 5), 5)
  assert.equal(nbLauriers(p, 'Culturelle'), 5)
  assert.equal(cocherLaurier(state, p, 'Culturelle', 0), 4, 'décoche le dernier')
  assert.equal(nbLauriers(p, 'Culturelle'), 4)
})

test('journal : crise aux Lauriers I et III uniquement, VICTOIRE au Laurier V', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const p = state.players[0]
  assert.deepEqual(LAURIERS_CRISE, [1, 3], 'crises aux Lauriers I et III (arbitrage Thibaut)')
  state.log = []
  for (let n = 1; n <= 5; n++) cocherLaurier(state, p, 'Diplomatique', n)
  const messages = state.log.map((l) => l.texte)
  assert.equal(messages.length, 5)
  assert.ok(messages[0].includes('crise'), 'Laurier I → crise')
  assert.ok(!messages[1].includes('crise'), 'Laurier II → PAS de crise')
  assert.ok(messages[2].includes('crise'), 'Laurier III → crise')
  assert.ok(!messages[3].includes('crise'), 'Laurier IV → PAS de crise')
  assert.ok(messages[4].includes('VICTOIRE') && messages[4].includes('Laurier V'), 'Laurier V → victoire')
})

test('victoireAtteinte : Laurier V atteint seulement (4 Lauriers ne suffisent plus)', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const p = state.players[0]
  p.lauriers = { 'Économique': 4 }
  assert.equal(victoireAtteinte(state).length, 0, '4 Lauriers = PAS victoire (ancien IV)')
  p.lauriers = { 'Économique': 5 }
  const v = victoireAtteinte(state)
  assert.equal(v.length, 1, '5 Lauriers = victoire')
  assert.equal(v[0].voie, 'Économique')
  assert.equal(v[0].nom, p.nom)
})

test('victoryProgress : ratio /5 et « X/5 Lauriers » au survol', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const p = state.players[0]
  p.lauriers = { 'Culturelle': 3 }
  const prog = victoryProgress(state)[0]
  assert.equal(prog.valeurs.culturelle, 3 / 5)
  assert.ok(prog.details.culturelle.includes('3/5 Lauriers'), 'détail en X/5')
  assert.ok(prog.details.culturelle.includes('prochain'), 'prochain Laurier affiché au survol')
  p.lauriers = { 'Culturelle': 5 }
  const fini = victoryProgress(state)[0]
  assert.equal(fini.valeurs.culturelle, 1, '5/5 = bord du radar')
  assert.ok(fini.details.culturelle.includes('TERMINÉE'), 'voie terminée au survol')
})
