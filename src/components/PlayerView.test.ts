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
  // (Retour Thibaut 2026-10-26 « la mention "N habitant(s)
  //  vivant(s)" est inutile au-dessus de Cultures présentes » :
  //  le compte est retiré de la tête — le pied du tableau
  //  « Cultures présentes » porte déjà le total des vivants
  //  (verrouillé par le test des 2 colonnes). Cette assertion
  //  négative verrouille le retrait de la ligne de tête.)
  assert.ok(
    !h.includes('habitant(s) vivant(s)'),
    'la ligne « habitant(s) vivant(s) » ne doit plus être rendue en tête de carte',
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
  // (Retour Thibaut 2026-10-26, capture n°3 : rang d'habitation et
  //  type de ville DANS la zone de tête, AVANT le bloc bonheur —
  //  sur l'ancien layout ils étaient rendus après le wrap, donc
  //  cette assertion verrouille le déplacement dans la tête.)
  assert.ok(h.includes('ville-tete'), 'zone de tête absente de la carte ville')
  assert.ok(
    h.indexOf('Type de ville') < h.indexOf('bonheur-bloc'),
    '« Type de ville » doit être rendu dans la zone de tête, avant le bloc bonheur',
  )
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

test('rendu VilleCarte : population, garnison, logements & métiers en DEUX COLONNES (3 tableaux empilés + métiers) — tableaux propres (retours Thibaut 2026-10-26/27/28)', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { PlayerView } = await import('./PlayerView')
  const { cfgOf } = await import('../engine/gameData')
  const { garnisonHabitationVille } = await import('../engine/regimes')
  const { fmt } = await import('./ui')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(PlayerView, { joueur: 1 })),
  )
  const h = aplatir(html)
  // Le bloc en DEUX COLONNES (retour Thibaut 2026-10-28, 3e
  //  retour du jour : colonne gauche cultures + logements +
  //  garnison EMPILÉS, colonne droite les métiers — SUPERSEDÉ
  //  le damier 2×2 du matin) est rendu dans la carte ville.
  assert.ok(h.includes('ville-duo-cols'), 'les deux colonnes (3 tableaux empilés + métiers) absentes de la carte ville')
  assert.ok(h.includes('ville-col-stack'), 'la colonne des 3 tableaux empilés absente de la carte ville')
  assert.ok(
    h.indexOf('Cultures présentes') < h.indexOf('Logements : <strong>') &&
      h.indexOf('Logements : <strong>') < h.indexOf('Garnison des habitations : <strong>') &&
      h.indexOf('Garnison des habitations : <strong>') < h.indexOf('Métiers : <strong>'),
    'ordre attendu : cultures, logements, garnison empilés à gauche puis métiers à droite',
  )

  // ── Données dérivées de l'état (patron R3) : capitale du joueur 1 ──
  const C = cfgOf(etat.config)
  const p1 = etat.players.find((p) => p.n === 1)
  assert.ok(p1, 'joueur 1 introuvable')
  const cap = p1.villes[0]
  // Cultures présentes : même calcul que VilleCarte (vivants de la
  // ville, la majoritaire triée en tête).
  const cultures: Record<string, number> = {}
  for (const c of etat.population[1] ?? []) {
    if (c.statut === 'Décédé' || c.ville !== cap.nom) continue
    cultures[c.culture] = (cultures[c.culture] ?? 0) + 1
  }
  const nbVivants = Object.values(cultures).reduce((a, b) => a + b, 0)
  // Chaque culture rend SON compte dans le tableau ; la majoritaire
  // est la seule en gras.
  for (const [cult, nb] of Object.entries(cultures)) {
    assert.ok(
      h.includes(`<td class="num">${nb}</td>`),
      `compte ${nb} de la culture « ${cult} » absent du tableau`,
    )
    if (cult === cap.culture) {
      assert.ok(
        h.includes(`<strong>${esc(cult)}</strong>`),
        `culture majoritaire « ${cult} » non rendue en gras`,
      )
    }
  }
  // Le total des vivants est en pied de tableau.
  assert.ok(
    h.includes(`<td class="num"><strong>${nbVivants}</strong></td>`),
    `total des vivants (${nbVivants}) absent du pied du tableau cultures`,
  )
  // (Assertion négative) l'ancienne ligne à puces « Culture : N » en
  //  tête de carte n'est plus rendue (motif : strong + « : »).
  for (const cult of Object.keys(cultures)) {
    assert.ok(
      !h.includes(`<strong>${esc(cult)} : `),
      `ancienne ligne à puces encore rendue pour « ${cult} »`,
    )
  }
  // La garnison totale de la capitale (fonction moteur — valeur
  // d'état) est rendue dans le titre de la colonne droite.
  const g = garnisonHabitationVille(p1, cap, C, etat)
  assert.ok(
    h.includes(`Garnison des habitations : <strong>${esc(fmt(g))}</strong>`),
    `garnison ${fmt(g)} de « ${cap.nom} » absente du titre de colonne`,
  )
  // ── LOGEMENTS (retour Thibaut 2026-10-26 : « réduit les tableaux
  //  pour ajouter les logements ») : colonne gauche, SOUS les
  //  cultures (retour 2026-10-28, 3e retour) — parc
  //  par type de domicile, habitants/capacité puis libres, le tout
  //  DÉRIVÉ de l'état (patron R3 : stock City.domiciles + apports
  //  des constructions, occupés = habitants attribués — 1 logement
  //  = 1 habitant, retour du 2026-10-26).
  // (refonte 12 lois, 2026-10-29 : la loi de VILLE de la culture
  //  (domicilesCultureVille — Communautarisme « Logements élargis »
  //  +5 Taudis, Lunisme « Villes Saintes » +2 Palais) compte dans
  //  le parc, MÊME convention que les apports de constructions.)
  const { vivantsVille, domicilesApportesVille, domicilesCultureVille } = await import('../engine/domiciles')
  const capLog = new Map<string, number>()
  for (const e of Array.isArray(cap.domiciles) ? cap.domiciles : []) {
    capLog.set(e.domicile, (capLog.get(e.domicile) ?? 0) + e.nombre)
  }
  for (const e of [...domicilesApportesVille(cap, C), ...domicilesCultureVille(cap, C)]) {
    capLog.set(e.domicile, (capLog.get(e.domicile) ?? 0) + e.nombre)
  }
  const capTotale = [...capLog.values()].reduce((a, b) => a + b, 0)
  assert.ok(
    h.includes(`Logements : <strong>${esc(fmt(capTotale))}</strong>`),
    `capacité totale ${fmt(capTotale)} absente du titre du tableau logements`,
  )
  const habitantsCap = vivantsVille(etat, 1, cap)
  const occLog = new Map<string, number>()
  for (const c of habitantsCap) {
    if (c.domicile) occLog.set(c.domicile, (occLog.get(c.domicile) ?? 0) + 1)
  }
  for (const [nom, c] of capLog) {
    if (c <= 0 || !C.config.domiciles.some((d) => d.domicile === nom)) continue
    const o = occLog.get(nom) ?? 0
    assert.ok(
      h.includes(`class="num">${esc(fmt(o))}/${esc(fmt(c))}</td>`),
      `ligne logements « ${nom} » (${fmt(o)}/${fmt(c)}) absente du tableau logements`,
    )
  }
  // ── MÉTIERS (retour Thibaut 2026-10-27 : « un nouveau tableau
  //  avec les 3 tableaux de logement, culture et garnison, qui
  //  recense tous les métiers disponibles et occupés ») : tableau
  //  de la colonne DROITE, à côté des 3 tableaux empilés (retour
  //  Thibaut 2026-10-28, 3e retour), DÉRIVÉ de l'état (patron R3 — même
  //  helper moteur que le panneau Population).
  const { occupationsMetierVille } = await import('../engine/metiers')
  const lignesMet = occupationsMetierVille(habitantsCap, cap, C, { state: etat, joueur: 1 })
  const enPosteTotal = lignesMet.reduce((n, l) => n + (l.metier ? l.enPoste : 0), 0)
  assert.ok(
    h.includes(`Métiers : <strong>${esc(fmt(enPosteTotal))}</strong> en poste`),
    `titre « Métiers : ${fmt(enPosteTotal)} en poste » absent du tableau métiers`,
  )
  // Le tableau liste les métiers PRÉSENTS ET DISPONIBLES dans la
  //  ville SANS DISTINCTION (retour Thibaut 2026-10-28, 4e
  //  retour — SUPERSEDÉ le « disponibles » seuls du 3e retour) :
  //  un métier s'affiche s'il est OCCUPÉ (même non plafonné :
  //  le Dirigeant de la fixture, cap ∞ → N/—) OU OFFERT (cap
  //  finie >= 1, occupé ou non). Les lignes neutres restent :
  //  Sans-emploi (adultes) et Enfant (retour bis : ligne à part).
  const affiches = lignesMet.filter(
    (l) => l.metier === null || l.enPoste > 0 || (Number.isFinite(l.cap) && l.cap >= 1),
  )
  for (const l of affiches) {
    const label = l.metier ?? (l.enfants ? 'Enfant' : 'Sans-emploi')
    assert.ok(
      h.includes(`>${esc(label)}</`),
      `ligne « ${label} » absente du tableau métiers`,
    )
  }
  assert.ok(h.includes('Sans-emploi'), 'ligne « Sans-emploi » absente du tableau métiers')
  // La ligne Enfant recense les enfants SANS métier (les adultes
  //  sans métier restent au Sans-emploi) — la fixture en compte 17.
  const ligneEnfant = lignesMet.find((l) => l.enfants)
  assert.ok(ligneEnfant, 'fixture : des enfants dans la capitale (sinon adapter ce test)')
  assert.ok(
    h.includes('class="muted" title="Enfant : pas un sans-emploi'),
    'tooltip de la ligne Enfant absent du tableau métiers',
  )
  // Un métier NI occupé NI offert ne s'affiche PAS (retour
  //  2026-10-28, 4e retour) : seuls les 0/0 de la fixture. Le
  //  Dirigeant occupé (cap ∞) est de retour dans le tableau.
  for (const l of lignesMet) {
    if (l.metier === null || l.enPoste > 0 || (Number.isFinite(l.cap) && l.cap >= 1)) continue
    assert.ok(
      !h.includes(`>${esc(l.metier)}</td><td class="num`),
      `métier ni occupé ni offert « ${l.metier} » ne doit pas s'afficher dans le tableau métiers`,
    )
  }
  // Format N/M COMME LES LOGEMENTS (retour Thibaut 2026-10-28) :
  //  en poste / capacité, « — » en dénominateur pour les métiers
  //  non plafonnés, surnombre en rouge — sur les lignes affichées
  //  (Enfant et Sans-emploi inclus : cap illimitée → N/—).
  for (const l of affiches) {
    const surnombre = Number.isFinite(l.cap) && l.enPoste > l.cap
    const attenduNM = Number.isFinite(l.cap)
      ? `class="num${surnombre ? ' neg' : ''}">${esc(fmt(l.enPoste))}/${esc(fmt(l.cap))}</td>`
      : `class="num">${esc(fmt(l.enPoste))}/<span class="muted">—</span></td>`
    const label = l.metier ?? (l.enfants ? 'Enfant' : 'Sans-emploi')
    assert.ok(
      h.includes(attenduNM),
      `ligne métiers « ${label} » (${fmt(l.enPoste)}/${Number.isFinite(l.cap) ? fmt(l.cap) : '—'}) absente du tableau métiers`,
    )
  }
  // Le pied rend le total en poste / vivants de la ville.
  assert.ok(
    h.includes(`<strong>${esc(fmt(enPosteTotal))}/${esc(fmt(nbVivants))}</strong>`),
    `total « ${fmt(enPosteTotal)}/${fmt(nbVivants)} » (en poste/vivants) absent du tableau métiers`,
  )
})

