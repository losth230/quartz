// ═══════════════════════════════════════════════════════════════════════════
//  TESTS COMMERCE — ROUTES DISSOCIÉES (sous-vague 3b, arbitrage Thibaut
//  2026-10-24) : une route relie une ville d'origine à la ville d'un
//  autre joueur ou à une cité libre, SANS personnage — +1 emplacement
//  de Marchand de chaque côté, copie de l'aménagement dans la ville
//  d'origine, PAS d'Or passif (marchandOrTour retiré), fermeture par
//  l'origine seule, purge des vieilles routes « marchandId ».
//
//  Le premier test conserve la clôture B4 (arbitrage Thibaut
//  2026-10-19) : le Tourisme copié par une route EST une production
//  comme les autres — il doit compter dans le stock, sinon le récap
//  l'affiche (canal Commerce) mais le stock l'ignore.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runTurn } from './tour'
import { normaliserEtat } from './villes'
import {
  creerRouteCommerce, ressourcesCopiables, effetsCommerceJoueur,
  routesCommerceDe, routesCommerceVers, routesCommerceVersCite, capMarchandsCite,
  nettoyerRoutesCommerce, supprimerRouteCommerce,
} from './commerce'
import { capMetierVille } from './metiers'
import { metiersAccessiblesCite } from './citesLibres'
import { tourismeCourant } from './regimes'
import { cfgOf } from './gameData'
import { createGame, type SetupLine } from './setup'
import type { GameState, RouteCommerce } from './types'

/** Partie minimale à 2 joueurs — copieur (Communautarisme : aucune loi
//  de Tourisme) et cible porteuse d'un Hôtel de tourisme (construction
//  productrice de Tourisme — vague 3a : la Foire ne produit plus rien,
//  elle donne des emplacements d'Artiste/Commerçant), graine fixe →
//  déterminisme. */
function partieDeuxJoueurs(): GameState {
  const setups: SetupLine[] = [
    { nom: 'Copieur', peuple: 'Basiléens', culture: 'Communautarisme', regime: 'Monarchie',
      taillePopulation: 50, pourcentageMariages: 40, villes: ['Capitale A'] },
    { nom: 'Cible', peuple: 'Sylvains', culture: 'Déisme', regime: 'Démocratie',
      taillePopulation: 50, pourcentageMariages: 40, villes: ['Capitale B'] },
  ]
  return createGame(setups, 20261019, 'local')
}

test('commerce : le Tourisme copié par une route compte dans la production et le stock (B4, arbitrage 2026-10-19)', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const cible = state.players[1]
  const C = cfgOf(state.config)

  // La ville cible possède un Hôtel de tourisme : Tourisme copiable.
  const villeCible = cible.villes[0]
  villeCible.amenagements = [...(villeCible.amenagements ?? []), 'Hôtel de tourisme']
  const copiables = ressourcesCopiables('Hôtel de tourisme', C.config)
  assert.ok(copiables.some((c) => c.ressource === 'Tourisme' && c.valeur > 0),
    `l'Hôtel de tourisme doit avoir un Tourisme copiable (obtenu : ${JSON.stringify(copiables)})`)

  // Le copieur ouvre une route DISSOCIÉE (sous-vague 3b : gratuite, sans
  //  personnage) vers l'Hôtel de tourisme.
  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', cible.n, null, villeCible.nom, 'Hôtel de tourisme')
  assert.equal(err, null, `la route doit s'ouvrir (obtenu : ${err})`)

  // Le canal Commerce du copieur apporte bien du Tourisme.
  const copieAvant = effetsCommerceJoueur(state, copieur, state.saison, C)['Tourisme'] ?? 0
  assert.ok(copieAvant > 0, `le commerce doit apporter du Tourisme (obtenu : ${copieAvant})`)

  // Après un tour complet : la route vit toujours (aucun marchand
  //  titulaire à perdre — dissociation 3b), la production de
  //  Tourisme COMPTE la copie (bug B4 corrigé) et le stock égale la
  //  production (invariant « stock = production »).
  runTurn(state)
  const copieApres = effetsCommerceJoueur(state, copieur, state.saison, C)['Tourisme'] ?? 0
  assert.ok(copieApres > 0, `la route doit toujours apporter du Tourisme après le tour (obtenu : ${copieApres})`)
  assert.ok(tourismeCourant(state, copieur, C) >= copieApres,
    `la production de Tourisme doit inclure le Tourisme copié (${tourismeCourant(state, copieur, C)} < ${copieApres})`)
  assert.equal(copieur.resources['Tourisme']?.stock, Math.max(0, tourismeCourant(state, copieur, C)),
    'le stock de Tourisme doit égaler la production courante (copie commerce comprise)')
})

test('routes dissociées (3b) : PAS d Or passif — le ciblé ne reçoit rien au stock, le propriétaire n a que la copie', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const cible = state.players[1]
  const C = cfgOf(state.config)
  const villeCible = cible.villes[0]
  villeCible.amenagements = [...(villeCible.amenagements ?? []), 'Hôtel de tourisme']

  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', cible.n, null, villeCible.nom, 'Hôtel de tourisme')
  assert.equal(err, null, `la route doit s'ouvrir (obtenu : ${err})`)

  // Le propriétaire : la COPIE seule (Tourisme), jamais d'Or passif.
  const effetsProp = effetsCommerceJoueur(state, copieur, state.saison, C)
  assert.ok((effetsProp['Tourisme'] ?? 0) > 0, 'la copie de l Hôtel de tourisme apporte du Tourisme')
  assert.equal(effetsProp['Or'], undefined, 'plus d Or passif (marchandOrTour retiré le 2026-10-24)')
  // Le joueur ciblé : RIEN au stock (son gain est l emplacement de Marchand).
  assert.equal(Object.keys(effetsCommerceJoueur(state, cible, state.saison, C)).length, 0,
    'le joueur ciblé ne reçoit plus rien au stock')
})

