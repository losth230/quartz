// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DES DOGMES DE CULTURE (fondations « mise en forme », 2026-10-30)
//
//  Arbitrages Thibaut verrouillés ici :
//   1. Un dogme à CHAQUE palier de Tourisme d'une culture, cumul à
//      l'infini, jamais remplaçable.
//   2. Tourisme de culture = somme des valeurs de Tourisme des
//      villes de cette culture, TOUS JOUEURS confondus, SANS les
//      cités libres (même lecture que le tableau de production de
//      la ville — productionVille).
//   3. Le choix revient au PONTIFE de la culture au moment
//      du choix (égalité : plus petit n° de joueur).
//   4. Le dogme doit exister dans la table `dogmes` du référentiel —
//      la table des 12 DOGMES DÉFINITIFS retenus par Thibaut y est
//      entrée à la 2e séance du 30/10 (entrées GÉNÉRIQUES,
//      culture '*') : le choix est possible en jeu, un dogme est
//      UNIQUE par culture (le cumul porte sur des dogmes
//      différents).
//   5. CORRECTIF FAMILLE (5e retour arbitre Thibaut du 30/10) :
//      « le calcul de la conception prend en compte la fécondité
//      homme et la fécondité femme — une femme n'a pas à gagner en
//      fécondité si son mari est d'une culture féconde » : dans le
//      JET de conception, chaque époux apporte SA part de fécondité
//      avec le dogme de SA culture propre ; la fécondité AFFICHÉE
//      d'une épouse ne monte jamais à cause de la culture de son
//      mari.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Player, City, Dogme, Character, GameState, PlayerRecap } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { createGame } from './setup'
import type { SetupLine } from './setup'
import { productionVille } from './production'
import { productionTourismeBatiment } from './batiments'
import { normaliserEtat } from './villes'
import { detailGainsVille, consoNourrHabitant, impotsVassaux } from './economie'
import { computeFecondite, conceptionEtNaissances } from './naissances'
import { capMetierVille } from './metiers'
import { domicilesCultureVille } from './domiciles'
import { logementsVille, bonheurVilleComplete } from './bonheur'
import { maladieStep } from './sante'
import { garnisonHabitationVille, malusGuerresSaintes } from './garnisons'
import { applyCultureInfluence } from './culture'
import { transfererTributVassal } from './vassalite'
import { cloneDefaultConfig, type DogmeDef } from '../config/defaultConfig'
import {
  tourismeVille, tourismeCulture, nbPaliersDogmes, dogmesCulture,
  joueurPontifeCulture, paliersDogmesEnAttente, choisirDogme,
  effetsDogmeCulture, dogmesDisponiblesCulture,
} from './dogmes'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique',
  regime: 'Autoritarisme', taillePopulation: 10, pourcentageMariages: 40,
  villes: ['Bergen'],
}]

function partie() {
  const state = createGame(SETUP, 20261030, 'local')
  const C = cfgOf(state.config)
  return { state, C }
}

/** Joueur fantôme avec UNE ville de la culture donnée et une
 *  population VIDE : la valeur de Tourisme de sa ville ne dépend
 *  QUE de ses bâtiments (contrôle déterministe des paliers). */
function joueurVille(base: Player, n: number, culture: string, batiments: string[]): Player {
  const ville: City = { ...base.villes[0], nom: `Ville-${n}`, culture, batiments }
  return { ...base, n, nom: `Joueur ${n}`, villes: [ville] } as unknown as Player
}

/** Référentiel de test : un dogme par nom, pour la culture Nordique. */
function ajouterDogmes(C: ReturnType<typeof cfgOf>, ...noms: string[]) {
  for (const nom of noms) {
    (C.config.dogmes as DogmeDef[]).push({
      nom, culture: 'Culture Nordique',
      description: `Dogme de test « ${nom} » (fondations 2026-10-30).`,
    })
  }
}

test('tourismeVille : la valeur de Tourisme d une ville = sa production affichée (productionVille, canal total)', () => {
  const { state, C } = partie()
  const base = state.players[0]
  const j2 = joueurVille(base, 2, 'Culture Nordique', ['Conjuratoire'])
  state.players.push(j2)
  state.population[2] = []
  const ville = j2.villes[0]
  assert.ok(ville)
  // CONTRAT : même lecture que le tableau de la page « Pays »
  assert.equal(
    tourismeVille(state, j2, ville, C),
    productionVille(state, j2, ville, C).total['Tourisme'] ?? 0,
    'tourismeVille = canal « total » de productionVille',
  )
  // Un Conjuratoire seul : exactement la valeur de la banque
  assert.equal(
    tourismeVille(state, j2, ville, C),
    productionTourismeBatiment('Conjuratoire', C, ville.type),
    'une ville avec seulement un Conjuratoire vaut la valeur de la banque',
  )
  assert.ok(tourismeVille(state, j2, ville, C) > 0, 'le Conjuratoire produit du Tourisme (référentiel)')
})

test('tourismeCulture : somme TOUS JOUEURS des villes de la culture, SANS les cités libres (arbitrage n°2)', () => {
  const { state, C } = partie()
  const base = state.players[0]
  const j1 = joueurVille(base, 1, 'Culture Nordique', ['Conjuratoire'])
  const j2 = joueurVille(base, 2, 'Culture Nordique', ['Conjuratoire', 'Hôtel de tourisme'])
  const j3 = joueurVille(base, 3, 'Déisme', ['Conjuratoire'])
  state.players.push(j1, j2, j3)
  state.population[1] = []
  state.population[2] = []
  state.population[3] = []
  const attendu =
    productionTourismeBatiment('Conjuratoire', C, j1.villes[0]?.type) +
    productionTourismeBatiment('Conjuratoire', C, j2.villes[0]?.type) +
    productionTourismeBatiment('Hôtel de tourisme', C, j2.villes[0]?.type)
  assert.equal(tourismeCulture(state, 'Culture Nordique', C), attendu,
    'la culture additionne les villes des DEUX joueurs (Conjuratoire + Conjuratoire + Hôtel)')
  // une cité libre de la culture ne compte PAS
  const avant = tourismeCulture(state, 'Culture Nordique', C)
  state.citesLibres = [{
    ...base, nom: 'Libreville', type: 'Industrielle - Ville', culture: 'Culture Nordique',
  } as unknown as never]
  assert.equal(tourismeCulture(state, 'Culture Nordique', C), avant,
    'les cités libres sont HORS CHAMP (arbitrage n°2)')
})

