// ═══════════════════════════════════════════════════════════════════════════
//  TESTS MÉTIERS — caps par ville et réaffectation (rework habitants,
//  vagues 1 + 3a + 3b, 2026-10-20/21/22)
//
//  Arbitrages actés :
//   · vague 3b (rangs & bâtiments tier 1, 2026-10-22) : caps
//     CUMULATIVES — cap d'un métier = BASE DU RANG d'habitation
//     (colonne « Métiers disponibles », ex. Hameau : 50 Chasseurs,
//     2 Gardes, 1 Commerçant, 1 Gouverneur) + EMPLACEMENTS des
//     bâtiments ET aménagements ; les paramètres capMetierChasseur*
//     sont supprimés ;
//   · Garde/Commerçant/Gouverneur : plafonnés par la base du rang ;
//     Banquier/Troubadour/Professeur/cour/armée : règles propres,
//     non plafonnés par ce canal ; la réaffectation automatique
//     n'attribue JAMAIS les postes nobles ni les métiers à
//     attribution Armée/Succession/Ville ;
//   · surnombre : les PLUS ÂGÉS perdent leur métier (Sans-emploi) ;
//   · places libres (arbitrage Thibaut 2026-10-22) : ordre « n'importe
//     quel métier → Chasseur → sans métier » ; les Sans-emploi ADULTES
//     prennent un poste, les plus âgés d'abord, en priorisant un métier
//     AUTRE que Chasseur (ordre du référentiel) — jamais les enfants ;
//     les CHASSEURS changent de métier dès qu'un poste AUTRE est
//     disponible (le Chasseur n'est jamais qu'un poste de repli) ;
//   · vague 3c (2026-10-22) : AMÉLIORATIONS d'aménagements — tiers 2
//     (« 15 Or + 3 Pierre », remplace le tier 1) et 3 (« 35 Or +
//     3 Fer », remplace le tier 2), rang d'habitation minimum 2/3 ;
//     le tier inférieur remplacé ne compte PLUS ses emplacements ;
//   · Sans-emploi = rôle NEUTRE : impôt nul, aucun effet ;
//   · Fermier : production d'ÉTÉ seulement (champ ete du référentiel) ;
//   · taxes : bonus ADDITIFS (Gouverneur +10 % toutes, Banquier +10 %
//     Or, Professeur +10 % Science, Troubadour +10 % Tourisme) ;
//   · Garde : +garnisonParGarde Garnison STATIQUE (valeur d'état) ;
//   · la réaffectation tourne avant le calcul des gains (étape 2ter).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, City, GameState } from './types'
import { cfgOf } from './gameData'
import { capMetierVille, reaffecterMetiers, occupationsMetierVille } from './metiers'
import { invaliderIndexPopulation } from './indexPopulation'
import { detailGainsVille, multProdRang, consoNourrHabitant } from './economie'
import * as habitationsMod from './habitations'
import { garnisonHabitationVille, detailGarnisonVille } from './regimes'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

/** Personnage de test complet (tous les champs obligatoires). */
function perso(id: string, age: number, o: { metier?: string | null; statut?: Character['statut']; ville?: string } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Déisme', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Stérile', 'Fécond'], statut: o.statut ?? 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
  }
}

function partie(): GameState {
  return createGame(SETUP, 20261020, 'local')
}

test('capMetierVille (vague 3a) : Chasseur = cap défaut + emplacements ; métiers productifs = emplacements ; rôles propres illimités', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const ville: City = { ...p.villes[0] }
  ville.type = 'Ville'
  ville.amenagements = []
  assert.equal(capMetierVille(C.p.metierChasseur, ville, C), 50, 'cap de BASE du rang Hameau : 50 Chasseurs')
  ville.type = 'Château'
  ville.rang = 'Motte'
  assert.equal(capMetierVille(C.p.metierChasseur, ville, C), 40, 'cap de BASE du rang Motte : 40 Chasseurs')
  ville.rang = 'Donjon'
  assert.equal(capMetierVille(C.p.metierChasseur, ville, C), 20, 'cap de BASE du rang Donjon : 20 Chasseurs')
  // vague 3a : une Scierie ajoute 2 emplacements de Chasseur et 2 de Bûcheron
  const scierie: City = { ...p.villes[0], type: 'Ville', amenagements: ['Scierie'] }
  assert.equal(capMetierVille(C.p.metierChasseur, scierie, C), 52, 'Chasseur : cap défaut 50 + 2 emplacements de la Scierie')
  assert.equal(capMetierVille('Bûcheron', scierie, C), 2, 'Bûcheron : 2 emplacements (Scierie)')
  assert.equal(capMetierVille('Bûcheron', ville, C), 0, 'métier productif sans aménagement : cap 0')
  // Marchand RETIRÉ du jeu le 2026-10-24 (arbitrage Thibaut) : titre
  //  mort → cap ∞ (plus plafonné) ; la Mine d'Or est gardée SANS
  //  effet (plus d'emplacement de Marchand).
  assert.equal(capMetierVille('Marchand', ville, C), Number.POSITIVE_INFINITY,
    'Marchand retiré du jeu : titre mort, cap ∞ (plus plafonné)')
  const mineOr: City = { ...p.villes[0], type: 'Ville', amenagements: ["Mine d'Or"] }
  assert.equal(capMetierVille('Marchand', mineOr, C), Number.POSITIVE_INFINITY,
    "Mine d'Or gardée sans effet : plus d'emplacement de Marchand (arbitrage Thibaut 2026-10-24)")
  // Fermier (ete) : plafonné comme les productifs — Champ 3, Rizière 4
  const champ: City = { ...p.villes[0], type: 'Ville', amenagements: ['Champ'] }
  assert.equal(capMetierVille('Fermier', champ, C), 3, 'Champ : 3 emplacements de Fermier')
  // retour au rang Hameau pour les assertions suivantes (ville a été
  //  mutée en Château/Donjon ci-dessus)
  ville.type = 'Ville'
  ville.rang = 'Hameau'
  // vague 3b : Garde/Commerçant/Gouverneur plafonnés par la base du rang
  assert.equal(capMetierVille('Garde', ville, C), 2, 'Garde : plafonné par la base du rang Hameau (2)')
  assert.equal(capMetierVille('Commerçant', ville, C), 1, 'Commerçant : plafonné par la base du rang Hameau (1)')
  assert.equal(capMetierVille('Gouverneur', ville, C), 1, 'Gouverneur : plafonné par la base du rang Hameau (1), jamais auto-attribué')
  assert.equal(capMetierVille('Banquier', ville, C), Number.POSITIVE_INFINITY)
  assert.equal(capMetierVille('Troubadour', ville, C), Number.POSITIVE_INFINITY)
  assert.equal(capMetierVille('Dirigeant', ville, C), Number.POSITIVE_INFINITY, 'cour : règles propres (succession)')
  assert.equal(capMetierVille('Soldat', ville, C), Number.POSITIVE_INFINITY, 'armée : engagement militaire')
  // l'absence de métier n'est jamais plafonnée
  assert.equal(capMetierVille(null, ville, C), Number.POSITIVE_INFINITY)
})

