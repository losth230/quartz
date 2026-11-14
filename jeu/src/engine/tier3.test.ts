// ═══════════════════════════════════════════════════════════════════════════
//  TESTS VAGUE TIER 3 — Barraquements, Responsable des voies, Banlieue,
//  Complexe d'exploitation maritime, Usine, Plateforme commerciale,
//  Commanderie, Ecole supérieure, Institut de recherche, Hôpital et
//  les 6 guildes (arbitrage Thibaut 2026-11-03)
//
//  Arbitrages actés :
//   · règle « le REMPLACÉ ne compte plus » GÉNÉRALISÉE aux valeurs
//     d'état : nouvelle primitive batimentsActifsVille, branchée dans
//     emplacementsMetierVille (caps), maxRoutesJoueur (routes),
//     domicilesApportesVille (domiciles) — sans elle, Complexe + Guilde
//     des marins = cap 64 au lieu de 40 ;
//   · modificateurs de PAYS (modificateursPaysJoueur) : production des
//     Bourgeois ×1,5 (Guilde des bourgeois, CUMUL multiplicatif avec
//     le rang bourgeois ×1,5 → ×2,25 par instance), +0,5 Or par
//     Commerçant (Guilde des marins, patron Ponton), revenus du
//     commerce ×1,5 (Guilde des marchands, source unique
//     effetsCommerceJoueur), +5 % de tribut vassal (Guilde des
//     diplomates, les DEUX chemins du tribut), +10 % de conversion
//     vers la culture de la ville (Guilde des évangélistes, pattern
//     Nationalisme conversionLocale), Science des Professeurs +5 %
//     (Guilde des savants, part 0,10 → 0,15) ;
//   · effets de PLATEAU (Responsable des voies : PM ; Guilde des
//     marchands : portée +6 cases) : texte d'AFFICHAGE uniquement
//     (effetPlateau), la portée se règle à la main — aucun test
//     moteur ne les verrouille.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, City, GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { emptyRecap } from './shared'
import { rangDe } from './statutSocial'
import {
  batimentsActifsVille, modificateursPaysJoueur, emissairesConstructionsJoueur,
} from './batiments'
import { detailGainsVille, impotsVassaux } from './economie'
import { effetsCommerceJoueur, maxRoutesJoueur, creerRouteCommerce } from './commerce'
import { capMetierVille } from './metiers'
import { transfererTributVassal } from './vassalite'
import { applyCultureInfluence, detailConversionVille } from './culture'
import { constructionRef, resumeConstruction } from './constructions'
import { normaliserEtat } from './villes'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

function partie(): GameState {
  return createGame(SETUP, 20261020, 'local')
}

/** Château de test avec les bâtiments donnés (patron emissaires.test.ts). */
function chateau(p: Player, batiments: string[]): City {
  return { ...p.villes[0], type: 'Château', rang: 'Forteresse', batiments, amenagements: [] }
}

/** Ville de test avec les bâtiments donnés (patron emissaires.test.ts). */
function villeTest(p: Player, batiments: string[]): City {
  return { ...p.villes[0], type: 'Ville', rang: 'Grande Cité', batiments, amenagements: [] }
}

/** Personnage de test complet (même contrat que metiers.test.ts —
 *  tuples de 3 traits pour la CI tsc strict), prestige paramétrable
 *  (150 = bourgeois pour la Culture Nordique, seuil 100). */
function perso(id: string, age: number, o: { metier?: string | null; ville?: string; prestige?: number } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'F', age,
    culture: 'Culture Nordique', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
    prestige: o.prestige ?? 0,
  }
}

/** Rng factice configurable (patron dogmes.test.ts) — le cast final
 *  évite d implémenter les 8 faces de l interface. */
function fakeRng(o: {
  chance?: (p: number) => boolean
  pickWeighted?: <T>(items: T[], weight: (t: T) => number) => T
}): Rng {
  return {
    chance: o.chance ?? (() => false),
    pickWeighted: o.pickWeighted ?? ((items) => items[0]!),
  } as unknown as Rng
}

