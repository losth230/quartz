// ══════════════════════════════════════════════════════════════════════
//  CHASSE & PÊCHE — Configuration par défaut
//  Toutes les données de référence du classeur Excel (feuilles init,
//  JSON, Metiers, traits_genetiques, Culture, Peuples, Ville, Bat,
//  Tourisme, Cités L, BDD_pop, Accueil) + paramètres moteur.
//  (RETRAIT 2026-10-24 : la feuille « Progrès » du classeur n'est
//  plus embarquée — système de progrès supprimé, retour arbitre.)
//  Tout est stocké DANS la partie (state.config) et modifiable à chaud
//  depuis l'onglet « Paramètres » — aucun redémarrage nécessaire.
// ══════════════════════════════════════════════════════════════════════

import refJson from './referentiels.json'
import { mergeParams, type GameParams, type GameParamStrings } from './params'

// ── Types des référentiels (issus du classeur) ─────────────────────────

export interface MetierDef {
  metier: string
  valeur1: number
  ressource1: string
  valeur2: number
  ressource2: string
  description: string
  nobleSeul: boolean
  regleGenre: string
  attribution: string
  /** Capacité maximale par ville (rework habitants 2026-10-20, vague
   *  3b) : absent = illimité — la cap de base vient du rang
   *  d'habitation, les paramètres capMetierChasseur* sont supprimés. */
  /** Production UNIQUEMENT pendant l'été (vague 3a — ex. Fermier
   *  « +5 Nourriture par tour en été ») : les gains valeur1/ressource1 et
   *  valeur2/ressource2 ne sont crédités qu'en saison d'Été. */
  ete?: boolean
  capParVille?: number
  /** QUALITÉ DU MÉTIER (design domiciles/ascension 2026-10-24,
   *  vague A) : 'roturier' | 'bourgeois' | 'noble'. Arbitrage : les
   *  métiers liés aux AMÉNAGEMENTS sont roturiers, ceux liés aux
   *  BÂTIMENTS bourgeois (Commerçant/Scientifique/Banquier/
   *  Troubadour/Professeur/Garde — fonction publique qualifiée) ;
   *  la lignée nobleSeul (Dirigeant, Gouverneur…) reste 'noble'.
   *  Champ DONNÉE du référentiel — sert à l'ascension sociale
   *  (vague D) et ne change RIEN à l'affectation actuelle. */
  qualite?: 'roturier' | 'bourgeois' | 'noble'
}
export interface TraitDef {
  name: string
  weight: number
  description: string
  life_delta: number
  resurrection_min_roll: number
  fert_add: number
  heritable: boolean
  marriage_mod: number
}
export interface CultureDef {
  nom: string
  heredite: string
  homoAutorisee: boolean
  fertFactor: number
  reglePays: string
  reglePerso: string
  /** Règles chiffrées appliquées AUTOMATIQUEMENT par le moteur
   *  (engine/regimes.ts, engine/metiers.ts) : la capitale génère +N d'une
   *  ressource par habitation de cette culture dans le monde, et chaque
   *  construction de bâtiment rapporte +N Science. Champs optionnels :
   *  absents des vieilles configurations, complétés par migrerCultures. */
  capitalNourrParHabMonde?: number
  capitalTourismeParHabMonde?: number
  capitalOrParHabMonde?: number
  scienceParConstruction?: number
}
export interface RegimeDef {
  nom: string
  loi: string
  /** Loi chiffrée appliquée AUTOMATIQUEMENT par le moteur
   *  (engine/regimes.ts) : garnison des habitations +N par rang
   *  d'habitation (Autoritarisme), +N Nourriture par tour d'été pour les
   *  champs et rizières (Socialisme). Champs optionnels : absents
   *  des vieilles configurations, complétés par migrerRegimes. */
  garnisonParRang?: number
  nourrEteChampRiziere?: number
}
/** Ligne de la table « types d'habitation » (feuille Ville du classeur) :
 *  chaque ville est de type Ville (Hameau → Cité → Grande Cité) ou
 *  Château (Motte → Donjon → Forteresse) ; chaque rang a un coût
 *  d'amélioration, un nombre d'habitants requis, une consommation
 *  par tour et une garnison de base — débités/appliqués
 *  automatiquement par le moteur (engine/habitations.ts). */
export interface HabitationDef {
  /** « Ville » ou « Château » */
  type: string
  /** nom du rang (Hameau, Cité, Grande Cité, Motte, Donjon, Forteresse) */
  rang: string
  cout: string
  habitantsRequis: number
  /** métiers disponibles à la BASE du rang, format STRUCTURÉ (retour
   *  Thibaut 2026-10-23, formats unifiés : métiers TOUJOURS AU
   *  SINGULIER, même format que les `emplacements` des constructions ;
   *  l'ancien TEXTE « metiersDisponibles » est converti par la
   *  migration ciblée de cfgOf, puis la clé disparaît). */
  metiersBase: EmplacementDef[]
  /** domiciles disponibles, ex. « 50 maisons, 10 Auberge » — TEXTE
   *  historique conservé pour l'affichage de repli ; la donnée vit
   *  dans `domicilesRang` (vague A, design domiciles 2026-10-24). */
  domicilesDisponibles: string
  /** domiciles du rang STRUCTURÉS (vague A, 2026-10-24) :
   *  [{domicile: 'Maison', nombre: 50}, …] — 1 domicile = 1 logement.
   *  Optionnel : absent des vieilles configs → complété par
   *  migrerTypesHabitation (garde-fou idempotent). */
  domicilesRang?: Array<{ domicile: string; nombre: number }>
}
/** Événements de saison (été/hiver) RETIRÉS du référentiel le
 *  2026-10-24 (retour arbitre Thibaut) : la table `events` (18
 *  entrées, textes des 4 niveaux de danger) et son annexe d'effets
 *  chiffrés `eventEffets` ont disparu du classeur, du type et du
 *  moteur (plus de tirage au changement de saison — saisons.ts).
 *  Les clés encore portées par les configs sauvegardées sont purgées
 *  par des deletes ciblés dans cfgOf (patron taxes25, sans bump de
 *  SCHEMA_VERSION_CONFIG — règle (x)). L'ancien contenu reste dans
 *  l'historique git. */
/** Cartes dynastie RETIRÉES du référentiel le 2026-10-24 (retour
 *  arbitre) : la table `dynasties` (38 événements de dynastie tirés
 *  à chaque tour) et son annexe `dynastieEffets` ont disparu du
 *  classeur, du type et du moteur. NB : ne pas confondre avec le
 *  champ Character.dynastie (le NOM DE FAMILLE du personnage), qui
 *  reste un concept noyau du jeu. */
export interface OffrandeDef { nom: string; poids: number; description: string }
export interface BanqueNoms { nom: string; noms: string[]; prenomsM: string[]; prenomsF: string[] }
export interface BuildingDef {
  nom: string
  categorie: string
  ecoleRang: number
  malContraction: number
  bonusGuerison: number
  bonusGuerisonGlobal: number
  effet: string
}
export interface PoidsNom { nom: string; poids: number }
export interface RegleFaction { nom: string; texte: string }
export interface PeupleRef {
  nom: string
  description: string
  lignes: { label: string; texte: string }[]
  /** Fiche de faction : victoire (désactivée), bâtiment/aménagement de
   *  faction, 2 règles de base, 3 règles d'Âge II et 3 d'Âge III (le
   *  joueur en choisit UNE par âge à la montée d'âge). Champs
   *  optionnels : les vieux référentiels n'ont que « lignes ». */
  victoire?: string
  batiment?: string
  reglesBase?: RegleFaction[]
  ageII?: RegleFaction[]
  ageIII?: RegleFaction[]
}
export interface FicheLigne { label: string; texte: string }
// Retrait 2026-10-23 (retour Thibaut, dette legacy) : les interfaces
//  BatimentRef / AmenagementRef accompagnaient les tables
//  pré-canonicalisation (batimentsVille, batimentsChateau,
//  batimentsCouts, amenagements) — supprimées avec elles (la table
//  canonique `constructions` les remplace).
/** Table canonique des constructions (feuille « Ville » du classeur 7.19) :
 *  coût EXACT, production EXACTE (analysable par le moteur) et description
 *  EXACTE du classeur — parfois similaires. */
/** Effet structuré d'une construction (retour Thibaut, marqueur (s)) :
 *  une CASE RESSOURCE + une CASE QUANTITÉ, plus de texte à analyser.
 *  · ressource de flux (Or, Nourriture…) → crédité à chaque fin de tour ;
 *  · quantité négative → consommation par tour ;
 *  · ete: true → production d'ÉTÉ uniquement (Champ, Rizière — canal
 *    « Nourr - été ») ;
 *  · Tourisme et Garnison sont des ressources INSTANTANÉES : jamais de
 *    flux par tour — Tourisme crédité UNE fois à la construction,
 *    Garnison = valeur d'état tant que le bâtiment tient. */
export interface EffetConstruction {
  ressource: string
  quantite: number
  ete?: boolean
}

export interface ConstructionRef {
  categorie: string   // 'Bâtiment' | 'Aménagement'
  groupe: string      // 'Ville' | 'Château' | 'Capitale' | 'Terrain'
  famille: string      // Militaire / Economique / Guilde / Capitale / Merveille / ''
  nom: string
  /** Merveilles ET aménagements tiers 2/3 : rang d'habitation
   *  MINIMUM requis pour construire/améliorer (1 = Hameau/Motte…,
   *  2 = Cité/Donjon, 3 = Grande Cité/Forteresse). Champ optionnel. */
  rangMinHabitation?: number
  terrain?: string     // aménagements uniquement
  /** Aménagements tiers 2/3 (vague 3c, arbitrage Thibaut
   *  2026-10-22) : nom de l'aménagement de TIER INFÉRIEUR que cette
   *  AMÉLIORATION remplace (un exemplaire de la même ville) —
   *  « Baleinier (tier 2) » remplace « Baleinier », « Baleinier
   *  (tier 3) » remplace « Baleinier (tier 2) ». Champ optionnel :
   *  absent = tier 1 (aménagement de base, constructible tel quel). */
  remplaceAmenagement?: string
  cout: string
  production: string
  description: string
  /** Effets STRUCTURÉS (marqueur (s)) — source du moteur quand présents ;
   *  sinon repli sur l'analyse du texte exact (anciennes configs). */
  effets?: EffetConstruction[]
  /** Emplacements de métiers (vague 3a, arbitrage Thibaut 2026-10-21) :
   *  la production DIRECTE des aménagements tier 1 est remplacée par des
   *  postes — chaque aménagement présent dans une ville octroie
   *  `places` postes de `metier` (cap par ville = somme des emplacements,
   *  + cap par défaut du Chasseur). Champ optionnel : aucun emplacement. */
  emplacements?: EmplacementDef[]
  /** Effets MOTEUR d'une construction (santé / écoles — retour
   *  Thibaut 2026-10-23, retrait des tables legacy batimentsVille /
   *  batimentsChateau) : rang d'école (1-3) et bonus de santé, lus
   *  via la vue `batiments` (BuildingDef) dérivée de cette table.
   *  Champ optionnel : aucun effet moteur. */
  ecoleRang?: number
  malContraction?: number
  bonusGuerison?: number
  bonusGuerisonGlobal?: number
}
/** Un emplacement de métier accordé par une construction (vague 3a). */
export interface EmplacementDef {
  metier: string
  places: number
}
/** (EffetProgres, ProgresTechDef et ProgresArbre retirés le
 *  2026-10-24 avec le système de progrès, retour arbitre Thibaut —
 *  types des effets chiffrés des technologies et des arbres de
 *  progrès, plus aucun producteur. La clé `progres` encore portée
 *  par les configs sauvegardées est purgée par un delete ciblé dans
 *  cfgOf, patron taxes25, sans bump de SCHEMA_VERSION_CONFIG.) */

