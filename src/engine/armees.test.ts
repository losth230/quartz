// ═══════════════════════════════════════════════════════════════════════════
//  TESTS ARMÉES — arbitrage Thibaut 2026-10-28 « les armées rejoignent la
//  banque » :
//
//   · PUISSANCES (Soldat 15 / Commandant 45) et ÂGES de recrutement
//     (16-30 ans) vivent sur les LIGNES DE MÉTIER du référentiel
//     (champs puissanceArmee / ageMin / ageMax) — la migration
//     armeesBanque2026 sème les configs sauvegardées depuis les
//     paramètres, et les 4 paramètres historiques restent des REFLIS ;
//   · les RÉDUCTIONS DE LEVÉE (Terrain d'entrainement : 10, Ecole
//     militaire : 25, Guilde des explorateurs : 20, Grande caserne :
//     8) vivent sur les FICHES DE CONSTRUCTION (champ
//     reductionLeveeArmee), passent par le CANAL de banque
//     reductionLeveeArmee et se lisent par reductionLeveeBatiments
//     pour la ville de levée ;
//   · le flag mort prochaineArmeeReduite (−50 Or, ex-tech, sans
//     producteur depuis le 2026-10-24) est RETIRÉ : un champ résiduel
//     d'une vieille sauvegarde est ignoré (arbitrage Thibaut
//     2026-10-28).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, Army } from './types'
import { cfgOf } from './gameData'
import { makeRng } from './rng'
import {
  puissanceArmeeMetier, agesRecrutementSoldat,
  recomputeArmy, recruitForArmies, prixArmee,
  infligerPertes, libererSoldats,
} from './armees'
import {
  constructionRef, resumeConstruction,
  reductionLeveeBatiments, contexteLectureSeule,
} from './constructions'
import { reglePourConstruction } from '../rules/registry'
import { appliquerRegles } from '../rules/effects/banque'
import { cloneDefaultConfig } from '../config/defaultConfig'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

/** Personnage de test complet (même gabarit que taxes.test.ts). */
function perso(id: string, age: number, o: { metier?: string | null; ville?: string } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Déisme', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Stérile', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
  }
}

function partie() {
  return createGame(SETUP, 20261028, 'local')
}

/** Ligne de métier du référentiel courant (par nom de métier). */
function ligneMetier(C: ReturnType<typeof cfgOf>, nom: string) {
  const ligne = C.config.metiers.find((m) => m.metier === nom)
  assert.ok(ligne, `métier « ${nom} » introuvable dans le référentiel`)
  return ligne
}

test('défauts du référentiel : Soldat 15 pts, Commandant 45 pts, recrutement 16-30 ans', () => {
  const state = partie()
  const C = cfgOf(state.config)
  assert.equal(puissanceArmeeMetier(C.p.metierSoldat, C, 0), 15, 'Soldat : 15 pts d armée')
  assert.equal(puissanceArmeeMetier(C.p.metierCommandant, C, 0), 45, 'Commandant : 45 pts d armée')
  assert.deepEqual(agesRecrutementSoldat(C), { min: 16, max: 30 }, 'bornes d âge portées par la ligne Soldat')
})

test('recomputeArmy : soldats × 15 + commandant × 45 — la ligne de métier ÉDITÉE prime', () => {
  const state = partie()
  const p = state.players[0]
  const C = cfgOf(state.config)
  state.population[p.n] = [
    perso('s1', 20), perso('s2', 25), perso('s3', 28),
    perso('c1', 40), // commandant vivant
  ]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 0, puissance: 0,
    commandant: 'c1', soldats: ['s1', 's2', 's3'],
  }
  recomputeArmy(state, p, armee)
  assert.equal(armee.puissance, 3 * 15 + 45, '3 soldats × 15 + commandant × 45 = 90')
  // La fiche de métier est la source de vérité : une édition dans
  //  Référentiels s'applique immédiatement (référentiel édité prime).
  ligneMetier(C, C.p.metierSoldat).puissanceArmee = 20
  ligneMetier(C, C.p.metierCommandant).puissanceArmee = 50
  recomputeArmy(state, p, armee)
  assert.equal(armee.puissance, 3 * 20 + 50, 'lignes éditées : 3 × 20 + 50 = 110')
})

