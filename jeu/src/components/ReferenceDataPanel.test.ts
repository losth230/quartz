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
  // (2026-11-01, demande Thibaut : onglet « Ordre du tour » — table
  //  de l'ordre de calcul des effets de fin de tour.)
  assert.ok(html.includes('Ordre du tour'), 'onglet « Ordre du tour » absent')
})

test('rendu OngletOrdreTour : la table de l ordre des effets de tour est vérifiée CONTRE LE MOTEUR (R3)', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { OngletOrdreTour } = await import('./reference/OngletOrdreTour')
  const { cfgOf } = await import('../engine/gameData')
  const { ETAPES_TOUR } = await import('../engine/tour')

  const C = cfgOf(etat.config)
  const html = renderToString(React.createElement(OngletOrdreTour, { C }))

  // R3 : CHAQUE étape du registre du MOTEUR (engine/tour.ts) est
  //  rendue avec son numéro et son nom — une table tronquée ou
  //  désynchronisée du moteur ne passe plus.
  assert.ok(
    html.includes(`Ordre du tour — calcul des effets (${String(ETAPES_TOUR.length)} étapes)`),
    'titre avec le compte exact des étapes absent',
  )
  for (const e of ETAPES_TOUR) {
    assert.ok(html.includes(esc(e.numero)), `étape ${e.numero} absente du wiki`)
    assert.ok(
      html.includes(`<strong>${esc(e.nom)}</strong>`),
      `nom de l étape ${e.numero} (« ${e.nom} ») absent du wiki`,
    )
  }
  // Valeurs LIVE des prélèvements (paramètres actuels, pas du texte
  //  figé) : tribut vassal + dîme du pèlerinage.
  const pct = (v: number) => `${String(Math.round(v * 100))} %`
  assert.ok(html.includes(pct(C.p.vassalPrelevement)), 'taux du tribut de vassalité non rendu en valeur live')
  assert.ok(html.includes(pct(C.p.pelerinageTaux)), 'taux de la dîme du pèlerinage non rendu en valeur live')
  // l étape du pèlerinage (3quindecies, ajout 2026-11-01) figure
  //  dans la table avec son numéro historique
  assert.ok(html.includes('3quindecies'), 'numéro 3quindecies (pèlerinage) absent')
})
