// ═══════════════════════════════════════════════════════════════════════════
//  TESTS TAXES — arbitrage Thibaut 2026-10-28 « changement des taxes »
//
//   · facteurTaxes (villes) et facteurTaxesCite (cités libres) sont
//     PAR RESSOURCE : la Nourriture part du côté des naissances
//     (Faible ×taxNourrFaibles / Forte ×taxNourrHautes), toutes les
//     AUTRES ressources à l'envers (Faible ×taxOrFaibles / Forte
//     ×taxOrHautes) ; Moyenne ×1 partout ;
//   · detailGainsVille (moteur des villes, impôts manuels inclus) et
//     detailCiteLibre (transfert au suzerain) appliquent le facteur
//     ressource par ressource — le champ taxeMult des deux détails
//     est devenu un Record PAR RESSOURCE ;
//   · taxBirthFactor est INCHANGÉ (marqueur (z), reconfirmé par
//     l'arbitrage 2026-10-28 : les naissances partent du côté de la
//     Nourriture) ;
//   · défauts verrouillés : taxNourr* 1,25/0,75, taxOr* 0,75/1,25,
//     taxNaiss* 1,25/0,75 (avant l'arbitrage : taxOr* couvrait TOUTES
//     les ressources).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, City, CiteLibre, GameState } from './types'
import { cfgOf, type Cfg } from './gameData'
import { facteurTaxes, taxBirthFactor, detailGainsVille } from './economie'
import { facteurTaxesCite, detailCiteLibre } from './citesLibres'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

/** Personnage de test complet (même gabarit que metiers.test.ts). */
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

function partie(): GameState {
  return createGame(SETUP, 20261028, 'local')
}

test('facteurTaxes : PAR RESSOURCE — Nourriture du côté des naissances, autres ressources à l\'envers', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const base: City = { ...state.players[0].villes[0], type: 'Ville', amenagements: [] }
  const faible: City = { ...base, taxes: 'Faible' }
  const moyenne: City = { ...base, taxes: 'Moyenne' }
  const forte: City = { ...base, taxes: 'Forte' }
  // Faible : Nourriture ×1,25 (taxNourrFaibles), Or ×0,75 (taxOrFaibles)
  assert.equal(facteurTaxes(faible, C, 'Nourriture'), C.p.taxNourrFaibles)
  assert.equal(facteurTaxes(faible, C, 'Or'), C.p.taxOrFaibles)
  assert.equal(facteurTaxes(faible, C, 'Bois'), C.p.taxOrFaibles, 'toute ressource hors Nourriture passe par taxOr*')
  // Forte : l'inverse
  assert.equal(facteurTaxes(forte, C, 'Nourriture'), C.p.taxNourrHautes)
  assert.equal(facteurTaxes(forte, C, 'Or'), C.p.taxOrHautes)
  // Moyenne : ×1 partout
  assert.equal(facteurTaxes(moyenne, C, 'Nourriture'), 1)
  assert.equal(facteurTaxes(moyenne, C, 'Or'), 1)
  // Défauts de l'arbitrage 2026-10-28 verrouillés
  assert.equal(C.p.taxNourrFaibles, 1.25, 'Faible : Nourriture ×1,25')
  assert.equal(C.p.taxNourrHautes, 0.75, 'Forte : Nourriture ×0,75')
  assert.equal(C.p.taxOrFaibles, 0.75, 'Faible : autres ressources ×0,75')
  assert.equal(C.p.taxOrHautes, 1.25, 'Forte : autres ressources ×1,25')
})

test('facteurTaxesCite : PAR RESSOURCE, mêmes facteurs qu\'une ville (absent = Moyenne)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const base: CiteLibre = { nom: 'Cité', type: 'Industrielles - Ville' }
  const faible: CiteLibre = { ...base, taxes: 'Faible' }
  const forte: CiteLibre = { ...base, taxes: 'Forte' }
  assert.equal(facteurTaxesCite(faible, C, 'Nourriture'), C.p.taxNourrFaibles)
  assert.equal(facteurTaxesCite(faible, C, 'Or'), C.p.taxOrFaibles)
  assert.equal(facteurTaxesCite(forte, C, 'Nourriture'), C.p.taxNourrHautes)
  assert.equal(facteurTaxesCite(forte, C, 'Or'), C.p.taxOrHautes)
  // taxes absent d'une vieille sauvegarde → Moyenne ×1
  assert.equal(facteurTaxesCite(base, C, 'Nourriture'), 1)
  assert.equal(facteurTaxesCite(base, C, 'Or'), 1)
})