// ── Test 1 : modificateursPaysJoueur (agrégat de pays) ───────────────────

test('modificateursPaysJoueur (tier 3) : neutre sans guilde ; bourgeois ×1,5 (×2,25 deux) ; diplomates tribut +0,05 et émissaires +7 (l Ambassade neutralisée) ; évangélistes conversion +0,1', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]

  // sans bâtiment : toutes les identités (multiplicateurs à 1, parts à 0)
  const vide = modificateursPaysJoueur(p, C)
  assert.equal(vide.multProductionBourgeois, 1, 'sans guilde : production Bourgeois ×1')
  assert.equal(vide.multRevenusCommerce, 1, 'sans guilde : commerce ×1')
  assert.equal(vide.tributVassalPlus, 0, 'sans guilde : pas de tribut en plus')
  assert.equal(vide.conversionLocalePlus, 0, 'sans guilde : pas de conversion en plus')
  assert.equal(vide.scienceProfesseurPlus, 0, 'sans guilde : pas de part Science en plus')
  assert.equal(vide.bonusMetierParHabitant.length, 0, 'sans guilde : aucun bonus par habitant')

  // un bâtiment sans modificateur (Chapelle) ne change rien
  p.villes[0] = chateau(p, ['Chapelle'])
  const neutre = modificateursPaysJoueur(p, C)
  assert.equal(neutre.multProductionBourgeois, 1, 'Chapelle : neutre')

  // Guilde des bourgeois : ×1,5 ; DEUX instances (2 villes) : ×2,25 —
  //  cumul MULTIPLICATIF par bâtiment présent, toutes villes
  p.villes[0] = chateau(p, ['Guilde des bourgeois'])
  assert.equal(modificateursPaysJoueur(p, C).multProductionBourgeois, 1.5,
    'une Guilde des bourgeois : ×1,5')
  p.villes.push({ ...chateau(p, ['Guilde des bourgeois']), nom: 'Second' })
  assert.equal(modificateursPaysJoueur(p, C).multProductionBourgeois, 2.25,
    'deux Guildes des bourgeois (2 villes) : ×2,25 (cumul multiplicatif)')

  // Guilde des diplomates : tribut +0,05 ET +7 émissaires — l'Ambassade
  //  (+4) qu'elle REMPLACE ne compte plus (règle du tour 2026-11-03)
  p.villes[1] = { ...chateau(p, ['Ambassade', 'Guilde des diplomates']), nom: 'Second' }
  const avecDiplomates = modificateursPaysJoueur(p, C)
  assert.ok(Math.abs(avecDiplomates.tributVassalPlus - 0.05) < 1e-9,
    'Guilde des diplomates : +5 % de tribut vassal')
  assert.equal(emissairesConstructionsJoueur(p, C), 7,
    'Guilde des diplomates : +7 émissaires (le +4 de l Ambassade neutralisée ne compte plus)')

  // Guilde des évangélistes : conversion locale +0,1
  p.villes[0] = chateau(p, ['Guilde des évangélistes'])
  assert.ok(Math.abs(modificateursPaysJoueur(p, C).conversionLocalePlus - 0.1) < 1e-9,
    'Guilde des évangélistes : +10 % de conversion locale')

  // Guilde des savants : part Science des Professeurs +0,05
  p.villes[0] = chateau(p, ['Guilde des savants'])
  assert.ok(Math.abs(modificateursPaysJoueur(p, C).scienceProfesseurPlus - 0.05) < 1e-9,
    'Guilde des savants : part Science des Professeurs +5 %')

  // Guilde des marins : bonus PAR HABITANT +0,5 Or par Commerçant
  p.villes[0] = villeTest(p, ['Guilde des marins'])
  const marins = modificateursPaysJoueur(p, C)
  assert.equal(marins.bonusMetierParHabitant.length, 1, 'Guilde des marins : 1 bonus par habitant')
  assert.equal(marins.bonusMetierParHabitant[0]?.metier, 'Commerçant')
  assert.equal(marins.bonusMetierParHabitant[0]?.ressource, 'Or')
  assert.ok(Math.abs((marins.bonusMetierParHabitant[0]?.valeur ?? 0) - 0.5) < 1e-9,
    'Guilde des marins : +0,5 Or par Commerçant')
})

