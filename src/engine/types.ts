// ══════════════════════════════════════════════════════════════════════
//  CHASSE & PÊCHE — Types du moteur (portage TypeScript du VBA)
//  Colonnes de la table P_j → champs de Character
// ══════════════════════════════════════════════════════════════════════

export type Sexe = 'M' | 'F'
export type Statut = 'Sain' | 'Malade' | 'Enceinte' | 'Décédé'
// Le classeur utilise les formes au féminin ; les deux graphies sont admises.
export type Orientation =
  | 'Hétérosexuel' | 'Homosexuel' | 'Bisexuel' | 'Asexuel'
  | 'Hétérosexuelle' | 'Homosexuelle' | 'Bisexuelle' | 'Asexuelle'
export type Saison = 'Été' | 'Hiver'
export type TaxeNiveau = 'Faible' | 'Moyenne' | 'Forte'
export type Heredite = 'Masculine' | 'Féminine' | 'Parité'
export type RegleGenre = 'Aucune' | 'Masculine' | 'Féminine' | 'Culture'
export type Attribution = 'Manuelle' | 'Armée' | 'Aléatoire'

// ── Référentiels (tables du classeur → seeds éditables) ────────────────

export interface TraitDef {
  name: string
  weight: number
  description: string
  life_delta: number          // ±années sur AgeMax
  resurrection_min_roll: number // seuil 1d6 : ≥ seuil → +2d6 ans (0 = désactivé)
  fert_add: number             // ajouté au multiplicateur de fécondité du couple
  heritable: boolean
  marriage_mod: number         // modificateur de probabilité de mariage
}

export interface MetierDef {
  metier: string
  valeur1: number              // gain par tour
  ressource1: string           // ressource du gain 1
  valeur2: number
  ressource2: string
  description: string
  nobleSeul: boolean
  regleGenre: RegleGenre
  attribution: Attribution
  /** Capacité maximale par ville (rework habitants 2026-10-20, vague 3b) :
   *  absent = illimité. Vague 3b : la cap de base d'un métier vient du RANG
   *  d'habitation (colonne « Métiers disponibles »), les emplacements des
   *  bâtiments s'y AJOUTENT ; les paramètres capMetierChasseur* sont
   *  supprimés. */
  capParVille?: number
  /** Production UNIQUEMENT pendant l'été (vague 3a — ex. Fermier
   *  « +5 Nourriture par tour en été ») : les gains valeur1/ressource1 et
   *  valeur2/ressource2 ne sont crédités qu'en saison d'Été. */
  ete?: boolean
}

export interface CultureDef {
  nom: string
  heredite: Heredite
  homoAutorisee: boolean
  fertFactor: number
}

export interface PeupleDef {
  nom: string
  noms: string[]        // noms de famille (→ dynasties)
  prenomsM: string[]
  prenomsF: string[]
}

export interface BuildingDef {
  nom: string
  categorie: 'Santé' | 'Éducation' | 'Économie' | 'Culture'
  ecoleRang: number                 // 1=élémentaire, 2=intermédiaire, 3=supérieure
  malContraction: number            // modificateur proba contracter maladie
  bonusGuerison: number             // modificateur proba guérison (local)
  bonusGuerisonGlobal: number       // ex. Guilde des Médecins
  effet: string                    // description lisible
}

// (EventDef et DynastieDef retirés le 2026-10-24 avec les tables
//  events/dynasties du référentiel, retour arbitre Thibaut — les
//  événements de saison (été/hiver) et les cartes dynastie tirées à
//  chaque tour n'existent plus. Ne pas confondre avec
//  Character.dynastie, le NOM DE FAMILLE du personnage, qui reste.)

// ── Entités de jeu ─────────────────────────────────────────────────────

