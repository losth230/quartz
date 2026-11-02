// ══════════════════════════════════════════════════════════════════════
//  DOGMES DE CULTURE — MISE EN FORME (fondations 2026-10-30)
//  Quand le Tourisme d'une CULTURE franchit un palier (50, 100,
//  150… — paramètre palierTourismeDogme), le joueur ayant le plus
//  de Tourisme dans cette culture choisit un DOGME qui affecte les
//  habitants ou les villes de cette culture.
//
//  (6e RETOUR, 2026-10-30 — arbitrage Thibaut « remplace dominant
//  par pontife » : le rôle « joueur ayant le plus de Tourisme
//  dans la culture » s'appelle désormais le PONTIFE — renommé
//  partout, identifiants compris, joueurPontifeCulture. La
//  logique est inchangée, seul le vocabulaire change.)
//
//  ARBITRAGES THIBAUT (2026-10-30) :
//   1. Un dogme à CHAQUE palier ; les dogmes se CUMULENT à
//      l'infini — jamais retirés, jamais remplacés.
//   2. Tourisme d'une culture = SOMME des valeurs de Tourisme de
//      ses villes, TOUS JOUEURS confondus, SANS les cités libres
//      (même lecture que le tableau de production de chaque ville,
//      productionVille).
//   3. Le pontife peut CHANGER d'un palier à l'autre : le
//      choix d'un palier revient au pontife au moment du choix ;
//      un dogme déjà posé n'est PAS remplaçable.
//   4. Dogmes, lois de culture et effets de culture se CUMULENT.
//
//  ÉTAT DE LA MISE EN FORME (retour Thibaut « code la mise en
//  forme sans dogme réellement créé, les dogmes définitifs
//  viendront plus tard ») : la détection des paliers, le pontife,
//  le suivi des dogmes pris, le CHOIX (validé contre la table
//  `dogmes` du référentiel — encore VIDE, DogmeDef) et
//  l'affichage (carte « Culture du pays ») sont en place. AUCUN
//  effet moteur ne lit encore un dogme : le branchement des
//  effets viendra avec les dogmes définitifs. Le journal
//  n'annonce PAS encore les paliers franchis (une annonce à
//  chaque fin de tour se répéterait tant que le choix pend) —
//  l'entrée de journal est posée au moment du CHOISIR, et
//  l'annonce de palier viendra avec les dogmes réels.
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player, City, Dogme } from './types'
import { cfgOf, type Cfg } from './gameData'
import { productionVille } from './production'
import type { DogmeDef } from '../config/defaultConfig'

/** Tourisme d'une VILLE : sa production Tourisme par tour —
 *  exactement la valeur affichée en bas du cadre de la ville
 *  (page « Pays », productionVille canal « total »). */
export function tourismeVille(state: GameState, p: Player, ville: City, C: Cfg): number {
  return productionVille(state, p, ville, C).total['Tourisme'] ?? 0
}

/** Tourisme d'une CULTURE (arbitrage 30/10 n°2) : somme des
 *  valeurs de Tourisme des villes de cette culture, TOUS JOUEURS
 *  confondus, SANS les cités libres — la fonction n'itère QUE les
 *  villes des joueurs, les cités libres sont exclues par
 *  construction. */
export function tourismeCulture(state: GameState, culture: string, C: Cfg): number {
  let total = 0
  for (const q of state.players) {
    for (const v of q.villes) {
      if (v.culture === culture) total += tourismeVille(state, q, v, C)
    }
  }
  return total
}

/** Nombre de PALIERS de dogmes franchis par un montant de Tourisme
 *  : un palier tous les palierTourismeDogme (50 par défaut) —
 *  0 en dessous, floor au-dessus (cumul à l'infini, arbitrage
 *  30/10 n°1). */
export function nbPaliersDogmes(tourisme: number, C: Cfg): number {
  const pas = Math.max(1, C.p.palierTourismeDogme)
  return Math.floor(Math.max(0, tourisme) / pas)
}

/** Dogmes déjà pris par une culture (triés par palier croissant).
 *  Un dogme n'est jamais retiré ni remplacé (arbitrage 30/10). */
