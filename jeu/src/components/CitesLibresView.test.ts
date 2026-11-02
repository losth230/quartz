// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Cités libres » (CitesLibresView) : règles de
//  fonctionnement, création d'une cité libre, annexion.
//  R3 (audit résiduels 2026-10-24) : la garnison calculée par le vrai
//  moteur (garnisonCiteLibre) et les réserves d'émissaires de l'état
//  sont vérifiées dans le rendu.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu CitesLibresView : la page Cités libres s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { CitesLibresView } = await import('./CitesLibresView')
  const { cfgOf } = await import('../engine/gameData')
  const { garnisonCiteLibre } = await import('../engine/citesLibres')
  const { fmtNum } = await import('./citesLibres/logiqueCitesLibres')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(CitesLibresView)),
  )

  assert.ok(html.length > 2000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Cités libres'), 'titre « Cités libres » absent')
  assert.ok(html.includes('Créer une cité libre'), 'carte « Créer une cité libre » absente')

  // ── R3 : données réelles dérivées de l'état ──
  const h = aplatir(html)
  const C = cfgOf(etat.config)
  // La garnison affichée est celle du VRAI MOTEUR (100 + 40 × rang de
  // pays le plus haut, recalculé depuis l'état).
  const garnison = garnisonCiteLibre(etat, C)
  assert.ok(
    h.includes(`Garnison actuelle des cités libres : <strong>${fmtNum(garnison)}</strong>`),
    `garnison moteur (${fmtNum(garnison)}) non rendue`,
  )
  // Chaque cité libre de l'état a sa carte rendue, sous son nom réel.
  const cites = etat.citesLibres ?? []
  assert.ok(cites.length > 0, 'aucune cité libre dans l’état (graine changée ?)')
  for (const c of cites) {
    assert.ok(h.includes(esc(c.nom)), `cité libre « ${c.nom} » absente du rendu`)
  }
  // Le compte de suzeraineté par joueur affiché est recalculé depuis
  // l'état (« Joueur N : X », aucun suzerain après 2 tours).
  for (const p of etat.players) {
    const nb = cites.filter((c) => c.suzerain === p.n).length
    assert.ok(
      h.includes(esc(`${p.nom} : ${String(nb)}`)),
      `compte de suzeraineté « ${p.nom} : ${nb} » non rendu`,
    )
  }
  // Les réserves d'émissaires rendues sont celles de l'état
  // (« J{n} · {nom} » + badge « {réserve} en réserve »).
  for (const p of etat.players) {
    assert.ok(
      h.includes(esc(`${String(p.emissaires ?? 0)} en réserve`)),
      `réserve d'émissaires de ${p.nom} non rendue`,
    )
  }
})