test('capMetierVille + ctx routes (sous-vague 3b 2026-10-24) : la copie ouvre les emplacements du métier copié à l ORIGINE, vieilles routes ignorées, plus d emplacement de Marchand', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const ville: City = { ...p.villes[0], type: 'Ville', amenagements: [] }
  assert.equal(capMetierVille('Bûcheron', ville, C), 0, 'sans ctx : cap inchangée (appelants sans routes)')
  state.routesCommerce = [
    // sortante (p à l'origine) avec une copie de Scierie (2 Bûcheron)
    { id: 'r-out', joueur: p.n, villeOrigine: 'Capitale', joueurCible: 1, citeCible: null, villeCible: 'Ailleurs', amenagement: 'Scierie' },
    // entrante (p ciblé par le joueur 1) — n'ouvre PLUS rien côté
    //  cible depuis le retrait du métier de Marchand (2026-10-24)
    { id: 'r-in', joueur: 1, villeOrigine: 'Loin', joueurCible: p.n, citeCible: null, villeCible: 'Capitale', amenagement: null },
  ]
  const ctx = { state, joueur: p.n }
  assert.equal(capMetierVille('Bûcheron', ville, C, ctx), 2, 'la copie de la Scierie ouvre SES emplacements dans la ville d origine (2 Bûcheron)')
  assert.equal(capMetierVille('Marchand', ville, C, ctx), Number.POSITIVE_INFINITY,
    "plus d'emplacement de Marchand par route (sortante ou entrante) : métier retiré du jeu le 2026-10-24 — titre mort, cap ∞")
  // vieilles routes du modèle « marchand titulaire » (marchandId) : ignorées
  state.routesCommerce.push({
    id: 'r-old', joueur: p.n, villeOrigine: 'Capitale', joueurCible: 1,
    citeCible: null, villeCible: 'Ailleurs', amenagement: 'Scierie', marchandId: 'm-x',
  } as import('./types').RouteCommerce)
  assert.equal(capMetierVille('Bûcheron', ville, C, ctx), 2, 'la vieille route marchandId ne compte pas (purge au prochain fin de tour)')
  // une autre ville ne compte PAS les routes d'ailleurs
  const autre: City = { ...ville, nom: 'Periphery' }
  assert.equal(capMetierVille('Bûcheron', autre, C, ctx), 0, 'les routes ne comptent que pour leur ville d origine')
})

test('reaffecterMetiers : surnombre — les plus âgés perdent leur métier, les décédés ne comptent pas', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  C.config.typesHabitation[0].metiersBase = [{ metier: 'Chasseur', places: 2 }] // rang Hameau : cap de test (vague 3b)
  state.population[p.n] = [
    perso('c-50', 50, { metier: C.p.metierChasseur }),
    perso('c-40', 40, { metier: C.p.metierChasseur }),
    perso('c-30', 30, { metier: C.p.metierChasseur }),
    perso('c-20', 20, { metier: C.p.metierChasseur }),
    // décédé : ne compte ni dans le cap ni dans les perdants
    perso('c-90', 90, { metier: C.p.metierChasseur, statut: 'Décédé' }),
  ]
  invaliderIndexPopulation()
  reaffecterMetiers(state, C)
  const pop = state.population[p.n]
  const parId = new Map(pop.map((c) => [c.id, c]))
  assert.equal(parId.get('c-50')!.metier, null, 'le plus âgé vivant perd son métier')
  assert.equal(parId.get('c-40')!.metier, null, 'le 2e plus âgé vivant perd son métier')
  assert.equal(parId.get('c-30')!.metier, C.p.metierChasseur, 'les plus jeunes gardent le métier')
  assert.equal(parId.get('c-20')!.metier, C.p.metierChasseur)
  assert.equal(parId.get('c-90')!.metier, C.p.metierChasseur, 'le décédé n est pas décoiffé')
  assert.ok(state.log.some((l) => l.type === 'Métier' && l.texte.includes('sans emploi')),
    'un log Métier raconte le passage sans emploi')
})