test('routes dissociées (3b) : +1 emplacement de Marchand de CHAQUE côté (ctx routes du cap)', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const cible = state.players[1]
  const C = cfgOf(state.config)
  const villeCible = cible.villes[0]
  villeCible.amenagements = [...(villeCible.amenagements ?? []), 'Hôtel de tourisme']

  const sans = capMetierVille('Marchand', copieur.villes[0], C, { state, joueur: copieur.n })
  assert.equal(sans, 0, 'sans route : aucun emplacement de Marchand')
  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', cible.n, null, villeCible.nom, 'Hôtel de tourisme')
  assert.equal(err, null, `la route doit s'ouvrir (obtenu : ${err})`)
  assert.equal(capMetierVille('Marchand', copieur.villes[0], C, { state, joueur: copieur.n }), 1,
    '+1 emplacement de Marchand à l origine (route sortante)')
  assert.equal(capMetierVille('Marchand', villeCible, C, { state, joueur: cible.n }), 1,
    '+1 emplacement de Marchand à la cible (route entrante)')
  assert.equal(routesCommerceVers(state, cible.n).length, 1, 'la route est entrante pour la cible')
})

test('routes dissociées (3b) : fermeture par l ORIGINE seule (✕), la cible n a pas de bouton', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const cible = state.players[1]
  const villeCible = cible.villes[0]
  villeCible.amenagements = [...(villeCible.amenagements ?? []), 'Hôtel de tourisme']
  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', cible.n, null, villeCible.nom, 'Hôtel de tourisme')
  assert.equal(err, null, `la route doit s'ouvrir (obtenu : ${err})`)

  const routeId = state.routesCommerce![0].id
  const res = supprimerRouteCommerce(state, routeId)
  assert.equal(res, null, `la fermeture par l origine doit marcher (obtenu : ${res})`)
  assert.equal(routesCommerceDe(state, copieur.n).length, 0, 'la route sortante est fermée')
  assert.equal(routesCommerceVers(state, cible.n).length, 0, 'plus de route entrante pour la cible')
  assert.ok(state.log.some((l) => l.type === 'Commerce' && l.texte.includes('fermée par son origine')),
    'log de fermeture « par son origine »')
})

test('routes dissociées (3b) : cible CITÉ LIBRE — rien à copier, +1 Marchand, métier accessible à ses habitants', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const C = cfgOf(state.config)
  state.citesLibres = [{ nom: 'Cité Marchande', type: 'Industrielles - Ville' }]
  const cite = state.citesLibres[0]

  assert.deepEqual(metiersAccessiblesCite(state, cite, C).includes('Marchand'), false,
    'sans route entrante : Marchand inaccessible aux habitants de la cité')
  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', null, 'Cité Marchande', 'Cité Marchande', null)
  assert.equal(err, null, `la route vers la cité libre doit s'ouvrir (obtenu : ${err})`)

  assert.equal(capMarchandsCite(state, cite), 1, 'la cité a 1 emplacement de Marchand (route entrante)')
  assert.equal(routesCommerceVersCite(state, 'Cité Marchande').length, 1, 'routesCommerceVersCite la voit')
  assert.ok(metiersAccessiblesCite(state, cite, C).includes('Marchand'),
    'avec une route entrante : Marchand accessible aux habitants de la cité (production soumise aux taxes du suzerain)')
  assert.equal(capMetierVille('Marchand', copieur.villes[0], C, { state, joueur: copieur.n }), 1,
    '+1 emplacement de Marchand à l origine aussi (cité ciblée)')
  // rien à copier : changer la copie refuse
  const route = state.routesCommerce![0]
  assert.ok(route.amenagement === null, 'rien à copier vers une cité libre')
})

test('routes dissociées (3b) : purge des vieilles routes « marchand titulaire » (marchandId) au nettoyer', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const cible = state.players[1]
  // une route ANCIENNE (sauvegarde d avant la 3b) : champ marchandId
  state.routesCommerce = [{
    id: 'r-vieux', joueur: copieur.n, villeOrigine: 'Capitale A',
    joueurCible: cible.n, citeCible: null, villeCible: 'Capitale B',
    amenagement: 'Champ', marchandId: 'm-1',
  } as RouteCommerce]
  const mortes = nettoyerRoutesCommerce(state)
  assert.equal(mortes.length, 1, 'la vieille route est morte (ancien modèle)')
  assert.equal((state.routesCommerce ?? []).length, 0, 'elle est purgée')
  assert.ok(state.log.some((l) => l.type === 'Commerce' && l.texte.includes('ancien modèle')),
    'log dédié « ancien modèle (marchand titulaire) — à rouvrir manuellement »')
  // les accesseurs l ignoraient déjà avant la purge
  state.routesCommerce = [{
    id: 'r-vieux', joueur: copieur.n, villeOrigine: 'Capitale A',
    joueurCible: cible.n, citeCible: null, villeCible: 'Capitale B',
    amenagement: 'Champ', marchandId: 'm-1',
  } as RouteCommerce]
  assert.equal(routesCommerceDe(state, copieur.n).length, 0,
    'les accesseurs ne voient pas les routes de l ancien modèle')
  assert.equal(capMetierVille('Marchand', copieur.villes[0], cfgOf(state.config), { state, joueur: copieur.n }), 0,
    'les vieilles routes n ouvrent aucun emplacement')
})
