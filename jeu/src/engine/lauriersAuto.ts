// ══════════════════════════════════════════════════════════════════════
//  JAUGES DE LAURIERS — progression AUTOMATIQUE des conditions
//  (arbitrage Thibaut 2026-11-16 : « jauge automatique avec coche
//  manuelle » — l'app AFFICHE où en est chaque joueur, l'ARBITRE
//  reste maître du cochage au radar)
// ══════════════════════════════════════════════════════════════════════
//  Chaque condition des Lauriers I à V est CALCULABLE depuis l'état
//  (audit 2026-11-16 : 100 % des conditions) — ce module expose une
//  jauge { actuel, cible } par (voie, niveau), PURE, sans état ni
//  mutation. La validation reste 100 % MANUELLE (cocherLaurier) :
//  la jauge élimine les erreurs de saisie mais ne coche JAMAIS,
//  pour deux raisons de design actées :
//   1. certaines conditions sont TRANSITOIRES (300 pts d'armée perdus
//      au tour suivant, routes fermées, rang de pays déchu) — le
//      Laurier, lui, ne se « dévalide » pas ;
//   2. les talents de peuple sont DÉRIVÉS des Lauriers cochés : une
//      coche automatique y mettrait le feu avec les allers-retours.
//
//  Arbitrages de comptage (2026-11-16) :
//   · Culturelle I « 100 Tourisme » = PRODUCTION de Tourisme par
//     tour ≥ 100 (le Tourisme n'est jamais cumulé — stock = prod,
//     resynchroniserTourisme) ;
//   · « Habitations » du monde (Culturelle V) = les VILLES des
//     joueurs ; les cités libres sont des « cités », pas des
//     habitations ;
//   · Militaire III : TOUTE la famille Militaire du référentiel
//     compte (quartiers inclus), bâtiments PRÉSENTS dans la liste
//     de la ville (les remplacements neutralisent les effets, pas
//     la présence) ;
//   · Économique V : 5 bâtiments de famille Guilde présents ;
//   · Militaire V : réduction TOTALE de levée (bâtiments + loi
//     Conscription + talents) via reductionLeveeArmeeVille, la
//     MEILLEURE habitation du joueur doit atteindre 100.
//  La voie Scientifique (Lauriers vides, différée) et toute
//  condition inconnue → jauge null (repli « … » au radar).
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player, City } from './types'
import type { Cfg } from './gameData'
import { tourismeCourant } from './regimes'
import { rangDe } from './statutSocial'
import { bonheurVilleComplete } from './bonheur'
import { rangNiveau, rangPaysNiveau } from './rangs'
import { reductionLeveeArmeeVille } from './armees'
import { constructionRef } from './constructions'

/** Jauge d'une condition de Laurier : valeur courante / seuil de
 *  validation. `actuel >= cible` = condition remplie MAIS la coche
 *  reste manuelle (arbitrage « jauge auto, coche manuelle »). */
export interface JaugeLaurier {
  /** valeur courante du joueur (production, comptage, min, max…). */
  actuel: number
  /** seuil à atteindre (extrait de la condition du référentiel). */
  cible: number
}

/** Nombre de bâtiments de la famille donnée (Militaire, Guilde,
 *  Merveille) dans une ville — bâtiments PRÉSENTS dans la liste,
 *  indépendamment des remplacements (neutralisation d'effets). */
function nbBatimentsFamille(ville: City, famille: string, C: Cfg): number {
  return ville.batiments.filter((b) => constructionRef(b, C.config)?.famille === famille).length
}

/** Meilleur rang d'habitation du joueur (1-3, échelle de son type). */
function maxRangHabitation(p: Player, C: Cfg): number {
  return p.villes.reduce((m, v) => Math.max(m, rangNiveau(v, C)), 0)
}

/** Jauge du Laurier I de chaque voie (conditions spécifiques). */
function jaugeNiveau1(state: GameState, p: Player, voie: string, C: Cfg): JaugeLaurier | null {
  switch (voie) {
    case 'Culturelle':
      // (arbitrage 2026-11-16 : « avoir 100 tourisme = production de
      // 100 tourisme » — tourismeCourant = production du tour.)
      return { actuel: tourismeCourant(state, p, C), cible: 100 }
    case 'Démographique':
      return { actuel: p.villes.length, cible: 3 }
    case 'Diplomatique':
      return {
        actuel: (state.citesLibres ?? []).filter((c) => c.suzerain === p.n).length,
        cible: 2,
      }
    case 'Économique':
      return {
        actuel: (state.routesCommerce ?? []).filter((r) => r.joueur === p.n).length,
        cible: 2,
      }
    case 'Militaire':
      // Somme des PUISSANCES des armées levées du joueur — les
      // garnisons (calcul par ville) ne sont pas des armées en
      // campagne.
      return {
        actuel: p.armees.reduce((s, a) => s + a.puissance, 0),
        cible: 300,
      }
    default:
      return null
  }
}

