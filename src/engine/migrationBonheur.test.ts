// ═══════════════════════════════════════════════════════════════════════════
//  TESTS MIGRATION PAR BONHEUR (arbitrage Thibaut 2026-10-28)
//
//   · départ LINÉAIRE : 0 % à 100 de bonheur, max à 0, moitié à 50
//     (« entre 0 % et 10 %, le 10 % à 0 de bonheur, le 0 % à 100 ») ;
//   · destinations : TOUTES les villes du monde, transfert physique
//     inter-joueurs au besoin (comme l'ancienne migration scolaire) ;
//   · qui part : tous les vivants SAUF Dirigeant/Héritier et les
//     soldats/commandants en armée (l'armée lie l'habitant) ;
//   · FOYER COMPLET (amendement, 4e retour arbitre) : un départ
//     emporte le conjoint de la même ville ET leurs enfants NON
//     MARIÉS de la ville ; enfant marié = foyer propre ; enfant
//     ancré (Héritier/soldat) reste sans entraver le départ ;
//     conjoint ancré → le foyer ne part pas ;
//   · cultures des villes recalculées après le flux (majorité).
//   · pondération v2 (3e retour du jour) : ville du MÊME JOUEUR ×1,5
//     × culture identique ×1,25 × (1 + bonheur/100) — les trois effets
//     se multiplient (REMPLACÉE par la v3 ADDITIVE du 6e retour
//     2026-10-29 : attrait × (1 + joueur +0,5 + culture +0,25 +
//     bonus emploi/logement du tiré)) ; retour vers une ville
//     d'origine légitime ;
//   · toute migration = perteDemenagement + entrée « Système » au
//     journal avec le motif « cherche meilleure vie » ;
//   · FACTEURS EMPLOI & LOGEMENT (5e retour arbitre, 2026-10-29) :
//     un sans-métier pèse ×N une ville aux postes non pourvus,
//     un sans-domicile ×N une ville aux lits libres — les deux
//     ne parlent QUE pour qui manque et là où c'est libre.
//     V3 ADDITIVE (6e retour arbitre, 2026-10-29) : la formule se
//     base sur le bonheur, tous les autres modificateurs sont
//     ADDITIFS — même joueur +0,5, culture +0,25, emploi +1,
//     logement +1 (la ville pèse ×2 pour qui manque).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf } from './gameData'
import { makeRng } from './rng'
import { bonheurVilleComplete } from './bonheur'
import {
  probaDepartBonheur, poidsDestination, migrationBonheur,
  facteurEmploi, facteurLogement,
} from './migrationBonheur'
import type { Character, City, GameState } from './types'

function partie(seed = 20261028): { state: GameState; C: ReturnType<typeof cfgOf> } {
  const state = createGame(defaultSetups(), seed, 'local')
  const C = cfgOf(state.config)
  return { state, C }
}

/** Habitant de test (tuple de 3 traits, cf. Character). */
function hab(id: string, age: number, o: { metier?: string | null; ville?: string; culture?: string; armee?: string | null } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: o.culture ?? 'Déisme', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Fécond', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: o.armee ?? null,
  }
}

function villeTest(nom: string, culture?: string): City {
  return { nom, type: 'Ville', culture, batiments: [], amenagements: [] } as unknown as City
}

// ── Formules pures ──────────────────────────────────────────────────

test('proba de départ : LINÉAIRE — 0 % à 100 de bonheur, max à 0, moitié à 50', () => {
  const { C } = partie()
  C.p.migrationBonheurMax = 0.10
  assert.equal(probaDepartBonheur(100, C), 0, '0 % à 100 de bonheur (retour arbitre)')
  assert.equal(probaDepartBonheur(0, C), 0.10, '10 % à 0 de bonheur (retour arbitre)')
  assert.ok(Math.abs(probaDepartBonheur(50, C) - 0.05) < 1e-12, '5 % à 50')
  assert.equal(probaDepartBonheur(75, C), 0.025, '2,5 % à 75')
  C.p.migrationBonheurMax = 0
  assert.equal(probaDepartBonheur(0, C), 0, 'proba max nulle = flux coupé')
})

