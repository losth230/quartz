// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Référentiels » (ReferenceDataPanel) : wiki de
//  règles en lecture seule. Onglet par défaut : « Métiers ».
//  R3 (audit résiduels 2026-10-24) : la table des métiers est vérifiée
//  CONTRE LA CONFIG de la partie — compte exact, noms et gains réels.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc } from './testRendu'

prepareRendu()

test('rendu ReferenceDataPanel : le wiki de règles s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { ReferenceDataPanel } = await import('./ReferenceDataPanel')
  const { cfgOf } = await import('../engine/gameData')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(ReferenceDataPanel)),
  )

  assert.ok(html.includes('Référentiels du jeu'), 'carte « Référentiels du jeu » absente')
  assert.ok(html.includes('Wiki de règles'), 'bandeau « Wiki de règles — lecture seule » absent')

  // ── R3 : données réelles issues de la config de la partie ──
  const C = cfgOf(etat.config)
  // Le titre de la table des métiers porte le COMPTE EXACT de la
  // config (« Métiers (N) ») — une table tronquée ne passe plus.
  assert.ok(
    html.includes(`Métiers (${String(C.config.metiers.length)})`),
    `titre « Métiers (${C.config.metiers.length}) » absent`,
  )
  // Les 3 premiers métiers de la config sont rendus avec leurs
  // valeurs (gain 1/tour) réelles.
  for (const t of C.config.metiers.slice(0, 3)) {
    assert.ok(
      html.includes(`<strong>${esc(t.metier)}</strong>`),
      `métier « ${t.metier} » absent du wiki`,
    )
    if (t.valeur1) {
      const gain = `${String(t.valeur1)} ${t.ressource1}${t.ete ? ' (été)' : ''}`
      assert.ok(html.includes(esc(gain)), `gain « ${gain} » du métier ${t.metier} non rendu`)
    }
  }
  // Les onglets du wiki sont ceux du registre de la vue.
  assert.ok(html.includes('Aménagements'), 'onglet « Aménagements » absent')
  assert.ok(html.includes('Aide-mémoire'), 'onglet « Aide-mémoire » absent')
})