test('detailGainsVille : Faible = Nourriture ×1,25 mais Or ×0,75 ; Forte = l\'inverse (taxeMult PAR RESSOURCE)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  // 3 Chasseurs (Nourriture) + 2 Commerçants (Or), adultes roturiers
  state.population[p.n] = [
    perso('ch1', 30, { metier: C.p.metierChasseur }),
    perso('ch2', 35, { metier: C.p.metierChasseur }),
    perso('ch3', 40, { metier: C.p.metierChasseur }),
    perso('co1', 30, { metier: 'Commerçant' }),
    perso('co2', 45, { metier: 'Commerçant' }),
  ]
  const base = p.villes[0]
  const dM = detailGainsVille(state, p, { ...base, taxes: 'Moyenne' }, C)
  const dF = detailGainsVille(state, p, { ...base, taxes: 'Faible' }, C)
  const dH = detailGainsVille(state, p, { ...base, taxes: 'Forte' }, C)
  assert.ok(dM.taxes['Nourriture'] && dM.taxes['Or'], 'la ville produit bien Nourriture ET Or')
  // Faible : Nourriture ×1,25, Or ×0,75 (rapport exact au Moyenne)
  assert.equal(dF.taxes['Nourriture'], dM.taxes['Nourriture'] * C.p.taxNourrFaibles)
  assert.equal(dF.taxes['Or'], dM.taxes['Or'] * C.p.taxOrFaibles)
  // Forte : l'inverse
  assert.equal(dH.taxes['Nourriture'], dM.taxes['Nourriture'] * C.p.taxNourrHautes)
  assert.equal(dH.taxes['Or'], dM.taxes['Or'] * C.p.taxOrHautes)
  // Le champ taxeMult est bien PAR RESSOURCE
  assert.equal(dF.taxeMult['Nourriture'], C.p.taxNourrFaibles)
  assert.equal(dF.taxeMult['Or'], C.p.taxOrFaibles)
  assert.equal(dM.taxeMult['Nourriture'], 1)
  assert.equal(dM.taxeMult['Or'], 1)
})

test('detailCiteLibre : le transfert au suzerain suit les mêmes facteurs PAR RESSOURCE', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const population: Character[] = [
    perso('ch1', 30, { metier: C.p.metierChasseur }),
    perso('ch2', 35, { metier: C.p.metierChasseur }),
    perso('co1', 40, { metier: 'Commerçant' }),
  ]
  const base: CiteLibre = { nom: 'Cité', type: 'Industrielles - Ville', population }
  const dM = detailCiteLibre({ ...base, taxes: 'Moyenne' }, C)
  const dF = detailCiteLibre({ ...base, taxes: 'Faible' }, C)
  const dH = detailCiteLibre({ ...base, taxes: 'Forte' }, C)
  assert.ok(dM.taxes['Nourriture'] && dM.taxes['Or'], 'la cité produit bien Nourriture ET Or')
  // Faible : Nourriture ×1,25, Or ×0,75 (règle ×1,1 des Chasseurs de cité
  //  comprise dans la production brute, le facteur de taxe s'applique après)
  assert.equal(dF.taxes['Nourriture'], dM.taxes['Nourriture'] * C.p.taxNourrFaibles)
  assert.equal(dF.taxes['Or'], dM.taxes['Or'] * C.p.taxOrFaibles)
  // Forte : l'inverse
  assert.equal(dH.taxes['Nourriture'], dM.taxes['Nourriture'] * C.p.taxNourrHautes)
  assert.equal(dH.taxes['Or'], dM.taxes['Or'] * C.p.taxOrHautes)
  // taxeMult PAR RESSOURCE dans le détail des cités
  assert.equal(dF.taxeMult['Nourriture'], C.p.taxNourrFaibles)
  assert.equal(dF.taxeMult['Or'], C.p.taxOrFaibles)
})

test('taxBirthFactor : inchangé — naissances du côté de la Nourriture (marqueur (z), reconfirmé 2026-10-28)', () => {
  const state = partie()
  const C: Cfg = cfgOf(state.config)
  const base: City = { ...state.players[0].villes[0], type: 'Ville', amenagements: [] }
  assert.equal(taxBirthFactor({ ...base, taxes: 'Faible' }, C), C.p.taxNaissFaibles)
  assert.equal(taxBirthFactor({ ...base, taxes: 'Moyenne' }, C), 1)
  assert.equal(taxBirthFactor({ ...base, taxes: 'Forte' }, C), C.p.taxNaissHautes)
  assert.equal(taxBirthFactor(undefined, C), 1, 'sans ville : ×1')
  // Défauts verrouillés : naissances ×1,25 en Faible, ×0,75 en Forte
  assert.equal(C.p.taxNaissFaibles, 1.25)
  assert.equal(C.p.taxNaissHautes, 0.75)
})
