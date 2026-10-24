// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Historique » (HistoryPanel) : courbes
//  d'évolution des ressources (feuille _Historique) — exige une partie
//  avec des tours joués (history non vide).
//  R3 (audit résiduels 2026-10-24) : les courbes sont vérifiées CONTRE
//  L'ÉTAT — labels des tours, valeur « max » recalculée comme la vue,
//  une polyline PAR JOUEUR (une série manquante ne passe plus).
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, aplatir } from './testRendu'

prepareRendu()

test('rendu HistoryPanel : la page Historique s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { HistoryPanel } = await import('./HistoryPanel')
  const { fmt } = await import('./ui')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(HistoryPanel)),
  )

  assert.ok(html.includes('Évolution des ressources'), 'carte « Évolution des ressources » absente')

  // ── R3 : données réelles dérivées de l'état ──
  const h = aplatir(html)
  // Vue par défaut : ressource Or, mode stocks. Le calcul reproduit
  // celui de la vue (turns uniques triés, une valeur par tour).
  const turns = [...new Set(etat.history.map((h) => h.turn))].sort((a, b) => a - b)
  assert.ok(turns.length >= 2, 'moins de 2 tours dans history (graine changée ?)')
  const series = etat.players.map((p) => ({
    nom: p.nom,
    points: turns.map((t) => {
      const row = etat.history.find((h) => h.turn === t && h.joueur === p.n)
      return row ? row.stocks['Or'] ?? 0 : 0
    }),
  }))
  // Chaque tour de l'état a son label « TN » sur l'axe (n <= 12 :
  // tous les tours sont étiquetés).
  for (const t of turns) {
    assert.ok(h.includes(`T${String(t)}<`), `label de tour T${t} absent de l'axe`)
  }
  // L'échelle « max » porte la valeur recalculée depuis l'état.
  const max = Math.max(1, ...series.flatMap((s) => s.points))
  assert.ok(h.includes(`max ${fmt(max)}`), `échelle « max ${fmt(max)} » absente du rendu`)
  // Une polyline PAR JOUEUR de l'état — une série oubliée au rendu
  // (données d'un joueur perdues) ne passe plus la CI.
  const polylignes = (html.match(/<polyline/g) ?? []).length
  assert.ok(
    polylignes === etat.players.length,
    `${polylignes} polylignes rendues, ${etat.players.length} joueurs dans l'état`,
  )
  // La légende nomme tous les joueurs de l'état.
  for (const p of etat.players) {
    assert.ok(html.includes(p.nom), `joueur « ${p.nom} » absent de la légende`)
  }
})
