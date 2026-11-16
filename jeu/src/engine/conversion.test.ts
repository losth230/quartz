// ═══════════════════════════════════════════════════════════════════════════
//  TESTS CONVERSION CULTURELLE — TIRAGE PAR HABITANT (retour Thibaut
//  2026-11-16 « je préférais l'ancien », fin du duel V2
//  « Pression/Ancrage » du 2026-11-14) :
//   · chaque habitant vivant (hors Dirigeant) a conversionProba
//     (défaut 5 %) de chances par tour de se convertir ;
//   · la culture d'arrivée est tirée au hasard PONDÉRÉ par le
//     TOURISME de chaque culture du monde (pression touristique) —
//     SANS poids démographique des compatriotes (arbitrage « ancien
//     sans le poids des compatriotes ») ;
//   · la culture ACTUELLE est candidate : tirée = pas de
//     conversion ;
//   · Évangile : poids de la culture ×1,1 ; Guilde des
//     évangélistes : poids de la culture de la ville ×1,1
//     (arbitrage « comme l'évangélisme ») ; Nationalisme : +0,15 ×
//     poids des autres vers la culture d'accueil ;
//   · Tour de Crystal : proba du jet ÷1,1 (chances réduites).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { emptyRecap } from './shared'
import { applyCultureInfluence, calculPression, poidsConversion, updateCityCultures } from './culture'
import { cloneDefaultConfig, cfgOf as cfgOfConfig } from '../config/defaultConfig'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 10, pourcentageMariages: 40, villes: ['Capitale'],
}, {
  nom: 'Autre', peuple: 'NORLS', culture: 'Déisme', regime: 'Autoritarisme',
  taillePopulation: 4, pourcentageMariages: 40, villes: ['AutreCap'],
}]

function partie(): GameState {
  return createGame(SETUP, 20261116, 'local')
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

/** Rng factice configurable : chance(p) et pickWeighted renvoyant
 *  l'entrée de poids MAX (déterministe — le tirage réel est
 *  aléatoire, le test verrouille les POIDS). */
function fakeRng(o: {
  chance?: (p: number) => boolean
  poids?: Array<Record<string, number>>
}): Rng {
  return {
    chance: o.chance ?? (() => false),
    pickWeighted: (items: Array<[string, number]>) => {
      const poids = Object.fromEntries(items)
      o.poids?.push(poids)
      return items.reduce((a, b) => (b[1] > a[1] ? b : a))
    },
  } as unknown as Rng
}

/** Population d'un joueur remplacée par `n` Nordiques dans Capitale. */
function nordiques(state: GameState, p: Player, n: number): Character[] {
  const pop: Character[] = []
  for (let i = 0; i < n; i++) pop.push(perso(`A${i}`, 30))
  state.population[p.n] = pop
  return pop
}

// ── 1. Le jet : 5 % par habitant vivant, hors Dirigeant ──────────────────

test('conversion : un jet à conversionProba (5 %) par habitant VIVANT — décédés et Dirigeant immunisés', () => {
  const state = partie()
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 3)
  pop[0]!.statut = 'Décédé'
  pop[1]!.metier = 'Dirigeant'
  const probs: number[] = []
  const rng = fakeRng({ chance: (pr) => { probs.push(pr); return false } })
  applyCultureInfluence(state, p, rng, emptyRecap())
  assert.equal(probs.length, 1, 'un SEUL jet : le vivant non-Dirigeant')
  assert.ok(Math.abs(probs[0]! - 0.05) < 1e-12, 'la proba du jet est conversionProba (5 %)')
})

// ── 2. Le tirage : pondéré par le TOURISME des cultures du monde ─────────

test('conversion : le tirage est pondéré par le tourisme de CHAQUE culture (pression), SANS poids des compatriotes', () => {
  const state = partie()
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  // un seul habitant, isolé dans sa ville : AUCUN bonus de
  // compatriotes ne doit gonfler sa culture (arbitrage 2026-11-16)
  const habitant = perso('E1', 30)
  state.population[p.n] = [habitant]
  // le joueur 0 est Nordique avec du tourisme GÉNÉRAL hors villes
  p.resources['Tourisme'] = { stock: 100, prod: 0 }
  const C = cfgOf(state.config)
  const pression = calculPression(state, C)
  assert.ok((pression['Culture Nordique'] ?? 0) >= 100,
    `la pression Nordique vaut son tourisme général (≈100), obtenu ${pression['Culture Nordique']}`)
  // un autre joueur Déiste pousse sa culture : 300 de tourisme général
  const autre = state.players[1]
  if (!autre) throw new Error('joueur 1 absent')
  autre.culture = 'Déisme'
  autre.resources['Tourisme'] = { stock: 300, prod: 0 }
  const poidsRecus: Array<Record<string, number>> = []
  const rng = fakeRng({ chance: () => true, poids: poidsRecus })
  applyCultureInfluence(state, p, rng, emptyRecap())
  assert.equal(poidsRecus.length, 1, 'un tirage (le jet est passé)')
  const poids = poidsRecus[0]!
  const pN = poids['Culture Nordique'] ?? 0
  const pD = poids['Déisme'] ?? 0
  assert.ok(Math.abs(pD / pN - 3) < 1e-3,
    `Déisme pèse 3 × la Culture Nordique (tourisme 300 vs 100), obtenu ${pD}/${pN}`)
  assert.equal(habitant.culture, 'Déisme', 'le tirage (max) convertit vers le tourisme dominant')
  assert.ok(state.log.some((l) => l.texte.includes('se convertit à la culture Déisme')),
    'la conversion est journalisée')
})