test('poids de destination v3 ADDITIVE : la formule se base sur le bonheur, les autres modificateurs s\'additionnent', () => {
  const { C } = partie()
  assert.equal(C.p.migrationBonheurCulture, 0.25, 'défaut verrouillé (v3, 6e retour 2026-10-29)')
  assert.equal(C.p.migrationBonheurMemeJoueur, 0.5, 'défaut verrouillé (v3, 6e retour 2026-10-29)')
  const c = hab('m1', 30, { culture: 'Nordique' })
  const memeCulture = villeTest('A', 'Nordique')
  const autreCulture = villeTest('B', 'Méridionale')
  assert.equal(poidsDestination(c, autreCulture, 0, C), 1, 'base 1 sans modificateur à bonheur 0')
  assert.equal(poidsDestination(c, autreCulture, 100, C), 2, 'l\'attrait du bonheur reste la base multiplicative ×[1 ; 2]')
  assert.equal(poidsDestination(c, memeCulture, 0, C), 1.25, 'culture identique : +0,25 (le multiplicatif ×1,25 v2 est REMPLACÉ)')
  assert.equal(poidsDestination(c, autreCulture, 0, C, true), 1.5, 'même joueur : +0,5')
  assert.equal(poidsDestination(c, memeCulture, 0, C, true), 1.75, 'l\'exemple de l\'arbitre : culture + joueur = attrait × 1,75')
  assert.equal(poidsDestination(c, memeCulture, 100, C, true), 3.5, 'attrait ×2 × 1,75')
  // bonus additifs du tiré (emploi + logement additionnés par l\'appelant)
  assert.equal(poidsDestination(c, autreCulture, 0, C, true, 1), 2.5, 'même joueur + 1 bonus du tiré')
  assert.equal(poidsDestination(c, memeCulture, 100, C, true, 2), 7.5, 'attrait ×2 × (1 + 0,5 + 0,25 + 2) — tout s\'additionne')
  // ville sans culture renseignée (champ optionnel) : pas de bonus culture
  assert.equal(poidsDestination(c, villeTest('C'), 0, C), 1)
  assert.equal(poidsDestination(c, villeTest('C'), 0, C, true), 1.5, 'sans culture, le bonus même joueur reste seul')
})

// ── Flux complet (déterministe — graines fixes) ──────────────────────

test('flux : à proba max 1, les villes malheureuses se vident au profit du monde — conservé, journalisé, déménageur perd tout', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 1 // p = (100 − bonheur)/100 ≈ 0,6 au départ
  // Photographie avant : id → (joueur, ville)
  const avant = new Map<string, { joueur: number; ville: string }>()
  for (const [nStr, liste] of Object.entries(state.population)) {
    for (const c of liste ?? []) avant.set(c.id, { joueur: Number(nStr), ville: c.ville })
  }
  const totalAvant = Object.values(state.population).reduce((a, l) => a + (l?.length ?? 0), 0)
  migrationBonheur(state, makeRng(424242))
  // 1. Aucune perte, aucun doublon — les habitants sont transférés
  const apres = new Map<string, { joueur: number; ville: string }>()
  for (const [nStr, liste] of Object.entries(state.population)) {
    for (const c of liste ?? []) {
      assert.ok(!apres.has(c.id), `le migrant ${c.id} n apparaît qu une fois`)
      apres.set(c.id, { joueur: Number(nStr), ville: c.ville })
    }
  }
  assert.equal(apres.size, avant.size, 'conservation exacte de la population mondiale')
  const totalApres = Object.values(state.population).reduce((a, l) => a + (l?.length ?? 0), 0)
  assert.equal(totalApres, totalAvant)
  // 2. Le flux a tourné à cette graine : des habitants ont bougé
  let bouge = 0
  for (const [id, a] of apres) {
    const b = avant.get(id)!
    if (a.joueur !== b.joueur || a.ville !== b.ville) bouge++
  }
  assert.ok(bouge > 50, `le flux a déplacé massivement (${bouge} migrants à proba max 1)`)
  // 3. Chaque migrant : entrée au journal + métier ET domicile perdus
  const logs = state.log.filter((e) => e.texte.includes('cherche meilleure vie'))
  assert.equal(logs.length, bouge, 'une entrée « Système » par migration')
  for (const [id, a] of apres) {
    const b = avant.get(id)!
    if (a.joueur === b.joueur && a.ville === b.ville) continue
    const c = [...(state.population[a.joueur] ?? [])].find((x) => x.id === id)!
    assert.equal(c.metier, null, `${id} : métier perdu au déménagement`)
    assert.equal(c.domicile, null, `${id} : domicile perdu au déménagement`)
  }
})

