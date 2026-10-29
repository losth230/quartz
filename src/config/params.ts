// ══════════════════════════════════════════════════════════════════════
//  CHASSE & PÊCHE — Paramètres du moteur
//  Toutes les constantes et valeurs numériques des formules sont ici.
//  Elles sont modifiables à tout moment depuis l'onglet « Paramètres »
//  (n'importe qui peut les changer, aucune contrainte bloquante : les
//  valeurs restent des nombres libres, les stocks peuvent être négatifs).
// ══════════════════════════════════════════════════════════════════════

export interface GameParams {
  // ── Population ──
  adultAge: number
  setupAgeMax: number
  adulteryRate: number
  // (RETRAIT 2026-10-28, arbitrage Thibaut : la migration par
  //  scolarité est supprimée du moteur — plus aucun lecteur. Les
  //  3 paramètres ci-dessous sont conservés comme REFLIS de
  //  compatibilité, car les configs sauvegardées les portent.)
  /** (REFLI) Migration scolaire — plus aucun lecteur depuis le retrait. */
  migrationEcole: number
  /** (REFLI) …suzerain — plus aucun lecteur depuis le retrait. */
  migrationSuzerain: number
  /** (REFLI) …n'importe quel joueur — plus aucun lecteur. */
  migrationMonde: number
  /** (Arbitrage Thibaut 2026-10-28) Probabilité MAXIMALE de départ
   *  par le flux de migration par bonheur — atteinte à 0 de bonheur.
   *  Linéaire : p = migrationBonheurMax × (100 − bonheur) / 100
   *  (0 % à 100 de bonheur, défaut 10 % à 0). */
  migrationBonheurMax: number
  /** (Arbitrage Thibaut 2026-10-28, v2 au 3e retour du jour : ×1,25,
   *  le ×4 de la mise en place du matin est REMPLACÉ) Poids
   *  multiplicatif d'une ville candidate de SA culture dans le tirage
   *  pondéré de destination (se multiplie avec le facteur même joueur
   *  et l'attrait du bonheur, ×[1 ; 2]). */
  migrationBonheurCulture: number
  /** (Arbitrage Thibaut 2026-10-28, v2) Poids multiplicatif d'une ville
   *  candidate du MÊME JOUEUR que le migrant (migration interne
   *  privilégiée) dans le tirage pondéré de destination — se multiplie
   *  avec le facteur culture et l'attrait du bonheur. */
  migrationBonheurMemeJoueur: number
  /** (Arbitrage Thibaut 2026-10-29, 5e retour du flux de migration)
   *  Poids multiplicatif d'une ville candidate AUX POSTES NON
   *  POURVUS quand le migrant est SANS MÉTIER — attire les
   *  chômeurs vers les villes qui embauchent. Se multiplie avec
   *  les facteurs v2 (même joueur, culture, bonheur) et le
   *  facteur logement. */
  migrationBonheurEmploi: number
  /** (Arbitrage Thibaut 2026-10-29, 5e retour du flux de migration)
   *  Poids multiplicatif d'une ville candidate AUX LITS LIBRES
   *  quand le migrant est SANS DOMICILE — attire les
   *  sans-logement vers les villes qui logent. Se multiplie avec
   *  les facteurs v2 et le facteur emploi. */
  migrationBonheurLogement: number
  consoNourrParHab: number
  /** (Arbitrage Thibaut 2026-10-26, RANG SOCIAL : prestige ≥ 100) —
   *  un bourgeois vivant consomme consoNourrBourgeois Nourriture
   *  par tour (au lieu de consoNourrParHab). */
  consoNourrBourgeois: number
  /** (Arbitrage Thibaut 2026-10-26, RANG SOCIAL : prestige ≥ 250) —
   *  un noble vivant consomme consoNourrNoble Nourriture par tour. */
  consoNourrNoble: number
  /** (Arbitrage Thibaut 2026-10-26) — multiplicateur de production
   *  du villageois selon son rang social : bourgeois ×prodMultBourgeois
   *  (1,5), noble ×prodMultNoble (1 — le ×1,5 est RETIRÉ des nobles,
   *  arbitrage corrigé du jour même : ils consomment 4 Nourriture),
   *  roturier ×1. */
  prodMultBourgeois: number
  prodMultNoble: number
  gainsCrediteStock: number  // 1 = les gains de population créditent le stock
  // ── Fécondité ──
  fertBaseRate: number
  fertSingleFactor: number
  fertTwinsRate: number
  fertTripletsRate: number
  fertTraitFactorMin: number
  fertTraitFactorMax: number
  cultureFertBase: number
  // ── Maladie (rework habitants 2026-10-20 : Gompertz, plus d'âge-
  //    plafond — la maladie est la SEULE cause de mort) ──
  /** Probabilité de contracter la maladie ce tour :
   *  maladieBase × exp(maladiePente × âge)
   *  (RETRAIT du plafond maladieCap, retour arbitre 2026-10-25 :
   *  la courbe Gompertz monte sans borne — à très grand âge le
   *  risque tend vers 1 ; retrait AUSSI du surrisque des grossesses
   *  modMaladieEnceinte : les femmes enceintes contractent comme
   *  les autres).
   *  calibrée Monte-Carlo pour une espérance de vie ≈ 60 ans. */
  maladieBase: number
  maladiePente: number
  // (RETRAITS 2026-10-25, retour arbitre : plus de maladieCap, plus
  //  de modMaladieEnceinte — clés purgées des configs par cfgOf)
  /** Modificateur de contraction pour une femme enceinte. */
  /** Guérison par tour d'un malade : probaGuerison − modGuerisonAge × âge
   *  (un malade qui re-contracte la maladie meurt). */
  probaGuerison: number
  modGuerisonAge: number
  /** GUÉRISSEUR (métier, 2026-10-25) : par Guérisseur en poste
   *  dans la ville — bonus de guérison et réduction du risque de
   *  contracter (fiche arbitre : +2 % / −2 % ; cumulables si
   *  plusieurs Guérisseurs, ex. 2 Herboristeries). */
  guerisseurGuerison: number
  guerisseurContraction: number
  // ── Métiers (caps par habitation, rework habitants 2026-10-20) ──
  /** Capacité maximale de Chasseurs dans une habitation « Ville »
   *  (arbitre 2026-10-20 : caps séparées selon le type). */
  /** Capacité maximale de Chasseurs dans un « Château ». */
  /** Garnison STATIQUE accordée par un Garde en poste (vague 3a :
   *  « la Garnison n'est jamais par tour » — valeur d'état de la ville,
   *  retirée si le Garde part ou meurt). */
  garnisonParGarde: number
  // ── Professeurs ──
  professeurBaseChance: number
  // ── Mariage ──
  mariageRoturiers: number
  mariageNobles: number
  mariageMesalliance: number
  mariageBonusMetier: number
  mariageMemeCulture: number
  /** Bonus de probabilité de mariage pour deux personnages de MÊME
   *  RANG SOCIAL (vague E statut social, arbitrage Thibaut
   *  2026-10-24 : « les mariages sont LIBRES avec bonus pour des
   *  personnages de conditions similaires »). Les unions restent
   *  possibles entre conditions (pas d'interdiction) — le bonus
   *  favorise simplement les mariages de même milieu. */
  mariageMemeRang: number
  mariageAutreCulture: number
  mariageParAnEcart: number
  mariageTraitMax: number
  mariagePlafond: number
  mariagePlancher: number
  mariageBatard: number
  mariageDeuxBatards: number
  // ── Héritage des traits ──
  traitHeriteParEssai: number
  traitHeriteEssais: number
  traitTirageSlot: number
  // ── Conversion culturelle ──
  conversionProba: number
  conversionPoidsLocal: number
  conversionMemeCulture: number
  // ── Taxes ──
  taxOrFaibles: number
  taxOrHautes: number
  taxNourrFaibles: number
  taxNourrHautes: number
  taxNaissFaibles: number
  taxNaissHautes: number
  // ── Armées ──
  // (Arbitrage Thibaut 2026-10-28 : « général et soldat sont des
  //  métiers, ils doivent donc vivre dans la banque » — les
  //  PUISSANCES d'armée et les ÂGES de recrutement vivent désormais
  //  sur les LIGNES DE MÉTIER du référentiel (champs
  //  puissanceArmee / ageMin / ageMax). Les 4 paramètres
  //  ci-dessous sont conservés comme REFLIS de compatibilité — lus
  //  uniquement si la ligne de métier ne porte pas le champ (config
  //  éditée antérieure à la migration armeesBanque2026) et SEMÉS
  //  sur les lignes par la migration pour préserver toute
  //  personnalisation ; plus éditables dans l'onglet Paramètres.)
  puissanceGeneral: number
  puissanceSoldat: number
  soldatAgeMin: number
  soldatAgeMax: number
  /** Prix de levée d'une armée : Or par tranche de armeePriXPuissance points de force. */
  armeePrixOr: number
  /** Prix de levée : taille de la tranche de points de force facturée. */
  armeePriXPuissance: number
  /** ANCIEN plafond d'armées — OBSOLÈTE (retour joueur 2026-10-18 :
   *  plus aucun hardcap d'armées). Champ conservé pour la compatibilité
   *  des sauvegardes existantes, mais ignoré par le moteur et l'UI. */
  maxArmees: number
  /** Nombre maximal de ROUTES commerciales par joueur (sous-vague 3b
   *  2026-10-24 : compte les routes détenues — plus les marchands, le
   *  métier de Marchand a été RETIRÉ du jeu le 2026-10-24 (arbitrage
   *  Thibaut) ; retour Thibaut : 0 par défaut, les techs qui en
   *  octroyaient ont été supprimées le 2026-10-24 avec le système
   *  de progrès). */
  maxMarchands: number
  // ── Vassaux ──
  vassalPrelevement: number  // part des revenus d'habitants (Or) reversée au suzerain
  // ── Commerce (marqueur (t)) ──
  // (marchandOrTour retiré le 2026-10-24, sous-vague 3b « routes
  //  dissociées », arbitrage Thibaut : les routes ne rapportent plus
  //  d'Or passif — seul effet du propriétaire : la copie de
  //  l'aménagement visé, cf. engine/commerce.ts)
  // ── Noms des entités système (chaînes) ──
  metierDirigeant: string
  metierGouverneur: string
  metierProfesseur: string
  metierChasseur: string
  metierSoldat: string
  metierCommandant: string
  metierGarde: string
  metierBanquier: string
  metierTroubadour: string
  traitBatard: string
  traitConsanguin: string
  traitObstine: string
  dynastieRoturier: string
  // ── Système ──
  maxLog: number
  maxHistory: number
  saisonLongueur: number
  // (evMult* / dangerSeuil* retirés le 2026-10-24 avec les événements
  //  de saison, retour arbitre — multiplicateurs de niveau et seuils
  //  de dangerosité du tirage d'événement, plus aucun lecteur)
  proxRiviereNourriture: number
  proxMerNourriture: number
}

