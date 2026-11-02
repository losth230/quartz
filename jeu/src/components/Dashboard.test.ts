// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Accueil » (Dashboard) : tableau de bord des
//  ressources de tous les joueurs. Revue critique n°3 : un test de
//  rendu par vue — un écran blanc de régression ne passe plus la CI.
//  R3 (audit résiduels 2026-10-24) : au-delà du « fumée », les valeurs
//  affichées sont vérifiées CONTRE L'ÉTAT (noms des 8 joueurs, stock
//  d'Or, population vivante, voies de victoire du référentiel).
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu } from './testRendu'

prepareRendu()

test('rendu Dashboard : le tableau de bord s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { Dashboard } = await import('./Dashboard')
  const { fmt } = await import('./ui')
  const { cfgOf } = await import('../engine/gameData')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(Dashboard)),
  )

  assert.ok(html.length > 2000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Toutes les ressources'), 'carte « Toutes les ressources » absente')

  // ── R3 : données réelles dérivées de l'état, pas seulement des titres ──
  // Les 8 joueurs de l'état figurent dans le tableau de bord.
  for (const p of etat.players) {
    assert.ok(html.includes(p.nom), `joueur « ${p.nom} » absent du tableau de bord`)
  }
  // La cellule d'Or du joueur 1 porte LE stock de l'état.
  const p1 = etat.players.find((p) => p.n === 1)
  assert.ok(p1, 'joueur 1 introuvable dans l’état')
  const or1 = p1.resources['Or']?.stock ?? 0
  assert.ok(
    html.includes(`<strong>${fmt(or1)}</strong>`),
    `stock d'Or du joueur 1 (${fmt(or1)}) non rendu`,
  )
  // La population vivante d'un autre joueur (le n° 4) est rendue —
  // cellule <td><strong>{pop}</strong></td> du tableau.
  const pop4 = (etat.population[4] ?? []).filter((c) => c.statut !== 'Décédé').length
  assert.ok(
    html.includes(`<strong>${String(pop4)}</strong>`),
    `population vivante du joueur 4 (${pop4}) non rendue`,
  )
  // Les voies de victoire du référentiel de LA PARTIE forment les
  // colonnes de la table des Lauriers.
  const C = cfgOf(etat.config)
  for (const v of C.config.victoires) {
    assert.ok(html.includes(v.voie), `voie de victoire « ${v.voie} » absente de la table des Lauriers`)
  }
})
