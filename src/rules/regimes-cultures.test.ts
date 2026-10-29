// ═════════════════════════════════════════════════════════════════════════
//  TESTS RÉGIMES & CULTURES ↔ BANQUE (voie unique, brûlage #3 source
//  2/3, 2026-10-20)
//
//  Retour Thibaut « toute production passe par la banque » : la loi
//  chiffrée du RÉGIME (Socialisme) vivait dans le REGISTRE
//  (reglesRegimes) et le moteur ne faisait que LIRE la banque.
//  (RETRAIT 2026-10-29, refonte « 12 lois » : la source 'culture'
//  QUITTE la banque — les règles de pays des cultures sont
//  supprimées.)
//  (RETRAIT 2026-10-29, refonte « 8 lois » des régimes — REMPLACÉ/
//  HISTORISÉ : la source 'regime' QUITTE la banque à son tour
//  (reglesRegimes et effetsRegime supprimés) — plus AUCUNE loi de
//  régime ne vit dans le registre, les huit lois vivent dans le
//  moteur (tests : src/engine/regimes.test.ts). Ces tests
//  verrouillent :
//   · l'ABSENCE de toute règle de régime ET de culture dans la
//     banque (registre = constructions seules) ;
//   · les lois d'HABITANT des cultures (culture hors référentiel
//     → aucune loi) ;
//   · le chemin moteur 3septies (appliquerEffetsRegimesCultures,
//     SANS saison — lois d'habitants seules).
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  loisHabitants, detailLoisHabitants, appliquerEffetsRegimesCultures,
} from '../engine/regimes'
import { cfgOf } from '../engine/gameData'
import { registreComplet } from './registry'
import { partieMock } from './mocks'

const C_DEFAUT = cfgOf(undefined)

test('registre : constructions seules — PLUS AUCUNE règle de régime ni de culture', () => {
  const regles = registreComplet(C_DEFAUT)
  assert.ok(regles.every((r) => (r.source as string) !== 'regime'), 'aucune règle de régime dans la banque')
  assert.ok(regles.every((r) => (r.source as string) !== 'culture'), 'aucune règle de culture dans la banque')
  assert.ok(!regles.some((r) => r.id.startsWith('regime.')), 'aucun id regime.* dans le registre')
  assert.ok(!regles.some((r) => r.id.startsWith('culture.')), 'aucun id culture.* dans le registre')
})

test('loisHabitants : culture hors référentiel (mock « Culture Nordique ») → aucune loi', () => {
  const { state, joueur } = partieMock()
  const C = cfgOf(state.config)
  assert.deepEqual(loisHabitants(state, joueur, C), {})
  assert.deepEqual(detailLoisHabitants(state, joueur, C), [])
})

test("appliquerEffetsRegimesCultures (SANS saison) : lois d'habitants seules → out {}", () => {
  const ctx = partieMock()
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  // Les aménagements ne produisent RIEN via une règle de régime :
  // la dernière (Socialisme « Pour le peuple ») est REMPLACÉE par
  // les lois du moteur, et le mock ne porte aucune loi d'habitant.
  ville.amenagements = ['Champ', 'Champ', 'Rizière']
  joueur.regime = 'Socialisme'
  const out = appliquerEffetsRegimesCultures(state, joueur, C)
  assert.deepEqual(out, {}, 'aucun flux : les lois de régime ne passent plus par la banque')
})
