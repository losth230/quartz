// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DE LA REPRISE AUTOMATIQUE (m1, arbitrage Thibaut 2026-10-27)
//  Module PUR : aucun réseau, aucun Supabase — les appels sont des
//  fakes comptés. `npm test` (tsx) et le harnais local node:test.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avecReprise } from './reprise'

test('m1 : succès au 1er essai → réponse directe, aucun 2e appel', async () => {
  let appels = 0
  const r = await avecReprise(async () => { appels++; return { ok: true } }, (x) => x.ok, 'Résolution serveur')
  assert.equal(r.ok, true)
  assert.equal(appels, 1, 'aucune reprise ne doit avoir lieu')
  if (r.ok) assert.deepEqual(r.valeur, { ok: true })
})

test('m1 : exception au 1er essai (timeout/réseau KO) → reprise automatique et succès', async () => {
  let appels = 0
  const r = await avecReprise(
    async () => { appels++; if (appels === 1) throw new Error('TimeoutError: the operation was aborted'); return { ok: true } },
    (x) => x.ok, 'Résolution serveur',
  )
  assert.equal(r.ok, true, 'le 2e essai doit réussir')
  assert.equal(appels, 2)
})

test('m1 : échec aux 2 essais (réseau KO ×2) → erreur EXPLICITE « après 2 essais »', async () => {
  let appels = 0
  const r = await avecReprise(async () => { appels++; throw new Error('réseau KO') }, () => true, 'Résolution serveur')
  assert.equal(r.ok, false)
  assert.equal(appels, 2, 'exactement 2 essais')
  if (!r.ok) {
    assert.ok(r.erreur.includes('après 2 essais'), `message explicite attendu, reçu : ${r.erreur}`)
    assert.ok(r.erreur.includes('Résolution serveur'), `le libellé doit figurer : ${r.erreur}`)
    assert.ok(r.erreur.includes('réseau KO'), `le détail doit figurer : ${r.erreur}`)
  }
})

test('m1 : réponse non définitive (échec fonctionnel) → une reprise, puis succès', async () => {
  let appels = 0
  const r = await avecReprise(
    async () => { appels++; return { ok: appels === 2, error: appels === 1 ? 'sections manquantes' : undefined } },
    (x) => x.ok, 'Résolution serveur',
  )
  assert.equal(r.ok, true, 'le 2e essai fonctionnel doit être retenu')
  assert.equal(appels, 2)
})

test('m1 : réponse non définitive 2 fois → erreur avec le détail de la 2e réponse', async () => {
  let appels = 0
  const r = await avecReprise(async () => { appels++; return { ok: false, error: 'tour introuvable' } }, (x) => x.ok, 'Résolution serveur')
  assert.equal(r.ok, false)
  assert.equal(appels, 2)
  if (!r.ok) assert.ok(r.erreur.includes('tour introuvable') && r.erreur.includes('après 2 essais'), `détail attendu : ${r.erreur}`)
})

test('m1 : dejaPublie = réponse DÉFINITIVE → aucune reprise inutile', async () => {
  let appels = 0
  const r = await avecReprise(
    async () => { appels++; return { ok: false, dejaPublie: true } },
    (x) => x.ok || x.dejaPublie === true, 'Résolution serveur',
  )
  assert.equal(r.ok, true, 'dejaPublie est un verdict, pas un échec')
  assert.equal(appels, 1, 'aucune reprise ne doit avoir lieu')
  if (r.ok) assert.deepEqual(r.valeur, { ok: false, dejaPublie: true })
})
