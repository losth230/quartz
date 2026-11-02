// ═════════════════════════════════════════════════════════════════════════
//  TESTS DU PÈLERINAGE — DÎME DU PONTIFE (bonus du pontife, 2026-11-01)
//
//  Arbitrages Thibaut du 2026-11-01 verrouillés ici :
//   1. ACTIVATION : la dîme ne s'applique qu'aux cultures ayant AU
//      MOINS un dogme pris — pas de culte établi, pas de dîme.
//   2. EXACTITUDE : pelerinageTaux (défaut 5 %) de TOUTE la
//      production de chaque habitation de la culture — Or,
//      Nourriture, Science (lecture productionVille, part positive
//      seulement) — PRÉLÈVEMENT RÉEL : les stocks des payeurs
//      baissent d'exactement la part, le pontife reçoit la somme.
//   3. TAUX PARAMÉTRABLE : éditer le paramètre change la dîme.
//   4. LE PONTIFE PAIE AUSSI : ses habitations comptent dans les
//      versements (net nul chez lui à production égale).
//   5. LE PONTIFE CHANGE : le destinataire est évalué AU MOMENT du
//      prélèvement — le flux suit le siège, pas la personne.
//   6. LES CULTURES SANS DOGME NE PAIENT RIEN.
//   7. C'EST UNE DÎME, PAS UNE TAXE : aucun multiplicateur de taxes
//      ne s'applique (verrou : le montant est EXACTEMENT taux ×
//      production, sans aucun bonus).
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Player, City, GameState } from './types'
import { cfgOf } from './gameData'
import { createGame } from './setup'
import type { SetupLine } from './setup'
import { productionVille, productionDetaillee } from './production'
import { runTurn } from './tour'
import {
  preleverPelerinage, dimeCulture, pelerinageJoueur, culturesDimieres,
  RESSOURCES_PELERINAGE,
} from './pelerinage'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique',
  regime: 'Autoritarisme', taillePopulation: 10, pourcentageMariages: 40,
  villes: ['Bergen'],
}]

const AUTRES_J1 = [
  { ressource: 'Or', source: 'Dîme-test', nombre: 20, bonus: 1 },
  { ressource: 'Nourriture', source: 'Dîme-test', nombre: 10, bonus: 1 },
  { ressource: 'Science', source: 'Dîme-test', nombre: 4, bonus: 1 },
]
const AUTRES_J2 = [
  { ressource: 'Or', source: 'Dîme-test', nombre: 40, bonus: 1 },
  { ressource: 'Nourriture', source: 'Dîme-test', nombre: 8, bonus: 1 },
  { ressource: 'Science', source: 'Dîme-test', nombre: 2, bonus: 1 },
]

/** Partie DE DÉTERMINISME TOTAL : deux joueurs fantômes (population
 *  VIDE, production de base nulle, stocks connus) avec chacun UNE
 *  ville de la Culture Nordique. J1 porte un Conjuratoire (Tourisme
 *  → pontife) et une production Or 20 / Nourr 10 / Science 4 par
 *  lignes « Autres » ; J2 porte Or 40 / Nourr 8 / Science 2 et
 *  AUCUN Tourisme. J3 porte une ville Déisme (culture sans dogme)
 *  avec de la production — témoin « qui ne paie pas ». */