test('reaffecterMetiers : places libres — adultes sans emploi deviennent Chasseurs, les plus âgés d\'abord, jamais les enfants', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  C.config.typesHabitation[0].metiersBase = [{ metier: 'Chasseur', places: 3 }] // rang Hameau : 2 chasseurs en place → 1 place libre (vague 3b)
  state.population[p.n] = [
    perso('c-1', 30, { metier: C.p.metierChasseur }),
    perso('c-2', 28, { metier: C.p.metierChasseur }),
    perso('s-40', 40),
    perso('s-22', 22),
    perso('s-8', 8), // enfant : jamais
  ]
  invaliderIndexPopulation()
  reaffecterMetiers(state, C)
  const parId = new Map(state.population[p.n].map((c) => [c.id, c]))
  assert.equal(parId.get('s-40')!.metier, C.p.metierChasseur, 'le sans-emploi le plus âgé est pris d abord')
  assert.equal(parId.get('s-22')!.metier, null, 'la place unique est déjà prise')
  assert.equal(parId.get('s-8')!.metier, null, 'un enfant ne devient jamais Chasseur')
})

test('reaffecterMetiers : cap Château indépendante de la cap Ville', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  p.villes[0].type = 'Château'
  p.villes[0].rang = 'Motte'
  // vague 3b : la cap vient du rang Motte (base) — plus de caps Ville/Château séparées
  C.config.typesHabitation.find((d) => d.type === 'Château')!.metiersBase = [{ metier: 'Chasseur', places: 1 }]
  state.population[p.n] = [
    perso('ch-60', 60, { metier: C.p.metierChasseur }),
    perso('ch-30', 30, { metier: C.p.metierChasseur }),
  ]
  invaliderIndexPopulation()
  reaffecterMetiers(state, C)
  const parId = new Map(state.population[p.n].map((c) => [c.id, c]))
  assert.equal(parId.get('ch-60')!.metier, null, 'surnombre au Château : le plus âgé sort')
  assert.equal(parId.get('ch-30')!.metier, C.p.metierChasseur)
})

test('Sans-emploi : rôle NEUTRE — aucun gain, aucun impôt (canal métiers vide)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  state.population[p.n] = [perso('s-30', 30), perso('s-20', 20)]
  invaliderIndexPopulation()
  const ville = p.villes[0]
  const d = detailGainsVille(state, p, ville, C)
  assert.equal(Object.keys(d.metiers).length, 0, 'aucune production brute (canal metiers vide)')
  assert.equal(Object.keys(d.taxes).length, 0, 'aucun impôt (canal taxes vide)')
  assert.equal(d.habitants, 2)
})

// ── Vague 2 UI : helper « métiers et places par ville » ──────────────────

