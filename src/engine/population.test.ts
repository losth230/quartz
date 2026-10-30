// ═══════════════════════════════════════════════════════════════════════════
//  TESTS POPULATION — RETRAIT DE LA MIGRATION SCOLAIRE (2026-10-28)
//
//  Arbitrage Thibaut : « commence par retirer la migration par
//  scolarité » — migrerPopulation (un enfant sans Professeur dans sa
//  ville partait, 10 %/2 %/1 %, étudier ailleurs) est supprimé du
//  moteur avec l'étape 3.6bis du tour. Ces tests verrouillent le
//  retrait : plus AUCUN déplacement SCOLAIRE, qu'un Professeur
//  existe ou non ailleurs.
//  (AMENDEMENT même jour, 2e arbitrage : le flux de migration par
//   BONHEUR (engine/migrationBonheur.ts) RÉINTRODUIT des départs
//   automatiques — l'invariant « les enfants restent dans leur
//   ville » n'est PLUS le contrat ; le test ci-dessous coupe le
//   flux (migrationBonheurMax = 0) pour isoler le contrat scolaire,
//   et le flux lui-même vit dans migrationBonheur.test.ts.)
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf } from './gameData'
import { runTurn } from './tour'
import type { Character } from './types'

/** Personnage de test (gabarit des autres fichiers de tests). */
function perso(id: string, age: number, o: { metier?: string | null; ville?: string } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Déisme', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    // SANS « Obstiné » : l'ancienne migration ne devait jamais s'appliquer
    //  aux Obstinés — nos candidats doivent y avoir été éligibles.
    //  (traits = tuple de 3, cf. Character.)
    traits: ['Stérile', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
  }
}

test('retrait migration scolaire : aucun départ « scolarité », même avec un Professeur ailleurs', () => {
  const state = createGame(defaultSetups(), 20261028, 'local')
  const C = cfgOf(state.config)
  // (Amendement flux bonheur : flux COUPÉ pour isoler le contrat
  //  scolaire — à proba 0, tout déplacement résiduel serait un bug.)
  C.p.migrationBonheurMax = 0
  const p0 = state.players[0]
  const p1 = state.players[1]
  // La ville de p0 n'a AUCUN Professeur ; celle de p1 en a un —
  //  l'ancienne mécanique (10 %/2 %/1 %) avait toutes ses cibles.
  state.population[p0.n] = [
    perso('c1', 10, { ville: p0.villes[0].nom }),
    perso('c2', 12, { ville: p0.villes[0].nom }),
    perso('ad1', 30, { ville: p0.villes[0].nom }),
  ]
  state.population[p1.n] = [
    perso('prof1', 40, { metier: C.p.metierProfesseur, ville: p1.villes[0].nom }),
  ]
  // 20 tours : à 10 %/tour et 2 enfants, l'ancienne mécanique serait
  //  intervenue des dizaines de fois — ici, RIEN ne doit bouger.
  for (let t = 0; t < 20; t++) runTurn(state)
  const pop0 = state.population[p0.n]
  const c1 = pop0.find((c) => c.id === 'c1')
  const c2 = pop0.find((c) => c.id === 'c2')
  assert.ok(c1, 'c1 est toujours dans la population de son joueur')
  assert.ok(c2, 'c2 est toujours dans la population de son joueur')
  assert.equal(c1?.ville, p0.villes[0].nom, 'à flux bonheur coupé, c1 ne bouge pas')
  assert.equal(c2?.ville, p0.villes[0].nom, 'à flux bonheur coupé, c2 ne bouge pas')
  // Aucune trace de scolarité dans tout le journal de 20 tours.
  const scol = state.log.filter((e) => e.texte.includes('scolarité'))
  assert.deepEqual(scol, [], 'plus aucune entrée « scolarité » au journal')
})

test('retrait migration scolaire : les paramètres restent comme REFLIS (configs sauvegardées)', () => {
  const C = cfgOf()
  assert.equal(C.p.migrationEcole, 0.10, 'REFLI : la valeur historique survit pour les configs existantes')
  assert.equal(C.p.migrationSuzerain, 0.02)
  assert.equal(C.p.migrationMonde, 0.01)
})
