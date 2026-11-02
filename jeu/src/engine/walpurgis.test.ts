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

test('Walpurgis : SYMÉTRIE — un MARI Naturalisme augmente aussi les chances du couple', () => {
  const state = partie()
  const p = state.players[0]
  // Couple inversé : homme Naturalisme, femme Déiste (joueur Déiste)
  const pop = populationTest('Déisme')
  pop[0].culture = 'Naturalisme' // le MARI
  state.population[p.n] = pop
  const hommeNaturaliste = computeFecondite(state, p, pop[0])

  const popRef = populationTest('Déisme')
  state.population[p.n] = popRef
  const hommeDeiste = computeFecondite(state, p, popRef[0])

  assert.ok(hommeNaturaliste > hommeDeiste,
    `la fécondité affichée d'un homme Naturalisme porte le ×1,1 : ${hommeNaturaliste} > ${hommeDeiste}`)
  assert.ok(Math.abs(hommeNaturaliste - hommeDeiste * 1.1) < 1e-9,
    'facteur exact ×1,1 sur le return masculin (culture propre de l\u2019homme)')

  // ET le jet de conception du couple : femme Déiste + mari Naturalisme = ×1,1
  let proba = -1
  const rngSpy = {
    next: () => 0.99, int: () => 1, die: () => 1,
    chance: (q: number) => { if (proba < 0) proba = q; return false },
    pick: <T,>(a: T[]) => a[0], pickWeighted: <T,>(i: T[]) => i[0], shuffle: <T,>(a: T[]) => a,
  } as unknown as Rng
  const run = (cultureMari: string) => {
    const st = partie()
    const pj = st.players[0]
    const couple = populationTest('Déisme')
    couple[0].culture = cultureMari
    st.population[pj.n] = couple
    proba = -1
    conceptionEtNaissances(st, pj, rngSpy as unknown as Rng, emptyRecap())
    return proba
  }
  const avec = run('Naturalisme')
  const sans = run('Déisme')
  assert.ok(avec > sans,
    'le jet de conception du couple porte le ×1,1 quand le MARI (seul) est Naturalisme')
  assert.ok(Math.abs(avec - sans * 1.1) < 1e-9,
    `ratio exact ×1,1 sur la part du mari dans le jet (${avec} = ${sans}×1,1)`)
})

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

// ── Amants intra-ville (arbitrage Thibaut 2026-11-02) ─────────────────

test('conception : le père (adultère ou célibat) est un homme DE LA VILLE de la mère — jamais ailleurs', () => {
  // rng espion : chance(proba) → true au 1er appel (conception),
  // chance(adulteryRate) → false (fidélité) puis contrôlé par test.
  let appel = 0
  let probasConception: number[] = []
  // pick espion : capture le POOL tiré (preuve du périmètre intra-ville)
  let poolCapture: unknown[] = []
  const rngFake = {
    next: () => 0.99, int: () => 1, die: () => 1,
    chance: (p: number) => { appel++; if (appel === 1) { probasConception.push(p); return true } return false },
    pick: <T,>(a: T[]) => { poolCapture = a; return a[0]! },
    pickWeighted: <T,>(i: T[]) => i[0]!,
    shuffle: <T,>(a: T[]) => a,
  } as unknown as Rng
  const mkChar = (over: Partial<Character>): Character => ({
    id: 'x', nom: 'N', prenom: 'P', dynastie: 'D', sexe: 'M', age: 20, culture: 'Déisme',
    ville: 'Capitale', orientation: 'Hétérosexuel', traits: ['', '', ''], statut: 'Sain',
    mariage: null, mariageId: null, mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false, metier: null, fecondite: 0, armee: null,
    ...over,
  } as Character)

  const state = partie()
  const p = state.players[0]
  // CÉLIBATAIRE de la ville A ; hommes adultes répartis : 1 dans la
  // ville A, 2 dans la ville B (autre ville du joueur).
  const femme = mkChar({ id: 'f-cel', sexe: 'F', ville: 'A' })
  const hommeA = mkChar({ id: 'h-a', ville: 'A' })
  const hommeB1 = mkChar({ id: 'h-b1', ville: 'B' })
  const hommeB2 = mkChar({ id: 'h-b2', ville: 'B' })
  state.population[p.n] = [femme, hommeA, hommeB1, hommeB2]
  p.villes = [
    { ...p.villes[0], nom: 'A' },
    { ...p.villes[0], nom: 'B' },
  ] as typeof p.villes
  const recap = emptyRecap()
  appel = 0
  conceptionEtNaissances(state, p, rngFake, recap)
  // conçue (chance→true au 1er appel), père = hommeA (le seul de SA ville)
  assert.equal(femme.statut, 'Enceinte', 'la conception a lieu')
  // PREUVE du périmètre : le pool des amants ne contient QUE les
  // hommes de la ville A — jamais ceux de la ville B.
  const ids = (poolCapture as Array<{ id: string }>).map((x) => x.id)
  assert.ok(ids.includes('h-a'), 'le pool contient l\u2019homme de la ville de la mère')
  assert.ok(!ids.includes('h-b1') && !ids.includes('h-b2'),
    `le pool ne contient AUCUN homme d\u2019une autre ville (pool: ${ids.join(', ')})`)
  assert.equal(femme.pereBioId, 'h-a', 'le père est un homme de SA ville, jamais une autre ville')
  assert.equal(femme.enfantBatard, true, 'célibataire : enfant bâtard')
})