// ── Test 2 : batimentsActifsVille — la règle « le remplacé ne compte
//    plus » GÉNÉRALISÉE (caps, routes) ────────────────────────────────────

test('batimentsActifsVille (tier 3) : le remplacé ne compte plus pour les CAPS (Complexe → Guilde des marins : +16, pas +40 ; Ecole intermédiaire → supérieure : +2/+1) ni pour les ROUTES (Place + Guilde des marchands : +3, pas +5)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]

  // Complexe d'exploitation maritime seul : actif, cap Commerçant = base + 24
  p.villes[0] = villeTest(p, ['Complexe d\'exploitation maritime'])
  assert.equal(batimentsActifsVille(p.villes[0], C).join(), 'Complexe d\'exploitation maritime',
    'Complexe seul : actif')
  const capComplexe = capMetierVille('Commerçant', p.villes[0], C)

  // Complexe + Guilde des marins : SEULE la guilde compte (cap 40, pas 64)
  p.villes[0] = villeTest(p, ['Complexe d\'exploitation maritime', 'Guilde des marins'])
  assert.equal(batimentsActifsVille(p.villes[0], C).join(), 'Guilde des marins',
    'le Complexe neutralisé par la Guilde des marins ne compte plus')
  const capGuilde = capMetierVille('Commerçant', p.villes[0], C)
  assert.equal(capGuilde - capComplexe, 16,
    `cap Commerçant : +40 − 24 = +16 (obtenu ${capGuilde - capComplexe}) — pas +40`)

  // Ecole intermédiaire → Ecole supérieure : Professeurs 2→4, Scientifiques 1→2
  p.villes[0] = chateau(p, ['Ecole intermédiaire'])
  const capProfInt = capMetierVille('Professeur', p.villes[0], C)
  const capSciInt = capMetierVille('Scientifique', p.villes[0], C)
  p.villes[0] = chateau(p, ['Ecole intermédiaire', 'Ecole supérieure'])
  assert.equal(capMetierVille('Professeur', p.villes[0], C) - capProfInt, 2,
    'Ecole supérieure : delta Professeur +2 (4 − 2), pas +4 (l intermédiaire neutralisée)')
  assert.equal(capMetierVille('Scientifique', p.villes[0], C) - capSciInt, 1,
    'Ecole supérieure : delta Scientifique +1 (2 − 1), pas +2')

  // maxRoutesJoueur : Place du marché (+1) + Plateforme (+2) = +3 ;
  //  Place + Guilde des marchands (remplace la Plateforme) = +3 AUSSI
  const base = { ...p, villes: [villeTest(p, [])] } as unknown as Player
  const capRoutesBase = maxRoutesJoueur(base, C)
  p.villes[0] = villeTest(p, ['Place du marché', 'Plateforme commerciale'])
  const capRoutesPlateforme = maxRoutesJoueur(p, C)
  assert.equal(capRoutesPlateforme - capRoutesBase, 3, 'Place du marché + Plateforme : +3 routes')
  p.villes[0] = villeTest(p, ['Place du marché', 'Guilde des marchands'])
  const capRoutesGuilde = maxRoutesJoueur(p, C)
  assert.equal(capRoutesGuilde - capRoutesBase, 3,
    'Place du marché + Guilde des marchands : +3 routes (le +2 de la Plateforme neutralisée ne compte pas, pas +5)')
})