test('occupationsMetierVille (vague 3a) : emplacements par aménagement, métiers productifs toujours listés, Sans-emploi en dernière ligne', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const habitants = [
    perso('o1', 30, { metier: C.p.metierChasseur }),
    perso('o2', 40, { metier: C.p.metierChasseur }),
    perso('o3', 50, { metier: C.p.metierChasseur }),
    perso('m1', 35, { metier: 'Fermier' }),
    perso('s1', 20, {}),
    perso('s2', 25, {}),
    perso('d1', 80, { metier: 'Fermier', statut: 'Décédé' }),
  ]
  const ville: City = { ...p.villes[0], type: 'Ville', amenagements: [] }
  const lignes = occupationsMetierVille(habitants, ville, C)
  const chasseur = lignes.find((l) => l.metier === C.p.metierChasseur)
  assert.ok(chasseur, 'Chasseur listé (plafonné → toujours affiché, même à 0)')
  assert.equal(chasseur!.enPoste, 3, '3 Chasseurs en poste')
  assert.equal(chasseur!.cap, 50, 'cap Ville 50 (aucun emplacement Chasseur ici)')
  // (l'ex-Marchand de ce test est remplacé par un Fermier le
  //  2026-10-24 : le métier de Marchand est retiré du jeu — le
  //  Fermier occupe la même niche de métier productif plafonné par
  //  ses aménagements, ici cap 0 sans Champ/Rizière)
  const fermierOcc = lignes.find((l) => l.metier === 'Fermier')
  assert.ok(fermierOcc, 'Fermier listé (occupé)')
  assert.equal(fermierOcc!.enPoste, 1, 'le Fermier décédé ne compte pas')
  assert.equal(fermierOcc!.cap, 0, 'cap finie 0 sans Champ/Rizière — l occupé reste listé')
  // vague 3a : chaque métier productif a une cap FINIE (0 sans
  //  aménagement) et apparaît donc dans la liste — l'écran « Métiers
  //  et places » montre TOUTES les caps d'emplacement.
  const bucheron = lignes.find((l) => l.metier === 'Bûcheron')
  assert.ok(bucheron, 'Bûcheron listé même sans occupant (cap finie 0 sans Scierie)')
  assert.equal(bucheron!.cap, 0)
  const fermier = lignes.find((l) => l.metier === 'Fermier')
  assert.ok(fermier && fermier.cap === 0, 'Fermier listé (cap 0 sans Champ/Rizière)')
  // les rôles non plafonnés et inoccupés n'apparaissent pas
  assert.equal(lignes.filter((l) => l.metier === 'Dirigeant').length, 0, 'Dirigeant non listé (illimité, inoccupé)')
  // vague 3b : la Garde est plafonnée par la base du rang Hameau (2) → listée même inoccupée
  const garde = lignes.find((l) => l.metier === 'Garde')
  assert.ok(garde, 'Garde listé (cap finie = base du rang)')
  assert.equal(garde!.cap, 2, 'Garde : base du rang Hameau (2)')
  const sans = lignes.find((l) => l.metier === null)
  assert.ok(sans, 'ligne Sans-emploi toujours présente')
  assert.equal(sans!.enPoste, 2, '2 sans-emploi vivants')
  assert.equal(lignes[lignes.length - 1].metier, null, 'Sans-emploi en dernière ligne')
  // Château (rang Motte, vague 3b) : cap de base 40 Chasseurs
  const chateau: City = { ...p.villes[0], type: 'Château', rang: 'Motte', amenagements: ["Mine d'Or"] }
  const lch = occupationsMetierVille(habitants, chateau, C).find((l) => l.metier === C.p.metierChasseur)
  assert.equal(lch!.cap, 40, 'cap de base du rang Motte : 40 Chasseurs')
  // ville = null (cité libre) : aucune cap, métier à 0 occupant non listé
  const cite = occupationsMetierVille([], null, C)
  assert.ok(cite.every((l) => !Number.isFinite(l.cap)), 'cité libre : caps toutes infinies')
  assert.equal(cite.length, 1, 'seule la ligne Sans-emploi (aucun occupant, aucune cap finie)')
  assert.ok(cite[0].metier === null && cite[0].enPoste === 0, 'Sans-emploi 0 en poste')
})

test('occupationsMetierVille : métiers hors référentiel conservés (anciennes sauvegardes)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const lignes = occupationsMetierVille([perso('p1', 30, { metier: 'Vieux métier' })], null, C)
  const vieux = lignes.find((l) => l.metier === 'Vieux métier')
  assert.ok(vieux, 'métier personnalisé hors référentiel conservé')
  assert.equal(vieux!.enPoste, 1)
  assert.equal(vieux!.cap, Number.POSITIVE_INFINITY, 'hors référentiel = illimité')
})

// ── Vague 3a : emplacements, priorisation, été, taxes, garnison ──────────

test('reaffecterMetiers (vague 3a) : priorisation — un sans-emploi prend un poste AUTRE que Chasseur d\'abord', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  p.villes[0].amenagements = ['Bâteau de pêche']
  C.config.typesHabitation[0].metiersBase = [{ metier: 'Chasseur', places: 1 }] // rang Hameau (vague 3b)
  state.population[p.n] = [
    perso('s-40', 40),
    perso('s-30', 30),
    perso('s-22', 22),
    perso('s-21', 21),
  ]
  invaliderIndexPopulation()
  reaffecterMetiers(state, C)
  const parId = new Map(state.population[p.n].map((c) => [c.id, c]))
  assert.equal(parId.get('s-40')!.metier, 'Pêcheur', 'priorisation : les 2 emplacements de Pêcheur (Bâteau de pêche) sont pris avant le Chasseur')
  assert.equal(parId.get('s-30')!.metier, 'Pêcheur')
  assert.equal(parId.get('s-22')!.metier, C.p.metierChasseur, 'ensuite la cap Chasseur (1)')
  assert.equal(parId.get('s-21')!.metier, null, 'plus de place : reste sans emploi')
  assert.ok(state.log.some((l) => l.type === 'Métier' && l.texte.includes('pêcheur')),
    'le log agrégé raconte les postes pris')
})

test('Fermier (vague 3a) : +5 Nourriture en ÉTÉ seulement (champ ete du référentiel)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  state.population[p.n] = [
    perso('f-30', 30, { metier: 'Fermier' }),
    perso('c-20', 20, { metier: C.p.metierChasseur }),
  ]
  invaliderIndexPopulation()
  const ville = p.villes[0]
  state.saison = 'Été'
  const dete = detailGainsVille(state, p, ville, C)
  assert.ok(Math.abs(dete.metiers['Nourriture'] - (5 + 1.5)) < 1e-9, 'été : Fermier +5 et Chasseur +1,5 Nourriture')
  state.saison = 'Hiver'
  const dhiver = detailGainsVille(state, p, ville, C)
  assert.ok(Math.abs(dhiver.metiers['Nourriture'] - 1.5) < 1e-9, 'hors été : le Fermier ne produit rien, le Chasseur reste')
})

