// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Nouvelle partie » (SetupPanel) : création de
//  campagne (2 à 8 joueurs, peuple/culture/régime, graine, mode local
//  ou Supabase). S'affiche aussi pendant une partie (retour à
//  l'accueil) — le test rend la page AVEC une partie chargée.
//  R3 (audit résiduels 2026-10-24) : les listes déroulantes portent
//  les vraies données du RÉFÉRENTIEL (peuples, cultures, régimes) et
//  les options « Joueur N » sont complètes.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc } from './testRendu'

prepareRendu()

test('rendu SetupPanel : la page Nouvelle partie s’affiche sans crash', async () => {
  await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { SetupPanel } = await import('./SetupPanel')
  const { PEUPLES, CULTURES, REGIMES } = await import('../engine/gameData')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(SetupPanel)),
  )

  assert.ok(html.length > 2000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Nombre de joueurs'), 'champ « Nombre de joueurs » absent')

  // ── R3 : données réelles issues du référentiel ──
  // Les selects proposent TOUS les peuples / cultures / régimes du
  // référentiel (une liste tronquée ne passe plus la CI).
  for (const peuple of PEUPLES) {
    assert.ok(html.includes(esc(peuple.nom)), `peuple « ${peuple.nom } » absent des options`)
  }
  for (const culture of CULTURES) {
    assert.ok(html.includes(esc(culture.nom)), `culture « ${culture.nom} » absente des options`)
  }
  for (const regime of REGIMES) {
    assert.ok(html.includes(esc(regime.nom)), `régime « ${regime.nom} » absent des options`)
  }
  // Le nombre de joueurs propose les 8 valeurs (« Joueur 1 »…).
  for (let n = 2; n <= 8; n++) {
    assert.ok(html.includes(`Joueur ${String(n)}</option>`), `option « Joueur ${n} » absente`)
  }
})
