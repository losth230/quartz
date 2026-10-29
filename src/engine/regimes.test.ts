// ══════════════════════════════════════════════════════════════════════
//  TESTS DES 8 LOIS DES RÉGIMES (refonte « 8 lois », 2026-10-29)
//
//  Retour Thibaut : chaque régime porte DEUX lois, lues par le MOTEUR
//  là où elles agissent — plus AUCUNE loi de régime ne passe par la
//  banque (source 'regime' retirée du registre, cf.
//  src/rules/regimes-cultures.test.ts) :
//    · Autoritarisme « Conscription » (prix de levée −10 Or par rang
//      du pays — engine/armees.ts ; le texte existait dès l'origine,
//      jamais codé avant la refonte) et « Frontières closes »
//      (départs ×0,8 — engine/migrationBonheur.ts) ;
//    · Socialisme « Terre d'accueil » (+1 Or par migrant arrivant —
//      tests de flux dans migrationBonheur.test.ts) et
//      « Redistribution » (bourgeois 1 / noble 2 — engine/economie.ts) ;
//    · Démocratie « Le pouvoir du peuple » (+5 Bonheur par habitation,
//      plafonné à 100 — engine/bonheur.ts ; « Élections », sacre
//      gratuit, reste structurelle : engine/sante.ts) ;
//    · Monarchie « Vassaux dévoués » (tribut reçu ×1,05 —
//      engine/vassalite.ts ; « Droit Divin », +1 serment, reste
//      structurelle : engine/tour.ts).
// ══════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, regimeDef } from './gameData'
import { prixArmee } from './armees'
import { rangPaysNiveau } from './rangs'
import { consoNourrHabitant, detailGainsVille } from './economie'
import { bonusBonheurRegime, bonheurVille, bonheurVilleComplete, scoresVille } from './bonheur'
import { multDepartRegime } from './migrationBonheur'
import { transfererTributVassal } from './vassalite'
import type { Character, GameState } from './types'

/** Partie complète (8 joueurs par défaut) — les lois de régime du
 *  MOTEUR ne dépendent pas de la banque, on teste sur du vrai état. */
function partie(): { state: GameState; C: ReturnType<typeof cfgOf> } {
  const state = createGame(defaultSetups(), 20261029, 'local')
  return { state, C: cfgOf(state.config) }
}

/** Habitant de test (même gabarit que les autres suites moteur). */
function perso(id: string, prestige: number): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age: 30,
    culture: 'Déisme', ville: 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Stérile', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: null, fecondite: 0, armee: null, prestige,
  } as unknown as Character
}

// ── 1. Conscription (Autoritarisme) ───────────────────────────────────

test('Conscription : prix de levée −10 Or par rang du pays, plancher 0', () => {
  const { C } = partie()
  // Verrou des constantes : 90 pts = (90/2) × 1 Or = 45 Or.
  assert.equal(C.p.armeePriXPuissance, 2)
  assert.equal(C.p.armeePrixOr, 1)
  assert.equal(prixArmee(90, C), 45, 'sans joueur : plein tarif (prix brut)')
  assert.equal(prixArmee(90, C, undefined, { regime: 'Autoritarisme', rang: 'Baronnie' }), 35, 'Baronnie (rang 1) : 45 − 10')
  assert.equal(prixArmee(90, C, undefined, { regime: 'Autoritarisme', rang: 'Comté' }), 25, 'Comté (rang 2) : 45 − 20')
  assert.equal(prixArmee(90, C, undefined, { regime: 'Autoritarisme', rang: 'Empire' }), 0, 'Empire (rang 5) : plancher 0 (45 − 50)')
  assert.equal(prixArmee(90, C, undefined, { regime: 'Monarchie', rang: 'Empire' }), 45, 'autre régime : PLEIN tarif — la loi est propre à l\'Autoritarisme')
})

test('Conscription : CUMULée à la réduction de la ville de levée', () => {
  const { C } = partie()
  // Terrain d'entrainement : reductionLeveeArmee 10 (banque, canal
  //  reductionLeveeArmee — arbitrage Thibaut 2026-10-28).
  const ville = { batiments: ["Terrain d'entrainement"] }
  assert.equal(prixArmee(90, C, ville, { regime: 'Autoritarisme', rang: 'Baronnie' }), 25, '45 − 10 (bâtiment) − 10 (rang 1)')
  assert.equal(prixArmee(90, C, ville), 35, 'sans la loi du régime : 45 − 10 (bâtiment seul)')
})