test('nbPaliersDogmes : un palier tous les palierTourismeDogme, cumul à l infini (arbitrage n°1)', () => {
  const { C } = partie()
  const pas = C.p.palierTourismeDogme
  assert.equal(pas, 50, 'défaut verrouillé : palier de 50 Tourisme')
  assert.equal(nbPaliersDogmes(0, C), 0)
  assert.equal(nbPaliersDogmes(pas - 0.01, C), 0, 'juste sous le palier : 0')
  assert.equal(nbPaliersDogmes(pas, C), 1, 'pile au palier : 1')
  assert.equal(nbPaliersDogmes(pas * 3, C), 3, '3 paliers')
  assert.equal(nbPaliersDogmes(pas * 100, C), 100, 'cumul à l infini')
  assert.equal(nbPaliersDogmes(-30, C), 0, 'tourisme négatif : 0')
  // paramètre éditable (Référentiels)
  C.p.palierTourismeDogme = 25
  assert.equal(nbPaliersDogmes(49, C), 1, 'palier édité à 25 : 49 → 1')
  assert.equal(nbPaliersDogmes(50, C), 2, 'palier édité à 25 : 50 → 2')
})

test('joueurPontifeCulture : le plus de Tourisme dans SES villes de la culture ; égalité → plus petit n° (arbitrage n°3)', () => {
  const { state, C } = partie()
  const base = state.players[0]
  // personne : undefined
  assert.equal(joueurPontifeCulture(state, 'Culture Nordique', C), undefined,
    'aucun Tourisme dans la culture : pas de pontife')
  // deux joueurs, la culture portée par leurs villes fantômes
  const j1 = joueurVille(base, 1, 'Culture Nordique', ['Conjuratoire'])
  const j2 = joueurVille(base, 2, 'Culture Nordique', ['Conjuratoire', 'Conjuratoire'])
  const j3 = joueurVille(base, 3, 'Déisme', ['Conjuratoire', 'Conjuratoire'])
  state.players.push(j1, j2, j3)
  state.population[1] = []
  state.population[2] = []
  state.population[3] = []
  const dom = joueurPontifeCulture(state, 'Culture Nordique', C)
  assert.ok(dom, 'un pontife existe dès qu un joueur porte du Tourisme')
  assert.equal(dom!.joueur.n, 2, 'deux Conjuratoires battent un seul')
  // égalité parfaite : le plus PETIT n° l emporte (déterminisme)
  const j0bis = joueurVille(base, 0, 'Culture Nordique', ['Conjuratoire'])
  state.players = [j0bis, j3]
  state.population[0] = []
  const domEgalite = joueurPontifeCulture(state, 'Culture Nordique', C)
  assert.equal(domEgalite!.joueur.n, 0, 'égalité : le plus petit n° de joueur l emporte')
})

test('paliersDogmesEnAttente : franchis moins consommés, pontife évalué à la lecture', () => {
  const { state, C } = partie()
  const base = state.players[0]
  const j1 = joueurVille(base, 1, 'Culture Nordique', ['Conjuratoire', 'Conjuratoire', 'Conjuratoire', 'Conjuratoire'])
  state.players.push(j1)
  state.population[1] = []
  const t = productionTourismeBatiment('Conjuratoire', C, j1.villes[0]?.type)
  assert.ok(t > 0, 'le Conjuratoire produit du Tourisme (pré-condition)')
  // 4 Conjuratoires, palier à la valeur d UN Conjuratoire → 4 paliers
  C.p.palierTourismeDogme = t
  const attente = paliersDogmesEnAttente(state, C)
  assert.equal(attente.length, 4, '4 paliers franchis, 0 dogmes pris → 4 en attente')
  assert.deepEqual(attente.map((a) => a.palier), [t, 2 * t, 3 * t, 4 * t],
    'paliers dans l ordre croissant')
  assert.equal(attente[0]!.pontife?.joueur.n, 1, 'le pontife porte le choix')
  // le choix d un palier consomme SON palier, pas les autres
  ajouterDogmes(C, 'Dogme A', 'Dogme B')
  assert.equal(choisirDogme(state, 'Culture Nordique', t, 'Dogme A'), null)
  const apres = paliersDogmesEnAttente(state, C)
  assert.equal(apres.length, 3, 'un dogme choisi → un palier consommé')
  assert.equal(apres[0]!.palier, 2 * t, 'le palier suivant reste en attente')
  // une culture sans enjeu : rien
  assert.equal(paliersDogmesEnAttente(state, C).filter((a) => a.culture !== 'Culture Nordique').length, 0)
})

