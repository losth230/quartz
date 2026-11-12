// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DOMICILES — vagues A+C (design domiciles/ascension 2026-10-24)
//   · table domiciles (qualité 0-4 : Taudis 0 → Palais 4) + domicilesRang structuré du rang ;
//   · qualite des métiers (roturier/bourgeois/noble) ;
//   · stock de la ville (City.domiciles) complété par normaliserEtat ;
//   · attribution : 1 logement = 1 HABITANT (retour Thibaut
//     2026-10-26 — plus de foyers), ordre de service par PRESTIGE
//     décroissant (les bâtiments les plus qualitatifs aux
//     personnages de haut rang), meilleure qualité d'abord, sans
//     dépasser le stock ;
//   · réservation (retour Thibaut 2026-10-28, 5e retour du jour) :
//     Maison de notable et Palais RÉSERVÉS au rang NOBLE — un
//     roturier ou un bourgeois ne peut ni les recevoir ni les
//     garder.
// ═══════════════════════════════════════════════════════════════════════════

import { rangDe } from './statutSocial'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import { migrerEtat } from './migrations'
import { migrerDomicilesApportes, cloneDefaultConfig } from '../config/defaultConfig'
import {
  domicileDef, qualiteDomicile, stockRang, totalLogementsVille,
  vivantsVille, attribuerDomicilesVille, initStockVille,
  taudisApportesVille, domicilesApportesVille, reserveNobleDomicile,
} from './domiciles'
import { constructionRef, resumeConstruction, prerequisConstruction } from './constructions'
import type { GameState, Player, City } from './types'

function partieTemoin(): { state: GameState; p: Player; ville: City; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 424242, 'local')
  const ville = state.players[0].villes[0]
  // (retour Thibaut 2026-10-29, 6e retour du jour : « il faut que les
  //  lits des lois puissent abriter des habitants, sinon ça ne sert
  //  à rien ») — les lits des lois sont désormais ATTRIBUTABLES ; or
  //  la ville témoin du setup est COMMUNAUTARISTE (loi « Logements
  //  élargis » +5 Taudis), ce qui changerait les capacités des tests
  //  de MÉCANIQUE d'attribution ci-dessous. Ces derniers travaillent
  //  sur le STOCK DU RANG SEUL : la ville témoin passe en culture
  //  SANS loi de logement (même convention que le mock partieMock
  //  des règles). L'attribution NOMINATIVE des lits des lois est
  //  testée dans engine/cultures.test.ts.
  ville.culture = 'Culture Nordique'
  return { state, p: state.players[0], ville, C }
}

// ── Vague A : référentiel ─────────────────────────────────────────────

test('table domiciles : 5 types, qualités 0-4 distinctes', () => {
  const { C } = partieTemoin()
  const ds = C.config.domiciles
  assert.ok(ds.length >= 5, `au moins 5 types (trouvé ${ds.length})`)
  const qualites = ds.map((d) => d.qualite)
  // échelle 0-4 (arbitrage Thibaut : la qualité EST le gain de
  //  prestige — Masure 0 … Palais 4)
  assert.deepEqual([...qualites].sort(), [0, 1, 2, 3, 4], 'échelle complète 0-4')
})

test('domicileDef / qualiteDomicile : lookup nom-insensible à la casse', () => {
  const { C } = partieTemoin()
  assert.equal(qualiteDomicile('Palais', C), 4)
  assert.equal(qualiteDomicile('palais', C), 4)
  assert.equal(qualiteDomicile('Maison', C), 1)
  assert.equal(qualiteDomicile('Masure', C), 0)
  assert.equal(qualiteDomicile(null, C), 0)
  assert.equal(qualiteDomicile('Inconnu', C), 0)
  assert.ok(domicileDef('Auberge', C))
})

test('stockRang : Hameau = 50 Taudis + 1 Maison de notable (fiche habitations 2026-10-26)', () => {
  const { C } = partieTemoin()
  const stock = stockRang('Ville', 'Hameau', C)
  const taudis = stock.find((e) => e.domicile === 'Taudis')
  const notable = stock.find((e) => e.domicile === 'Maison de notable')
  assert.ok(taudis, 'des Taudis au Hameau')
  assert.equal(taudis?.nombre, 50)
  assert.equal(notable?.nombre, 1, '1 Maison de notable au Hameau')
  assert.equal(stock.reduce((a, e) => a + e.nombre, 0), 51)
})