function partiePelerinage(): { state: GameState; C: ReturnType<typeof cfgOf>; j1: Player; j2: Player; j3: Player } {
  const state = createGame(SETUP, 20261101, 'local')
  const C = cfgOf(state.config)
  const base = state.players[0]
  const j1 = joueurVille(base, 1, 'Culture Nordique', ['Conjuratoire'], AUTRES_J1)
  const j2 = joueurVille(base, 2, 'Culture Nordique', [], AUTRES_J2)
  const j3 = joueurVille(base, 3, 'Déisme', [], AUTRES_J2)
  state.players = [j1, j2, j3]
  state.population[1] = []
  state.population[2] = []
  state.population[3] = []
  for (const q of state.players) {
    for (const [res, rs] of Object.entries(q.resources)) {
      rs.prod = 0
      // stocks neutres : 0 partout SAUF les ressources dimées (le
      //  Bétail en stock rapporterait 4 Nourriture/tour — canal
      //  « Autres » joueur — et fausserait les exactitudes).
      rs.stock = res === 'Or' || res === 'Nourriture' || res === 'Science' ? 100 : 0
    }
  }
  // pré-condition : les fantômes produisent exactement leurs lignes
  //  « Autres » (Or, Nourr, Science) et J1 seul porte du Tourisme.
  const prodJ1 = productionVille(state, j1, j1.villes[0] as City, C).total
  assert.equal(prodJ1['Or'], 20, 'pré-condition : J1 produit 20 Or (lignes Autres)')
  assert.equal(prodJ1['Nourriture'], 10, 'pré-condition : J1 produit 10 Nourriture')
  assert.equal(prodJ1['Science'], 4, 'pré-condition : J1 produit 4 Science')
  assert.ok((prodJ1['Tourisme'] ?? 0) > 0, 'pré-condition : le Conjuratoire donne du Tourisme à J1')
  assert.equal((productionVille(state, j2, j2.villes[0] as City, C).total['Tourisme'] ?? 0), 0,
    'pré-condition : J2 ne porte aucun Tourisme')
  return { state, C, j1, j2, j3 }
}

function joueurVille(
  base: Player, n: number, culture: string, batiments: string[], autres: { ressource: string; source: string; nombre: number; bonus: number }[],
): Player {
  const ville: City = { ...base.villes[0], nom: `Ville-${n}`, culture, batiments, autres }
  // ATTENTION : { ...base } partagerait `resources` entre tous les
  //  fantômes ET le joueur d'origine (copie superficielle) — les
  //  prélèvements de l'un toucheraient le stock de l'autre. Clone
  //  PROFOND des ressources par joueur.
  const resources = JSON.parse(JSON.stringify(base.resources))
  return { ...base, n, nom: `Joueur ${n}`, villes: [ville], resources } as unknown as Player
}

/** Prend le 1er dogme de la Culture Nordique (activation de la dîme). */
function prendrePremierDogme(state: GameState) {
  state.dogmes = [
    { culture: 'Culture Nordique', palier: 50, nom: 'Dogme A', choisiPar: 1, choisiAuTour: 0 },
  ]
}

const stock = (p: Player, res: string) => p.resources[res]?.stock ?? 0

test('pelerinage — pas de culte établi : aucune culture sans dogme ne paie ni ne verse', () => {
  const { state, C, j1, j2, j3 } = partiePelerinage()
  assert.deepEqual(culturesDimieres(state), [], 'aucune culture dimière sans dogme')
  const dimes = preleverPelerinage(state, C)
  assert.equal(dimes.length, 0, 'aucune dîme sans dogme')
  assert.equal(stock(j1, 'Or'), 100, 'J1 inchangé')
  assert.equal(stock(j2, 'Or'), 100, 'J2 inchangé')
  assert.equal(stock(j3, 'Or'), 100, 'J3 (culture sans dogme) inchangé')
  assert.ok(!state.log.some((l) => l.texte.includes('Pèlerinage')), 'aucun log de pèlerinage')
})

