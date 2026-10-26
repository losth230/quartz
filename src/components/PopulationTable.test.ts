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

test('rendu PopulationTable : la cour commence NOBLE (rang de naissance) et accueille l’ascension par prestige (retour Thibaut 2026-10-26)', async () => {
  const etat = await partieRendu()
  // (retour Thibaut : « il faut des nobles dès le début — la colonne
  //  dynastie doit correspondre à la colonne rang »). Après 2 tours
  //  personne n’a prestige ≥ 100, mais les membres de dynastie NOBLE
  //  (famille dirigeante du setup) sont noble de NAISSANCE (rangDe) :
  //  la cour n’est PAS vide au départ.
  const { cfgOf } = await import('../engine/gameData')
  const { rangDe } = await import('../engine/statutSocial')
  const { saveLocal } = await import('../state/storage')
  const C = cfgOf(etat.config)
  const popTot = etat.population[1] ?? []
  const pop1 = popTot.filter((c) => c.statut !== 'Décédé')
  assert.ok(pop1.length > 2, 'population témoin trop courte')
  // (retour Thibaut 2026-10-26 : « un noble de naissance doit avoir
  //  300 prestige de base ») : les nobles de naissance sont sur leur
  //  base 300 (± 2 tours de gains) ; côté ROTURIERS personne n'a
  //  encore 100+ par l'ascension après 2 tours.
  const roturiersDeDynastie = popTot.filter((c) => c.dynastie === C.p.dynastieRoturier)
  assert.ok(
    roturiersDeDynastie.every((c) => (c.prestige ?? 0) < 100),
    '2 tours : aucun roturier n’a encore le rang par le prestige',
  )
  const noblesNaissance = pop1.filter((c) => rangDe(c, C) === 'noble')
  assert.ok(noblesNaissance.length >= 2, `des nobles de naissance dès le départ (trouvé ${noblesNaissance.length})`)
  assert.ok(
    noblesNaissance.every((c) => (c.prestige ?? 0) >= 280),
    `nobles de naissance sur leur base 300 (trouvé ${noblesNaissance.map((c) => c.prestige ?? 0).join(', ')})`,
  )
  // Graver l’ascension sur deux ROTURIERS de dynastie : un anobli
  //  (300) et un bourgeois (150) — ils rejoignent la cour par le
  //  prestige, en plus des nobles de naissance.
  const roturiers = pop1.filter((c) => c.dynastie === C.p.dynastieRoturier)
  assert.ok(roturiers.length >= 2, 'des roturiers de dynastie à graver')
  roturiers[0].prestige = 300
  roturiers[1].prestige = 150
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
  // Comptes attendus : la cour = nobles de naissance + les deux
  //  roturiers gravés ; le titre de la carte porte CES comptes-là.
  const estDeCour = (c: typeof popTot[number]) => rangDe(c, C) !== 'roturier'
  const courVivants = pop1.filter(estDeCour).length
  const courTot = popTot.filter(estDeCour).length
  assert.ok(
    h.includes(`👑 La cour de ${esc(nom)} — ${String(courVivants)} vivants / ${String(courTot)} au total`),
    `la cour commence noble (rang de naissance) : attendu ${courVivants} vivants / ${courTot} au total`,
  )
  assert.ok(
    h.includes('Personnages selon leur RANG'),
    'sous-titre « Personnages selon leur RANG » absent',
  )
  // La colonne Rang signale la noblesse de naissance (title de la
  //  ligne) — la colonne dynastie et la colonne rang se correspondent.
  assert.ok(h.includes('NOBLE DE NAISSANCE'), 'marqueur « NOBLE DE NAISSANCE » absent de la colonne Rang')
  // La carte Population prend le reste (roturiers de dynastie ET de prestige).
  assert.ok(
    h.includes(`Population de ${esc(nom)} — ${String(pop1.length - courVivants)} vivants / ${String(popTot.length - courTot)} au total`),
    `la population classique compte les roturiers (attendu ${pop1.length - courVivants} vivants / ${popTot.length - courTot} au total)`,
  )
})