test('repli param : ligne de métier SANS champ → paramètre historique', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const soldat = ligneMetier(C, C.p.metierSoldat)
  delete soldat.puissanceArmee
  // Le repli est le paramètre historique (refli de compat) — la
  //  migration armeesBanque2026 complète les configs sauvegardées, une
  //  ligne éditée à la main sans le champ retombe dessus.
  assert.equal(puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat), C.p.puissanceSoldat)
  assert.equal(C.p.puissanceSoldat, 15, 'paramètre de repli : 15')
  delete soldat.ageMin
  delete soldat.ageMax
  assert.deepEqual(agesRecrutementSoldat(C), { min: C.p.soldatAgeMin, max: C.p.soldatAgeMax })
  assert.deepEqual({ min: C.p.soldatAgeMin, max: C.p.soldatAgeMax }, { min: 16, max: 30 })
})

test('recruitForArmies : bornes d âge de la ligne Soldat (31 ans exclu par défaut, recruté si ageMax édité)', () => {
  const state = partie()
  const p = state.players[0]
  const C = cfgOf(state.config)
  state.population[p.n] = [perso('jeune', 20), perso('vieux', 31)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 30, puissance: 0,
    commandant: null, soldats: [],
  }
  p.armees = [armee]
  recruitForArmies(state, p, makeRng(20261028))
  // Par défaut la ligne Soldat porte ageMax 30 : le candidat de 31 ans
  //  n'est PAS recruté, celui de 20 l'est.
  assert.deepEqual(armee.soldats, ['jeune'], 'seul le candidat de 20 ans rejoint l armée')
  assert.equal(armee.puissance, 15)
  const jeune = state.population[p.n].find((c) => c.id === 'jeune')!
  assert.equal(jeune.metier, C.p.metierSoldat, 'la recrue devient Soldat')
  assert.equal(jeune.armee, 'Légion')
  // ageMax édité à 40 sur la ligne : le candidat de 31 ans est recruté
  ligneMetier(C, C.p.metierSoldat).ageMax = 40
  recruitForArmies(state, p, makeRng(20261028))
  assert.ok(armee.soldats.includes('vieux'), 'borne d âge éditée : le candidat de 31 ans passe')
  assert.equal(armee.puissance, 30, '2 soldats × 15 = 30 (puissance cible atteinte)')
})

test('prixArmee : 1 Or / 2 pts ; réductions de levée des bâtiments de la ville (banque), plancher 0', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const ville4 = {
    batiments: ["Terrain d'entrainement", 'Ecole militaire', 'Guilde des explorateurs', 'Grande caserne'],
  }
  // Sans ville : prix de base du paramètre (armeePrixOr / armeePriXPuissance)
  assert.equal(prixArmee(90, C), 45, '90 pts = 45 Or sans bâtiment')
  assert.equal(prixArmee(0, C), 0, 'puissance nulle = gratuit')
  // Les 4 fiches de réduction (10 + 25 + 20 + 8 = 63 Or) passent par
  //  le canal de banque de la ville de levée.
  assert.equal(reductionLeveeBatiments(ville4, C), 63, 'somme des 4 fiches = 63 Or')
  assert.equal(prixArmee(90, C, ville4), 0, '45 − 63 → plancher 0 Or')
  assert.equal(prixArmee(200, C, ville4), 37, '100 − 63 = 37 Or')
  // Une fiche ÉDITÉE dans Référentiels prime (config nouvelle → règles
  //  de banque reconstruites à la lecture).
  const C2 = cfgOf(cloneDefaultConfig())
  const ecole = C2.config.constructions.find((c) => c.nom === 'Ecole militaire')!
  ecole.reductionLeveeArmee = 5
  assert.equal(reductionLeveeBatiments(ville4, C2), 10 + 5 + 20 + 8, 'Ecole militaire éditée : réduction 43 Or')
  assert.equal(prixArmee(200, C2, ville4), 57, '100 − 43 = 57 Or')
})