test('pelerinage — prélèvement réel exact : 5 % de la production Or+Nourr+Science, un log par versement (arbitrages 1-2)', () => {
  const { state, C, j1, j2, j3 } = partiePelerinage()
  prendrePremierDogme(state)
  const taux = C.p.pelerinageTaux
  assert.equal(taux, 0.05, 'défaut verrouillé : dîme de 5 %')
  const avant1 = stock(j1, 'Or'), avant2 = stock(j2, 'Or')
  const dimes = preleverPelerinage(state, C)
  assert.equal(dimes.length, 1, 'une seule culture dimière (Nordique)')
  const dime = dimes[0]!
  assert.equal(dime.culture, 'Culture Nordique')
  assert.equal(dime.pontife.n, 1, 'J1 (seul Tourisme de la culture) est le pontife')
  assert.equal(dime.versements.length, 2, 'DEUX versements : J2 ET J1 (le pontife paie aussi — arbitrage n°1)')
  // J2 payeur : parts exactes, SANS aucun multiplicateur (dîme ≠ taxe)
  assert.equal(stock(j2, 'Or'), avant2 - 40 * taux, 'J2 paie exactement 5 % de ses 40 Or')
  assert.equal(stock(j2, 'Nourriture'), 100 - 8 * taux, 'J2 paie 5 % de ses 8 Nourriture')
  assert.equal(stock(j2, 'Science'), 100 - 2 * taux, 'J2 paie 5 % de ses 2 Science')
  // J1 pontife-payeur : débit de SA part puis crédit du TOTAL reçu
  //  (accumulé dans l ordre des versements : J1 puis J2) — même ordre
  //  d opérations que le moteur (exactitude flottante bit à bit).
  assert.equal(stock(j1, 'Or'), (avant1 - 20 * taux) + (20 * taux + 40 * taux),
    'J1 : dîme reçue des DEUX habitations − sa propre part (net +40 × taux)')
  // J3 témoin : culture sans dogme, rien ne bouge
  assert.equal(stock(j3, 'Or'), 100, 'J3 (Déisme, sans dogme) ne paie RIEN')
  // Visibilité : UN LOG PAR VERSEMENT
  const logs = state.log.filter((l) => l.texte.includes('🕯 Pèlerinage'))
  assert.equal(logs.length, 2, 'un log par versement (J1 et J2)')
  assert.ok(logs.every((l) => l.texte.includes('Joueur 1') && l.texte.includes('Culture Nordique')),
    'chaque log nomme le pontife destinataire et la culture')
  assert.ok(logs.some((l) => l.joueur === 2), 'le log du versement de J2 est signé J2')
})

test('pelerinage — taux paramétrable : éditer pelerinageTaux change la dîme au prochain prélèvement (arbitrage 3)', () => {
  const { state, C, j2 } = partiePelerinage()
  prendrePremierDogme(state)
  C.p.pelerinageTaux = 0.1
  const avant = stock(j2, 'Or')
  preleverPelerinage(state, C)
  assert.equal(stock(j2, 'Or'), avant - 40 * 0.1, 'taux 10 % : J2 paie 4 Or')
})

test('pelerinage — le pontife est évalué AU PRÉLÈVEMENT : un changement de pontife déroute la dîme dès le tour suivant (arbitrage 5)', () => {
  const { state, C, j1, j2 } = partiePelerinage()
  prendrePremierDogme(state)
  // tour 1 : J1 est le pontife (un Conjuratoire)
  preleverPelerinage(state, C)
  assert.equal(dimeCulture(state, 'Culture Nordique', C)!.pontife.n, 1, 'tour 1 : pontife J1')
  // J2 devient pontife : DEUX Conjuratoires battent un seul
  ;(j2.villes[0] as City).batiments = ['Conjuratoire', 'Conjuratoire']
  assert.equal(dimeCulture(state, 'Culture Nordique', C)!.pontife.n, 2,
    'le pontife suit le Tourisme : J2 prend le siège')
  const avant1 = stock(j1, 'Or'), avant2 = stock(j2, 'Or')
  preleverPelerinage(state, C)
  // J1 n'est plus que payeur ; J2 reçoit tout (débit de sa part puis
  //  crédit du total reçu, accumulé J1 puis J2 — ordre du moteur).
  assert.equal(stock(j1, 'Or'), avant1 - 20 * C.p.pelerinageTaux, 'J1 paie sa part, ne reçoit plus rien')
  assert.equal(stock(j2, 'Or'), (avant2 - 40 * C.p.pelerinageTaux) + (20 * C.p.pelerinageTaux + 40 * C.p.pelerinageTaux),
    'J2 : reçoit les deux versements, moins sa propre part')
})

