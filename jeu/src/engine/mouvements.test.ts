// ═══════════════════════════════════════════════════════════════════════════
//  TESTS RÉCAP DES ÉVOLUTIONS DE POPULATION PAR HABITATION (retour
//  Thibaut 2026-11-12 : « il est difficile de suivre les migrations —
//  ajoute un récapitulatif rapide des évolutions de population en haut
//  de la page des habitations : naissances, migrations, etc. »)
//
//   · PlayerRecap.mouvementsVille : compteur PAR VILLE (clé = nom de
//     l'habitation) des naissances, décès, arrivées et départs du
//     tour moteur — champ OPTIONNEL (vieilles sauvegardes : les
//     mutateurs le posent paresseusement, les vues lisent ?? {}) ;
//   · accumulation : naissances.ts (le nouveau-né naît dans la ville
//     de sa mère, fratrie comprise), sante.ts killCharacter (décès),
//     migrationBonheur.ts (chaque membre du foyer = UN départ sur la
//     ville quittée côté joueur SOURCE + UNE arrivée sur la ville de
//     destination côté joueur DESTINATAIRE ; migration interne = les
//     deux compteurs sur le même récap) ;
//   · journal : la ligne « Migrations — X arrivée(s), Y départ(s) »
//     du récap de fin de tour n'apparaît QUE s'il y a eu des
//     migrations.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf } from './gameData'
import { makeRng } from './rng'
import { emptyRecap, bumpMouvement, totauxMouvements } from './shared'
import { killCharacter } from './sante'
import { conceptionEtNaissances } from './naissances'
import { migrationBonheur } from './migrationBonheur'
import { writeRecap } from './journal'
import type { Character, GameState, PlayerRecap } from './types'

function partie(seed = 20261029): { state: GameState; C: ReturnType<typeof cfgOf> } {
  const state = createGame(defaultSetups(), seed, 'local')
  const C = cfgOf(state.config)
  // Neutralise le régime de chaque joueur (patron migrationBonheur.
  //  test.ts : les lois de régime modifieraient les tirages).
  for (const pl of state.players) pl.regime = 'Aucun régime (test mouvements)'
  return { state, C }
}

/** Habitant de test (tuple de 3 traits, cf. Character — jamais
 *  « Obstiné » pour les candidats au recrutement/éducation). */
function hab(id: string, age: number, o: { metier?: string | null; ville?: string; armee?: string | null } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Déisme', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Fécond', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: o.armee ?? null,
  }
}

// ── Primitives pures ────────────────────────────────────────────────

test('emptyRecap porte mouvementsVille vide ; bumpMouvement pose la fiche paresseusement, ville vide ignorée', () => {
  const r = emptyRecap()
  assert.deepEqual(r.mouvementsVille, {}, 'le récap neuf porte un dictionnaire vide')
  bumpMouvement(r, 'Bergen', 'arrivees')
  bumpMouvement(r, 'Bergen', 'arrivees')
  bumpMouvement(r, 'Bergen', 'deces')
  bumpMouvement(r, 'Oslo', 'departs')
  assert.deepEqual(r.mouvementsVille, {
    Bergen: { naissances: 0, deces: 1, arrivees: 2, departs: 0 },
    Oslo: { naissances: 0, deces: 0, arrivees: 0, departs: 1 },
  }, 'fiches posées paresseusement, compteurs exacts')
  bumpMouvement(r, '', 'naissances')
  assert.ok(!r.mouvementsVille[''], 'ville vide ignorée (personnage sans ville)')
  // Compatibilité vieilles sauvegardes : récap SANS le champ (posé
  //  undefined comme un état chargé d'une sauvegarde antérieure).
  const vieux = { ...emptyRecap(), mouvementsVille: undefined } as PlayerRecap
  assert.deepEqual(totauxMouvements(vieux), { naissances: 0, deces: 0, arrivees: 0, departs: 0 },
    'totauxMouvements repli à zéro sur un récap sans le champ')
  assert.deepEqual(totauxMouvements(r), { naissances: 0, deces: 1, arrivees: 2, departs: 1 })
})