export interface Character {
  id: string
  nom: string
  prenom: string
  dynastie: string
  sexe: Sexe
  age: number
  culture: string
  ville: string
  orientation: Orientation
  traits: [string, string, string]
  statut: Statut
  mariage: string | null      // nom complet du conjoint (AFFICHAGE)
  mere: string | null         // nom complet (AFFICHAGE)
  pere: string | null
  pereBio: string | null      // père biologique en cas d'adultère (AFFICHAGE)
  // M1 (audit 2026-10-19, arbitrage Thibaut « ids purs ») : l'IDENTITÉ
  //  démographique passe aux ids — à 16 000 habitants, les collisions de
  //  noms complets (générateurs à listes finies) donnaient un mauvais
  //  conjoint au veuvage et une mauvaise filiation. Les champs nommés
  //  ci-dessus restent pour l'AFFICHAGE ; chaque site de mutation tient
  //  les DEUX ; toute résolution (veuvage, filiation, consanguinité,
  //  arbre généalogique) passe par les ids. Arbitrage explicite : les
  //  vieilles sauvegardes sans ids ne sont PAS rattrapées (elles n'ont
  //  plus lieu d'exister) — leurs relations tombent à null au chargement.
  mariageId: string | null
  mereId: string | null
  pereId: string | null
  pereBioId: string | null
  enfantBatard: boolean
  /** femme enceinte ayant contracté la maladie : elle accouchera,
   *  puis mourra de la maladie (règle simplifiée « malade ou sain »). */
  enceinteMalade?: boolean
  /** Métier du personnage (rework habitants 2026-10-20) : l'ancien champ
   *  `titre` devient `metier` — les rôles de cour (Dirigeant, Héritier,
   *  Gouverneur…) vivent DANS le champ métier. null = Sans-
   *  emploi : NEUTRE, aucun effet au plateau, impôt nul. */
  metier: string | null
  /** Domicile du personnage (rework habitants 2026-10-20, vague 2 UI) :
   *  null = sans domicile. Rempli par l'attribution aux foyers
   *  (vague C, engine/domiciles.ts). Champ optionnel : absent des
   *  états migrés (compressé quand null). */
  domicile?: string | null
  /** PRESTIGE du personnage (vague D ascension sociale, 2026-10-24) :
   *  la trajectoire sociale de la FAMILLE. Calculé chaque fin de
   *  tour (statutSocial.ts) : sans emploi -2, sans domicile -2,
   *  malade -2, domicile +0/+4 selon le type, métier +2 bourgeois /
   *  +5 noble, +1 si bonheur de la ville > 50. À l'âge adulte, un
   *  enfant HÉRITE de 50 % du prestige moyen de ses parents. Rang
   *  DÉRIVÉ : 0-100 roturier, 100-250 bourgeois, 250+ noble.
   *  Champ optionnel : absent des vieilles sauvegardes → 0
   *  (l'héritage des nouvelles générations fera le reste). */
  prestige?: number
  /** Héritage de prestige DÉJÀ JOUÉ (vague D) : valeur reçue à
   *  l'âge adulte (50 % du prestige moyen des parents). Champ
   *  marqueur : présent = héritage fait, jamais rejoué. */
  prestigeHerite?: number
  fecondite: number
  armee: string | null        // nom de l'armée de rattachement
}

/** Ligne « Autres » d'une ville (feuille J{n}, bloc « Autres » du classeur) :
 *  production additionnelle hors bâtiments et aménagements — par exemple
 *  « Nourriture | Rivière | 1 | 12 » crédite 12 Nourriture par tour. */
export interface AutreDef {
  /** ressource produite */
  ressource: string
  /** origine libre (Capital, Rivière, Cité L, Régime…) —
   *  (RETRAIT 2026-10-24 : l'origine « Progrès » n'est plus produite,
   *  système de progrès supprimé ; les vieilles valeurs restent
   *  affichables sans effet moteur.) */
  source: string
  /** multiplicateur/nombre d'occurrences */
  nombre: number
  /** production par occurrence */
  bonus: number
}