test('setup : la CAPITALE démarre avec 8 PALAIS, pas 1 Maison de notable (arbitrage Thibaut 2026-10-26)', () => {
  const { ville } = partieTemoin()
  const stock = ville.domiciles ?? []
  const palais = stock.find((e) => e.domicile === 'Palais')
  assert.ok(palais, 'des Palais dans la capitale au départ')
  assert.equal(palais?.nombre, 8, '8 Palais (la famille dirigeante y siège)')
  assert.ok(!stock.some((e) => e.domicile === 'Maison de notable'),
    'plus de Maison de notable dans le stock initial de la capitale')
  const taudis = stock.find((e) => e.domicile === 'Taudis')
  assert.equal(taudis?.nombre, 50, 'les 50 Taudis du rang Hameau restent')
  assert.equal(totalLogementsVille(ville), 58, '50 Taudis + 8 Palais = 58 logements')
})

test('qualite des métiers : catégories arbitrees (aménagement→roturier, bâtiment→bourgeois, cour→noble)', () => {
  const { C } = partieTemoin()
  const q = (m: string) => C.metiers.find((t) => t.metier === m)?.qualite
  assert.equal(q('Chasseur'), 'roturier')
  assert.equal(q('Fermier'), 'roturier')
  assert.equal(q('Commerçant'), 'bourgeois')
  assert.equal(q('Banquier'), 'bourgeois')
  assert.equal(q('Gouverneur'), 'noble')
  assert.equal(q('Dirigeant'), 'noble')
  // défaut : roturier
  assert.equal(q('Soldat'), 'roturier')
})

// ── Vague C : stock et foyers ──────────────────────────────────────────

test('normaliserEtat / migrerEtat : le stock de la ville est complété (vieille sauvegarde)', () => {
  const { state, ville } = partieTemoin()
  // simuler une vieille sauvegarde : pas de champ domiciles, tampon
  //  schema absent → migrerEtat rejoue TOUTES les migrations (v1
  //  normaliserEtat complète le stock).
  delete (ville as { domiciles?: unknown }).domiciles
  delete (state as { schema?: unknown }).schema
  migrerEtat(state)
  assert.ok(Array.isArray(ville.domiciles), 'stock complété par migrerEtat')
  assert.ok(totalLogementsVille(ville) >= 50, `au moins les maisons du rang (${totalLogementsVille(ville)})`)
})

test('initStockVille : le rang DÉFINIT l\u2019offre (écrase le stock) \u2014 la CAPITALE garde 8 Palais (arbitrage 2026-11-12)', () => {
  const { ville, C } = partieTemoin()
  initStockVille(ville, C)
  const total1 = totalLogementsVille(ville)
  // Hameau : 50 Taudis + 1 Maison de notable + 8 Palais (la ville
  //  témoin est la CAPITALE : « la capitale doit avoir 8 palais
  //  par défaut tout le temps »)
  assert.equal(total1, 59)
  assert.equal((ville.domiciles ?? []).find((e) => e.domicile === 'Palais')?.nombre, 8,
    'la capitale porte ses 8 Palais dès le Hameau')
  // on change le rang : le stock suit — les Palais NE DISPARAISSENT PAS
  ville.rang = 'Cité'
  initStockVille(ville, C)
  assert.equal(totalLogementsVille(ville), 129) // Cité : 100 + 20 + 1 + 8 Palais
  assert.equal((ville.domiciles ?? []).find((e) => e.domicile === 'Palais')?.nombre, 8,
    'amélioration : les 8 Palais de la capitale sont toujours là')
})