// ── Décès ───────────────────────────────────────────────────────────

test('décès : killCharacter crédite le décès sur la ville du défunt', () => {
  const { state } = partie()
  const p = state.players[0]
  const c = (state.population[p.n] ?? [])[0]
  assert.ok(c, 'pré-condition : un habitant au setup')
  const recap = emptyRecap()
  killCharacter(state, p, c, 'maladie', recap)
  assert.equal(recap.mouvementsVille?.[c.ville]?.deces, 1,
    'le compteur décès de la ville du défunt passe à 1')
  assert.equal(totauxMouvements(recap).deces, 1)
})

// ── Naissances ──────────────────────────────────────────────────────

test('naissances : l\'accouchement crédite la ville de la mère (fratrie de 2 comprise)', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes[0].nom
  const mere = hab('mere-1', 26, { ville })
  mere.sexe = 'F'
  mere.statut = 'Enceinte'
  state.population[p.n] = [mere]
  // TOUTE grossesse accouche une fratrie de 2 (jumeaux certains).
  C.p.fertTwinsRate = 1
  C.p.fertTripletsRate = 0
  const recap = emptyRecap()
  conceptionEtNaissances(state, p, makeRng(20261112), recap)
  assert.equal(recap.mouvementsVille?.[ville]?.naissances, 2,
    'les 2 jumeaux naissent dans la ville de leur mère')
  const bebes = (state.population[p.n] ?? []).filter((x) => x.age === 0)
  assert.equal(bebes.length, 2, 'pré-condition de contrôle : 2 nouveau-nés')
  assert.ok(bebes.every((b) => b.ville === ville), 'les nouveau-nés vivent dans la ville de la mère')
})

// ── Migrations ───────────────────────────────────────────────────────

test('migration : départ côté joueur source, arrivée côté joueur destinataire', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 10 // départ certain (bonheur 23/100, patron mondeReduit)
  C.p.migrationBonheurLogement = 1e9 // le migrant sans domicile rejoint la ville aux lits libres
  const [p0, p1, p2] = state.players
  const mig = hab('mig-1', 30, { ville: p0.villes[0].nom, metier: 'Employé' })
  state.players = [p0, p1, p2]
  // La ville de p1 est SATURÉE (60 en poste > postes offerts, 60 > lits)
  //  et ses habitants ANCRÉS en armée (ils ne partent jamais : le test
  //  isole le mouvement du seul migrant) ; p2 est vide et loge.
  state.population[p1.n] = Array.from({ length: 60 }, (_, i) =>
    hab(`sat${i}`, 30, { ville: p1.villes[0].nom, metier: 'Saturation', armee: 'Armée-test' }))
  state.population[p2.n] = []
  state.population[p0.n] = [mig]
  migrationBonheur(state, makeRng(7))
  assert.equal(mig.ville, p2.villes[0].nom, 'pré-condition : le migrant a rejoint p2')
  assert.equal(p0.recap?.mouvementsVille?.[p0.villes[0].nom]?.departs, 1,
    'UN départ au récap du joueur SOURCE, sur la ville quittée')
  assert.equal(p2.recap?.mouvementsVille?.[p2.villes[0].nom]?.arrivees, 1,
    'UNE arrivée au récap du joueur DESTINATAIRE, sur la ville de destination')
  assert.equal(totauxMouvements(p0.recap ?? emptyRecap()).arrivees, 0,
    'le joueur source ne compte aucune arrivée')
})