/** Ligne de la table « types d'habitation » (feuille Ville du classeur) :
 *  chaque ville est de type Ville (Hameau → Cité → Grande Cité) ou
 *  Château (Motte → Donjon → Forteresse). Chaque rang a un coût
 *  d'amélioration, un nombre d'habitants requis, les métiers
 *  disponibles à la base (ex. « 50 Chasseurs, 2 Gardes, 1 Commerçant,
 *  1 Gouverneur » — cap de BASE du rang, vague 3b) et les domiciles
 *  disponibles (affichage seul pour l'instant). Arbitrage vague 3b
 *  (2026-10-22) : plus NI consommation par tour NI garnison de base
 *  — les Garnisons viennent des Gardes en poste. Table paramétrable
 *  dans les Référentiels → « Habitations ». */
export interface HabitationDef {
  /** « Ville » ou « Château » */
  type: string
  /** nom du rang (Hameau, Cité, Grande Cité, Motte, Donjon, Forteresse) */
  rang: string
  cout: string
  habitantsRequis: number
  /** métiers disponibles à la base du rang, format STRUCTURÉ (retour
   *  Thibaut 2026-10-23, formats unifiés : métiers TOUJOURS AU
   *  SINGULIER, même format que les `emplacements` des constructions ;
   *  l'ancien TEXTE « metiersDisponibles » est converti une bonne fois
   *  pour toutes par la migration ciblée de cfgOf). */
  metiersBase: Array<{ metier: string; places: number }>
  /** domiciles disponibles, ex. « 50 maisons, 10 Auberge » — TEXTE
   *  HISTORIQUE conservé pour l'affichage de repli ; la donnée
   *  vit désormais dans `domicilesRang` (vague A, 2026-10-24). */
  domicilesDisponibles: string
  /** domiciles du rang au format STRUCTURÉ (vague A, design
   *  domiciles 2026-10-24) : [{domicile: 'Maison', nombre: 50}, …].
   *  Champ optionnel : absent des vieilles configs → parsé de
   *  `domicilesDisponibles` par les garde-fous de cfgOf. */
  domicilesRang?: Array<{ domicile: string; nombre: number }>
}

/** Type de domicile (table `domiciles` du référentiel — vague A,
 *  design domiciles/ascension 2026-10-24) : nom + qualité 1-5.
 *  SIMPLE par arbitrage : pas de capacité ni coût (les bâtiments
 *  constructibles viendront plus tard). Unité « 1 personne =
 *  1 maison » (arbitrage final 2026-10-24 — cf. engine/domiciles.ts
 *  pour les deux échelles foyer/habitant). */
export interface DomicileDef {
  domicile: string
  /** confort objectif du domicile, échelle 1 (précaire) → 5 (noble) */
  qualite: number
}

export interface City {
  nom: string
  culture: string
  /** Type d'habitation : Ville (Hameau → Cité → Grande Cité) ou
   *  Château (Motte → Donjon → Forteresse) — feuille « Ville » du
   *  classeur. Champ optionnel : absent des vieilles sauvegardes →
   *  « Ville ». Détermine l'échelle des rangs, la consommation par
   *  tour et la garnison de base (table typesHabitation). */
  type?: string
  taxes: TaxeNiveau
  /** Proximité de la ville (marqueur (y), retour Thibaut 2026-10-15) :
   *  « Plaine » (aucun bonus), « Rivière » (+proxRiviereNourriture
   *  Nourriture/tour) ou « Mer » (+proxMerNourriture Nourriture/tour) —
   *  bonus automatique à chaque fin de tour (canal « Proximité » du
   *  récap). Champ optionnel : absent des vieilles sauvegardes →
   *  « Plaine » (aucun bonus). */
  proximite?: string
  /** Rang d'habitation (Hameau / Cité / Grande Cité / Motte / Donjon /
   *  Forteresse — table typesHabitation du référentiel). Champ
   *  optionnel : absent des vieilles sauvegardes → « Hameau ».
   *  Utilisé par la garnison des habitations (loi Autoritarisme) et
   *  l'affichage page « Pays ». */
  rang?: string
  /** STOCK de domiciles de la ville (vague A/C, design domiciles
   *  2026-10-24) : [{domicile: 'Maison', nombre: 50}, …] — l'offre
   *  de logements du rang (initStockVille à la création/changement
   *  de rang ; complété par normaliserEtat pour les vieilles
   *  sauvegardes). 1 domicile = 1 logement (1 foyer). Champ
   *  optionnel : absent → []. */
  domiciles?: Array<{ domicile: string; nombre: number }>
  batiments: string[]
  /** Aménagements de terrain (Baleinier, Champ, Mine d'Or… — feuille
   *  « Aménagements » du classeur). Champ optionnel : absent des
   *  vieilles sauvegardes → traité comme une liste vide. */
  amenagements?: string[]
  /** Lignes « Autres » (production additionnelle : ressource, source,
   *  nombre, bonus — prod = nombre × bonus). Champ optionnel : absent
   *  des vieilles sauvegardes → traité comme une liste vide. */
  autres?: AutreDef[]
}