test('Taxes (vague 3a) : bonus ADDITIFS — Gouverneur +10 % toutes ressources, Banquier +10 % Or, cumul = +20 %', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const ville = p.villes[0]
  state.population[p.n] = [
    perso('t-com', 30, { metier: 'Commerçant' }),
    perso('t-sci', 40, { metier: 'Scientifique' }),
  ]
  invaliderIndexPopulation()
  const base = detailGainsVille(state, p, ville, C)
  assert.ok(base.taxes['Or'] !== undefined && base.taxes['Science'] !== undefined)
  assert.equal(Object.keys(base.bonusTaxes).length, 0, 'aucun bonus sans titulaire')
  // + un Gouverneur : +10 % sur TOUTES les ressources produites
  state.population[p.n].push(perso('t-gouv', 50, { metier: C.p.metierGouverneur }))
  invaliderIndexPopulation()
  const gouv = detailGainsVille(state, p, ville, C)
  assert.ok(Math.abs(gouv.bonusTaxes['Or'] - 0.1) < 1e-9, 'Gouverneur : +10 % Or')
  assert.ok(Math.abs(gouv.bonusTaxes['Science'] - 0.1) < 1e-9, 'Gouverneur : +10 % Science')
  assert.ok(Math.abs(gouv.taxes['Or'] - base.taxes['Or'] * 1.1) < 1e-9, 'la taxe d Or augmente de 10 %')
  // + un Banquier : cumul ADDITIF → +20 % sur l'Or, +10 % sur la Science
  state.population[p.n].push(perso('t-banq', 45, { metier: 'Banquier' }))
  invaliderIndexPopulation()
  const lesDeux = detailGainsVille(state, p, ville, C)
  assert.ok(Math.abs(lesDeux.bonusTaxes['Or'] - 0.2) < 1e-9, 'Gouverneur + Banquier : +20 % Or (additif)')
  assert.ok(Math.abs(lesDeux.bonusTaxes['Science'] - 0.1) < 1e-9, 'le Banquier ne touche pas à la Science')
  assert.ok(Math.abs(lesDeux.taxes['Or'] - base.taxes['Or'] * 1.2) < 1e-9)
  // un Troubadour sans production de Tourisme dans la ville → pas de clé
  state.population[p.n].push(perso('t-trou', 35, { metier: 'Troubadour' }))
  invaliderIndexPopulation()
  const avecTrouv = detailGainsVille(state, p, ville, C)
  assert.equal(avecTrouv.bonusTaxes['Tourisme'], undefined, 'aucun bonus sur une ressource non produite')
})

test('RANG SOCIAL (arbitrage Thibaut 2026-10-26) : bourgeois 2 Nourriture + production ×1,5 — noble 4 Nourriture + production ×1,5 — roturier base ×1', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const ville = p.villes[0]
  // 3 villageois de MÊME métier (Bûcheron, toute saison), de rangs
  //  différents — le rang est DÉRIVÉ DU PRESTIGE, pas de la qualité
  //  du métier (réponse au constat « aucune différence réelle entre
  //  roturier et bourgeois »).
  const rotu = perso('r-30', 30, { metier: 'Bûcheron' })
  const bourg = perso('b-30', 30, { metier: 'Bûcheron' })
  const noble = perso('n-30', 30, { metier: 'Bûcheron' })
  rotu.prestige = 50   // roturier  (< 100)
  bourg.prestige = 150 // bourgeois (100-250)
  noble.prestige = 300 // noble     (250+)
  // helpers directs
  assert.equal(multProdRang(rotu, C), 1, 'roturier : ×1')
  assert.equal(multProdRang(bourg, C), C.p.prodMultBourgeois, 'bourgeois : ×1,5')
  assert.equal(multProdRang(noble, C), C.p.prodMultNoble, 'noble : ×1,5')
  assert.equal(consoNourrHabitant(rotu, C), C.p.consoNourrParHab, 'roturier : conso base')
  assert.equal(consoNourrHabitant(bourg, C), C.p.consoNourrBourgeois, 'bourgeois : 2 Nourriture')
  assert.equal(consoNourrHabitant(noble, C), C.p.consoNourrNoble, 'noble : 4 Nourriture')
  // production brute : un bûcheron bourgeois produit ×1,5, un noble ×1,5
  for (const [cible, mult] of [[bourg, C.p.prodMultBourgeois], [noble, C.p.prodMultNoble]] as const) {
    state.population[p.n] = [rotu]
    invaliderIndexPopulation()
    const base = detailGainsVille(state, p, ville, C)
    state.population[p.n] = [cible]
    invaliderIndexPopulation()
    const d = detailGainsVille(state, p, ville, C)
    for (const [res, v] of Object.entries(base.metiers)) {
      assert.ok(Math.abs(d.metiers[res] - v * mult) < 1e-9,
        `${cible.prenom} : production ${res} ×${mult} (reçue ${d.metiers[res]}, base ${v})`)
    }
    assert.ok(Math.abs(d.taxes['Bois'] - base.taxes['Bois'] * mult) < 1e-9,
      'le gain amplifié passe bien PAR les taxes (×1,5 avant, taxe ensuite)')
  }
  // consommation par rang : 1 + 2 + 4 = 7 pour les trois ensemble
  state.population[p.n] = [rotu, bourg, noble]
  invaliderIndexPopulation()
  const d3 = detailGainsVille(state, p, ville, C)
  assert.ok(Math.abs(d3.conso['Nourriture'] + 7) < 1e-9,
    `conso des trois rangs = 7 Nourriture (reçue ${d3.conso['Nourriture']})`)
  // un MINEUR (prestige 0, sans métier) reste à la consommation de base
  state.population[p.n].push(perso('e-8', 8, { metier: null }))
  invaliderIndexPopulation()
  const d4 = detailGainsVille(state, p, ville, C)
  assert.ok(Math.abs(d4.conso['Nourriture'] + 7 + C.p.consoNourrParHab) < 1e-9,
    'un mineur (sans prestige propre) consomme la base, pas le rang de ses parents')
  assert.ok(Math.abs(d4.metiers['Bois'] - d3.metiers['Bois']) < 1e-9,
    'un mineur ne produit rien : la production est inchangée')
})

