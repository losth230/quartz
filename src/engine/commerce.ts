// ══════════════════════════════════════════════════════════════════════
// COMMERCE — ROUTES COMMERCIALES DISSOCIÉES (vague 3b)
//  Arbitrage Thibaut 2026-10-24 (« on peut passer à la vague 3b ») :
//  la route est OUVERTE PAR LE JOUEUR, indépendamment de tout
//  personnage (gratuit — arbitrage). Elle relie une ville d'ORIGINE du
//  joueur à la ville d'un AUTRE joueur ou à une CITÉ LIBRE (arbitrage).
//  Effets :
//    · JOUEUR → VILLE : le joueur à l'origine COPIE exactement UN
//      aménagement de la ville ciblée — sa production ET ses
//      emplacements de population (matérialisés dans la ville
//      d'origine : la cap de métiers les compte, engine/metiers.ts
//      emplacementsRoutesVille). Le joueur ciblé ne reçoit RIEN.
//    · JOUEUR → CITÉ LIBRE : rien à copier ; la route octroie +1
//      émissaire auprès de la cité TANT QUE LA ROUTE EST ACTIVE
//      (arbitrage Thibaut 2026-10-24 « suppression du métier de
//      Marchand » — cf. citesLibres.ts emissairesEffectifsCite).
//    · l'ancien bonus d'Or passif des deux côtés (marchandOrTour)
//      a DISPARU (vague 3b) ; le métier de Marchand lui-même a été
//      RETIRÉ du jeu le 2026-10-24 (arbitrage Thibaut : « supprime
//      carrément le métier de marchand »).
//  Fermeture : bouton ✕ du seul joueur à l'ORIGINE (arbitrage) ;
//  nettoyage automatique des routes mortes (ville ou aménagement
//  disparus, cible annexée) à chaque fin de tour.
//  Copie (marqueur (u)) : l'aménagement ENTIER est copié — toutes ses
//  ressources positives (flux + production d'été, créditée en été
//  seulement) ; la Garnison (valeur d'état) et les effets négatifs
//  sont exclus ; le Tourisme EST copiable (arbitrage Thibaut
//  2026-10-19 : stock de Tourisme = production, jamais cumulé).
//  Canal « Commerce » du récap ressources (engine/production.ts),
//  étape 3terdecies de FinDeTour.
//  HISTORIQUE (règle 9) : l'ancien modèle « un marchand tient la
//  route » (marqueur (t), +marchandOrTour Or pour les deux joueurs,
//  promotion automatique peuplerMarchands) a été RETIRÉ le
//  2026-10-24 ; les routes des anciennes sauvegardes (champ
//  marchandId) sont SUPPRIMÉES (arbitrage Thibaut : « à rouvrir
//  manuellement ») — ignorées par les accès ci-dessous et purgées
//  physiquement par nettoyerRoutesCommerce. L'ancien contenu vit
//  dans l'historique git et le journal technique.
//  HYGIÈNE D'IMPORT (règle durable, incident CI #36 du 2026-10-19) : ce
//  module est importé par regimes.ts (canal Tourisme du commerce) — ne
//  JAMAIS importer amenagements.ts ici (effets de bord top-level :
//  AMENAGEMENTS) : le cycle constructions→banque→regimes→commerce→
//  amenagements fait planter l'initialisation du moteur (TDZ). Les
//  recherches du référentiel passent par constructions.ts (constructionRef).
// ══════════════════════════════════════════════════════════════════════

import type {
  City, GameState, Player, RouteCommerce, Saison,
} from './types'
import type { GameConfig } from '../config/defaultConfig'
import { cfgOf, type Cfg } from './gameData'
import { constructionRef, effetsConstructionRef, effetsEteConstructionRef } from './constructions'
import { nbBatiments } from './factions'
import { aTech } from './progresAuto'

/** Toutes les routes commerciales du monde (champ optionnel → vide).
 *  Seules les routes du modèle DISSOCIÉ (sans marchandId) sont
 *   visibles : les routes de l'ancien modèle (marchandId) sont
 *   supprimées à la première fin de tour (nettoyerRoutesCommerce,
 *  arbitrage 2026-10-24 « à rouvrir manuellement »). */
export function routesCommerce(state: GameState): RouteCommerce[] {
  return (state.routesCommerce ?? []).filter((r) => !('marchandId' in r))
}