test('attribuerDomicilesVille : 1 logement = 1 habitant \u2014 chaque vivant consomme une place (retour Thibaut 2026-10-26)', () => {
  const { state, p, ville, C } = partieTemoin()
  initStockVille(ville, C)
  const loges = attribuerDomicilesVille(state, p, ville, C)
  const vivants = vivantsVille(state, p.n, ville)
  const capacite = totalLogementsVille(ville)
  assert.equal(loges, Math.min(capacite, vivants.length),
    `loges = min(capacite ${capacite}, habitants ${vivants.length})`)
  assert.equal(vivants.filter((c) => c.domicile).length, loges, 'un logement par habitant loge, pas de surbooking')
  for (const c of vivants.filter((c) => c.domicile)) {
    assert.ok(domicileDef(c.domicile, C), `domicile inconnu : ${c.domicile}`)
  }
  // meilleure qualite d'abord : avec les 8 Palais de la capitale
  //  (arbitrage 2026-11-12), les premiers servis partent en Palais
  //  ou Maison de notable
  assert.ok(vivants.some((c) => c.domicile === 'Palais' || c.domicile === 'Maison de notable'),
    'le meilleur logement disponible est attribue (Palais de la capitale ou Maison de notable)')
})

test('attribuerDomicilesVille : les bâtiments les plus qualitatifs servent le HAUT RANG (prestige décroissant)', () => {
  const { state, p, ville, C } = partieTemoin()
  const vivants = vivantsVille(state, p.n, ville)
  assert.ok(vivants.length >= 4, 'partie témoin assez peuplée')
  // un noble (prestige 300) et un bourgeois (120) ; le reste à 0
  for (const c of vivants) c.domicile = null
  // (base 300 des nobles de naissance, retour Thibaut 2026-10-26 :
  //  écrasée ici pour que SEULS vivants[0] et vivants[1] aient du
  //  prestige — le test vérifie l'ORDRE de service, pas la base)
  for (const c of vivants) c.prestige = 0
  vivants[0].prestige = 300
  vivants[1].prestige = 120
  // parc réduit : 1 Maison de notable (qualité 3) + 1 Maison (1)
  ville.domiciles = [
    { domicile: 'Maison de notable', nombre: 1 },
    { domicile: 'Maison', nombre: 1 },
  ]
  const loges = attribuerDomicilesVille(state, p, ville, C)
  assert.equal(loges, 2, 'seuls 2 habitants logés (2 logements)')
  assert.equal(vivants[0].domicile, 'Maison de notable',
    'le personnage de haut rang (300) prend la Maison de notable')
  assert.equal(vivants[1].domicile, 'Maison',
    'le bourgeois (120) prend la Maison — meilleur reste')
  // les prestige 0 (dont les mineurs) restent dehors
  for (const c of vivants.slice(2)) {
    assert.equal(c.domicile, null, `« ${c.prenom} » (prestige ${c.prestige ?? 0}) devait rester dehors`)
  }
})

test('attribuerDomicilesVille : Maison de notable et Palais RÉSERVÉS aux nobles (retour Thibaut 2026-10-28, 5e retour du jour)', () => {
  const { state, p, ville, C } = partieTemoin()
  const vivants = vivantsVille(state, p.n, ville)
  // le helper : exactement les deux types nommés par le retour
  assert.ok(reserveNobleDomicile('Palais') && reserveNobleDomicile('maison de notable'),
    'Palais et Maison de notable sont réservés (insensible à la casse)')
  assert.ok(!reserveNobleDomicile('Maison') && !reserveNobleDomicile(null),
    'Maison et null ne le sont pas')
  // un parc TRÈS large en domiciles réservés, personne de noble
  //  (dynastie roturier, prestige 0) : les réservés restent VIDES
  ville.domiciles = [
    { domicile: 'Maison de notable', nombre: 2 },
    { domicile: 'Palais', nombre: 2 },
    { domicile: 'Maison', nombre: 1 },
  ]
  for (const c of vivants) {
    c.domicile = null
    c.prestige = 0
    c.dynastie = C.p.dynastieRoturier
  }
  const loges0 = attribuerDomicilesVille(state, p, ville, C)
  assert.equal(loges0, 1, 'sans noble, seule la Maison part — les réservés restent vides')
  assert.ok(
    vivants.every((c) => c.domicile === null || c.domicile === 'Maison'),
    'aucun roturier en Maison de notable ni au Palais',
  )
  // UN noble (par le prestige — rangDe : ≥ 250) : il prend un
  //  PALAIS (meilleure qualité), personne d'autre ne le suit
  vivants[0].prestige = 300
  for (const c of vivants) c.domicile = null
  const loges1 = attribuerDomicilesVille(state, p, ville, C)
  assert.equal(loges1, 2)
  assert.equal(vivants[0].domicile, 'Palais', 'le noble (300) prend un Palais')
  assert.ok(vivants.slice(1).every((c) => c.domicile === null || c.domicile === 'Maison'),
    'les non-nobles ne touchent pas les réservés',
  )
  // un BOURGEOIS qui détenait un Palais (attribution antérieure
  //  au retour) ne le GARDE pas : relogé dans le meilleur reste
  vivants[1].prestige = 120
  vivants[1].domicile = 'Palais'
  for (const c of vivants) if (c !== vivants[0] && c !== vivants[1]) c.domicile = null
  const loges2 = attribuerDomicilesVille(state, p, ville, C)
  assert.equal(vivants[0].domicile, 'Palais', 'le noble garde son Palais')
  assert.equal(vivants[1].domicile, 'Maison', 'le bourgeois (120) perd le Palais — relogé en Maison')
  assert.equal(loges2, 2)
})

