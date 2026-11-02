// ══════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Dogmes » (DogmesView, onglet de premier
//  niveau — 5e retour arbitre Thibaut du 30/10) : vue TOUTES
//  CULTURES des dogmes. 7e retour (31/10) : chaque carte culture
//  liste TOUS ses dogmes en grille grid-3 (plusieurs par ligne),
//  toujours visibles — pris ou disponibles.
//  R3 : les valeurs affichées sont vérifiées CONTRE LE MOTEUR — le
//  Tourisme de chaque culture (tourismeCulture) et le nombre de
//  dogmes du référentiel (config.dogmes) sont recalculés depuis
//  l'état, pas codés en dur.
// ══════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu DogmesView : la page Dogmes affiche toutes les cultures et le référentiel des dogmes', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { DogmesView } = await import('./DogmesView')
  const { cfgOf } = await import('../engine/gameData')
  const { tourismeCulture, nbPaliersDogmes } = await import('../engine/dogmes')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(DogmesView, { joueur: 1 })),
  )

  assert.ok(html.length > 2000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Dogmes de culture'), 'carte « Dogmes de culture » absente')
  const C = cfgOf(etat.config)
  const nbDogmes = C.config.dogmes?.length ?? 0
  assert.ok(nbDogmes === 12, `le référentiel doit porter les 12 dogmes (lu : ${nbDogmes})`)
  assert.ok(
    html.includes(`Les dogmes du référentiel (${String(nbDogmes)})`),
    'carte « Les dogmes du référentiel » absente ou au mauvais compte',
  )

  const h = aplatir(html)
  // ── R3 : une carte PAR CULTURE PRÉSENTE, avec le Tourisme du VRAI
  //    MOTEUR (tourismeCulture) et son palier ──
  const cultures = [...new Set(etat.players.flatMap((q) => q.villes.map((v) => v.culture)))]
  assert.ok(cultures.length > 0, 'aucune culture dans l’état (graine changée ?)')
  const pas = Math.max(1, C.p.palierTourismeDogme)
  for (const culture of cultures) {
    assert.ok(h.includes(esc(culture)), `culture « ${culture} » absente du rendu`)
    const t = tourismeCulture(etat, culture, C)
    assert.ok(
      h.includes(esc(`${t} Tourisme`)),
      `Tourisme moteur de la culture « ${culture} » (${t}) non rendu (attention : fmt sur un entier reste « ${t} »)`,
    )
    const franchis = nbPaliersDogmes(t, C)
    assert.ok(
      h.includes(esc(`${String(franchis)} palier(s) franchi(s) tous les ${String(pas)}`)),
      `compte de paliers de « ${culture} » (${franchis}) non rendu`,
    )
  }
  // Les 12 dogmes du référentiel sont dans la table (noms exacts).
  for (const d of C.config.dogmes ?? []) {
    assert.ok(h.includes(esc(d.nom)), `dogme « ${d.nom} » absent de la table du référentiel`)
  }

  // ── 7e retour (2026-10-31, « les dogmes dans chaque culture de la
  //    page, plusieurs par ligne ») : chaque carte culture liste TOUS
  //    les dogmes du référentiel pour elle, en grille — R3 contre le
  //    moteur : duReferentiel est recalculé depuis la config, pas codé
  //    en dur, et le nombre de tuiles mini-title doit couvrir toutes
  //    les cultures × leurs dogmes référentiels. ──
  assert.ok(html.includes('grid-3'), 'grille grid-3 (plusieurs dogmes par ligne) absente')
  const tuiles = (html.match(/mini-title/g) ?? []).length
  let attendues = 0
  for (const culture of cultures) {
    attendues += (C.config.dogmes ?? [])
      .filter((d) => d.culture === '*' || d.culture === culture).length
  }
  assert.ok(
    tuiles >= attendues,
    `tuiles de dogmes insuffisantes : ${tuiles} rendues, ${attendues} attendues (toutes cultures × référentiel)`,
  )
  // Chaque dogme du référentiel apparaît AU MOINS une fois par carte
  // culture + une fois dans la table du référentiel.
  for (const d of C.config.dogmes ?? []) {
    const occurrences = h.split(esc(d.nom)).length - 1
    assert.ok(
      occurrences >= cultures.length + 1,
      `dogme « ${d.nom} » : ${occurrences} occurrences, attendu ≥ ${cultures.length + 1} (une par carte culture + la table)`,
    )
  }
  assert.ok(h.includes('Disponible'), 'statut « Disponible » absent des tuiles')
})