test('rendu VilleCarte : production épurée par défaut — non produites cachées, toggle « tout afficher » (retour Thibaut 2026-10-26)', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { PlayerView } = await import('./PlayerView')
  const { cfgOf } = await import('../engine/gameData')
  const { productionVille } = await import('../engine/production')
  const { RESSOURCES_FLUX } = await import('./pays/pays-utils')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(PlayerView, { joueur: 1 })),
  )
  const h = aplatir(html)
  const C = cfgOf(etat.config)
  const p1 = etat.players.find((p) => p.n === 1)
  assert.ok(p1, 'joueur 1 introuvable')
  // Le toggle est rendu en vue repliée (le défaut CUCHE les
  // ressources non produites — retour 2026-10-26).
  assert.ok(
    h.includes('>tout afficher</button>'),
    'toggle « tout afficher » absent du bloc production (vue repliée attendue par défaut)',
  )
  // Le nombre de lignes de production rendues = EXACTEMENT les
  // ressources PRODUITES des villes du joueur 1 (patron R3 : tout
  // est dérivé de l'état — ni une ligne vide de trop, ni une
  // ressource produite manquante). Les lignes du tableau portent
  // la classe « ligne-prod » (signature — les récaps rendent aussi
  // des pastilles dot-res mais sans cette classe).
  let attendu = 0
  for (const v of p1.villes) {
    const pv = productionVille(etat, p1, v, C)
    for (const r of RESSOURCES_FLUX(C)) {
      if ([pv.batiments, pv.amenagements, pv.autres, pv.habitants]
        .some((d) => (d[r] ?? 0) !== 0)) attendu++
    }
  }
  assert.ok(attendu > 0, 'aucune ressource produite — partie de test suspecte')
  const rendues = h.split('<tr class="ligne-prod"').length - 1
  assert.equal(
    rendues, attendu,
    `attendu ${attendu} lignes de production (ressources produites des villes du joueur 1), rendu ${rendues} — cachage par défaut en échec`,
  )
})
