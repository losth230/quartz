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
  effetsBatimentsVille, effetsNourrEteBatimentsVille,
} from './batiments'
import { detailGainsVille, impotsVassaux } from './economie'
import { effetsCommerceJoueur, maxRoutesJoueur, creerRouteCommerce } from './commerce'
import { capMetierVille } from './metiers'
import { transfererTributVassal } from './vassalite'
import { applyCultureInfluence, calculPression, poidsConversion } from './culture'
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

  // maxRoutesJoueur : (RÈGLE PRÉREQUIS 2026-11-14) la Plateforme
  //  commerciale REMPLACE la Place du marché → +2 routes seul ;
  //  Place + Guilde des marchands = +3 (la Place reste active : la
  //  guilde remplace la Plateforme, pas la Place)
  const base = { ...p, villes: [villeTest(p, [])] } as unknown as Player
  const capRoutesBase = maxRoutesJoueur(base, C)
  p.villes[0] = villeTest(p, ['Place du marché', 'Plateforme commerciale'])
  const capRoutesPlateforme = maxRoutesJoueur(p, C)
  assert.equal(capRoutesPlateforme - capRoutesBase, 2,
    'Place du marché + Plateforme : +2 routes (la Plateforme remplace son prérequis, le +1 de la Place ne compte plus)')
  p.villes[0] = villeTest(p, ['Place du marché', 'Guilde des marchands'])
  const capRoutesGuilde = maxRoutesJoueur(p, C)
  assert.equal(capRoutesGuilde - capRoutesBase, 3,
    'Place du marché + Guilde des marchands : +3 routes (le +2 de la Plateforme neutralisée ne compte pas, pas +5)')
})

// ── Test 2bis (règle prérequis 2026-11-14) : le PRÉREQUIS est
//    remplacé par le bâtiment qui l'exige ────────────────────────────────

test('batimentsActifsVille (règle prérequis 2026-11-14) : le bâtiment exigé (champ requis) est REMPLACÉ par son successeur — Caserne ← Poste de garde, chaîne Echoppe → Guilde des marchands, deux branches Ponton coexistent', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  // Caserne (requis « Poste de garde ») : le prérequis neutralisé ne
  //  compte plus — retour Thibaut « les bâtiments de prérequis
  //  doivent remplacer le bâtiment de tier précédent »
  p.villes[0] = villeTest(p, ['Poste de garde', 'Caserne'])
  assert.equal(batimentsActifsVille(p.villes[0], C).join(), 'Caserne',
    'Caserne remplace son prérequis Poste de garde (les effets ne se cumulent pas)')
  // chaîne complète Echoppe → Place du marché → Plateforme
  //  commerciale → Guilde des marchands : seul le dernier maillon
  //  compte (chaque prérequis remplacé par son successeur, le
  //  remplacement explicite de la guilde en plus)
  p.villes[0] = villeTest(p, ['Echoppe', 'Place du marché', 'Plateforme commerciale', 'Guilde des marchands'])
  assert.equal(batimentsActifsVille(p.villes[0], C).join(), 'Guilde des marchands',
    'chaîne de prérequis : seuls les maillons non remplacés comptent')
  // deux successeurs du MÊME prérequis coexistent : Port de pêche
  //  et Port de commerce remplacent chacun le Ponton, pas l'un
  //  l'autre
  p.villes[0] = villeTest(p, ['Ponton', 'Port de pêche', 'Port de commerce'])
  assert.deepEqual(batimentsActifsVille(p.villes[0], C).sort(), ['Port de commerce', 'Port de pêche'],
    'le Ponton est neutralisé par ses deux successeurs, qui restent actifs tous les deux')
  // côté CHÂTEAU : même règle (Caserne [Château] requiert Poste de garde)
  p.villes[0] = chateau(p, ['Poste de garde', 'Caserne'])
  assert.equal(batimentsActifsVille(p.villes[0], C).join(), 'Caserne',
    'version Château : la Caserne remplace aussi son prérequis')
})

// ── Test 2ter (règle chaîne nourriture 2026-11-15) : la vraie chaîne
//    est grange → silo à grain → moulin à vent → guilde des artisans
//    de la terre — et la Guilde apporte +5 Nourriture en ÉTÉ ──────────

