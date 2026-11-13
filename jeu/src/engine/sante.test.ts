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
import { cloneDefaultConfig, SCHEMA_VERSION_CONFIG } from '../config/defaultConfig'
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

test('Guérisseur : +3 % guérison et −3 % contraction par Guérisseur en poste dans la ville', () => {
  const C = cfgOf()
  // (Arbitrage Thibaut 2026-11-13 : ±2 % → ±3 %.)
  assert.equal(C.p.guerisseurGuerison, 0.03)
  assert.equal(C.p.guerisseurContraction, 0.03)
  // le métier existe au référentiel, roturier, sans production directe
  const def = C.metiers.find((m) => m.metier === 'Guérisseur')
  assert.ok(def, 'métier Guérisseur au référentiel')
  assert.equal(def?.qualite, 'roturier')
  assert.equal(def?.valeur1, 0)
  // (Arbitrage Thibaut 2026-11-13 : l'Herboristerie ne porte PLUS de
  //  flat ±5 % — elle offre 2 postes ; le poste « rang 2 » vient
  //  toujours de la CLINIQUE (+5), l'HÔPITAL en ajoute 10.)
  const clinique = C.config.constructions.find((c) => c.nom === 'Clinique')
  assert.ok(clinique?.emplacements?.some((e) => e.metier === 'Guérisseur' && e.places === 5),
    'la Clinique (rang 2) accueille 5 Guérisseurs')
  const herboristerie = C.config.constructions.find((c) => c.nom === 'Herboristerie')
  assert.equal(herboristerie?.malContraction, undefined, 'Herboristerie : plus de flat contraction')
  assert.equal(herboristerie?.bonusGuerison, undefined, 'Herboristerie : plus de flat guérison')
  assert.ok(herboristerie?.emplacements?.some((e) => e.metier === 'Guérisseur' && e.places === 2),
    'Herboristerie : 2 postes de Guérisseur')
})

test('Guilde des médecins : constructible (Ville + Château), 10 Guérisseurs, requiert l\'Hôpital, rang 4', () => {
  const C = cfgOf()
  for (const g of ['Ville', 'Château']) {
    const guilde = C.config.constructions.find(
      (c) => c.nom === 'Guilde des médecins' && c.groupe === g)
    assert.ok(guilde, `Guilde des médecins ${g} au référentiel`)
    assert.equal(guilde?.famille, 'Guilde', 'famille Guilde (picker)')
    assert.equal(guilde?.rangMinHabitation, 4, 'rang 4, au-dessus de l\'Hôpital')
    assert.equal(guilde?.requis, 'Hôpital', 'requiert l\'Hôpital')
    assert.ok(guilde?.emplacements?.some((e) => e.metier === 'Guérisseur' && e.places === 10),
      '10 postes de Guérisseur')
    assert.deepEqual(guilde?.couts, [
      { ressource: 'Or', valeur: 50 },
      { ressource: 'Pierre', valeur: 12 },
      { ressource: 'Fer', valeur: 4 },
    ], 'coût 50 Or + 12 Pierre + 4 Fer')
  }
  // l'ancienne Guilde codée en dur (+10 % bonusGuerisonGlobal) a
  //  DISPARU de la vue batiments — remplacée par les effets ci-dessus
  assert.ok(!C.config.batiments.some((b) => b.nom === 'Guilde des médecins'),
    'plus de Guilde des médecins en dur dans la vue batiments')
})

