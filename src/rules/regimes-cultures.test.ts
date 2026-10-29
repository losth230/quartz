// ═══════════════════════════════════════════════════════════════════════════
//  TESTS RÉGIMES & CULTURES ↔ BANQUE (voie unique, brûlage #3 source
//  2/3, 2026-10-20)
//
//  Retour Thibaut « toute production passe par la banque » : la loi
//  chiffrée du RÉGIME (Socialisme) vit dans le REGISTRE
//  (reglesRegimes) et le moteur ne fait que LIRE la banque.
//  (RETRAIT 2026-10-29, refonte « 12 lois » : la source 'culture'
//  QUITTE la banque — les règles de pays des cultures
//  (reglesCultures, effet fluxParVilleCultureMonde, champs
//  capitalNourr/Tourisme/OrParHabMonde) sont supprimées ; les lois
//  des cultures vivent DÉSORMAIS dans le moteur et sont testées dans
//  src/engine/cultures.test.ts. Ces tests verrouillent :
//   · le contenu exact du registre régime (conditions dans la règle) ;
//   · l'ABSENCE de toute règle culture dans la banque ;
//   · les valeurs produites par la loi du régime (été, cumul) ;
//   · le crédit réel des stocks (chemin moteur complet, étape
//     3septies : régime + lois d'habitants des cultures).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  effetsRegime, loisHabitants, detailLoisHabitants,
  appliquerEffetsRegimesCultures,
} from '../engine/regimes'
import { cfgOf } from '../engine/gameData'
import { reglesRegimes, registreComplet } from './registry'

const C_DEFAUT = cfgOf(undefined)
import { partieMock } from './mocks'

// ── registre : contenu exact des règles régimes ────────────────────────────

test('registre régimes : 1 règle regime.socialisme, conditions dans la règle', () => {
  const regles = reglesRegimes(C_DEFAUT)
  assert.equal(regles.length, 1, 'seul le Socialisme a une loi de production chiffrée')
  const soc = regles.find((r) => r.id === 'regime.socialisme')
  assert.ok(soc, 'règle regime.socialisme présente')
  assert.equal(soc.nom, 'Socialisme')
  assert.equal(soc.source, 'regime')
  assert.equal(soc.conditions?.regime, 'Socialisme', 'condition de régime dans la RÈGLE')
  assert.equal(soc.conditions?.saison, 'Été', 'l’été est une CONDITION de la règle, plus un if moteur')
  assert.deepEqual(soc.effets, [
    { type: 'fluxParAmenagement', ressource: 'Nourriture', valeur: 5, noms: ['Champ', 'Rizière'] },
  ], 'montant nourrEteChampRiziere du référentiel, devenu DONNÉE')
  // Autoritarisme : garnisonParRang = valeur d'état → PAS de règle.
  assert.ok(!regles.some((r) => r.nom === 'Autoritarisme'), 'Autoritarisme reste hors banque (garnison)')
})

test('registreComplet : ids uniques, régime intégré, PLUS AUCUNE règle culture', () => {
  const regles = registreComplet(C_DEFAUT)
  const ids = regles.map((r) => r.id)
  assert.equal(new Set(ids).size, ids.length, 'ids uniques')
  assert.ok(ids.includes('regime.socialisme'), 'id manquant dans le registre complet : regime.socialisme')
  // (RETRAIT 2026-10-29, refonte « 12 lois » : la source 'culture'
  //  est VIDE — plus aucune règle de pays culturelle dans la banque.)
  assert.ok(regles.every((r) => (r.source as string) !== 'culture'), 'aucune règle de culture dans la banque')
  assert.ok(!ids.some((id) => id.startsWith('culture.')), 'aucun id culture.* dans le registre')
})

// ── production : la loi du régime lue sur la banque ────────────────────────

test('Socialisme : +5 Nourriture × 3 Champ/Rizière en été, RIEN en hiver', () => {
  const ctx = partieMock({ saison: 'Été' })
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  joueur.regime = 'Socialisme'
  ville.amenagements = ['Champ', 'Champ', 'Rizière']
  assert.equal(effetsRegime(state, joueur, 'Été', C)['Nourriture'], 15, '5 × 3 aménagements')
  assert.deepEqual(effetsRegime(state, joueur, 'Hiver', C), {}, 'hiver : condition de saison non remplie')
})

test('autre régime que Socialisme : la règle ne s’applique pas (condition regime)', () => {
  const ctx = partieMock({ saison: 'Été' })
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  joueur.regime = 'Monarchie'
  ville.amenagements = ['Champ']
  assert.deepEqual(effetsRegime(state, joueur, 'Été', cfgOf(state.config)), {})
})

// ── lois d'habitants : culture hors référentiel → aucune loi ───────────────

test('loisHabitants : culture hors référentiel (mock « Culture Nordique ») → aucune loi', () => {
  const ctx = partieMock()
  const { state, joueur } = ctx
  const C = cfgOf(state.config)
  assert.deepEqual(loisHabitants(state, joueur, C), {})
  assert.deepEqual(detailLoisHabitants(state, joueur, C), [])
})

// ── chemin moteur complet : stocks réellement crédités ─────────────────────

test('appliquerEffetsRegimesCultures : loi du régime créditée au stock, aucune loi de culture', () => {
  const ctx = partieMock({ saison: 'Été' })
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  joueur.regime = 'Socialisme'
  ville.amenagements = ['Champ']
  const nAvant = joueur.resources['Nourriture'].stock
  const out = appliquerEffetsRegimesCultures(state, joueur, 'Été', cfgOf(state.config))
  assert.equal(out['Nourriture'], 5, 'loi du régime via la banque')
  assert.equal(joueur.resources['Nourriture'].stock, nAvant + 5, 'stock Nourriture crédité')
  assert.ok(!('Tourisme' in out), 'aucune production de culture (source \'culture\' retirée de la banque)')
})