/** Routes dont le joueur est à l'ORIGINE (il encaisse la copie). */
export function routesCommerceDe(state: GameState, joueur: number): RouteCommerce[] {
  return routesCommerce(state).filter((r) => r.joueur === joueur)
}

/** Routes qui visent une ville DU joueur (affichage de la page
 *  Commerce : le joueur ciblé ne reçoit RIEN au stock ni en
 *  emplacements — l'ancien Or passif a disparu avec la vague 3b, et
 *  le métier de Marchand a été retiré du jeu le 2026-10-24). */
export function routesCommerceVers(state: GameState, joueur: number): RouteCommerce[] {
  return routesCommerce(state).filter((r) => r.joueurCible === joueur)
}

/** Routes qui visent une CITÉ LIBRE : chaque route octroie +1
 *  émissaire auprès de la cité TANT QUE la route est active
 *  (arbitrage Thibaut 2026-10-24 « suppression du métier de
 *  Marchand » — cf. citesLibres.ts emissairesEffectifsCite). */
export function routesCommerceVersCite(state: GameState, cite: string): RouteCommerce[] {
  return routesCommerce(state).filter((r) => r.joueurCible === null && (r.citeCible ?? r.villeCible) === cite)
}

/** Ressource copiable d'un aménagement : valeur par tour, été ou non. */
export interface RessourceCopiable {
  ressource: string
  valeur: number
  ete: boolean
}

/** Ressources COPiables d'un aménagement : flux POSITIFS (hors été) et
 *  production d'été positive — la Garnison (valeur d'état, canal
 *  dédié de la banque) est exclue par effetsConstructionRef /
 *  effetsEteConstructionRef ; le Tourisme, flux NORMAL (retour Thibaut
 *  2026-10-16), EST copiable — CONFIRMÉ par arbitrage Thibaut 2026-10-19
 *  (« le Tourisme peut être copié : le stock n'est jamais mis à jour avec
 *  la production, il est recalculé pour l'égaler — stock = production ») ;
 *  les effets négatifs (coûts, ex. Charbon −1 du Moulin à vent) ne sont
 *  pas copiables. */
export function ressourcesCopiables(nom: string, cfg?: GameConfig): RessourceCopiable[] {
  // 2026-10-19 (correctif cycle d'import, incident CI #36) : constructionRef
  //  remplace amenagementRef (alias strict — amenagements.ts l'implémente
  //  comme `return constructionRef(nom, cfg)`), même recherche par nom exact.
  const ref = constructionRef(nom, cfg)
  if (!ref) return []
  const out: RessourceCopiable[] = []
  for (const [res, v] of Object.entries(effetsConstructionRef(ref))) {
    if (v > 0) out.push({ ressource: res, valeur: v, ete: false })
  }
  for (const [res, v] of Object.entries(effetsEteConstructionRef(ref))) {
    if (v > 0) out.push({ ressource: res, valeur: v, ete: true })
  }
  return out
}

/** Aménagements d'une ville qui possèdent AU MOINS une ressource
 *  copiable (sans doublés, dans l'ordre de la ville). */
export function amenagementsCopiables(ville: City, cfg?: GameConfig): string[] {
  const out: string[] = []
  for (const nom of ville.amenagements ?? []) {
    if (!out.includes(nom) && ressourcesCopiables(nom, cfg).length > 0) out.push(nom)
  }
  return out
}

/** Effets par tour d'UNE route pour son joueur à l'ORIGINE : copie de
 *  la production de l'aménagement ENTIER choisi (valeur COURANTE du
 *  référentiel — éditable à chaud ; les productions d'été ne sont
 *  créditées qu'en été). Une route vers une CITÉ LIBRE ne copie
 *  rien (pas d'aménagement — arbitrage 2026-10-24) : son seul apport
 *  est le +1 émissaire auprès de la cité (tant que la route est
 *  active). Les emplacements de population de l'aménagement copié
 *  sont comptés par les caps (engine/metiers.ts), pas crédités ici. */
export function effetsRouteProprietaire(
  route: RouteCommerce, saison: Saison, C: Cfg = cfgOf(),
): Record<string, number> {
  const out: Record<string, number> = {}
  if (!route.amenagement) return out
  // Marqueur (u) : l'aménagement ENTIER est copié — toutes ses
  // ressources copiables (flux positifs + été en été).
  for (const cop of ressourcesCopiables(route.amenagement, C.config)) {
    if (cop.ete && saison !== 'Été') continue
    out[cop.ressource] = (out[cop.ressource] ?? 0) + cop.valeur
  }
  return out
}

