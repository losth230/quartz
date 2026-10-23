// ═══════════════════════════════════════════════════════════════════════════
//  TESTS COMMERCE — ROUTES DISSOCIÉES (sous-vague 3b, arbitrage Thibaut
//  2026-10-24, puis « suppression du métier de Marchand » du 2026-10-24) :
//  une route relie une ville d'origine à la ville d'un autre joueur ou
//  à une cité libre, SANS personnage — copie de l'aménagement dans la
//  ville d'origine (avec ses emplacements de métier), PAS d'Or passif
//  (marchandOrTour retiré), fermeture par l'origine seule, purge des
//  vieilles routes « marchandId ». Le métier de Marchand n'existe
//  PLUS : les routes n'ouvrent aucun emplacement de Marchand ; vers
//  une cité libre, une route octroie +1 émissaire tant qu'elle est
//  active (emissairesEffectifsCite).
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
  routesCommerceDe, routesCommerceVers, routesCommerceVersCite,
  nettoyerRoutesCommerce, supprimerRouteCommerce,
} from './commerce'
import { capMetierVille } from './metiers'
import { metiersAccessiblesCite, emissairesEffectifsCite } from './citesLibres'
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

test('routes dissociées (3b) : PAS d Or passif — le ciblé ne reçoit rien du tout, le propriétaire n a que la copie', () => {
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
  // Le joueur ciblé : RIEN au stock (2026-10-24, arbitrage Thibaut :
  //  le métier de Marchand est retiré du jeu — l'emplacement que la
  //  route ouvrait côté cible a disparu avec lui).
  assert.equal(Object.keys(effetsCommerceJoueur(state, cible, state.saison, C)).length, 0,
    'le joueur ciblé ne reçoit plus rien au stock')
})