export const DEFAULT_PARAMS: GameParams = {
  adultAge: 16,
  setupAgeMax: 50,
  adulteryRate: 0.03,
  // (REFLI — retrait migration scolaire 2026-10-28, cf. interface)
  migrationEcole: 0.10,
  migrationSuzerain: 0.02,
  migrationMonde: 0.01,
  // (Arbitrage Thibaut 2026-10-28 — flux de migration par bonheur)
  migrationBonheurMax: 0.10,
  migrationBonheurCulture: 1.25,
  migrationBonheurMemeJoueur: 1.5,
  // (Arbitrage Thibaut 2026-10-29 — facteurs emploi & logement)
  migrationBonheurEmploi: 1.5,
  migrationBonheurLogement: 1.5,
  consoNourrParHab: 1,
  consoNourrBourgeois: 2,
  consoNourrNoble: 4,
  prodMultBourgeois: 1.5,
  prodMultNoble: 1,
  gainsCrediteStock: 1,
  fertBaseRate: 1.5,
  fertSingleFactor: 0.1,
  fertTwinsRate: 0.05,
  fertTripletsRate: 0.001,
  fertTraitFactorMin: 0,
  fertTraitFactorMax: 1.6,
  cultureFertBase: 1,
  maladieBase: 0.0025,
  maladiePente: 0.08,
  // (RETRAIT 2026-10-25 : maladieCap et modMaladieEnceinte supprimés)
  probaGuerison: 0.25,
  guerisseurGuerison: 0.02,
  guerisseurContraction: 0.02,
  modGuerisonAge: 0.003,
  garnisonParGarde: 10,
  professeurBaseChance: 0.9,
  mariageRoturiers: 0.3,
  mariageNobles: 0.15,
  mariageMesalliance: 0.03,
  mariageBonusMetier: 0.1,
  mariageMemeCulture: 0.1,
  mariageMemeRang: 0.1,
  mariageAutreCulture: -0.1,
  mariageParAnEcart: 0.005,
  mariageTraitMax: 0.2,
  mariagePlafond: 0.9,
  mariagePlancher: 0.01,
  mariageBatard: -0.05,
  mariageDeuxBatards: 0.1,
  traitHeriteParEssai: 0.4,
  traitHeriteEssais: 3,
  traitTirageSlot: 0.3,
  conversionProba: 0.1,
  conversionPoidsLocal: 5,
  conversionMemeCulture: 5,
  // Effet des taxes Faibles/Fortes — ±25 % (retour Thibaut, marqueur
  //  (z) — avant ±50 % ; les configs existantes encore aux anciens
  //  défauts sont migrées ciblément par cfgOf, champ taxes25).
  // ARBITRAGE Thibaut 2026-10-28 « changement des taxes » : la
  //  Nourriture part du côté des NAISSANCES — Faible = naissances et
  //  Nourriture ×1,25 mais toutes les autres productions ×0,75 ;
  //  Forte = l'inverse ; Moyenne = ×1 partout. Les nouvelles clés
  //  taxNourr* reçoivent les défauts ci-dessous (mergeParams les pose
  //  sur les configs existantes, sans migration) ; les clés taxOr*
  //  changent de SENS — elles ne portent plus que les ressources hors
  //  Nourriture (valeurs inchangées, les configs sauvegardées restent
  //  valides telles quelles).
  taxOrFaibles: 0.75,
  taxOrHautes: 1.25,
  taxNourrFaibles: 1.25,
  taxNourrHautes: 0.75,
  taxNaissFaibles: 1.25,
  taxNaissHautes: 0.75,
  // Replis d'armée (arbitrage 2026-10-28 : les valeurs vivent sur
  //  les lignes de métier Soldat / Commandant du référentiel).
  puissanceGeneral: 45,
  puissanceSoldat: 15,
  soldatAgeMin: 16,
  soldatAgeMax: 30,
  armeePrixOr: 1,
  armeePriXPuissance: 2,
  maxArmees: 2,
  maxMarchands: 0,
  vassalPrelevement: 0.5,
  proxRiviereNourriture: 12,
  proxMerNourriture: 7,
  metierDirigeant: 'Dirigeant',
  metierGouverneur: 'Gouverneur',
  metierProfesseur: 'Professeur',
  metierChasseur: 'Chasseur',
  metierSoldat: 'Soldat',
  metierCommandant: 'Commandant',
  metierGarde: 'Garde',
  metierBanquier: 'Banquier',
  metierTroubadour: 'Troubadour',
  traitBatard: 'Bâtard',
  traitConsanguin: 'Consanguin',
  traitObstine: 'Obstiné',
  dynastieRoturier: 'Roturier',
  maxLog: 4000,
  maxHistory: 120,
  saisonLongueur: 3,
}