test('registre & banque : le Terrain d entrainement porte l effet reductionLeveeArmee 10, canal de contribution', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const ref = constructionRef("Terrain d'entrainement", C.config)
  assert.ok(ref, 'fiche Terrain d entrainement introuvable')
  const regle = reglePourConstruction(ref!, C)
  assert.ok(regle, 'le Terrain d entrainement porte une règle de banque')
  assert.deepEqual(
    regle!.effets.find((e) => e.type === 'reductionLeveeArmee'),
    { type: 'reductionLeveeArmee', valeur: 10 },
    'l effet reductionLeveeArmee vaut 10',
  )
  // Le canal de contribution agrège l'effet comme un flux.
  const out = appliquerRegles([regle!], contexteLectureSeule())
  assert.equal(out.reductionLeveeArmee, 10, 'canal reductionLeveeArmee de la contribution')
  // Et la lecture « ville » d'un seul bâtiment rend la même valeur.
  assert.equal(reductionLeveeBatiments({ batiments: ["Terrain d'entrainement"] }, C), 10)
})

test('resumeConstruction : la réduction de levée figure dans le résumé (« levée d armée −10 Or »)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const resume = resumeConstruction(constructionRef("Terrain d'entrainement", C.config), C.config)
  assert.ok(resume.includes('levée d\u2019armée −10 Or') || resume.includes("levée d'armée −10 Or"), `résumé : « ${resume} »`)
})

test('flag mort prochaineArmeeReduite : un champ résiduel d une vieille sauvegarde est ignoré', () => {
  const state = partie()
  const C = cfgOf(state.config)
  // (RETRAIT 2026-10-28, arbitrage Thibaut : le flag est supprimé du
  //  type ; une vieille sauvegarde peut encore porter la clé — le
  //  prix de levée ne doit PAS en tenir compte.)
  ;(state.players[0] as unknown as { prochaineArmeeReduite?: boolean }).prochaineArmeeReduite = true
  assert.equal(prixArmee(90, C), 45, 'aucune réduction fantôme de 50 Or')
})

// ═════════════════════════════════════════════════════════════════════════
//  SUIVIE vs NON SUIVIE (retour arbitre 2026-10-28 « les pertes
//  réduisent l'armée à 45 à chaque fois ») :
//
//   · une armée SUIVIE (soldats non vide) adosse sa puissance à ses
//     personnages réels — dérivation soldats × 15 + commandant ;
//   · une armée NON SUIVIE (soldats vide — levée fraîche pas
//     encore passée par le recrutement, ou import du classeur)
//     garde sa puissance STOCKÉE : pertes et fin de service y
//     sont SOUSTRACTIVES (nb × 15, + 45 si le commandant tombe),
//     aucune dérivation ne l'écrase à son seul commandant ;
//   · le RENFORT est une levée au sein de l'armée (arbitrage
//     Thibaut 2026-10-28) : la puissance cible est relevée, le
//     recrutement comble l'écart par des recrues réelles — qui
//     font aussi passer une armée non suivie en dérivation.
// ═════════════════════════════════════════════════════════════════════════

test('pertes armée SUIVIE : soldats réels tués, puissance dérivée (comportement inchangé)', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [
    perso('s1', 20), perso('s2', 25), perso('s3', 28),
    perso('c1', 40), // commandant vivant
  ]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 90, puissance: 90,
    commandant: 'c1', soldats: ['s1', 's2', 's3'],
  }
  p.armees = [armee]
  const tombes = infligerPertes(state, p, 0, 2)
  assert.equal(armee.puissance, 60, '2 soldats tombés : 3 × 15 + 45 − 30 = 60')
  assert.equal(tombes.length, 2, '2 personnages réels tués')
  assert.equal(armee.soldats.length, 1, 'il reste un soldat')
  // les derniers (1 soldat + commandant) : l'armée retombe à 0
  infligerPertes(state, p, 0, 2, true)
  assert.equal(armee.puissance, 0, 'commandant + dernier soldat : 0')
  assert.equal(armee.commandant, null)
  assert.equal(armee.soldats.length, 0)
})