// ── Test 3 : detailGainsVille — production et taxes des guildes ──────────

test('detailGainsVille (tier 3) : Guilde des bourgeois ×1,5 EN PLUS du rang (chasseur bourgeois 2 → 3 → 4,5), Guilde des marins +0,5 Or par Commerçant, Guilde des savants part Science 0,10 → 0,15', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  p.villes[0] = villeTest(p, [])
  // population de la ville : Chasseurs roturier et bourgeois, un
  //  Commerçant roturier, un Scientifique et un Professeur (pour la
  //  part de taxe Science)
  state.population[p.n] = [
    perso('C1', 30, { metier: 'Chasseur', prestige: 0 }),
    perso('C2', 30, { metier: 'Chasseur', prestige: 150 }),
    perso('C3', 30, { metier: 'Commerçant', prestige: 0 }),
    perso('S1', 30, { metier: 'Scientifique', prestige: 0 }),
    perso('P1', 30, { metier: 'Professeur', prestige: 0 }),
  ]
  assert.equal(rangDe(state.population[p.n][1]!, C), 'bourgeois', 'pré-condition : prestige 150 = bourgeois')

  // sans guilde : chasseur roturier 2 + bourgeois ×1,5 = 3 → 5 Nourriture
  const sans = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(sans.metiers['Nourriture']! - 5) < 1e-9,
    `chasseurs 2 (roturier) + 3 (bourgeois ×1,5) = 5 Nourriture (obtenu ${sans.metiers['Nourriture']})`)
  assert.ok(Math.abs(sans.metiers['Or']! - 1) < 1e-9,
    `commerçant roturier : 1 Or (obtenu ${sans.metiers['Or']})`)
  assert.ok(Math.abs((sans.bonusTaxes['Science'] ?? 0) - 0.1) < 1e-9,
    'part de taxe Science du Professeur : 0,10')

  // Guilde des bourgeois DANS la ville : le bourgeois passe ×1,5×1,5 = 4,5
  p.villes[0] = villeTest(p, ['Guilde des bourgeois'])
  const avecBourgeois = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(avecBourgeois.metiers['Nourriture']! - 6.5) < 1e-9,
    `2 + 2×2,25 = 6,5 Nourriture (obtenu ${avecBourgeois.metiers['Nourriture']})`)

  // Guilde des marins dans une AUTRE ville : +0,5 Or par Commerçant du pays
  p.villes.push({ ...villeTest(p, ['Guilde des marins']), nom: 'Second' })
  const avecMarins = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(avecMarins.metiers['Or']! - 1.5) < 1e-9,
    `commerçant roturier : 1 + 0,5 = 1,5 Or (obtenu ${avecMarins.metiers['Or']})`)

  // Guilde des savants dans une autre ville : part Science 0,10 + 0,05
  p.villes[1] = { ...villeTest(p, ['Guilde des savants']), nom: 'Second' }
  const avecSavants = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs((avecSavants.bonusTaxes['Science'] ?? 0) - 0.15) < 1e-9,
    `part de taxe Science du Professeur : 0,15 (obtenu ${avecSavants.bonusTaxes['Science']})`)
})

// ── Test 4 : effetsCommerceJoueur — Guilde des marchands ×1,5 ────────────