test('flux : à proba max nulle, RIEN ne bouge (interrupteur)', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 0
  const avant = JSON.stringify(state.population)
  migrationBonheur(state, makeRng(777))
  assert.equal(JSON.stringify(state.population), avant, 'aucun transfert à proba 0')
  assert.equal(state.log.filter((e) => e.texte.includes('cherche meilleure vie')).length, 0)
})

test('flux : Dirigeant et Héritier ne partent jamais, même à proba max 1', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 1
  const p0 = state.players[0]
  const dir = hab('dir1', 40, { metier: C.p.metierDirigeant, ville: p0.villes[0].nom })
  const her = hab('her1', 20, { metier: C.p.metierHeritierStr, ville: p0.villes[0].nom })
  state.population[p0.n] = [dir, her]
  migrationBonheur(state, makeRng(1234))
  // NB : d autres habitants peuvent ARRIVER chez p0 (flux à proba
  //  max 1) — on ne compte pas la longueur, on vérifie les ancrés.
  const chezP0 = state.population[p0.n]
  assert.ok(chezP0.includes(dir) && chezP0.includes(her), 'aucun départ des ancrés')
  assert.equal(dir.ville, p0.villes[0].nom, 'le Dirigeant reste ancré')
  assert.equal(her.ville, p0.villes[0].nom, 'l Héritier reste ancré')
  assert.equal(dir.metier, C.p.metierDirigeant, 'titre conservé')
  assert.equal(her.metier, C.p.metierHeritierStr, 'titre conservé')
})