test('migration : FOYER COMPLET — chaque membre compte (départs ET arrivées)', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 10
  C.p.migrationBonheurLogement = 1e9
  const [p0, p1, p2] = state.players
  const chef = hab('foyer-a', 30, { ville: p0.villes[0].nom, metier: 'Employé' })
  const conj = hab('foyer-b', 28, { ville: p0.villes[0].nom })
  const enfant = hab('foyer-c', 8, { ville: p0.villes[0].nom })
  conj.sexe = 'F'
  chef.mariageId = conj.id
  conj.mariageId = chef.id
  enfant.mereId = conj.id
  enfant.pereId = chef.id
  state.players = [p0, p1, p2]
  state.population[p1.n] = Array.from({ length: 60 }, (_, i) =>
    hab(`sat${i}`, 30, { ville: p1.villes[0].nom, metier: 'Saturation', armee: 'Armée-test' }))
  state.population[p2.n] = []
  state.population[p0.n] = [chef, conj, enfant]
  migrationBonheur(state, makeRng(7))
  assert.equal(enfant.ville, p2.villes[0].nom, 'pré-condition : le foyer entier est parti')
  assert.equal(p0.recap?.mouvementsVille?.[p0.villes[0].nom]?.departs, 3,
    'TROIS départs au récap du joueur source (chef + conjoint + enfant)')
  assert.equal(p2.recap?.mouvementsVille?.[p2.villes[0].nom]?.arrivees, 3,
    'TROIS arrivées au récap du joueur destinataire')
})

test('migration INTERNE : départ et arrivée sur le même récap, villes distinctes', () => {
  const { state, C } = partie()
  C.p.migrationBonheurMax = 10
  C.p.migrationBonheurEmploi = 1e9 // le chômeur rejoint la ville aux postes non pourvus
  const p0 = state.players[0]
  const villeA = p0.villes[0].nom
  const villeB = { ...p0.villes[0], nom: 'Ville B interne', batiments: [], amenagements: [], autres: [] }
  p0.villes.push(villeB)
  const mig = hab('mig-int', 30, { ville: villeA }) // sans métier…
  mig.domicile = 'Chez-lui' // …mais logé : seul le facteur emploi parle
  // Isolation : les AUTRES joueurs n'ont plus d'habitants (aucune
  //  arrivée parasite au récap de p0 — leurs villes restent des
  //  candidates de poids négligeable devant le bonus 1e9).
  for (const pl of state.players.slice(1)) state.population[pl.n] = []
  state.population[p0.n] = [mig]
  migrationBonheur(state, makeRng(7))
  assert.equal(mig.ville, villeB.nom, 'pré-condition : déménagement interne vers la ville B')
  const mouv = p0.recap?.mouvementsVille ?? {}
  assert.equal(mouv[villeA]?.departs, 1, 'départ compté sur la ville quittée')
  assert.equal(mouv[villeB.nom]?.arrivees, 1, 'arrivée comptée sur la ville de destination')
  assert.equal(mouv[villeA]?.arrivees ?? 0, 0, 'pas d\'arrivée sur la ville quittée')
  const tot = totauxMouvements(p0.recap ?? emptyRecap())
  assert.deepEqual({ arrivees: tot.arrivees, departs: tot.departs }, { arrivees: 1, departs: 1 },
    'migration interne : 1 départ ET 1 arrivée pour le même joueur')
})

// ── Journal ──────────────────────────────────────────────────────────

test('journal : la ligne Migrations du récap ne paraît que s\'il y a eu des migrations', () => {
  const { state } = partie()
  const p = state.players[0]
  // Sans mouvement : pas de ligne « Migrations ».
  const nbAvant = state.log.length
  writeRecap(state, p, emptyRecap())
  const rec1 = state.log[state.log.length - 1]
  assert.ok(rec1.texte.includes('Récap'), 'pré-condition : récap journalisé')
  assert.ok(!rec1.texte.includes('Migrations'), 'aucune ligne Migrations sans migration')
  assert.equal(state.log.length, nbAvant + 1, 'une seule entrée (pas de ligne en plus)')
  // Avec mouvement : la ligne porte les totaux.
  const recap = emptyRecap()
  bumpMouvement(recap, p.villes[0].nom, 'arrivees')
  bumpMouvement(recap, p.villes[0].nom, 'arrivees')
  bumpMouvement(recap, p.villes[0].nom, 'departs')
  writeRecap(state, p, recap)
  const rec2 = state.log[state.log.length - 1]
  assert.ok(rec2.texte.includes('Migrations — 2 arrivée(s), 1 départ(s)'),
    `la ligne Migrations porte les totaux (${rec2.texte})`)
})