/** (EffetDef, EventEffetsDef et DynastieEffetsDef retirés le
 *  2026-10-24 avec les tables events/dynasties — effets chiffrés
 *  des événements de saison et des cartes dynastie, plus aucun
 *  producteur.) */
/** Type de domicile (table `domiciles` du référentiel — vague A,
 *  design domiciles/ascension 2026-10-24) : nom + qualité 0-4
 *  (Masure 0 … Palais 4 — la qualité EST le gain de prestige).
 *  SIMPLE par arbitrage : pas de capacité ni coût. Unité « 1
 *  personne = 1 maison » (arbitrage final 2026-10-24 —
 *  l'ATTRIBUTION loge 1 FOYER par domicile, le BONHEUR mesure par
 *  HABITANT : cf. engine/domiciles.ts pour les deux échelles
 *  volontaires). */
export interface DomicileDefConfig {
  domicile: string
  qualite: number
}

export interface GameConfig {
  ressources: string[]
  params: GameParams & GameParamStrings
  metiers: MetierDef[]
  traits: TraitDef[]
  cultures: CultureDef[]
  regimes: RegimeDef[]
  // (events / dynasties / eventEffets / dynastieEffets retirés le
  //  2026-10-24, retour arbitre — cf. docblocks ci-dessus ; purge
  //  des clés stale par delete ciblé dans cfgOf)
  offrandes: OffrandeDef[]
  orientations: PoidsNom[]
  genres: PoidsNom[]
  agesPoids: { age: string; poids: number }[]
  banquesNoms: BanqueNoms[]
  peupleBanque: Record<string, number>
  peuples: string[]
  batiments: BuildingDef[]
  // ── données de référence « fiches » (affichage, 100% éditables) ──
  init: {
    nbPerso: number
    pourcentageMarie: number
    nbNoble: number
    ageDefaut: number
    orientationDefaut: string
    sexeDefaut: string
  }
  traitsGenetiques: {
    id: number; name: string; weight: number; heritable: boolean
    marriageMod: number; fertAdd: number; lifeDelta: number
    resurrectionMinRoll: number; description: string
  }[]
  metiersEffets: { metier: string; effet: string; revocation: string }[]
  peuplesLibres: PeupleRef[]
  peuplesAutres: PeupleRef[]
  constructions: ConstructionRef[]
  typesHabitation: HabitationDef[]
  /** Table des types de domicile (vague A, 2026-10-24) : nom + qualité 0-4. */
  domiciles: DomicileDefConfig[]
  // (progres — arbres de progrès — retiré le 2026-10-24, retour arbitre :
  //  suppression du système de progrès. La clé encore portée par les
  //  configs sauvegardées est purgée par delete ciblé dans cfgOf,
  //  patron taxes25, sans bump de SCHEMA_VERSION_CONFIG.)
  paysRangs: { nom: string; coutOr: number; coutNourriture: number; serments: number; bonus: string }[]
  tourismeSeuils: { seuil: number; bonus: string }[]
  /** Dogmes RETIRÉS du référentiel le 2026-10-24 (retour arbitre
   *  Thibaut « on supprime tous les dogmes pour l'instant ») :
   *  table du classeur à effets d'AFFICHAGE uniquement (bonus Pontife /
   *  Fidèles en texte libre — jamais branchée sur le moteur). La clé
   *  encore portée par les configs sauvegardées est purgée par un
   *  delete ciblé dans cfgOf (patron taxes25, sans bump de
   *  SCHEMA_VERSION_CONFIG). L'ancien contenu reste dans l'historique
   *  git ; un éventuel retour des dogmes repartira de zéro. */
  citesLibres: { type: string; effet: string }[]
  regleCitesLibres: string
  victoires: {
    voie: string
    /** 4 niveaux par voie, renommés LAURIERS (refonte 2026-10-14 —
     *  plus de « Rang I-IV », déjà pris par les rangs de pays et
     *  d'habitation). Validation manuelle au radar de l'accueil,
     *  ordre strict ; crise à chaque Laurier I-III validé ; bonus
     *  one-shot si complété pendant l'âge de même numéro ; le
     *  Laurier IV = Victoire.
     *  (RETRAIT 2026-10-24, retour arbitre « supprimer les conditions
     *  de victoire » : les TEXTES de conditions/bonus sont vidés dans
     *  le référentiel — Lauriers VIDÉS, structure conservée (voies +
     *  coches + radar). Les textes d'une config sauvegardée sont
     *  actualisés par le garde-fou de cfgOf (bloc « mise à jour des
     *  conditions », qui remplace une voie différant du référentiel),
     *  SANS bump de SCHEMA_VERSION_CONFIG. L'ancien contenu reste
     *  dans l'historique git (règle 9).) */
    lauriers: { laurier: string; condition: string; bonus: string }[]
  }[]
  crises: string[]
  rappelsRegles: string[]
  /** Couleurs d'affichage (graphiques, pastilles, lignes de tableaux)
   *  — éditables dans Référentiels → Couleurs (retour Thibaut
   *  2026-10-14). Champ optionnel : les anciennes sauvegardes sont
   *  complétées par migrerCouleurs (défauts ci-dessous). */
  couleurs?: CouleursConfig
  /** Tampon de convergence (marqueur (x), 2026-10-15) : une config
   *  portant SCHEMA_VERSION_CONFIG courant a été fusionnée sur les
   *  défauts + migrée une fois pour toutes (convergerConfig) — elle
   *  n'est PLUS re-migrée à chaque lecture, pour que les entrées du
   *  référentiel SUPPRIMÉES ou RENOMMÉES dans Paramètres y persistent
   *  (elles étaient jusque-là « ressuscitées » à chaque cfgOf par les
   *  migrations de complétion : impossible de supprimer un ministère,
   *  un bâtiment… par défaut). Champ optionnel : absentes des
   *  anciennes sauvegardes, elles migrent au premier passage. */
  schemaVersion?: number
  /** Marqueur (z) : l'effet des taxes Faibles/Fortes a été passé de
   *  ±50 % à ±25 % — ce champ trace la migration ciblée des
   *  paramètres de taxes (cfgOf), SANS toucher au tampon
   *  schemaVersion (les suppressions/renommages du référentiel
   *  persistent — règle (x)). */
  taxes25?: boolean
  // (renommagesTechs2026 / techsManquantes2026 retirés le 2026-10-24 :
  //  migrations ciblées des TECHS de progrès, supprimées avec le
  //  système — les drapeaux restants des vieilles configs sont inertes.)
  /** Migration Laurier IV Militaire (2026-10-16) — condition mise à
   *  jour « Contrôler 6 des habitations de départ ». */
  laurier4Militaire2026?: boolean
  /** Migration Sylvains (2026-10-16) — fiche et peuple ré-ajoutés
   *  si absents (le tampon schemaVersion avait avalé leur ajout). */
  sylvains2026?: boolean
  /** Migration valeurs de Nourriture (2026-10-16) — Grange 20, Silo 35,
   *  Moulin/Guilde 60, Champ 15 été, Rizière 20 été, Pâturage +1 Bétail
   *  +4 Nourr. Mise à jour uniquement des anciennes valeurs exactes. */
  valeursNourriture2026?: boolean
  /** Migration pontificats (2026-10-17) — retrait de la mention
   *  « crédité automatiquement » du palier 220 Tourisme : tous les
   *  paliers sont des aides de jeu au plateau (décision Thibaut). */
  pontificats2026?: boolean
  // (muraille40_2026 / slotsVides2026 retirés le 2026-10-24 : migrations
  //  ciblées des TECHS de progrès, supprimées avec le système.)
  /** Suppression de la martialité (arbitrage Thibaut 2026-10-21) :
   *  Soldat/Commandant passent de regleGenre « Martialité » à vide
   *  (aucune restriction de sexe), la clé martialite disparaît des
   *  cultures — l'HÉRÉDITÉ est conservée. Marqueur (z) : migration
   *  ciblée (cfgOf) indépendante du tampon schemaVersion. */
  martialiteSupprimee?: boolean
  /** Rework métiers & aménagements vague 3a (arbitrage Thibaut
   *  2026-10-21) : 24 métiers (renommages Artisan→Commerçant,
   *  Chercheur→Scientifique, Sportif→Garde, Propagandiste supprimé,
   *  nouveaux métiers de production), gains recalibrés SANS éducation,
   *  et production des 14 aménagements tier 1 remplacée par des
   *  emplacements. Marqueur (z) : migration ciblée (cfgOf)
   *  indépendante du tampon schemaVersion. */
  metiersAmenagements2026?: boolean
  /** Descriptions d'aménagements vidées (retour Thibaut 2026-10-22
   *  « retire carrément les descriptions des aménagements ») : le
   *  champ description de toute entrée constructions categorie
   *  Aménagement (tiers 1-3) est vidé UNE FOIS, y compris sur les
   *  configs déjà tamponnées v4 — la description ne servait plus en
   *  jeu (l'effet affiché est resumeConstruction || production, la
   *  ligne « Remplace… » des tiers est reconstruite par la carte).
   *  One-shot : une description d'aménagement personnalisée saisie
   *  APRÈS ce passage dans Référentiels est préservée. Marqueur (z) :
   *  migration ciblée (cfgOf), même schéma que taxes25. */
  descriptionsAmenagementsVides?: boolean
}

// ── Couleurs d'affichage (retour Thibaut 2026-10-14, marqueur (o)) ──────

/** Couleurs des graphiques : une par joueur (J1 = index 0) et une par
 *  ressource, + transparence des lignes de tableaux. Entièrement
 *  paramétrable dans Référentiels → Couleurs ; les anciennes
 *  sauvegardes sans ce champ retombent sur les défauts. */
export type CouleursConfig = {
  /** Couleur des joueurs dans les graphiques (J1..J8). */
  joueurs?: string[]
  /** Couleur par nom de ressource (y compris « Habitants », hors
   *  référentiel « ressources »). */
  ressources?: Record<string, string>
  /** Transparence (0–100 %) du fond des LIGNES de ressources des
   *  tableaux de la page Pays (récap, taxes, production des villes) :
   *  0 = couleur pleine, 100 = invisible. Défaut : 85. */
  transparenceLignes?: number
}

/** Palette des joueurs (demande de Thibaut 2026-10-14) : J1 rouge, J2
 *  bleu royal, J3 vert, J4 jaune, J5 violet, J6 orange, J7 turquoise,
 *  J8 rose. */
export const COULEURS_JOUEURS_DEFAUT: string[] = [
  '#C80000', // J1 rouge
  '#0131B4', // J2 bleu royal
  '#2CA02C', // J3 vert
  '#F5C518', // J4 jaune
  '#660099', // J5 violet
  '#F97316', // J6 orange
  '#40E0D0', // J7 turquoise
  '#EC4899', // J8 rose
]

/** Palette des ressources (demande de Thibaut 2026-10-14) : Bois
 *  marron, Bétail vert terne, Charbon gris foncé, Fer rouge, Science
 *  bleu clair, Pierre gris clair, Nourriture (et « Nourr - été »)
 *  vert, Soie rose-violet, Habitants vert foncé, Or jaune ; Tourisme
 *  et Garnison neutres (non spécifiés — paramétrables). */
export const COULEURS_RESSOURCES_DEFAUT: Record<string, string> = {
  'Bois': '#7B4B2A',
  'Bétail': '#8A9A5B',
  'Charbon': '#3A3A3A',
  'Fer': '#C80000',
  'Science': '#7EC8E3',
  'Pierre': '#BFC1C2',
  'Nourriture': '#2FA84F',
  'Nourr - été': '#2FA84F',
  'Soie': '#CC55AA',
  'Habitants': '#1B5E20',
  'Or': '#F5C518',
  'Tourisme': '#E8927C',
  'Garnison': '#4A6274',
}

/** Transparence par défaut du fond des lignes de ressources (85 % →
 *  teinte légère, lisible en thème clair comme sombre). */
export const TRANSPARENCE_LIGNES_DEFAUT = 85

