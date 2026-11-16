// ═══════════════════════════════════════════════════════════════════════════
//  TESTS PEUPLE DES HABITANTS (arbitrage Thibaut 2026-11-16)
//
//  « Le peuple fonctionnerait comme la culture mais serait défini par
//  le peuple choisi par le joueur au début de partie, et hériditaire
//  par la mère. L'idée est que le peuple d'un habitant offre un bonus,
//  comme les cultures, à la différence près qu'un habitant ne peut
//  jamais changer de peuple. »
//
//  Arbitrages actés :
//   · un seul bonus test pour l'instant : les KHAZHAGS NAINS
//     « isolationnistes » — −2 POINTS (absolus) de chances de partir
//     à cause du bonheur, −2 points de chances de conversion
//     culturelle (Khazhags ajouté aux peuples sélectionnables,
//     banque de noms n°2) ;
//   · cités libres : chaque joueur a SA cité libre → peuple du
//     joueur ; une cité libre qui apparaît en cours de partie →
//     peuple tiré au hasard parmi les peuples disponibles ;
//   · affichage : colonne Peuple dans la page Population ;
//   · les habitants des vieilles sauvegardes sont rattrapés au
//     peuple de leur porteur (normaliserEtat).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, GameState } from './types'
import type { Rng } from './rng'
import { makeRng } from './rng'
import { cfgOf, peupleDef, peupleEffetDef, modPeupleHabitant } from './gameData'
import { applyCultureInfluence } from './culture'
import { migrationBonheur } from './migrationBonheur'
import { conceptionEtNaissances } from './naissances'
import { emptyRecap } from './shared'
import { normaliserEtat } from './villes'
import { villeDevientCiteLibre } from './citesLibres'

const SETUP: SetupLine[] = [
  { nom: 'Nains', peuple: 'Khazhags Nains', culture: 'Culture Nordique', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale'] },
  { nom: 'Basile', peuple: 'Basiléens', culture: 'Communautarisme', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Ville'] },
]

/** Rng factice : la face `chance` CAPTURE les probas passées (false =
 *  aucun tirage aval), le reste ne sert pas ; le cast final évite
 *  d'implémenter les 8 faces de l'interface. */
function rngCapture(): { ps: number[]; rng: Rng } {
  const ps: number[] = []
  return {
    ps,
    rng: { chance: (p: number) => { ps.push(p); return false } } as unknown as Rng,
  }
}

test('référentiel : Khazhags Nains sélectionnables (banque 2) + effets isolationnistes', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  assert.ok(C.peuples.includes('Khazhags Nains'), 'Khazhags Nains est un peuple sélectionnable')
  const peup = peupleDef('Khazhags Nains', C.config)
  assert.ok(peup, 'fiche de peuple présente')
  assert.ok(peup!.noms.includes('Schwarzmond'), 'banque de noms n°2 (nains)')
  const f = peupleEffetDef('Khazhags Nains', C.config)
  assert.ok(f, 'fiche d\'effets présente')
  assert.equal(f!.migrationBonheurMod, -0.02)
  assert.equal(f!.conversionProbaMod, -0.02)
  // Peuple sans fiche d'effets : aucun modificateur.
  assert.equal(peupleEffetDef('Basiléens', C.config), undefined)
  const c: Character = { peuple: 'Basiléens' } as Character
  assert.equal(modPeupleHabitant(c, 'migrationBonheurMod', C), 0)
  const khazhag: Character = { peuple: 'Khazhags Nains' } as Character
  assert.equal(modPeupleHabitant(khazhag, 'conversionProbaMod', C), -0.02)
  assert.equal(modPeupleHabitant({} as Character, 'conversionProbaMod', C), 0,
    'habitant sans peuple (vieille sauvegarde non rattrapée) : aucun effet')
})

test('setup : habitants du peuple du joueur (cour comprise) ; cité libre du joueur', () => {
  const state = createGame(SETUP, 20261116, 'local')
  for (const [n, attendu] of [[1, 'Khazhags Nains'], [2, 'Basiléens']] as const) {
    const pop = state.population[n] ?? []
    assert.ok(pop.length > 0)
    for (const c of pop) {
      assert.equal(c.peuple, attendu, `${c.prenom} ${c.nom} porte le peuple ${attendu}`)
    }
  }
  // Une cité libre par joueur : le peuple de la cité = peuple du joueur.
  assert.equal(state.citesLibres.length, state.players.length)
  state.citesLibres.forEach((cite, i) => {
    assert.equal(cite.peuple, state.players[i]?.peuple,
      `cité libre ${i + 1} : peuple du joueur ${i + 1}`)
    for (const c of cite.population ?? []) {
      assert.equal(c.peuple, state.players[i]?.peuple)
    }
  })
})

test('héritage : le nouveau-né porte le peuple de sa MÈRE, pas celui du porteur', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const p = state.players[0]!
  const pop = state.population[p.n] ?? []
  // Une femme adulte de J1 (porteur Khazhags) dont le peuple est
  //  VOLONTAIREMENT Basiléens : l'enfant doit suivre la MÈRE.
  const mere = pop.find((c) => c.sexe === 'F' && c.age >= 16 && c.statut === 'Sain')
  assert.ok(mere, 'femme adulte disponible')
  mere.peuple = 'Basiléens'
  mere.statut = 'Enceinte'
  mere.pereBio = null
  mere.pereBioId = null
  const avant = pop.length
  const rng = makeRng(42)
  conceptionEtNaissances(state, p, rng, emptyRecap())
  const bebes = pop.slice(avant)
  assert.ok(bebes.length > 0, 'au moins une naissance')
  for (const b of bebes) {
    assert.equal(b.peuple, 'Basiléens',
      'l\'enfant hérite du peuple de sa mère (pas du peuple du porteur)')
    // Cohérence nom : les prénoms viennent de la banque de la mère.
    const peup = peupleDef('Basiléens', cfgOf(state.config).config)!
    assert.ok(peup.prenomsM.includes(b.prenom) || peup.prenomsF.includes(b.prenom),
      'prénom tiré dans la banque du peuple de la mère')
  }
})