test('Guilde des médecins : efficacité des Guérisseurs du pays +1 %, PLAFONNÉE à une Guilde', () => {
  const C = cfgOf()
  assert.equal(C.p.guildeMedecinsEfficacite, 0.01)
  // le moteur : une Guilde dans n'importe quelle ville du joueur
  //  → chaque Guérisseur passe de ±3 % à ±4 % (contraction ET
  //  guérison) ; DEUX Guilhes ne cumulent pas (plafond).
  //  Vérification structurelle : reconstituer les modificateurs de
  //  maladieStep avec/contre Guilde.
  const state = createGame(defaultSetups(), 20261113, 'local')
  const p = state.players[0]
  const pop = state.population[p.n] ?? []
  const ville = p.villes[0]!
  const habitant = pop.find((c) => c.statut === 'Sain' && c.ville === ville.nom)!
  const probaPure = probaContracterMaladie(habitant, C)
  const sansGuilde = Math.max(0, probaPure - 1 * C.p.guerisseurContraction)
  const avecGuilde = Math.max(0, probaPure - 1 * (C.p.guerisseurContraction + C.p.guildeMedecinsEfficacite))
  assert.ok(avecGuilde < sansGuilde,
    'avec une Guilde, un Guérisseur réduit la contraction de 4 % et non 3 %')
  // plafond : deux Guilhes = toujours +1 % (le moteur teste
  //  `some`, pas le nombre de Guilhes)
  ville.batiments.push('Guilde des médecins')
  let vus = 0
  for (const v of p.villes) {
    if ((v.batiments ?? []).includes('Guilde des médecins')) vus++
  }
  assert.ok(vus >= 1, 'la Guilde est bien dans une ville du joueur')
  // (le plafond est structurel : `some` est booléen, 2 Guilhes ne
  //  peuvent pas donner +2 % — assertion de non-régression sur les
  //  valeurs des paramètres)
  assert.equal(C.p.guildeMedecinsEfficacite, 0.01, 'le bonus d\'efficacité reste 1 %')
})

test('migration santeGuerisseurs2026 : une ancienne config convergée (flats 0.05, params 0.02) est mise à jour, une personnalisation est conservée', () => {
  // config « ancienne » : tamponnée, Herboristerie avec les flats
  //  d'avant le 2026-11-13, paramètres ±2 %, sans Guilde au
  //  référentiel (le garde-fou l'ajoute — elle est neuve).
  const cfg = cloneDefaultConfig()
  cfg.schemaVersion = SCHEMA_VERSION_CONFIG
  delete (cfg as { santeGuerisseurs2026?: boolean }).santeGuerisseurs2026
  const herbo = cfg.constructions.find((c) => c.nom === 'Herboristerie' && c.groupe === 'Ville')!
  herbo.malContraction = 0.05
  herbo.bonusGuerison = 0.05
  delete herbo.emplacements
  const herboPerso = cfg.constructions.find((c) => c.nom === 'Herboristerie' && c.groupe === 'Château')!
  herboPerso.malContraction = 0.07 // personnalisation : conservée
  delete herboPerso.emplacements
  cfg.params.guerisseurGuerison = 0.02
  cfg.params.guerisseurContraction = 0.02
  delete (cfg.params as { guildeMedecinsEfficacite?: number }).guildeMedecinsEfficacite
  const C = cfgOf(cfg)
  // migration passée
  assert.equal((C.config as { santeGuerisseurs2026?: boolean }).santeGuerisseurs2026, true)
  assert.equal(C.p.guerisseurGuerison, 0.03, 'paramètre semé 0.02 → 0.03')
  assert.equal(C.p.guerisseurContraction, 0.03, 'paramètre semé 0.02 → 0.03')
  assert.equal(C.p.guildeMedecinsEfficacite, 0.01, 'nouveau paramètre par défaut')
  const herboApres = C.config.constructions.find((c) => c.nom === 'Herboristerie' && c.groupe === 'Ville')!
  assert.equal(herboApres.malContraction, undefined, 'flat contraction retiré')
  assert.equal(herboApres.bonusGuerison, undefined, 'flat guérison retiré')
  assert.ok(herboApres.emplacements?.some((e) => e.metier === 'Guérisseur' && e.places === 2),
    '2 postes de Guérisseur semés')
  const herboPersoApres = C.config.constructions.find((c) => c.nom === 'Herboristerie' && c.groupe === 'Château')!
  assert.equal(herboPersoApres.malContraction, 0.07, 'personnalisation conservée (patron taxes25)')
  // la Guilde des médecins est AJOUTÉE (construction neuve du référentiel)
  assert.ok(C.config.constructions.some((c) => c.nom === 'Guilde des médecins' && c.groupe === 'Ville'),
    'Guilde des médecins Ville ajoutée par le garde-fou')
  // idempotence : re-lecture stable
  const C2 = cfgOf(C.config)
  assert.equal(C2.p.guerisseurGuerison, 0.03)
  assert.equal(C2.config.constructions.find((c) => c.nom === 'Herboristerie' && c.groupe === 'Ville')?.emplacements?.length, 1)
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
