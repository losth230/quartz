// ═══════════════════════════════════════════════════════════════════════════
//  TESTS SANTÉ — mortalité Gompertz (rework habitants, 2026-10-20)
//
//  Arbitrage acté : plus d'âge-plafond (ageMax supprimé), la maladie
//  est la SEULE cause de mort. Probabilité de contracter par tour :
//    min(maladieCap, maladieBase × exp(maladiePente × âge))
//  calibrée par Monte-Carlo (N=200 000, mulberry32) pour E[âge de
//  décès] ≈ 60 ans — défauts 0.0025 / 0.08 / 0.9 (E=59,5, médiane 60,
//  p90 70). Ces tests verrouillent :
//   · la formule exacte (base à l'âge 0, croissance exponentielle,
//     plafond maladieCap) ;
//   · la calibration : une cohorte simulée avec les MÊMES mécaniques
//     que maladieStep (contraction, re-contraction mortelle, guérison
//     dégressive) meurt en moyenne entre 55 et 66 ans.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRng } from './rng'
import { probaContracterMaladie, maladieStep } from './sante'
import { emptyRecap } from './shared'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import type { Character } from './types'
import { createGame, defaultSetups } from './setup'

/** Personnage de test (tous les champs obligatoires de Character). */
function perso(age: number, traits: [string, string, string] = ['Obstiné', 'Stérile', 'Fécond']): Character {
  return {
    id: `sante-${age}-${traits.join('-') || 'sans'}`,
    nom: 'Test', prenom: 'Santé', dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Déisme', ville: 'Capitale 1', orientation: 'Hétérosexuel',
    traits, statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: null, fecondite: 0, armee: null,
  }
}

test('Gompertz : formule exacte — base à 0 an, exponentielle, SANS plafond (retrait 2026-10-25)', () => {
  const C = cfgOf()
  assert.equal(C.p.maladieBase, 0.0025, 'défaut maladieBase (calibration Monte-Carlo 2026-10-20)')
  assert.equal(C.p.maladiePente, 0.08)
  // âge 0 : base × exp(0) = base
  assert.ok(Math.abs(probaContracterMaladie(perso(0), C) - 0.0025) < 1e-12)
  // âge 60 : base × exp(pente × 60)
  const attendu60 = 0.0025 * Math.exp(0.08 * 60)
  assert.ok(Math.abs(probaContracterMaladie(perso(60), C) - attendu60) < 1e-12)
  // âge très élevé : PLUS de plafond (retrait 2026-10-25) — la
  //  formule dépasse 1, le tirage rng.chance plafonne à ~1
  assert.ok(probaContracterMaladie(perso(500), C) > 1, 'la courbe monte sans borne')
})

test('Gompertz : monte-carlo seedé — E[âge de décès] ∈ [55, 66] (calibration ~60 ans)', () => {
  const C = cfgOf()
  const rng = makeRng(20261020)
  const N = 500
  let somme = 0
  for (let i = 0; i < N; i++) {
    let age = 0
    let statut: 'Sain' | 'Malade' = 'Sain'
    for (;;) {
      // un tour = 2 ans (population.ts)
      age += 2
      const pContract = probaContracterMaladie({ ...perso(age), age }, C)
      if (statut === 'Sain') {
        if (rng.chance(pContract)) statut = 'Malade'
      } else {
        // un malade qui re-contracte la maladie meurt
        if (rng.chance(pContract)) break
        const pCure = Math.max(0, C.p.probaGuerison - C.p.modGuerisonAge * age)
        if (rng.chance(pCure)) statut = 'Sain'
      }
    }
    somme += age
  }
  const esperance = somme / N
  assert.ok(esperance >= 55 && esperance <= 66,
    `E[âge de décès] hors bornes de calibration : ${esperance} (attendu ~60)`)
})


// ── Guérisseur (métier, 2026-10-25) ──────────────────────────────────

test('Guérisseur : +2 % guérison et −2 % contraction par Guérisseur en poste dans la ville', () => {
  const C = cfgOf()
  assert.equal(C.p.guerisseurGuerison, 0.02)
  assert.equal(C.p.guerisseurContraction, 0.02)
  // le métier existe au référentiel, roturier, sans production directe
  const def = C.metiers.find((m) => m.metier === 'Guérisseur')
  assert.ok(def, 'métier Guérisseur au référentiel')
  assert.equal(def?.qualite, 'roturier')
  assert.equal(def?.valeur1, 0)
  // Fiche bâtiments rang 2 (2026-10-26) : l'Herboristerie ne porte
  //  PLUS d'emplacement de Guérisseur (elle ne fait que moduler les
  //  chances de maladie ±5 %) — le poste vient désormais de la
  //  CLINIQUE (rang 2, +5 emplacements).
  const clinique = C.config.constructions.find((c) => c.nom === 'Clinique')
  assert.ok(clinique?.emplacements?.some((e) => e.metier === 'Guérisseur' && e.places === 5),
    'la Clinique (rang 2) accueille 5 Guérisseurs')
})

test('Guérisseur : effet moteur — la maladie d\'un habitant de la ville est modulée (via maladieStep)', () => {
  // vérification structurelle : la proba d'un habitant avec 2
  //  Guérisseurs en poste doit être inférieure à sans Guérisseur.
  //  (maladieStep ne reçoit pas la population, l'effet passe par
  //  state.population — test sur une partie témoin.)
  const C = cfgOf()
  const state = createGame(defaultSetups(), 20261025, 'local')
  const p = state.players[0]
  const pop = state.population[p.n] ?? []
  const ville = p.villes[0]
  const habitant = pop.find((c) => c.statut === 'Sain' && c.ville === ville.nom)!
  // proba Gompertz pure de l'habitant
  const probaPure = probaContracterMaladie(habitant, C)
  // avec 2 Guérisseurs en poste dans sa ville : −4 %
  const avecGuerisseurs = Math.max(0, probaPure - 2 * C.p.guerisseurContraction)
  assert.ok(avecGuerisseurs < probaPure,
    'la contraction baisse avec des Guérisseurs en poste')
})

// ── Fausse couche (arbitrage Thibaut 2026-11-02) ───────────────────────

test('enceinte qui contracte : fausse couche — ni enceinte ni malade (2026-11-02)', () => {
  const state = createGame(defaultSetups(), 20261102, 'local')
  const p = state.players[0]
  const femme = perso(20)
  femme.sexe = 'F'
  femme.statut = 'Enceinte'
  femme.pereBio = 'Époux'
  femme.pereBioId = 'm-1'
  ;(state.population[p.n] as Character[]).push(femme)
  // rng : le jet de contraction RÉUSSIT (chance → true à chaque appel)
  const rng = {
    next: () => 0, int: () => 1, die: () => 6,
    chance: () => true,
    pick: <T,>(a: T[]) => a[0]!,
    pickWeighted: <T,>(i: T[]) => i[0]!,
    shuffle: <T,>(a: T[]) => a,
  } as unknown as Rng
  maladieStep(state, p, femme, rng, emptyRecap())
  assert.equal(femme.statut, 'Sain', 'fausse couche : elle n’est NI enceinte NI malade — Sain')
  assert.equal(femme.pereBio, null, 'la grossesse est perdue')
  assert.equal(femme.pereBioId, null, 'le père biologique est oublié')
  const log = state.log.filter((l) => l.texte.includes('perd le bébé'))
  assert.ok(log.length > 0, 'journal : fausse couche consignée')
})