/** Effets par tour du commerce pour un joueur : la COPIE de ses
 *  routes (ville d'origine → ville ciblée). Le joueur ciblé ne
 *  reçoit RIEN (l'ancien Or passif marchandOrTour a disparu avec la
 *  vague 3b, puis le métier de Marchand a été retiré du jeu le
 *  2026-10-24, arbitrage Thibaut). */
export function effetsCommerceJoueur(
  state: GameState, p: Player, saison: Saison, C: Cfg = cfgOf(state.config),
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const route of routesCommerceDe(state, p.n)) {
    const src = effetsRouteProprietaire(route, saison, C)
    for (const [res, v] of Object.entries(src)) {
      out[res] = (out[res] ?? 0) + v
    }
  }
  return out
}

/** Détail des apports de commerce d'un joueur (provenance du récap
 *  ressources) : une ligne par route possédée. Les routes ENTRANTES
 *  ne sont pas listées : elles ne créditent plus rien au stock
 *  (le métier de Marchand a été retiré du jeu le 2026-10-24). */
export interface DetailCommerce {
  origine: string
  effets: Record<string, number>
}

export function detailCommerceJoueur(
  state: GameState, p: Player, saison: Saison, C: Cfg = cfgOf(state.config),
): DetailCommerce[] {
  const out: DetailCommerce[] = []
  for (const route of routesCommerceDe(state, p.n)) {
    const nomCible = nomCibleRoute(state, route)
    const effets = effetsRouteProprietaire(route, saison, C)
    if (Object.keys(effets).length === 0 && !route.amenagement) {
      out.push({
        origine: `route ${route.villeOrigine} ↔ ${nomCible} (+1 émissaire auprès de la cité tant que la route est active)`,
        effets: {},
      })
      continue
    }
    out.push({
      origine: `route ${route.villeOrigine} ↔ ${nomCible} — copie de ${route.amenagement}`,
      effets,
    })
  }
  return out
}

/** Nom affichable de la cible d'une route : « Ville (Joueur) » ou
 *  « Cité (cité libre) ». */
function nomCibleRoute(state: GameState, route: RouteCommerce): string {
  if (route.joueurCible === null) {
    return `${route.citeCible ?? route.villeCible} (cité libre)`
  }
  const cible = state.players.find((q) => q.n === route.joueurCible)
  return `${route.villeCible} (${cible?.nom ?? '?'})`
}

/** Supprime les routes MORTES (appelée à chaque FinDeTour avant le
 *  crédit). Trois familles :
 *    · routes de l'ANCIEN modèle (marchandId) : supprimées sans
 *      conditions — arbitrage Thibaut 2026-10-24 (« à rouvrir
 *      manuellement »), la mécanique du marchand titulaire n'existe
 *      plus ;
 *    · ville d'origine perdue par le joueur à l'origine ;
 *    · cible disparue : joueur ciblé ou sa ville n'existe plus, cité
 *      ciblée annexée, ou l'aménagement copié n'est plus dans la
 *      ville ciblée (la copie redeviendrait vide).
 *  Log « Commerce » pour chaque route fermée. */
export function nettoyerRoutesCommerce(state: GameState): RouteCommerce[] {
  const avant = state.routesCommerce ?? []
  const mortes = avant.filter((r) => {
    if ('marchandId' in r) return true
    const proprietaire = state.players.find((q) => q.n === r.joueur)
    if (!proprietaire || !proprietaire.villes.some((v) => v.nom === r.villeOrigine)) return true
    if (r.joueurCible === null) {
      // cible cité libre : elle doit exister
      return !(state.citesLibres ?? []).some((c) => c.nom === (r.citeCible ?? r.villeCible))
    }
    const cible = state.players.find((q) => q.n === r.joueurCible)
    const ville = cible?.villes.find((v) => v.nom === r.villeCible)
    if (!ville) return true
    if (!r.amenagement) return false
    return !(ville.amenagements ?? []).includes(r.amenagement)
  })
  if (mortes.length === 0) return []
  const ids = new Set(mortes.map((r) => r.id))
  state.routesCommerce = avant.filter((r) => !ids.has(r.id))
  for (const r of mortes) {
    const motif = 'marchandId' in r
      ? 'ancien modèle (marchand titulaire) — arbitrage 2026-10-24 : à rouvrir manuellement'
      : `la ville d'origine ou la cible (${nomCibleRoute(state, r)}) n'existe plus, ou l'aménagement copié a disparu`
    state.log.push({
      turn: state.turn + 1, type: 'Commerce', joueur: r.joueur,
      texte: `Route commerciale ${r.villeOrigine} ↔ ${nomCibleRoute(state, r)} fermée : ${motif}.`,
    })
  }
  return mortes
}

