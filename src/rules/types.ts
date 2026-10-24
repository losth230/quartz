// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EFFETS — CONTRAT COMMUN (refactor 2026-10-18)
//
//  Principe : une règle (bâtiment, aménagement, régime…) = une DONNÉE
//  qui combine des effets piochés dans la BANQUE. Modifier une règle =
//  modifier son appel à la banque ; le code du moteur ne change
//  JAMAIS quand une règle change.
//
//  (RETRAIT 2026-10-24, retour arbitre « purge complète » — résolution
//  R4 de l'audit des résiduels : la banque ne garde que les types
//  d'effets PRODUITS par le référentiel actuel (constructions,
//  régimes, cultures). Les types sans producteur — plomberie des
//  techs/doctrines/dogmes, systèmes tous supprimés — partent en
//  RETRAIT daté ci-dessous ; l'ancien contenu reste dans
//  l'historique git, règle 9. Une future source (règles de factions
//  à redéfinir, événements…) RÉINTRODUIRA les types dont elle aura
//  besoin, repris de l'historique.)
//
//  Trois couches :
//   1. src/rules/types.ts (ce fichier) — les types d'effets et de
//      conditions, stables, versionnés ;
//   2. src/rules/effects/ — l'implémentation de chaque type d'effet,
//      écrite UNE fois, testée UNE fois ;
//   3. src/rules/registry.ts — associe les règles du référentiel
//      (bâtiments…) à leurs effets. C'est LA seule couche à
//      éditer pour changer une règle.
// ═══════════════════════════════════════════════════════════════════════════

import type { GameState, Player, City } from '../engine/types'

// ── Contexte d'application ────────────────────────────────────────────────

/** Contexte passé à chaque effet : tout ce dont un effet peut avoir besoin
 *  pour se calculer. Le moteur le construit une fois par site d'application
 *  (joueur, ville, tour) et le donne à la banque.
 *  (RETRAIT 2026-10-24, purge R4 : les PORTS moteur (vague 2, inversion de
 *  dépendance — C, capitaleDe, rangNiveau, garnisonVille) sont supprimés :
 *  plus AUCUN type d'effet conservé ne consomme de service moteur. Les
 *  futurs services nécessaires à un nouveau type d'effet seront
 *  réintroduits avec lui — l'ancien contenu reste dans l'historique git,
 *  règle 9.) */
export interface ContexteEffet {
  /** État complet de la partie (lecture seule par convention — un effet
   *  ne mute JAMAIS l'état directement : il renvoie sa contribution). */
  state: GameState
  /** Joueur concerné par l'application. */
  joueur: Player
  /** Ville concernée si le site est une ville (sinon undefined). */
  ville?: City
  /** Saison du tour en cours. */
  saison: string
}

// ── Types d'effets de la banque ────────────────────────────────────────────

/** Production par tour d'une ressource, dans la ville du contexte
 *  (canal « Bâtiments » du récap). Négatif = consommation. */
export interface EffetFluxVille {
  type: 'fluxVille'
  ressource: string
  valeur: number
  /** true = créditée uniquement en été (canal « Nourr - été »). */
  ete?: boolean
}

// (RETRAIT 2026-10-24, retour arbitre « purge complète » — résolution R4 :
//  les types d'effets SANS PRODUCTEUR sont supprimés. Le référentiel
//  actuel ne produit que fluxVille, garnisonVille (constructions),
//  fluxParAmenagement (régimes) et fluxParVilleCultureMonde
//  (cultures). Types retirés : fluxJoueur (régimes & cultures
//  historiques), fluxCapitale, garnisonParRang, tourismeInstantane,
//  habitantsVille, conversionPoids, migrationPoids, reductionCout,
//  reductionLeveeArmee, emissaires (avec son champ mort marchandsMax —
//  reliquat du métier de Marchand retiré), scienceInstantanee,
//  ressourcesInstantanees, demographieVille — plomberie des
//  techs/doctrines/dogmes/Lauriers, systèmes tous supprimés. L'ancien
//  contenu reste dans l'historique git, règle 9.)

/** Production par tour, par AMÉNAGEMENT portant l'un des noms listés,
 *  dans TOUTES les villes du joueur (ex. Socialisme : +N Nourriture
 *  d'été par Champ et Rizière — champ nourrEteChampRiziere du
 *  référentiel, brûlage #3 source 2/3). */
export interface EffetFluxParAmenagement {
  type: 'fluxParAmenagement'
  ressource: string
  valeur: number
  /** noms d'aménagements comptés (ex. ['Champ', 'Rizière']) */
  noms: string[]
}

/** Production par tour, par VILLE de la culture du joueur dans le
 *  MONDE entier, tous joueurs confondus (ex. Lunisme : +N Tourisme
 *  par ville de culture Lunisme — règle de pays du classeur, champs
 *  capitalNourr/Tourisme/OrParHabMonde). */
export interface EffetFluxParVilleCultureMonde {
  type: 'fluxParVilleCultureMonde'
  ressource: string
  valeur: number
}

// ── (RETRAIT 2026-10-24, retour arbitre) ──────────────────────────────
//  Effets des technologies de progrès (source 'tech', brûlage #3
//  source 3/3) : les types EffetFluxSiCapitale, EffetFluxParVille,
//  EffetFluxParVilleProximite, EffetFluxParRangHabitation,
//  EffetFluxParBatiment, EffetFluxParGarnisonHabitation et
//  EffetFluxParMetier sont supprimés avec le système de progrès —
//  plus aucun producteur. L'ancien contenu reste dans l'historique
//  git (règle 9).

