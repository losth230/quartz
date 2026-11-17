// ═══════════════════════════════════════════════════════════════════════════
//  TESTS TALENTS DE PEUPLE + FICHE KHAZHAGS NAINS (arbitrages Thibaut
//  2026-11-16, fiche complétée le 2026-11-17)
//
//  Fiche « Nains » (arbitrée) :
//   · Or des mines (base, table effetsPeuple, DIFFÉRENCIÉ 2026-11-17) :
//     +1 Commerçant par mine d'OR, +1 Mineur par CARRIÈRE,
//     +1 Forgeron par mine de FER, +1 Charbonnier par mine de
//     CHARBON (tiers inclus) ;
//   · Isolationnistes, 3e clause (base) : poids d'attraction des
//     villes x0,8 pour les migrants d'AUTRES joueurs (« poids x0,8 ») ;
//   · Économique Laurier I : +1 Mineur +1 Commerçant par route
//     sortante ; Laurier III : Commerçants +0,5 Or/tour ;
//   · Scientifique Laurier I : Mineurs/Forgerons/Charbonniers
//     +0,1 Science/tour (porté par le JOUEUR : tous ses habitants) ;
//   · Militaire Laurier I : montagne à 2 PM (PLATEAU, texte seul) ;
//     Laurier III : Poste de garde/Caserne/Barraquements -10/-20/-30
//     Or sur les levées.
//   · FACTION 2026-11-17 : bâtiment Forge (Ville ET Château, 10 Or +
//     8 Pierre, consomme 1 Bois/tour, +2 Ingénieurs +1 Charbonnier),
//     métier dédié Ingénieur (roturier, +10 % taxe d'Or ET +10 %
//     taxe de Science — équivalent Banquier + Professeur), merveille
//     mondiale unique Grand Atelier des Ingénieurs (80 Or + 40
//     Pierre + 20 Fer + 20 Charbon, consomme 1 Charbon/tour, compte
//     comme une GUILDE pour les conditions de victoire, Ingénieurs
//     du pays +20 % Or / +50 % Science au lieu de 10/10) — tous
//     trois réservés aux Khazhags Nains (champ `peuples`).
//
//  Invariant de garde : les talents sont DÉRIVÉS de p.lauriers —
//  aucun état supplémentaire ; la 3e clause est un RATIO exact (x0,8)
//  sur les poids de tirage, migration interne inchangée.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Rng } from './rng'
import type { Character } from './types'
import { cfgOf, poidsArriveePeuple } from './gameData'
import { talentsPeupleDef, talentsActifs } from './talentsPeuple'
import { capMetierVille } from './metiers'
import { detailGainsVille } from './economie'
import { prixArmee } from './armees'
import { migrationBonheur } from './migrationBonheur'
import { coutBatiment, merveilleConstruiteAilleurs, partsIngenieurJoueur } from './batiments'
import { constructionRef, effetsConstructionRef } from './constructions'
import { invaliderIndexPopulation } from './indexPopulation'

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

test('Or des mines (2026-11-17) : mines DIFFÉRENCIÉES — Or→Commerçant, Carrière→Mineur, Fer→Forgeron, Charbon→Charbonnier — peuple porteur seul, tiers inclus', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const vn = nains.villes[0]
  // (Fiche 2026-11-17 : « +1 commerçant pour les aménagements de mine
  //  d'or, +1 emplacement de mineur pour les aménagements de carrière,
  //  +1 emplacement de forgeron pour les mines de fer et +1 emplacement
  //  de charbonnier pour les mines de charbon » — un MÉTIER DÉDIÉ par
  //  TYPE DE MINE, tiers 2/3 inclus, porté par le peuple du JOUEUR.)
  const paires: Array<[string, string]> = [
    ["Mine d'Or", 'Commerçant'],
    ['Carrière', 'Mineur'],
    ['Mine de Fer', 'Forgeron'],
    ['Mine de Charbon', 'Charbonnier'],
  ]
  for (const [amenagement] of paires) {
    vn.amenagements = [...(vn.amenagements ?? []), amenagement, `${amenagement} (tier 2)`, `${amenagement} (tier 3)`]
  }
  // Écart joueur porteur (Khazhags) vs joueur NON porteur (Basiléens)
  //  sur la MÊME ville aux aménagements IDENTIQUES : l'écart isole
  //  exactement la clause peuple (3 tiers par mine → +3 par métier).
  for (const [amenagement, metier] of paires) {
    const capN = capMetierVille(metier, vn, C, { state, joueur: 1 })
    const capB = capMetierVille(metier, vn, C, { state, joueur: 2 })
    assert.equal(capN - capB, 3, `${amenagement} ×3 tiers → +3 ${metier} Khazhags`)
  }
  // Le Commerçant ne gagne PLUS rien des carrières/mines de fer et
  //  charbon (ancienne clause unifiée) : l'écart Commerçant ne vient
  //  que de la mine d'Or.
  assert.equal(capMetierVille('Commerçant', vn, C, { state, joueur: 1 })
    - capMetierVille('Commerçant', vn, C, { state, joueur: 2 }), 3, 'Commerçant : mine d\'Or seule, plus les autres mines')
  assert.equal(capMetierVille('Mineur', vn, C) - capMetierVille('Mineur', vn, C), 0, 'sans ctx : aucun effet peuple')
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

// ── FACTION 2026-11-17 : Forge, métier Ingénieur, Grand Atelier des
//  Ingénieurs (arbitrages Thibaut du jour). ─────────────────────────────

/** Perso de test (patron metiers.test.ts) — roturier, en ville. */
function persoFaction(id: string, age: number, metier: string | null, ville: string = 'Capitale'): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Culture Nordique', ville, orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Stérile', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null, pereBio: null, pereBioId: null, enfantBatard: false,
    metier, fecondite: 0, armee: null, peuple: 'Khazhags Nains',
  }
}

