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
//   3. Le choix revient au joueur DOMINANT de la culture au moment
//      du choix (égalité : plus petit n° de joueur).
//   4. Le dogme doit exister dans la table `dogmes` du référentiel
//      — ENCORE VIDE à ce stade : choisirDogme refuse tout nom
//      tant que les dogmes définitifs n'y sont pas (le choix
//      deviendra possible sans toucher au code).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Player, City, Dogme } from './types'
import { cfgOf } from './gameData'
import { createGame } from './setup'
import type { SetupLine } from './setup'
import { productionVille } from './production'
import { productionTourismeBatiment } from './batiments'
import { normaliserEtat } from './villes'
import { cloneDefaultConfig, type DogmeDef } from '../config/defaultConfig'
import {
  tourismeVille, tourismeCulture, nbPaliersDogmes, dogmesCulture,
  joueurDominantCulture, paliersDogmesEnAttente, choisirDogme,
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
  const { state, C } = partie()
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

test('joueurDominantCulture : le plus de Tourisme dans SES villes de la culture ; égalité → plus petit n° (arbitrage n°3)', () => {
  const { state, C } = partie()
  const base = state.players[0]
  // personne : undefined
  assert.equal(joueurDominantCulture(state, 'Culture Nordique', C), undefined,
    'aucun Tourisme dans la culture : pas de dominant')
  // deux joueurs, la culture portée par leurs villes fantômes
  const j1 = joueurVille(base, 1, 'Culture Nordique', ['Conjuratoire'])
  const j2 = joueurVille(base, 2, 'Culture Nordique', ['Conjuratoire', 'Conjuratoire'])
  const j3 = joueurVille(base, 3, 'Déisme', ['Conjuratoire', 'Conjuratoire'])
  state.players.push(j1, j2, j3)
  state.population[1] = []
  state.population[2] = []
  state.population[3] = []
  const dom = joueurDominantCulture(state, 'Culture Nordique', C)
  assert.ok(dom, 'un dominant existe dès qu un joueur porte du Tourisme')
  assert.equal(dom!.joueur.n, 2, 'deux Conjuratoires battent un seul')
  // égalité parfaite : le plus PETIT n° l emporte (déterminisme)
  const j0bis = joueurVille(base, 0, 'Culture Nordique', ['Conjuratoire'])
  state.players = [j0bis, j3]
  state.population[0] = []
  const domEgalite = joueurDominantCulture(state, 'Culture Nordique', C)
  assert.equal(domEgalite!.joueur.n, 0, 'égalité : le plus petit n° de joueur l emporte')
})

test('paliersDogmesEnAttente : franchis moins consommés, dominant évalué à la lecture', () => {
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
  assert.equal(attente[0]!.dominant?.joueur.n, 1, 'le dominant porte le choix')
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
  // 1. référentiel VIDE : tout choix est refusé (mise en forme seule)
  const refus = choisirDogme(state, 'Culture Nordique', t, 'Dogme du Travail')
  assert.ok(refus !== null && refus.includes('introuvable dans le référentiel'),
    `référentiel vide : refus explicte (${refus})`)
  assert.equal(state.dogmes, undefined, 'rien n a été inscrit')
  // 2. palier NON atteint : refus
  ajouterDogmes(C, 'Dogme A', 'Dogme B', 'Dogme C')
  assert.ok(choisirDogme(state, 'Culture Nordique', 4 * t, 'Dogme A') !== null,
    'palier non franchi : refus (3 Conjuratoires = 3 paliers)')
  // 3. palier non multiple du pas : refus
  assert.ok(choisirDogme(state, 'Culture Nordique', t + 1, 'Dogme A') !== null,
    'palier non multiple : refus')
  // 4. succès : inscription + journal Culture + dominant
  const nbLogs = state.log.length
  assert.equal(choisirDogme(state, 'Culture Nordique', t, 'Dogme A'), null, 'premier choix : succès')
  assert.equal(state.dogmes?.length, 1)
  const d1 = state.dogmes?.[0]
  assert.ok(d1)
  assert.equal(d1!.culture, 'Culture Nordique')
  assert.equal(d1!.palier, t)
  assert.equal(d1!.nom, 'Dogme A')
  assert.equal(d1!.choisiPar, 1, 'inscrit au nom du joueur DOMINANT, pas de l appelant')
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
  const { state, C } = partie()
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

test('cfgOf garde-fou : une config sans table dogmes reçoit une liste vide (pas de défaut à réintégrer)', () => {
  const { state } = partie()
  const cfg = { ...state.config } as Record<string, unknown>
  delete (cfg as { dogmes?: unknown }).dogmes
  const C = cfgOf(cfg as never)
  assert.deepEqual(C.config.dogmes, [], 'config existante sans table dogmes → []')
  // une table vidée par l arbitre reste vide (défaut vide, pas de ouDefauts)
  C.config.dogmes = []
  assert.deepEqual(cfgOf(C.config).config.dogmes, [], 'une table vidée par l arbitre reste vide')
  // et le défaut du référentiel est vide à ce stade (mise en forme seule)
  assert.deepEqual(cloneDefaultConfig().dogmes, [], 'aucun dogme n est encore défini au référentiel')
})