test('foyer complet : le départ emporte conjoint ET enfants non mariés ; enfant marié/ancré/soldat reste chez lui', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 1
  const p0 = state.players[0]
  const h1 = hab('cp1', 30, { ville: p0.villes[0].nom })
  const h2 = hab('cp2', 28, { ville: p0.villes[0].nom })
  h1.mariage = 'Pers-cp2 Test'; h1.mariageId = 'cp2'
  h2.mariage = 'Pers-cp1 Test'; h2.mariageId = 'cp1'
  // Enfants NON mariés du couple (un enfant, un adulte jeune : la
  //  majorité n'exclut pas — seul le MARIAGE fait foyer propre).
  const ef1 = hab('ef1', 10, { ville: p0.villes[0].nom }); ef1.mereId = 'cp2'; ef1.pereId = 'cp1'
  const ef2 = hab('ef2', 22, { ville: p0.villes[0].nom }); ef2.mereId = 'cp2'; ef2.pereId = 'cp1'
  // Enfant MARIÉ : foyer propre — il part avec SON conjoint, pas
  //  avec ses parents (aucune entrée « suit Pers-cp1/cp2 »).
  const ef3 = hab('ef3', 26, { ville: p0.villes[0].nom })
  const ef3c = hab('ef3c', 25, { ville: p0.villes[0].nom })
  ef3.mariage = 'Pers-ef3c Test'; ef3.mariageId = 'ef3c'; ef3.mereId = 'cp2'
  ef3c.mariage = 'Pers-ef3 Test'; ef3c.mariageId = 'ef3'
  // Enfant ancré (Héritier) et enfant soldat : ils RESTENT.
  const ef4 = hab('ef4', 15, { metier: C.p.metierHeritierStr, ville: p0.villes[0].nom }); ef4.mereId = 'cp2'
  const ef5 = hab('ef5', 19, { ville: p0.villes[0].nom, armee: 'Garde' }); ef5.mereId = 'cp2'
  state.population[p0.n] = [h1, h2, ef1, ef2, ef3, ef3c, ef4, ef5]
  migrationBonheur(state, makeRng(4242))
  // Le foyer ENTIER est transféré, à la même destination, couple intact.
  let dst1: { j: number; v: string } | undefined
  let dst2: { j: number; v: string } | undefined
  for (const [nStr, liste] of Object.entries(state.population)) {
    for (const c of liste ?? []) {
      if (c.id === 'cp1') dst1 = { j: Number(nStr), v: c.ville }
      if (c.id === 'cp2') dst2 = { j: Number(nStr), v: c.ville }
    }
  }
  let dstEf1: { j: number; v: string } | undefined
  let dstEf2: { j: number; v: string } | undefined
  let dstEf3: { j: number; v: string } | undefined
  let dstEf3c: { j: number; v: string } | undefined
  for (const [nStr, liste] of Object.entries(state.population)) {
    for (const c of liste ?? []) {
      if (c.id === 'ef1') dstEf1 = { j: Number(nStr), v: c.ville }
      if (c.id === 'ef2') dstEf2 = { j: Number(nStr), v: c.ville }
      if (c.id === 'ef3') dstEf3 = { j: Number(nStr), v: c.ville }
      if (c.id === 'ef3c') dstEf3c = { j: Number(nStr), v: c.ville }
    }
  }
  assert.ok(dst1 && dst2, 'les deux époux sont encore dans le monde')
  assert.ok(dst1!.j !== p0.n || dst1!.v !== p0.villes[0].nom, 'le foyer est parti à proba max 1')
  assert.ok(dst1!.j === dst2!.j && dst1!.v === dst2!.v, 'le couple part ENSEMBLE, à la même destination')
  assert.ok(dstEf1 && dstEf1.j === dst1!.j && dstEf1.v === dst1!.v, 'l enfant non marié ef1 SUIT le foyer (même destination)')
  assert.ok(dstEf2 && dstEf2.j === dst1!.j && dstEf2.v === dst1!.v, 'l enfant non marié (adulte) ef2 SUIT le foyer')
  assert.ok(state.population[p0.n].includes(ef4), 'l enfant Héritier (ancré) RESTE')
  assert.equal(ef4.ville, p0.villes[0].nom, 'l Héritier reste dans la ville')
  assert.ok(state.population[p0.n].includes(ef5), 'l enfant soldat (en armée) RESTE')
  assert.equal(ef5.ville, p0.villes[0].nom, 'le soldat reste dans la ville')
  // Enfant MARIÉ : foyer PROPRE — il part (proba 1) avec SON conjoint,
  //  à la destination de SON foyer, jamais emporté par celui des parents.
  assert.ok(dstEf3 && dstEf3c, 'l enfant marié et son conjoint sont encore dans le monde')
  assert.ok(dstEf3!.j === dstEf3c!.j && dstEf3!.v === dstEf3c!.v, 'l enfant marié part avec SON conjoint (foyer propre)')
  assert.ok(
    !state.log.some((e) => e.texte.includes('Pers-ef3 suit Pers-cp1') || e.texte.includes('Pers-ef3 suit Pers-cp2')),
    'l enfant marié n est jamais emporté par le foyer de ses parents',
  )
  assert.equal(h1.mariageId, 'cp2', 'le couple n est pas dissocié (mariageId)')
  assert.equal(h2.mariageId, 'cp1', 'le couple n est pas dissocié (mariageId)')
  // Aucun mariageId croisé entre porteurs : l'invariant du moteur
  //  (conjoints dans la même ville) tient après le flux.
  for (const [nStr, liste] of Object.entries(state.population)) {
    for (const c of liste ?? []) {
      if (!c.mariageId) continue
      const conj = (liste ?? []).find((x) => x.id === c.mariageId)
      assert.ok(conj, `le conjoint de ${c.id} vit chez le même porteur (${nStr})`)
    }
  }
  // Le conjoint qui suit est journalisé lui aussi.
  const logs = state.log.filter((e) => e.texte.includes('cherche meilleure vie') && (e.texte.includes('Pers-cp1') || e.texte.includes('Pers-cp2')))
  assert.equal(logs.length, 4, 'une entrée par membre du foyer parti (couple + 2 enfants non mariés)')
})