/** Crédite au stock les effets de commerce de chaque joueur (étape
 *  3terdecies de FinDeTour) et renvoie les apports par joueur. Comme
 *  les bâtiments : pas de taxes, pas de coefficient gainsCrediteStock,
 *  pas de prélèvement de vassalité. */
export function appliquerEffetsCommerce(
  state: GameState, C: Cfg = cfgOf(state.config),
): Record<number, Record<string, number>> {
  const out: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    const effets = effetsCommerceJoueur(state, p, state.saison, C)
    for (const [res, v] of Object.entries(effets)) {
      const rs = p.resources[res]
      if (rs) rs.stock += v
    }
    out[p.n] = effets
  }
  return out
}

/** Nombre maximal de ROUTES commerciales d'un joueur (cap
 *  ANNONCE, jamais bloquant — convention du jeu) : paramètre
 *  maxMarchands (0 par défaut), +1 par technologie « route
 *  supplémentaire » (Commerce, Collecte d'impôts), +1 par Plateforme
 *  commerciale ou Guilde des marchands (qui la remplace), +1 par
 *  Echoppe (« permet d'entretenir 1 route commerciale
 *  supplémentaire »). Renommé de maxMarchandsJoueur le 2026-10-24
 *  (vague 3b : les routes ne sont plus portées par des marchands). */
export function maxRoutesJoueur(
  p: Player,
  C: { p: { maxMarchands: number } } & import('./gameData').Cfg,
): number {
  let max = C.p.maxMarchands
  if (aTech(p, 'Commerce', C)) max += 1
  if (aTech(p, "Collecte d'impôts", C)) max += 1
  max += nbBatiments(p, 'Plateforme commerciale')
  max += nbBatiments(p, 'Guilde des marchands')
  max += nbBatiments(p, 'Echoppe')
  return max
}

/** Ouvre une route commerciale DISSOCIÉE (vague 3b, arbitrage
 *  Thibaut 2026-10-24) : GRATUITE (arbitrage), ouverte par le joueur,
 *  sans personnage — elle relie une ville d'origine du joueur à la
 *  ville d'un autre joueur (aménagement copiable copié : production +
 *  emplacements de population dans la ville d'origine) ou à une cité
 *  libre (rien à copier ; +1 émissaire auprès de la cité tant que
 *  la route est active — arbitrage Thibaut 2026-10-24, métier de
 *  Marchand retiré du jeu).
 *  Retourne null si OK, sinon le motif d'erreur (affiché en rouge,
 *  jamais bloquant — convention « dons et mariages », marqueur (r)). */
