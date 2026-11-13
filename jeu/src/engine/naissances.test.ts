// ═══════════════════════════════════════════════════════════════════════════
//  TESTS NAISSANCES — conception et accouchement
//
//  Arbitrage Thibaut 2026-11-13 : « une femme ne peut pas accoucher et
//  tomber enceinte au même tour ». AVANT, l'étape 1 (accouchements)
//  remettait la mère à 'Sain' et l'étape 2 (conceptions) la reprennait
//  immédiatement : une jeune mère au cap de proba (fertBaseRate 1,
//  facteurs cumulés ≥ 1) enchaînait un bébé PAR TOUR sans délai. Ces
//  tests verrouillent :
//   · l'exclusion du jet de conception au tour de l'accouchement ;
//   · la portée UN tour de l'exclusion (pas de cooldown persistant) :
//     au tour suivant, la mère est de nouveau éligible ;
//   · le contrôle positif : une femme éligible du même tour conçoit.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf } from './gameData'
import { makeRng } from './rng'
import { emptyRecap } from './shared'
import { conceptionEtNaissances } from './naissances'
import type { Character, GameState } from './types'

function partie(seed = 20261113): { state: GameState; C: ReturnType<typeof cfgOf> } {
  const state = createGame(defaultSetups(), seed, 'local')
  const C = cfgOf(state.config)
  // Neutralise le régime de chaque joueur (patron mouvements.test.ts :
  //  les lois de régime modifieraient les tirages).
  for (const pl of state.players) pl.regime = 'Aucun régime (test naissances)'
  return { state, C }
}

/** Habitant de test (tuple de 3 traits — aucun ne porte de fertAdd
 *  au référentiel : le facteur traits vaut exactement 1). */
function hab(id: string, age: number, ville: string): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Déisme', ville, orientation: 'Hétérosexuel',
    traits: ['Fécond', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: null, fecondite: 0, armee: null,
  }
}

test('accouchement : une femme ne conçoit PAS au tour de son accouchement (arbitrage Thibaut 2026-11-13)', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes[0]!.nom
  const mere = hab('mere-acc', 22, ville)
  mere.sexe = 'F'
  mere.statut = 'Enceinte'
  const temoin = hab('temoin-acc', 22, ville)
  temoin.sexe = 'F'
  temoin.statut = 'Sain'
  state.population[p.n] = [mere, temoin]
  // grossesse simple certaine + conception certaine pour toute femme
  //  éligible (célibataire au taux plein : sans l'exclusion, la mère
  //  qui vient d'accoucher concevrait à 100 % dans la foulée)
  C.p.fertBaseRate = 1
  C.p.fertSingleFactor = 1
  C.p.fertTwinsRate = 0
  C.p.fertTripletsRate = 0
  C.p.adulteryRate = 0
  const recap = emptyRecap()
  conceptionEtNaissances(state, p, makeRng(20261113), recap)
  // ⚠ Capture AVANT tout assert (patron incident dogmes 5583313d :
  //  un assert rétrécit le type de la propriété assertée).
  const popApres = state.population[p.n] ?? []
  const bebes = popApres.filter((x) => x.age === 0)
  assert.ok(bebes.length >= 1, 'la mère a accouché (au moins un nouveau-né)')
  assert.equal(mere.statut, 'Sain',
    "la mère n'est PAS retombée enceinte le tour de son accouchement")
  assert.equal(temoin.statut, 'Enceinte',
    'contrôle : une femme éligible du même tour conçoit bien (le jet a tourné)')
  // le tour SUIVANT : la mère redevient éligible — l'exclusion porte
  //  sur UN tour, pas de cooldown persistant (aucun champ d'état)
  conceptionEtNaissances(state, p, makeRng(1), emptyRecap())
  assert.equal(mere.statut, 'Enceinte',
    "au tour suivant, la mère redevenue éligible conçoit (délai d'un tour)")
  // et son accouchement suivant ne peut pas intervenir avant un tour
  // au 2e tour, le TÉMOIN (enceinte depuis le 1er) accouche à son
  //  tour — et est exclue lui aussi de la conception : 'Sain', pas
  //  de nouvelle grossesse immédiate (double vérification de la
  //  règle sur un second personnage)
  assert.equal(temoin.statut, 'Sain',
    "le témoin, enceinte au 2e tour, accouche sans re-concevoir : la règle tient pour tout le monde")
})