test('choisirDogme : cumul à l infini, jamais remplaçable, palier à franchir, référentiel requis (arbitrages 1-2-4)', () => {
  const { state, C } = partie()
  const base = state.players[0]
  const j1 = joueurVille(base, 1, 'Culture Nordique', ['Conjuratoire', 'Conjuratoire', 'Conjuratoire'])
  state.players.push(j1)
  state.population[1] = []
  const t = productionTourismeBatiment('Conjuratoire', C, j1.villes[0]?.type)
  C.p.palierTourismeDogme = t
  // 1. dogme ABSENT du référentiel : refus explicite (la table du
  //    30/10 porte déjà les 12 dogmes définitifs — un nom inconnu
  //    seul est refusé ; « Dogme du Travail » est maintenant VALABLE)
  const refus = choisirDogme(state, 'Culture Nordique', t, 'Dogme Inconnu')
  assert.ok(refus !== null && refus.includes('introuvable dans le référentiel'),
    `dogme absent du référentiel : refus explicite (${refus})`)
  //  NB : capture dans une CONST locale — assert.equal (strictEqual)
  //  est typé « asserts actual is T » et rétrécirait state.dogmes à
  //  undefined pour tout le reste du test (tsc), cassant les accès
  //  suivants en `never`.
  const inscritsAvant = state.dogmes
  assert.equal(inscritsAvant, undefined, 'rien n a été inscrit')
  // 2. palier NON atteint : refus
  ajouterDogmes(C, 'Dogme A', 'Dogme B', 'Dogme C')
  assert.ok(choisirDogme(state, 'Culture Nordique', 4 * t, 'Dogme A') !== null,
    'palier non franchi : refus (3 Conjuratoires = 3 paliers)')
  // 3. palier non multiple du pas : refus
  assert.ok(choisirDogme(state, 'Culture Nordique', t + 1, 'Dogme A') !== null,
    'palier non multiple : refus')
  // 4. succès : inscription + journal Culture + pontife
  const nbLogs = state.log.length
  assert.equal(choisirDogme(state, 'Culture Nordique', t, 'Dogme A'), null, 'premier choix : succès')
  assert.equal(state.dogmes?.length, 1)
  const d1 = state.dogmes?.[0]
  assert.ok(d1)
  assert.equal(d1!.culture, 'Culture Nordique')
  assert.equal(d1!.palier, t)
  assert.equal(d1!.nom, 'Dogme A')
  assert.equal(d1!.choisiPar, 1, 'inscrit au nom du PONTIFE, pas de l appelant')
  assert.equal(d1!.choisiAuTour, state.turn)
  assert.equal(state.log.length, nbLogs + 1, 'une entrée de journal')
  assert.equal(state.log[state.log.length - 1]!.type, 'Culture')
  // 5. jamais remplaçable (arbitrage n°3)
  const remplace = choisirDogme(state, 'Culture Nordique', t, 'Dogme B')
  assert.ok(remplace !== null && remplace.includes('pas remplaçable'),
    `un palier consommé ne se re-choisit pas (${remplace})`)
  // 6. cumul : les paliers suivants se choisissent (à l infini)
  assert.equal(choisirDogme(state, 'Culture Nordique', 2 * t, 'Dogme B'), null)
  assert.equal(choisirDogme(state, 'Culture Nordique', 3 * t, 'Dogme C'), null)
  assert.equal(state.dogmes?.length, 3, '3 dogmes cumulés')
  assert.deepEqual(dogmesCulture(state, 'Culture Nordique').map((d) => d.palier), [t, 2 * t, 3 * t],
    'tri par palier croissant')
  assert.equal(paliersDogmesEnAttente(state, C).length, 0, 'tout est consommé')
  // 7. dogme d une AUTRE culture : refus (table par culture)
  assert.ok(choisirDogme(state, 'Déisme', t, 'Dogme A') !== null,
    'le dogme de la culture Nordique n est pas proposé à Déisme')
})

test('normaliserEtat : state.dogmes complété pour les vieilles sauvegardes, intact sinon', () => {
  const { state } = partie()
  // sauvegarde antérieure au 30/10 : pas de champ dogmes
  delete state.dogmes
  normaliserEtat(state)
  assert.deepEqual(state.dogmes, [], 'champ absent → liste vide (contrat routesCommerce/citesLibres)')
  // idempotent avec des entrées
  const entree: Dogme = {
    culture: 'Culture Nordique', palier: 50, nom: 'Dogme X',
    choisiPar: 1, choisiAuTour: 3,
  }
  state.dogmes = [entree]
  normaliserEtat(state)
  assert.deepEqual(state.dogmes, [entree], 'les dogmes pris ne sont JAMAIS touchés')
})

test('cfgOf garde-fou : clé absente → défaut hérité, ancien format → défaut, table perso nouveau format conservée', () => {
  const { state } = partie()
  // (RETOUR DES DOGMES DÉFINITIFS : le défaut porte maintenant les 12
  //  dogmes — une config sans la clé `dogmes` (sauvegarde d avant le
  //  30/10) hérite du DÉFAUT comme toute clé absente de la fusion
  //  {...DEFAULT_CONFIG, ...c} : les vieilles sauvegardes récupèrent
  //  le référentiel des dogmes, mêmes règles que n importe quelle
  //  autre table)
  const cfg = { ...state.config } as Record<string, unknown>
  delete (cfg as { dogmes?: unknown }).dogmes
  const C = cfgOf(cfg as never)
  assert.equal(C.config.dogmes?.length, 12, 'clé absente → défaut du référentiel hérité (12 dogmes)')
  // (INCIDENT 6e RETOUR 2026-10-30 — « je n arrive pas à choisir de
  //  dogme, la table du référentiel est vide » : un [] estampillé
  //  par la purge de l ancien format, une fois convergé et
  //  re-sauvegardé, masquait les 12 défauts à CHAQUE relecture (le
  //  [] de la config gagne la fusion {...DEFAULT_CONFIG, ...c}).
  //  AMENDEMENT de l arbitrage « une table explicitement vidée par
  //  l arbitre reste vide » : une table VIDE ne masque plus les
  //  défauts — pour vider le référentiel, on retire les entrées du
  //  DÉFAUT, pas via une config vide. Verrouillé ici.)
  assert.equal(cfgOf({ ...(state.config as object), dogmes: [] } as never).config.dogmes?.length, 12,
    'une table vide [] retombe sur les défauts (guérison des configs estampillées)')
  // l ANCIEN format (entrées sans champ culture — table d affichage
  //  retirée le 24/10) est purgé ET ne masque pas non plus les
  //  défauts : on retombe sur les 12, et les entrées anciennes ne
  //  reviennent PAS (règle (x))
  const ancien = cfgOf({
    ...(state.config as object),
    dogmes: [{ nom: 'Foi des anciens', bonus: '+1 Pontife' }],
  } as never)
  assert.equal(ancien.config.dogmes?.length, 12,
    'l ancien format est purgé → les défauts (les entrées anciennes ne reviennent jamais)')
  assert.ok(!ancien.config.dogmes?.some((d) => d.nom === 'Foi des anciens'),
    'l entrée d ancien format ne revient jamais (règle (x))')
  const neuf = cfgOf({
    ...(state.config as object),
    dogmes: [{ nom: 'Dogme neuf', culture: 'Déisme', description: 'test' }],
  } as never)
  assert.equal(neuf.config.dogmes?.length, 1, 'le nouveau format DogmeDef passe intact')
  assert.equal(neuf.config.dogmes?.[0]?.nom, 'Dogme neuf')
  // et le défaut du référentiel porte les 12 dogmes GÉNÉRIQUES
  const defDogmes = cloneDefaultConfig().dogmes
  assert.equal(defDogmes?.length, 12, 'les 12 dogmes définitifs sont au référentiel')
  assert.ok(defDogmes?.every((d) => d.culture === '*'),
    'tous génériques : proposés au choix de toute culture')
})

// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DES 12 DOGMES DÉFINITIFS (2e séance du 30/10) : la table des
//  dogmes retenus par Thibaut est au référentiel (générique, culture
//  '*') ; chaque hook moteur est vérifié ci-dessous avec un dogme
//  PRIS injecté directement dans state.dogmes (les validations de
//  choisirDogme sont couvertes par les tests précédents — ici on
//  teste les EFFETS, la culture porteuse lit le référentiel par nom).
//  Interprétations verrouillées (arbitre Thibaut, 30/10 2e + 4e retours) :
//   · Travail/Égalité/Famille/Santé = culture PROPRE du personnage
//     (loi d'habitant) ; Patrie/Solidarité/Liberté/Guerres
//     Saintes/Évangile/Nationalisme = culture de la VILLE — aucun
//     dogme n'a d'effet sur les personnages des autres cultures ;
//   · la Famille multiplie CÔTÉ HOMME ET CÔTÉ FEMME (4e retour :
//     le personnage porteur ET son époux porteur multiplient
//     chacun leur part du facteur de conception) ;
//   · l'Égalité FIXE la consommation (l'emporte sur régime et défaut) ;
//   · la Mère Patrie porte sur la culture du SUZERAIN (tribut reçu) ;
//   · le Nationalisme n'est PAS un jet séparé (4e retour : « pris en
//     compte dans le test de conversion culturelle déjà présent ») —
//     la culture d'accueil gagne +v × le poids des autres cultures
//     dans le tirage pondéré ;
//   · la Fraternité n'a AUCUN effet moteur (révoltes non implémentées).
// ═══════════════════════════════════════════════════════════════════════════

/** Personnage de test complet (même contrat que metiers.test.ts —
 *  tuples de 3 traits pour la CI tsc strict). */
function persoDogme(id: string, age: number, o: { metier?: string | null; ville?: string } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'F', age,
    culture: 'Culture Nordique', ville: o.ville ?? 'Bergen', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
  }
}

/** Injecte un dogme PRIS par une culture (hook tests — passe par
 *  le référentiel par nom, comme le moteur). */
function prendre(state: GameState, culture: string, nom: string) {
  state.dogmes = [
    ...(state.dogmes ?? []),
    { culture, palier: 50, nom, choisiPar: 1, choisiAuTour: 1 },
  ]
}

/** PlayerRecap de test complet. */
function recapTest(): PlayerRecap {
  return {
    conceptions: {}, naissances: {}, deces: {}, decesMaladie: 0,
    mariagesNobles: {}, conversions: {}, metiersAttribues: {},
    crises: [], commandantTombe: null,
  }
}