test('reaffecterMetiers (2026-10-24) : le métier de Marchand RETIRÉ du jeu — ses porteurs perdent le titre, puis reprennent un poste aux places libres', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  // Deux porteurs du titre Marchand dans une partie en cours (le
  //  métier n'est plus dans le référentiel — arbitrage Thibaut
  //  « supprime carrément le métier de marchand ») ; la route
  //  sortante copie une Scierie → 2 emplacements de Bûcheron à
  //  l'origine : la passe places libres leur redonne un poste.
  state.population[p.n] = [
    perso('m-route', 30, { metier: 'Marchand' }),
    perso('m-libre', 50, { metier: 'Marchand' }),
  ]
  state.routesCommerce = [{
    id: 'rc-test', joueur: p.n, villeOrigine: 'Capitale', joueurCible: 1,
    citeCible: null, villeCible: 'Ailleurs', amenagement: 'Scierie',
  }]
  invaliderIndexPopulation()
  reaffecterMetiers(state, C)
  const parId = new Map(state.population[p.n].map((c) => [c.id, c]))
  assert.ok(state.log.some((l) => l.type === 'Métier' && l.texte.includes('métier de Marchand a été retiré du jeu')),
    'log dédié de purge du titre Marchand')
  assert.equal(parId.get('m-libre')!.metier, 'Commerçant',
    'purge du titre AVANT le surnombre, puis prise de poste aux places libres (les plus âgés d abord) : Commerçant, priorisé avant Chasseur (vague 3b)')
  assert.equal(parId.get('m-route')!.metier, 'Bûcheron',
    'la copie de la Scierie (route sortante) ouvre 2 emplacements de Bûcheron à l origine — le second purgé en prend un')
})

test('Garde (vague 3a) : +garnisonParGarde Garnison STATIQUE par Garde en poste (valeur d état, jamais un flux)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const ville = p.villes[0]
  const sans = garnisonHabitationVille(p, ville, C, state)
  state.population[p.n] = [
    perso('g-30', 30, { metier: C.p.metierGarde }),
    perso('g-40', 40, { metier: C.p.metierGarde }),
    perso('g-90', 90, { metier: C.p.metierGarde, statut: 'Décédé' }),
  ]
  invaliderIndexPopulation()
  const avec = garnisonHabitationVille(p, ville, C, state)
  assert.equal(C.p.garnisonParGarde, 10, 'paramètre par défaut : 10 Garnison par Garde')
  assert.equal(avec - sans, 2 * C.p.garnisonParGarde, '2 Gardes vivants en poste : +20 Garnison (le décédé ne compte pas)')
  // le détail raconte la même chose (ligne origine « métier »)
  const ligne = detailGarnisonVille(p, ville, C, state).find((l) => l.origine === 'métier')
  assert.ok(ligne && ligne.valeur === 2 * C.p.garnisonParGarde, 'ligne « Gardes en poste (statique) » dans le détail de garnison')
  // le Garde ne produit RIEN par tour (« la Garnison n est jamais par tour »)
  const d = detailGainsVille(state, p, ville, C)
  assert.equal(d.metiers['Garnison'], undefined, 'aucune production de Garnison par tour')
})

// ── Vague 3b (2026-10-22) : base du rang, bâtiments tier 1, rangs sans
//    consommation ni garnison de base, Ponton ──────────────────────────────

test('vague 3b : caps CUMULATIVES — Poste de garde +4 Garde sur la base du rang ; École élémentaire +1 Professeur/+1 Scientifique', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const ville: City = { ...p.villes[0], type: 'Ville', rang: 'Hameau', batiments: ['Poste de garde'], amenagements: [] }
  assert.equal(capMetierVille('Garde', ville, C), 6, 'Poste de garde : base Hameau (2 Garde) + 4 emplacements = 6')
  const donjon: City = { ...p.villes[0], type: 'Château', rang: 'Donjon', batiments: ['Ecole élémentaire'], amenagements: [] }
  assert.equal(capMetierVille('Professeur', donjon, C), 1, 'École élémentaire : +1 emplacement de Professeur')
  assert.equal(capMetierVille('Scientifique', donjon, C), 1, 'École élémentaire : +1 emplacement de Scientifique (« chercheur »)')
})

