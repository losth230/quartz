// ═══════════════════════════════════════════════════════════════════════════
//  TESTS TALENTS DE PEUPLE + FICHE KHAZHAGS NAINS (arbitrages Thibaut
//  2026-11-16)
//
//  Fiche « Nains » (arbitrée) :
//   · Or des mines (base, table effetsPeuple) : +1 Commerçant par
//     aménagement Carrière/Mine d'Or/Mine de Fer/Mine de Charbon ;
//   · Isolationnistes, 3e clause (base) : poids d'attraction des
//     villes x0,8 pour les migrants d'AUTRES joueurs (« poids x0,8 ») ;
//   · Économique Laurier I : +1 Mineur +1 Commerçant par route
//     sortante ; Laurier III : Commerçants +0,5 Or/tour ;
//   · Scientifique Laurier I : Mineurs/Forgerons/Charbonniers
//     +0,1 Science/tour (porté par le JOUEUR : tous ses habitants) ;
//   · Militaire Laurier I : montagne à 2 PM (PLATEAU, texte seul) ;
//     Laurier III : Poste de garde/Caserne/Barraquements -10/-20/-30
//     Or sur les levées.
//
//  Invariant de garde : les talents sont DÉRIVÉS de p.lauriers —
//  aucun état supplémentaire ; la 3e clause est un RATIO exact (x0,8)
//  sur les poids de tirage, migration interne inchangée.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Rng } from './rng'
import { cfgOf, poidsArriveePeuple } from './gameData'
import { talentsPeupleDef, talentsActifs } from './talentsPeuple'
import { capMetierVille } from './metiers'
import { detailGainsVille } from './economie'
import { prixArmee } from './armees'
import { migrationBonheur } from './migrationBonheur'

const SETUP: SetupLine[] = [
  { nom: 'Nains', peuple: 'Khazhags Nains', culture: 'Culture Nordique', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale'] },
  { nom: 'Basile', peuple: 'Basiléens', culture: 'Communautarisme', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Ville'] },
]

/** Rng factice : chaque `chance` tombe VRAI (un départ par éligible),
 *  `pickWeighted` CAPTURE les poids calculés pour chaque candidate
 *  (le cast évite d'implémenter les 8 faces de l'interface). */
function rngPoidsCaptures(): { poids: number[]; rng: Rng } {
  const poids: number[] = []
  return {
    poids,
    rng: {
      chance: () => true,
      pickWeighted: (items: unknown[], wf: (x: unknown) => number) => {
        for (const it of items) poids.push(wf(it))
        return items[0]
      },
    } as unknown as Rng,
  }
}

test('référentiel : 5 talents Khazhags Nains sur des voies valides du référentiel', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const voies = C.config.victoires.map((v) => v.voie)
  const ts = talentsPeupleDef('Khazhags Nains', C.config)
  assert.equal(ts.length, 5, '5 talents Khazhags (Éco I+III, Scien I, Mil I+III)')
  for (const t of ts) assert.ok(voies.includes(t.voie), `voie ${t.voie} existe au référentiel victoires`)
  assert.ok(ts.some((t) => t.voie === 'Économique' && t.laurierMin === 1 && (t.emplacementsParRoute?.length ?? 0) === 2))
  assert.ok(ts.some((t) => t.voie === 'Économique' && t.laurierMin === 3 && (t.fluxParMetier?.length ?? 0) === 1))
  assert.ok(ts.some((t) => t.voie === 'Scientifique' && t.laurierMin === 1 && (t.fluxParMetier?.length ?? 0) === 1))
  assert.ok(ts.some((t) => t.voie === 'Militaire' && t.laurierMin === 1 && !t.emplacementsParRoute && !t.fluxParMetier && !t.reductionLeveeParBatiment), 'Mil I = plateau, texte seul')
  assert.ok(ts.some((t) => t.voie === 'Militaire' && t.laurierMin === 3 && (t.reductionLeveeParBatiment?.length ?? 0) === 3))
})

test('talentsActifs : dérivés des Lauriers, peuple inconnu → rien', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const basile = state.players[1]
  assert.equal(talentsActifs(nains, C).length, 0, 'aucun Laurier → aucun talent')
  nains.lauriers = { 'Économique': 1, 'Scientifique': 1 }
  assert.equal(talentsActifs(nains, C).length, 2, 'Éco I + Scien I actifs')
  nains.lauriers = { 'Économique': 3, 'Militaire': 3 }
  const actifs = talentsActifs(nains, C).map((t) => t.nom)
  assert.deepEqual(actifs.sort(), ['Guerre des tunnels', 'Or du commerce nain', 'Routes de l\'entrefer', 'Semelles de granit'].sort(), 'L1+L3 cumulés')
  nains.lauriers = { 'Culturelle': 4 }
  assert.equal(talentsActifs(nains, C).length, 0, 'voie hors fiche → aucun talent')
  basile.lauriers = { 'Économique': 4 }
  assert.equal(talentsActifs(basile, C).length, 0, 'peuple sans fiche → aucun talent')
  assert.equal(talentsActifs(undefined, C).length, 0, 'joueur absent → aucun talent')
})

