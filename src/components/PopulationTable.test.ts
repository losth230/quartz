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

test('rendu PopulationTable : la cour montre les personnages selon leur RANG, pas leur dynastie (retour Thibaut 2026-10-26)', async () => {
  const etat = await partieRendu()
  // (retour Thibaut : « la cour des joueurs ne commence pas en tant
  //  que noble — le tableau supérieur montre les personnages selon
  //  leur rang, et non leur dynastie »). Après 2 tours, TOUT le
  //  monde est roturier (prestige < 100) : la cour est vide.
  const { saveLocal } = await import('../state/storage')
  const popTot = etat.population[1] ?? []
  const pop1 = popTot.filter((c) => c.statut !== 'Décédé')
  assert.ok(pop1.length > 2, 'population témoin trop courte')
  assert.ok(
    popTot.every((c) => (c.prestige ?? 0) < 100),
    'partie témoin : toute la cour est roturière au départ (prestige < 100)',
  )
  // Graver deux rangs sur des vivants : un noble (300) et un
  //  bourgeois (150) — la dynastie ne joue AUCUN rôle.
  pop1[0].prestige = 300
  pop1[1].prestige = 150
  saveLocal(etat)

  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { PopulationTable } = await import('./PopulationTable')
  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(PopulationTable, { joueur: 1 })),
  )
  const h = aplatir(html)
  const nom = etat.players.find((p) => p.n === 1)?.nom ?? 'Joueur 1'
  // Titre de la carte cour : comptes par RANG (2 personnages ≥ 100).
  assert.ok(
    h.includes(`👑 La cour de ${esc(nom)} — 2 vivants / 2 au total`),
    'la cour compte les personnages par rang social (prestige ≥ 100), pas par dynastie',
  )
  assert.ok(
    h.includes('Personnages selon leur RANG'),
    'sous-titre « Personnages selon leur RANG » absent',
  )
  // La carte Population prend le reste (roturiers).
  const vivantsRestants = pop1.length - 2
  assert.ok(
    h.includes(`Population de ${esc(nom)} — ${String(vivantsRestants)} vivants / ${String(popTot.length - 2)} au total`),
    'la population classique compte les roturiers (prestige < 100)',
  )
})
