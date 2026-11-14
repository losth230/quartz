// ═══════════════════════════════════════════════════════════════════════════
//  TESTS CONVERSION CULTURELLE V2 « Pression/Ancrage » (arbitrage Thibaut
//  2026-11-14 « proposer autre chose, plus cohérent et plus jouable de
//  manière technique ») — duel déterministe par ville :
//   · Force(culture) = pression touristique mondiale + poids
//     démographique local (conversionPoidsLocal × vivants de la
//     culture dans la ville) ;
//   · la culture dominante convertit les habitants dont l'ANCRAGE
//     (compatriotes × poids + noblesse) est dépassé, les moins
//     ancrés d'abord (ex æquo : ordre de recensement), au plus
//     conversionMax par ville et par tour (défaut 1, PROVISOIRE) ;
//   · Dirigeant immunisé ; nobles convertis en dernier ;
//   · plancher minuscule (conversionPlancher, 1 %) : une ville
//     100 % homogène tente UNE conversion vers la culture
//     étrangère la plus forte — en ville mixte, l'ancrage protège
//     totalement (aucun rng).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { emptyRecap } from './shared'
import { applyCultureInfluence, detailConversionVille, updateCityCultures } from './culture'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale'],
}]

function partie(): GameState {
  return createGame(SETUP, 20261114, 'local')
}

/** Personnage de test complet (patron tier3.test.ts — tuples de 3
 *  traits pour la CI tsc strict), culture paramétrable. */
function perso(id: string, age: number, o: { metier?: string | null; ville?: string; culture?: string; prestige?: number; dynastie?: string } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: o.dynastie ?? 'Roturier', sexe: 'F', age,
    culture: o.culture ?? 'Culture Nordique', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
    prestige: o.prestige ?? 0,
  }
}

/** Rng factice configurable (patron dogmes.test.ts) — seule la face
 *  `chance` sert au plancher ; le cast final évite d'implémenter les
 *  8 faces de l'interface. */
function fakeRng(o: { chance?: (p: number) => boolean }): Rng {
  return { chance: o.chance ?? (() => false) } as unknown as Rng
}

/** Population d'un joueur remplacée par `n` Nordiques dans Capitale. */
function nordiques(state: GameState, p: Player, n: number): Character[] {
  const pop: Character[] = []
  for (let i = 0; i < n; i++) pop.push(perso(`A${i}`, 30))
  state.population[p.n] = pop
  return pop
}

// ── 1. Ville homogène : duel lisible + plancher minuscule ─────────────────

test('V2 conversion : ville homogène — dominant unique, plancher 1 % vers l étrangère la plus forte, RIEN sans le rng', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 10)
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  // détail : la démocratie locale écrase les pressions de base (0,001)
  const d = detailConversionVille(state, p, ville, C)
  assert.equal(d.dominant, 'Culture Nordique', 'les 10 Nordiques dominent')
  assert.equal(d.convertibles.length, 0, 'aucun éligible : ville 100 % dominante')
  assert.ok(d.plancher, 'ville homogène → plancher actif')
  assert.equal(d.plancherVers, 'Communautarisme',
    'le plancher vise la première culture du référentiel (pressions de base égales)')
  const fN = d.forces['Culture Nordique']?.force
  assert.ok(fN !== undefined && Math.abs(fN - 50) < 1e-9, 'force Nordique = poids × 10 vivants')
  // sans le rng : AUCUNE conversion, un seul jet (le plancher)
  let jets = 0
  let recap = emptyRecap()
  applyCultureInfluence(state, p, fakeRng({ chance: () => { jets++; return false } }), recap)
  assert.equal(jets, 1, 'un seul jet rng par ville : le plancher')
  assert.equal(Object.keys(recap.conversions).length, 0, 'le plancher raté ne convertit personne')
  // avec le rng : 1 conversion, le PREMIER au recensement
  jets = 0
  recap = emptyRecap()
  applyCultureInfluence(state, p, fakeRng({ chance: () => { jets++; return true } }), recap)
  assert.equal(jets, 1)
  assert.equal(pop[0]!.culture, 'Communautarisme', 'premier au recensement bascule')
  assert.equal(recap.conversions['Communautarisme'], 1, 'récap de conversions crédité')
  assert.ok(state.log.some((l) => l.type === 'Culture' && l.texte.includes('se convertit à la culture Communautarisme')),
    'journal de conversion standard')
})