test('couples inséparables : conjoint ANCRÉ (Dirigeant/Héritier/en armée) → le foyer NE PART PAS', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 1
  const p0 = state.players[0]
  const dir = hab('d1', 40, { metier: C.p.metierDirigeant, ville: p0.villes[0].nom })
  const epouse = hab('e1', 38, { ville: p0.villes[0].nom })
  dir.mariage = 'Pers-e1 Test'; dir.mariageId = 'e1'
  epouse.mariage = 'Pers-d1 Test'; epouse.mariageId = 'd1'
  const soldat = hab('s1', 25, { ville: p0.villes[0].nom, armee: 'Garde' })
  const enfant = hab('k1', 9, { ville: p0.villes[0].nom }); enfant.mereId = 'd1'; enfant.pereId = 'd1'
  state.population[p0.n] = [dir, epouse, soldat, enfant]
  migrationBonheur(state, makeRng(9001))
  assert.ok(state.population[p0.n].includes(epouse), 'l épouse d un Dirigeant ne quitte pas son foyer (proba max 1)')
  assert.equal(epouse.ville, p0.villes[0].nom, 'elle reste dans la ville')
  assert.ok(state.population[p0.n].includes(soldat), 'un soldat en armée ne déménage pas')
  assert.equal(soldat.ville, p0.villes[0].nom, 'le soldat reste dans la ville')
  assert.ok(state.population[p0.n].includes(enfant), 'l enfant du foyer d un Dirigeant ne part pas non plus')
  assert.equal(enfant.ville, p0.villes[0].nom, 'l enfant reste dans la ville')
  assert.ok(!state.log.some((e) => e.texte.includes('Pers-e1') || e.texte.includes('Pers-s1') || e.texte.includes('Pers-k1')), 'aucun départ journalisé pour le foyer, le soldat ou l enfant')
})

test('flux : aux DÉFAUTS (0,10), une partie réelle voit des départs dès les premiers tours', () => {
  const { state, C } = partie(20261101)
  assert.equal(C.p.migrationBonheurMax, 0.10)
  assert.equal(C.p.migrationBonheurCulture, 0.25)
  assert.equal(C.p.migrationBonheurMemeJoueur, 0.5)
  assert.equal(C.p.migrationBonheurEmploi, 1)
  assert.equal(C.p.migrationBonheurLogement, 1)
  // au setup : villes sans bâtiments → bonheur d'emblée < 100
  const b0 = bonheurVilleComplete(state, state.players[0], state.players[0].villes[0], C)
  assert.ok(b0 < 100, `le bonheur initial est dégradé (${b0}/100) — le flux a prise`)
  for (let t = 0; t < 3; t++) migrationBonheur(state, makeRng(1000 + t))
  const logs = state.log.filter((e) => e.texte.includes('cherche meilleure vie'))
  assert.ok(logs.length > 0, 'au moins un départ en 3 tours aux défauts (graine fixe)')
})