test('rangPaysNiveau : Baronnie 1 → Empire 5, hors échelle 0', () => {
  const { C } = partie()
  assert.equal(rangPaysNiveau({ rang: 'Baronnie' }, C), 1)
  assert.equal(rangPaysNiveau({ rang: 'Comté' }, C), 2)
  assert.equal(rangPaysNiveau({ rang: 'Duché' }, C), 3)
  assert.equal(rangPaysNiveau({ rang: 'Royaume' }, C), 4)
  assert.equal(rangPaysNiveau({ rang: 'Empire' }, C), 5)
  assert.equal(rangPaysNiveau({ rang: 'République' }, C), 0, 'rang inconnu : hors échelle')
  assert.equal(rangPaysNiveau(undefined, C), 0, 'sans joueur : aucun bonus')
})

// ── 2. Verrou des montants du référentiel (8 lois) ───────────────────

test('8 lois : les montants chiffrés des régimes du référentiel', () => {
  const { C } = partie()
  assert.equal(regimeDef('Autoritarisme', C.config)?.leveeOrParRangPays, 10, 'Conscription : −10 Or/rang')
  assert.equal(regimeDef('Autoritarisme', C.config)?.departHabitantsMult, 0.8, 'Frontières closes : ×0,8')
  assert.equal(regimeDef('Socialisme', C.config)?.orParMigrant, 1, 'Terre d\'accueil : +1 Or')
  assert.equal(regimeDef('Socialisme', C.config)?.consoNourrBourgeoisRegime, 1, 'Redistribution : bourgeois 1')
  assert.equal(regimeDef('Socialisme', C.config)?.consoNourrNobleRegime, 2, 'Redistribution : noble 2')
  assert.equal(regimeDef('Démocratie', C.config)?.bonheurParHabitation, 5, 'Pouvoir du peuple : +5')
  assert.equal(regimeDef('Monarchie', C.config)?.tributVassalMult, 1.05, 'Vassaux dévoués : ×1,05')
})

// ── 3. Frontières closes (Autoritarisme) ─────────────────────────────

test('Frontières closes : multiplicateur des départs — ×0,8 Autoritarisme, ×1 ailleurs', () => {
  const { state, C } = partie()
  const p = state.players[0]
  p.regime = 'Autoritarisme'
  assert.equal(multDepartRegime(p, C), 0.8, '20 % de chances de moins de partir')
  p.regime = 'Démocratie'
  assert.equal(multDepartRegime(p, C), 1, 'les autres régimes ne touchent pas aux départs')
  p.regime = 'Aucun régime'
  assert.equal(multDepartRegime(p, C), 1, 'régime inconnu : neutre')
})

// ── 4. Redistribution (Socialisme) ────────────────────────────────────

test('Redistribution : bourgeois 1 / noble 2 sous Socialisme — défauts ailleurs', () => {
  const { C } = partie()
  const rotu = perso('rotu', 50)      // < 100 : roturier
  const bourg = perso('bourg', 200)   // 100-250 : bourgeois
  const noble = perso('noble', 300)   // ≥ 250 : noble
  assert.equal(consoNourrHabitant(bourg, C, 'Socialisme'), 1, 'bourgeois socialiste : 1 Nourriture')
  assert.equal(consoNourrHabitant(noble, C, 'Socialisme'), 2, 'noble socialiste : 2 Nourriture')
  assert.equal(consoNourrHabitant(rotu, C, 'Socialisme'), C.p.consoNourrParHab, 'roturier : conso base INCHANGÉE')
  assert.equal(consoNourrHabitant(bourg, C, 'Monarchie'), C.p.consoNourrBourgeois, 'hors Socialisme : défaut bourgeois (2)')
  assert.equal(consoNourrHabitant(noble, C, 'Monarchie'), C.p.consoNourrNoble, 'hors Socialisme : défaut noble (4)')
  assert.equal(consoNourrHabitant(bourg, C), C.p.consoNourrBourgeois, 'sans régime précisé : défaut')
})