test('effetsCommerceJoueur (tier 3) : Guilde des marchands — revenus du commerce ×1,5 (source unique stock + récap)', () => {
  const setups: SetupLine[] = [
    { nom: 'Copieur', peuple: 'Basiléens', culture: 'Communautarisme', regime: 'Monarchie',
      taillePopulation: 50, pourcentageMariages: 40, villes: ['Capitale A'] },
    { nom: 'Cible', peuple: 'Sylvains', culture: 'Déisme', regime: 'Démocratie',
      taillePopulation: 50, pourcentageMariages: 40, villes: ['Capitale B'] },
  ]
  const state = createGame(setups, 20261019, 'local')
  normaliserEtat(state)
  const copieur = state.players[0]
  const cible = state.players[1]
  const C = cfgOf(state.config)

  // route dissociée vers l'Hôtel de tourisme de la cible (patron
  //  commerce.test.ts) : le copieur touche le Tourisme copié
  const villeCible = cible.villes[0]
  villeCible.amenagements = [...(villeCible.amenagements ?? []), 'Hôtel de tourisme']
  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', cible.n, null, villeCible.nom, 'Hôtel de tourisme')
  assert.equal(err, null, `la route doit s ouvrir (obtenu : ${err})`)
  const sans = effetsCommerceJoueur(state, copieur, state.saison, C)['Tourisme'] ?? 0
  assert.ok(sans > 0, 'pré-condition : le commerce apporte du Tourisme')

  // la Guilde des marchands dans la ville d'origine : ×1,5 sur TOUTES
  //  les ressources du récap de commerce
  copieur.villes[0] = { ...copieur.villes[0], type: 'Ville', rang: 'Grande Cité',
    batiments: ['Guilde des marchands'], amenagements: [] }
  const avec = effetsCommerceJoueur(state, copieur, state.saison, C)['Tourisme'] ?? 0
  assert.ok(Math.abs(avec / sans - 1.5) < 1e-9,
    `Guilde des marchands : Tourisme du commerce ×1,5 (${sans} → ${avec})`)

  // la Plateforme commerciale REMPLACÉE ne compte pas : la guilde seule
  //  porte le ×1,5 (pas de double comptage si les deux sont présents)
  copieur.villes[0] = { ...copieur.villes[0],
    batiments: ['Plateforme commerciale', 'Guilde des marchands'] }
  const lesDeux = effetsCommerceJoueur(state, copieur, state.saison, C)['Tourisme'] ?? 0
  assert.ok(Math.abs(lesDeux / sans - 1.5) < 1e-9,
    'Plateforme + Guilde des marchands : toujours ×1,5 (le multiplicateur de la remplacée ne se cumule pas)')
})

// ── Test 5 : Guilde des diplomates — tribut vassal, les DEUX chemins ─────

test('Guilde des diplomates (tier 3) : +5 % de tribut vassal sur les DEUX chemins (fin de tour transfererTributVassal + impôt manuel impotsVassaux)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const suzerain = state.players[0]
  // joueur fantôme vassal (patron dogmes.test.ts — n commence à 1, le
  //  vassal prend n = 2)
  const vassal = { ...suzerain, n: 2, nom: 'Vassal', vassalDe: suzerain.n,
    villes: [{ ...chateau(suzerain, []), nom: 'Capitale V' }] } as unknown as Player
  state.players.push(vassal)
  state.population[2] = [perso('M1', 30, { metier: 'Commerçant', ville: 'Capitale V' })]

  // (a) fin de tour : sans la guilde, le suzerain reçoit la part du vassal
  const part = 100 * C.p.vassalPrelevement
  const gainsSans: Record<number, Record<string, number>> = { 2: { Or: 100 } }
  transfererTributVassal(state, gainsSans, C)
  const recuSans = gainsSans[suzerain.n]?.['Or'] ?? 0
  assert.ok(Math.abs(recuSans - part) < 1e-9,
    'sans guilde : le suzerain reçoit la part du vassal')

  // (b) impôt manuel : sans la guilde
  const impotsSans = impotsVassaux(state, suzerain, C)
  assert.equal(impotsSans.length, 1, 'le vassal rapporte (Commerçant : Or)')

  // la Guilde des diplomates chez le SUZERAIN : les deux chemins ×1,05
  suzerain.villes[0] = chateau(suzerain, ['Guilde des diplomates'])
  const gainsAvec: Record<number, Record<string, number>> = { 2: { Or: 100 } }
  transfererTributVassal(state, gainsAvec, C)
  const recuAvec = gainsAvec[suzerain.n]?.['Or'] ?? 0
  assert.ok(Math.abs(recuAvec / recuSans - 1.05) < 1e-9,
    'fin de tour : ×1,05 — le vassal paie SA part, la différence est CRÉÉE')
  assert.ok(Math.abs((gainsAvec[2]?.['Or'] ?? 0) - (100 - part)) < 1e-9,
    'le vassal paie toujours SA part (100 − part)')

  const impotsAvec = impotsVassaux(state, suzerain, C)
  assert.equal(impotsAvec.length, 1)
  assert.ok(impotsSans[0] && impotsAvec[0])
  assert.ok(Math.abs(impotsAvec[0]!.montant / impotsSans[0]!.montant - 1.05) < 1e-9,
    'impôt manuel : le même ×1,05')
})

