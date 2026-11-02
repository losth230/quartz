// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Royaume » (RoyaumeView) : identité du joueur,
//  metiers, personnages importants, vassalité, crises, offrandes.
//  R3 (audit résiduels 2026-10-24) : l'identité (peuple / nb de villes)
//  et le Dirigeant affiché sont vérifiés CONTRE L'ÉTAT du joueur 1.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu RoyaumeView : la page Royaume s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { RoyaumeView } = await import('./RoyaumeView')
  const { cfgOf } = await import('../engine/gameData')
  const { pers } = await import('./royaume/logiqueRoyaume')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(RoyaumeView, { joueur: 1 })),
  )

  assert.ok(html.length > 2000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Vassalité'), 'carte « Vassalité » absente')
  assert.ok(html.includes('Personnages importants'), 'carte « Personnages importants » absente')

  // ── R3 : données réelles dérivées de l'état du joueur 1 ──
  const h = aplatir(html)
  const p1 = etat.players.find((p) => p.n === 1)
  assert.ok(p1, 'joueur 1 introuvable dans l’état')
  // Le cadre d'identité porte le peuple et le nombre de villes de l'état.
  assert.ok(
    h.includes(esc(`${p1.peuple} · ${String(p1.villes.length)} ville(s)`)),
    `identité « ${p1.peuple} · ${p1.villes.length} ville(s) » non rendue`,
  )
  // Le Dirigeant affiché dans « Personnages importants » est LE
  // dirigeant vivant de l'état (même formatage que la vue : pers()).
  const C = cfgOf(etat.config)
  const vivants = (etat.population[1] ?? []).filter((c) => c.statut !== 'Décédé')
  const dirigeant = vivants.find((c) => c.metier === C.p.metierDirigeant)
  assert.ok(dirigeant, 'pas de dirigeant vivant dans l’état (graine changée ?)')
  assert.ok(
    h.includes(esc(pers(dirigeant))),
    `dirigeant « ${pers(dirigeant)} » non rendu dans Personnages importants`,
  )
})