/** Complète une config de couleurs partielle (ancienne sauvegarde) :
 *  joueurs complétés à 8 depuis les défauts, ressources fusionnées
 *  sur les défauts, « Nourr - été » suit toujours la Nourriture,
 *  transparence bornée 0–100. */
export function migrerCouleurs(c?: CouleursConfig): CouleursConfig {
  const joueurs = COULEURS_JOUEURS_DEFAUT.map((d, i) => c?.joueurs?.[i] || d)
  const ressources: Record<string, string> = {
    ...COULEURS_RESSOURCES_DEFAUT,
    ...(c?.ressources ?? {}),
  }
  ressources['Nourr - été'] = c?.ressources?.['Nourr - été'] ?? ressources['Nourriture']
  const t = typeof c?.transparenceLignes === 'number' && isFinite(c.transparenceLignes)
    ? Math.max(0, Math.min(100, c.transparenceLignes))
    : TRANSPARENCE_LIGNES_DEFAUT
  return { joueurs, ressources, transparenceLignes: t }
}

/** Couleur d'un joueur (n = 1..8) — palette de la partie si fournie,
 *  défauts sinon. */
export function couleurJoueur(n: number, C?: Cfg): string {
  const pal = C?.couleurs ?? migrerCouleurs()
  return pal.joueurs?.[n - 1] || COULEURS_JOUEURS_DEFAUT[(n - 1) % COULEURS_JOUEURS_DEFAUT.length]
}

/** Couleur d'une ressource (ou pseudo-ressource « Habitants ») —
 *  palette de la partie si fournie, gris neutre sinon. */
export function couleurRessource(nom: string, C?: Cfg): string {
  const pal = C?.couleurs ?? migrerCouleurs()
  return pal.ressources?.[nom] || '#9aa4ad'
}

/** Fond teinté d'une ressource pour les LIGNES de tableaux (page
 *  Pays : récap par tour, taxes des villageois, production des
 *  villes) : couleur de la ressource + transparence réglable
 *  (0 = couleur pleine, 100 = invisible). */
export function fondRessource(nom: string, C?: Cfg): string {
  const pal = C?.couleurs ?? migrerCouleurs()
  const t = typeof pal.transparenceLignes === 'number'
    ? Math.max(0, Math.min(100, pal.transparenceLignes))
    : TRANSPARENCE_LIGNES_DEFAUT
  return `color-mix(in srgb, ${couleurRessource(nom, C)} ${100 - t}%, transparent)`
}

const ref = refJson as any

// ── Normalisation des tables du classeur vers les types du moteur ─────

/** Table des traits génétiques — feuille `traits_genetiques` du classeur 7.19.
 *  C'est LA liste du moteur : création des personnages, héritage à la
 *  naissance, effets (mariage, fécondité, espérance de vie, résurrection).
 *  Remplace l'ancienne table V2 des 37 traits de personnage. */
function normaliserTraits(): TraitDef[] {
  const out: TraitDef[] = ref.traitsGenetiques.map((t: any) => ({
    name: t.name,
    weight: Number(t.weight) || 0,
    description: t.description || '',
    life_delta: Number(t.lifeDelta) || 0,
    resurrection_min_roll: Number(t.resurrectionMinRoll) || 0,
    fert_add: Number(t.fertAdd) || 0,
    heritable: !!t.heritable,
    marriage_mod: Number(t.marriageMod) || 0,
  }))
  // Traits système : présents dans la table (poids 0, jamais tirés) ;
  // on les garantit même si la table était incomplète.
  if (!out.some((t) => t.name === 'Bâtard')) {
    out.push({ name: 'Bâtard', weight: 0, description: '(système) Enfant illégitime.', life_delta: 0, resurrection_min_roll: 0, fert_add: 0, heritable: false, marriage_mod: 0 })
  }
  if (!out.some((t) => t.name === 'Consanguin')) {
    out.push({ name: 'Consanguin', weight: 0, description: '(système) Parents apparentés.', life_delta: -2, resurrection_min_roll: 0, fert_add: -0.2, heritable: false, marriage_mod: 0 })
  }
  return out
}

function normaliserMetiers(): MetierDef[] {
  return ref.metiers.map((t: any) => ({
    metier: t.metier,
    valeur1: Number(t.valeur1) || 0,
    ressource1: t.ressource1 || '',
    valeur2: Number(t.valeur2) || 0,
    ressource2: t.ressource2 || '',
    description: t.description || '',
    nobleSeul: !!t.nobleSeul,
    regleGenre: (t.regleGenre === 'vide' ? '' : t.regleGenre) || '',
    attribution: t.attribution || '',
    capParVille: t.capParVille === undefined ? undefined : Number(t.capParVille),
    ete: t.ete === true ? true : undefined,
    qualite: t.qualite === 'bourgeois' || t.qualite === 'noble' ? t.qualite : 'roturier',
  }))
}

function normaliserCultures(): CultureDef[] {
  return ref.cultures.map((c: any) => ({
    nom: c.nom,
    heredite: c.heredite,
    homoAutorisee: c.homoAutorisee === true || c.homoAutorisee === 'true',
    fertFactor: Number(c.fertFactor) || 1,
    reglePays: c.reglePays || '',
    reglePerso: c.reglePerso || '',
    capitalNourrParHabMonde: Number(c.capitalNourrParHabMonde) || undefined,
    capitalTourismeParHabMonde: Number(c.capitalTourismeParHabMonde) || undefined,
    capitalOrParHabMonde: Number(c.capitalOrParHabMonde) || undefined,
    scienceParConstruction: Number(c.scienceParConstruction) || undefined,
  }))
}

function normaliserBatiments(): BuildingDef[] {
  // Retour Thibaut 2026-10-23 (retrait de la dette legacy) : les
  //  effets moteur (santé / écoles) vivent DÉSORMAIS dans la table
  //  canonique `constructions` (champs ecoleRang / malContraction /
  //  bonusGuerison / bonusGuerisonGlobal) — les anciennes tables
  //  batimentsVille / batimentsChateau ne sont plus lues. La vue
  //  `batiments` (BuildingDef) n'expose QUE les constructions à
  //  effet moteur : c'est tout ce que lisent gameData2 (écoles) et
  //  sante.ts (santé), et le wiki n'affiche que celles-ci.
  const out: BuildingDef[] = []
  for (const c of ref.constructions) {
    const moteur = (c.ecoleRang ?? 0) > 0 || (c.malContraction ?? 0) > 0
      || (c.bonusGuerison ?? 0) > 0 || (c.bonusGuerisonGlobal ?? 0) > 0
    if (!moteur) continue
    if (out.some((b) => b.nom === c.nom)) continue // doublons Ville/Château : une vue par nom
    out.push({
      nom: c.nom,
      categorie: (c.ecoleRang ?? 0) > 0 ? 'Éducation' : 'Santé',
      effet: c.description,
      ecoleRang: c.ecoleRang ?? 0,
      malContraction: c.malContraction ?? 0,
      bonusGuerison: c.bonusGuerison ?? 0,
      bonusGuerisonGlobal: c.bonusGuerisonGlobal ?? 0,
    })
  }
  // « Guilde des médecins » (livret 7.19 : +10 % de guérison globale)
  //  n'a AUCUNE ligne dans la table canonique (le classeur ne lui
  //  connaît pas de coût) : elle reste NON constructible mais son
  //  effet moteur continue de s'appliquer aux villes qui la portent
  //  (comportement historique conservé). POINT OUVERT (arbitrage
  //  Thibaut) : l'ajouter au référentiel constructible avec un coût.
  if (!out.some((b) => b.nom === 'Guilde des médecins')) {
    out.push({
      nom: 'Guilde des médecins', categorie: 'Santé',
      effet: 'Bâtiment à effet moteur (santé / éducation).',
      ecoleRang: 0, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0.10,
    })
  }
  return out
}

function peuplesNoms(): string[] {
  return [...ref.peuplesLibres, ...ref.peuplesAutres].map((p: any) => p.nom).filter(Boolean)
}

/** Associe chaque peuple à une banque de noms (Banque 1/2/3 du classeur). */
const BANQUE_PEUPLE: Record<string, number> = {
  'Basiléens': 0, 'PEAUX VERTES': 1, 'HOMMES LEZARDS': 0, 'NAINS': 2, "ELFES D'OR": 0,
  'NORLS': 0, "LEGIONS D'OUTRE-TOMBE": 2, 'VERMINES DE KAOSS': 0, 'KROVORS': 0, 'THRAKSANS': 1,
}
function peupleBanqueOf(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const nom of peuplesNoms()) out[nom] = BANQUE_PEUPLE[nom] ?? 0
  return out
}

// (Effets chiffrés des événements de saison et des cartes dynastie — annexe du
//  livret — RETIRÉS le 2026-10-24 avec les tables events/dynasties,
//  retour arbitre : BASE_EVENT_EFFECTS / BASE_DYNASTIE_EFFECTS et les
//  tables eventEffets / dynastieEffets ont disparu ; contenu dans
//  l'historique git.)

export const DEFAULT_CONFIG: GameConfig = {
  ressources: ['Bétail', 'Bois', 'Charbon', 'Fer', 'Pierre', 'Soie', 'Or', 'Nourriture', 'Science', 'Habitants', 'Tourisme', 'Garnison'],
  params: mergeParams(undefined),
  metiers: normaliserMetiers(),
  traits: normaliserTraits(),
  cultures: normaliserCultures(),
  regimes: ref.regimes,
  // (events / dynasties / eventEffets / dynastieEffets retirés le
  //  2026-10-24, retour arbitre — cf. docblocks plus haut)
  offrandes: ref.offrandes,
  orientations: ref.orientations,
  genres: ref.genres,
  agesPoids: ref.agesPoids,
  banquesNoms: ref.banquesNoms,
  peupleBanque: peupleBanqueOf(),
  peuples: peuplesNoms(),
  batiments: normaliserBatiments(),
  init: ref.init,
  traitsGenetiques: ref.traitsGenetiques,
  metiersEffets: ref.metiersEffets,
  peuplesLibres: ref.peuplesLibres,
  peuplesAutres: ref.peuplesAutres,
  constructions: ref.constructions,
  typesHabitation: ref.typesHabitation,
  domiciles: (ref.domiciles ?? []).map((d: { domicile?: string; qualite?: number | string }) => ({
    domicile: String(d.domicile ?? ''),
    // (correctif 2026-10-24 : ÉCHELLE 0-4 — le `|| 1` transformait
    //  la qualité 0 (Masure) en 1 : le falsy zéro est un piège de
    //  l'idiome || ; Number.isFinite garde le 0 légitime)
    qualite: Number.isFinite(Number(d.qualite)) ? Number(d.qualite) : 0,
  })),
  paysRangs: [], // rempli depuis la feuille Pays (voir normalisation ci-dessous)
  tourismeSeuils: ref.tourismeSeuils,
  // (dogmes retirés du référentiel le 2026-10-24, retour arbitre)
  citesLibres: ref.citesLibres,
  regleCitesLibres: ref.regleCitesLibres,
  victoires: ref.victoires,
  crises: ref.crises,
  rappelsRegles: ref.rappelsRegles,
  couleurs: {
    joueurs: [...COULEURS_JOUEURS_DEFAUT],
    ressources: { ...COULEURS_RESSOURCES_DEFAUT },
    transparenceLignes: TRANSPARENCE_LIGNES_DEFAUT,
  },
}