test('nettoyage 2026-10-22 (retour Thibaut, retrait du code mort) : les no-ops de consommation/garnison de base sont retirées du module habitations', () => {
  assert.ok(!('consommationsVille' in habitationsMod), 'consommationsVille : retirée')
  assert.ok(!('consommationsPays' in habitationsMod), 'consommationsPays : retirée')
  assert.ok(!('garnisonBaseVille' in habitationsMod), 'garnisonBaseVille : retirée')
  assert.ok(!('appliquerConsommationsHabitations' in habitationsMod), 'appliquerConsommationsHabitations : retirée')
  // le détail de garnison ne mentionne plus de ligne « base du rang »
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const detail = detailGarnisonVille(p, p.villes[0], C, state)
  assert.ok(!detail.some((l) => l.label.startsWith('base du rang')), 'aucune ligne « base du rang » dans le détail de garnison')
})

test('vague 3b : Ponton — chaque Pêcheur de la ville produit +0,5 Bétail par tour (ville CÔTIÈRE : Rivière ou Mer, gains bruts avant taxes)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  const ville = p.villes[0]
  ville.batiments = ['Ponton']
  state.population[p.n] = [
    perso('p-30', 30, { metier: 'Pêcheur' }),
    perso('p-40', 40, { metier: 'Pêcheur' }),
  ]
  invaliderIndexPopulation()
  // arbitrage Thibaut 2026-10-22 : côtière = TOUTE proximité
  //  autre que « Plaine » (vague 2 Ponton→proximité, 2026-10-23 :
  //  câblé littéralement — une proximité non listée compte).
  ville.proximite = 'Mer'
  assert.equal(capMetierVille('Pêcheur', ville, C), 2, 'Mer : Ponton côtier → +2 emplacements de Pêcheur')
  assert.equal(detailGainsVille(state, p, ville, C).metiers['Bétail'], 1, 'Mer : 2 Pêcheurs × +0,5 Bétail (Ponton)')
  ville.proximite = 'Rivière'
  assert.equal(detailGainsVille(state, p, ville, C).metiers['Bétail'], 1, 'Rivière : côtière aussi (même bonus)')
  ville.proximite = 'Colline'
  assert.equal(capMetierVille('Pêcheur', ville, C), 2, 'Colline (proximité non listée) : côtière aussi — arbitrage littéral (vague 2)')
  assert.equal(detailGainsVille(state, p, ville, C).metiers['Bétail'], 1, 'Colline : 2 Pêcheurs × +0,5 Bétail (Ponton)')
  // Plaine (ou sans proximité) : le bâtiment n'a AUCUN effet moteur
  ville.proximite = 'Plaine'
  assert.equal(capMetierVille('Pêcheur', ville, C), 0, 'Plaine : le Ponton n ouvre aucun poste (bâtiment côtier)')
  assert.equal(detailGainsVille(state, p, ville, C).metiers['Bétail'] ?? 0, 0, 'Plaine : pas de Bétail des Pêcheurs')
  // sans Ponton, pas de Bétail des Pêcheurs
  ville.batiments = []
  ville.proximite = 'Mer'
  assert.equal(detailGainsVille(state, p, ville, C).metiers['Bétail'] ?? 0, 0, 'sans Ponton : les Pêcheurs ne produisent pas de Bétail')
})

test('vague 3b : ordre de prise de poste « n\'importe quel métier → Chasseur → sans métier » — un Chasseur change de métier dès qu\'un autre poste est disponible', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  // rang Hameau : 1 Commerçant, 3 Chasseurs (cap de test)
  C.config.typesHabitation[0].metiersBase = [{ metier: 'Chasseur', places: 3 }, { metier: 'Commerçant', places: 1 }]
  // un Chasseur en poste, un sans-emploi adulte, un enfant sans-emploi
  state.population[p.n] = [
    perso('ch-40', 40, { metier: C.p.metierChasseur }),
    perso('s-30', 30),
    perso('s-8', 8),
  ]
  invaliderIndexPopulation()
  reaffecterMetiers(state, C)
  const parId = new Map(state.population[p.n].map((c) => [c.id, c]))
  assert.equal(parId.get('ch-40')!.metier, 'Commerçant', 'le Chasseur le plus âgé prend le poste de Commerçant (autre métier prioritaire)')
  assert.equal(parId.get('s-30')!.metier, C.p.metierChasseur, 'le sans-emploi prend le poste de Chasseur LIBÉRÉ par le changement de métier')
  assert.equal(parId.get('s-8')!.metier, null, 'un enfant ne prend jamais de poste')
  assert.ok(state.log.some((l) => l.type === 'Métier' && l.texte.includes('change(nt) de métier')),
    'un log Métier raconte le changement de métier du Chasseur')
  // sans autre poste disponible : les Chasseurs restent Chasseurs
  C.config.typesHabitation[0].metiersBase = [{ metier: 'Chasseur', places: 3 }]
  const state2 = partie()
  const C2 = cfgOf(state2.config)
  C2.config.typesHabitation[0].metiersBase = [{ metier: 'Chasseur', places: 3 }]
  state2.population[p.n] = [
    perso('ch-50', 50, { metier: C2.p.metierChasseur }),
    perso('ch-20', 20, { metier: C2.p.metierChasseur }),
  ]
  invaliderIndexPopulation()
  reaffecterMetiers(state2, C2)
  const parId2 = new Map(state2.population[p.n].map((c) => [c.id, c]))
  assert.equal(parId2.get('ch-50')!.metier, C2.p.metierChasseur, 'sans autre poste : le Chasseur reste Chasseur')
  assert.equal(parId2.get('ch-20')!.metier, C2.p.metierChasseur, 'sans autre poste : personne ne bouge')
})