// champs texte (éditables aussi) — gérés sépartement pour l'UI
export interface GameParamStrings {
  metierHeritierStr: string
}
export const DEFAULT_PARAM_STRINGS: GameParamStrings = {
  metierHeritierStr: 'Héritier',
}

/** Groupes + libellés pour l'éditeur de l'onglet Paramètres. */
export const PARAM_META: {
  key: keyof GameParams
  label: string
  groupe: string
  unite?: string
  aide?: string
}[] = [
  { key: 'adultAge', label: 'Âge adulte', groupe: 'Population', aide: 'Âge à partir duquel un personnage reçoit un métier et peut se marier.' },
  { key: 'adulteryRate', label: 'Taux d\'adultère', groupe: 'Population', unite: 'proba' },
  // (RETRAIT PARAM_META 2026-10-28, arbitrage Thibaut : la migration
  //  par scolarité est supprimée du moteur — les paramètres
  //  migrationEcole/Suzerain/Monde ne sont plus éditables ici et
  //  restent comme REFLIS de compatibilité. Remplacée le jour même
  //  par le flux de migration par BONHEUR ci-dessous.)
  { key: 'migrationBonheurMax', label: 'Migration par bonheur — proba de départ à bonheur 0', groupe: 'Population', unite: 'proba', aide: 'Linéaire : p = proba max × (100 − bonheur)/100 — 0 % à 100 de bonheur. Chaque habitant vivant (sauf Dirigeant/Héritier) peut quitter sa ville à chaque fin de tour, vers une ville du monde tirée au hasard pondéré (culture, bonheur).' },
  { key: 'migrationBonheurCulture', label: 'Migration par bonheur — poids d\'une ville de SA culture', groupe: 'Population', aide: 'Destination pondérée : ×N pour une ville de la culture du migrant (défaut 1,25 — retour du jour : le ×4 de la mise en place est remplacé), ×1,5 pour une ville du même joueur, ×(1 + bonheur/100) pour l\'attrait de la ville candidate. Les trois effets se multiplient.' },
  { key: 'migrationBonheurMemeJoueur', label: 'Migration par bonheur — poids d\'une ville du MÊME joueur', groupe: 'Population', aide: 'Destination pondérée (retour du jour) : ×N pour une ville du même joueur que le migrant (défaut 1,5 — la migration interne est privilégiée). Se multiplie avec le poids culture et l\'attrait du bonheur. NB : un migrant peut revenir vers une ville d\'où il vient (retour légitime).' },
  { key: 'migrationBonheurEmploi', label: 'Migration par bonheur — poids d\'une ville avec des EMPLOIS disponibles', groupe: 'Population', aide: 'Facteur d\'attrait (retour 2026-10-29) : un migrant SANS MÉTIER pèse ×N une ville candidate qui a des postes non pourvus (plus d\'offres que d\'adultes en poste). Se multiplie avec le même joueur, la culture, le bonheur et le facteur logement.' },
  { key: 'migrationBonheurLogement', label: 'Migration par bonheur — poids d\'une ville avec des LOGEMENTS disponibles', groupe: 'Population', aide: 'Facteur d\'attrait (retour 2026-10-29) : un migrant SANS DOMICILE pèse ×N une ville candidate qui a plus de lits que d\'habitants vivants. Se multiplie avec le même joueur, la culture, le bonheur et le facteur emploi.' },
  { key: 'consoNourrParHab', label: 'Consommation Nourriture / habitant vivant (roturier)', groupe: 'Population', aide: 'Base pour tout habitant vivant ; le bourgeois et le noble (rang social, prestige ≥ 100 / ≥ 250) consomment davantage.' },
  { key: 'consoNourrBourgeois', label: 'Consommation Nourriture / bourgeois vivant (rang)', groupe: 'Population', aide: 'Arbitrage 2026-10-26 : un bourgeois (prestige ≥ 100) consomme 2 Nourriture par tour mais produit ×1,5.' },
  { key: 'consoNourrNoble', label: 'Consommation Nourriture / noble vivant (rang)', groupe: 'Population', aide: 'Arbitrage 2026-10-26 : un noble (prestige ≥ 250) consomme 4 Nourriture par tour et produit ×1,5.' },
  { key: 'prodMultBourgeois', label: 'Multiplicateur de production des bourgeois (rang)', groupe: 'Population', aide: 'La production du métier d\u2019un bourgeois vivant est multipliée par cette valeur (avant les taxes).' },
  { key: 'prodMultNoble', label: 'Multiplicateur de production des nobles (rang)', groupe: 'Population', aide: 'CORRECTION du 2026-10-26 : le ×1,5 est retiré des nobles — ils consomment 4 Nourriture par tour et produisent ×1.' },
  { key: 'gainsCrediteStock', label: 'Gains de population crédités au stock (1 = oui)', groupe: 'Population' },
  { key: 'fertBaseRate', label: 'Fécondité de base (conception / tour)', groupe: 'Fécondité' },
  { key: 'fertSingleFactor', label: 'Facteur fécondité célibataire', groupe: 'Fécondité' },
  { key: 'fertTwinsRate', label: 'Proba jumeaux', groupe: 'Fécondité', unite: 'proba' },
  { key: 'fertTripletsRate', label: 'Proba triplés', groupe: 'Fécondité', unite: 'proba' },
  { key: 'fertTraitFactorMin', label: 'Facteur traits — plancher', groupe: 'Fécondité' },
  { key: 'fertTraitFactorMax', label: 'Facteur traits — plafond', groupe: 'Fécondité' },
  { key: 'cultureFertBase', label: 'Facteur fécondité culturel de base', groupe: 'Fécondité' },
  { key: 'maladieBase', label: 'Maladie — probabilité de base (Gompertz)', groupe: 'Maladie', unite: 'proba', aide: 'Rework 2026-10-20 : plus d\'âge-plafond — chaque tour, probabilité de contracter la maladie = min(cap, base × exp(pente × âge)) ; calibrée pour une espérance de vie ≈ 60 ans.' },
  { key: 'maladiePente', label: 'Maladie — pente (Gompertz)', groupe: 'Maladie' },
  // (RETRAIT 2026-10-25 : maladieCap et modMaladieEnceinte supprimés)
  { key: 'probaGuerison', label: 'Probabilité de guérison (base)', groupe: 'Maladie', unite: 'proba' },
  { key: 'guerisseurGuerison', label: 'Guérisseur — bonus de guérison par poste', groupe: 'Maladie', unite: 'proba' },
  { key: 'guerisseurContraction', label: 'Guérisseur — réduction de contraction par poste', groupe: 'Maladie', unite: 'proba' },
  { key: 'modGuerisonAge', label: 'Guérison — modificateur par année d\'âge', groupe: 'Maladie' },
  { key: 'garnisonParGarde', label: 'Garnison par Garde en poste', groupe: 'Métiers' },
  { key: 'professeurBaseChance', label: 'Chance de base d\'attribution Professeur', groupe: 'Éducation' },
  { key: 'mariageRoturiers', label: 'Proba mariage roturier × roturier', groupe: 'Mariage', unite: 'proba' },
  { key: 'mariageNobles', label: 'Proba mariage noble × noble', groupe: 'Mariage', unite: 'proba' },
  { key: 'mariageMesalliance', label: 'Proba mésalliance noble × roturier', groupe: 'Mariage', unite: 'proba' },
  { key: 'mariageBonusMetier', label: 'Bonus par époux avec métier (non-Chasseur)', groupe: 'Mariage' },
  { key: 'mariageMemeCulture', label: 'Bonus même culture', groupe: 'Mariage' },
  { key: 'mariageMemeRang', label: 'Bonus même rang social (roturier/bourgeois/noble)', groupe: 'Mariage' },
  { key: 'mariageAutreCulture', label: 'Malus culture différente', groupe: 'Mariage' },
  { key: 'mariageParAnEcart', label: 'Malus par année d\'écart d\'âge', groupe: 'Mariage' },
  { key: 'mariageTraitMax', label: 'Plafond des modificateurs de traits', groupe: 'Mariage' },
  { key: 'mariagePlafond', label: 'Probabilité maximale', groupe: 'Mariage' },
  { key: 'mariagePlancher', label: 'Probabilité minimale', groupe: 'Mariage' },
  { key: 'mariageBatard', label: 'Malus mariage par époux bâtard', groupe: 'Mariage' },
  { key: 'mariageDeuxBatards', label: 'Bonus si les deux époux sont bâtards', groupe: 'Mariage' },
  { key: 'setupAgeMax', label: 'Âge maximal d\'un personnage généré au setup', groupe: 'Population' },
  { key: 'traitHeriteParEssai', label: 'Proba d\'hériter d\'un trait parental (par essai)', groupe: 'Traits' },
  { key: 'traitHeriteEssais', label: 'Nombre d\'essais d\'héritage par trait', groupe: 'Traits' },
  { key: 'traitTirageSlot', label: 'Proba de tirage aléatoire par slot libre', groupe: 'Traits' },
  { key: 'conversionProba', label: 'Proba de tentative de conversion culturelle', groupe: 'Culture', unite: 'proba' },
  { key: 'conversionPoidsLocal', label: 'Poids des voisins de même culture', groupe: 'Culture' },
  { key: 'conversionMemeCulture', label: 'Poids de sa propre culture', groupe: 'Culture' },
  { key: 'taxNourrFaibles', label: 'Taxes faibles — multiplicateur Nourriture', groupe: 'Taxes' },
  { key: 'taxNourrHautes', label: 'Taxes fortes — multiplicateur Nourriture', groupe: 'Taxes' },
  { key: 'taxOrFaibles', label: 'Taxes faibles — multiplicateur autres ressources (hors Nourriture)', groupe: 'Taxes' },
  { key: 'taxOrHautes', label: 'Taxes fortes — multiplicateur autres ressources (hors Nourriture)', groupe: 'Taxes' },
  { key: 'taxNaissFaibles', label: 'Taxes faibles — multiplicateur naissances', groupe: 'Taxes' },
  { key: 'taxNaissHautes', label: 'Taxes fortes — multiplicateur naissances', groupe: 'Taxes' },
  { key: 'proxRiviereNourriture', label: 'Proximité rivière — Nourriture / tour', groupe: 'Villes', aide: 'Bonus automatique de chaque ville « au bord d\'une rivière » (marqueur (y)).' },
  { key: 'proxMerNourriture', label: 'Proximité mer — Nourriture / tour', groupe: 'Villes', aide: 'Bonus automatique de chaque ville « au bord de la mer » (marqueur (y)).' },
  // (RETRAIT PARAM_META 2026-10-28, arbitrage Thibaut « les armées
  //  rejoignent la banque » : puissanceGeneral et puissanceSoldat
  //  ne sont plus éditables ici — ils vivent sur les lignes de
  //  métier (Soldat / Commandant) du référentiel ; les paramètres
  //  restent comme REFLI de compatibilité.)
  { key: 'armeePrixOr', label: 'Prix de levée — Or par tranche de force', groupe: 'Armées', aide: 'Levée d\'une armée : ce prix est facturé pour chaque tranche de points de force de la puissance cible (règle du classeur : 1 Or tous les 2 points) — payé UNE FOIS à la levée, pas d\'entretien.' },
  { key: 'armeePriXPuissance', label: 'Prix de levée — points de force par tranche', groupe: 'Armées' },
  { key: 'maxMarchands', label: 'Nombre maximal de routes commerciales par joueur', groupe: 'Armées', aide: '0 par défaut. Compte les ROUTES détenues (ville d\'origine), pas les marchands — renommé le 2026-10-24 (sous-vague 3b « routes dissociées ») ; la clé maxMarchands est conservée pour les configs existantes. Les règles qui accordent une route supplémentaire l\'augmentent.' },
  // (RETRAIT PARAM_META 2026-10-28, arbitrage Thibaut « les armées
  //  rejoignent la banque » : soldatAgeMin et soldatAgeMax ne sont
  //  plus éditables ici — ils vivent sur la ligne de métier Soldat
  //  du référentiel ; les paramètres restent comme REFLI de
  //  compatibilité.)
  { key: 'vassalPrelevement', label: "Part des revenus d'habitants reversée au suzerain", groupe: 'Vassaux', unite: 'proportion', aide: "Un vassal prête serment à un autre joueur : à chaque fin de tour, il reverse cette part des gains d'Or de ses habitants à son suzerain (0,5 = 50 %)." },
  { key: 'maxLog', label: 'Taille maximale du journal', groupe: 'Système' },
  { key: 'maxHistory', label: 'Tours d’historique conservés (snapshots)', groupe: 'Système', aide: 'Chaque tour ajoute un snapshot par joueur (stocks + apports). Les plus anciens au-delà du plafond sont retirés.' },
  { key: 'saisonLongueur', label: 'Durée d\'une saison (tours)', groupe: 'Système', aide: 'Un tour = 2 ans de temps de jeu ; Été/Hiver alternent toutes les N saisons… modifiable à volonté.' },
]