test('jamais de changement de peuple : la conversion change la culture, pas le peuple', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const p = state.players[0]!
  const pop = state.population[p.n] ?? []
  // Photographie AVANT : id → peuple.
  const avant = new Map(pop.map((c) => [c.id, c.peuple]))
  assert.ok([...avant.values()].every((x) => x === 'Khazhags Nains'), 'peuple posé au setup')
  // Tirage forcé : le jet passe (chance true), le premier poids
  //  l'emporte (lambda GÉNÉRIQUE compatible <T> — leçon typecheck CI
  //  du 2026-11-16 : une annotation étroite n'est pas assignable).
  const toutPasse = { chance: () => true, pickWeighted: (<T>(items: T[]) => items[0]!) } as unknown as Rng
  applyCultureInfluence(state, p, toutPasse, emptyRecap())
  // La culture a pu changer (tir forcé) — le peuple JAMAIS.
  for (const c of pop) {
    assert.equal(c.peuple, avant.get(c.id),
      'aucun habitant ne change de peuple (la conversion ne touche que la culture)')
  }
})

test('isolationnistes (Khazhags Nains) : jet de conversion à 5 % − 2 points = 3 %', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  assert.equal(C.p.conversionProba, 0.05, 'proba de conversion par défaut 5 %')
  const { ps, rng } = rngCapture()
  // Un habitant Khazhags SEUL dans une ville de l'AUTRE joueur : le
  //  tirage joue pour lui (pré-flux, tous les vivants hors Dirigeant).
  const p2 = state.players[1]!
  const pop2 = state.population[p2.n] ?? []
  const eligibles = pop2.filter((x) => x.statut !== 'Décédé' && x.metier !== C.p.metierDirigeant)
  const c = eligibles.find((x) => x.statut === 'Sain')
  assert.ok(c)
  c!.peuple = 'Khazhags Nains'
  applyCultureInfluence(state, p2, rng, emptyRecap())
  assert.equal(ps.length, eligibles.length, 'un jet par habitant vivant hors Dirigeant')
  // Le jet du Khazhag est à 0,05 − 0,02 = 0,03 ; les Basiléens à 0,05.
  // (Tolérance flottante : 0,05 − 0,02 = 0,030000000000000002.)
  assert.ok(ps.some((x) => Math.abs(x - 0.03) < 1e-9),
    `le jet du Khazhag est capté à 0,03 (${ps.join(', ')})`)
  assert.ok(ps.some((x) => Math.abs(x - 0.05) < 1e-9),
    `les jets des Basiléens restent à 0,05 (${ps.join(', ')})`)
  assert.ok(!ps.some((x) => x < 0.03 - 1e-9), 'aucun jet sous 0,03 (clamp au plancher)')
})