// ── Test 6 : Guilde des évangélistes — conversion locale DANS le tirage ───

test('Guilde des évangélistes (tier 3) : +10 % de conversion vers la culture de la ville — DANS les forces du duel V2 (pattern Nationalisme), PAS de jet séparé', () => {
  // (V2 « Pression/Ancrage », arbitrage Thibaut 2026-11-14 : le bonus
  //  de la guilde vit dans les FORCES du duel par ville, lisibles via
  //  detailConversionVille — la conversion elle-même est déterministe.)
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  // habitant d'une AUTRE culture que la ville d'accueil (Culture
  //  Nordique) — seul cas où la conversion locale joue
  const habitant = perso('E1', 30, { ville: 'Capitale' })
  habitant.culture = 'Déisme'
  state.population[p.n] = [habitant]
  // la culture d'accueil doit avoir du POIDS dans la pression : on lui
  //  donne du Tourisme général (hors villes)
  p.resources['Tourisme'] = { stock: 10, prod: 0 }
  // guilde de TEST INJECTÉE dans le référentiel de la config (patron
  //  cultures.test.ts) : conversionLocalePlus 0,1 et effets VIDES — la
  //  vraie Guilde des évangélistes porte Tourisme +70 qui polluerait
  //  la pression touristique du test (son lecteur est verrouillé au
  //  test 1).
  C.config.constructions.push({
    categorie: 'Bâtiment', groupe: 'Château', famille: 'Guilde',
    nom: 'Guilde test conversion', cout: '', production: '', description: '',
    effets: [], rangMinHabitation: 3, conversionLocalePlus: 0.1, couts: [],
  })
  assert.ok(constructionRef('Guilde test conversion', C.config, 'Château'),
    'la guilde de test est au référentiel injecté')

  // sans la guilde dans la ville d'accueil : forces simples
  const forcesSans = { ...detailConversionVille(state, p, p.villes[0]!, C).forces }

  // la guilde arrive dans la ville d'ACCUEIL : +0,1 × force des autres
  //  cultures pour la culture d'accueil
  p.villes[0] = chateau(p, ['Guilde test conversion'])
  const detailAvec = detailConversionVille(state, p, p.villes[0]!, C)
  const autres = Object.entries(forcesSans).filter(([cult]) => cult !== 'Culture Nordique')
    .reduce((acc, [, f]) => acc + f.force, 0)
  const attendu = (forcesSans['Culture Nordique']?.force ?? 0) + 0.1 * autres
  assert.ok(Math.abs((detailAvec.forces['Culture Nordique']?.force ?? 0) - attendu) < 1e-9,
    'la culture d accueil gagne +0,1 × la force totale des autres cultures')
  // les autres forces ne bougent pas
  for (const [cult, f] of Object.entries(forcesSans)) {
    if (cult !== 'Culture Nordique') {
      assert.ok(Math.abs((detailAvec.forces[cult]?.force ?? 0) - f.force) < 1e-9,
        `la force de ${cult} est inchangée`)
    }
  }
  // la conversion est DÉTERMINISTE : l habitant peu ancré bascule vers
  //  la culture d accueil, SANS aucun jet rng
  let jets = 0
  applyCultureInfluence(state, p, fakeRng({ chance: () => { jets++; return true } }), emptyRecap())
  assert.equal(jets, 0, 'aucun jet rng en ville mixte — la conversion est déterministe')
  assert.equal(habitant.culture, 'Culture Nordique',
    'converti vers la culture d accueil par le duel déterministe dopé')
})