export const PARAM_STRINGS_META: { key: keyof GameParamStrings; label: string; groupe: string }[] = [
  { key: 'metierHeritierStr', label: 'Nom du métier Héritier', groupe: 'Noms système' },
]

/** Fusionne les paramètres d'une partie avec les défauts (tolérant aux clés manquantes). */
// Rework habitants 2026-10-20 : les clés titreXxx sont devenues
//  metierXxx (et mariageBonusTitre → mariageBonusMetier). Les configs
//  existantes embarquent les anciennes clés — traduction ciblée,
//  IDEMPOTENTE : la nouvelle clé, si déjà présente, prime ; l'ancienne
//  n'écrase jamais, quel que soit l'ordre des clés.
const RENOMMAGES_PARAMS: Record<string, string> = {
  titreDirigeant: 'metierDirigeant',
  titreGouverneur: 'metierGouverneur',
  titreProfesseur: 'metierProfesseur',
  titreChasseur: 'metierChasseur',
  titreSoldat: 'metierSoldat',
  titreCommandant: 'metierCommandant',
  titreHeritierStr: 'metierHeritierStr',
  mariageBonusTitre: 'mariageBonusMetier',
}

export function mergeParams(custom: Record<string, unknown> | undefined): GameParams & GameParamStrings {
  const trad: Record<string, unknown> = {}
  if (custom && typeof custom === 'object') {
    for (const [k, v] of Object.entries(custom)) {
      if (v === undefined || v === null || v === '') continue
      const cle = RENOMMAGES_PARAMS[k] ?? k
      //  une clé ANCIENNE (renommée) ne doit jamais écraser la clé
      //  nouvelle déjà fournie — la nouvelle prime (rework habitants v3).
      if (RENOMMAGES_PARAMS[k] !== undefined && trad[cle] !== undefined) continue
      trad[cle] = v
    }
  }
  const out: Record<string, unknown> = { ...DEFAULT_PARAMS, ...DEFAULT_PARAM_STRINGS, ...trad }
  return out as unknown as GameParams & GameParamStrings
}