/** Rng factice configurable (applyCultureInfluence/maladieStep) —
 *  seule la face `chance` (et au besoin `pickWeighted`) est
 *  configurable, le reste ne sert pas à ces hooks ; le cast final
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

test('référentiel : les 12 dogmes définitifs, génériques, aux effets attendus', () => {
  const attendus: Record<string, Array<{ type: string; valeur: number }>> = {
    'Dogme du Travail': [{ type: 'travailNourriture', valeur: 1 }],
    'Dogme de la Famille': [{ type: 'fecondite', valeur: 0.1 }],
    'Dogme de la Patrie': [{ type: 'gardeParHabitation', valeur: 2 }],
    'Dogme de l\u2019Égalité': [{ type: 'consoNourrBourgeois', valeur: 1 }],
    'Dogme de la Solidarité': [{ type: 'taudisParHabitation', valeur: 5 }],
    // la Fraternité n a AUCUN effet moteur (révoltes non implémentées)
    'Dogme de la Fraternité': [],
    'Dogme de la Liberté': [{ type: 'bonheurVille', valeur: 10 }],
    'Dogme de la Santé': [{ type: 'maladieContractMod', valeur: -0.05 }],
    'Dogme de l\u2019Évangile': [{ type: 'pressionCulture', valeur: 0.1 }],
    'Dogme de la Mère Patrie': [{ type: 'tributVassal', valeur: 0.05 }],
    'Dogme des Guerres Saintes': [{ type: 'garnisonHorsCulture', valeur: -40 }],
    'Dogme du Nationalisme': [{ type: 'conversionLocale', valeur: 0.15 }],
  }
  const def = cloneDefaultConfig().dogmes ?? []
  assert.equal(def.length, 12, '12 dogmes au référentiel')
  for (const d of def) {
    assert.equal(d.culture, '*', `${d.nom} : générique (proposé à toute culture)`)
    assert.ok(d.description.length > 0, `${d.nom} : décrit`)
    const exp = attendus[d.nom]
    assert.ok(exp !== undefined, `dogme inattendu au référentiel : ${d.nom}`)
    assert.deepEqual(d.effets ?? [], exp, `${d.nom} : effets verrouillés (le référentiel est la source de vérité du moteur)`)
  }
})

test('choisirDogme (2e séance) : générique « * » accepté, dogme UNIQUE par culture, disponibles filtrés', () => {
  const { state, C } = partie()
  const base = state.players[0]
  const j1 = joueurVille(base, 1, 'Culture Nordique', ['Conjuratoire', 'Conjuratoire'])
  state.players.push(j1)
  state.population[1] = []
  const t = productionTourismeBatiment('Conjuratoire', C, j1.villes[0]?.type)
  C.p.palierTourismeDogme = t
  // un dogme GÉNÉRIQUE du référentiel se choisit pour toute culture
  assert.equal(choisirDogme(state, 'Culture Nordique', t, 'Dogme de la Liberté'), null,
    'un dogme « * » est proposé à toute culture')
  assert.equal(state.dogmes?.length, 1)
  // UNIQUE par culture : le même nom est refusé au palier suivant
  const doublon = choisirDogme(state, 'Culture Nordique', 2 * t, 'Dogme de la Liberté')
  assert.ok(doublon !== null && doublon.includes('unique par culture'),
    `le même dogme deux fois est refusé (${doublon})`)
  // un AUTRE dogme au palier suivant : succès (cumul de dogmes différents)
  assert.equal(choisirDogme(state, 'Culture Nordique', 2 * t, 'Dogme du Travail'), null)
  assert.equal(state.dogmes?.length, 2, '2 dogmes différents cumulés')
  // disponibles : le référentiel moins les dogmes déjà pris par la culture
  const dispo = dogmesDisponiblesCulture(state, 'Culture Nordique', C)
  assert.equal(dispo.length, 10, '12 au référentiel − 2 pris')
  assert.ok(!dispo.some((d) => d.nom === 'Dogme de la Liberté' || d.nom === 'Dogme du Travail'),
    'les dogmes pris n y sont plus proposés')
  // effetsDogmeCulture : somme par type, lecture par nom au référentiel
  assert.equal(effetsDogmeCulture(state, 'Culture Nordique', 'bonheurVille', C), 10)
  assert.equal(effetsDogmeCulture(state, 'Culture Nordique', 'travailNourriture', C), 1)
  assert.equal(effetsDogmeCulture(state, 'Déisme', 'bonheurVille', C), 0,
    'une autre culture ne porte pas ces dogmes')
})

test('Dogme du Travail : +1 Nourriture par sans-emploi de la culture (detailGainsVille, avant les taxes)', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes.find((v) => v.nom === 'Bergen')
  assert.ok(ville, 'Bergen existe (setup)')
  const chomeur = persoDogme('T1', 30, { ville: 'Bergen' })   // sans emploi, Nordique
  const etranger = persoDogme('T2', 30, { ville: 'Bergen' })  // sans emploi
  etranger.culture = 'Déisme'
  state.population[p.n] = [chomeur, etranger]
  const avant = detailGainsVille(state, p, ville, C).metiers['Nourriture'] ?? 0
  prendre(state, 'Culture Nordique', 'Dogme du Travail')
  const apres = detailGainsVille(state, p, ville, C).metiers['Nourriture'] ?? 0
  // un seul des deux sans-emplois est de la culture porteuse : +1, pas +2
  assert.equal(apres - avant, 1,
    'seuls les sans-emplois de la culture porteuse produisent (+1, sans multiplicateur de rang)')
})

test('Dogme de l\u2019Égalité : un bourgeois de la culture consomme 1 Nourriture (l emporte sur le défaut)', () => {
  const { state, C } = partie()
  const bourgeois = persoDogme('E1', 40)
  // 150 : entre le seuil bourgeois (100) et le seuil noble (250) —
  //  prestige 300 l aurait rendu NOBLE (conso 4)
  bourgeois.prestige = 150
  assert.equal(consoNourrHabitant(bourgeois, C, 'Autoritarisme', state), 2,
    'sans dogme : défaut bourgeois du référentiel (2, l Autoritarisme n a pas de loi de consommation)')
  prendre(state, 'Culture Nordique', 'Dogme de l\u2019Égalité')
  assert.equal(consoNourrHabitant(bourgeois, C, 'Autoritarisme', state), 1,
    'avec dogme : le dogme FIXE la consommation à 1 (l emporte sur le régime et le défaut)')
  // sans state (cités libres, appels sans état) : le dogme n est pas consulté
  assert.equal(consoNourrHabitant(bourgeois, C, 'Autoritarisme'), 2,
    'sans state, comportement inchangé (roturier de la même culture non plus)')
  const roturier = persoDogme('E2', 30)
  assert.equal(consoNourrHabitant(roturier, C, 'Autoritarisme', state), 1,
    'le dogme ne touche que les bourgeois')
})

test('Dogme de la Famille : fécondité ×1,1 côté femme et côté homme — le dogme du mari vit dans le JET, pas dans la fécondité affichée de l épouse (5e retour arbitre)', () => {
  const { state } = partie()
  const p = state.players[0]
  const femme = persoDogme('F1', 22, { ville: 'Bergen' })
  const homme = persoDogme('H1', 25, { ville: 'Bergen' })
  homme.sexe = 'M'
  // une femme d une AUTRE culture mariée à un homme PORTEUR (5e retour :
  //  « une femme n'a pas à gagner en fécondité si son mari est d'une
  //  culture féconde » — sa fécondité AFFICHÉE ne bouge pas)
  const mariee = persoDogme('F2', 22, { ville: 'Bergen' })
  mariee.culture = 'Déisme'
  mariee.mariageId = 'H1'
  homme.mariageId = 'F2'
  // une femme PORTEUSE mariée à un homme d une autre culture
  const porteuse = persoDogme('F3', 22, { ville: 'Bergen' })
  const etranger = persoDogme('H2', 25, { ville: 'Bergen' })
  etranger.sexe = 'M'
  etranger.culture = 'Déisme'
  porteuse.mariageId = 'H2'
  etranger.mariageId = 'F3'
  // un couple PORTEUR des deux côtés
  const coupleF = persoDogme('F4', 22, { ville: 'Bergen' })
  const coupleH = persoDogme('H3', 25, { ville: 'Bergen' })
  coupleH.sexe = 'M'
  coupleF.mariageId = 'H3'
  coupleH.mariageId = 'F4'
  state.population[p.n] = [femme, homme, mariee, porteuse, etranger, coupleF, coupleH]
  // ── JET de conception (conceptionEtNaissances) : la proba de
  //    conception de chaque femme éligible est capturée par un rng
  //    enregistreur (chance → false : aucune grossesse, aucune
  //    autre consommation d aléa). Ordre d itération = ordre du
  //    pop : [femme, mariee, porteuse, coupleF].
  const jetConception = (): number[] => {
    const probas: number[] = []
    const rng = { chance: (q: number) => { probas.push(q); return false } } as unknown as Rng
    conceptionEtNaissances(state, p, rng, recapTest())
    return probas
  }
  // relevés SANS dogme (avant de le prendre)
  const femmeSans = computeFecondite(state, p, femme)
  const hommeSans = computeFecondite(state, p, homme)
  const marieeSans = computeFecondite(state, p, mariee)
  const porteuseSans = computeFecondite(state, p, porteuse)
  const etrangerSans = computeFecondite(state, p, etranger)
  const coupleFSans = computeFecondite(state, p, coupleF)
  const coupleHSans = computeFecondite(state, p, coupleH)
  const jetSans = jetConception()
  prendre(state, 'Culture Nordique', 'Dogme de la Famille')
  const femmeAvec = computeFecondite(state, p, femme)
  const hommeAvec = computeFecondite(state, p, homme)
  const marieeAvec = computeFecondite(state, p, mariee)
  const porteuseAvec = computeFecondite(state, p, porteuse)
  const etrangerAvec = computeFecondite(state, p, etranger)
  const coupleFAvec = computeFecondite(state, p, coupleF)
  const coupleHAvec = computeFecondite(state, p, coupleH)
  const jetAvec = jetConception()
  assert.ok(femmeSans > 0 && hommeSans > 0 && marieeSans > 0 && porteuseSans > 0
    && etrangerSans > 0 && coupleFSans > 0 && coupleHSans > 0,
    'pré-conditions : probas positives (femmes seules/mariées, hommes)')
  assert.equal(jetSans.length, 4, '4 femmes éligibles au jet (femme, mariee, porteuse, coupleF)')
  assert.ok(jetSans.every((q) => q > 0), 'probas de conception positives avant dogme')
  // ── fécondité AFFICHÉE (computeFecondite) ──
  assert.ok(Math.abs(femmeAvec / femmeSans - 1.1) < 1e-9,
    'côté FEMME : ×(1+0,1) exactement (culture propre)')
  // (correctif arbitre Thibaut 30/10 : « le multiplicateur est
  //  côté homme et femme »)
  assert.ok(Math.abs(hommeAvec / hommeSans - 1.1) < 1e-9,
    'côté HOMME : ×(1+0,1) exactement')
  assert.ok(Math.abs(porteuseAvec / porteuseSans - 1.1) < 1e-9,
    'une femme porteuse mariée à un non-porteur : ×1,1 (sa propre part)')
  assert.ok(Math.abs(coupleFAvec / coupleFSans - 1.1) < 1e-9,
    'un couple porteur des deux côtés : la fécondité AFFICHÉE de l épouse ×1,1 (sa part seule, pas ×1,21)')
  assert.ok(Math.abs(coupleHAvec / coupleHSans - 1.1) < 1e-9,
    'la fécondité affichée de l époux porteur ×1,1 (sa part)')
  // (5e retour arbitre Thibaut du 30/10 : « une femme n'a pas à gagner
  //  en fécondité si son mari est d'une culture féconde »)
  assert.ok(Math.abs(marieeAvec / marieeSans - 1) < 1e-9,
    'fécondité AFFICHÉE de l épouse d un porteur : INCHANGÉE (5e retour)')
  assert.ok(Math.abs(etrangerAvec / etrangerSans - 1) < 1e-9,
    'la fécondité d un personnage d une autre culture est inchangée')
  // ── JET de conception (« le calcul de la conception prend en compte
  //    la fécondité homme et la fécondité femme » — chaque époux apporte
  //    SA part, avec le dogme de SA culture propre) ──
  assert.ok(Math.abs(jetAvec[0]! / jetSans[0]! - 1.1) < 1e-9,
    'jet d une femme porteuse célibataire : ×1,1 (sa part)')
  assert.ok(Math.abs(jetAvec[1]! / jetSans[1]! - 1.1) < 1e-9,
    'jet d une épouse NON porteuse d un mari PORTEUR : ×1,1 via la part de fécondité de LUI (le calcul de la conception prend en compte la fécondité homme)')
  assert.ok(Math.abs(jetAvec[2]! / jetSans[2]! - 1.1) < 1e-9,
    'jet d une épouse PORTEUSE d un mari non porteur : ×1,1 (sa part à elle)')
  assert.ok(Math.abs(jetAvec[3]! / jetSans[3]! - 1.21) < 1e-9,
    'jet d un couple PORTEUR des deux côtés : ×1,21 (chaque époux porteur multiplie SA part)')
})

test('Dogme de la Patrie : +2 métiers de Garde dans les villes de la culture (capMetierVille)', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes.find((v) => v.nom === 'Bergen')
  assert.ok(ville, 'Bergen existe (setup)')
  const garde = C.p.metierGarde
  const sans = capMetierVille(garde, ville, C, { state, joueur: p.n })
  prendre(state, 'Culture Nordique', 'Dogme de la Patrie')
  const avec = capMetierVille(garde, ville, C, { state, joueur: p.n })
  assert.equal(avec - sans, 2, '+2 Gardes dans les villes de la culture porteuse (cumulée aux bases et emplacements)')
  // hors culture de la ville : pas de bonus (loi de VILLE)
  const villeEtrangere: City = { ...ville, culture: 'Déisme' }
  assert.equal(
    capMetierVille(garde, villeEtrangere, C, { state, joueur: p.n }),
    capMetierVille(garde, villeEtrangere, C),
    'la cap d une ville d une autre culture ne bouge pas',
  )
  // un autre métier n est pas touché
  assert.equal(
    capMetierVille('Chasseur', ville, C, { state, joueur: p.n }),
    capMetierVille('Chasseur', ville, C),
    'seul le métier de Garde porte le bonus',
  )
})

test('Dogme de la Solidarité : +5 Taudis par habitation (entrée séparée, lits attribuables)', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes.find((v) => v.nom === 'Bergen')
  assert.ok(ville, 'Bergen existe (setup)')
  const logementsAvant = logementsVille(ville, C, state)
  const avant = domicilesCultureVille(ville, C, state)
  prendre(state, 'Culture Nordique', 'Dogme de la Solidarité')
  const apres = domicilesCultureVille(ville, C, state)
  assert.ok(apres.find((e) => e.domicile === 'Taudis' && e.nombre === 5),
    'entrée « Taudis » de 5, SÉPARÉE de la loi de culture (les deux restent visibles au détail)')
  assert.equal(avant.length + 1, apres.length, 'une seule entrée ajoutée')
  assert.equal(logementsVille(ville, C, state) - logementsAvant, 5,
    'les LOGEMENTS de la ville montent de 5 (même parc que la loi « Logements élargis »)')
  // sans state : le dogme n est pas consulté (appels sans état)
  assert.equal(domicilesCultureVille(ville, C).length, avant.length,
    'sans state, comportement inchangé')
})

test('Dogme de la Liberté : +10 Bonheur dans les villes de la culture (avant le plafond de 100)', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes.find((v) => v.nom === 'Bergen')
  assert.ok(ville, 'Bergen existe (setup)')
  const sans = bonheurVilleComplete(state, p, ville, C)
  prendre(state, 'Culture Nordique', 'Dogme de la Liberté')
  const avec = bonheurVilleComplete(state, p, ville, C)
  assert.equal(avec, Math.min(100, sans + 10), '+10 Bonheur, plafond 100')
  assert.ok(avec <= 100, 'jamais au-dessus de 100')
})

test('Dogme de la Santé : −5 points de contraction pour les personnages de la culture (maladieStep)', () => {
  const { state } = partie()
  const p = state.players[0]
  const habitant = persoDogme('S1', 30, { ville: 'Bergen' })
  state.population[p.n] = [habitant]
  const recap = recapTest()
  const probas: number[] = []
  maladieStep(state, p, habitant, fakeRng({
    chance: (x) => { probas.push(x); return false },
  }), recap)
  prendre(state, 'Culture Nordique', 'Dogme de la Santé')
  const probasDogme: number[] = []
  maladieStep(state, p, habitant, fakeRng({
    chance: (x) => { probasDogme.push(x); return false },
  }), recap)
  assert.ok(probas.length > 0 && probasDogme.length > 0, 'un tirage de contraction a eu lieu')
  // le tirage reçoit max(0, proba + mod) : le mod −0,05 passe au
  //  tirage, avec le PLANCHER 0 du moteur
  assert.equal(probasDogme[0], Math.max(0, (probas[0] ?? 0) - 0.05),
    'la proba de contraction perd exactement 0,05 (additif, plancher 0 du tirage)')
  // un personnage d une AUTRE culture n est pas protégé (Lunisme :
  //  aucune loi de santé — le Déisme porte −0,02 « Lavages de main »)
  habitant.culture = 'Lunisme'
  const probasEtranger: number[] = []
  maladieStep(state, p, habitant, fakeRng({
    chance: (x) => { probasEtranger.push(x); return false },
  }), recap)
  assert.equal(probasEtranger[0], probas[0],
    'la culture propre du personnage seule compte (loi d habitant)')
})

test('Dogme des Guerres Saintes : −40 garnison hors culture porteuse, une fois par culture, plancher 0', () => {
  const { state, C } = partie()
  const p = state.players[0]
  const ville = p.villes.find((v) => v.nom === 'Bergen')
  assert.ok(ville, 'Bergen existe (setup)')
  assert.equal(malusGuerresSaintes(state, ville, C), 0, 'sans dogme : pas de malus')
  prendre(state, 'Culture Nordique', 'Dogme des Guerres Saintes')
  const villeEtrangere: City = { ...ville, culture: 'Déisme' }
  assert.equal(malusGuerresSaintes(state, villeEtrangere, C), 40,
    'ville d une autre culture : −40')
  assert.equal(malusGuerresSaintes(state, ville, C), 0,
    'ville de la culture porteuse : protégée')
  // une DEUXIÈME culture porteuse cumule (−80 sur une ville tierce)
  prendre(state, 'Déisme', 'Dogme des Guerres Saintes')
  const villeTierce: City = { ...ville, culture: 'Naturalisme' }
  assert.equal(malusGuerresSaintes(state, villeTierce, C), 80,
    'deux cultures porteuses : malus cumulé une fois par culture')
  // et dans la garnison réelle (plancher 0)
  const gAvant = garnisonHabitationVille(p, villeTierce, C)
  const gApres = garnisonHabitationVille(p, villeTierce, C, state)
  assert.equal(gApres, Math.max(0, gAvant - 80), 'le malus passe à la garnison réelle, plancher 0')
})

test('Dogmes de l\u2019Évangile et du Nationalisme : poids ×1,1 et +0,15 de part DANS le tirage (applyCultureInfluence)', () => {
  // (a) Évangile : le poids FINAL de la culture porteuse ×1,1 dans le tirage
  const pa = partie()
  const pA = pa.state.players[0]
  if (!pA) throw new Error('joueur absent')
  const habitantA = persoDogme('N1', 30, { ville: 'Bergen' })
  habitantA.culture = 'Déisme'
  pa.state.population[pA.n] = [habitantA]
  // la culture porteuse doit avoir du POIDS dans la pression : sans
  //  Tourisme général, son poids vaut 0 (×1,1 ne se verrait pas) —
  //  on lui donne du Tourisme général (hors villes)
  pA.resources['Tourisme'] = { stock: 10, prod: 0 }
  let poidsNordique = 0
  const runA = () => {
    habitantA.culture = 'Déisme' // reset : le tirage précédent a pu convertir
    applyCultureInfluence(pa.state, pA, fakeRng({
      chance: () => true, // tente la conversion à chaque tour
      pickWeighted: <T,>(items: T[], weight: (t: T) => number): T => {
        for (const it of items as Array<[string, number]>) {
          if (it[0] === 'Culture Nordique') poidsNordique = weight(it as never)
        }
        return (items as Array<[string, number]>)[0] as unknown as T
      },
    }), recapTest())
  }
  runA()
  const poidsSans = poidsNordique
  prendre(pa.state, 'Culture Nordique', 'Dogme de l\u2019Évangile')
  runA()
  assert.ok(poidsSans > 0, 'pré-condition : la culture porteuse a un poids')
  assert.ok(Math.abs(poidsNordique / poidsSans - 1.1) < 1e-9,
    'Évangile : le poids de la culture porteuse ×1,1')
  // (b) Nationalisme : PAS de jet séparé (correctif arbitre Thibaut
  //  30/10 — « pris en compte dans le test de conversion culturelle
  //  déjà présent ») : la culture d accueil gagne +0,15 × le poids
  //  total des autres cultures DANS le tirage pondéré
  const pb = partie()
  const pB = pb.state.players[0]
  if (!pB) throw new Error('joueur absent')
  const habitantB = persoDogme('N2', 30, { ville: 'Bergen' })
  habitantB.culture = 'Déisme'
  pb.state.population[pB.n] = [habitantB]
  pB.resources['Tourisme'] = { stock: 10, prod: 0 }
  let poidsB: Record<string, number> = {}
  const runB = (retour: boolean) => {
    habitantB.culture = 'Déisme' // reset : le tirage précédent a pu convertir
    let tirages = 0
    applyCultureInfluence(pb.state, pB, fakeRng({
      chance: () => { tirages++; return true }, // une SEULE tentative de conversion
      pickWeighted: <T,>(items: T[], weight: (t: T) => number): T => {
        poidsB = {}
        for (const it of items as Array<[string, number]>) poidsB[it[0]] = weight(it as never)
        const hote = (items as Array<[string, number]>).find((it) => it[0] === 'Culture Nordique')
        if (retour && hote) return hote as unknown as T
        return (items as Array<[string, number]>)[0] as unknown as T
      },
    }), recapTest())
    return tirages
  }
  const tiragesSans = runB(false)
  const poidsSansB = { ...poidsB }
  prendre(pb.state, 'Culture Nordique', 'Dogme du Nationalisme')
  const tiragesAvec = runB(true)
  assert.equal(tiragesSans, 1, 'sans dogme : un seul tirage de conversion par personnage')
  assert.equal(tiragesAvec, 1, 'avec dogme : TOUJOURS un seul tirage — le bonus est DANS le tirage, pas un jet séparé')
  // le poids d accueil = poids sans dogme + 0,15 × le poids des autres
  const autres = Object.entries(poidsB).filter(([cult]) => cult !== 'Culture Nordique')
    .reduce((acc, [, w]) => acc + w, 0)
  const attendu = (poidsSansB['Culture Nordique'] ?? 0) + 0.15 * autres
  assert.ok(Math.abs((poidsB['Culture Nordique'] ?? 0) - attendu) < 1e-9,
    'Nationalisme : la culture d accueil gagne +0,15 × le poids total des autres cultures')
  // les autres poids ne bougent pas
  for (const [cult, w] of Object.entries(poidsSansB)) {
    if (cult !== 'Culture Nordique') {
      assert.ok(Math.abs((poidsB[cult] ?? 0) - w) < 1e-9, `le poids de ${cult} est inchangé`)
    }
  }
  // la conversion mène à la culture d accueil par le log NORMAL (pas de mention dédiée)
  assert.equal(habitantB.culture, 'Culture Nordique',
    'converti vers la culture d accueil par le tirage normal dopé')
  assert.ok(!pb.state.log.some((l) => l.texte.includes('(dogme du Nationalisme)')),
    'plus de log dédié — l entrée de conversion normale suffit')
})

test('Dogme de la Mère Patrie : tribut reçu ×1,05 (les DEUX chemins : fin de tour et impôt manuel)', () => {
  const { state, C } = partie()
  const suzerain = state.players[0]
  if (!suzerain) throw new Error('joueur absent')
  const base = state.players[0]
  // (a) fin de tour : transfererTributVassal
  const vassal = joueurVille(base, 2, 'Culture Nordique', [])
  vassal.vassalDe = suzerain.n
  state.players.push(vassal)
  state.population[2] = []
  const part = 100 * C.p.vassalPrelevement
  const gainsSans: Record<number, Record<string, number>> = { 2: { Or: 100 } }
  transfererTributVassal(state, gainsSans, C)
  const recuSans = gainsSans[suzerain.n]?.['Or'] ?? 0
  assert.ok(Math.abs(recuSans - part) < 1e-9,
    'sans dogme : le suzerain reçoit la part du vassal (Autoritarisme : pas de loi de tribut)')
  prendre(state, suzerain.culture, 'Dogme de la Mère Patrie')
  const gainsAvec: Record<number, Record<string, number>> = { 2: { Or: 100 } }
  transfererTributVassal(state, gainsAvec, C)
  const recuAvec = gainsAvec[suzerain.n]?.['Or'] ?? 0
  assert.ok(Math.abs(recuAvec / recuSans - 1.05) < 1e-9,
    'avec dogme : ×1,05 — le vassal paie SA part, la différence est CRÉÉE')
  assert.ok(Math.abs((gainsAvec[2]?.['Or'] ?? 0) - (100 - part)) < 1e-9,
    'le vassal paie toujours SA part (100 − part)')
  // (b) impôt manuel : impotsVassaux (même multiplicateur) — le
  //  relevé « sans » retire le dogme injecté en (a) (sinon il
  //  cumulerait 0,05+0,05 = ×1,1)
  const commercant = persoDogme('M1', 30, { metier: 'Commerçant', ville: vassal.villes[0]?.nom })
  commercant.culture = 'Culture Nordique'
  state.population[2] = [commercant]
  state.dogmes = []
  const impotsSans = impotsVassaux(state, suzerain, C)
  assert.equal(impotsSans.length, 1, 'le vassal rapporte (Commerçant : Or)')
  prendre(state, suzerain.culture, 'Dogme de la Mère Patrie')
  const impotsAvec = impotsVassaux(state, suzerain, C)
  assert.equal(impotsAvec.length, 1)
  assert.ok(impotsSans[0] && impotsAvec[0])
  assert.ok(Math.abs(impotsAvec[0]!.montant / impotsSans[0]!.montant - 1.05) < 1e-9,
    'l impôt manuel des vassaux porte le même ×1,05')
})