test('attribuerDomicilesVille : stock insuffisant → habitants sans domicile, pas de surbooking', () => {
  const { state, p, ville, C } = partieTemoin()
  // stock ridicule : 2 logements
  ville.domiciles = [{ domicile: 'Maison', nombre: 2 }]
  const loges = attribuerDomicilesVille(state, p, ville, C)
  assert.equal(loges, 2, 'seuls 2 habitants logés')
  // RELIRE les vivants APRÈS attribution
  const vivants = vivantsVille(state, p.n, ville)
  assert.equal(vivants.filter((c) => c.domicile).length, 2)
  // les autres sans domicile — champ null, pas d'inconnu
  for (const c of vivants.filter((c) => !c.domicile)) {
    assert.equal(c.domicile, null)
  }
})

test('attribuerDomicilesVille : idempotent — un habitant logé garde son domicile', () => {
  const { state, p, ville, C } = partieTemoin()
  initStockVille(ville, C)
  attribuerDomicilesVille(state, p, ville, C)
  const d1 = vivantsVille(state, p.n, ville).map((c) => c.domicile)
  attribuerDomicilesVille(state, p, ville, C)
  const d2 = vivantsVille(state, p.n, ville).map((c) => c.domicile)
  assert.deepEqual(d2, d1, 'attribution stable')
})

test('normaliserEtat + attribuer : les vieilles parties gagnent leurs domiciles sans mutation d\'état parasites', () => {
  const { state, p, ville, C } = partieTemoin()
  delete (ville as { domiciles?: unknown }).domiciles
  delete (state as { schema?: unknown }).schema
  migrerEtat(state) // compléter le stock (rejoue v1)
  const avant = state.turn
  attribuerDomicilesVille(state, p, ville, C)
  assert.equal(state.turn, avant, 'pas de mutation du tour')
  const vivants = vivantsVille(state, p.n, ville)
  const loges = vivants.filter((c) => c.domicile).length
  // (AMENDEMENT plancher noble, arbitrage 2026-11-12 : « 1 logement
  //  = 1 habitant » vaut pour les ROTURIERS — un noble sans place
  //  de qualité >= Maison de notable reste SANS domicile plutôt
  //  que de vivre en Taudis. Chaque non-logé doit donc être un
  //  noble : le plancher explique chaque absence.)
  const attendu = Math.min(totalLogementsVille(ville), vivants.length)
  const nonLoges = vivants.filter((c) => !c.domicile)
  assert.ok(loges <= attendu, `loges (${loges}) <= capacite (${attendu})`)
  for (const c of nonLoges) {
    assert.equal(rangDe(c, C), 'noble',
      `non-loge ${c.prenom} : un noble sans place de qualite (plancher noble 2026-11-12)`)
  }
  assert.ok(loges > 0, 'l\'attribution initialise le stock et loge')
})