test('isolationnistes : départ par bonheur −2 points (points absolus)', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  C.p.migrationBonheurMax = 1 // base assez grosse pour voir l'effet
  // La base NEUTRALISE les effets de peuple (le SETUP donne déjà des
  //  Khazhags au joueur 1 : sans ça, ses jets seraient déjà réduits).
  C.config.effetsPeuple = []
  const base = rngCapture()
  migrationBonheur(state, base.rng)
  assert.ok(base.ps.length > 0, 'le flux joue pour des habitants')
  const maxBase = Math.max(...base.ps)
  assert.ok(maxBase > 0.02, `proba de départ de base suffisante (${maxBase})`)
  // Même partie, TOUS les habitants en Khazhags : chaque proba
  //  captée = base − 0,02 (clampée à 0), même ordre d'itération.
  const clone = createGame(SETUP, 20261116, 'local')
  const C2 = cfgOf(clone.config)
  C2.p.migrationBonheurMax = 1
  for (const liste of Object.values(clone.population)) {
    for (const c of liste ?? []) c.peuple = 'Khazhags Nains'
  }
  const nains = rngCapture()
  migrationBonheur(clone, nains.rng)
  assert.equal(nains.ps.length, base.ps.length, 'même nombre de jets (même graine/état)')
  for (let i = 0; i < base.ps.length; i++) {
    assert.ok(Math.abs(nains.ps[i]! - Math.max(0, base.ps[i]! - 0.02)) < 1e-9,
      `jet ${i} : ${base.ps[i]} → ${nains.ps[i]} (−2 points absolus, clamp 0)`)
  }
})

test('rattrapage : les habitants d\'une vieille sauvegarde prennent le peuple du porteur', () => {
  const state = createGame(SETUP, 20261116, 'local')
  for (const liste of Object.values(state.population)) {
    for (const c of liste ?? []) delete c.peuple
  }
  normaliserEtat(state)
  for (const [nStr, liste] of Object.entries(state.population)) {
    const attendu = state.players.find((p) => p.n === Number(nStr))?.peuple
    for (const c of liste ?? []) assert.equal(c.peuple, attendu)
  }
  // Idempotent : une 2e passe ne change rien.
  normaliserEtat(state)
  for (const [nStr, liste] of Object.entries(state.population)) {
    const attendu = state.players.find((p) => p.n === Number(nStr))?.peuple
    for (const c of liste ?? []) assert.equal(c.peuple, attendu)
  }
})

test('cité libre apparue en cours de partie : peuple tiré au hasard parmi les peuples disponibles', () => {
  const SETUP2: SetupLine[] = [{
    nom: 'Nains', peuple: 'Khazhags Nains', culture: 'Culture Nordique', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale', 'Colonie'],
  }]
  const state = createGame(SETUP2, 20261116, 'local')
  const C = cfgOf(state.config)
  const p = state.players[0]!
  const nom = villeDevientCiteLibre(state, p, 1)
  assert.ok(nom, 'la colonie devient cité libre')
  const cite = (state.citesLibres ?? []).find((x) => x.nom === nom)
  assert.ok(cite)
  assert.ok(C.peuples.includes(cite!.peuple ?? ''),
    `peuple de la nouvelle cité tiré parmi les peuples disponibles (${cite!.peuple})`)
  // Les habitants PARTANTS conservent leur peuple (un peuple ne
  //  change JAMAIS, même en devenant cité libre).
  for (const c of cite!.population ?? []) {
    assert.equal(c.peuple, p.peuple, 'les habitants partants gardent leur peuple')
  }
})