export function creerRouteCommerce(
  state: GameState,
  joueur: number, villeOrigine: string,
  joueurCible: number | null, citeCible: string | null, villeCible: string,
  amenagement: string | null,
): string | null {
  const C = cfgOf(state.config)
  const pj = state.players.find((q) => q.n === joueur)
  if (!pj) return 'Joueur à l\'origine introuvable.'
  // Plafond de routes : cap ANNONCE, jamais un blocage — le joueur
  //  peut dépasser le nombre de routes « disponibles » (dépassement
  //  annoncé au journal, comme l'ancien cap de marchands).
  const nb = routesCommerceDe(state, joueur).length
  const cap = maxRoutesJoueur(pj, C)
  if (nb > cap) {
    state.log.push({
      turn: state.turn, type: 'Commerce', joueur,
      texte: `🛒 ${pj.nom} dépasse son cap de routes commerciales (${nb} route(s) pour ${cap} conseillées).`,
    })
  }
  if (!pj.villes.some((v) => v.nom === villeOrigine)) {
    return `« ${villeOrigine} » n'est pas une de tes villes.`
  }
  if (joueurCible === null) {
    // ── cible CITÉ LIBRE (arbitrage 2026-10-24) ──
    const cite = (state.citesLibres ?? []).find((c) => c.nom === (citeCible ?? villeCible))
    if (!cite) return 'Cité libre ciblée introuvable.'
    ;(state.routesCommerce ?? (state.routesCommerce = [])).push({
      id: `rc-${joueur}-${nb}-${cite.nom}`,
      joueur, villeOrigine,
      joueurCible: null, citeCible: cite.nom, villeCible: cite.nom,
      amenagement: null,
    })
    state.log.push({
      turn: state.turn, type: 'Commerce', joueur,
      texte: `🛒 Route commerciale ouverte : ${villeOrigine} ↔ ${cite.nom} (cité libre) — +1 émissaire auprès de la cité tant que la route est active (métier de Marchand retiré du jeu, arbitrage 2026-10-24).`,
    })
    return null
  }
  // ── cible VILLE D'UN AUTRE JOUEUR ──
  if (joueurCible === joueur) return "La route doit viser la ville d'un autre joueur ou une cité libre."
  const cible = state.players.find((q) => q.n === joueurCible)
  const ville = cible?.villes.find((v) => v.nom === villeCible)
  if (!ville) return 'Ville ciblée introuvable chez ce joueur.'
  if (!amenagement) return 'Choisis un aménagement à copier.'
  if (!(ville.amenagements ?? []).includes(amenagement)) {
    return `${villeCible} ne possède pas l'aménagement « ${amenagement} ».`
  }
  const cops = ressourcesCopiables(amenagement, C.config)
  if (cops.length === 0) {
    return `« ${amenagement} » n'a aucune production copiable.`
  }
  ;(state.routesCommerce ?? (state.routesCommerce = [])).push({
    id: `rc-${joueur}-${nb}-${villeCible}`,
    joueur, villeOrigine,
    joueurCible, citeCible: null, villeCible,
    amenagement,
  })
  state.log.push({
    turn: state.turn, type: 'Commerce', joueur,
    texte: `🛒 Route commerciale ouverte : ${villeOrigine} ↔ ${villeCible} (${cible?.nom ?? '?'}) — copie de « ${amenagement} » (${cops.map((c) => `${c.valeur} ${c.ressource}${c.ete ? ' (été)' : ''}`).join(', ')}).`,
  })
  return null
}

/** Change l'aménagement copié d'une route — modifiable à tout moment
 *  (arbitrage Thibaut 2026-10-15 ; marqueur (u) : aménagement entier).
 *  Une route vers une cité libre n'a RIEN à copier : la fonction
 *  refuse (elle n'a jamais rien copié). */
export function changerCopieRoute(
  state: GameState, routeId: string, amenagement: string,
): string | null {
  const C = cfgOf(state.config)
  const route = routesCommerce(state).find((r) => r.id === routeId)
  if (!route) return 'Route introuvable.'
  if (route.joueurCible === null) return 'Cette route vise une cité libre : rien à copier.'
  const cible = state.players.find((q) => q.n === route.joueurCible)
  const ville = cible?.villes.find((v) => v.nom === route.villeCible)
  if (!ville) return 'Ville ciblée introuvable chez ce joueur.'
  if (!(ville.amenagements ?? []).includes(amenagement)) {
    return `${route.villeCible} ne possède pas l'aménagement « ${amenagement} ».`
  }
  const cops = ressourcesCopiables(amenagement, C.config)
  if (cops.length === 0) {
    return `« ${amenagement} » n'a aucune production copiable.`
  }
  route.amenagement = amenagement
  state.log.push({
    turn: state.turn, type: 'Commerce', joueur: route.joueur,
    texte: `🛒 Route ${route.villeOrigine} ↔ ${nomCibleRoute(state, route)} : copie désormais « ${amenagement} » (${cops.map((c) => `${c.valeur} ${c.ressource}${c.ete ? ' (été)' : ''}`).join(', ')}).`,
  })
  return null
}

/** Ferme une route commerciale — bouton ✕ de la page Pays, réservé
 *  au joueur à l'ORIGINE (arbitrage Thibaut 2026-10-24 : seul
 *  l'origine peut fermer sa route ; la cible n'a pas de bouton). */
export function supprimerRouteCommerce(state: GameState, routeId: string): string | null {
  const routes = routesCommerce(state)
  const route = routes.find((r) => r.id === routeId)
  if (!route) return 'Route introuvable.'
  state.routesCommerce = routes.filter((r) => r.id !== routeId)
  state.log.push({
    turn: state.turn, type: 'Commerce', joueur: route.joueur,
    texte: `🛒 Route commerciale ${route.villeOrigine} ↔ ${nomCibleRoute(state, route)} fermée par son origine.`,
  })
  return null
}