export interface Army {
  nom: string
  puissanceCible: number
  puissance: number
  commandant: string | null   // id du personnage
  soldats: string[]           // ids des personnages metier Soldat
  cible: string | null        // ville / joueur visé
}

/** Cité libre : habitation sans joueur (règle « Cités libres » du
 *  référentiel). Champ optionnel de GameState : absent des vieilles
 *  sauvegardes → traité comme une liste vide.
 *  La cité possède sa propre population (habitants titrés — les
 *  Chasseurs y produisent le DOUBLE de Nourriture) ; lorsqu'un joueur
 *  devient son suzerain (3 émissaires — plateau), elle lui verse ses
 *  taxes à chaque fin de tour (canal « Cités libres » du récap). */
export interface CiteLibre {
  nom: string
  /** Type de la cité (table citesLibres du référentiel : Industrielles -
   *  Ville, Maritime - Ville, Militaires - Château, Économique - Château). */
  type: string
  /** Culture des habitants de la cité. */
  culture?: string
  /** Niveau de taxes de la cité (module TOUTES les ressources produites
   *  par ses habitants, comme pour une ville de joueur). */
  taxes?: TaxeNiveau
  /** Type d'habitation de la cité (retour Thibaut 2026-10-14) : Hameau
   *  (rural) ou Château (fortifié), tiré AU HASARD à la création de la
   *  partie. La règle du référentiel dit que la cité « change de niveau
   *  d'habitation dès qu'un joueur entre dans une nouvelle ère » — suivi
   *  au plateau. Champ optionnel : vieilles sauvegardes → null. */
  habitation?: 'Hameau' | 'Château' | null
  /** N° du joueur suzerain de la cité (3 émissaires — plateau), sinon null. */
  suzerain?: number | null
  /** Émissaires gagnés par chaque joueur auprès de la cité (clé = n° de
   *  joueur) — suivi manuel des tentatives d'émissaires au plateau
   *  (l'ancienne « Influence », remplacée par les émissaires, a été
   *  purgée du référentiel le 2026-10-24). */
  emissaires?: Record<number, number>
  /** Population de la cité (habitants — metier Chasseur par défaut). */
  population?: Character[]
}

/** Route commerciale DISSOCIÉE (vague 3b, arbitrage Thibaut
 *  2026-10-24 « on peut passer à la vague 3b ») : ouverte par
 *  le joueur (gratuit — arbitrage), indépendamment de tout personnage,
 *  elle relie une ville d'ORIGINE du joueur à la ville d'un AUTRE
 *  joueur ou à une CITÉ LIBRE (arbitrage). Effets : le joueur à
 *  l'origine COPIE exactement UN aménagement de la ville ciblée —
 *  sa production ET ses emplacements de population (matérialisés dans
 *  la ville d'origine). Une route vers une CITÉ LIBRE ne copie rien :
 *  elle octroie +1 émissaire auprès de la cité TANT QUE LA ROUTE EST
 *  ACTIVE (arbitrage Thibaut 2026-10-24 « suppression du métier de
 *  Marchand »). L'ancien bonus d'Or passif (marchandOrTour) a
 *  disparu avec la vague 3b, puis le MÉTIER DE MARCHAND lui-même a
 *  été RETIRÉ du jeu le 2026-10-24 (arbitrage Thibaut : « supprime
 *  carrément le métier de marchand ») : les routes n'ouvrent plus
 *  aucun emplacement de Marchand. Fermeture : bouton ✕ du seul
 *  joueur à l'ORIGINE (arbitrage) + nettoyage automatique
 *  (ville/aménagement disparus).
 *  HISTORIQUE (règle 9) : l'ancien modèle « un marchand tient la
 *  route » (champ marchandId) a été retiré le 2026-10-24 ; les
 *  routes des anciennes sauvegardes sont SUPPRIMÉES à la migration
 *  (arbitrage Thibaut : « à rouvrir manuellement ») — elles portent
 *  encore marchandId et sont ignorées puis purgées par
 *  nettoyerRoutesCommerce (engine/commerce.ts).
 *  Champ optionnel de GameState : absent des vieilles sauvegardes → []. */