// Rangs de pays (feuille « Pays ») — échelle féodale UNIQUE (refonte 2026-10-14) :
//   montée par SACRE (coût Or/Nourriture + serments exigés : vassaux et cités
//   libres sous suzeraineté — 1/2/3/4), chaque rang agrandit le conseil
//   (nombre de Ministres autorisés). Le bonus de fin de saison reste à gérer
//   au plateau. Entièrement paramétrable dans Référentiels → « Pays & rangs ».
DEFAULT_CONFIG.paysRangs = [
  { nom: 'Baronnie', coutOr: 0, coutNourriture: 0, serments: 0, bonus: '' },
  { nom: 'Comté', coutOr: 20, coutNourriture: 40, serments: 1, bonus: '' },
  { nom: 'Duché', coutOr: 30, coutNourriture: 60, serments: 2, bonus: '' },
  { nom: 'Royaume', coutOr: 50, coutNourriture: 100, serments: 3, bonus: '' },
  { nom: 'Empire', coutOr: 100, coutNourriture: 200, serments: 4, bonus: '' },
]

// ── Accès à la configuration effective d'une partie ───────────────────

export interface Cfg {
  p: GameParams & GameParamStrings
  ressources: string[]
  metiers: MetierDef[]
  traits: TraitDef[]
  cultures: CultureDef[]
  regimes: RegimeDef[]
  offrandes: OffrandeDef[]
  orientations: PoidsNom[]
  genres: PoidsNom[]
  banquesNoms: BanqueNoms[]
  peupleBanque: Record<string, number>
  peuples: string[]
  batiments: BuildingDef[]
  couleurs: CouleursConfig
  config: GameConfig
}

/** Fusionne la config d'une partie (state.config) sur les défauts. */
/** Migration : une table de traits héritée de la V2 (37 traits de
 *  personnage, dont « Nanisme ») repasse sur la table génétique 7.19.
 *  Les configs éditées à partir de la nouvelle liste ne sont pas touchées. */
export function migrateTraits(t: TraitDef[] | undefined): TraitDef[] {
  if (!Array.isArray(t) || t.length === 0) return DEFAULT_CONFIG.traits
  if (t.some((x) => x?.name === 'Obstiné')) return t
  return DEFAULT_CONFIG.traits
}


/** Complète les cultures d'une configuration existante avec les champs
 *  chiffrés ajoutés après coup (par nom — les valeurs éditées par
 *  l'utilisateur priment sur les défauts, les champs manquants viennent
 *  du référentiel). */
export function migrerCultures(list: CultureDef[] | undefined): CultureDef[] {
  const defs = DEFAULT_CONFIG.cultures
  if (!Array.isArray(list) || list.length === 0) return defs
  return list.map((c) => {
    const d = defs.find((x) => x.nom === c?.nom)
    return d ? { ...d, ...c } : c
  })
}

/** Complète les régimes d'une configuration existante avec les champs
 *  chiffrés ajoutés après coup (par nom — même logique que migrerCultures). */
export function migrerRegimes(list: RegimeDef[] | undefined): RegimeDef[] {
  const defs = DEFAULT_CONFIG.regimes
  if (!Array.isArray(list) || list.length === 0) return defs
  return list.map((r) => {
    const d = defs.find((x) => x.nom === r?.nom)
    return d ? { ...d, ...r } : r
  })
}

/** Complète les fiches de faction d'une configuration existante :
 *  les champs structurés (victoire, batiment, reglesBase, ageII, ageIII)
 *  manquent dans les vieilles sauvegardes — on les reprend du
 *  référentiel courant, faction par faction (par nom), et on ajoute
 *  les factions apparues depuis (ex. Sylvains). Les fiches
 *  explicitement éditées dans la config ne sont pas écrasées. */
export function migrerFactions(
  list: PeupleRef[] | undefined, defauts: PeupleRef[],
): PeupleRef[] {
  const out: PeupleRef[] = (list ?? []).map((f) => {
    const ref = defauts.find((d) => d.nom === f.nom)
    return ref ? { ...ref, ...f } : f
  })
  for (const d of defauts) {
    if (!out.some((f) => f.nom === d.nom)) out.push(d)
  }
  return out
}

/** Correctif Sylvains (V3) : « Savoir ancestral » et « Bibliothèque
 *  enfouie » ont échangé leur âge (Bibliothèque enfouie → Âge II,
 *  Savoir ancestral → Âge III). Les vieilles configurations qui
 *  portent l'ancienne répartition sont corrigées nommément ; les
 *  choix de règle d'âge stockés sur le joueur (regleAge2/regleAge3)
 *  sont simplement invalidés si le nom ne figure plus dans l'âge
 *  correspondant (le joueur re-choisit dans le cadre Faction). */
export function migrerSwapSylvains(f: PeupleRef): PeupleRef {
  if (f.nom !== 'Sylvains') return f
  const a2 = f.ageII ?? []
  const a3 = f.ageIII ?? []
  const s2 = a2.find((r) => r.nom === 'Savoir ancestral')
  const b3 = a3.find((r) => r.nom === 'Bibliothèque enfouie')
  if (!s2 || !b3) return f // déjà à jour (ou fiche éditée autrement)
  return {
    ...f,
    ageII: a2.map((r) => (r.nom === 'Savoir ancestral' ? b3 : r)),
    ageIII: a3.map((r) => (r.nom === 'Bibliothèque enfouie' ? s2 : r)),
    lignes: (f.lignes ?? []).map((l) => {
      if (/^Âge II — Savoir ancestral/.test(l.label)) {
        return { label: 'Âge II — Bibliothèque enfouie', texte: b3.texte }
      }
      if (/^Âge III — Bibliothèque enfouie/.test(l.label)) {
        return { label: 'Âge III — Savoir ancestral', texte: s2.texte }
      }
      return l
    }),
  }
}

/** Table des constructions (bâtiments / aménagements) d'une
 *  configuration existante : les entrées du référentiel
 *  par défaut absentes de la config (apparues depuis la sauvegarde)
 *  sont AJOUTÉES, sans toucher aux entrées déjà présentes. */
export function migrerConstructions(
  list: ConstructionRef[] | undefined, defauts: ConstructionRef[],
): ConstructionRef[] {
  const out = [...(list ?? [])]
  const noms = new Set(out.map((c) => c.nom))
  for (const d of defauts) {
    if (!noms.has(d.nom)) out.push(d)
  }
  return out
}

/** (v4, retour Thibaut 2026-10-22) : RÉALIGNEMENT des aménagements
 *  d'une ancienne configuration sur le référentiel courant. Les configs
 *  sauvegardées AVANT le rework « production → emplacements » (vague
 *  3a, 2026-10-21) portent encore les ANCIENNES descriptions (« +2 Or
 *  et +10 Nourriture par tour. ») ET les anciens effets structurés
 *  (encore lus par le moteur — l'aménagement continuait de produire !)
 *  sans champ `emplacements` : la partie en cours affichait donc des
 *  aménagements mensongers et hors rework, alors que les tiers 2/3
 *  (ajoutés neufs par migrerConstructions) étaient conformes — un
 *  mélange incohérent. migrerConstructions n'ajoutant que les
 *  entrées MANQUANTES par nom, les entrées existantes restaient figées.
 *  Arbitrage : un aménagement du référentiel est une donnée de
 *  RÉFÉRENCE, pas de personnalisation — toute entrée de même nom (et
 *  de catégorie Aménagement) est REMPLACÉE par l'entrée courante du
 *  référentiel (description, production, coût, terrain, emplacements,
 *  effets, rangMinHabitation, remplaceAmenagement). Les aménagements
 *  PERSO (noms hors référentiel) sont conservés tels quels. */
export function realignerAmenagements(
  list: ConstructionRef[] | undefined, defauts: ConstructionRef[],
): ConstructionRef[] {
  if (!Array.isArray(list)) return defauts
  const parNom = new Map(
    defauts.filter((d) => d.categorie === 'Aménagement').map((d) => [d.nom, d]),
  )
  return list.map((c) =>
    (c.categorie === 'Aménagement' ? parNom.get(c.nom) : undefined) ?? c)
}

/** Table des types d'habitation (Ville / Château) d'une configuration
 *  existante — défauts du classeur si absents ou vides. */
/** Parse le format de SAISIE TEXTE des métiers de base d'un rang
 *  (« 50 Chasseurs, 2 Gardes » — colonne historique du classeur, champ
 *  d'édition des Référentiels) en tableau STRUCTURÉ `metiersBase`
 *  (retour Thibaut 2026-10-23 : métiers TOUJOURS AU SINGULIER — un
 *  « s » final est retiré). Les entrées non reconnues dans
 *  `metiersConnus` (quand fourni) sont ignorées. Le STOCKAGE est
 *  structuré : ce parse ne vit qu'à la SAISIE (éditeur Référentiels)
 *  et dans la migration one-shot de cfgOf — jamais au runtime moteur. */
export function parseMetiersBaseTexte(
  texte: string, metiersConnus?: string[],
): EmplacementDef[] {
  const out: EmplacementDef[] = []
  if (!texte) return out
  const connus = metiersConnus ? new Set(metiersConnus) : undefined
  for (const morceau of texte.split(',')) {
    const m = /^(\d+)\s+(.+)$/.exec(morceau.trim())
    if (!m) continue
    let nom = m[2].trim()
    if (nom.endsWith('s')) nom = nom.slice(0, -1)
    if (connus && !connus.has(nom)) continue
    const existant = out.find((e) => e.metier === nom)
    if (existant) existant.places += Number(m[1])
    else out.push({ metier: nom, places: Number(m[1]) })
  }
  return out
}

export function migrerTypesHabitation(list: HabitationDef[] | undefined): HabitationDef[] {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_CONFIG.typesHabitation
  // Vague 3b (2026-10-22) : les configs sauvegardées avant le rework
  //  portent consommation/garnison au lieu de metiersBase/
  //  domicilesDisponibles — les colonnes manquantes sont complétées
  //  depuis la ligne du DEFAULT_CONFIG de même (type, rang) ; les
  //  anciens champs sont ignorés (consommation et garnison de base
  //  supprimées par arbitrage). Nettoyage 2026-10-23 (retour Thibaut,
  //  formats unifiés) : les métiers de base vivent en TABLEAU
  //  structuré `metiersBase` (métiers au singulier) — l'ancien TEXTE
  //  « metiersDisponibles » est converti par la migration ciblée de
  //  cfgOf, qui joue même sur les configs déjà convergées.
  for (const d of list) {
    if (d.metiersBase === undefined || d.domicilesDisponibles === undefined) {
      const ref = DEFAULT_CONFIG.typesHabitation.find((t) => t.type === d.type && t.rang === d.rang)
      d.metiersBase = d.metiersBase ?? ref?.metiersBase ?? []
      d.domicilesDisponibles = d.domicilesDisponibles ?? ref?.domicilesDisponibles ?? ''
    }
    // Vague A (2026-10-24) : domicilesRang structuré — complété depuis
    //  la ligne du défaut de même (type, rang) si absent (config
    //  sauvegardée avant la vague). Idempotent.
    if (d.domicilesRang === undefined) {
      const ref = DEFAULT_CONFIG.typesHabitation.find((t) => t.type === d.type && t.rang === d.rang)
      d.domicilesRang = ref?.domicilesRang ? [...ref.domicilesRang] : []
    }
  }
  return list
}

// (migrerProgres retiré le 2026-10-24 avec le système de progrès :
//  migration de l'ancien format à plat du classeur vers les arbres
//  par branches — plus nécessaire, la table entière est purgée par
//  cfgOf et n'existe plus dans le référentiel.)

// Rangs de pays : migration de l'ancienne table à blocs Féodal/Républicain
// (champs bloc/cout/succession en texte libre) vers l'échelle féodale
// unique (champs coutOr/coutNourriture/serments). Les parties
// sauvegardées avec l'ancien format repassent sur la table par défaut.
function migrerPaysRangs(rangs: GameConfig['paysRangs']): GameConfig['paysRangs'] {
  if (!Array.isArray(rangs) || rangs.length === 0) return DEFAULT_CONFIG.paysRangs
  const r0 = rangs[0] as Record<string, unknown>
  if (typeof r0.coutOr !== 'number' || typeof r0.serments !== 'number') {
    return DEFAULT_CONFIG.paysRangs
  }
  return rangs
}

