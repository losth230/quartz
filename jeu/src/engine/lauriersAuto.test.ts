// ═══════════════════════════════════════════════════════════════════════════
//  TESTS JAUGES DE LAURIERS (arbitrage Thibaut 2026-11-16 : « jauge
//  automatique avec coche manuelle »)
//
//  Invariants :
//   · TOUTES les conditions des Lauriers I à V des 5 voies définies
//     sont calculables depuis l'état ({ actuel, cible }) — la voie
//     Scientifique (différée) renvoie null ;
//   · les jauges sont PURES : aucune mutation de l'état, aucune coche
//     automatique (cocherLaurier reste le seul chemin de validation) ;
//   · arbitrages de comptage : Culturelle I = PRODUCTION de Tourisme
//     (≥ 100/tour), Culturelle V = villes des joueurs uniquement,
//     Militaire III = famille Militaire entière (quartiers inclus),
//     Militaire V = réduction totale de la meilleure habitation
//     (bâtiments + Conscription + talents, même formule que prixArmee).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import { cfgOf } from './gameData'
import { jaugeCondition, jaugeProchainLaurier } from './lauriersAuto'
import { victoryProgress } from './victory'

const SETUP: SetupLine[] = [
  { nom: 'Nains', peuple: 'Khazhags Nains', culture: 'Culture Nordique', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale'] },
  { nom: 'Basile', peuple: 'Basiléens', culture: 'Communautarisme', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Ville'] },
]

function jeu() {
  const state = createGame(SETUP, 20261116, 'local')
  const C = cfgOf(state.config)
  return { state, C, p: state.players[0] }
}

test('jauges communes Lauriers II et IV : meilleur rang d\'habitation du joueur', () => {
  const { state, C, p } = jeu()
  assert.deepEqual(jaugeCondition(state, p, 'Culturelle', 2, C), { actuel: 1, cible: 2 }, 'Hameau → 1/2')
  assert.deepEqual(jaugeCondition(state, p, 'Militaire', 4, C), { actuel: 1, cible: 3 }, 'rang 3 cible commune')
  p.villes[0].rang = 'Cité'
  assert.deepEqual(jaugeCondition(state, p, 'Culturelle', 2, C), { actuel: 2, cible: 2 }, 'Cité → 2/2')
  p.villes[0].rang = 'Grande Cité'
  assert.deepEqual(jaugeCondition(state, p, 'Militaire', 4, C), { actuel: 3, cible: 3 }, 'Grande Cité → 3/3')
})

test('Laurier I : production Tourisme, habitations, vassales, routes, armée en campagne', () => {
  const { state, C, p } = jeu()
  const tourisme = jaugeCondition(state, p, 'Culturelle', 1, C)
  assert.equal(tourisme?.cible, 100, 'Culturelle I : production ≥ 100 (arbitrage « avoir 100 tourisme = production »)')
  assert.ok(typeof tourisme?.actuel === 'number' && tourisme.actuel >= 0)
  assert.deepEqual(jaugeCondition(state, p, 'Démographique', 1, C), { actuel: 1, cible: 3 })
  assert.deepEqual(jaugeCondition(state, p, 'Diplomatique', 1, C), { actuel: 0, cible: 2 })
  assert.deepEqual(jaugeCondition(state, p, 'Économique', 1, C), { actuel: 0, cible: 2 })
  assert.deepEqual(jaugeCondition(state, p, 'Militaire', 1, C), { actuel: 0, cible: 300 })
  assert.equal(jaugeCondition(state, p, 'Scientifique', 1, C), null, 'Scientifique différée → pas de jauge')
  // vassales + routes + armée
  state.citesLibres = [
    { nom: 'Ashvattha', type: 'Industrielles - Ville', suzerain: p.n },
    { nom: 'Termina', type: 'Maritime - Ville', suzerain: null },
  ]
  state.routesCommerce = [
    { id: 'r1', joueur: p.n, villeOrigine: 'Capitale', joueurCible: 2, villeCible: 'Ville', amenagement: null },
    { id: 'r2', joueur: p.n, villeOrigine: 'Capitale', joueurCible: null, villeCible: 'Ashvattha', amenagement: null },
  ]
  p.armees.push({ nom: 'Légion', puissanceCible: 120, puissance: 120, commandant: null, soldats: [] })
  p.armees.push({ nom: 'Horde', puissanceCible: 180, puissance: 180, commandant: null, soldats: [] })
  assert.deepEqual(jaugeCondition(state, p, 'Diplomatique', 1, C), { actuel: 1, cible: 2 })
  assert.deepEqual(jaugeCondition(state, p, 'Économique', 1, C), { actuel: 2, cible: 2 })
  assert.deepEqual(jaugeCondition(state, p, 'Militaire', 1, C), { actuel: 300, cible: 300 }, 'somme des puissances = campagne')
})

test('Laurier III : merveilles, bourgeois, Empereur, Commerçants, bâtiments militaires', () => {
  const { state, C, p } = jeu()
  assert.deepEqual(jaugeCondition(state, p, 'Culturelle', 3, C), { actuel: 0, cible: 3 })
  p.villes[0].batiments.push('Ordre des chevaliers du Notan', 'Ordre des chevaliers du Notan', 'Ordre des chevaliers du Notan')
  assert.deepEqual(jaugeCondition(state, p, 'Culturelle', 3, C), { actuel: 3, cible: 3 }, '3 merveilles possédées')
  assert.deepEqual(jaugeCondition(state, p, 'Diplomatique', 3, C), { actuel: 1, cible: 5 }, 'rang par défaut = Baronnie (1)')
  p.rang = 'Empire'
  assert.deepEqual(jaugeCondition(state, p, 'Diplomatique', 3, C), { actuel: 5, cible: 5 }, 'Empire = rang de pays 5')
  // bourgeois : prestige 200 → bourgeois (100-250), pas noble
  const c = state.population[p.n][0]
  c.prestige = 200
  assert.equal(jaugeCondition(state, p, 'Démographique', 3, C)?.actuel, 1, '1 bourgeois compté')
  assert.equal(jaugeCondition(state, p, 'Démographique', 3, C)?.cible, 100)
  // Commerçants : métier porté par l'habitant
  c.metier = 'Commerçant'
  assert.equal(jaugeCondition(state, p, 'Économique', 3, C)?.actuel, 1, '1 Commerçant compté')
  assert.equal(jaugeCondition(state, p, 'Économique', 3, C)?.cible, 50)
  // 4 bâtiments de la famille Militaire dans une même habitation
  assert.deepEqual(jaugeCondition(state, p, 'Militaire', 3, C), { actuel: 0, cible: 4 })
  p.villes[0].batiments.push('Poste de garde', 'Herses', 'Réseau de routes', 'Tour de sorcier', 'Guilde des artisans de la terre')
  assert.deepEqual(jaugeCondition(state, p, 'Militaire', 3, C), { actuel: 4, cible: 4 }, 'famille Militaire entière, la guilde ne compte pas')
})

test('Laurier V : culture du monde, bonheur minimum, émissaires, guildes, réduction de levée', () => {
  const { state, C, p } = jeu()
  // Culturelle V : villes des JOUEURS uniquement, culture du joueur
  const j0 = jaugeCondition(state, p, 'Culturelle', 5, C)
  assert.equal(j0?.cible, 2, '2 villes au total (1 par joueur)')
  assert.equal(j0?.actuel, 1, 'seule la ville du joueur est de sa culture')
  for (const q of state.players) for (const v of q.villes) v.culture = p.culture
  assert.equal(jaugeCondition(state, p, 'Culturelle', 5, C)?.actuel, 2, 'monde converti → 2/2')
  // Démographique V : MINIMUM du bonheur complet
  const b = jaugeCondition(state, p, 'Démographique', 5, C)
  assert.equal(b?.cible, 90)
  assert.ok(b !== null && b.actuel >= 0 && b.actuel <= 100, 'bonheur 0-100')
  // Diplomatique V : émissaires dans la même cité libre
  assert.deepEqual(jaugeCondition(state, p, 'Diplomatique', 5, C), { actuel: 0, cible: 12 })
  state.citesLibres = [{ nom: 'Ashvattha', type: 'Industrielles - Ville', emissaires: { [p.n]: 8 } }]
  assert.deepEqual(jaugeCondition(state, p, 'Diplomatique', 5, C), { actuel: 8, cible: 12 })
  // Économique V : bâtiments de famille Guilde
  assert.deepEqual(jaugeCondition(state, p, 'Économique', 5, C), { actuel: 0, cible: 5 })
  p.villes[0].batiments.push('Guilde des artisans de la terre', 'Guilde des médecins', 'Guilde des bourgeois', 'Guilde des marchands', 'Guilde des marins')
  assert.deepEqual(jaugeCondition(state, p, 'Économique', 5, C), { actuel: 5, cible: 5 })
  // Militaire V : Conscription (Autoritarisme 10 × Baronnie 1 = 10 de base)
  assert.deepEqual(jaugeCondition(state, p, 'Militaire', 5, C), { actuel: 10, cible: 100 }, 'réduction de base : Conscription × rang 1')
  p.rang = 'Empire'
  p.villes[0].batiments.push('Ordre des chevaliers du Notan')
  assert.equal(jaugeCondition(state, p, 'Militaire', 5, C)?.actuel, 100, 'meilleure habitation : 50 Conscription + 50 merveille')
})

test('jaugeProchainLaurier : le prochain niveau, null si voie terminée ou non calculable', () => {
  const { state, C, p } = jeu()
  assert.deepEqual(jaugeProchainLaurier(state, p, 'Démographique', C), { actuel: 1, cible: 3 }, 'prochain = Laurier I (1/3 habitations)')
  p.lauriers = { 'Démographique': 3 }
  assert.deepEqual(jaugeProchainLaurier(state, p, 'Démographique', C), { actuel: 1, cible: 3 }, 'prochain = Laurier IV (rang 3)')
  p.villes[0].rang = 'Grande Cité'
  assert.deepEqual(jaugeProchainLaurier(state, p, 'Démographique', C), { actuel: 3, cible: 3 })
  p.lauriers = { 'Démographique': 5 }
  assert.equal(jaugeProchainLaurier(state, p, 'Démographique', C), null, 'voie terminée → null')
  assert.equal(jaugeProchainLaurier(state, p, 'Scientifique', C), null, 'Scientifique vide → null')
})

test('radar : la jauge calculée s\'affiche au survol, sans jamais cocher', () => {
  const { state, p } = jeu()
  p.villes[0].rang = 'Cité'
  p.lauriers = { 'Culturelle': 1 }
  const detail = victoryProgress(state)[0].details.culturelle
  assert.ok(detail.includes('prochain :'), 'texte du prochain Laurier conservé')
  assert.ok(detail.includes('(2/2)'), 'jauge du rang 2 affichée')
  assert.equal(p.lauriers?.['Culturelle'] ?? 0, 1, 'victoryProgress ne coche JAMAIS — Lauriers inchangés par le calcul')
  const detailScientifique = victoryProgress(state)[0].details.scientifique
  assert.ok(detailScientifique.includes('…') && !detailScientifique.includes('('), 'repli « … » sans jauge pour la voie vide')
})