// ── 3. La culture actuelle est candidate : tirée = pas de conversion ─────

test('conversion : la culture ACTUELLE est candidate — tirée (poids max), l habitant ne change pas', () => {
  const state = partie()
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const habitant = perso('E1', 30, { culture: 'Déisme' })
  state.population[p.n] = [habitant]
  // la culture actuelle (Déisme) a le poids MAX du tirage
  const autre = state.players[1]
  if (!autre) throw new Error('joueur 1 absent')
  autre.culture = 'Déisme'
  autre.resources['Tourisme'] = { stock: 500, prod: 0 }
  const rng = fakeRng({ chance: () => true })
  const recap = emptyRecap()
  const logsAvant = state.log.length
  applyCultureInfluence(state, p, rng, recap)
  assert.equal(habitant.culture, 'Déisme', 'tirée = pas de conversion')
  assert.equal(state.log.length, logsAvant, 'aucun log de conversion')
  assert.equal(Object.keys(recap.conversions).length, 0, 'aucun recap de conversion')
})

// ── 4. Guilde des évangélistes : poids de la culture de la ville ×1,1 ────

test('conversion : Guilde des évangélistes — poids de la culture de la VILLE ×1,1 (comme l Évangile, arbitrage 2026-11-16)', () => {
  const state = partie()
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const C = cfgOf(state.config)
  // guilde de TEST INJECTÉE au référentiel (effets VIDES : la vraie
  //  porte Tourisme +70 qui polluerait la pression)
  C.config.constructions.push({
    categorie: 'Bâtiment', groupe: 'Château', famille: 'Guilde',
    nom: 'Guilde test conversion', cout: '', production: '', description: '',
    effets: [], rangMinHabitation: 3, conversionLocalePlus: 0.1, couts: [],
  })
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  const pression = calculPression(state, C)
  // SANS la guilde : poids bruts
  const sans = poidsConversion(state, C, pression, ville)
  // AVEC la guilde dans la ville : la culture de la ville (Nordique)
  //  gagne ×1,1, les autres ne bougent pas
  ville.batiments = [...(ville.batiments ?? []), 'Guilde test conversion']
  const avec = poidsConversion(state, C, pression, ville)
  assert.ok(Math.abs((avec['Culture Nordique'] ?? 0) - 1.1 * (sans['Culture Nordique'] ?? 0)) < 1e-9,
    'la culture de la ville gagne ×1,1 (poids dans la conversion)')
  for (const cult of Object.keys(sans)) {
    if (cult !== 'Culture Nordique') {
      assert.ok(Math.abs((avec[cult] ?? 0) - (sans[cult] ?? 0)) < 1e-12,
        `le poids de ${cult} est inchangé`)
    }
  }
})

// ── 5. Tour de Crystal : proba du jet ÷1,1 ───────────────────────────────

test('conversion : Tour de Crystal — les chances des habitants de la ville sont réduites (proba ÷1,1)', () => {
  const state = partie()
  const p = state.players[0]
  if (!p) throw new Error('joueur absent')
  const pop = nordiques(state, p, 1)
  const ville = p.villes[0]
  if (!ville) throw new Error('ville absente')
  const probs: number[] = []
  applyCultureInfluence(state, p, fakeRng({ chance: (pr) => { probs.push(pr); return false } }), emptyRecap())
  assert.ok(Math.abs(probs[0]! - 0.05) < 1e-12, 'sans la Tour : proba pleine (5 %)')
  ville.batiments = [...(ville.batiments ?? []), 'Tour de Crystal']
  probs.length = 0
  applyCultureInfluence(state, p, fakeRng({ chance: (pr) => { probs.push(pr); return false } }), emptyRecap())
  assert.ok(Math.abs(probs[0]! - 0.05 / 1.1) < 1e-12,
    `avec la Tour : proba ÷1,1 (chances réduites de 10 %), obtenu ${probs[0]}`)
  void pop
})

// ── 6. Migration : les clés V2 sont mortes, conversionProba est semé ─────

test('conversion (migration) : une config V2 perd ses clés mortes et reçoit conversionProba 5 % — idempotent', () => {
  const c = cloneDefaultConfig()
  // config sauvegardée SOUS la V2 : les 4 clés V2 + les reliques
  const pm = c.params as unknown as Record<string, unknown>
  pm.conversionTaux = 0.1
  pm.conversionPlancher = 0.01
  pm.conversionAncrageNoble = 15
  pm.conversionPoidsLocal = 5
  pm.conversionMax = 1
  c.conversionDeterministe2026 = true
  c.conversionTaux2026 = true
  const merged = cfgOfConfig(c)
  assert.ok(merged.config.conversionTirage2026, 'tampon de la migration posé')
  const out = merged.p as unknown as Record<string, unknown>
  for (const cle of ['conversionTaux', 'conversionPlancher', 'conversionAncrageNoble', 'conversionPoidsLocal', 'conversionMax', 'conversionMemeCulture']) {
    assert.ok(out[cle] === undefined, `la clé morte ${cle} est dépouillée`)
  }
  assert.ok(Math.abs((out.conversionProba as number) - 0.05) < 1e-12,
    'conversionProba est semé par mergeParams (défaut 5 %)')
  // idempotent
  const re = cfgOfConfig(c)
  assert.ok(re.config.conversionTirage2026, 'idempotent : le tampon tient')
  assert.ok(Math.abs((re.p as unknown as Record<string, unknown>).conversionProba as number - 0.05) < 1e-12)
})

// ── 7. updateCityCultures : inchangé (majorité des vivants) ───────────────

test('conversion : updateCityCultures — la culture de la ville suit la majorité des vivants', () => {
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