export function dogmesCulture(state: GameState, culture: string): Dogme[] {
  return (state.dogmes ?? [])
    .filter((d) => d.culture === culture)
    .sort((a, b) => a.palier - b.palier)
}

/** PONTIFE d'une culture (arbitrage 30/10 n°3) : celui dont
 *  les villes de cette culture totalisent le plus de Tourisme — le
 *  choix du dogme d'un palier lui revient au moment du choix.
 *  Égalité : le plus PETIT n° de joueur l'emporte (l'itération
 *  dans l'ordre des joueurs avec un strict supérieur le garantit,
 *  déterminisme documenté). Retourne undefined si aucun joueur
 *  n'a de Tourisme (> 0) dans cette culture. */
export function joueurPontifeCulture(
  state: GameState, culture: string, C: Cfg,
): { joueur: Player; tourisme: number } | undefined {
  let meilleur: { joueur: Player; tourisme: number } | undefined
  for (const q of state.players) {
    let t = 0
    for (const v of q.villes) {
      if (v.culture === culture) t += tourismeVille(state, q, v, C)
    }
    if (t <= 0) continue
    if (!meilleur || t > meilleur.tourisme) meilleur = { joueur: q, tourisme: t }
  }
  return meilleur
}

/** Palier de dogme en attente : franchi mais pas encore consommé
 *  par un choix (le pontife est évalué au moment de la lecture —
 *  arbitrage 30/10 n°3 : il peut changer d'un palier à l'autre). */
export interface PalierDogmeEnAttente {
  culture: string
  /** Montant du palier (palierTourismeDogme × N : 50, 100, 150…). */
  palier: number
  /** Pontife actuel de la culture — à lui le choix. undefined si
   *  aucun joueur ne porte de Tourisme dans la culture (cas
   *  théorique : tourisme nul → aucun palier franchi). */
  pontife: { joueur: Player; tourisme: number } | undefined
}

/** Tous les paliers de dogmes EN ATTENTE, toutes cultures
 *  confondues (les cultures présentes chez les joueurs seulement).
 *  C'est la surface de lecture de l'UI : chaque entrée affiche
 *  « palier franchi — dogme à choisir par le pontife ». */
export function paliersDogmesEnAttente(
  state: GameState, C: Cfg = cfgOf(state.config),
): PalierDogmeEnAttente[] {
  const out: PalierDogmeEnAttente[] = []
  const cultures = new Set<string>()
  for (const q of state.players) for (const v of q.villes) cultures.add(v.culture)
  for (const culture of cultures) {
    const pris = dogmesCulture(state, culture).length
    const atteints = nbPaliersDogmes(tourismeCulture(state, culture, C), C)
    for (let i = pris + 1; i <= atteints; i++) {
      out.push({
        culture,
        palier: i * Math.max(1, C.p.palierTourismeDogme),
        pontife: joueurPontifeCulture(state, culture, C),
      })
    }
  }
  return out
}

/** Somme des VALEURS d'effets d'un TYPE donné parmi les dogmes pris
 *  par une culture (0 si aucun — les hooks moteurs sont INERTES
 *  tant qu'aucun dogme n'est pris, diag inchangé). Les chiffres
 *  vivent dans le RÉFÉRENTIEL (DogmeDef.effets), lus par le NOM du
 *  dogme pris : éditer la table change l'effet des dogmes DÉJÀ
 *  pris — le référentiel est la source de vérité, pas l'état (même
 *  philosophie que les lois de culture). Les types d'effet de la
 *  table du 30/10 : travailNourriture, fecondite,
 *  gardeParHabitation, consoNourrBourgeois, taudisParHabitation,
 *  bonheurVille, maladieContractMod, pressionCulture, tributVassal,
 *  garnisonHorsCulture, conversionLocale (la Fraternité ne porte
 *  AUCUN effet — mécanique des révoltes non implémentée). */
export function effetsDogmeCulture(
  state: GameState, culture: string, type: string, C: Cfg = cfgOf(state.config),
): number {
  if (!state.dogmes?.length) return 0
  let total = 0
  for (const d of state.dogmes) {
    if (d.culture !== culture) continue
    const ref = (C.config.dogmes ?? []).find((r) => r.nom === d.nom)
    if (!ref?.effets) continue
    for (const e of ref.effets) if (e.type === type) total += e.valeur
  }
  return total
}