test('chaîne nourriture (règle 2026-11-15) : Grange → Silo à grain → Moulin à vent → Guilde des artisans de la terre — chaque maillon exige le précédent, la Guilde porte +5 Nourriture en ÉTÉ (canal « Nourr - été », jamais doublonné)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  // la chaîne d'exigence complète (champ requis) : Silo ← Grange,
  //  Moulin ← Silo, Guilde ← Moulin (le Moulin remplace déjà Silo ET
  //  Grange via remplaceBatiment explicite)
  assert.equal(constructionRef('Silo à grain', C.config)?.requis, 'Grange')
  assert.equal(constructionRef('Moulin à vent', C.config)?.requis, 'Silo à grain')
  assert.equal(constructionRef('Guilde des artisans de la terre', C.config)?.requis, 'Moulin à vent')
  // au fil de l'eau : chaque successeur neutralise son prérequis
  p.villes[0] = villeTest(p, ['Grange'])
  assert.deepEqual(effetsNourrEteBatimentsVille(p.villes[0], C), {}, 'Grange seule : aucun effet d été')
  p.villes[0] = villeTest(p, ['Silo à grain'])
  assert.deepEqual(effetsNourrEteBatimentsVille(p.villes[0], C), {}, 'Silo (a remplacé la Grange) : aucun effet d été')
  p.villes[0] = villeTest(p, ['Moulin à vent'])
  assert.deepEqual(effetsNourrEteBatimentsVille(p.villes[0], C), {}, 'Moulin (a remplacé Silo + Grange) : aucun effet d été')
  p.villes[0] = villeTest(p, ['Guilde des artisans de la terre'])
  // +5 Nourriture en ÉTÉ (arbitrage Thibaut 2026-11-15 « la guilde des
  //  artisans de la terre augmente de 5 la production de nourriture
  //  en été ») ; le Charbon −1 reste un flux NORMAL — le canal été ne
  //  double JAMAIS un effet
  assert.deepEqual(effetsNourrEteBatimentsVille(p.villes[0], C), { Nourriture: 5 },
    'Guilde : +5 Nourriture en été (canal Nourr - été)')
  assert.deepEqual(effetsBatimentsVille(p.villes[0], C), { Charbon: -1 },
    'Guilde : flux normal Charbon −1 (l été ne doublonne pas les flux)')
  // vieille liste non nettoyée (états pré-2026-11-14) : les prérequis
  //  restés dans la liste sont neutralisés par la Guilde
  p.villes[0] = villeTest(p, ['Grange', 'Silo à grain', 'Moulin à vent', 'Guilde des artisans de la terre'])
  assert.deepEqual(effetsNourrEteBatimentsVille(p.villes[0], C), { Nourriture: 5 },
    'chaîne entière dans la liste : seule la Guilde compte (remplacements)')
  assert.equal(batimentsActifsVille(p.villes[0], C).join(), 'Guilde des artisans de la terre',
    'bâtiments actifs : la Guilde seule')
  // le résumé affiché du picker mentionne le +5 d'été
  const lib = resumeConstruction(constructionRef('Guilde des artisans de la terre', C.config), C.config)
  assert.ok(lib.includes('été : +5 Nourriture'), `libellé : ${lib}`)
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

// ── Test 6 : Guilde des évangélistes — poids ×1,1 DANS le tirage ────────

test('Guilde des évangélistes (tier 3) : poids de la culture de la ville ×1,1 dans le tirage pondéré (comme l Évangile, arbitrage 2026-11-16), PAS de jet séparé', () => {
  // (Retour au tirage par habitant, arbitrage Thibaut 2026-11-16 :
  //  « on transforme la guilde en poids dans la conversion ×1,1
  //  comme l évangélisme » — le poids de la culture de la ville
  //  d accueil est ×(1+v) pour les habitants de cette ville,
  //  lisibles via poidsConversion.)
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]
  // habitant d'une AUTRE culture que la ville d'accueil (Culture
  //  Nordique) — cas emblématique de la conversion locale
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

  // sans la guilde dans la ville d'accueil : poids bruts
  const pression = calculPression(state, C)
  const poidsSans = { ...poidsConversion(state, C, pression, p.villes[0]!) }

  // la guilde arrive dans la ville d'ACCUEIL : la culture d'accueil
  //  gagne ×1,1 (poids dans la conversion, comme l'Évangile)
  p.villes[0] = chateau(p, ['Guilde test conversion'])
  const poidsAvec = poidsConversion(state, C, pression, p.villes[0]!)
  const attendu = 1.1 * (poidsSans['Culture Nordique'] ?? 0)
  assert.ok(Math.abs((poidsAvec['Culture Nordique'] ?? 0) - attendu) < 1e-9,
    'la culture d accueil gagne ×1,1 dans le tirage (comme l Évangile)')
  // les autres poids ne bougent pas
  for (const [cult, w] of Object.entries(poidsSans)) {
    if (cult !== 'Culture Nordique') {
      assert.ok(Math.abs((poidsAvec[cult] ?? 0) - w) < 1e-12,
        `le poids de ${cult} est inchangé`)
    }
  }
  // la conversion passe par le TIRAGE (jet 5 % puis pickWeighted) :
  //  l habitant passe le jet, le poids max (accueil dopé) l emporte
  let jets = 0
  applyCultureInfluence(state, p, fakeRng({
    chance: () => { jets++; return true },
    pickWeighted: (<T>(items: T[]) =>
      (items as Array<[string, number]>).reduce((a, b) => (b[1] > a[1] ? b : a)) as T),
  }), emptyRecap())
  assert.equal(jets, 1, 'UN seul jet — le bonus vit dans le poids, pas un jet séparé')
  assert.equal(habitant.culture, 'Culture Nordique',
    'converti vers la culture d accueil par le tirage pondéré dopé')
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
  assert.ok(resumeConstruction(evangelistes, C.config).includes('poids dans la conversion ×1.1'),
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