export interface RouteCommerce {
  id: string
  /** N° du joueur à l'ORIGINE de la route (encaisse la copie). */
  joueur: number
  /** Ville d'origine chez le joueur (reçoit les emplacements de
   *  l'aménagement copié). */
  villeOrigine: string
  /** N° du joueur propriétaire de la ville ciblée — null si la
   *  cible est une cité libre. */
  joueurCible: number | null
  /** Nom de la CITÉ LIBRE ciblée (uniquement si joueurCible === null). */
  citeCible?: string | null
  /** Ville ciblée (une ville de joueurCible, ou le nom de la cité). */
  villeCible: string
  /** Aménagement copié (présent dans la ville ciblée) — ENTIER
   *  (marqueur (u) : production + emplacements de population) ;
   *  null pour une cité libre (rien à copier). */
  amenagement: string | null
  /** CLÉS OBSOLÈTES des anciens modèles, jamais lues : marchandId
   *  (marchand titulaire, retiré le 2026-10-24) et ressource
   *  (marqueur (u)). Conservées OPTIONNELLES pour que les vieilles
   *  sauvegardes restent chargeables telles quelles (les routes
   *  anciennes sont purgées par nettoyerRoutesCommerce). */
  marchandId?: string
  ressource?: string
}

export interface ResourceState {
  stock: number
  prod: number
}

export interface PlayerRecap {
  conceptions: Record<string, number>
  naissances: Record<string, number>
  deces: Record<string, number>
  decesMaladie: number
  mariagesNobles: Record<string, number>
  conversions: Record<string, number>
  metiersAttribues: Record<string, number>
  crises: string[]
  commandantTombe: string | null
}

export interface Player {
  n: number                 // 1..8
  nom: string
  peuple: string
  culture: string
  regime: string
  /** Émissaires disponibles (revue 2026-10-15) : ressource du joueur,
   *  dépensés dans les cités libres (1 émissaire placé = 1 de moins
   *  ici). Champ optionnel : 0 par défaut. */
  emissaires?: number
  /** Notes libres du joueur (retour Thibaut 2026-10-15) : pense-bête
   *  affiché en bas de l'onglet Pays. Champ optionnel. */
  notes?: string
  /** Stratégies militaires I : la prochaine levée d'armée coûte 50 Or de
   *  moins (flag consommé à la première levée — revue 2026-10-15). */
  prochaineArmeeReduite?: boolean
  resources: Record<string, ResourceState> // clés = RESOURCES
  villes: City[]
  /** Carte dynastie courante — RETIRÉE le 2026-10-24 (retour arbitre :
   *  suppression des événements de dynastie). Champ conservé
   *  OPTIONNEL uniquement pour que les VIEILLES sauvegardes qui le
   *  portent restent chargées sans erreur ; plus aucun producteur
   *  ni lecteur. */
  dynastie?: { nom: string; description: string } | null
  armees: Army[]
  recap: PlayerRecap | null
  /** Rang de pays (feuille « Pays » du classeur) : Baronnie, Comté, … Commune.
   *  Champ optionnel : absent des vieilles sauvegardes → valeur par défaut
   *  dérivée du régime politique (voir rangParDefaut dans setup.ts). */
  rang?: string
  /** Vassalité : n° du suzerain si ce joueur lui a prêté serment, sinon null.
   *  Un vassal reverse chaque tour une part des revenus de ses habitants
   *  (paramètre vassalPrelevement) à son suzerain. */
  vassalDe?: number | null
  /** (RETRAIT 2026-10-24, retour arbitre : le système de progrès a
   *  été supprimé du jeu — arbres, déblocages, effets, onglet
   *  « Progrès ». Le champ (clés `<indexArbre>:<slot>` des techs
   *  débloquées) devient optionnel SANS effet : plus lu nulle part,
   *  il reste uniquement pour que les vieilles sauvegardes
   *  s'ouvrent sans crash.) */
  progresDebloques?: string[]
  /** Lauriers de victoire validés (refonte 2026-10-14) : clé = nom de la
   *  voie (table victoires du référentiel), valeur = nombre de Lauriers
   *  validés 0-4, en ORDRE STRICT (un Laurier ne se valide que si le
   *  précédent est acquis — cocherLaurier dans engine/victory.ts,
   *  cochage manuel au radar de l'accueil ; crise à chaque Laurier
   *  I-III validé, Laurier IV = victoire). Champ optionnel : absent
   *  des vieilles sauvegardes → aucun Laurier validé. */
  lauriers?: Record<string, number>
}

