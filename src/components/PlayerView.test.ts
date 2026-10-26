// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Pays » (PlayerView, assemblage des cartes de
//  components/pays/). Retour de revue critique n°3 : « un test de rendu
//  par vue » — aucun écran blanc de régression ne doit plus passer la CI.
//  Méthode : vraie partie à 8 joueurs, 2 tours joués, rendu serveur via
//  react-dom/server (renderToString — les useEffect ne sont pas joués,
//  seule la voie de rendu est testée).
//  R3 (audit résiduels 2026-10-24) : les données de la page sont
//  vérifiées CONTRE L'ÉTAT du joueur 1 — villes, stocks de la barre
//  de ressources, population de la capitale — et une assertion
//  NÉGATIVE garantit que la page ne rend PAS les données d'un autre
//  joueur.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu PlayerView : la page Pays s’assemble sans crash (cartes de components/pays/)', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { PlayerView } = await import('./PlayerView')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(PlayerView, { joueur: 1 })),
  )

  assert.ok(html.length > 2000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Culture du pays'), 'carte « Culture du pays » absente')
  assert.ok(html.includes('Commerce — routes commerciales'), 'carte « Commerce » absente')
  assert.ok(html.includes('Récap des ressources par tour'), 'carte « Récap par tour » absente')
  assert.ok(html.includes('Récap ressources du dernier tour'), 'carte « Récap dernier tour » absente')
  assert.ok(html.includes('grid-villes'), 'grille des villes absente')

  // ── R3 : données réelles dérivées de l'état du joueur 1 ──
  const h = aplatir(html)
  const p1 = etat.players.find((p) => p.n === 1)
  assert.ok(p1, 'joueur 1 introuvable dans l’état')
  // Les villes du joueur 1 (issues de l'état) sont rendues.
  for (const v of p1.villes) {
    assert.ok(html.includes(esc(v.nom)), `ville « ${v.nom} » du joueur 1 absente`)
  }
  // La barre de ressources porte LES stocks de l'état (chaque puce
  // rend un NumberInput de valeur = stock de la ressource).
  for (const r of ['Or', 'Nourriture', 'Science']) {
    const stock = p1.resources[r]?.stock ?? 0
    assert.ok(
      h.includes(`value="${String(stock)}"`),
      `stock ${r} du joueur 1 (${stock}) absent de la barre de ressources`,
    )
  }
  // La carte de la capitale affiche le compte d'habitants vivants
  // ET la culture majoritaire calculés depuis l'état (VilleCarte).
  const cap = p1.villes[0]
  const nbVivants = (etat.population[1] ?? [])
    .filter((c) => c.statut !== 'Décédé' && c.ville === cap.nom).length
  assert.ok(
    h.includes(`${String(nbVivants)} habitant(s) vivant(s)`),
    `compte d'habitants vivants de ${cap.nom} (${nbVivants}) non rendu`,
  )
  assert.ok(
    h.includes(`Culture majoritaire : <strong>${esc(cap.culture)}</strong>`),
    `culture majoritaire « ${cap.culture} » de ${cap.nom} non rendue`,
  )
})


test('rendu VilleCarte : bloc bonheur en haut à droite — moyenne + 5 mini-jauges (retour arbitre 2026-10-25)', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { PlayerView } = await import('./PlayerView')
  const { cfgOf } = await import('../engine/gameData')
  const { scoresVille, bonheurVille } = await import('../engine/bonheur')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(PlayerView, { joueur: 1 })),
  )
  const h = aplatir(html)
  // Le bloc (et non plus l'ancienne ligne d'info) est rendu.
  assert.ok(h.includes('bonheur-bloc'), 'bloc bonheur absent de la carte ville')
  // (l'ancienne ligne rendait « Bonheur : <strong> » — le bloc actuel
  //  rend « Bonheur <strong> » sans deux-points ; l'info-bulle du bloc
  //  contient « Bonheur : moyenne… », d'où le motif distinctif)
  assert.ok(!h.includes('Bonheur : <strong'), 'ancienne ligne bonheur encore rendue')
  // Moyenne + les 5 axes, valeurs dérivées de l'état (patron R3).
  const C = cfgOf(etat.config)
  const p1 = etat.players.find((p) => p.n === 1)
  assert.ok(p1, 'joueur 1 introuvable')
  for (const v of p1.villes) {
    const s = scoresVille(etat, p1, v, C)
    const b = bonheurVille(s)
    assert.ok(h.includes(`>${b}</strong>`), `moyenne bonheur ${b} de « ${v.nom} » absente`)
    const axes: Array<[string, number]> = [
      ['Emploi', s.emploi], ['Logement', s.logement], ['Sécurité', s.securite],
      ['Tourisme', s.tourisme], ['Santé', s.sante],
    ]
    for (const [label, val] of axes) {
      assert.ok(h.includes(esc(label)), `axe « ${label} » absent du bloc bonheur`)
      assert.ok(h.includes(`>${val}</span>`), `valeur ${val} de l'axe « ${label} » (« ${v.nom} ») absente`)
    }
  }
})