// ── Vague 3c (2026-10-22) : caps des AMÉLIORATIONS d'aménagements
//    (tiers 2/3 — remplacent le tier inférieur) ───────────────────────────

test('vague 3c : caps des aménagements tiers 2/3 — le tier remplacé ne compte plus, les emplacements propres si', () => {
  const state = partie()
  // Simplification (retour Thibaut 2026-10-23) : les aménagements de
  //  rang 2+ (tiers 2/3) sont retirés du RÉFÉRENTIEL et cfgOf FILTRE
  //  désormais les constructions rang ≥ 2 des configs convergées —
  //  la mécanique d'amélioration (remplaceAmenagement) reste en
  //  place, prête à les recevoir à leur retour : les defs tier sont
  //  réinjectées APRÈS convergence (dans C.config, une fois cfgOf
  //  passé — forme exacte de l'ancien référentiel).
  const C = cfgOf(state.config)
  C.config.constructions.push(
    { categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Baleinier (tier 2)',
      terrain: 'Baleine', cout: '15 Or + 3 Pierre', production: '', description: '',
      effets: [], rangMinHabitation: 2, remplaceAmenagement: 'Baleinier',
      emplacements: [{ metier: 'Pêcheur', places: 5 }, { metier: 'Commerçant', places: 5 }] },
    { categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Baleinier (tier 3)',
      terrain: 'Baleine', cout: '35 Or + 3 Fer', production: '', description: '',
      effets: [], rangMinHabitation: 3, remplaceAmenagement: 'Baleinier (tier 2)',
      emplacements: [{ metier: 'Pêcheur', places: 7 }, { metier: 'Commerçant', places: 10 }] },
  )
  // Simplification : les defs tiers 2/3 également utiles aux caps.
  C.config.constructions.push(
    { categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Champ (tier 2)',
      terrain: 'Plaine', cout: '15 Or + 3 Pierre', production: '', description: '',
      effets: [], rangMinHabitation: 2, remplaceAmenagement: 'Champ',
      emplacements: [{ metier: 'Fermier', places: 6 }] },
    { categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Scierie (tier 3)',
      terrain: 'Forêt', cout: '35 Or + 3 Fer', production: '', description: '',
      effets: [], rangMinHabitation: 3, remplaceAmenagement: 'Scierie (tier 2)',
      emplacements: [{ metier: 'Bûcheron', places: 6 }, { metier: 'Tisseur', places: 2 }] },
  )
  const p = state.players[0]
  // Baleinier (tier 2) : +5 Pêcheur, +5 Commerçant (caps CUMULATIVES :
  //  le Commerçant = base du rang 1 + 5 emplacements du tier 2).
  const baleinier2: City = { ...p.villes[0], type: 'Ville', rang: 'Hameau', batiments: [], amenagements: ['Baleinier (tier 2)'] }
  assert.equal(capMetierVille('Pêcheur', baleinier2, C), 5, 'Baleinier (tier 2) : 5 emplacements de Pêcheur')
  assert.equal(capMetierVille('Commerçant', baleinier2, C), 6, 'Commerçant : base du rang Hameau (1) + 5 emplacements du tier 2 = 6')
  // Scierie (tier 3) : +6 Bûcheron, +2 Tisseur — et PAS les emplacements
  //  de la Scierie de tier 1 (remplacée).
  const scierie3: City = { ...p.villes[0], type: 'Ville', rang: 'Hameau', batiments: [], amenagements: ['Scierie (tier 3)'] }
  assert.equal(capMetierVille('Bûcheron', scierie3, C), 6, 'Scierie (tier 3) : 6 emplacements de Bûcheron')
  assert.equal(capMetierVille('Tisseur', scierie3, C), 2, 'Scierie (tier 3) : 2 emplacements de Tisseur')
  assert.equal(capMetierVille(C.p.metierChasseur, scierie3, C), 50, 'tier 3 seul : la base du Chasseur du rang Hameau (50), sans les +2 du tier 1 remplacé')
  // Champ amélioré en tier 2 : +6 Fermier (les 3 du tier 1 ont disparu).
  const champ2: City = { ...p.villes[0], type: 'Ville', rang: 'Hameau', batiments: [], amenagements: ['Champ (tier 2)'] }
  assert.equal(capMetierVille('Fermier', champ2, C), 6, 'Champ (tier 2) : 6 emplacements de Fermier (tier 1 remplacé)')
  // plusieurs exemplaires : 2 Baleiniers dont un seul amélioré
  const mixte: City = { ...p.villes[0], type: 'Ville', rang: 'Hameau', batiments: [], amenagements: ['Baleinier', 'Baleinier (tier 2)'] }
  assert.equal(capMetierVille('Pêcheur', mixte, C), 8, 'Baleinier tier 1 (3) + tier 2 (5) : caps cumulées = 8 Pêcheurs')
})