test('Redistribution : chemin moteur — la consommation de la VILLE suit la loi', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes[0]
  const bourgeois = (id: string) => {
    const c = perso(id, 200)
    c.ville = ville.nom
    return c
  }
  const septBourgeois = Array.from({ length: 7 }, (_, i) => bourgeois(`b${i}`))
  state.population[p.n] = septBourgeois
  p.regime = 'Socialisme'
  assert.equal(detailGainsVille(state, p, ville, C).conso['Nourriture'], -7, '7 bourgeois × 1 Nourriture = −7')
  p.regime = 'Monarchie'
  assert.equal(detailGainsVille(state, p, ville, C).conso['Nourriture'], -14, 'défaut : 7 × 2 = −14')
  const deuxNobles = Array.from({ length: 2 }, (_, i) => {
    const c = perso(`n${i}`, 300)
    c.ville = ville.nom
    return c
  })
  state.population[p.n] = deuxNobles
  p.regime = 'Socialisme'
  assert.equal(detailGainsVille(state, p, ville, C).conso['Nourriture'], -4, '2 nobles × 2 Nourriture = −4')
  p.regime = 'Monarchie'
  assert.equal(detailGainsVille(state, p, ville, C).conso['Nourriture'], -8, 'défaut : 2 × 4 = −8')
})

// ── 5. Le pouvoir du peuple (Démocratie) ──────────────────────────────

test('Pouvoir du peuple : bonusBonheurRegime — +5 Démocratie, 0 ailleurs', () => {
  const { state, C } = partie()
  const p = state.players[0]
  p.regime = 'Démocratie'
  assert.equal(bonusBonheurRegime(p, C), 5)
  p.regime = 'Autoritarisme'
  assert.equal(bonusBonheurRegime(p, C), 0)
  p.regime = 'Aucun régime'
  assert.equal(bonusBonheurRegime(p, C), 0)
})

test('Pouvoir du peuple : chemin moteur — bonheurVilleComplete plafonné à 100', () => {
  const { state, C } = partie()
  const p = state.players[0]
  p.regime = 'Démocratie'
  for (const ville of p.villes) {
    const attendu = Math.min(100, bonheurVille(scoresVille(state, p, ville, C)) + 5)
    assert.equal(bonheurVilleComplete(state, p, ville, C), attendu, 'formule des 5 axes + 5, plafonnée à 100')
    assert.ok(bonheurVilleComplete(state, p, ville, C) <= 100, 'jamais au-dessus de 100')
  }
  // Hors Démocratie : le bonheur complet EGALE la formule pure.
  p.regime = 'Monarchie'
  const ville = p.villes[0]
  assert.equal(bonheurVilleComplete(state, p, ville, C), bonheurVille(scoresVille(state, p, ville, C)))
})

// ── 6. Vassaux dévoués (Monarchie) ───────────────────────────────────

test('Vassaux dévoués : le suzerain Monarchie reçoit le tribut ×1,05 — le vassal paie SA part', () => {
  const { state, C } = partie()
  const [p0, p1] = state.players
  p0.vassalDe = p1.n
  p1.regime = 'Monarchie'
  const gains: Record<number, Record<string, number>> = { [p0.n]: { Or: 100 } }
  transfererTributVassal(state, gains, C)
  assert.equal(gains[p0.n]['Or'], 50, 'le vassal paie SA part (50 % de 100) — jamais plafonné par la loi')
  assert.ok(Math.abs(gains[p1.n]['Or'] - 52.5) < 1e-9, 'le suzerain reçoit 50 × 1,05 = 52,5 (la différence est CRÉÉE)')
})

test('Vassaux dévoués : hors Monarchie, le suzerain reçoit exactement la part du vassal', () => {
  const { state, C } = partie()
  const [p0, p1] = state.players
  p0.vassalDe = p1.n
  p1.regime = 'Socialisme' // PAS la loi des Vassaux dévoués
  const gains: Record<number, Record<string, number>> = { [p0.n]: { Or: 100 } }
  transfererTributVassal(state, gains, C)
  assert.equal(gains[p0.n]['Or'], 50)
  assert.equal(gains[p1.n]['Or'], 50, 'sans Monarchie : 50, pas 52,5')
})

// ── 7. Lois structurelles (verrou du référentiel) ─────────────────────

test('lois structurelles : Élections (sacre gratuit) et Droit Divin (+1 serment) restent codées où elles vivent', () => {
  // (Élections — engine/sante.ts, fDemocratie — et Droit Divin —
  //  engine/tour.ts, bonusMonarchie — sont STRUCTURELLES, codées
  //  dès le 2026-10-15, inchangées par la refonte : ces verrous
  //  s'assurent que le TEXTE du référentiel les porte toujours.)
  const { C } = partie()
  assert.ok(regimeDef('Démocratie', C.config)?.loi.includes('Elections'), 'le texte de la loi Démocratie porte « Elections »')
  assert.ok(regimeDef('Monarchie', C.config)?.loi.includes('Droit Divin'), 'le texte de la loi Monarchie porte « Droit Divin »')
})