/** Dogmes du référentiel DISPONIBLES au choix d'une culture : les
 *  entrées « toutes cultures » (DogmeDef.culture === '*', cas de la
 *  table du 30/10 — dogmes génériques proposés à toute culture)
 *  ou propres à la culture, NON déjà prises (un dogme est UNIQUE
 *  par culture : le cumul à l'infini porte sur des dogmes
 *  DIFFÉRENTS, jamais le même deux fois). */
export function dogmesDisponiblesCulture(
  state: GameState, culture: string, C: Cfg = cfgOf(state.config),
): DogmeDef[] {
  const pris = new Set(dogmesCulture(state, culture).map((d) => d.nom))
  return (C.config.dogmes ?? []).filter(
    (d) => (d.culture === '*' || d.culture === culture) && !pris.has(d.nom),
  )
}

/** CHOISIR un dogme (mutateur, appelé par le client du joueur
 *  pontife via l'UI de la carte culture) : valide que le palier
 *  est franchi, pas encore consommé, et que le dogme existe dans
 *  la table `dogmes` du référentiel POUR CETTE CULTURE (table
 *  encore vide à ce stade — le choix deviendra possible sans
 *  toucher au code quand les dogmes définitifs entreront au
 *  référentiel). Le dogme est enregistré au nom du PONTIFE
 *  de la culture au moment du choix et n'est plus remplaçable
 *  (arbitrages 30/10 n°1 et n°3). Retourne null si succès, sinon
 *  le message d'erreur. */
export function choisirDogme(
  state: GameState, culture: string, palier: number, nom: string,
): string | null {
  const C = cfgOf(state.config)
  const pas = Math.max(1, C.p.palierTourismeDogme)
  // palier valide : multiple du pas, strictement positif
  if (palier <= 0 || palier % pas !== 0) {
    return `Palier ${palier} invalide — les paliers vont de ${pas} en ${pas}.`
  }
  // arbitrage n°3 : un palier consommé ne se re-choisit pas
  if (dogmesCulture(state, culture).some((d) => d.palier === palier)) {
    return `Le palier ${palier} de la culture ${culture} a déjà son dogme — un dogme n'est pas remplaçable.`
  }
  // arbitrage n°2 : le palier doit être franchi par la culture
  const atteints = nbPaliersDogmes(tourismeCulture(state, culture, C), C)
  if (palier / pas > atteints) {
    return `Le palier ${palier} de Tourisme n'est pas encore franchi par la culture ${culture}.`
  }
  // (RETOUR DES DOGMES DÉFINITIFS, 2026-10-30 2e séance) : le dogme
  //  doit être UNIQUE par culture — le cumul à l'infini (arbitrage
  //  n°1) porte sur des dogmes DIFFÉRENTS, jamais le même deux fois.
  if (dogmesCulture(state, culture).some((d) => d.nom === nom)) {
    return `Le dogme « ${nom} » est déjà pris par la culture ${culture} — un dogme est unique par culture.`
  }
  // le dogme doit exister au référentiel, pour cette culture : les
  //  entrées génériques (culture '*', table du 30/10 — dogmes
  //  proposés à TOUTE culture) ou propres à la culture
  const ref = (C.config.dogmes ?? []).find(
    (d) => (d.culture === culture || d.culture === '*') && d.nom === nom,
  )
  if (!ref) {
    return `Dogme « ${nom} » introuvable dans le référentiel pour la culture ${culture}.`
  }
  const pontife = joueurPontifeCulture(state, culture, C)
  if (!pontife) {
    return `Aucun joueur ne porte de Tourisme dans la culture ${culture} — personne ne peut choisir.`
  }
  state.dogmes = [
    ...(state.dogmes ?? []),
    { culture, palier, nom, choisiPar: pontife.joueur.n, choisiAuTour: state.turn },
  ]
  state.log.push({
    turn: state.turn,
    type: 'Culture',
    joueur: pontife.joueur.n,
    texte: `${pontife.joueur.nom} choisit le dogme « ${nom} » pour la culture ${culture} (palier ${palier} de Tourisme).`,
  })
  return null
}