// ── Régression audit de merge (2026-10-24) ────────────────────────────

test('audit merge : createGame initialise le stock (régression — parties neuves logées)', () => {
  // BUG DE L'AUDIT : createGame ne posait pas City.domiciles — le
  //  stock restait indéfini, l'attribution ne logeait PERSONNE et
  //  le facteur logement du bonheur restait à 0 partout. Corrigé :
  //  stock initial au rang de création + défense en profondeur dans
  //  attribuerDomicilesVille.
  const { p } = partieTemoin()
  assert.ok(Array.isArray(p.villes[0].domiciles), 'createGame pose le stock')
  assert.ok(totalLogementsVille(p.villes[0]) >= 50, 'stock du rang initial')
})

test('audit merge : vieille partie tamponnée (v4) sans stock — attribution répare (défense en profondeur)', () => {
  const { state, p, ville, C } = partieTemoin()
  // simuler une sauvegarde d'avant la vague, tampon déjà à jour
  delete (ville as { domiciles?: unknown }).domiciles
  state.schema = 4
  migrerEtat(state) // ne rejoue PAS la v1 (tampon à jour)
  assert.equal(ville.domiciles, undefined, 'migrerEtat ne touche pas (tampon)')
  const loges = attribuerDomicilesVille(state, p, ville, C)
  assert.ok(loges > 0, `l'attribution initialise le stock et loge (${loges})`)
  assert.ok(Array.isArray(ville.domiciles), 'stock posé par défense en profondeur')
})

// ── Fiche aménagements 3 tiers (retour Thibaut 2026-10-26) ────────────

test('fiche amenagements : PLUS AUCUN logement (arbitrage Thibaut 2026-11-12)', () => {
  const { ville, C } = partieTemoin()
  ville.amenagements = ['Champ', 'Champ', 'Baleinier', 'Champ (tier 2)', 'Riziere (tier 3)']
  assert.equal(taudisApportesVille(ville, C), 0, 'aucun amenagement n\u2019apporte plus de Taudis')
  assert.equal(domicilesApportesVille(ville, C).length, 0, 'aucun amenagement n\u2019apporte plus de logements')
  // les BATIMENTS gardent leurs logements (non concernes par l\u2019arbitrage)
  ville.amenagements = []
  ville.batiments = ['Poste de garde']
  assert.equal(taudisApportesVille(ville, C), 10, 'les batiments conservent leurs +10 Taudis')
})

test('fiche amenagements : Scierie tier 2 \u2014 2 Tisseurs, PLUS de logements (arbitrage 2026-11-12)', () => {
  const { C } = partieTemoin()
  const ref = constructionRef('Scierie (tier 2)', C.config)
  assert.ok(ref, 'Scierie tier 2 dans le referentiel')
  assert.equal((ref.domicilesApportes ?? []).find((e) => e.domicile === 'Taudis'), undefined,
    'plus aucun logement sur les amenagements (arbitrage 2026-11-12)')
  const emp = ref.emplacements ?? []
  const tisseur = emp.find((e) => e.metier === 'Tisseur')
  const bucheron = emp.find((e) => e.metier === 'Bûcheron')
  assert.equal(tisseur?.places, 2, '2 emplacements de Tisseur (fiche, ex-1)')
  assert.equal(bucheron?.places, 4, '4 emplacements de Bucheron')
})

test('fiche aménagements : Mine d\'Or — 1 Marchand = 2 Commerçants (arbitrage Thibaut 2026-10-26)', () => {
  const { C } = partieTemoin()
  // le Marchand étant retiré du jeu, ses emplacements sont remplacés
  //  par le DOUBLE de Commerçants : 3→6, 7→14, 12→24.
  for (const [tier, attendu] of [[1, 6], [2, 14], [3, 24]] as const) {
    const nom = tier === 1 ? "Mine d'Or" : `Mine d'Or (tier ${tier})`
    const ref = constructionRef(nom, C.config)
    assert.ok(ref, `${nom} dans le référentiel`)
    const commercants = (ref.emplacements ?? []).find((e) => e.metier === 'Commerçant')
    assert.equal(commercants?.places, attendu, `${nom} : ${attendu} Commerçants`)
  }
})