// ── Facteurs emploi & logement (5e arbitrage, 2026-10-29) ──────────

/** Monde réduit déterministe (graine fixe) : 3 joueurs, 1 ville
 *  chacun. La ville de p1 est SATURÉE (60 adultes en poste > 44
 *  postes offerts ; 60 vivants > 58 lits), celle de p2 est LIBRE
 *  (vide : postes et lits disponibles), celle de p0 porte le
 *  migrant (bonheur 23/100 à cette graine → départ certain à
 *  proba max 10). */
function mondeReduit(state: GameState, migrant: Character): void {
  const [p0, p1, p2] = state.players
  state.players = [p0, p1, p2]
  state.population[p1.n] = Array.from({ length: 60 }, (_, i) =>
    hab(`sat${i}`, 30, { ville: p1.villes[0].nom, metier: 'Saturation' }))
  state.population[p2.n] = []
  state.population[p0.n] = [migrant]
}

test('bonus emploi & logement : purs, ADDITIFS — ne parlent que pour qui manque et là où c\'est libre', () => {
  const { C } = partie()
  assert.equal(C.p.migrationBonheurEmploi, 1, 'défaut verrouillé (v3, 6e retour : la ville pèse ×2)')
  assert.equal(C.p.migrationBonheurLogement, 1, 'défaut verrouillé (v3, 6e retour : la ville pèse ×2)')
  assert.equal(facteurEmploi(true, true, C), 1, 'sans métier × ville qui embauche = +1 (le ×1,5 du 5e retour est REMPLACÉ)')
  assert.equal(facteurEmploi(false, true, C), 0, 'migrant pourvu : le bonus emploi se tait')
  assert.equal(facteurEmploi(true, false, C), 0, 'ville sans poste libre : le bonus emploi se tait')
  assert.equal(facteurEmploi(false, false, C), 0)
  assert.equal(facteurLogement(true, true, C), 1, 'sans domicile × ville qui loge = +1')
  assert.equal(facteurLogement(false, true, C), 0, 'migrant logé : le bonus logement se tait')
  assert.equal(facteurLogement(true, false, C), 0, 'ville sans lit libre : le bonus logement se tait')
  assert.equal(facteurLogement(false, false, C), 0)
})

test('flux : un migrant SANS MÉTIER choisit la ville aux postes non pourvus', () => {
  const { state, C } = partie(20261029)
  C.p.migrationBonheurMax = 10 // départ certain (bonheur 23/100 au monde réduit)
  C.p.migrationBonheurEmploi = 1e9 // le facteur emploi écrase tous les autres
  const [p0, , p2] = state.players
  const mig = hab('chom', 30, { ville: p0.villes[0].nom }) // sans métier…
  mig.domicile = 'Chez-lui' // …mais logé : seul le facteur emploi parle
  mondeReduit(state, mig)
  migrationBonheur(state, makeRng(7))
  assert.ok(state.population[p2.n]?.includes(mig), 'le chômeur rejoint la ville qui embauche (p2)')
  assert.equal(mig.ville, p2.villes[0].nom, 'même destination, ville de p2')
})

test('flux : un migrant SANS DOMICILE choisit la ville aux lits libres', () => {
  const { state, C } = partie(20261029)
  C.p.migrationBonheurMax = 10
  C.p.migrationBonheurLogement = 1e9 // le facteur logement écrase tous les autres
  const [p0, , p2] = state.players
  const mig = hab('sdf', 30, { ville: p0.villes[0].nom, metier: 'Employé' }) // pourvu…
  // …mais sans domicile (champ absent = sans-logement) : seul le
  //  facteur logement parle.
  mondeReduit(state, mig)
  migrationBonheur(state, makeRng(8))
  assert.ok(state.population[p2.n]?.includes(mig), 'le sans-domicile rejoint la ville qui loge (p2)')
  assert.equal(mig.ville, p2.villes[0].nom, 'même destination, ville de p2')
})
