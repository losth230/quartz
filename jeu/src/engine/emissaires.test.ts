// ═══════════════════════════════════════════════════════════════════════════
//  TESTS ÉMISSAIRES DES BÂTIMENTS — Délégation / Chancellerie / Ambassade
//  (arbitrage Thibaut 2026-11-03)
//
//  Arbitrages actés :
//   · trois nouveaux bâtiments CHÂTEAU, chaîne de tiers avec émissaires
//     « tant que ce bâtiment est construit » : Délégation (tier 1,
//     10 Or + 4 Soie, +1 émissaire), Chancellerie (tier 2, Délégation
//     requise, 20 Or + 4 Pierres + 6 Soies, REMPLACE la Délégation,
//     +2 émissaires), Ambassade (tier 3, Chancellerie requise,
//     40 Or + 4 Charbons + 10 Soies, REMPLACE la Chancellerie,
//     +4 émissaires) ;
//   · modélisation en valeur d'ÉTAT (patron routesApportees de
//     l'Échoppe) : champ emissairesApportes du référentiel, compté
//     par emissairesBatimentsJoueur (engine/batiments.ts) — la
//     réserve MOBILISABLE du joueur = p.emissaires (réserve manuelle,
//     revue 2026-10-15) + ce bonus (CitesLibresView.changerEmissaires,
//     carte « Réserves d'émissaires ») ;
//   · les REMPLACÉS ne comptent PLUS (patron batimentsRemplaces) :
//     la Chancellerie neutralise le +1 de la Délégation, l'Ambassade
//     le +2 de la Chancellerie ;
//   · un émissaire déjà PLACÉ dans une cité libre reste placé si le
//     bâtiment disparaît (la validation se fait sur la réserve
//     mobilisable, pas sur les placements passés).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { City, GameState } from './types'
import { cfgOf } from './gameData'
import { emissairesBatimentsJoueur } from './batiments'
import { constructionRef, resumeConstruction } from './constructions'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

function partie(): GameState {
  return createGame(SETUP, 20261020, 'local')
}

/** Château de test avec les bâtiments donnés (patron metiers.test.ts). */
function chateau(p: GameState['players'][number], batiments: string[]): City {
  return { ...p.villes[0], type: 'Château', rang: 'Motte', batiments, amenagements: [] }
}

test('emissairesBatimentsJoueur (arbitrage Thibaut 2026-11-03) : Délégation +1, Chancellerie +2 (le +1 remplacé ne compte plus), Ambassade +4', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]

  // joueur sans bâtiments émissaires : bonus 0
  assert.equal(emissairesBatimentsJoueur(p, C), 0, 'sans bâtiment émissaire : bonus 0')

  // Délégation seule (tier 1) : +1 émissaire tant que construite
  p.villes[0] = chateau(p, ['Délégation'])
  assert.equal(emissairesBatimentsJoueur(p, C), 1, 'Délégation : +1 émissaire')

  // Chancellerie (tier 2) remplace la Délégation : SEUL le +2 compte
  p.villes[0] = chateau(p, ['Délégation', 'Chancellerie'])
  assert.equal(emissairesBatimentsJoueur(p, C), 2,
    'Chancellerie remplace la Délégation : +2 (le +1 neutralisé ne compte plus)')

  // Chancellerie seule (Délégation déjà détruite) : +2
  p.villes[0] = chateau(p, ['Chancellerie'])
  assert.equal(emissairesBatimentsJoueur(p, C), 2, 'Chancellerie seule : +2 émissaires')

  // Ambassade (tier 3) remplace la Chancellerie : SEUL le +4 compte
  p.villes[0] = chateau(p, ['Chancellerie', 'Ambassade'])
  assert.equal(emissairesBatimentsJoueur(p, C), 4,
    'Ambassade remplace la Chancellerie : +4 (le +2 neutralisé ne compte plus)')

  // chaîne complète encore présente : seule l'Ambassade compte
  p.villes[0] = chateau(p, ['Délégation', 'Chancellerie', 'Ambassade'])
  assert.equal(emissairesBatimentsJoueur(p, C), 4,
    'Délégation + Chancellerie + Ambassade : seule l Ambassade (+4) compte')
})

test('emissairesBatimentsJoueur : le bonus se CUMULE entre villes, et un bâtiment non-émissaire ne compte pas', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]

  // deux châteaux, chacun avec sa Délégation : +2 au total
  p.villes[0] = chateau(p, ['Délégation'])
  p.villes.push({ ...chateau(p, ['Délégation']), nom: 'Second château' })
  assert.equal(emissairesBatimentsJoueur(p, C), 2, 'deux Délégations (2 villes) : +2 au total')

  // un château avec l Ambassade, l autre avec la Délégation : +4 +1 = +5
  p.villes[1] = { ...chateau(p, ['Chancellerie', 'Ambassade']), nom: 'Second château' }
  assert.equal(emissairesBatimentsJoueur(p, C), 5, 'Ambassade (+4) dans une ville, Délégation (+1) dans l autre : +5')

  // bâtiment sans emissairesApportes (ex. Échoppe, +1 route) : ne compte pas
  p.villes.pop()
  p.villes[0] = chateau(p, ['Échoppe'])
  assert.equal(emissairesBatimentsJoueur(p, C), 0, 'Échoppe (+1 route, pas d émissaires) : bonus 0')
})

test('resumeConstruction (arbitrage Thibaut 2026-11-03) : le libellé des bâtiments émissaires affiche « +N émissaire(s) »', () => {
  const state = partie()
  const C = cfgOf(state.config)

  const delegation = constructionRef('Délégation', C.config, 'Château')
  assert.ok(delegation, 'Délégation présente dans le référentiel (groupe Château)')
  assert.ok(resumeConstruction(delegation, C.config).includes('+1 émissaire'),
    `libellé Délégation : ${resumeConstruction(delegation, C.config)}`)
  assert.equal(delegation?.couts?.length, 2, 'Délégation : 2 coûts (10 Or, 4 Soie)')

  const chancellerie = constructionRef('Chancellerie', C.config, 'Château')
  assert.ok(chancellerie, 'Chancellerie présente dans le référentiel (groupe Château)')
  assert.ok(resumeConstruction(chancellerie, C.config).includes('+2 émissaires'),
    `libellé Chancellerie : ${resumeConstruction(chancellerie, C.config)}`)
  assert.equal(chancellerie?.requis, 'Délégation', 'Chancellerie : Délégation requise')

  const ambassade = constructionRef('Ambassade', C.config, 'Château')
  assert.ok(ambassade, 'Ambassade présente dans le référentiel (groupe Château)')
  assert.ok(resumeConstruction(ambassade, C.config).includes('+4 émissaires'),
    `libellé Ambassade : ${resumeConstruction(ambassade, C.config)}`)
  assert.deepEqual(ambassade?.remplaceBatiment, ['Chancellerie'],
    'Ambassade : remplace la Chancellerie')
})