test('Or des mines : +1 Commerçant par aménagement de mine, uniquement pour le peuple porteur', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const basile = state.players[1]
  const vn = nains.villes[0]
  const vb = basile.villes[0]
  const avantN = capMetierVille('Commerçant', vn, C, { state, joueur: 1 })
  const avantB = capMetierVille('Commerçant', vb, C, { state, joueur: 2 })
  // Les fiches des mines ouvrent leurs PROPRES emplacements de
  // Commerçant (canal emplacements, commun aux deux joueurs) — la
  // clause « Or des mines » est le +1 PAR MINE propre au peuple :
  // l'écart Nains − Basiléens à aménagements égaux l'isole.
  const mines = ['Carrière', "Mine d'Or", 'Mine de Fer', 'Mine de Charbon']
  vn.amenagements = [...(vn.amenagements ?? []), ...mines]
  vb.amenagements = [...(vb.amenagements ?? []), ...mines]
  const deltaN = capMetierVille('Commerçant', vn, C, { state, joueur: 1 }) - avantN
  const deltaB = capMetierVille('Commerçant', vb, C, { state, joueur: 2 }) - avantB
  assert.equal(deltaN - deltaB, 4, '4 mines → +4 Commerçants Khazhags (écart exact au peuple porteur)')
  assert.equal(capMetierVille('Mineur', vn, C, { state, joueur: 1 }) - capMetierVille('Mineur', vn, C), 0, 'sans ctx : aucun effet')
})

test('talent Éco I « Routes de l\'entrefer » : +1 Mineur et +1 Commerçant par route sortante', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const vn = nains.villes[0]
  const ctx = { state, joueur: 1 }
  state.routesCommerce = [{ id: 'r1', joueur: 1, villeOrigine: 'Capitale', joueurCible: 2, villeCible: 'Ville', amenagement: null }]
  nains.lauriers = {}
  const sans = capMetierVille('Mineur', vn, C, ctx)
  nains.lauriers = { 'Économique': 1 }
  assert.equal(capMetierVille('Mineur', vn, C, ctx) - sans, 1, '+1 Mineur par route au Laurier I')
  assert.equal(capMetierVille('Commerçant', vn, C, ctx) - capMetierVille('Commerçant', vn, C), 1, '+1 Commerçant par route au Laurier I')
  state.routesCommerce = [
    ...state.routesCommerce,
    { id: 'r2', joueur: 1, villeOrigine: 'Capitale', joueurCible: 2, villeCible: 'Ville', amenagement: null },
  ]
  assert.equal(capMetierVille('Mineur', vn, C, ctx) - sans, 2, '2 routes sortantes → +2')
})