// ── Référentiel : libellés des guildes tier 3 (picker + wiki) ────────────

test('resumeConstruction (tier 3) : les modificateurs des guildes s affichent dans le résumé', () => {
  const C = cfgOf()
  const ref = (nom: string, groupe: string) => constructionRef(nom, C.config, groupe)

  const bourgeois = ref('Guilde des bourgeois', 'Ville')
  assert.ok(bourgeois, 'Guilde des bourgeois (Ville) au référentiel')
  assert.ok(resumeConstruction(bourgeois, C.config).includes('production des Bourgeois ×1.5'),
    `libellé : ${resumeConstruction(bourgeois, C.config)}`)

  const marins = ref('Guilde des marins', 'Ville')
  assert.ok(marins, 'Guilde des marins (Ville) au référentiel')
  assert.ok(resumeConstruction(marins, C.config).includes('commerçant +0.5 Or / habitant'),
    `libellé : ${resumeConstruction(marins, C.config)}`)

  const marchands = ref('Guilde des marchands', 'Ville')
  assert.ok(marchands, 'Guilde des marchands (Ville) au référentiel')
  const libMarchands = resumeConstruction(marchands, C.config)
  assert.ok(libMarchands.includes('revenus du commerce ×1.5'), `libellé : ${libMarchands}`)
  assert.ok(libMarchands.includes('+2 routes commerciales'), `libellé : ${libMarchands}`)
  assert.ok(libMarchands.includes('portée des routes commerciales du pays +6 cases'),
    `effet de plateau affiché : ${libMarchands}`)

  const diplomates = ref('Guilde des diplomates', 'Château')
  assert.ok(diplomates, 'Guilde des diplomates (Château) au référentiel')
  const libDiplomates = resumeConstruction(diplomates, C.config)
  assert.ok(libDiplomates.includes('+7 émissaires'), `libellé : ${libDiplomates}`)
  assert.ok(libDiplomates.includes('+5 % tribut vassal'), `libellé : ${libDiplomates}`)

  const evangelistes = ref('Guilde des évangélistes', 'Château')
  assert.ok(evangelistes, 'Guilde des évangélistes (Château) au référentiel')
  assert.ok(resumeConstruction(evangelistes, C.config).includes('+10 % conversion vers la culture de la ville'),
    `libellé : ${resumeConstruction(evangelistes, C.config)}`)

  const savants = ref('Guilde des savants', 'Château')
  assert.ok(savants, 'Guilde des savants (Château) au référentiel')
  assert.ok(resumeConstruction(savants, C.config).includes('Science des Professeurs +5 %'),
    `libellé : ${resumeConstruction(savants, C.config)}`)

  const voies = ref('Responsable des voies', 'Château')
  assert.ok(voies, 'Responsable des voies (Château) au référentiel')
  assert.ok(resumeConstruction(voies, C.config).includes('1 PM à franchir'),
    `effet de plateau affiché : ${resumeConstruction(voies, C.config)}`)

  // la Ecole supérieure remplace l intermédiaire et porte ecoleRang 3
  const ecoleSup = ref('Ecole supérieure', 'Château')
  assert.ok(ecoleSup, 'Ecole supérieure (Château) au référentiel')
  assert.deepEqual(ecoleSup?.remplaceBatiment, ['Ecole intermédiaire'])
  assert.equal(ecoleSup?.ecoleRang, 3, 'Ecole supérieure : rang d école 3')
})
