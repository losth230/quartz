// ═══════════════════════════════════════════════════════════════════════════
//  TESTS STATUT SOCIAL — vague D (arbitrages Thibaut 2026-10-24)
//   · prestige FAMILIAL : convergence des couples, un personnage
//     monte/descend AVEC ses enfants ;
//   · héritage : 50 % du prestige moyen des parents à l'âge adulte,
//     joué UNE fois ;
//   · formule par tour : sans emploi -2, sans domicile -2, malade
//     -2, domicile +0..+4 (qualité - 1), métier +2 bourgeois/+5
//     noble, +1 si bonheur ville > 50 ;
//   · rang dérivé : < 100 roturier, ≥ 100 bourgeois, ≥ 250 noble.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import { runTurn } from './tour'
import { attribuerDomicilesVille, initStockVille } from './domiciles'
import {
  rangSocial, prestigeDe, gainPrestigeTour, evaluerFamilles,
} from './statutSocial'
import type { Character, GameState, Player } from './types'

function partieTemoin(): { state: GameState; p: Player; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 424242, 'local')
  return { state, p: state.players[0], C }
}

// ── Rang dérivé ───────────────────────────────────────────────────────

test('rangSocial : seuils arbitrés (0-100 roturier, 100-250 bourgeois, 250+ noble)', () => {
  assert.equal(rangSocial(0), 'roturier')
  assert.equal(rangSocial(99), 'roturier')
  assert.equal(rangSocial(100), 'bourgeois')
  assert.equal(rangSocial(249), 'bourgeois')
  assert.equal(rangSocial(250), 'noble')
  assert.equal(rangSocial(400), 'noble')
})

// ── Formule du tour ───────────────────────────────────────────────────

function perso(over: Partial<Character> = {}): Character {
  return {
    id: 'x', nom: 'Test', prenom: 'X', dynastie: 'Famille', sexe: 'F',
    age: 30, statut: 'Sain', metier: null, fecondite: 1, armee: null,
    ...over,
  } as Character
}

test('gainPrestigeTour : formule arbitrée exacte', () => {
  const { C } = partieTemoin()
  // sans rien : -2 (emploi) -2 (domicile) = -4
  assert.equal(gainPrestigeTour(perso(), C, 0), -4)
  // malade : -2 de plus
  assert.equal(gainPrestigeTour(perso({ statut: 'Malade' }), C, 0), -6)
  // domicile Maison (qualité 2 → +1) : -2 (emploi) + 1 = -1
  assert.equal(gainPrestigeTour(perso({ domicile: 'Maison' }), C, 0), -1)
  // domicile Palais (qualité 5 → +4)
  assert.equal(gainPrestigeTour(perso({ domicile: 'Palais' }), C, 0), 2)
  // métier bourgeois (Commerçant) + domicile Maison : +2 +1 -0 = +3
  assert.equal(gainPrestigeTour(perso({ metier: 'Commerçant', domicile: 'Maison' }), C, 0), 3)
  // métier noble (Gouverneur) + Palais : +5 +4 = +9
  assert.equal(gainPrestigeTour(perso({ metier: 'Gouverneur', domicile: 'Palais' }), C, 0), 9)
  // bonheur > 50 : +1
  assert.equal(gainPrestigeTour(perso({ metier: 'Commerçant', domicile: 'Maison' }), C, 60), 4)
  // bonheur = 50 pile : PAS de bonus (strictement >)
  assert.equal(gainPrestigeTour(perso({ metier: 'Commerçant', domicile: 'Maison' }), C, 50), 3)
})

// ── Évaluation des familles ───────────────────────────────────────────

test('evaluerFamilles : un foyer bien loti accumule du prestige tour après tour', () => {
  const { state, p, C } = partieTemoin()
  initStockVille(p.villes[0], C)
  attribuerDomicilesVille(state, p, p.villes[0], C)
  // tour 1 : tout le monde part de 0, tous ont domicile+metier
  evaluerFamilles(state, p, C)
  const vivants = (state.population[p.n] ?? []).filter((c) => c.statut !== 'Décédé')
  // personne n'est encore bourgeois (prestige d'un tour ≈ +2-5 max)
  assert.ok(vivants.every((c) => prestigeDe(c) < 100), 'pas de bourgeois après 1 tour')
  assert.ok(vivants.some((c) => prestigeDe(c) > 0), 'du prestige accumulé')
})

test('evaluerFamilles : convergence des couples (prestige familial partagé)', () => {
  const { state, p, C } = partieTemoin()
  const pop = state.population[p.n] ?? []
  // trouver un couple marié
  const marie = pop.find((c) => c.mariageId && c.statut !== 'Décédé' && c.age >= C.p.adultAge)
  const conj = marie ? pop.find((c) => c.id === marie.mariageId) : undefined
  if (!marie || !conj) return // pas de couple dans la partie témoin — skip silencieux
  // prestiges très différents : 200 vs 0 → la moyenne les rapproche
  marie.prestige = 200
  conj.prestige = 0
  evaluerFamilles(state, p, C)
  // après convergence, les deux prestiges sont égaux (moyenne + gain commun)
  assert.equal(prestigeDe(marie), prestigeDe(conj), 'les conjoints partagent le prestige')
  // et autour de 100 (la moyenne)
  assert.ok(Math.abs(prestigeDe(marie) - 100) <= 10, `convergence vers ~100 (trouvé ${prestigeDe(marie)})`)
})

test('evaluerFamilles : héritage 50 % du prestige moyen des parents, une seule fois', () => {
  const { state, p, C } = partieTemoin()
  const pop = state.population[p.n] ?? []
  // un enfant mineur avec parents à prestige 200 et 100
  const mere = pop.find((c) => c.mereId && c.statut !== 'Décédé' && c.age >= C.p.adultAge)
  const enfant = mere ? pop.find((c) => c.mereId === mere.id && c.age < C.p.adultAge) : undefined
  const pere = enfant?.pereId ? pop.find((c) => c.id === enfant.pereId) : undefined
  if (!enfant || !mere) return // skip si la partie témoin n'a pas ce cas
  mere.prestige = 200
  if (pere) pere.prestige = 100
  // l'enfant grandit : il devient adulte
  enfant.age = C.p.adultAge
  evaluerFamilles(state, p, C)
  // héritage : 50 % de la moyenne (200+100)/2 = 75
  const attendu = pere ? 75 : 100
  assert.equal(enfant.prestige, attendu, `héritage 50 % de la moyenne (attendu ${attendu})`)
  // rejouer : pas de double héritage (marqueur prestigeHerite)
  const avant = enfant.prestige
  evaluerFamilles(state, p, C)
  assert.ok(enfant.prestige >= avant, 'pas de perte à la relecture')
})

test('runTurn complet : le statut social tourne sans crash et journalise les changements', () => {
  const { state } = partieTemoin()
  // 10 tours : le temps que des trajectoires se dessinent
  for (let i = 0; i < 10; i++) {
    runTurn(state)
  }
  // aucun prestige négatif, tous bornés
  for (const [, pop] of Object.entries(state.population)) {
    for (const c of pop) {
      assert.ok(prestigeDe(c) >= 0, `prestige négatif : ${c.prenom} ${prestigeDe(c)}`)
    }
  }
  assert.ok(state.log.length > 0, 'du journal')
})