test('pelerinage — production déficitaire : une ville qui consomme plus qu elle ne produit n est pas dimée', () => {
  const { state, C, j1 } = partiePelerinage()
  prendrePremierDogme(state)
  // la ville de J1 ne produit plus rien (lignes Autres retirées)
  ;(j1.villes[0] as City).autres = []
  const dime = dimeCulture(state, 'Culture Nordique', C)
  assert.ok(dime, 'la dîme existe dès qu un dogme est pris')
  assert.equal(dime!.versements.length, 1, 'seul J2 verse (J1 ne produit plus)')
  assert.ok(dime!.versements.every((v) => v.payeur.n !== 1), 'aucun versement de J1 : production nulle')
})

test('pelerinage — vue pelerinageJoueur : le canal du récap est le solde net (payée −, reçue +)', () => {
  const { state, C, j1, j2, j3 } = partiePelerinage()
  assert.deepEqual(pelerinageJoueur(state, j1, C), {}, 'sans dogme : canal vide')
  prendrePremierDogme(state)
  const taux = C.p.pelerinageTaux
  const v1 = pelerinageJoueur(state, j1, C)
  const v2 = pelerinageJoueur(state, j2, C)
  // le net du pontife-payeur = la somme des parts des AUTRES payeurs
  //  (sa propre part se neutralise EXACTEMENT dans l accumulation du
  //  moteur : −a puis +a) — même ordre d opérations, exactitude bit à bit.
  assert.equal(v1['Or'], 40 * taux, 'J1 : net positif = parts des autres payeurs')
  assert.equal(v1['Nourriture'], 8 * taux, 'J1 : Nourriture nette')
  assert.equal(v1['Science'], 2 * taux, 'J1 : Science nette')
  assert.equal(v2['Or'], -40 * taux, 'J2 : net négatif (payeur)')
  assert.deepEqual(pelerinageJoueur(state, j3, C), {}, 'J3 (culture sans dogme) : canal vide')
  // la vue ne MUTATE JAMAIS : les stocks n ont pas bougé
  assert.equal(stock(j1, 'Or'), 100, 'la vue ne prélève pas (J1 inchangé)')
  assert.equal(stock(j2, 'Or'), 100, 'la vue ne prélève pas (J2 inchangé)')
})

test('pelerinage — productionDetaillee porte le canal « Pèlerinage » compté dans le total (récap Pays)', () => {
  const { state, C, j1, j2 } = partiePelerinage()
  prendrePremierDogme(state)
  const taux = C.p.pelerinageTaux
  const d2 = productionDetaillee(state, j2, C)
  assert.equal(d2.pelerinage['Or'], -40 * taux, 'canal Pèlerinage de J2 : dîme payée')
  assert.equal(d2.total['Or'], 40 - 40 * taux, 'le total déduit la dîme (affichage = réel crédité)')
  const d1 = productionDetaillee(state, j1, C)
  assert.equal(d1.pelerinage['Or'], 40 * taux, 'canal Pèlerinage de J1 : solde net du pontife-payeur')
})