// Voies de victoire (feuille « Référentiel », table victoires) : migration
// des anciens formats (refonte 2026-10-14) — « Rang I-IV » devient
// « Laurier I-IV » ; les vieilles sauvegardes avec `rangs` repassent
// automatiquement sur `lauriers` (textes du classeur conservés).
// (NB 2026-10-24 : depuis le retrait des textes de conditions, les
//  valeurs de repli sont vides — Lauriers VIDÉS, retour arbitre.)
function migrerVictoires(list: GameConfig['victoires']): GameConfig['victoires'] {
  const convert = (m: any) => ({
    voie: m.voie ?? '',
    lauriers: (m.lauriers ?? m.rangs ?? []).map((r: any) => ({
      laurier: r.laurier ?? r.rang ?? '',
      condition: r.condition ?? '',
      bonus: r.bonus ?? '',
    })),
  })
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_CONFIG.victoires
  return list.map(convert)
}


/** Version de schéma de la configuration (marqueur (x), 2026-10-15).
 *  Une configuration convergée (fusion + migrations + tampon
 *  schemaVersion = ce numéro) n'est plus re-migrée à chaque cfgOf —
 *  les migrations de complétion (migrerMinisteres, migrerFactions,
 *  migrerConstructions…) ne servent qu'à mettre au niveau les
 *  ANCIENNES configurations : elles réintégraient sinon à CHAQUE
 *  lecture les entrées par défaut manquantes, « ressuscitant » les
 *  entrées supprimées ou renommées dans l'onglet Paramètres.
 *  AJUSTER CE NUMÉRO quand une évolution du référentiel (nouvelles
 *  entrées, renommages, nouveau format de table) doit être répercutée
 *  dans les configurations existantes : les configs tamponnées au
 *  numéro précédent repasseront alors une fois par les migrations. */
// Version 2 (2026-10-19, retour arbitre) : retrait du système de faction
//  — les constructions marquées `faction` (Église, Apiculture, Puit de
//  mana, Colonies souterraines…, 19 au total) sont FILTRÉES des
//  configurations existantes lors de la convergence.
// Version 3 (2026-10-20, rework habitants) : le référentiel `titres`
//  devient `metiers` (champ `titre` → `metier` par entrée), la banque
//  `titresEffets` devient `metiersEffets`, et les effets de techs
//  `prodParTitre` deviennent `prodParMetier` — les configs v2 sont
//  converties une fois dans cfgOf (personnalisations conservées).
// Version 4 (2026-10-22, retour Thibaut « les descriptions des
//  aménagements, c'est du grand n'importe quoi ») : les configs v3
//  sauvegardées avant la vague 3a portent encore les ANCIENNES
//  descriptions/effets des aménagements (« +2 Or et +10 Nourriture
//  par tour. », effets structurés actifs, pas d'emplacements) —
//  RÉALIGNEMENT complet des aménagements sur le référentiel (entrées
//  de même nom remplacées ; aménagements perso conservés ; bâtiments
//  et autres tables intouchés). Les tiers 2/3 de la vague 3c sont
//  ajoutés par migrerConstructions.
export const SCHEMA_VERSION_CONFIG = 4

/** Garde-fous appliqués à TOUTES les configurations, même convergées :
 *  chaque table du référentiel migrée doit contenir au moins une entrée
 *  (le moteur en lit certaines pour fonctionner : cultures, paysRangs…).
 *  Ces tables retrouvaient leurs défauts quand elles étaient vides via
 *  les migrations — le comportement est conservé une fois convergées.
 *  Une table vidée par l'utilisateur repasse sur les défauts : les
 *  entrées restent supprimables UNE À UNE, ce qui est le comportement
 *  documenté de l'onglet Paramètres. */
function gardeFous(m: GameConfig): void {
  const ouDefauts = <T>(list: T[] | undefined, defauts: T[]): T[] =>
    Array.isArray(list) && list.length > 0 ? list : defauts
  m.traits = ouDefauts(m.traits, DEFAULT_CONFIG.traits)
  m.cultures = ouDefauts(m.cultures, DEFAULT_CONFIG.cultures)
  m.regimes = ouDefauts(m.regimes, DEFAULT_CONFIG.regimes)
  m.typesHabitation = ouDefauts(m.typesHabitation, DEFAULT_CONFIG.typesHabitation)
  // (RETRAIT 2026-10-24 : le garde-fou des arbres de progrès et la
  //  réintégration (aa) des nouveaux arbres du référentiel sont
  //  supprimés avec le système de progrès — la clé `progres` d'une
  //  config existante est purgée par le delete ciblé de cfgOf, elle
  //  ne doit SURTOUT pas être re-remplie par un défaut.)
  m.paysRangs = ouDefauts(m.paysRangs, DEFAULT_CONFIG.paysRangs)
  m.victoires = ouDefauts(m.victoires, DEFAULT_CONFIG.victoires)
  // Mise à jour des CONDITIONS de victoire (retour Thibaut 2026-10-15) :
  //  les nouvelles voies du référentiel REMPLACENT celles d'une config
  //  convergée — mais les Lauriers VALIDÉS par les joueurs (p.lauriers)
  //  sont conservés : seul le texte des conditions/bonus est actualisé.
  //  (2026-10-24 : c'est ce bloc, appliqué à CHAQUE cfgOf, qui propage
  //  le RETRAIT des textes de conditions (retour arbitre) vers les
  //  configs sauvegardées — une voie aux textes non vides diffère du
  //  référentiel vide et est remplacée ; idempotent, sans bump de
  //  SCHEMA_VERSION_CONFIG.)
  if (Array.isArray(m.victoires)) {
    const voies = new Map(m.victoires.map((v) => [v.voie, v]))
    for (const def of DEFAULT_CONFIG.victoires) {
      const existante = voies.get(def.voie)
      const diff = !existante || existante.lauriers.some((l, i) =>
        l.condition !== def.lauriers[i]?.condition || l.bonus !== def.lauriers[i]?.bonus)
      if (diff) m.victoires = m.victoires.map((v) => v.voie === def.voie ? def : v)
    }
    // voies absentes de la config (ajoutées au référentiel)
    for (const def of DEFAULT_CONFIG.victoires) {
      if (!m.victoires.some((v) => v.voie === def.voie)) m.victoires.push(def)
    }
  }
  m.peuplesLibres = ouDefauts(m.peuplesLibres, DEFAULT_CONFIG.peuplesLibres)
  m.peuplesAutres = ouDefauts(m.peuplesAutres, DEFAULT_CONFIG.peuplesAutres)
  m.constructions = ouDefauts(m.constructions, DEFAULT_CONFIG.constructions)
  // Ajout des constructions du référentiel manquantes dans une config
  //  déjà convergée (revue 2026-10-15) : les NOUVELLES constructions
  //  (ex. les 12 MERVEILLES) sont AJOUTÉES sans toucher aux existantes —
  //  la personnalisation (coûts édités, suppressions) persiste. Clé : nom.
  //  Une construction existante du même nom N'EST PAS écrasée.
  if (Array.isArray(m.constructions)) {
    // Mise à jour des RANGS d'habitation (revue 2026-10-15 : les
    //  configs convergées gardaient les anciens défauts — sans
    //  rangMinHabitation — d'où l'absence de séparation par rang
    //  dans le picker). La règle du référentiel fait foi ; une
    //  construction EXISTANTE du même nom dont le rang diffère est
    //  actualisée (les autres champs — coûts édités — sont
    //  préservés).
    const parNom = new Map(DEFAULT_CONFIG.constructions.map((c) => [c.nom, c]))
    for (const c of m.constructions) {
      const def = parNom.get(c.nom)
      if (def && def.rangMinHabitation !== undefined) c.rangMinHabitation = def.rangMinHabitation
    }
    const connus = new Set(m.constructions.map((c) => c.nom))
    for (const def of DEFAULT_CONFIG.constructions) {
      if (!connus.has(def.nom)) m.constructions.push(def)
    }
  }
  m.couleurs = migrerCouleurs(m.couleurs)
}

/** Converge une configuration quelconque vers le format courant :
 *  fusion sur les défauts + migrations (si ancienne) + garde-fous +
 *  tampon de version (marqueur (x), 2026-10-15). À utiliser avant de
 *  SAUVEGARDER la configuration commune (édition dans Paramètres,
 *  partie importée/jointe) ou d'en repartir (nouvelle partie) : la
 *  structure sauvée devient identique à celle affichée, et la
 *  convergence n'a plus jamais besoin d'être rejouée. */
export function convergerConfig(c: GameConfig | undefined): GameConfig {
  return cfgOf(c).config
}

/** Cache de cfgOf par RÉFÉRENCE de configuration (vague
 *  scalabilité 2026-10-23). Sûreté (arbitrage Thibaut : « une
 *  seule config globale, modifiable en dehors des parties et
 *  jamais remodifiée après adoption ») : toute édition de la
 *  config passe par une NOUVELLE référence — le cache suit chaque
 *  édition, il ne peut pas servir un résultat périmé. Clé WeakMap :
 *  une config abandonnée libère son entrée au GC. Motivation :
 *  ~47 000 appels de cfgOf par tour à 16 000 habitants (défauts de
 *  signature « C: Cfg = cfgOf(...) » évalués par habitant), chaque
 *  appel non caché rejouait fusion + migrations + garde-fous —
 *  ~34 % du temps de fin de tour (profil CPU, bench 16k). */
const CACHE_CFG = new WeakMap<GameConfig, Cfg>()