test('fiche amenagements : resumeConstruction sans Taudis (arbitrage 2026-11-12)', () => {
  const { C } = partieTemoin()
  assert.ok(!resumeConstruction(constructionRef('Champ', C.config)).includes('Taudis'),
    'Champ : plus de Taudis dans le resume')
  const scierie2 = resumeConstruction(constructionRef('Scierie (tier 2)', C.config))
  assert.ok(!scierie2.includes('Taudis'), 'Scierie tier 2 : plus de Taudis')
  assert.ok(scierie2.includes('2 tisseur'), 'Scierie tier 2 : 2 tisseurs toujours dans le resume')
})

// ── Fiche bâtiments rang 1 + 2 (retour Thibaut 2026-10-26) ─────────────

test('fiche bâtiments : Taudis apportés par les BÂTIMENTS (Poste de garde + Bas quartier)', () => {
  const { ville, C } = partieTemoin()
  ville.batiments = ['Poste de garde', 'Bas quartier']
  assert.equal(taudisApportesVille(ville, C), 30, '10 + 20')
  // rang 2 : la Caserne cumule pareil
  ville.batiments = ['Poste de garde', 'Caserne']
  assert.equal(taudisApportesVille(ville, C), 20, '10 + 10')
})

test('fiche bâtiments : domicilesApportesVille — Maisons et Maisons de notable', () => {
  const { ville, C } = partieTemoin()
  // Quartier intermédiaire +20 Maisons, Haut quartier +20 Maisons de
  //  notable (Château, rang 2) — cumul par type de domicile.
  ville.batiments = ['Quartier intermédiaire', 'Haut quartier']
  assert.deepEqual(domicilesApportesVille(ville, C), [
    { domicile: 'Maison', nombre: 20 },
    { domicile: 'Maison de notable', nombre: 20 },
  ])
  // Tour de sorcier : +1 Maison de notable, +1 Scientifique (lui
  //  aussi lu par la carte, pas ici)
  const tour = constructionRef('Tour de sorcier', C.config)
  assert.deepEqual(tour?.domicilesApportes, [{ domicile: 'Maison de notable', nombre: 1 }])
})

test('fiche bâtiments : resumeConstruction affiche les domiciles apportés (pluriel)', () => {
  const { C } = partieTemoin()
  const quart = resumeConstruction(constructionRef('Quartier intermédiaire', C.config))
  assert.ok(quart.includes('+20 Maisons'), '« +20 Maisons » (pluriel)')
  const haut = resumeConstruction(constructionRef('Haut quartier', C.config))
  assert.ok(haut.includes('+20 Maisons de notable'), '« +20 Maisons de notable »')
  const tour = resumeConstruction(constructionRef('Tour de sorcier', C.config))
  assert.ok(tour.includes('+1 Maison de notable'), '« +1 Maison de notable » (singulier)')
})

test('fiche bâtiments : prérequis rang 2 lus depuis le champ coût (« X requis »)', () => {
  const { C } = partieTemoin()
  assert.equal(prerequisConstruction(constructionRef('Caserne', C.config)), 'Poste de garde')
  assert.equal(prerequisConstruction(constructionRef('Ecole militaire', C.config)), "Terrain d'entrainement")
  assert.equal(prerequisConstruction(constructionRef('Clinique', C.config)), 'Herboristerie')
  // le remplacement n'est PAS un prérequis : Silo à grain remplace la
  //  Grange via le champ dédié (pas de « requis » dans le coût)
  assert.equal(prerequisConstruction(constructionRef('Silo à grain', C.config)), null)
  // (NORMALISATION 2026-11-02 : remplaceBatiment est un TABLEAU — le
  //  remplacement vit dans les données, lu par remplaceBatimentRef.)
  assert.deepEqual(constructionRef('Silo à grain', C.config)?.remplaceBatiment, ['Grange'])
})