test('routes dissociées (3b) : la copie ouvre les emplacements du métier copié à l ORIGINE SEULE — plus d emplacement de Marchand (retiré du jeu)', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const cible = state.players[1]
  const C = cfgOf(state.config)
  const villeCible = cible.villes[0]
  // La Scierie porte 2 emplacements de Bûcheron ; injectée dans la
  //  ville cible, la route sortante copie SES emplacements dans la
  //  ville d'ORIGINE (la route est injectée directement : le
  //  référentiel 3a ne combine plus production ET emplacements dans
  //  un même aménagement, la copie d'emplacements vise les configs
  //  personnalisées/antérieures qui les portent encore).
  villeCible.amenagements = [...(villeCible.amenagements ?? []), 'Scierie']
  const capBucheronAvant = capMetierVille('Bûcheron', copieur.villes[0], C, { state, joueur: copieur.n })
  state.routesCommerce = [{
    id: 'rc-copie', joueur: copieur.n, villeOrigine: 'Capitale A',
    joueurCible: cible.n, citeCible: null, villeCible: villeCible.nom,
    amenagement: 'Scierie',
  }]
  assert.equal(
    capMetierVille('Bûcheron', copieur.villes[0], C, { state, joueur: copieur.n }),
    capBucheronAvant + 2,
    'la copie de la Scierie ouvre SES 2 emplacements de Bûcheron dans la ville d origine (ctx routes du cap)',
  )
  // Côté CIBLE : la route n'ouvre RIEN (sa propre Scierie compte déjà
  //  via ses aménagements — la route n'ajoute rien).
  const capBucheronCible = capMetierVille('Bûcheron', villeCible, C, { state, joueur: cible.n })
  state.routesCommerce = []
  assert.equal(
    capMetierVille('Bûcheron', villeCible, C, { state, joueur: cible.n }),
    capBucheronCible,
    'la route n ouvre AUCUN emplacement côté cible (sa Scierie compte déjà, la route n ajoute rien)',
  )
  // Le métier de Marchand est RETIRÉ du jeu (arbitrage Thibaut
  //  2026-10-24) : titre mort → cap ∞, plus AUCUN emplacement par
  //  route (sortante ou entrante).
  state.routesCommerce = [{
    id: 'rc-copie', joueur: copieur.n, villeOrigine: 'Capitale A',
    joueurCible: cible.n, citeCible: null, villeCible: villeCible.nom,
    amenagement: 'Scierie',
  }]
  assert.equal(
    capMetierVille('Marchand', copieur.villes[0], C, { state, joueur: copieur.n }),
    Number.POSITIVE_INFINITY,
    'Marchand retiré du jeu : titre mort, cap ∞ (plus d emplacement par route sortante)',
  )
  assert.equal(
    capMetierVille('Marchand', villeCible, C, { state, joueur: cible.n }),
    Number.POSITIVE_INFINITY,
    'côté cible non plus : plus d emplacement par route entrante',
  )
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

test('routes dissociées (3b) : cible CITÉ LIBRE — rien à copier, +1 émissaire tant que la route est active (arbitrage 2026-10-24)', () => {
  const state = partieDeuxJoueurs()
  normaliserEtat(state)
  const copieur = state.players[0]
  const C = cfgOf(state.config)
  state.citesLibres = [{ nom: 'Cité Marchande', type: 'Industrielles - Ville' }]
  const cite = state.citesLibres[0]

  // Le métier de Marchand est retiré du jeu : JAMAIS accessible aux
  //  habitants de la cité, routes ou pas (metiersAccessiblesCite est
  //  revenue à Chasseur + Gouverneur).
  assert.ok(!metiersAccessiblesCite(state, cite, C).includes('Marchand'),
    'Marchand retiré du jeu : jamais accessible aux habitants de la cité')

  // Sans route : émissaires effectifs = émissaires placés seuls.
  cite.emissaires = { [copieur.n]: 1 }
  assert.equal(emissairesEffectifsCite(state, cite, copieur.n), 1,
    'sans route : seuls les émissaires placés comptent')
  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', null, 'Cité Marchande', 'Cité Marchande', null)
  assert.equal(err, null, `la route vers la cité libre doit s'ouvrir (obtenu : ${err})`)
  assert.equal(routesCommerceVersCite(state, 'Cité Marchande').length, 1, 'routesCommerceVersCite la voit')

  // +1 émissaire par route active, uniquement pour le joueur à l'origine.
  assert.equal(emissairesEffectifsCite(state, cite, copieur.n), 2,
    'avec une route active : +1 émissaire (placés + routes)')
  assert.equal(emissairesEffectifsCite(state, cite, state.players[1].n), 0,
    'les routes ne comptent que pour le joueur à l origine')

  // Fermeture de la route → retour aux seuls émissaires placés.
  assert.equal(supprimerRouteCommerce(state, state.routesCommerce![0].id), null)
  assert.equal(emissairesEffectifsCite(state, cite, copieur.n), 1,
    'route fermée : retour aux émissaires placés seuls (le bonus disparaît)')

  // Rien à copier vers une cité libre.
  state.routesCommerce = []
  const err2 = creerRouteCommerce(state, copieur.n, 'Capitale A', null, 'Cité Marchande', 'Cité Marchande', null)
  assert.equal(err2, null)
  assert.ok(state.routesCommerce![0].amenagement === null, 'rien à copier vers une cité libre')
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
  // NB : la vieille route copie une SCIERIE (2 emplacements de
  //  Bûcheron) — si elle comptait, la cap Bûcheron de l'origine
  //  passerait à 2 ; elle est ignorée (marchandId).
  state.routesCommerce = [{
    id: 'r-vieux', joueur: copieur.n, villeOrigine: 'Capitale A',
    joueurCible: cible.n, citeCible: null, villeCible: 'Capitale B',
    amenagement: 'Scierie', marchandId: 'm-1',
  } as RouteCommerce]
  assert.equal(routesCommerceDe(state, copieur.n).length, 0,
    'les accesseurs ne voient pas les routes de l ancien modèle')
  assert.equal(capMetierVille('Bûcheron', copieur.villes[0], cfgOf(state.config), { state, joueur: copieur.n }), 0,
    'les vieilles routes (marchandId) n ouvrent aucun emplacement, même en copiant un aménagement qui en porte')
})