test('Forge (2026-11-17) : 10 Or + 8 Pierre, consomme 1 Bois/tour, +2 Ingénieurs +1 Charbonnier — Ville et Château', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const vn = state.players[0].villes[0]
  // coût structuré des DEUX variantes de groupe
  assert.deepEqual(coutBatiment('Forge', C, 'Ville'), { Or: 10, Pierre: 8 }, 'coût Forge Ville')
  assert.deepEqual(coutBatiment('Forge', C, 'Château'), { Or: 10, Pierre: 8 }, 'coût Forge Château')
  // consommation (canal banque, comme le Moulin à vent Charbon -1)
  const refVille = constructionRef('Forge', C.config, 'Ville')
  const refChateau = constructionRef('Forge', C.config, 'Château')
  assert.deepEqual(effetsConstructionRef(refVille!), { Bois: -1 }, 'Forge Ville : -1 Bois / tour')
  assert.deepEqual(effetsConstructionRef(refChateau!), { Bois: -1 }, 'Forge Château : -1 Bois / tour')
  // emplacements : l'Ingénieur (non productif, base 0) est NON
  //  plafonné sans Forge (patron Banquier), plafonné à 2 avec une
  //  Forge ; le Charbonnier gagne +1.
  assert.equal(capMetierVille('Ingénieur', vn, C), Number.POSITIVE_INFINITY, 'sans Forge : Ingénieur non plafonné')
  const charbonAvant = capMetierVille('Charbonnier', vn, C)
  vn.batiments = [...(vn.batiments ?? []), 'Forge']
  assert.equal(capMetierVille('Ingénieur', vn, C), 2, '+2 emplacements Ingénieur par Forge')
  vn.batiments = [...vn.batiments, 'Forge']
  assert.equal(capMetierVille('Ingénieur', vn, C), 4, '2 Forges → 4 Ingénieurs (cumul)')
  assert.equal(capMetierVille('Charbonnier', vn, C) - charbonAvant, 2, '+1 Charbonnier par Forge (2 Forges → +2)')
  // réservation de peuple portée par le RÉFÉRENTIEL (le mutateur refuse)
  assert.deepEqual(constructionRef('Forge', C.config, 'Ville')?.peuples, ['Khazhags Nains'], 'Forge réservée aux Khazhags Nains')
})

test('Ingénieur (2026-11-17) : +10 % taxe d\'Or ET +10 % taxe de Science dans la ville — équivalent Banquier + Professeur, additif', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const vn = nains.villes[0]
  state.population[nains.n] = [
    persoFaction('f-com', 30, 'Commerçant'),
    persoFaction('f-sci', 40, 'Scientifique'),
  ]
  invaliderIndexPopulation()
  const base = detailGainsVille(state, nains, vn, C)
  assert.ok(base.taxes['Or'] !== undefined && base.taxes['Science'] !== undefined, 'Or et Science produits')
  assert.equal(Object.keys(base.bonusTaxes).length, 0, 'aucun bonus sans Ingénieur')
  state.population[nains.n].push(persoFaction('f-ing', 45, 'Ingénieur'))
  invaliderIndexPopulation()
  const avec = detailGainsVille(state, nains, vn, C)
  assert.ok(Math.abs(avec.bonusTaxes['Or'] - 0.1) < 1e-9, 'Ingénieur : +10 % taxe d\'Or')
  assert.ok(Math.abs(avec.bonusTaxes['Science'] - 0.1) < 1e-9, 'Ingénieur : +10 % taxe de Science')
  assert.ok(Math.abs(avec.taxes['Or'] - base.taxes['Or'] * 1.1) < 1e-9, 'la taxe d\'Or monte de 10 %')
  assert.ok(Math.abs(avec.taxes['Science'] - base.taxes['Science'] * 1.1) < 1e-9, 'la taxe de Science monte de 10 %')
  // cumul ADDITIF avec un Banquier (patron vague 3a)
  state.population[nains.n].push(persoFaction('f-banq', 50, 'Banquier'))
  invaliderIndexPopulation()
  const cumul = detailGainsVille(state, nains, vn, C)
  assert.ok(Math.abs(cumul.bonusTaxes['Or'] - 0.2) < 1e-9, 'Ingénieur + Banquier : +20 % Or (additif)')
  // métier du référentiel : roturier, pas de production propre
  const td = C.metiers.find((t) => t.metier === 'Ingénieur')
  assert.ok(td, 'ligne métier Ingénieur au référentiel')
  assert.equal(td?.qualite, 'roturier', 'Ingénieur : roturier (arbitrage)')
  assert.equal(td?.valeur1, 0, 'pas de production propre')
})

