// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Population » (PopulationTable) : dynasties,
//  métiers et places par ville, colonne Domicile, ajout d'habitants (le plus gros tableau du
//  jeu — pagination 200 lignes).
//  R3 (audit résiduels 2026-10-24) : le tableau est vérifié CONTRE
//  L'ÉTAT — noms réels des habitants du joueur 1, comptes par
//  dynastie — pas seulement ses titres de cartes.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu PopulationTable : la page Population s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { PopulationTable } = await import('./PopulationTable')
  const { fullName } = await import('../engine/shared')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(PopulationTable, { joueur: 1 })),
  )

  assert.ok(html.length > 2000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Dynasties de la population'), 'carte « Dynasties » absente')
  assert.ok(html.includes('Métiers et places par ville'), 'carte « Métiers et places par ville » absente')
  assert.ok(html.includes('Domicile'), 'colonne « Domicile » absente')
  assert.ok(html.includes('Sans-emploi'), 'ligne « Sans-emploi » absente')
  assert.ok(html.includes('Places libres'), 'colonne « Places libres » absente')
  assert.ok(html.includes('Métiers attribués'), 'récap « Métiers attribués » absent')

  // ── R3 : données réelles dérivées de l'état du joueur 1 ──
  const h = aplatir(html)
  const pop1 = (etat.population[1] ?? []).filter((c) => c.statut !== 'Décédé')
  assert.ok(pop1.length > 0, 'population vivante du joueur 1 vide dans l’état')
  // Les 5 premiers habitants vivants (ordre de l'état — la première
  // page de 200 lignes les contient forcément) figurent dans le
  // tableau sous leur nom complet réel.
  for (const c of pop1.slice(0, 5)) {
    assert.ok(h.includes(esc(fullName(c))), `habitant « ${fullName(c)} » absent du tableau`)
  }
  // La carte « Dynasties » rend, pour chaque dynastie de l'état, le
  // compte exact de ses vivants (« Nom : N »).
  const dynasties = [...new Set(pop1.map((c) => c.dynastie))]
  for (const d of dynasties) {
    const nb = pop1.filter((c) => c.dynastie === d).length
    assert.ok(
      h.includes(esc(`${d} : ${String(nb)}`)),
      `badge dynastie « ${d} : ${nb} » absent`,
    )
  }
})