test('fiche bâtiments : Caserne rang 2 (Ville ET Château), +4 Garde, +10 Taudis', () => {
  const { C } = partieTemoin()
  for (const g of ['Ville', 'Château']) {
    const ref = C.config.constructions.find((c) => c.nom === 'Caserne' && c.groupe === g)
    assert.ok(ref, `Caserne ${g} dans le référentiel`)
    assert.equal(ref?.rangMinHabitation, 2, `${g} : rang 2`)
    assert.equal((ref?.domicilesApportes ?? []).find((e) => e.domicile === 'Taudis')?.nombre, 10, `${g} : +10 Taudis (via domicilesApportes)`)
    assert.deepEqual((ref?.emplacements ?? []).find((e) => e.metier === 'Garde'), { metier: 'Garde', places: 4 })
  }
})

test('fiche bâtiments : l\'Herboristerie (rang 1) n\'accueille plus de Guérisseur — la Clinique (rang 2) en accueille 5', () => {
  const { C } = partieTemoin()
  const herb = constructionRef('Herboristerie', C.config)
  assert.ok(herb, 'Herboristerie au référentiel')
  assert.equal(herb?.emplacements, undefined, 'plus d\'emplacements : uniquement ±5% maladie')
  assert.equal(herb?.malContraction, 0.05)
  assert.equal(herb?.bonusGuerison, 0.05)
  const clin = constructionRef('Clinique', C.config)
  assert.ok(clin, 'Clinique au référentiel')
  assert.equal(clin?.rangMinHabitation, 2)
  assert.deepEqual((clin?.emplacements ?? []).find((e) => e.metier === 'Guérisseur'), { metier: 'Guérisseur', places: 5 })
  // le résumé de l'Herboristerie reste STRUCTURÉ (effets ±5%) pour que
  //  le picker ne retombe pas sur la description du classeur
  assert.ok(resumeConstruction(herb).includes('+5% guérison'),
    'Herboristerie : « +5% guérison » dans le résumé structuré')
})

// ── NORMALISATION DOMICILES (2026-11-02) ──────────────────────────────

test('normalisation domiciles : les Taudis vivent dans domicilesApportes — plus aucun champ taudisApportes au référentiel', () => {
  const { C } = partieTemoin()
  const refs = C.config.constructions ?? []
  // AUCUNE entrée ne porte l'ancien champ
  const anciens = refs.filter((c) => (c as unknown as { taudisApportes?: number }).taudisApportes != null)
  assert.equal(anciens.length, 0, `l'ancien champ taudisApportes ne doit plus exister (trouvé sur : ${anciens.map((c) => c.nom).join(', ')})`)
  // Les entrées qui apportaient des Taudis les portent désormais en domicilesApportes
  const postes = refs.filter((c) => c.nom === 'Poste de garde')
  assert.ok(postes.length > 0, 'Poste de garde au référentiel')
  for (const ref of postes) {
    const taudis = (ref.domicilesApportes ?? []).find((e) => e.domicile === 'Taudis')
    assert.equal(taudis?.nombre, 10, `${ref.groupe} : +10 Taudis via domicilesApportes`)
  }
  // Champ : +5 Taudis (fiche tier 1) — même canal
  const champ = refs.find((c) => c.nom === 'Champ')
  assert.equal((champ?.domicilesApportes ?? []).find((e) => e.domicile === 'Taudis'), undefined,
    'Champ : plus aucun Taudis (arbitrage 2026-11-12)')
})