export interface LogEntry {
  turn: number
  /** 'Événement' et 'Dynastie' ne sont PLUS PRODUITS depuis le
   *  2026-10-24 (suppression des événements de saison et des cartes
   *  dynastie, retour arbitre) — les valeurs restent dans l'union
   *  pour que les logs des vieilles sauvegardes s'affichent. */
  type: 'Événement' | 'Dynastie' | 'Crise' | 'Naissance' | 'Décès' | 'Mariage' | 'Métier' | 'Titre' | 'Armée' | 'Culture' | 'Commerce' | 'Système' | 'Conflit'
  joueur: number | null
  texte: string
}

/** Apports d'un tour, canal par canal (récap ressources du joueur).
 *  (Historique : les événements de saison et cartes dynastie y
 *  figuraient au journal du tour — retirés le 2026-10-24.) */
export interface ApportsTour {
  /** production de base du pays (nourriture générale : jamais doublée) */
  production: Record<string, number>
  /** effets automatiques des bâtiments (engine/batiments.ts) */
  batiments: Record<string, number>
  /** effets des aménagements de terrain (engine/amenagements.ts),
   *  HORS production d'été. Champ optionnel : absent des historiques
   *  d'avant l'ajout des aménagements. */
  amenagements?: Record<string, number>
  /** nourriture d'ÉTÉ (ligne « Nourr - été » du classeur : aménagements
   *  Champ/Rizière + lignes « Autres » « Nourr - été ») — créditée au
   *  stock de Nourriture uniquement pendant l'été (0 sinon).
   *  Champ optionnel : absent des historiques d'avant le canal. */
  nourrEte?: Record<string, number>
  /** lignes « Autres » des villes (ressource × nombre × bonus — engine/autres.ts).
   *  Champ optionnel : absent des historiques d'avant l'ajout de la catégorie. */
  autres?: Record<string, number>
  /** gains d'habitants (métiers, taxes) après coefficient gainsCrediteStock, hors tribut */
  population: Record<string, number>
  /** tribut de vassalité net (négatif = payé, positif = reçu) */
  vassalite: Record<string, number>
  /** lois chiffrées des régimes politiques & cultures (engine/regimes.ts) —
   *  garnison de la loi du régime, bonus de capitale de la culture, etc.
   *  Champ optionnel : absent des historiques d'avant l'ajout du canal. */
  regimesCultures?: Record<string, number>
  /** (RETRAIT 2026-10-22, nettoyage du code mort : le canal
   *  « habitations » — consommation des rangs d'habitation, vide
   *  depuis l'arbitrage vague 3b — n'est plus écrit ; la clé
   *  orpheline des vieux historiques est simplement ignorée.) */
  /** (RETRAIT 2026-10-24, retour arbitre : le canal « Progrès » —
   *  effets par tour des technologies débloquées — n'est plus écrit
   *  (système de progrès supprimé). La clé orpheline des vieux
   *  historiques est simplement ignorée.) */
  progres?: Record<string, number>
  /** taxes reçues des cités libres sous suzeraineté du joueur
   *  (engine/citesLibres.ts — étape 3decies). Champ optionnel : absent
   *  des historiques d'avant l'ajout du canal. */
  citesLibres?: Record<string, number>
  /** routes commerciales dissociées (engine/commerce.ts — étape
   *  3terdecies : copie de la production de l'aménagement entier de
   *  la ville ciblée dans la ville d'origine ; l'Or passif
   *  marchandOrTour a été retiré le 2026-10-24 — sous-vague 3b,
   *  arbitrage Thibaut). Champ optionnel : absent des historiques
   *  d'avant le canal. */
  commerce?: Record<string, number>
  /** bonus de proximité des villes (marqueur (y) : Rivière
   *  +proxRiviereNourriture, Mer +proxMerNourriture Nourriture/tour —
   *  engine/villes.ts). Champ optionnel : absent des historiques
   *  d'avant le canal. */
  proximite?: Record<string, number>
}