/** Garnison statique ajoutée à la ville (valeur d'état : tient tant que
 *  la source tient — bâtiment…). */
export interface EffetGarnisonVille {
  type: 'garnisonVille'
  valeur: number
}

/** Union : TOUS les types d'effets de la banque. */
export type Effet =
  | EffetFluxVille
  | EffetFluxParAmenagement
  | EffetFluxParVilleCultureMonde
  | EffetGarnisonVille

// ── Conditions ─────────────────────────────────────────────────────────────

/** Une règle peut être conditionnée. Toutes les conditions sont
 *  optionnelles (absence = toujours actif) et combinées en ET.
 *  (RETRAIT 2026-10-24, purge R4 : les conditions SANS PRODUCTEUR sont
 *  supprimées — peuple, pontificatMin, ageMin, vassal, suzerainDeCite
 *  (plomberie des règles de factions/dogmes, systèmes supprimés).
 *  Les producteurs actuels n'utilisent que saison, regime et
 *  culture. L'ancien contenu reste dans l'historique git, règle 9.) */
export interface ConditionRegle {
  /** Saison requise (ex. effets d'été). */
  saison?: string
  /** Régime politique du joueur requis (ex. Socialisme). */
  regime?: string
  /** Culture du joueur requise (ex. Lunisme — règle de pays). */
  culture?: string
  // (RETRAIT 2026-10-24 : les conditions `tech` et `techNom` —
  //  technologie débloquée requise — sont supprimées avec le
  //  système de progrès, retour arbitre.)
}

// ── Règle de la banque ─────────────────────────────────────────────────────

/** Source d'une règle : où elle vit dans le référentiel.
 *  'dogme' RETIRÉ le 2026-10-24 (retour arbitre : suppression de
 *  tous les dogmes) — la valeur n'est jamais à réutiliser (stabilité
 *  des règles déjà saisies).
 *  (RETRAIT 2026-10-24, purge R4 : les sources DÉCLARÉES SANS
 *  PRODUCTEUR — 'faction' (règles de factions, vidées le 2026-10-24),
 *  'evenement', 'laurier' — sont supprimées ; elles n'avaient jamais
 *  été branchées. Une future source réelle sera réintroduite avec
 *  son producteur.) */
export type SourceRegle =
  | 'batiment'        // table constructions, catégorie Bâtiment
  | 'amenagement'    // table constructions, catégorie Aménagement
  | 'merveille'      // table constructions, famille Merveille
  | 'regime'          // loi chiffrée du régime politique
  | 'culture'         // règle de pays culturelle
  //  'tech' RETIRÉ le 2026-10-24 (retour arbitre : suppression du
  //  système de progrès) — la valeur n'est jamais à réutiliser
  //  (stabilité des règles déjà saisies).

/** Une règle de la banque : identité + conditions + effets.
 *  L'identifiant `id` est STABLE (jamais renommé, jamais réutilisé) —
 *  les textes d'affichage (nom, description) peuvent changer librement
 *  dans le référentiel sans casser la règle. */
export interface RegleBanque {
  /** Identifiant stable de la règle (ex. 'batiment.poste-de-garde',
   *  'tech.comprendre-la-soie'). */
  id: string
  /** Source dans le référentiel. */
  source: SourceRegle
  /** Nom affiché de la règle (ex. 'Poste de garde') — pour les logs
   *  et l'UI ; MODIFIABLE librement. */
  nom: string
  /** Groupe de la source (constructions : 'Ville' | 'Château' | 'Capitale' | 'Terrain')
   *  — 15 constructions existent en double (Ville ET Château), le
   *  groupe distingue leurs règles. Optionnel pour les sources sans
   *  groupe (factions…). */
  groupe?: string
  /** Conditions d'activation (toutes en ET). Vide = toujours actif
   *  quand la source est possédée. */
  conditions?: ConditionRegle
  // (RETRAIT 2026-10-24, purge R4 : le champ `declencheur` ('tour' |
  //  'finSaison' — Sénéchal, Maître de cour, Légat…) est supprimé :
  //  AUCUN producteur ne l'a jamais posé, AUCUN lecteur ne le lit
  //  (toutes les règles vivantes sont des flux de tour). L'ancien
  //  contenu reste dans l'historique git, règle 9.)
  /** Les effets — TOUJOURS piochés dans la banque. */
  effets: Effet[]
}

// ── Résultats d'application ────────────────────────────────────────────────

/** Résultat agrégé d'une application de la banque sur un site.
 *  (RETRAIT 2026-10-24, purge R4 : les canaux SANS LECTEUR MOTEUR —
 *  conversion, migration, reductions, instantanes (plomberie des
 *  dogmes/doctrines/démographie, jamais branchée) — sont supprimés.
 *  Le moteur ne lit que flux, fluxEte et garnison (constructions.ts,
 *  regimes.ts). L'ancien contenu reste dans l'historique git,
 *  règle 9.) */
export interface ContributionEffets {
  /** Flux par tour par ressource (clé = ressource). */
  flux: Record<string, number>
  /** Flux d'été par ressource (canal « Nourr - été »). */
  fluxEte: Record<string, number>
  /** Garnison totale ajoutée au site. */
  garnison: number
}