test('pertes armée NON SUIVIE : SOUSTRACTIVES sur la puissance stockée (pas de chute à 45)', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [perso('c1', 40)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 200, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  const tombes = infligerPertes(state, p, 0, 2)
  assert.equal(armee.puissance, 170, '2 pertes = −2 × 15 → 170, PAS 45')
  assert.deepEqual(tombes, [], 'aucun personnage réel : l armée n en suit aucun')
  assert.equal(state.population[p.n][0].statut, 'Sain', 'le commandant est intact')
  // commandant tué EN PLUS : ses points s ajoutent aux pertes
  const tombes2 = infligerPertes(state, p, 0, 1, true)
  assert.equal(armee.puissance, 110, '1 perte + commandant : −15 −45 → 110')
  assert.equal(armee.commandant, null)
  assert.equal(state.population[p.n][0].statut, 'Décédé', 'le commandant, lui, est un personnage réel')
  assert.deepEqual(tombes2, ['Pers-c1 Test'])
})

test('fin de service armée NON SUIVIE : soustractive aussi, le commandant redevient Chasseur', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [perso('c1', 40)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 200, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  const liberes = libererSoldats(state, p, 0, 2)
  assert.equal(armee.puissance, 170, '2 démobilisés abstraits : −2 × 15')
  assert.deepEqual(liberes, [], 'personne à libérer pour de vrai')
  const liberes2 = libererSoldats(state, p, 0, 1, true)
  assert.equal(armee.puissance, 110, '1 démobilisé + commandant : −15 −45')
  assert.equal(armee.commandant, null)
  const c1 = state.population[p.n][0]
  assert.equal(c1.statut, 'Sain', 'le commandant libéré reste vivant')
  assert.equal(c1.metier, 'Chasseur', 'il redevient Chasseur (convention Dissoudre)')
  assert.deepEqual(liberes2, ['Pers-c1 Test'])
})

test('recruitForArmies armée NON SUIVIE : la puissance stockée fait foi ; le renfort comble par de vraies recrues', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [perso('c1', 40), perso('s1', 20), perso('s2', 21)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 200, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  // cible atteinte : RIEN ne bouge (l ancienne dérivation écrasait
  //  l armée à son seul commandant, 45)
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 200, 'puissance stockée conservée (pas 45)')
  assert.deepEqual(armee.soldats, [], 'aucune recrue : la cible est atteinte')
  // RENFORT de +30 pts : cible 230 — le recrutement comble l écart
  //  par des recrues réelles (levée au sein de l armée) ; les 2
  //  recrues font passer l armée en SUIVIE.
  armee.puissanceCible = 230
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.soldats.length, 2, '2 recrues comblent +30 pts')
  assert.equal(armee.puissance, 230, 'stockée 200 + 2 × 15 = 230')
  assert.equal(state.population[p.n].find((c) => c.id === 's1')!.metier, 'Soldat', 'les recrues deviennent Soldat')
  // devenue suivie, la dérivation s applique (2 × 15 + 45 = 75) ;
  //  la cible tient le niveau affiché.
  armee.puissanceCible = 75
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 75, 'dérivation suivie : 2 × 15 + commandant 45')
})

test('recruitForArmies armée NON SUIVIE : commandant mort entre deux tours → détaché, −45 sur la stockée', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [perso('c1', 40)]
  state.population[p.n][0].statut = 'Décédé'
  const armee: Army = {
    nom: 'Légion', puissanceCible: 200, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.commandant, null, 'le commandant mort est détaché')
  assert.equal(armee.puissance, 155, 'stockée − points du commandant : 200 − 45')
})