export interface HistoryRow {
  turn: number
  joueur: number
  stocks: Record<string, number>
  prods: Record<string, number>
  /** Apports du tour (champ optionnel : absent des vieilles sauvegardes). */
  apports?: ApportsTour
}

export interface GameSetup {
  joueurs: {
    nom: string
    peuple: string
    culture: string
    regime: string
    taillePopulation: number
    pourcentageMariages: number
    villes: string[]          // noms des villes
  }[]
}

export interface GameState {
  /** Configuration de la partie : référentiels + paramètres des formules.
   *  Absente des vieilles sauvegardes → complétée par cloneDefaultConfig().
   *  RÈGLE (2026-10-19) : la config est MONDIALE et unique (ligne
   *  '__config__' Supabase), éditable uniquement HORS partie ; les
   *  joueurs l'obtiennent en actualisant la page. Ce champ reste
   *  l'injection locale pour le moteur (les parties sérialisées
   *  l'embarquent pour la reprise hors-ligne). */
  config?: import('../config/defaultConfig').GameConfig
  version: number
  /** Version du schéma de sauvegarde (migrations versionnées — cf.
   *  engine/migrations.ts) : tampon des migrations déjà appliquées à
   *  CET état. Absent des anciennes sauvegardes → 0 (toutes jouées
   *  au chargement). Les états neufs naissent à SCHEMA_VERSION_ETAT. */
  schema?: number
  seed: number
  rngState: number
  turn: number                // numéro du tour en cours
  saison: Saison
  /** (modDanger RETIRÉ le 2026-10-24 avec les événements de saison —
   *  bonus permanent de dangerosité des tirages d'événement. Champ
   *  optionnel : les vieilles sauvegardes qui le portent restent
   *  chargées ; plus aucun lecteur.) */
  modDanger?: number
  players: Player[]
  population: Record<number, Character[]> // clé = n° joueur
  /** Cités libres de la partie (onglet « 🗼 Cités libres »). Champ
   *  optionnel : absent des vieilles sauvegardes → liste vide. */
  citesLibres?: CiteLibre[]
  /** Routes commerciales des marchands (marqueur (t), engine/commerce.ts).
   *  Champ optionnel : absent des vieilles sauvegardes → liste vide. */
  routesCommerce?: RouteCommerce[]
  log: LogEntry[]
  history: HistoryRow[]
}

// ── Voies de victoire (chapitre XII du livret) ─────────────────────────
//  Refonte 2026-10-14 : les Lauriers validés sont suivis dans
//  Player.lauriers (cochage manuel, ordre strict — engine/victory.ts).
//  L'ancienne interface VictoryStatus (auto-détection « domination »,
//  voie Dynastique fantôme) a été supprimée avec checkVictory.