// ── 2. Minorité fond à 1 par tour (cap conversionMax) ─────────────────────

test('V2 conversion : minorité fond à 1 par ville-tour (cap conversionMax), ordre de recensement, AUCUN jet rng', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 40)
  const minorite: Character[] = []
  for (let i = 0; i < 10; i++) {
    const c = perso(`B${i}`, 30, { culture: 'Déisme' })
    minorite.push(c)
    pop.push(c)
  }
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  const d = detailConversionVille(state, p, ville, C)
  assert.equal(d.dominant, 'Culture Nordique', '40 Nordiques écrasent 10 Déistes')
  assert.equal(d.convertibles.length, 1, 'cap : UNE conversion prévue par ville-tour')
  const cible = d.convertibles[0]
  assert.ok(cible && cible.vers === 'Culture Nordique')
  // moteur : déterministe, zéro rng
  let jets = 0
  let recap = emptyRecap()
  applyCultureInfluence(state, p, fakeRng({ chance: () => { jets++; return true } }), recap)
  assert.equal(jets, 0, 'ville mixte : aucun jet rng, la conversion est déterministe')
  assert.equal(minorite[0]!.culture, 'Culture Nordique', 'le premier Déiste au recensement bascule')
  assert.equal(recap.conversions['Culture Nordique'], 1)
  // 2e tour : le suivant (le converti d avant est redevenu majoritaire)
  applyCultureInfluence(state, p, fakeRng({ chance: () => { jets++; return true } }), recap)
  assert.equal(minorite[1]!.culture, 'Culture Nordique', 'au tour suivant, un seul autre bascule')
  assert.equal(minorite.filter((c) => c.culture === 'Déisme').length, 8, 'la minorité fond à 1 par tour')
})

// ── 3. conversionMax réglable (PROVISOIRE, équilibrage en second temps) ───

test('V2 conversion : conversionMax est un paramètre réglable (3 → 3 conversions par ville-tour)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 40)
  for (let i = 0; i < 10; i++) pop.push(perso(`B${i}`, 30, { culture: 'Déisme' }))
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  C.p.conversionMax = 3
  const d = detailConversionVille(state, p, ville, C)
  assert.equal(d.convertibles.length, 3, 'cap réglé à 3 : trois conversions prévues')
  const recap = emptyRecap()
  applyCultureInfluence(state, p, fakeRng({ chance: () => true }), recap)
  assert.equal(recap.conversions['Culture Nordique'], 3, 'trois Déistes convertis d un coup')
})

// ── 4. Tourisme massif renverse une ville pure ────────────────────────────

