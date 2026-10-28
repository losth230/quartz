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
    commandant: 'c1', soldats: ['s1', 's2', 's3'], cible: null,
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
    commandant: null, soldats: [], cible: null,
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