test('talent Scien I « Savoir des profondeurs » : +0,1 Science par Mineur/Forgeron/Charbonnier du joueur, avant taxes', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const mineur = (state.population[1] ?? []).find((c) => c.statut !== 'Décédé')
  assert.ok(mineur, 'habitants au setup')
  mineur.metier = 'Mineur'
  mineur.ville = 'Capitale'
  mineur.age = Math.max(mineur.age ?? 0, 30)
  nains.lauriers = {}
  let g = detailGainsVille(state, nains, nains.villes[0], C)
  assert.equal(g.parMetier['Mineur']?.['Science'], undefined, 'sans Laurier : pas de Science des Mineurs')
  nains.lauriers = { 'Scientifique': 1 }
  g = detailGainsVille(state, nains, nains.villes[0], C)
  assert.ok(Math.abs((g.parMetier['Mineur']?.['Science'] ?? 0) - 0.1) < 1e-9, 'Laurier I : +0,1 Science par Mineur')
  // portée arbitrée : le talent est porté par le JOUEUR — un habitant
  // d'AUTRE peuple chez le Nain profite aussi du savoir-faire nain.
  mineur.peuple = 'Basiléens'
  g = detailGainsVille(state, nains, nains.villes[0], C)
  assert.ok(Math.abs((g.parMetier['Mineur']?.['Science'] ?? 0) - 0.1) < 1e-9, 'habitant d\'autre peuple chez le Nain : profite aussi (talent du joueur)')
})

test('talent Mil III « Guerre des tunnels » : -10/-20/-30 Or de levée par bâtiment nain', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const ville = { batiments: ['Poste de garde', 'Caserne', 'Barraquements', 'Chapelle'] }
  nains.lauriers = { 'Militaire': 2 }
  const avant = prixArmee(200, C, ville, nains)
  nains.lauriers = { 'Militaire': 3 }
  assert.equal(prixArmee(200, C, ville, nains), avant - 60, 'Poste+Caserne+Barraquements = -60 (Chapelle exclue)')
  nains.lauriers = {}
  assert.equal(prixArmee(200, C, ville, nains), avant, 'sans Laurier III : aucune réduction de talent')
  assert.equal(prixArmee(200, C, { batiments: ['Barraquements', 'Barraquements'] }, nains), avant, 'sans Laurier : doublon sans effet')
})

test('Isolationnistes 3e clause : poids des destinations Khazhags x0,8 pour les migrants d\'autres joueurs, interne inchangée', () => {
  const poidsPour = (peupleCible: string): number[] => {
    const setup = SETUP.map((s) => ({ ...s }))
    setup[1].peuple = peupleCible
    const state = createGame(setup, 20261116, 'local')
    // Un seul SENS de migration (J1 → J2) : la population de J2 est
    // vidée — tous les poids capturés sont des destinations CHEZ le
    // peuple testé, l'invariant x0,8 se lit sans mélange des sens.
    state.population[2] = []
    const cap = rngPoidsCaptures()
    migrationBonheur(state, cap.rng)
    return cap.poids
  }
  const basile = poidsPour('Basiléens')
  const khazhags = poidsPour('Khazhags Nains')
  assert.ok(basile.length > 0, 'des poids capturés (au moins un tirage de destination)')
  assert.equal(khazhags.length, basile.length, 'même flux de tirage (mêmes appels rng)')
  for (let i = 0; i < basile.length; i++) {
    assert.ok(Math.abs(khazhags[i] - basile[i] * 0.8) < 1e-9, `poids[${i}] : ${khazhags[i]} = ${basile[i]} × 0,8`)
  }
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  assert.equal(poidsArriveePeuple(state.players[0], C), 0.8, 'helper : Khazhags → 0,8')
  assert.equal(poidsArriveePeuple(state.players[1], C), 1, 'helper : Basiléens → 1 (défaut)')
  assert.equal(poidsArriveePeuple({ peuple: 'Inconnu' }, C), 1, 'helper : peuple sans fiche → 1')
})