test('pelerinage — runTurn intègre l étape : stocks, log et canal « Pèlerinage » des apports (arbitrage « fin de tour, après productions »)', () => {
  const { state, C, j1, j2 } = partiePelerinage()
  prendrePremierDogme(state)
  const taux = C.p.pelerinageTaux
  runTurn(state)
  // la dîme s applique APRÈS le crédit des productions : J2 garde sa
  //  production (40 Or) MOINS sa dîme (2) — prélèvement réel.
  assert.equal(stock(j2, 'Or'), 100 + 40 - 40 * taux, 'J2 : production créditée − dîme')
  assert.equal(stock(j2, 'Nourriture'), 100 + 8 - 8 * taux, 'J2 : Nourriture créditée − dîme')
  assert.equal(stock(j2, 'Science'), 100 + 2 - 2 * taux, 'J2 : Science créditée − dîme')
  // J1 : production créditée, puis débit de sa part, puis crédit du
  //  total reçu (accumulé J1 puis J2) — ordre d opérations du moteur.
  assert.equal(stock(j1, 'Or'), ((100 + 20) - 20 * taux) + (20 * taux + 40 * taux), 'J1 : production + dîme nette reçue')
  assert.equal(stock(j1, 'Nourriture'), ((100 + 10) - 10 * taux) + (10 * taux + 8 * taux),
    'J1 : Nourriture créditée + dîme nette')
  assert.equal(stock(j1, 'Science'), ((100 + 4) - 4 * taux) + (4 * taux + 2 * taux),
    'J1 : Science créditée + dîme nette')
  // log du pèlerinage au tour suivant
  const logs = state.log.filter((l) => l.texte.includes('🕯 Pèlerinage'))
  assert.equal(logs.length, 2, 'deux logs (un par versement) au tour terminé')
  // canal « Pèlerinage » des apports du snapshot
  const ap2 = [...state.history].reverse().find((h) => h.joueur === 2)?.apports
  assert.ok(ap2, 'apports du tour pour J2')
  assert.equal(ap2!.pelerinage?.['Or'], -40 * taux, 'apports J2 : canal Pèlerinage négatif')
  const ap1 = [...state.history].reverse().find((h) => h.joueur === 1)?.apports
  assert.equal(ap1!.pelerinage?.['Or'], 40 * taux, 'apports J1 : solde net du pontife')
  // ressources dimées : uniquement Or, Nourriture, Science
  assert.deepEqual(
    [...new Set([...Object.keys(ap1!.pelerinage ?? {}), ...Object.keys(ap2!.pelerinage ?? {})])].sort(),
    [...RESSOURCES_PELERINAGE].sort(),
    'la dîme ne touche QUE Or, Nourriture, Science',
  )
})

test('pelerinage — le registre des dogmes ne touche pas au flux : un dogme de PLUS ne double pas la dîme (un seul flux par culture)', () => {
  const { state, C, j2 } = partiePelerinage()
  state.dogmes = [
    { culture: 'Culture Nordique', palier: 50, nom: 'Dogme A', choisiPar: 1, choisiAuTour: 0 },
    { culture: 'Culture Nordique', palier: 100, nom: 'Dogme B', choisiPar: 1, choisiAuTour: 0 },
  ]
  const avant = stock(j2, 'Or')
  preleverPelerinage(state, C)
  assert.equal(stock(j2, 'Or'), avant - 40 * C.p.pelerinageTaux,
    'deux dogmes pris : la dîme reste UNE par culture (elle n ouvre pas le culte deux fois)')
})

test('pelerinage — états dégradés : ressources absentes, villes absentes, log absent — pas de crash', () => {
  const { state, C, j1 } = partiePelerinage()
  prendrePremierDogme(state)
  // ressources supprimées sur le payeur (pattern scénario de dégradation du diag)
  const j1b: any = j1
  delete j1b.resources
  const dimes = preleverPelerinage(state, C)
  assert.equal(dimes.length, 1, 'la dîme est calculée même sur un état dégradé')
  assert.ok(state.log.some((l) => l.texte.includes('🕯 Pèlerinage')),
    'le log du versement de J2 (intact) est poussé sans crash')
  // villes supprimées : état dégradé hors contrat du moteur — le
  //  scénario « player.villes supprimé » du diag est déjà [ÉCHEC
  //  runTurn] AVANT le pèlerinage (« p.villes is not iterable »),
  //  le crash est le comportement documenté (normaliserEtat répare
  //  à l ingestion côté jeu).
  const s2 = partiePelerinage()
  prendrePremierDogme(s2.state)
  for (const q of s2.state.players) (q as any).villes = undefined
  assert.throws(() => preleverPelerinage(s2.state, s2.C),
    'état « villes supprimées » : crash documenté, comme le reste du moteur (diag [ÉCHEC])')
})