test('Grand Atelier des Ingénieurs (2026-11-17) : les Ingénieurs du pays passent à +20 % Or / +50 % Science AU LIEU DE 10/10', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  const nains = state.players[0]
  const vn = nains.villes[0]
  // parts par défaut : 10/10, idem sans le bâtiment
  assert.deepEqual(partsIngenieurJoueur(nains, C), { or: 0.1, science: 0.1 }, 'parts par défaut +10/+10')
  state.population[nains.n] = [
    persoFaction('f-com', 30, 'Commerçant'),
    persoFaction('f-sci', 40, 'Scientifique'),
    persoFaction('f-ing', 45, 'Ingénieur'),
  ]
  invaliderIndexPopulation()
  vn.batiments = [...(vn.batiments ?? []), 'Grand Atelier des Ingénieurs']
  // parts REMPLACÉES (pas additives) : 20/50
  assert.deepEqual(partsIngenieurJoueur(nains, C), { or: 0.2, science: 0.5 }, 'Grand Atelier : parts 20/50')
  const avec = detailGainsVille(state, nains, vn, C)
  assert.ok(Math.abs(avec.bonusTaxes['Or'] - 0.2) < 1e-9, 'taxe d\'Or : +20 %')
  assert.ok(Math.abs(avec.bonusTaxes['Science'] - 0.5) < 1e-9, 'taxe de Science : +50 %')
  // consommation : 1 Charbon / tour (canal banque)
  assert.deepEqual(effetsConstructionRef(constructionRef('Grand Atelier des Ingénieurs', C.config)!), { Charbon: -1 }, '-1 Charbon / tour')
  assert.deepEqual(coutBatiment('Grand Atelier des Ingénieurs', C), { Or: 80, Pierre: 40, Fer: 20, Charbon: 20 }, 'coût 80 Or + 40 Pierre + 20 Fer + 20 Charbon')
  // « compte comme une guilde » : famille Guilde au référentiel
  assert.equal(constructionRef('Grand Atelier des Ingénieurs', C.config)?.famille, 'Guilde', 'famille Guilde (conditions de victoire, limite 1/ville)')
  assert.equal(constructionRef('Grand Atelier des Ingénieurs', C.config)?.uniqueAuMonde, true, 'drapeau uniqueAuMonde')
  assert.deepEqual(constructionRef('Grand Atelier des Ingénieurs', C.config)?.peuples, ['Khazhags Nains'], 'réservé aux Khazhags Nains')
})

test('Grand Atelier : merveille UNIQUE AU MONDE via le drapeau uniqueAuMonde (famille Guilde)', () => {
  const state = createGame(SETUP, 20261116, 'local')
  const nains = state.players[0]
  const basile = state.players[1]
  const nom = 'Grand Atelier des Ingénieurs'
  // construit chez Basiléens → refusé pour les Nains (et inversement)
  basile.villes[0].batiments = [...(basile.villes[0].batiments ?? []), nom]
  const ailleurs = merveilleConstruiteAilleurs(state, nom, 1, 'Capitale')
  assert.ok(ailleurs, 'déjà construit ailleurs → non null')
  assert.equal(ailleurs?.joueur, 2, 'propriétaire : joueur 2')
  assert.equal(ailleurs?.villeNom, 'Ville', 'ville : Ville')
  assert.equal(merveilleConstruiteAilleurs(state, nom, 2, 'Ville'), null, 'le propriétaire n\'est pas bloqué par son propre exemplaire')
  // une MERVEILLE de famille Merveille garde son comportement (régression)
  const merveille = cfgOf(state.config).config.constructions.find((c) => c.famille === 'Merveille')
  assert.ok(merveille, 'une merveille familiale existe au référentiel')
  nains.villes[0].batiments = [...(nains.villes[0].batiments ?? []), merveille!.nom]
  assert.ok(merveilleConstruiteAilleurs(state, merveille!.nom, 2, 'Ville'), 'les merveilles familiales restent uniques au monde')
  // un bâtiment COMMUN n'est jamais bloquant (régression)
  assert.equal(merveilleConstruiteAilleurs(state, 'Forge', 1, 'Capitale'), null, 'la Forge n\'est pas unique au monde')
})
