// ══════════════════════════════════════════════════════════════════════
//  WALPURGIS (fertFactor) — LOI D'HABITANT : culture PROPRE du personnage
//
//  Correctif 2026-11-02 : la loi « fertFactor » du Naturalisme (×1,1) est
//  une REGLE D'HABITANT (regleHabitant « Walpurgis » du référentiel),
//  comme le dogme de la Famille — elle doit lire la culture PROPRE du
//  personnage (c.culture), PAS celle du joueur (p.culture). Avant le
//  correctif : un habitant converti au Naturalisme chez un joueur d'une
//  autre culture ne bénéficiait jamais du ×1,1.
//
//  Ce test verrouille la sémantique sur les DEUX voies de la natalité :
//    1. computeFecondite (fécondité AFFICHÉE) ;
//    2. conceptionEtNaissances (le JET réel de conception) ;
//  et sur la même sémantique pour l'HÉRÉDITÉ de dynastie
//  (computeBabyDynasty lit désormais mere.culture).
// ══════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Character, GameState } from './types'
import { createGame } from './setup'
import type { SetupLine } from './setup'
import { computeFecondite, conceptionEtNaissances } from './naissances'
import { emptyRecap } from './shared'
import { makeRng, type Rng } from './rng'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'Basiléens', culture: 'Déisme',
  regime: 'Monarchie', taillePopulation: 10, pourcentageMariages: 40,
  villes: ['Capitale'],
}]

function partie(): GameState {
  return createGame(SETUP, 20261102, 'local')
}

/** Femme adulte saine mariée à un homme adulte sain (mêmes habitants,
 *  seule la culture de la FEMME varie). */
function femmeMariee(culture: string): Character {
  const femme: Character = {
    id: 'femme-1', nom: 'Femme', prenom: 'Tirande', dynastie: 'Orsan', sexe: 'F',
    age: 20, culture, ville: 'Capitale', orientation: 'Hétérosexuel',
    traits: ['', '', ''], statut: 'Sain', mariage: 'Époux Test', mariageId: 'mari-1',
    mere: null, mereId: null, pere: null, pereId: null, pereBio: null, pereBioId: null,
    enfantBatard: false, metier: null, fecondite: 0, armee: null,
  }
  return femme
  // (mari referencé par mariageId ; la population de test contient les deux)
}

function populationTest(cultureFemme: string): Character[] {
  const femme = femmeMariee(cultureFemme)
  const mari: Character = {
    ...femmeMariee('Déisme'),
    id: 'mari-1', nom: 'Époux', prenom: 'Aldric', dynastie: 'Valdoria', sexe: 'M',
    mariage: 'Femme Test', mariageId: 'femme-1',
  }
  // corrige les liens croisés
  femme.mariageId = mari.id
  mari.mariageId = femme.id
  femme.mariage = 'Époux Test'
  mari.mariage = 'Femme Test'
  return [mari, femme]
}

test('Walpurgis : computeFecondite lit la culture PROPRE de la femme, pas celle du joueur', () => {
  const state = partie()
  const p = state.players[0]
  // Joueur DÉISTE (fertFactor 1) ; femme convertie au NATURALISME (×1,1)
  const pop = populationTest('Naturalisme')
  state.population[p.n] = pop
  const feconde = computeFecondite(state, p, pop[1])

  // même femme, culture du joueur (Déisme) : pas de bonus
  const popRef = populationTest('Déisme')
  state.population[p.n] = popRef
  const reference = computeFecondite(state, p, popRef[1])

  assert.ok(feconde > reference,
    `une femme Naturalisme chez un joueur Déisme doit être plus féconde (×1,1) : ${feconde} > ${reference}`)
  assert.ok(Math.abs(feconde - reference * 1.1) < 1e-9,
    'le facteur appliqué est exactement le fertFactor du Naturalisme (×1,1)')
})

test('Walpurgis : le JET de conception (conceptionEtNaissances) suit la même loi d’habitant', () => {
  // RNG factice enregistreur : capture la proba passée à rng.chance
  let probaCapturee = -1
  const rngFake = {
    next: () => 0.99, int: () => 1, die: () => 1,
    chance: (p: number) => { if (probaCapturee < 0) probaCapturee = p; return false },
    pick: <T,>(arr: T[]) => arr[0],
    pickWeighted: <T,>(items: T[]) => items[0],
    shuffle: <T,>(arr: T[]) => arr,
  } as unknown as Rng
  const recap = emptyRecap()
  const makeRngSpy = (): Rng => rngFake

  const stateA = partie()
  const pA = stateA.players[0]
  stateA.population[pA.n] = populationTest('Naturalisme')
  conceptionEtNaissances(stateA, pA, makeRngSpy(), recap)
  const probaNaturalisme = probaCapturee

  const stateB = partie()
  const pB = stateB.players[0]
  stateB.population[pB.n] = populationTest('Déisme')
  probaCapturee = -1
  conceptionEtNaissances(stateB, pB, makeRngSpy(), recap)
  const probaDeisme = probaCapturee

  assert.ok(probaNaturalisme > probaDeisme,
    'le jet de conception d’une femme Naturalisme (joueur Déiste) porte le ×1,1')
  assert.ok(Math.abs(probaNaturalisme - probaDeisme * 1.1) < 1e-9,
    `affiché = réel : le jet et computeFecondite portent le même facteur (${probaNaturalisme} = ${probaDeisme}×1,1)`)
})

test('Hérédité : computeBabyDynasty lit la culture de la MÈRE (convertie), pas celle du joueur', () => {
  // Joueur SETHISTE (hérité Féminine) ; femme convertie au DÉISME (hérité Masculine)
  // → la dynastie du bébé suit la culture de sa mère (Masculine : dynastie du père).
  const state = partie()
  const p = state.players[0]
  p.culture = 'Sethisme'
  const pop = populationTest('Déisme')
  state.population[p.n] = pop
  const rng = makeRng(20261102)
  const recap = emptyRecap()
  // accouchement direct : la femme est déjà Enceinte
  const femme = pop[1]
  femme.statut = 'Enceinte'
  const pere = pop[0]
  femme.pereBio = 'Époux Test'
  femme.pereBioId = pere.id
  conceptionEtNaissances(state, p, rng, recap)
  const bebe = state.population[p.n].find((c) => c.id !== 'mari-1' && c.id !== 'femme-1')
  assert.ok(bebe, 'un bébé est né')
  assert.equal(bebe!.dynastie, pere.dynastie,
    'hérité Masculine de la culture PROPRE de la mère (Déisme) : dynastie du PÈRE, pas celle imposée par le joueur (Sethisme = Féminine)')
})