test('normalisation domiciles : une construction peut porter Taudis ET Maisons ENSEMBLE (le cas impossible avant)', () => {
  // Config CLONÉE (le registre de la banque cache les règles par
  //  référence de Cfg et cfgOf met la config par défaut en cache :
  //  pousser l'entrée perso dans la config PARTAGÉE déjà lue ne
  //  reconstruirait pas sa règle — un clone donne un Cfg neuf).
  const C = cfgOf(cloneDefaultConfig())
  const state = createGame(defaultSetups(), 424242, 'local')
  const ville = state.players[0].villes[0]
  // Entrée PERSO dans la config : les deux types de logement dans LE même champ
  const perso = {
    nom: 'Grand ensemble (perso)', groupe: 'Ville', categorie: 'Bâtiment' as const,
    famille: 'Economique', couts: [],
    domicilesApportes: [
      { domicile: 'Taudis', nombre: 10 },
      { domicile: 'Maison', nombre: 20 },
    ],
  }
  C.config.constructions.push(perso)
  ville.batiments.push(perso.nom)
  const apportes = domicilesApportesVille(ville, C)
  const taudis = apportes.find((e) => e.domicile === 'Taudis')?.nombre ?? 0
  const maisons = apportes.find((e) => e.domicile === 'Maison')?.nombre ?? 0
  assert.equal(taudis, 10, 'les 10 Taudis sont comptés')
  assert.equal(maisons, 20, 'les 20 Maisons sont comptées dans le MÊME canal')
})

test('normalisation domiciles : migrerDomicilesApportes convertit les configs perso d’avant la fusion (idempotent)', () => {
  const avant = {
    nom: 'Vieille entrée perso', groupe: 'Ville', categorie: 'Bâtiment' as const,
    couts: [],
    taudisApportes: 8,
  } as never as import('./constructions').ConstructionRef
  const apres = migrerDomicilesApportes(avant)
  assert.equal((apres.domicilesApportes ?? []).find((e) => e.domicile === 'Taudis')?.nombre, 8,
    'taudisApportes 8 → domicilesApportes [{Taudis, 8}]')
  assert.equal((apres as unknown as { taudisApportes?: number }).taudisApportes, undefined, "l'ancien champ est retiré")
  // idempotent : re-migrer l'entrée déjà convertie ne change rien
  const encore = migrerDomicilesApportes(apres)
  assert.deepEqual(encore.domicilesApportes, apres.domicilesApportes, 'migration idempotente')
})


// ── PLANCHER NOBLE (arbitrage Thibaut 2026-11-12) ────────────────────

test('plancher noble : un noble ne reçoit JAMAIS un domicile sous la Maison de notable', () => {
  const { state, p, ville, C } = partieTemoin()
  initStockVille(ville, C)
  // stock : uniquement des Taudis (on vide le reste)
  ville.domiciles = [{ domicile: 'Taudis', nombre: 50 }]
  const vivants = vivantsVille(state, p.n, ville)
  for (const c of vivants) { c.domicile = null; c.prestige = 0 }
  // un noble (prestige 300 = rang noble de naissance), le reste à 0
  const noble = vivants[0]
  noble.prestige = 300
  assert.equal(vivants.filter((c) => (c.prestige ?? 0) >= 250).length, 1, 'fixture : un seul noble')
  attribuerDomicilesVille(state, p, ville, C)
  // le noble n'a PAS pris un Taudis : il reste SANS domicile
  assert.equal(noble.domicile, null,
    'le noble reste sans domicile plutôt que de vivre en Taudis (plancher noble)')
  // les roturiers, eux, sont logés en Taudis
  assert.ok(vivants.some((c) => c !== noble && c.domicile === 'Taudis'),
    'les roturiers prennent les Taudis')
})

test('plancher noble : un noble déjà logé en Taudis (vieille partie) est RELOGé ou sans domicile', () => {
  const { state, p, ville, C } = partieTemoin()
  initStockVille(ville, C)
  const vivants = vivantsVille(state, p.n, ville)
  for (const c of vivants) c.prestige = 0
  const noble = vivants[0]
  noble.prestige = 300
  noble.domicile = 'Taudis' // état hérité d'avant l'arbitrage
  ville.domiciles = [{ domicile: 'Taudis', nombre: 50 }]
  for (const c of vivants) if (c !== noble && c.domicile === 'Palais') c.domicile = null
  attribuerDomicilesVille(state, p, ville, C)
  assert.notEqual(noble.domicile, 'Taudis',
    'le noble hérité d\u2019un Taudis ne le garde pas (relogé ou sans domicile)')
  assert.ok(noble.domicile === null || (domicileDef(noble.domicile, C)?.qualite ?? 0) >= 3,
    'si le noble est logé, c\u2019est en qualité >= Maison de notable (3)')
})