test('V2 conversion : un tourisme étranger massif RENVERSE une ville pure (pression > démographie locale)', () => {
  const SETUP2: SetupLine[] = [
    { nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
      taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale'] },
    { nom: 'Étranger', peuple: 'NORLS', culture: 'Déisme', regime: 'Autoritarisme',
      taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale2'] },
  ]
  const state = createGame(SETUP2, 20261114, 'local')
  const C = cfgOf(state.config)
  const p = state.players[0]
  const etranger = state.players[1]
  if (!p || !etranger) throw new Error('joueurs absents')
  const pop = nordiques(state, p, 50)
  // tourisme GÉNÉRAL du joueur Déiste : pression Déisme = 300
  etranger.resources['Tourisme'] = { stock: 300, prod: 0 }
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  const d = detailConversionVille(state, p, ville, C)
  // force Déisme = 300,001 vs Nordique = 50 × 5 = 250 : RENVERSEMENT
  assert.equal(d.dominant, 'Déisme', 'la pression touristique dépasse la démographie locale')
  assert.ok(!d.plancher, 'la ville a des éligibles (50 Nordiques) : duel, pas plancher')
  assert.equal(d.convertibles.length, 1, 'cap : un Nordique bascule ce tour')
  const recap = emptyRecap()
  applyCultureInfluence(state, p, fakeRng({ chance: () => true }), recap)
  assert.equal(pop[0]!.culture, 'Déisme', 'le premier Nordique est converti au Déisme')
  assert.equal(recap.conversions['Déisme'], 1)
})

// ── 5. Ancrage : l'isolé bascule avant la communauté ──────────────────────

test('V2 conversion : l ancrage ordonne les conversions — l isolé avant la communauté (ex æquo : recensement)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 22)
  const isole = perso('L1', 30, { culture: 'Lunisme' })
  pop.push(isole)
  for (let i = 0; i < 20; i++) pop.push(perso(`D${i}`, 30, { culture: 'Déisme' }))
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  const d = detailConversionVille(state, p, ville, C)
  // ancrage : Lunisme isolé = 5 ; Déisme = 100 ; Nordique force = 110
  assert.equal(d.convertibles.length, 1, 'cap 1 : l isolé (ancrage 5) passe AVANT la communauté (ancrage 100)')
  const c1 = d.convertibles[0]
  assert.ok(c1 && c1.id === 'L1', 'le Lunisme isolé est le moins ancré')
  C.p.conversionMax = 2
  const d2 = detailConversionVille(state, p, ville, C)
  const deuxieme = d2.convertibles[1]
  assert.ok(deuxieme && deuxieme.id === 'D0', 'ensuite le premier Déiste au recensement')
})

// ── 6. Nobles : ancrage +15, convertis en dernier / protégés ──────────────

test('V2 conversion : le noble résiste (ancrage + conversionAncrageNoble) là où le roturier bascule', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 20)
  // la force Nordique doit dépasser l'ancrage roturier (100) mais
  //  pas l'ancrage noble (115) : +10 de tourisme général
  p.resources['Tourisme'] = { stock: 10, prod: 0 }
  const roturier = perso('R1', 30, { culture: 'Déisme' })
  const noble = perso('N1', 30, { culture: 'Déisme', prestige: 300 })
  pop.push(roturier, noble)
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  const d = detailConversionVille(state, p, ville, C)
  assert.equal(d.convertibles.length, 1, 'seul le roturier passe sous la force dominante')
  const c1 = d.convertibles[0]
  assert.ok(c1 && c1.id === 'R1', 'le noble (ancrage 115 > force 110) résiste')
  // vérification du rang : le prestige 300 fait bien un noble
  assert.equal(noble.prestige, 300)
  const recap = emptyRecap()
  applyCultureInfluence(state, p, fakeRng({ chance: () => true }), recap)
  assert.equal(roturier.culture, 'Culture Nordique', 'le roturier bascule')
  assert.equal(noble.culture, 'Déisme', 'le noble reste Déiste')
})

// ── 7. Dirigeant immunisé ─────────────────────────────────────────────────

test('V2 conversion : le Dirigeant est immunisé (comportement conservé) et sa seule présence neutralise le plancher', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 10)
  const dirigeant = perso('X1', 40, { culture: 'Déisme', metier: 'Dirigeant' })
  pop.push(dirigeant)
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  const d = detailConversionVille(state, p, ville, C)
  assert.equal(d.dominant, 'Culture Nordique')
  assert.equal(d.convertibles.length, 0, 'le Dirigeant n est jamais éligible')
  assert.ok(!d.plancher, 'la ville n est pas homogène : pas de plancher')
  let jets = 0
  const recap = emptyRecap()
  applyCultureInfluence(state, p, fakeRng({ chance: () => { jets++; return true } }), recap)
  assert.equal(jets, 0, 'rien à tenter : aucun jet rng')
  assert.equal(dirigeant.culture, 'Déisme', 'le Dirigeant garde sa culture')
  assert.equal(Object.keys(recap.conversions).length, 0)
})

// ── 8. Culture de la ville : la majorité des vivants ───────────────────────

test('V2 conversion : updateCityCultures — la culture de la ville suit la majorité des vivants', () => {
  const state = partie()
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 4)
  for (let i = 0; i < 6; i++) pop.push(perso(`D${i}`, 30, { culture: 'Déisme' }))
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  updateCityCultures(state, p)
  assert.equal(ville.culture, 'Déisme', '6 Déistes contre 4 Nordiques : la ville devient Déiste')
})