/** Jauge du Laurier III de chaque voie (conditions spécifiques). */
function jaugeNiveau3(state: GameState, p: Player, voie: string, C: Cfg): JaugeLaurier | null {
  switch (voie) {
    case 'Culturelle':
      return {
        actuel: p.villes.reduce((s, v) => s + nbBatimentsFamille(v, 'Merveille', C), 0),
        cible: 3,
      }
    case 'Démographique':
      return {
        actuel: (state.population[p.n] ?? []).filter(
          (c) => c.statut !== 'Décédé' && rangDe(c, C) === 'bourgeois').length,
        cible: 100,
      }
    case 'Diplomatique':
      // rangPaysNiveau : 1 = Baronnie … 5 = Empire (rang d'Empereur).
      return { actuel: rangPaysNiveau(p, C), cible: 5 }
    case 'Économique':
      return {
        actuel: (state.population[p.n] ?? []).filter(
          (c) => c.statut !== 'Décédé' && c.metier === 'Commerçant').length,
        cible: 50,
      }
    case 'Militaire':
      return {
        actuel: p.villes.reduce((m, v) => Math.max(m, nbBatimentsFamille(v, 'Militaire', C)), 0),
        cible: 4,
      }
    default:
      return null
  }
}

/** Jauge du Laurier V de chaque voie (triomphes). */
function jaugeNiveau5(state: GameState, p: Player, voie: string, C: Cfg): JaugeLaurier | null {
  switch (voie) {
    case 'Culturelle':
      // Toutes les HABITATIONS du monde (villes des joueurs, cités
      // libres exclues — arbitrage 2026-11-16) de la culture du
      // joueur.
      return {
        actuel: state.players.reduce(
          (s, q) => s + q.villes.filter((v) => v.culture === p.culture).length, 0),
        cible: state.players.reduce((s, q) => s + q.villes.length, 0),
      }
    case 'Démographique':
      // MINIMUM du bonheur complet (moteur) sur les habitations.
      return {
        actuel: p.villes.length
          ? Math.min(...p.villes.map((v) => bonheurVilleComplete(state, p, v, C)))
          : 0,
        cible: 90,
      }
    case 'Diplomatique':
      return {
        actuel: Math.max(0, ...(state.citesLibres ?? []).map((c) => c.emissaires?.[p.n] ?? 0)),
        cible: 12,
      }
    case 'Économique':
      return {
        actuel: p.villes.reduce((s, v) => s + nbBatimentsFamille(v, 'Guilde', C), 0),
        cible: 5,
      }
    case 'Militaire':
      // MEILLEURE réduction de levée parmi les habitations du
      // joueur (bâtiments + Conscription + talents de peuple).
      return {
        actuel: p.villes.reduce(
          (m, v) => Math.max(m, reductionLeveeArmeeVille(v, p, C)), 0),
        cible: 100,
      }
    default:
      return null
  }
}

/** Jauge de la condition d'un Laurier (voie × niveau 1-5). Commune
 *  aux Lauriers II (rang 2) et IV (rang 3). Retourne null quand la
 *  condition n'est pas calculable (voie Scientifique différée,
 *  condition vide ou inconnue) — l'appelant replie sur le texte
 *  seul. FONCTION PURE : aucune mutation de l'état. */
export function jaugeCondition(state: GameState, p: Player, voie: string, niveau: number, C: Cfg): JaugeLaurier | null {
  if (niveau < 1 || niveau > 5) return null
  // Lauriers COMMUNS (arbitrage 2026-11-16) : II = habitation rang 2,
  // IV = habitation rang 3 — l'escalier du meilleur rang du joueur.
  if (niveau === 2) return { actuel: maxRangHabitation(p, C), cible: 2 }
  if (niveau === 4) return { actuel: maxRangHabitation(p, C), cible: 3 }
  if (niveau === 1) return jaugeNiveau1(state, p, voie, C)
  if (niveau === 3) return jaugeNiveau3(state, p, voie, C)
  return jaugeNiveau5(state, p, voie, C)
}

/** Jauge du PROCHAIN Laurier à accomplir d'un joueur sur une voie
 *  (niveau = Lauriers validés + 1). null si la voie est terminée
 *  (5/5) ou la condition non calculable — le radar et le tableau
 *  de l'accueil affichent « actuel/cible » à côté de la condition. */
export function jaugeProchainLaurier(state: GameState, p: Player, voie: string, C: Cfg): JaugeLaurier | null {
  const n = p.lauriers?.[voie] ?? 0
  if (n >= 5) return null
  return jaugeCondition(state, p, voie, n + 1, C)
}