export function cfgOf(config?: GameConfig): Cfg {
  const c = config ?? DEFAULT_CONFIG
  const cache = CACHE_CFG.get(c)
  if (cache) return cache
  const merged: GameConfig = {
    ...DEFAULT_CONFIG,
    ...c,
    params: mergeParams(c.params as unknown as Record<string, unknown>),
  }
  // RETRAIT DES DOGMES (retour arbitre Thibaut 2026-10-24) : la table
  //  « dogmes » n'existe plus dans le type ni le référentiel, mais les
  //  configs sauvegardées AVANT la portent encore (la fusion
  //  {...DEFAULT_CONFIG, ...c} la fait réapparaître). Migration ciblée
  //  (patron taxes25), SANS bump de SCHEMA_VERSION_CONFIG : un bump
  //  renverrait les configs v4 convergées dans la branche de migration
  //  complète, qui ré-ajoute les entrées du référentiel supprimées
  //  (règle (x) : les suppressions persistent). Le delete est
  //  idempotent — une fois purgée au point de sauvegarde, la clé ne
  //  revient jamais (rien ne la ré-écrit).
  delete (merged as { dogmes?: unknown }).dogmes
  // RETRAIT DES ÉVÉNEMENTS DE SAISON ET DES CARTES DYNASTIE (retour
  //  arbitre Thibaut 2026-10-24) : les tables `events`, `dynasties`,
  //  `eventEffets` et `dynastieEffets` n'existent plus dans le type
  //  ni le référentiel, mais les configs sauvegardées AVANT les
  //  portent encore (fusion {...DEFAULT_CONFIG, ...c}). Même patron
  //  que le retrait des dogmes : deletes ciblés, SANS bump de
  //  SCHEMA_VERSION_CONFIG (un bump renverrait les configs v4
  //  convergées dans la branche de migration complète qui ré-ajoute
  //  les entrées supprimées, règle (x)). Idempotents.
  // RETRAIT DU SYSTÈME DE PROGRÈS (retour arbitre Thibaut 2026-10-24 :
  //  « supprimer proprement les progrès, qu'il ne reste rien ») : les
  //  arbres de progrès, technologies, effets et déblocages n'existent
  //  plus dans le type ni le référentiel, mais les configs
  //  sauvegardées AVANT portent encore la clé (fusion
  //  {...DEFAULT_CONFIG, ...c}). Même patron que dogmes/événements :
  //  delete ciblé, SANS bump de SCHEMA_VERSION_CONFIG (un bump
  //  renverrait les configs v4 convergées dans la branche de
  //  migration complète qui ré-ajoute les entrées supprimées,
  //  règle (x)). Idempotent — rien ne ré-écrit la clé ensuite.
  delete (merged as { progres?: unknown }).progres
  const purgeEvt = merged as {
    events?: unknown; dynasties?: unknown; eventEffets?: unknown; dynastieEffets?: unknown
  }
  delete purgeEvt.events
  delete purgeEvt.dynasties
  delete purgeEvt.eventEffets
  delete purgeEvt.dynastieEffets
  // RETRAIT DE marchandOrTour (sous-vague 3b « routes commerciales
  //  dissociées », arbitrage Thibaut 2026-10-24) : les routes ne
  //  rapportent plus d'Or passif, le paramètre n'a plus aucun
  //  lecteur — les configs sauvegardées AVANT le portent encore
  //  (fusion {...DEFAULT_CONFIG, ...c}). Même patron que dogmes/
  //  événements : delete ciblé, SANS bump de SCHEMA_VERSION_CONFIG
  //  (règle (x)). Idempotent.
  delete (merged as { params?: { marchandOrTour?: unknown } }).params?.marchandOrTour
  // SUPPRESSION DU MÉTIER DE MARCHAND (arbitrage Thibaut 2026-10-24 :
  // « supprime carrément le métier de marchand ») : l'entrée est
  //  retirée du RÉFÉRENTIEL (metiers + metiersEffets), mais les
  //  configs CONVERGÉES sauvegardées AVANT embarquent la table entière
  //  (convergerConfig sauve la structure fusionnée) — sans purge, le
  //  Marchand reviendrait par la fusion {...DEFAULT_CONFIG, ...c} et
  //  réapparaîtrait dans le picker (metiersAccessibles parcourt
  //  C.metiers). Même patron que dogmes/événements/marchandOrTour :
  //  purge ciblée TOUJOURS appliquée (idempotente), SANS bump de
  //  SCHEMA_VERSION_CONFIG (règle (x)). Trois familles :
  //    · entrée « Marchand » de merged.metiers (le picker, les caps) ;
  //    · entrée « Marchand » de merged.metiersEffets (le wiki) ;
  //    · (RETRAIT 2026-10-24, purge R4 : la troisième famille —
  //      « effets fluxParMetier de métier Marchand dans les TECHS »
  //      (ex. « Commerce lointain », gardée SANS effet) — est
  //      devenue muette : la table `progres` entière est purgée
  //      ci-dessous avec le système de progrès, retour arbitre.
  //      Aucune purge dédiée nécessaire.)
  if (Array.isArray(merged.metiers)) {
    merged.metiers = merged.metiers.filter((m) => m.metier !== 'Marchand')
  }
  if (Array.isArray(merged.metiersEffets)) {
    merged.metiersEffets = merged.metiersEffets.filter((e) => e.metier !== 'Marchand')
  }
  // PURGE DE L'INFLUENCE (retour arbitre Thibaut 2026-10-24, suite
  //  de l'arbitrage fondateur « Influence → émissaires ») : le texte
  //  de la règle des cités libres parlait encore de « gagner de
  //  l'influence » — reformulé en émissaires dans le référentiel.
  //  Migration ciblée (patron taxes25) : seule la formulation
  //  ANCIENNE est remplacée, un texte personnalisé est conservé.
  if (typeof merged.regleCitesLibres === 'string') {
    merged.regleCitesLibres = merged.regleCitesLibres
      .replace('de l\u2019influence auprès des différentes cités libres', 'des émissaires auprès des différentes cités libres')
      .replace('gagner en influence qu\u2019une seule fois', 'gagner un émissaire qu\u2019une seule fois')
  }
  if ((c?.schemaVersion ?? 0) >= SCHEMA_VERSION_CONFIG) {
    // Déjà convergée (marqueur (x)) : PAS de re-migration — les
    // suppressions et renommements d'entrées du référentiel
    // persistent. Seuls les garde-fous s'appliquent.
    gardeFous(merged)
  } else {
    // Ancienne configuration : migrations une fois pour toutes, puis
    // tampon — le résultat est sauvegardé convergé par les points
    // d'entrée (setGlobalCfg, syncGlobalCfg, import/export…).
    // rework habitants (2026-10-20, v3) : `titres` → `metiers` (champ
    //  renommé, personnalisation conservée), `titresEffets` →
    //  `metiersEffets`, effets de techs `prodParTitre` →
    //  `prodParMetier`. Les configs déjà convergées v3 ne portent plus
    //  ces champs : le bloc est dans la branche de migration une fois
    //  pour toutes.
    const ancienM = c as unknown as { titres?: unknown; titresEffets?: unknown }
    if (Array.isArray(ancienM.titres)) {
      merged.metiers = (ancienM.titres as Array<Record<string, unknown>>).map((t) => {
        const { titre: ancienMetier, ...reste } = t
        const r = reste as unknown as MetierDef
        if (r.metier === undefined && ancienMetier !== undefined) r.metier = ancienMetier as string
        return r
      })
      delete ancienM.titres
    }
    if (Array.isArray(ancienM.titresEffets)) {
      // champ interne `titre` → `metier` de chaque entrée (l'UI et la
      //  révocation lisent e.metier)
      merged.metiersEffets = (ancienM.titresEffets as Array<Record<string, unknown>>).map((e) => {
        const { titre: ancienTitre, ...reste } = e
        const r = reste as unknown as GameConfig['metiersEffets'][number]
        if (r.metier === undefined && ancienTitre !== undefined) r.metier = ancienTitre as string
        return r
      })
      delete ancienM.titresEffets
    }
    // (2026-10-24 : la migration des effets de techs prodParTitre →
    //  prodParMetier est supprimée avec le système de progrès — la
    //  table `progres` est purgée en tête de cfgOf, rien à migrer.)
    // migrations : traits (V2), cultures et régimes (champs chiffrés)
    merged.traits = migrateTraits(merged.traits)
    merged.cultures = migrerCultures(merged.cultures)
    merged.regimes = migrerRegimes(merged.regimes)
    merged.typesHabitation = migrerTypesHabitation(merged.typesHabitation)
    // rangs de pays : échelle féodale unique (refonte 2026-10-14)
    merged.paysRangs = migrerPaysRangs(merged.paysRangs)
    // ministères : complétion rangMinimum/mode (refonte 2026-10-14)
    // couleurs d'affichage : complétion depuis les défauts (marqueur (o))
    merged.couleurs = migrerCouleurs(c.couleurs)
    // voies de victoire : rangs → lauriers (refonte 2026-10-14)
    merged.victoires = migrerVictoires(merged.victoires)
    // fiches de faction : structure (victoire/bâtiment/âges) du référentiel
    //  + correctif Sylvains (Savoir ancestral ↔ Bibliothèque enfouie)
    merged.peuplesLibres = migrerFactions(merged.peuplesLibres, DEFAULT_CONFIG.peuplesLibres).map(migrerSwapSylvains)
    merged.peuplesAutres = migrerFactions(merged.peuplesAutres, DEFAULT_CONFIG.peuplesAutres)
    // retrait des constructions de faction (2026-10-19, retour arbitre) :
    //  filtrées AVANT la complétion pour ne pas être ré-ajoutées.
    merged.constructions = (merged.constructions ?? []).filter((c) => !(c as { faction?: string }).faction)
    // constructions : ajout des entrées du référentiel apparues depuis
    //  la sauvegarde
    // (v4) : réalignement des AMÉNAGEMENTS existants sur le
    //  référentiel AVANT la complétion (retour Thibaut 2026-10-22 —
    //  voir realignerAmenagements : descriptions/effets de la vague 3a)
    merged.constructions = realignerAmenagements(merged.constructions, DEFAULT_CONFIG.constructions)
    merged.constructions = migrerConstructions(merged.constructions, DEFAULT_CONFIG.constructions)
    merged.schemaVersion = SCHEMA_VERSION_CONFIG
  }
  // RETRAIT INTÉGRAL DES RÈGLES DE FACTIONS (retour arbitre Thibaut
  //  2026-10-24 : « vide toutes les lignes de règles + les
  //  descriptions, ne garde que les noms ») : le référentiel ne porte
  //  plus que le NOM de chaque peuple (description et lignes VIDÉES —
  //  la structure reste pour les recevoir à nouveau). Ce bloc
  //  remplace, dans les configs sauvegardées, toute fiche PORTÉE PAR
  //  LE RÉFÉRENTIEL par la fiche courante (vide) : les reliquats des
  //  vagues précédentes (lignes, descriptions, champs structurés
  //  reglesBase/ageII/ageIII des configs d'avant le 2026-10-19 que
  //  l'onglet Peuples rendait encore) disparaissent. Un peuple HORS
  //  référentiel (personnalisé) est conservé tel quel. Même patron
  //  que la « mise à jour des CONDITIONS » de victoire : appliqué à
  //  CHAQUE cfgOf, idempotent, SANS bump de SCHEMA_VERSION_CONFIG
  //  (règle (x)).
  {
    const parNomPeuple = new Map(
      [...DEFAULT_CONFIG.peuplesLibres, ...DEFAULT_CONFIG.peuplesAutres].map((d) => [d.nom, d]))
    const alignerPeuples = (list: PeupleRef[] | undefined): PeupleRef[] =>
      (list ?? []).map((p) => {
        const def = parNomPeuple.get(p.nom)
        return def ? structuredClone(def) : p
      })
    merged.peuplesLibres = alignerPeuples(merged.peuplesLibres)
    merged.peuplesAutres = alignerPeuples(merged.peuplesAutres)
  }
  // VIDAGE DES TEXTES « MINISTRE » (retour arbitre Thibaut 2026-10-24
  //  : « garder la ligne titre, vider ses textes ») : le système des
  //  ministères a été retiré le 2026-10-23 ; la ligne « Ministre »
  //  RESTE dans la table métiers (titre attribuable manuellement,
  //  sans aucun effet moteur — l'étiquette des vieux états est
  //  inoffensive) mais ses textes morts — description (« Plusieurs
  //  autorisés »), effet (« Octroie un ministre… ») et coût de
  //  révocation (« 30 Or + 6 Soie ») — sont VIDÉS dans le
  //  référentiel. Ce bloc propage le vide aux configs sauvegardées
  //  (une config convergée AVANT garde sinon ses textes affichés
  //  dans Référence → Métiers). Même patron que la « mise à jour des
  //  CONDITIONS » : appliqué à CHAQUE cfgOf, idempotent, SANS bump
  //  de SCHEMA_VERSION_CONFIG (règle (x)).
  if (Array.isArray(merged.metiers)) {
    const defMin = DEFAULT_CONFIG.metiers.find((t) => t.metier === 'Ministre')
    for (const t of merged.metiers) {
      if (t.metier === 'Ministre' && defMin && t.description !== defMin.description) {
        t.description = defMin.description
      }
    }
  }
  if (Array.isArray(merged.metiersEffets)) {
    const defMinEff = DEFAULT_CONFIG.metiersEffets.find((t) => t.metier === 'Ministre')
    for (const t of merged.metiersEffets) {
      if (t.metier === 'Ministre' && defMinEff && (t.effet !== defMinEff.effet || t.revocation !== defMinEff.revocation)) {
        t.effet = defMinEff.effet
        t.revocation = defMinEff.revocation
      }
    }
  }
  // Effet des taxes ±50 % → ±25 % (marqueur (z), retour Thibaut
  //  2026-10-15) : migration CIBLÉE des paramètres, indépendante du
  //  tampon schemaVersion — on ne re-joue PAS les autres migrations
  //  (les suppressions/renommements du référentiel persistent, règle
  //  (x)). Ne remplace qu'une valeur encore à l'ANCIEN défaut
  //  (0.5 / 1.5) ; toute valeur personnalisée est conservée. Le
  //  champ taxes25 marque la migration faite (persisté par
  //  convergerConfig aux points de sauvegarde).
  // (2026-10-24 : le bloc de migration renommagesTechs2026 — renommage
  //  des techs doublons des configs sauvegardées — est supprimé avec le
  //  système de progrès ; la table `progres` est purgée en tête de cfgOf.)
  // (2026-10-24 : le bloc de migration techsManquantes2026 — copie des
  //  techs manquantes du référentiel dans les configs sauvegardées —
  //  est supprimé avec le système de progrès.)
  // LAURIER IV MILITAIRE (revue 2026-10-16) : « Capturer un total de
  //  3 Capitales » \u2192 \u00ab Contr\u00f4ler 6 des habitations de d\u00e9part \u00bb.
  //  Migration cibl\u00e9e (m\u00eame sch\u00e9ma que taxes25) : le texte n'est
  //  remplac\u00e9 QUE s'il vaut encore l'ancienne condition \u2014 une
  //  \u00e9dition personnalis\u00e9e est pr\u00e9serv\u00e9e. La validation des Lauriers
  //  reste manuelle (radar de l'accueil) : aucun impact m\u00e9tier.
  if (!merged.laurier4Militaire2026) {
    const voieM = merged.victoires?.find((v) => v.voie === 'Militaire')
    const l4 = voieM?.lauriers?.[3]
    const ancien = 'Capturer un total de 3 Capitales.'
    if (l4 && l4.condition === ancien) {
      l4.condition = 'Contr\u00f4ler 6 des habitations de d\u00e9part.'
    }
    merged.laurier4Militaire2026 = true
  }
  // SYLVAINS (revue 2026-10-16) : le tampon schemaVersion \u00ab les
  //  suppressions persistent \u00bb a aval\u00e9 l'AJOUT des Sylvains \u2014 une
  //  config sauvegard\u00e9e \u00e0 l'\u00e9poque \u00ab peuples r\u00e9duits \u00bb ne les
  //  r\u00e9-ajoutait jamais (le peuple du joueur existait mais sa fiche
  //  avait disparu \u2192 remplac\u00e9 par Basil\u00e9ens au setup). Migration
  //  cibl\u00e9e (m\u00eame sch\u00e9ma que taxes25) : la fiche Sylvains et le
  //  peuple sont r\u00e9-ajout\u00e9s s'ils manquent. Une suppression
  //  VOLONTAIRE reste possible : supprimer de nouveau dans Param\u00e8tres
  //  apr\u00e8s cette migration la retire pour de bon.
  if (!merged.sylvains2026) {
    const dLibres = DEFAULT_CONFIG.peuplesLibres
    const dAutres = DEFAULT_CONFIG.peuplesAutres
    const defSyl = [...dLibres, ...dAutres].find((f) => f.nom === 'Sylvains')
    if (defSyl && !(merged.peuplesLibres ?? []).some((f) => f.nom === 'Sylvains')
      && !(merged.peuplesAutres ?? []).some((f) => f.nom === 'Sylvains')) {
      merged.peuplesLibres = [...(merged.peuplesLibres ?? []), structuredClone(defSyl)]
    }
    if (defSyl && !(merged.peuples ?? []).includes('Sylvains')) {
      merged.peuples = [...(merged.peuples ?? []), 'Sylvains']
    }
    merged.sylvains2026 = true
  }
  // VALEURS DE NOURRITURE (revue 2026-10-16) : Grange 20, Silo à grain
  //  35, Moulin à vent 60, Guilde des artisans de la terre 60,
  //  Champ 15 été, Rizière 20 été, Pâturage +1 Bétail +4 Nourr.
  //  Le tampon schemaVersion « les valeurs persistent » gardait les
  //  ANCIENNES valeurs dans les parties existantes — migration ciblée
  //  (même schéma que taxes25) : les valeurs sont mises à jour UNIQUEMENT
  //  si elles valent encore l'ancienne valeur exacte (une édition
  //  personnalisée dans Paramètres est préservée).
  if (!merged.valeursNourriture2026) {
    const MAJ: Array<[string, EffetConstruction[], string | null, string | null]> = [
      // [nom, effets attendus, ancienne production, nouvelle production]
      ['Grange', [{ ressource: 'Nourriture', quantite: 20 }], '+15 Nourriture par tour.', '+20 Nourriture par tour.'],
      ['Silo à grain', [{ ressource: 'Nourriture', quantite: 35 }], '+25 Nourriture par tour.', '+35 Nourriture par tour.'],
      ['Moulin à vent', [{ ressource: 'Charbon', quantite: -1 }, { ressource: 'Nourriture', quantite: 60 }], 'Consomme 1 Charbon par tour. +45 Nourriture par tour.', 'Consomme 1 Charbon par tour. +60 Nourriture par tour.'],
      ["Guilde des artisans de la terre.", [{ ressource: 'Charbon', quantite: -1 }, { ressource: 'Nourriture', quantite: 60 }], 'Consomme 1 Charbon par tour. +45 Nourriture par tour.', 'Consomme 1 Charbon par tour. +60 Nourriture par tour.'],
      ['Champ', [{ ressource: 'Nourriture', quantite: 15, ete: true }], '+10 Nourriture par tour en été.', '+15 Nourriture par tour en été.'],
      ['Rizière', [{ ressource: 'Nourriture', quantite: 20, ete: true }], '+15 Nourriture par tour en été.', '+20 Nourriture par tour en été.'],
      ['Pâturage', [{ ressource: 'Bétail', quantite: 1 }, { ressource: 'Nourriture', quantite: 4 }], '+1 Bétail et +8 Nourriture par tour.', '+1 Bétail et +4 Nourriture par tour.'],
    ]
    for (const c of merged.constructions ?? []) {
      const maj = MAJ.find(([nom]) => nom === c.nom)
      if (!maj) continue
      const [, effets, ancienneProd, nouvelleProd] = maj
      // ne remplacer QUE si la valeur actuelle est l'ANCIENNE exacte
      const estAncienne = Array.isArray(c.effets) && JSON.stringify(c.effets) !== JSON.stringify(effets)
        && c.production === ancienneProd
      if (estAncienne) {
        c.effets = effets
        if (nouvelleProd) c.production = nouvelleProd
      }
    }
    merged.valeursNourriture2026 = true
  }
  // Migration pontificats (2026-10-17) : le palier 220 Tourisme
  //  affichait encore « (crédité automatiquement) » alors que
  //  l'automatisation a été retirée du moteur (commit d5d3005b) —
  //  tous les paliers de pontificat sont des aides de jeu au
  //  plateau. Ne remplace QUE si le texte actuel est l'ancien exact
  //  (édition personnalisée préservée). Même schéma que taxes25.
  if (!merged.pontificats2026) {
    const ANCIEN = 'A la fin de chaque hiver, recevez 1 Émissaire en réserve (crédité automatiquement).'
    const NOUVEAU = 'A la fin de chaque hiver, recevez 1 Émissaire en réserve (à gérer au plateau).'
    for (const t of merged.tourismeSeuils ?? []) {
      if (t.seuil === 220 && t.bonus === ANCIEN) t.bonus = NOUVEAU
    }
    merged.pontificats2026 = true
  }
  // (2026-10-24 : le bloc de migration muraille40_2026 — description
  //  « +40 Garnison » de la tech Muraille dans les configs — est
  //  supprimé avec le système de progrès.)
  // (2026-10-24 : le bloc de migration slotsVides2026 — complétion
  //  des slots vides d'arbres depuis le référentiel — est supprimé
  //  avec le système de progrès.)
  if (!merged.taxes25) {
    const pm = merged.params as unknown as Record<string, unknown>
    if (pm.taxOrFaibles === 0.5) pm.taxOrFaibles = 0.75
    if (pm.taxOrHautes === 1.5) pm.taxOrHautes = 1.25
    if (pm.taxNaissFaibles === 1.5) pm.taxNaissFaibles = 1.25
    if (pm.taxNaissHautes === 0.5) pm.taxNaissHautes = 0.75
    merged.taxes25 = true
  }
  // SUPPRESSION DE LA MARTIALITÉ (arbitrage Thibaut 2026-10-21) :
  //  l'hérédité est conservée, mais la martialité disparaît du jeu —
  //  Soldat et Commandant ne sont plus régis par le sexe, le
  //  recrutement des armées est ouvert à tous. Migration ciblée
  //  (même schéma que taxes25, SANS toucher au tampon schemaVersion —
  //  règle (x)) : les configs sauvegardées portent encore
  //  regleGenre « Martialité » et la clé martialite des cultures.
  //  Seule la valeur exacte « Martialité » est remplacée (une
  //  édition personnalisée est préservée) ; la clé martialite est
  //  dépouillée (inerte de toute façon). Marquée martialiteSupprimee.
  if (!merged.martialiteSupprimee) {
    for (const m of merged.metiers) {
      if (m.regleGenre === 'Martialité') m.regleGenre = ''
    }
    for (const cu of merged.cultures) {
      delete (cu as unknown as { martialite?: string }).martialite
    }
    merged.martialiteSupprimee = true
  }
  // REWORK MÉTIERS & AMÉNAGEMENTS (vague 3a, arbitrage Thibaut
  //  2026-10-21) : les métiers deviennent des postes à emplacements
  //  créés par les aménagements — 24 métiers au référentiel, gains
  //  recalibrés SANS éducation requise (Artisan→Commerçant,
  //  Chercheur→Scientifique, Sportif→Garde, Propagandiste supprimé,
  //  nouveaux métiers de production), production DIRECTE des 14
  //  aménagements tier 1 remplacée par des emplacements. Migration
  //  ciblée (même schéma que taxes25, SANS toucher au tampon
  //  schemaVersion — règle (x)) : les configs sauvegardées portent
  //  encore l'ancienne table. Convention de préservation :
  //  · une entrée qui vaut ENCORE l'ANCIEN défaut exact est remplacée
  //    par le nouveau défaut (renommage + valeurs comprises) ;
  //  · une entrée personnalisée est seulement RENOMMÉE (ses valeurs
  //    restent les siennes) ;
  //  · les métiers manquants du nouveau référentiel sont AJOUTÉS ;
  //  · Propagandiste (supprimé) est retiré (ses titulaires passent
  //    Sans-emploi par la migration d'ÉTAT v4).
  if (!merged.metiersAmenagements2026) {
    const RENOMMAGES: Record<string, string> = {
      Artisan: 'Commerçant', Chercheur: 'Scientifique', Sportif: 'Garde',
    }
    // Anciens défauts (15 métiers, pré-3a, après normalisation —
    //  regleGenre « vide » → '') : [nom, education, v1, r1, v2, r2, desc, nobleSeul, regleGenre, attribution]
    const ANCIENS: Array<[string, string, number, string, number, string, string, boolean, string, string]> = [
      ['Chasseur', '', 1, 'Nourriture', 0.1, 'Or', 'Métier par défaut', false, '', ''],
      ['Artiste', 'Culturelle', 1.2, 'Tourisme', 0, '', '', false, '', 'Education'],
      ['Chercheur', 'Scientifique', 0.2, 'Science', 0, '', '', false, '', 'Education'],
      ['Éleveur', 'Agricole', 2.5, 'Nourriture', 0, '', '', false, '', 'Education'],
      ['Sportif', 'Militaire', 5, 'Garnison', 0, '', '', false, '', 'Education'],
      ['Artisan', 'Économique', 1.5, 'Or', 0, '', '', false, '', 'Education'],
      ['Professeur', '', 0, '', 0, '', '', false, '', 'Ville'],
      ['Dirigeant', '', 0, '', 0, '', 'Chef de faction · 1 par joueur', true, 'Hérédité', 'Succession'],
      ['Gouverneur', '', 0, '', 0, '', 'Max 1 par ville', true, '', 'Manuelle'],
      ['Héritier', '', 0, '', 0, '', 'Même dynastie que le Dirigeant', true, 'Hérédité', 'Manuelle'],
      // NB : le Marchand (retiré du jeu le 2026-10-24, arbitrage
      //  Thibaut « supprime carrément le métier de marchand ») reste
      //  dans ce tableau HISTORIQUE : il décrit les défauts d'avant
      //  la 3a ; la purge de cfgOf retire déjà ses entrées de
      //  merged.metiers AVANT ce bloc — la ligne ne peut plus être
      //  appariée, elle ne sert qu'à la lisibilité du snapshot.
      ['Marchand', '', 0, '', 0, '', '', false, '', 'Manuelle'],
      // NB : le Ministre (textes VIDÉS le 2026-10-24, retour arbitre
      //  « garder la ligne titre, vider ses textes » — le système
      //  des ministères a été retiré le 2026-10-23, la ligne titre
      //  reste) est conservé dans ce tableau HISTORIQUE avec ses
      //  défauts d'avant la 3a (« Plusieurs autorisés ») : c'est ce
      //  portrait qu'apparie la migration « ancien défaut exact →
      //  nouveau défaut » ; le garde-fou de cfgOf vide ensuite la
      //  description de l'entrée « Ministre » des configs.
      ['Ministre', '', 0, '', 0, '', 'Plusieurs autorisés', true, '', 'Manuelle'],
      ['Propagandiste', '', 0, '', 0, '', '', false, '', 'Manuelle'],
      ['Soldat', '', 0, '', 0, '', '', false, '', 'Armée'],
      ['Commandant', '', 0, '', 0, '', '', true, '', 'Armée'],
    ]
    // NB (simplification 2026-10-23) : le champ education est retiré du
    //  type mais les vieilles configs le portent encore au runtime — la
    //  comparaison des anciens défauts doit rester IDENTIQUE pour que la
    //  migration « ancien défaut exact → nouveau défaut » joue encore.
    const cle = (m: { education?: unknown; valeur1: number; ressource1: string; valeur2: number; ressource2: string; description: string; nobleSeul: boolean; regleGenre: string; attribution: string }) =>
      JSON.stringify([m.education ?? '', m.valeur1, m.ressource1, m.valeur2, m.ressource2, m.description, m.nobleSeul, m.regleGenre, m.attribution])
    const nouveaux = new Map(DEFAULT_CONFIG.metiers.map((d) => [d.metier, d]))
    const parAncienNom = new Map(ANCIENS.map((a2) => [a2[0], a2]))
    const out: MetierDef[] = []
    for (const m of merged.metiers) {
      const nom = m.metier
      const ancien = parAncienNom.get(nom)
      if (ancien && cle(m) === JSON.stringify(ancien.slice(1))) {
        // encore à l'ancien défaut exact → nouveau défaut (renommé si besoin)
        const def = nouveaux.get(RENOMMAGES[nom] ?? nom)
        if (def) out.push(structuredClone(def))
        continue
      }
      if (RENOMMAGES[nom] && !merged.metiers.some((x) => x.metier === RENOMMAGES[nom])) {
        m.metier = RENOMMAGES[nom] // personnalisée : renommée, valeurs conservées
      }
      if (nom !== 'Propagandiste') out.push(m)
    }
    // métiers manquants du nouveau référentiel : ajoutés à la fin
    for (const d of DEFAULT_CONFIG.metiers) {
      if (!out.some((m) => m.metier === d.metier)) out.push(structuredClone(d))
    }
    merged.metiers = out
    // metiersEffets (wiki) : Propagandiste retiré, Garde/Banquier/
    //  Troubadour/Professeur ajoutés. Le Marchand n'a plus de texte
    //  à mettre à jour : le métier est SUPPRIMÉ du jeu le
    //  2026-10-24 (arbitrage Thibaut) — la purge de cfgOf (ci-
    //  dessus) retire déjà son entrée des configs, et le
    //  référentiel n'en contient plus (rien à compléter ici).
    merged.metiersEffets = (merged.metiersEffets ?? []).filter((e) => e.metier !== 'Propagandiste')
    for (const d of DEFAULT_CONFIG.metiersEffets) {
      if (!merged.metiersEffets.some((e) => e.metier === d.metier)) {
        merged.metiersEffets.push(structuredClone(d))
      }
    }
    // Constructions : les 14 aménagements tier 1 passent production →
    //  emplacements. Effets remplacés SEULEMENT s'ils valent encore
    //  l'ancien défaut exact (édition préservée sinon) ; les
    //  emplacements sont TOUJOURS ajoutés s'ils manquent.
    const ANCIENS_EFFETS: Record<string, Array<EffetConstruction>> = {
      'Baleinier': [{ ressource: 'Or', quantite: 2 }, { ressource: 'Nourriture', quantite: 10 }],
      'Bâteau de pêche': [{ ressource: 'Nourriture', quantite: 8 }],
      'Carrière': [{ ressource: 'Pierre', quantite: 1 }],
      'Champ': [{ ressource: 'Nourriture', quantite: 15, ete: true }],
      'Foire': [{ ressource: 'Tourisme', quantite: 5 }],
      'Mine de Charbon': [{ ressource: 'Charbon', quantite: 1 }],
      'Mine de Fer': [{ ressource: 'Fer', quantite: 1 }],
      "Mine d'Or": [{ ressource: 'Or', quantite: 4 }],
      'Observatoire': [{ ressource: 'Science', quantite: 1 }],
      'Pâturage': [{ ressource: 'Bétail', quantite: 1 }, { ressource: 'Nourriture', quantite: 4 }],
      'Rizière': [{ ressource: 'Nourriture', quantite: 20, ete: true }],
      'Scierie': [{ ressource: 'Bois', quantite: 1 }],
      'Sériciculture': [{ ressource: 'Soie', quantite: 1 }],
      'Site archéologique': [{ ressource: 'Tourisme', quantite: 8 }],
    }
    const defsAmenagements = new Map(
      DEFAULT_CONFIG.constructions.filter((c) => c.emplacements).map((c) => [c.nom, c]),
    )
    for (const c of merged.constructions ?? []) {
      const def = defsAmenagements.get(c.nom)
      if (!def) continue
      if (c.emplacements === undefined) c.emplacements = structuredClone(def.emplacements)
      const ancienEffets = ANCIENS_EFFETS[c.nom]
      if (ancienEffets && JSON.stringify(c.effets ?? null) === JSON.stringify(ancienEffets)) {
        c.effets = []
        c.production = def.production
        c.description = def.description
      }
    }
    merged.metiersAmenagements2026 = true
  }
  //  Migration ciblée (même schéma que taxes25, SANS toucher au tampon
  //  schemaVersion) : descriptions d'aménagements vidées une bonne
  //  fois pour toutes (retour Thibaut 2026-10-22). Jouée même sur les
  //  configs déjà convergées v4, puis tamponnée par
  //  descriptionsAmenagementsVides pour préserver toute description
  //  personnalisée saisie ensuite dans Référentiels.
  if (!merged.descriptionsAmenagementsVides) {
    for (const c of merged.constructions ?? []) {
      if (c.categorie === 'Aménagement') c.description = ''
    }
    merged.descriptionsAmenagementsVides = true
  }
  //  Nettoyage du code mort (retour Thibaut 2026-10-22, points 5 et 6
  //  de la revue des habitations) :
  //  · l'office « Grand veneur » (−5 Nourriture par habitation × rang
  //    de pays) n'a plus d'effet depuis la suppression de la
  //    consommation des rangs d'habitation (arbitrage vague 3b) : il
  //    est retiré du référentiel ET des configs existantes (convergées
  //    ou non — même patron que le retrait des constructions de
  //    faction). Idempotent. Un éventuel Grand veneur déjà nommé dans
  //    une partie en cours garde son badge mais n'a plus d'effet (il
  //    n'en avait déjà plus).
  //  · l'ancienne table rangsHabitation (doublon historique de
  //    typesHabitation, vague 3b) n'est plus lue nulle part : la clé
  //    orpheline des configs sauvegardées n'est plus persistée.
  delete (merged as { rangsHabitation?: unknown }).rangsHabitation
  //  Nettoyage dette legacy (retour Thibaut 2026-10-23, revue
  //  structure/SOLID — « supprime ces vieilles dettes ») :
  //  · les métiers de base des rangs passent au format STRUCTURÉ
  //    `metiersBase` (métiers au singulier, même format que les
  //    `emplacements` des constructions) ; l'ancien TEXTE
  //    « metiersDisponibles » est converti une bonne fois pour toutes,
  //    même sur les configs déjà convergées, puis la clé disparaît ;
  //  · les tables pré-canonicalisation (batimentsVille,
  //    batimentsChateau, batimentsCouts, amenagements — doublées par
  //    la table canonique `constructions`) ne sont plus lues nulle
  //    part : leurs clés ne sont plus persistées (même patron que
  //    rangsHabitation).
  for (const h of merged.typesHabitation ?? []) {
    const ancien = (h as { metiersDisponibles?: unknown }).metiersDisponibles
    if (h.metiersBase === undefined) {
      h.metiersBase = typeof ancien === 'string'
        ? parseMetiersBaseTexte(ancien, merged.metiers.map((m) => m.metier))
        : DEFAULT_CONFIG.typesHabitation.find(
            (t) => t.type === h.type && t.rang === h.rang,
          )?.metiersBase ?? []
    }
    delete (h as { metiersDisponibles?: unknown }).metiersDisponibles
  }
  for (const cle of ['batimentsVille', 'batimentsChateau', 'batimentsCouts', 'amenagements'] as const) {
    delete (merged as unknown as Record<string, unknown>)[cle]
  }
  //  Simplification (retour Thibaut 2026-10-23 — santé ignorée) : la
  //  mécanique d'ÉDUCATION est retirée (labels d'éducation, événement
  //  « reçoit une éducation », contrainte par métier) — les écoles
  //  (ecoleRang) et les Professeurs RESTENT. La table educations et le
  //  champ education des métiers ne sont plus lus nulle part : ils ne
  //  sont plus persistés (même patron que rangsHabitation).
  delete (merged as { educations?: unknown }).educations
  for (const m of merged.metiers) delete (m as { education?: unknown }).education
  //  Simplification (retour Thibaut 2026-10-23 — santé ignorée) :
  //  bâtiments ET aménagements de rang d'habitation ≥ 2 retirés
  //  PROVISOIREMENT (« Rangs 2 et 3, tout sauf rang 1 »). Le
  //  référentiel ne les contient plus (41 entrées, toutes rang ≤ 1),
  //  mais une config MONDE sauvegardée avant les garde POUR TOUJOURS :
  //  la complétion (gardeFous) n'AJOUTE que les constructions du
  //  référentiel, elle ne RETIRE JAMAIS les disparues — d'où un
  //  « Moulin à vent » (rang 2) encore constructible dans une
  //  NOUVELLE partie (bug constaté par Thibaut 2026-10-23 : « je
  //  vois encore tous les bâtiments de rang 2+ »). Filtre
  //  inconditionnel, même patron que rangsHabitation : les entrées
  //  rangMinHabitation >= 2 disparaissent de toute config convergée,
  //  ancienne ou non. Idempotent. Pour RÉACTIVER plus tard les rangs
  //  2/3 : les ré-ajouter au référentiel ET retirer ce filtre.
  merged.constructions = (merged.constructions ?? []).filter(
    (c) => (c.rangMinHabitation ?? 0) < 2,
  )
  const resultat: Cfg = {
    p: merged.params,
    ressources: merged.ressources,
    metiers: merged.metiers,
    traits: merged.traits,
    cultures: merged.cultures,
    regimes: merged.regimes,
    offrandes: merged.offrandes,
    orientations: merged.orientations,
    genres: merged.genres,
    banquesNoms: merged.banquesNoms,
    peupleBanque: merged.peupleBanque,
    peuples: merged.peuples,
    batiments: merged.batiments,
    couleurs: migrerCouleurs(merged.couleurs),
    config: merged,
  }
  CACHE_CFG.set(c, resultat)
  return resultat
}

/** Deep-clone la config par défaut pour une nouvelle partie. */
export function cloneDefaultConfig(): GameConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
}
