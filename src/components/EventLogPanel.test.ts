// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Journal » (EventLogPanel) : journal de
//  campagne, tours récents d'abord.
//  R3 (audit résiduels 2026-10-24) : les entrées rendues sont
//  vérifiées CONTRE L'ÉTAT — la PREMIÈRE et la DERNIÈRE entrée du log
//  de la partie, et le NOMBRE EXACT de lignes affichées.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu EventLogPanel : le journal de campagne s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { EventLogPanel } = await import('./EventLogPanel')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(EventLogPanel)),
  )

  assert.ok(html.includes('Journal de campagne'), 'titre « Journal de campagne » absent')

  // ── R3 : données réelles dérivées du log de l'état ──
  const h = aplatir(html)
  assert.ok(etat.log.length > 0, 'log vide dans l’état')
  // Les entrées sont affichées TOURS RÉCENTS D'ABORD : la dernière du
  // log de l'état est la première ligne rendue, la première du log
  // est la dernière (log entier < 500 entrées après 2 tours).
  const derniere = etat.log[etat.log.length - 1]
  const premiere = etat.log[0]
  assert.ok(
    h.indexOf(esc(derniere.texte)) >= 0,
    'texte de la dernière entrée du log absent du rendu',
  )
  assert.ok(
    html.indexOf(esc(derniere.texte)) < h.indexOf(esc(premiere.texte)),
    'ordre « tours récents d’abord » non respecté',
  )
  assert.ok(h.includes(esc(premiere.texte)), 'texte de la première entrée du log absent du rendu')
  // Le tour de la dernière entrée est rendu (étiquette « TN »).
  assert.ok(h.includes(`T${String(derniere.turn)}<`), `étiquette T${derniere.turn} absente`)
  // NOMBRE EXACT de lignes rendues : min(500, log) — un journal tronqué
  // ou gonflé artificiellement ne passe plus.
  const attendues = Math.min(500, etat.log.length)
  const rendues = (html.match(/log-line/g) ?? []).length
  assert.ok(
    rendues === attendues,
    `${rendues} lignes de journal rendues, ${attendues} attendues`,
  )
})
