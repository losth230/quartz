// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Paramètres » (ParamsPanel) : formules et
//  référentiels éditables (onglet par défaut : « Formules »).
//  R3 (audit résiduels 2026-10-24) : les paramètres affichés sont
//  vérifiés CONTRE LEURS MÉTADONNÉES (PARAM_META) et leurs VALEURS
//  de la config — libellés, unités, groupes et nombre saisi.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu ParamsPanel : la page Paramètres s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { ParamsPanel } = await import('./ParamsPanel')
  const { PARAM_META } = await import('../config/params')
  const { cfgOf } = await import('../engine/gameData')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(ParamsPanel)),
  )

  assert.ok(
    aplatir(html).includes('<strong>communs à toutes les parties</strong>'),
    'carte des réglages absente',
  )

  // ── R3 : données réelles issues de PARAM_META + config ──
  const h = aplatir(html)
  const groupes: string[] = []
  for (const m of PARAM_META) if (!groupes.includes(m.groupe)) groupes.push(m.groupe)
  // Chaque groupe de PARAM_META a son intertitre <h4>.
  for (const g of groupes) {
    assert.ok(h.includes(`<h4>${esc(g)}</h4>`), `groupe « ${g} » de PARAM_META absent`)
  }
  // Un paramètre connu : libellé + unité + VALEUR de la config dans
  // l'input (taxOrHautes — arbitrage ±25 %, marqueur (z)).
  const meta = PARAM_META.find((m) => m.key === 'taxOrHautes')
  assert.ok(meta, 'taxOrHautes absent de PARAM_META (renommé ?)')
  const C = cfgOf(etat.config)
  const valeur = Number((C.p as unknown as Record<string, number>)[meta.key] ?? 0)
  assert.ok(
    h.includes(esc(`${meta.label}${meta.unite ? ` (${meta.unite})` : ''}`)),
    `libellé « ${meta.label} » du paramètre ${meta.key} non rendu`,
  )
  assert.ok(
    h.includes(`value="${String(valeur)}"`),
    `valeur ${valeur} de ${meta.key} absente des inputs rendus`,
  )
})
