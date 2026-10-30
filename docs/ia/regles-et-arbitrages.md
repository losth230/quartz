# Règles et arbitrages — source de vérité du design

Ce document archive **toutes les décisions de design actées** pour « Chasse & Pêche »,
arbitrées par Thibaut Lafue (game designer). Il complète le classeur Excel (référence
de fond) : en cas de divergence, **l'arbitrage le plus récent de ce document gagne**.
Un moteur IA (ou un développeur) qui implémente une mécanique DOIT vérifier ici
l'arbitrage correspondant — et ne pas « réinventer » une règle déjà tranchée.

L'historique d'implémentation (commits, incidents techniques) est dans
[journal-technique.md](journal-technique.md).

## Décisions fondatrices

- **L'Influence n'existe plus : remplacée par les émissaires.** (Info plus récente que
  le classeur 7.19 et que le référentiel web — les références restantes à l'Influence
  sont à convertir en émissaires.)
- **Thibaut est l'arbitre** : je propose des options, il tranche, j'implémente. Les
  arbitrages listés ci-dessous sont ACTÉS et doivent être considérés comme la règle.

## Mécaniques du moteur (vérifiées dans le code)

- **Vassalité** : serment `vassalDe`, tribut `vassalPrelevement = 0.5` (50 % des gains
  d'Or des habitants du vassal versés au suzerain), chaînes A→B→C possibles, serments
  croisés interdits.
- **Cités libres** : suzeraineté à 3 émissaires (`emissaires: Record<joueur, n>`, suivi
  manuel dans l'app, 1 tentative par saison) ; taxes versées au suzerain (Chasseurs
  ×2 Nourriture) ; une cité libre sous suzeraineté compte comme un serment.
- **Dogmes** : NON implémentés dans le moteur (affichés dans les Référentiels, appliqués
  au plateau) — sauf le Pacifisme (voir ci-dessous).
- **Rangs de pontificat** : Rang I à 100 Tourisme, II à 180, III à 340, cumulables ;
  le pontife reçoit aussi les bonus « fidèles ».

### Dogme du Pacifisme (refondu — architecture actée)

Pontife = bonus de SUZERAIN, Fidèles = bonus de VASSAL ; fidèles vassaux « de n'importe
quel suzerain » :

- **bonusPontife** — R1 : 1 émissaire immédiat avec la cité libre de son choix, puis
  1 émissaire supplémentaire à chaque passage d'âge. R2 : +3 Or et +3 Nourriture par
  tour par serment possédé (vassaux + cités libres), max 4 serments. R3 : suzeraineté
  d'une cité libre dès 2 émissaires (au lieu de 3), pas de double taxes.
- **bonusFideles** — R1 : tribut de vassalité allégé à 40 % (au lieu de 50 %). R2 :
  tant que vassal : habitations +10 Garnison et +2 Or/tour. R3 : tant que vassal :
  +10 Garnison, +2 Nourriture et +2 Or/tour supplémentaires.
- L'ancien bonus « révocation −2 Ressources −10 Or » est retiré complètement.
- Interprétation à confirmer : R1 pontife lu comme « 1 émissaire par cité libre de
  son choix » (pas un émissaire global).

## Voies de victoire — « Lauriers » (structure actée, validation MANUELLE, textes RETIRÉS)

Chaque voie a **4 Lauriers** ; validation en **ordre strict** ; **crise à chaque
Laurier I-III** validé ; bonus one-shot uniquement si le Laurier est complété pendant
l'âge de même numéro ; Laurier III sans bonus ; **Laurier IV = victoire**. Les joueurs
cochent eux-mêmes dans l'application (pas d'auto-détection).

**(RETRAIT 2026-10-24, arbitrage « supprimer les conditions de victoire » :**
les TEXTES de conditions et de bonus des 6 voies (Culturelle, Démographique,
Diplomatique, Économique, Militaire, Scientifique — 24 Lauriers) sont SUPPRIMÉS
du référentiel et de l'application (Lauriers VIDÉS). La structure reste
INTACTE : 6 voies × 4 Lauriers à cocher sur l'accueil (ordre strict),
radar de progression, crises au plateau, Laurier IV = victoire. Les
nouveaux textes de conditions sont **à redéfinir par l'arbitre**.
Historique des conditions de l'époque (table `victoires` de
`referentiels.json` — l'ancien contenu reste dans l'historique git) :
**Diplomatique** (émissaires, suzeraineté, Empereur) · **Culturelle**
(Pontificat, Merveilles, Tourisme) · **Démographique** (habitations,
population) · **Économique** (aménagements, routes, Or, Guildes) ·
**Militaire** (captures, Donjon/Caserne, armée) · **Scientifique**
(Science/tour, Cabinet d'astronomie, arbres de Progrès — conditions
caduques dès la suppression du système de progrès, plus tôt dans la
journée.)

## Rangs de pays (refonte arbitrée 2026-10-14)

Remplace le prérequis « 1 serment par rang intermédiaire » du classeur, jugé inadéquat
(rareté des serments à 6-8 joueurs). Design final :

- **Échelle féodale unique pour tous** — le bloc Républicain
  (Commune/District/Union/Confédération) est supprimé (avec ses bonus Influence
  obsolètes) ; les régimes Démocratie/Socialisme partent aussi de la Baronnie.
  Titres : **Baronnie → Comté → Duché → Royaume → Empire**.
- **Aucune référence aux Terres** dans les rangs (un vassal peut détenir plus de
  terres que son suzerain sans être forcé de monter).
- **Octroi : 1 Ministre par rang** (cap cumulé 1→5). Les bonus « +1 Ministre
  supplémentaire » (voie diplomatique, orientations/dogmes — sources historiques,
  les dogmes sont retirés du référentiel depuis le 2026-10-24) = dépassements de
  plafond, toujours valides.
- Table : **Baronnie** = départ, 1 Ministre · **Comté** = 20 Or + 40 Nourriture +
  1 serment, 2 Ministres · **Duché** = 30 Or + 60 Nourriture + 2 serments, 3
  Ministres · **Royaume** = 50 Or + 100 Nourriture + 3 serments, 4 Ministres ·
  **Empire** = 100 Or + 200 Nourriture + 4 serments, 5 Ministres.
  **La seule condition de montée est le nombre de serments (1/2/3/4)** — pas de
  Donjon, pas de Tourisme, pas d'autre grandeur. Serment = vassal OU cité libre
  sous suzeraineté. Le cap Pacifisme R2 (max 4 serments) coïncide avec le seuil
  impérial (constaté, non corrigé).
- **Succession (Avènement)** : avec héritier → l'Héritier devient Dirigeant et paie
  le **sacre d'avènement = moitié du prix de son rang** ; sans héritier → le noble
  élu devient Dirigeant + **crise aléatoire** tirée de la table des crises.
  « Renouvellement d'hommage des vassaux » et « la cour tombe » : proposés, NON
  retenus. Le délai/chute de rang du sacre impayé n'est PAS implémenté (paiement
  seul) — à arbitrer si besoin.
- Réécritures induites : loi Démocratie « Elections : sacre d'avènement gratuit » ;
  trait Héritier = « L'Héritier devient Dirigeant lors de la succession. Si votre
  héritier meurt, déclenchez une crise. » (la moitié « Terres » est obsolète).
- Implémentation : `DEFAULT_CONFIG.paysRangs` (table éditable dans
  Référentiels → « Pays & rangs »), `rangPaysNiveau` (factions.ts),
  `sermentsPossedes` (engine.ts), bouton « ⬆ Sacre » (page Royaume) avec débit
  automatique, avènement dans sante.ts `handleDirigeantSuccession`, cap Ministres
  en simple avertissement (jamais bloquant).

## Ministres / portefeuilles (arbitrages actés)

- **Système retenu** : titre « Ministre » (cap = rang de pays, cumulable, jamais
  bloquant), les ministres portent des **portefeuilles** aux effets distincts,
  soumis à un **rang de pays minimum**. Nomination : **nobles et membres de
  dynasties uniquement, strict** (pas d'anoblissement par la charge).
- **Effets MIXTES** : les simples appliqués automatiquement par l'application
  (« Auto »), les complexes appliqués au plateau (« Plateau »).
- **Portefeuilles CUMULABLES** (2× le même = OK) ; le catalogue doit couvrir toutes
  les voies de victoire.
- Les 7 ministères du classeur ont été renommés en offices de cour
  (SIMPLIFICATION 2026-10-23 : les ministres/offices sont RETIRÉS du
  jeu pour l'instant, arbitrage Thibaut « alléger pour dérouiller » ;
  vague 2, arbitrage 2026-10-23 : « Grand bailli : c'est un ministre,
  on supprime pour l'instant » — l'office et son effet sont supprimés,
  il ne reste plus aucune mention moteur) :
  Colonial→**Grand bailli**, Culture→**Maître des arts**, Défense→**Grand prévôt**,
  Economie→**Surintendant des finances**,
  Guerre→**Grand écuyer**, Recherche→**Grand bibliothécaire**.
  (Le renommage Ecologie→**Grand veneur** a disparu le 2026-10-22 :
  l'office a été RETIRÉ avec son effet — il n'y a plus de consommation
  des habitations à réduire.)
- **Catalogue en ligne : 18 portefeuilles** (adapté de la partie réelle de Thibaut ;
  5 supprimés : Maître des arts, Intendant des hommes, Maître des œuvres, Maître des
  espions, Ambassadeur des cités). Effets **Auto codés** :
  - Grand bailli : fondation d'habitation −8 Or −3 Bois (plafonnés à 0 ; améliorations non réduites).
  - Grand prévôt : +1 Fer/tour + 10 Garnison × rang de pays par habitation (dynamique).
  - Surintendant des finances : après construction d'un bâtiment, 1 ressource au
    choix produite par l'habitation × rang.
  - Grand bibliothécaire : +rang de pays en Science au déblocage d'une technologie.
  - Légat du pontificat : +20 Tourisme à la fin de chaque saison.
  - Connétable : +15 Garnison à la prise de fonction (permanent).
  - Et les effets Auto historiques : Trésorier (+5 Or/tour), Grand Précepteur
    (+1 Science/tour), Sénéchal (+15 Nourriture fin d'été), Maître de cour
    (+2 Tourisme fin de saison), Grand Chambellan (+10 % taxes reçues, cumulable
    avec le gouverneur), Chancelier de justice (−25 % sacres), Archichancelier
    (sacre d'avènement ÷2).
  - **Non automatisables** (absents de l'app) : Grand écuyer (une levée d'armée ne
    coûte rien), Chancelier des émissaires (saisie manuelle prévue page Cités
    libres), Maître des guildes (aucune limite de guildes), Maréchal (pas de points
    de moralité).
- Interactions à surveiller : Chancelier de justice + Archichancelier s'empilent
  (avènement ≈ 37,5 % du prix) ; la loi Démocratie (avènement gratuit) prime ;
  PAS de serment virtuel (contournerait la condition de montée en rang).
- Le catalogue est **entièrement éditable** dans Paramètres → Ministères
  (nom, rang minimum, mode Auto/Plateau, effet, +/− lignes).
- **NETTOYAGE 2026-10-24** (retour arbitre « garder la ligne titre, vider
  ses textes ») : les derniers TEXTES résiduels partent du référentiel —
  la ligne titre « Ministre » RESTE dans la table métiers (attribuable
  manuellement, INERTE : le système des ministères n'existe plus) mais
  sa description (« Plusieurs autorisés »), son effet (« Octroie un
  ministre… ») et son coût de révocation (« 30 Or + 6 Soie ») sont
  VIDÉS ; plus aucune fiche de peuple ne promet de ministre.

## Progrès technologiques (SUPPRIMÉS le 2026-10-24 — arbitrage « supprimer proprement les progrès et qu'il ne reste rien »)

**Décision actée 2026-10-24** : le système de progrès (arbres par âge,
techs A1/A2/B1/B2/C, déblocages, effets, onglet Progrès, éditeur de
paramètres) est SUPPRIMÉ du jeu. Historique des règles qu'il portait
(pour mémoire, tout est dans l'historique git au 2026-10-23 et avant) :
tech 2 exigeait la tech 1 de sa branche ; la tech C exigeait les 2
techs d'une même branche ; un arbre était terminé à exactement 3
technologies (tech C optionnelle) ; 3 arbres complétés de l'âge N-1
ouvraient l'âge N ; les effets s'appliquaient au plateau sauf le coût
en Science, déduit automatiquement puis remboursé à la reprise ;
21 arbres (7 colonnes × 3 âges), paramétrables dans Paramètres →
Progrès.

Ce qui RESTE : la **ressource Science** (impôts, métiers
Chercheur/Scientifique, Observatoire,
Laboratoire de Falheim, Dashboard) et les textes des Lauriers
Scientifique — (NOTE 2026-10-29, refonte « 12 lois » : le champ
`scienceParConstruction` de la culture Déisme est RETIRÉ — la
nouvelle loi Déisme « Monuments pieux » est un emplacement de
Scientifique par bâtiment DE FACTION (marqueur `batimentDeFaction`,
cf. section « Refonte des cultures ») — dont les conditions II/III/IV sont **CADUQUES** (elles
référencent des arbres qui n'existent plus) : redesign de la voie à
arbitrer.

## Barème d'équilibrage de référence (validé en approche)

- Fidèle ≈ 50 % du pontife ; Rang 2 ≈ ×1,5 du Rang 1.
- 1 Science/tour ≈ 4 éq-Or (benchmark Tour de sorcier) ; 1 habitant net ≈ 0,1 Or
  (Chasseur) ; 15 habitants ≈ +1,5 Or/tour.

### Propositions d'équilibrage EN ATTENTE (présentées, non appliquées)

- Capitalisme fidèle R3 (+20 Or/tour) : outlier brut à corriger.
- Lumières : R1=R2 (copié-collé) — proposer +2 Science au R2 pontife.
- Guerres-Saintes pontife R2 « Tourisme +20 » : non-bonus hors thème — proposer un
  bonus militaire (ex. levée −20 Or).
- Socialisme fidèle R1 identique pontife (+15 hab) — proposer 10.
- Seuil 20 Tourisme (3 ressources/été) du classeur absent du référentiel web :
  divergence à harmoniser.

## Arbitrages de jeu au fil des sessions (tous ACTÉS)

- **Aménagements dédoublables** ; les bâtiments restent uniques par ville.
- **Supprimer une ville** (revu 2026-10-21) : la population CLASSIQUE de la
  ville (roturiers, vivants et décédés) est **SUPPRIMÉE avec elle — fiches
  définitivement effacées, aucune trace**. Seule la COUR (nobles) reste
  inscrite auprès de son joueur, champ « ville » laissé tel quel (l'arbitre
  la reloge ensuite) ; un noble ne disparaît jamais par suppression de
  ville. (Retour initial 2026-10-14 « les habitants restent » abrogé.)
- **Transférer une ville** : la ville ET sa population « classique » (vivants et
  décédés) changent de propriétaire ; la COUR (nobles) reste auprès de son joueur,
  ré-ancrée sur sa première ville restante ; renommage automatique en cas de
  collision (« Bourg 1 2 »). Un noble ne change de joueur que par DON explicite.
- **Le mariage manuel unit deux NOBLES** vivants, majeurs, non mariés — y compris de
  joueurs différents ou d'une cité libre. **La personne mariée DÉMÉNAGE** dans la
  ville de son conjoint (changement de joueur ou de cité possible) ; c'est la
  personne de la ligne qui déménage, pas le conjoint choisi dans le menu. Le moteur
  sait retrouver un conjoint chez n'importe quel porteur (veuvage, naissances).
  L'INTERFACE de proposition ne cible que les nobles du MÊME porteur (fin du
  ciblage des autres joueurs) ; le moteur garde sa capacité inter-porteurs.
- **Dons** : transfert d'un habitant OU d'un noble vers un autre joueur ou une cité
  libre, dans tous les sens ; ré-ancrage sur la première ville de la cible si besoin.
- **Cités libres « comme des joueurs »** : population en onglet (roturiers et
  nobles), démographie MANUELLE (statut éditable ; naissances/vieillissement au
  plateau — l'automatisation complète n'est pas demandée), consommation de
  Nourriture plate par cité. Une cité libre créée automatiquement par joueur au
  setup, caractéristiques tirées au hasard.
- **Nouvelle ville/château = 50 habitants SANS noble** (~40 % d'adultes mariés —
  mariages entre adultes seulement).
- **Gouverneur automatique** : une ville sans gouverneur qui abrite un noble prend
  son noble LE PLUS ÂGÉ comme gouverneur à chaque fin de tour (hors
  Dirigeant/Héritier), AVANT le calcul des gains → **Gouverneur = +10 % d'impôts
  sur sa ville** (cumulable avec le Grand Chambellan, s'applique aussi à l'impôt
  manuel).
- **Impôts manuels** : générables HORS fin de tour autant de fois que voulu — les
  boutons AJOUTENT l'impôt par-dessus celui du fin de tour (rattrapage, jamais un
  remplacement).
- **Marchands / routes commerciales** : titre « Marchand », UNE route par marchand
  (ville du marchand ↔ ville d'un autre joueur) ; +4 Or/tour aux DEUX joueurs ;
  le propriétaire **copie l'AMÉNAGEMENT ENTIER** de la ville ciblée (toutes ses
  ressources positives, modifiable à tout moment, saisonnier — une production
  d'été n'est copiée qu'en été ; la Garnison (valeur d'état) et les effets
  négatifs sont exclus ; **le Tourisme EST copiable** — arbitrage 2026-10-19 :
  le stock de Tourisme n'est jamais cumulé, il est recalculé à chaque fin de tour
  (stock = production) et le Tourisme copié compte dans ce calcul) ;
  fermeture automatique si le marchand meurt ou perd son titre.
- **Taxes** : effet ±25 % (Faibles ×0,75, Fortes ×1,25 — arbitrage du ±50 % initial).
- **Nombre de joueurs** : 2 à 8 à la création (le jeu est conçu pour 6-8, la borne
  basse est souple pour les tests).
- **Couleurs** : J1 rouge, J2 bleu royal, J3 vert, J4 jaune, J5 violet, J6 orange,
  J7 turquoise, J8 rose #EC4899 ; couleurs de ressources paramétrables
  (Référentiels → Couleurs, avec transparence des lignes de tableaux, défaut 85 %).
- **Proximité des villes** : Plaine = rien, Rivière = +12 Nourriture/tour,
  Mer = +7 (paramétrable) ; les aménagements marins restent disponibles partout.
- **Production des villes** : capital par défaut VIDE (aucun bâtiment initial) ;
  toutes les ressources affichées même à production 0.
- **Martialité supprimée** (arbitrage 2026-10-21) : la règle de genre
  « Martialité » disparaît du jeu — Soldat et Commandant passent à regleGenre
  vide (aucune restriction de sexe), le recrutement des armées (soldats ET
  commandants) est ouvert aux deux sexes, la colonne martialité disparaît des
  cultures (référentiel, Référentiels, Paramètres). **L'HÉRÉDITÉ est
  conservée** (Dirigeant/Héritier et les métiers marqués Hérédité continuent
  d'être régis par elle). Les configs sauvegardées sont converties par la
  migration ciblée `martialiteSupprimee` (pattern (z), sans incrémenter
  SCHEMA_VERSION_CONFIG — les configs v3 convergées ne rejouent pas les
  migrations v3).
- **Tous les dogmes supprimés** (arbitrage 2026-10-24, « pour l'instant » —
  retrait provisoire décidé par l'arbitre) : la table `dogmes` du
  référentiel (Lumières, Capitalisme, Guerres-Saintes, Pacifisme,
  Socialisme — bonus Pontife/Fidèles en texte libre, jamais branchés sur
  le moteur) disparaît du classeur, du type `GameConfig` et du wiki
  (l'onglet « Tourisme & dogmes » redevient « Tourisme », seule la carte
  des seuils de tourisme reste). La valeur `'dogme'` quitte l'union
  `SourceRegle` sans être réutilisée (stabilité des ids) ; les docblocks
  concernés documentent le retrait (règle 9). Les configs sauvegardées
  sont purgées par un `delete` ciblé dans `cfgOf` (patron taxes25, SANS
  bump de SCHEMA_VERSION_CONFIG — un bump renverrait les configs v4
  convergées dans la branche de migration complète qui ré-ajoute les
  entrées supprimées). Le contenu reste dans l'historique git : un
  éventuel retour des dogmes repartira de zéro. NB : le mot
  « Pontificat » reste présent dans des TEXTES d'affichage (seuils de
  tourisme, condition de la voie Culturelle) — concept plateau à
  réarbitrer si les dogmes reviennent.
- **Suppression des événements de saison et des cartes dynastie + purge
  résiduelle de l'Influence** (arbitrage 2026-10-24, « on supprime tous
  les dogmes pour l'instant » puis « purge l'influence, les événements
  de dynastie, les événements d'hiver et d'été ») :
  - La table `events` (18 événements été/hiver, 4 niveaux de texte
    faible/moyenne/forte/extrême, tirée au CHANGEMENT de saison avec un
    dé de danger + `modDanger`, effets chiffrés via `eventEffets` et les
    params `evMult*`/`dangerSeuil*`) disparaît du référentiel, du type
    `GameConfig`, du moteur (étape 1 de `runTurn` : la saison change
    désormais à sec, sans tirage) et de l'UI (onglets Paramètres
    « Événements » et « Effets évts », compteur de l'aide-mémoire).
  - La table `dynasties` (38 cartes tirées à CHAQUE tour pour chaque
    joueur, effets chiffrés via `dynastieEffets`) disparaît pareillement
    (étape 2 de `runTurn`, onglets « Dynasties » et « Cartes », mini
    « Événement de dynastie » de la page Royaume). NB : `Player.dynastie`
    (la CARTE courante) devient un champ optionnel conservé pour les
    vieilles sauvegardes, sans producteur ni lecteur ; il ne faut pas le
    confondre avec `Character.dynastie`, le NOM DE FAMILLE du
    personnage, qui reste un concept noyau.
  - Les types de journal `'Événement'`/`'Dynastie'` RESTENT dans l'union
    `LogEntry` et l'affichage du journal : plus produits, mais les
    vieilles parties continuent d'afficher leurs anciennes lignes.
  - Les params `evMultFaible/Moyenne/Forte/Extreme` et
    `dangerSeuilForte/Extreme` sont retirés (le groupe « Événements »
    de l'onglet Formules disparaît) ; `GameState.modDanger` devient
    optionnel.
  - **Purge résiduelle de l'Influence** : la mécanique avait été
    remplacée par les émissaires depuis longtemps, mais il restait des
    textes — la `regleCitesLibres` du référentiel (« gagner de
    l'influence » → « gagner des émissaires », migration ciblée par
    remplacement de fragments dans `cfgOf`) et l'aide des cités libres.
    Dans le diag autonome, les 4 rangs républicains (Commune, District,
    Union, Confédération — bonus libellés en Influence) disparaissent ;
    `rangParDefaut` retombe sur la Baronnie pour tous les régimes.
  - Purge des configs sauvegardées par `delete` ciblés dans `cfgOf`
    (patron taxes25, SANS bump de SCHEMA_VERSION_CONFIG — même
    raisonnement que pour les dogmes : un bump renverrait les configs
    convergées dans la branche de migration complète). L'ancien contenu
    reste dans l'historique git : un éventuel retour (événements de
    saison refondus, cartes dynastie) repartira de zéro. L'INFLUENCE
    CULTURELLE (conversions de villes par le tourisme) est un concept
    distinct et n'est PAS touchée.

## Rework des habitants (design arbitré 2026-10-20 — VAGUES 1 & 2 IMPLÉMENTÉES)

Refonte complète du système d'habitants demandée par l'arbitre le 2026-10-20.
Les arbitrages ci-dessous sont ACTÉS et les **VAGUES 1 & 2 SONT
IMPLÉMENTÉES** (2026-10-20, voir journal-technique.md). Cette section reste la référence de
l'implémentation (le code devra y revenir avant chaque vague).

### Modèle d'habitant (arbitré)

- Champs conservés tels quels : **nom, prénom, dynastie, âge, sexe,
  orientation sexuelle, mariage, culture, ville**, traits génétiques (rework
  ultérieur), et le **statut Sain / Malade / Enceinte / Décédé** (inchangé).
- **`titre` devient `métier`** : les rôles de cour (Dirigeant, Héritier,
  Gouverneur, Ministre, Marchand, Professeur, Maréchal) migrent DANS le champ
  métier — plus de champ « titre » distinct.
- **Nouveau `domicile`** (identifiant de bâtiment de logement, ou null =
  sans domicile) : aucun effet au plateau tant que les bâtiments de logement
  n'existent pas (vague 3).
- **Suppression d'`ageMax`** : plus d'âge-plafond individuel ; les fonctions
  associées (`computeAgeMax`, résurrection) sont retirées.

### Santé et mortalité (arbitré)

- La mort ne vient plus d'un plafond d'âge : chaque tour, la probabilité de
  CONTRACTER la maladie croît avec l'âge — courbe de Gompertz
  `min(cap, base × exp(pente × âge))`, calibrée par simulation Monte-Carlo
  pour une espérance de vie d'environ **60 ans**.
- **Un malade qui re-contracte la maladie MEURT** (règle existante de
  `maladieStep`) — la maladie reste la seule cause de mort.
- Paramètres `maladieBase`/`maladiePente`/`maladieCap` éditables (Paramètres →
  Maladie) ; calibrés à **0.0025 / 0.08 / 0.9** par Monte-Carlo (N=200 000) :
  E[âge de décès] = 59,5 ans, médiane 60, p10 48, p90 70. Les modificateurs
  de bâtiments existants (`malContraction`, `bonusGuerison`,
  `bonusGuerisonGlobal`, `modMaladieEnceinte`) sont conservés.
- Implémenté (interim traits) : jusqu'au rework des traits, `life_delta`
  module la PENTE de la courbe (somme des deltas des traits, bornée ±50 %).

### Métiers (arbitré)

- Registre des métiers (ex-table des titres) : chaque métier a un **nombre
  maximal de postes par ville**, qui évoluera avec les bâtiments et
  aménagements présents (vague 3).
- **Chasseur** : capacité paramétrable DIFFÉRENTE selon le type d'habitation
  (Ville vs Château).
- **Priorisation** : un habitant sans métier prend en priorité un métier
  autre que Chasseur si une place y est libre ; si seul Chasseur a des
  places, il devient Chasseur ; si aucun métier n'a de place, il est
  **Sans-emploi**.
- **Surnombre** (cap baissé, bâtiment perdu…) : les PLUS ÂGÉS perdent leur
  métier en premier.
- **Sans-emploi** : aucun effet au plateau (neutre), impôt nul.
- Règles propres de cour conservées : Gouverneur = noble le plus âgé de la
  ville (hors Dirigeant/Héritier, +10 % impôts), cap des Ministres = rang de
  pays, Dirigeant/Héritier inchangés.
- Impôts : « métiers × taxes » remplace « titres × taxes ».
- Choc attendu sur les parties existantes (50 habitants/ville avec des caps
  bas → vagues massives de Sans-emploi au premier tour) → caps de base
  GÉNÉREUSES ARBITRÉES le 2026-10-20 : **Ville 50 / Château 25** (« très
  généreux »), paramétrables (`capMetierChasseurVille` /
  `capMetierChasseurChateau`). Seul le Chasseur est plafonné en vague 1 ;
  les autres métiers pourront déclarer `capParVille` au référentiel
  (absent = illimité). La réaffectation tourne à chaque tour AVANT le
  calcul des gains (étape 2ter, les caps s'appliquent aux impôts du tour).

### Migration (actée techniquement)

- `SCHEMA_VERSION_ETAT`++ dans `engine/migrations.ts` : conversion
  `titre` → `métier` (mapping 1:1 des noms actuels), retrait d'`ageMax`,
  `domicile` → null. Les parties en cours doivent rester jouables sans
  intervention manuelle.

### Plan en 3 vagues (proposé)

1. **V1 moteur — FAIT (2026-10-20)** : renommage intégral titre → métier
   (~60 fichiers UI+moteur), champ domicile, fin d'ageMax + courbe calibrée,
   caps Chasseur (Ville 50 / Château 25), réaffectation chaque tour par
   ville (étape 2ter), migrations état v3 + config v3, harnais 112/112.
2. **V2 UI — FAIT (2026-10-20)** : PopulationTable — colonne Domicile
   (null = « — », logements en vague 3) et écran « Métiers et places
   par ville » (en poste / cap / places libres par ville et métier,
   Chasseur Ville 50 / Château 25, ligne Sans-emploi toujours présente,
   helper moteur occupationsMetierVille).
3. **V3 (ultérieure)** : métiers créés par les bâtiments/aménagements,
   production taxable étendue, bâtiments de logement → domicile.

## Rework métiers & aménagements — vague 3 (arbitré 2026-10-21, design consolidé)

Suite du rework des habitants : les métiers deviennent des **postes à
emplacements** créés par les aménagements. Tous les arbitrages ci-dessous
sont ACTÉS (session 2026-10-21) — l'implémentation est planifiée en
sous-vagues 3a (métiers & emplacements) puis 3b (routes dissociées).

### Métiers de production (arbitré)

- **Aucune éducation requise** : un emplacement libre est pris
  automatiquement (priorisation vague 1 : métier autre que Chasseur
  d'abord, habitant sans métier ; les plus âgés perdent leur poste en
  premier au surnombre). La colonne éducation disparaît des métiers de
  production.
- Gains par habitant et par tour : Chasseur +1,2 Nourriture (défaut) ·
  Artiste +5 Tourisme · Commerçant +1 Or · Bûcheron +0,5 Bois ·
  Mineur +0,5 Pierre · Forgeron +0,5 Fer · Tisseur +0,5 Soie ·
  Éleveur +0,5 Bétail +2 Nourriture · Charbonnier +0,5 Charbon ·
  Fermier +5 Nourriture (ÉTÉ uniquement) · Archéologue +4 Tourisme ·
  Pêcheur +4 Nourriture · Scientifique +0,5 Science · Marchand +2 Or.
- **Garde : +10 Garnison — STATIQUE** (« la Garnison n'est jamais par
  tour ») : le bonus est ACTIF tant que le Garde tient le poste ;
  retiré s'il part ou meurt.
- **Métiers de taxe** : Professeur +10 % taxe Science, Banquier +10 %
  taxe Or, Troubadour +10 % taxe Tourisme — dans leur ville. Les bonus
  de taxe se cumulent de façon **ADDITIVE** avec le Gouverneur (+10 %
  d'impôts) : ex. Gouverneur + Professeur = +20 % sur la Science.
- Rôles de cour inchangés : Dirigeant, Héritier, Gouverneur, Ministre
  (noblesse et règles propres conservées).
- Soldat (15 pts d'armée) et Commandant (45 pts, nobles) : attribution
  Armée, aucune restriction de sexe (arbitrage martialité du même jour).
- **Chasseur = métier par défaut** : cap par habitation (paramètres
  Ville/Château conservés) + emplacements des aménagements ; tout
  habitant sans place est **Sans-emploi** (rôle neutre, impôt nul).
  Une ville sans aménagement ne produit quasiment rien par métiers —
  assumé (c'était déjà le cas).
- **Disparitions ACTÉES** : Artisan (→ Commerçant), Chercheur
  (→ Scientifique), Sportif (→ Garde), **Propagandiste supprimé** (les
  3 charges de conversion disparaissent ; en migration, ses titulaires
  deviennent Sans-emploi). **24 métiers** au référentiel.

### Aménagements tier 1 : production → emplacements (arbitré)

La production directe des aménagements tier 1 (coût inchangé :
8 Or + 3 Bois) est remplacée par des emplacements de métiers. La
production calibrée retombe sur les valeurs actuelles (10/14 aménagements
identiques si tous les emplacements sont remplis) :

- Baleinier : +3 Pêcheur, +2 Commerçant
- Bâteau de pêche : +2 Pêcheur
- Carrière : +2 Mineur
- Champ : +3 Fermier
- Foire : +1 Artiste, +1 Commerçant
- Mine de Charbon : +2 Charbonnier
- Mine de Fer : +2 Forgeron
- Mine d'Or : +3 Marchand
- Observatoire : +1 Scientifique
- Pâturage : +2 Éleveur
- Rizière : +4 Fermier
- Scierie : +2 Bûcheron, +2 Chasseur
- Sériciculture : +2 Tisseur, +2 Chasseur
- Site archéologique : +2 Archéologue

- Garde, Professeur, Banquier, Troubadour : **aucune source d'emplacement
  tier 1** — les bâtiments qui les créeront arrivent plus tard (tiers
  suivants) ; en attendant, attribution manuelle MJ possible.
- Caps par ville, **vague 3b (actée 2026-10-22) : CUMULATIVES** =
  **base du RANG d'habitation** (colonne « Métiers disponibles » du
  référentiel Habitations — ex. Hameau : 50 Chasseurs, 2 Gardes,
  1 Commerçant, 1 Gouverneur ; Motte : 40 Chasseurs, 4 Gardes,
  1 Gouverneur) **+ emplacements des bâtiments ET aménagements
  présents** (vague 3a). Les paramètres `capMetierChasseurVille` /
  `capMetierChasseurChateau` sont SUPPRIMÉS. La Garde, le Commerçant
  et le Gouverneur deviennent donc PLAFONNÉS par la base du rang
  (jamais auto-attribués pour le Gouverneur — poste noble) ;
  Banquier/Troubadour/cour/armée restent hors champ (∞, règles
  propres) tant qu'aucun rang/bâtiment ne leur donne de base.

### Améliorations d'aménagements : tiers 2 et 3 (arbitré 2026-10-22)

Un aménagement de tier 1 peut être **AMÉLIORÉ** : le tier 2
**remplace** une instance du tier 1 dans la ville, le tier 3 remplace
une instance du tier 2 — l'amélioration n'est jamais une construction
en plus. Chaque action n'améliore qu'**UN exemplaire** (un même
terrain peut être aménagé plusieurs fois, ex. 2 Champs dont un seul
amélioré) ; le tier inférieur remplacé **ne compte plus ses
emplacements** (caps recalculées automatiquement).

- **Gates** : améliorer en tier 2 exige une **habitation de rang 2**
  (Cité/Donjon) ; le tier 3 exige le **rang 3** (Grande Cité /
  Forteresse). Le tier inférieur doit être présent dans la ville.
  Garde-fous NON bloquants à la maison (⚠ dans le log, action quand
  même enregistrée) — la vue filtre déjà les options.
- **Coûts uniformes** (indépendants de l'aménagement) :
  tier 2 = **15 Or + 3 Pierre** ; tier 3 = **35 Or + 3 Fer**.
  Les réductions habituelles s'appliquent (technologies, Camp de
  bâtisseurs).
- **Nommage** : « Baleinier (tier 2) » / « Baleinier (tier 3) » ;
  champs référentiel `rangMinHabitation` (2/3) et
  `remplaceAmenagement` (le tier remplacé).

Emplacements du **tier 2** (coût 15 Or + 3 Pierre) :

- Baleinier : +5 Pêcheur, +5 Commerçant
- Bâteau de pêche : +4 Pêcheur
- Carrière : +4 Mineur
- Champ : +6 Fermier
- Foire : +2 Artiste, +2 Commerçant
- Mine de Charbon : +4 Charbonnier
- Mine de Fer : +4 Forgeron, +1 Garde
- Mine d'Or : +7 Marchand
- Observatoire : +3 Scientifique
- Pâturage : +5 Éleveur
- Rizière : +8 Fermier
- Scierie : +4 Bûcheron, +1 Tisseur
- Sériciculture : +4 Tisseur, +2 Commerçant
- Site archéologique : +4 Archéologue

Emplacements du **tier 3** (coût 35 Or + 3 Fer) :

- Baleinier : +7 Pêcheur, +10 Commerçant
- Bâteau de pêche : +7 Pêcheur
- Carrière : +6 Mineur, +2 Charbonnier
- Champ : +10 Fermier
- Foire : +4 Artiste, +4 Commerçant
- Mine de Charbon : +6 Charbonnier
- Mine de Fer : +6 Forgeron, +3 Garde
- Mine d'Or : +12 Marchand
- Observatoire : +5 Scientifique
- Pâturage : +8 Éleveur
- Rizière : +15 Fermier
- Scierie : +6 Bûcheron, +2 Tisseur
- Sériciculture : +6 Tisseur, +5 Commerçant
- Site archéologique : +7 Archéologue

### Marchand & routes commerciales dissociées (arbitré puis ACTÉ le 2026-10-24)

- Le **Marchand devient un métier de production** (+2 Or/tour) ; ses
  emplacements viennent des Mines d'Or et des routes commerciales.
- La **route commerciale est dissociée du Marchand** : ouverte
  indépendamment, elle permet de **copier exactement UN aménagement**
  de la ville ciblée — **y compris ses emplacements de population** —
  et octroie **+1 emplacement de Marchand au joueur à l'origine et
  +1 au joueur ciblé**.
- **Le bonus +4 Or/tour des deux côtés disparaît** : la route ne
  rapporte plus QUE la copie + les emplacements Marchand.
- **Arbitrages complémentaires actés le 2026-10-24** (clôture du « à
  trancher », réponses Thibaut) :
  - **Destinations** : villes des autres joueurs **et cités
    libres**. Vers une cité : rien à copier (aucun aménagement) ;
    +1 emplacement de Marchand à l'origine et à la cité ; le métier
    Marchand devient accessible aux habitants de la cité dès qu'elle
    a des routes entrantes (leur production alimente les taxes
    versées au suzerain) ; `capMarchandsCite` = nombre de routes
    entrantes, informatif — les cités restent hors des caps.
  - **Coût d'ouverture** : **gratuit** (statu quo).
  - **Fermeture manuelle** : **seulement le joueur à l'origine**
    (bouton ✕ côté origine uniquement — la cible n'a pas de bouton).
  - **Routes existantes des parties en cours** : **SUPPRIMÉES** — les
    vieilles routes du modèle « marchand titulaire » (champ
    `marchandId`) sont invisibles puis purgées au premier fin de tour
    avec un log dédié « à rouvrir manuellement ».
  - **Cap** (défaut assumé, continuité) : l'ancien cap
    `maxMarchandsJoueur` devient **`maxRoutesJoueur`** (clé de paramètre
    `maxMarchands` conservée pour les configs existantes) — il compte
    les ROUTES détenues (même plafond et mêmes bonus tech/bâtiments
    que l'ancien cap de marchands), toujours **annoncé, jamais
    bloquant**.
  - **Auto-fermeture** (garde-fou technique assumé) : ville d'origine
    perdue, cible disparue (joueur, ville ou cité annexée),
    aménagement copié disparu de la ville ciblée.
  - **Copie** : les emplacements de population du métier copié se
    matérialisent dans la **ville d'origine** (via les caps) — « copier
    exactement un aménagement, y compris ses emplacements ».
  - **Exception provisoire de la 3a levée** : plus de Marchand
    « titulaire » de route — l'ancienne exemption de réaffectation
    (« un marchand qui tient une route n'est jamais en surnombre »)
    disparaît, les emplacements des routes sont portés par le cap
    lui-même (ctx routes de `capMetierVille`).

### Suppression du métier de Marchand (ACTÉ le 2026-10-24)

Retour arbitre de Thibaut en clôture de la sous-vague 3b : « supprime
carrément le métier de marchand ». Le métier disparaît du référentiel
et du picker ; les routes commerciales RESTENT (modèle dissocié de la
3b : gratuites, sans personnage, fermeture origine seule).

- **Mine d'Or** : GARDÉE sans effet (plus d'emplacements de
  Marchand, pas de production directe — bâtiment en attente de
  reconversion éventuelle).
- **Tech « Commerce lointain »** : GARDÉE sans effet (l'ancien
  « +3 Or par Marchand vivant » disparaît avec le métier ; la tech
  reste débloquable dans l'arbre, aucune règle ne la représente).
- **Routes vers cités libres** : NOUVELLE MÉCANIQUE — une route vers
  une cité libre octroie **+1 émissaire** auprès de ladite cité
  **TANT QUE la route est active**. `emissairesEffectifsCite`
  (engine/citesLibres.ts) = émissaires placés + routes actives du
  joueur ; le badge « suzerain possible » (3 émissaires) et
  l'affichage lisent les EFFECTIFS, les boutons +/- ne touchent que
  les émissaires placés ; fermer la route retire le bonus.
- **Porteurs du titre en cours de partie** (défaut assumé) : au
  premier fin de tour, `reaffecterMetiers` purge les porteurs de
  métiers absents du référentiel (passage Sans-emploi avec log
  dédié), puis la passe places libres leur redonne un poste.
- **Compatibilité configs** : purge ciblée dans `cfgOf` (patron
  dogmes/événements, SANS bump de `SCHEMA_VERSION_CONFIG` — règle
  (x)) : entrée `Marchand` de `metiers` et `metiersEffets`, effets
  `prodParMetier` de métier `Marchand` des arbres de progrès —
  retirés des configs SAUVEGARDÉES (qui embarquent le référentiel
  fusionné) comme des anciennes.
- **Ce qui ne change pas** : routes vers villes = copie de
  l'aménagement ENTIER à l'origine (production + emplacements de
  métier du bâtiment copié), RIEN côté cible ; cap `maxRoutesJoueur`
  (annoncé, jamais bloquant) ; gratuité ; fermeture ✕ origine seule ;
  purge des vieilles routes `marchandId` au premier fin de tour.

### Plan d'implémentation (proposé)

1. **3a — métiers & emplacements** : référentiel 24 métiers +
   emplacements des aménagements + caps dynamiques par ville +
   bonus de taxe additifs + Garde statique + migrations (état :
   renommages des métiers ; config : pattern (z)) + UI (PopulationTable,
   écran Métiers et places par ville, Référentiels, Paramètres).
   **→ IMPLÉMENTÉE le 2026-10-21** (moteur + UI + migrations état v4 /
   config `metiersAmenagements2026`, 136 tests verts) — voir
   journal-technique.md, entrée « vague 3a ». Exceptions provisoires
   tant que la 3b n'est pas là : les routes commerciales restent
   « telles quelles » (+4 Or/tour + copie, tenues par un Marchand) et
   un Marchand qui TIENT une route occupe un poste créé par elle
   (jamais en surnombre — sinon toute route mourrait à chaque fin de
   tour) ; le métier « Fermier » porte le marqueur `ete` (production
   d'été lu sur le métier, plus sur le Champ). **→ exceptions LEVÉES
   le 2026-10-24 par la sous-vague 3b (point 2)**.
2. **3b — routes dissociées** : après les arbitrages restants.
   **→ IMPLÉMENTÉE le 2026-10-24** (arbitrages complémentaires actés
   le même jour, cf. section « Marchand & routes commerciales
   dissociées » ci-dessus) : moteur (commerce.ts réécrit — routes
   sans personnage, gratuites, joueur OU cité libre ciblée, plus
   d'Or passif, fermeture origine seule, purge des vieilles routes
   `marchandId` ; emplacements des routes portés par le cap
   `capMetierVille` via ctx ; `metiersAccessiblesCite` ouvre Marchand
   aux cités avec routes entrantes ; paramètre `marchandOrTour`
   retiré, `maxMarchandsJoueur` renommé `maxRoutesJoueur`) + UI
   (CommerceRoutes formulaire cascade origine → cible, routes
   entrantes affichées sans ✕, badge cap routes, carte Métiers et
   places avec ctx, fiche cité avec routes entrantes) + tests
   (commerce.test.ts réécrit, 140 verts). Voir journal-technique.md,
   entrée « routes commerciales dissociées — sous-vague 3b (2) ».
   NB (soir 2026-10-24) : les extensions PROPRES au Marchand de ce
   point (emplacements +1 par route chaque côté, `capMarchandsCite`,
   Marchand accessible aux habitants des cités) sont ABROGÉES le
   jour même par la suppression du métier — point 3 ci-dessous.
3. **Suppression du métier de Marchand** (retour arbitre
   2026-10-24, cf. section dédiée ci-dessus).
   **→ IMPLÉMENTÉE le 2026-10-24** : référentiel (métier + effet wiki
   + notes Marchand retirés, Mine d'Or et « Commerce lointain »
   gardés sans effet, trait Éloquent nettoyé) ; moteur (commerce.ts
   sans `TITRE_MARCHAND`/`capMarchandsCite` ;
   citesLibres.ts `emissairesEffectifsCite` ; metiers.ts sans
   emplacements de Marchand par route + purge des titres disparus
   dans `reaffecterMetiers` ; purge `cfgOf` des entrées Marchand des
   configs) ; UI (CommerceRoutes, CarteCite émissaires+routes,
   CarteMetiersPlaces, AideAuto) ; tests réécrits (140 verts). Voir
   journal-technique.md, entrée « suppression du métier de
   Marchand ».

### Rangs d'habitation & bâtiments tier 1 — VAGUE 3b (actée 2026-10-22)

Reprise de la proposition de Thibaut (habitations et bâtiments de
rang 1). Arbitrages actés lors de la session :

- **Rangs Ville** : Hameau (20 Or + 10 Bois + 6 Bétail, 0 hab.
  requis) → base 50 Chasseurs, 2 Gardes, 1 Commerçant, 1
  Gouverneur ; Cité (40 Or + 8 Bétail + 6 Pierres, 120 hab.) →
  30 Chasseurs, 4 Gardes, 5 Commerçants, 1 Gouverneur ; Grande Cité
  (40 Or + 12 Bétail + 12 Charbons, 200 hab.) → 8 Gardes,
  10 Commerçants, 1 Gouverneur.
- **Rangs Château** : Motte (20 Or + 12 Bois + 2 Bétail) → 40
  Chasseurs, 4 Gardes, 1 Gouverneur ; Donjon (40 Or + 2 Bétail +
  12 Pierres, 120) → 20 Chasseurs, 8 Gardes, 1 Gouverneur ;
  Forteresse (120 Or + 10 Pierres + 12 Fer, 200) → 16 Gardes,
  1 Gouverneur.
- **« Domiciles disponibles »** (ex-« Habitations disponibles »,
  ex. 50 maisons, 10 Auberge) : **AFFICHAGE SEUL** pour l'instant —
  aucun effet moteur (à câbler plus tard).
- **Consommation par tour et garnison de base des RANGS :
  SUPPRIMÉES** (« les Gardes font tout ») — la garnison d'une ville
  vient des Gardes en poste (+garnisonParGarde statique, vague 3a)
  et des bâtiments ; les fonctions moteur deviennent des no-ops.
  NB : garnisons des régimes (garnisonParRang Autoritarisme),
  ministères (Connétable) et bâtiments rang 2+ restent telles
  quelles — **point ouvert**.
- **Bâtiments tier 1** (emplacements ajoutés à la base du rang) :
  Poste de garde (les deux, 25 Or + 4 Fer) +4 Garde ; Camp de
  bûcheron (les deux) +2 Bûcheron ; Camp de mineur (les deux) +2
  Mineur ; Echoppe (Ville, 10 Or + 3 Bois) +2 Commerçant et
  +1 route commerciale (maxMarchandsJoueur) ; Grange (Ville,
  10 Or + 3 Bétail + 3 Bois) +2 Éleveur, +4 Fermier ; École
  élémentaire (Château, 10 Or + 2 Bétail, consomme 1 Or/tour)
  +1 Professeur et +1 Scientifique (« chercheur » = alias du métier
  Scientifique — arbitré) ; Herses (les deux, 4 Or + 2 Bois,
  bataille de siège) ; Terrain d'entraînement (Château, 12 Or +
  3 Bois) −10 Or sur une levée d'armée dans cette habitation ;
  Conjuratoire (Château, 10 Or + 2 Pierre) +15 Tourisme/tour ;
  Herboristerie (les deux, 10 Or + 2 Pierre) ±5 % contracter/guérir ;
  Ponton (Ville, 5 Or + 5 Bois) +2 Pêcheur et +0,5 Bétail par tour
  et par Pêcheur (gains bruts, taxés comme les autres) — **villes
  côtières uniquement**.
- **Réaffectation automatique** : elle n'attribue JAMAIS les postes
  nobles (Gouverneur) ni les métiers à attribution Armée/Succession/
  Ville — la base du rang les plafonne (surnombre applicable) mais
  ne les remplit pas.
- **Ordre de prise de poste (arbitrage Thibaut, 2026-10-22) :
  « n'importe quel métier → Chasseur → sans métier »** — le métier de
  Chasseur est le DERNIER pris. Un Chasseur en poste CHANGE de métier
  dès qu'un autre poste est disponible (il est prioritaire sur les
  sans-emploi pour ce poste, tri par âge décroissant) ; son poste de
  Chasseur se libère alors pour les candidats suivants, qui ne
  deviennent Chasseurs que s'il ne reste aucun autre poste. Câblé
  dans `reaffecterMetiers` (metiers.ts), testé (métier pris puis
  poste libéré repris par un sans-emploi ; sans autre poste, les
  Chasseurs restent en place).
- **Migration** : les configs sauvegardées sans les colonnes
  « Métiers/Domiciles disponibles » les reçoivent depuis la ligne du
  référentiel par défaut de même (type, rang) ; les anciens champs
  consommation/garnison sont ignorés.
- **« Côtière » = proximité Rivière OU Mer** (arbitrage Thibaut,
  2026-10-22 : toute proximité autre que « Plaine ») — câblé moteur :
  hors proximité, le Ponton n'ouvre aucun poste et son bonus disparaît
  (helper `villeCotiere`, garde-fou d'avertissement à la construction).
- **Purge des anciennes descriptions (2026-10-22)** : la description
  du métier Chasseur du référentiel dit désormais « Dernier métier
  pris (poste de repli) : change de métier dès qu'un autre poste est
  disponible » ; les six rangées de rang « Consomme X par tour.
  Y Garnison. » ont été retirées du référentiel
  (batimentsVille/batimentsChateau) — consommation et garnison de
  base des rangs n'existent plus.
- **Retrait du code mort (2026-10-22, retour Thibaut sur la revue
  critique des habitations)** : purgé du moteur et de l'UI tout ce qui
  ne produisait plus d'effet — `garnisonBaseVille`, `consommationsVille`,
  `consommationsPays`, `appliquerConsommationsHabitations`, `fmtCourt`,
  l'étape moteur 3octies, le canal « habitations » des récaps (Conso
  villes) et ses colonnes mortes (VilleCarte « Conso. habitation »,
  récaps « Conso villes »), la ligne « base du rang » du détail de
  garnison ; le **Grand veneur** est retiré du référentiel et filtré des
  configs embarquées (17 portefeuilles) ; la table dupliquée
  `rangsHabitation` est retirée (referentiels.json, interface, défauts,
  replis « ancien format »). La production des habitations et leurs
  emplacements restent intacts.
- **Dette legacy retirée (2026-10-23, retour Thibaut — revue
  structure/SOLID)** : les tables pré-canonicalisation
  (`batimentsVille`, `batimentsChateau`, `batimentsCouts`,
  `amenagements`) disparaissent — `normaliserBatiments()` dérive
  tout de la table canonique `constructions` ; le repli
  `coutBatiment` (texte legacy) est supprimé au profit du seul
  chemin canonique. **Formats unifiés** : les métiers sont
  TOUJOURS au singulier ; `metiersBase` est un tableau structuré
  `[{metier, places}]` (plus de chaîne `metiersDisponibles`, plus
  de parsing runtime, migration idempotente des configs
  persistées). **Lookup unique** (type,rang) partagé partout.
  Les effets moteur des constructions sont en données dans le
  référentiel (`ecoleRang`, `malContraction`, `bonusGuerison`,
  `bonusGuerisonGlobal`).
- **Points ouverts** : garnisons hors-rang (régimes, ministères,
  bâtiments rang 2+) inchangées ; **Guilde des médecins**
  (bonusGuerisonGlobal 0,10) — arbitrer coût et constructibilité ;
  scalabilité (mémoïsation) : vague SUIVANTE après la vague 2
  (arbitrage Thibaut 2026-10-23 : vague 2 SOLID d'abord).
  Vague 2 SOLID ARBITRÉE le 2026-10-23 et IMPLÉMENTÉE le
  2026-10-24 (cycles d'imports 25 → 0, ports ctx.ports,
  Ponton→proximité, Grand bailli supprimé — cf. bullet vague 2
  ci-dessous) ; la façade engine.ts est SUPPRIMÉE le 2026-10-24
  (tour.ts + edge.ts — fin de la vague 2).
- **Simplification provisoire (2026-10-23, retour Thibaut « alléger
  pour dérouiller »)** : la SANTÉ est ignorée pour l'instant ; les
  constructions de rang d'habitation 2+ sont SUPPRIMÉES du
  référentiel (118 → 41 — bâtiments et aménagements, tiers 2/3 et
  Chapelle compris ; la mécanique d'amélioration reste en place,
  les tests la couvrent avec des defs réinjectées localement).
  Hotfix du soir : `cfgOf` FILTRE AUSSI les rangs 2+ des configs
  MONDE sauvegardées avant (la complétion n'ajoutait que les
  manquantes sans retirer les disparues — un « Moulin à vent »
  restait constructible dans une NOUVELLE partie) ;
  les derniers reliquats des RÈGLES DE FACTIONS partent des fiches
  peuples ; les MINISTRES sont supprimés EN TOTAL (module, effets,
  UI, table référentiel, colonne paysRangs — migration d'état v2
  no-op, l'étiquette « Ministre » des vieux états est inoffensive) ;
  la mécanique d'ÉDUCATION est supprimée EN TOTAL (labels,
  événements, table educations, champ des métiers, attribution
  'Education', contrainte de validation, paramètres
  chanceEduc*/profBonusEduc) — les Professeurs, les écoles
  (ecoleRang) et la migration scolaire RESTENT. Points ouverts
  mis à jour : Guilde des médecins CLOSE (santé ignorée) ;
  scalabilité toujours remise à plus tard ; retour des rangs 2+ /
  ministres / éducations à arbitrer quand le jeu sera dérouillé ;
  vague suivante VALIDÉE par Thibaut : redécoupage engine.ts (S) et
  couche ports/contrats (D) — design à présenter au prochain tour.
- **Retrait INTÉGRAL des règles de factions (complément 2026-10-24,
  retour arbitre « vide toutes les lignes de règles + les
  descriptions, ne garde que les noms »)** : les fiches des 6 peuples
  (Basiléens, Peaux Vertes, Elfes d'Or, Sylvains, Norls, Vermvres de
  Kaoss) sont VIDÉES — descriptions et lignes de règles supprimées,
  seuls les NOMS restent (la structure des fiches est conservée pour
  les recevoir à nouveau). L'onglet Peuples n'affiche plus que les
  noms ; les fiches sont à redéfinir par l'arbitre. Plus AUCUNE règle
  affichée ne promet un effet que le jeu ne tient plus.

### Déménagement : perte du métier ET du domicile (arbitré 2026-10-21, vague 3a ; complément Dirigeant/Héritier le même soir)

- **Règle** : un habitant qui CHANGE d'habitation (il déménage vers
  une autre ville) **perd son métier ET son domicile** — les postes à
  emplacements sont créés par les aménagements de la ville qu'il
  quitte, le domicile est un bâtiment de cette ville. Il redevient
  Sans-emploi (rôle neutre, impôt nul) jusqu'à la réaffectation de fin
  de tour ; un Gouverneur perdu ainsi est re-désigné automatiquement
  (noble le plus âgé de la ville, règle (w)).
- **Sites de déménagement réels** (le moteur y applique
  `perteDemenagement`) : don du personnage à un autre porteur
  (`deplacerPersonnage` — joueur ou cité libre), mariage chez le
  conjoint (`marierPersonnages`), migration automatique de population
  (`migrerPopulation`), cour ré-ancrée après transfert de ville
  (`transfererVille` — la cour suit son joueur mais change de ville),
  nobles ré-ancrés ville → cité libre (`citesLibres.ts`). NB : la
  SUPPRESSION de ville n'y figure plus — depuis l'arbitrage du
  2026-10-21 sa population classique est effacée et sa cour reste
  telle quelle (pas de changement d'habitation).
- **Exceptions** : le RENOMMAGE d'une ville (même ville, nouveau nom)
  et le TRANSFERT DE PROPRIÉTÉ d'une ville (les habitants ne bougent
  pas — la population classique suit la ville et garde son poste et
  son domicile ; seule la cour restée derrière, ré-ancrée sur une
  autre ville du joueur, perd les deux).
- **Arbitrage complémentaire (acté 2026-10-21, soir) : un DIRIGEANT ou
  un HÉRITIER ne déménage JAMAIS** — son titre n'est pas perdu par un
  changement d'habitation, aucune succession ne se déclenche :
  - **don** : refusé AVANT toute mutation (« Un Dirigeant ou un Héritier
    ne déménage jamais ») — `deplacerPersonnage` retourne l'erreur,
    personnage inchangé ;
  - **mariage** : le conjoint non ancré DÉMÉNAGE chez le
    Dirigeant/Héritier (inversion de la règle (o) pour ce cas) ; si les
    DEUX époux sont ancrés (Dirigeant/Héritier) dans des cours
    différentes, le mariage est REFUSÉ avant toute mutation ; même
    porteur → mariage normal, aucun déménagement ;
  - **ré-ancrage de cour** (transfert/suppression de ville, ville
    devenue cité libre) : le Dirigeant/Héritier suit sa cour (sa ville
    est perdue, il DOIT suivre) mais GARDE son titre et son domicile
    de fonction ;
  - la migration automatique (`migrerPopulation`) ne déplace QUE des
    enfants : un Dirigeant/Héritier n'y passe jamais.

## Conventions techniques de règles (à respecter en implémentant)

- **Effets structurés** : les constructions (bâtiments + aménagements) portent
  `effets: {ressource, quantite, ete?}[]` ; le champ texte `production` reste en
  repli d'affichage. `RESSOURCES_INSTANTANEES = {Garnison}` (valeur
  d'état) ; le Tourisme est un flux NORMAL dont le stock n'est jamais cumulé —
  recalculé à chaque fin de tour (stock = production, retours arbitre 2026-10-16
  et 2026-10-19 ; le Tourisme copié par une route commerciale compte).
- Un gain instantané crédité (Tourisme, Garnison Connétable) n'est **pas retiré**
  ensuite (démolition ou mort ne rembourse pas) — à arbitrer si l'inverse est voulu.
- Migrations de configuration : passer par `cfgOf`/`convergerConfig` et
  `SCHEMA_VERSION_CONFIG` (voir AGENTS.md) ; le registre versionné
  (`engine/migrations.ts`, champ `schema` sur l'état) gère les évolutions du format
  des sauvegardes — toute nouvelle migration doit y être pure et numérotée.

## Suites possibles (proposées à l'arbitre, non tranchées)

1. ~~Harmonisation des autres dogmes (le Pacifisme seul est refondu).~~
   **CADUC le 2026-10-24** : tous les dogmes sont supprimés du
   référentiel (cf. arbitrages de sessions).
2. ~~Implémentation moteur des effets automatiques du Pacifisme (tribut 40 % par
   joueur via override de `vassalPrelevement`, flux par serment, saisons/âges connus).~~
   **CADUC le 2026-10-24** : le Pacifisme disparaît avec les dogmes ; ne
   redevient d'actualité qu'en cas de retour refondu des dogmes.
3. ~~Purge de l'Influence de tout le référentiel : voie diplomatique, seuils
   « 10 Influence/été », décisions, progrès Délégation/Ambassade/Vassalisation,
   universités, marchands.~~ **FAITE le 2026-10-24** (retour arbitre) : la
   mécanique avait déjà été remplacée par les émissaires (arbitrage
   fondateur) ; les résidus de texte restants (regleCitesLibres, aide
   des cités libres, rangs républicains du diag) sont purgés (cf.
   arbitrages de sessions). L'influence culturelle (tourisme) reste.
4. ~~Vague qualité : assainissement des cycles d'imports `rules/ ↔ engine/`
   (13 cycles) et découpage des 5 grosses vues restantes~~ **FAIT le
   2026-10-24** : le point « 13 cycles » était périmé — ils avaient déjà
   été cassés par la vague 2 SOLID (2026-10-23/24, 0 cycle, graphe
   acyclique) ; le découpage des 5 vues (PopulationTable,
   ReferenceDataPanel, ConfigTables, RoyaumeView, CitesLibresView) est
   fait, sémantique strictement identique (cf. journal technique,
   section « Vague qualité »).
- **Refonte SOLID vague 2 (2026-10-23/24, arbitrages Thibaut « tout
  dans la vague 2 », « une seule config globale modifiable en dehors
  des parties et jamais remodifiée après »)** : la couche rules
  (registre d'effets) n'importe plus le moteur — les usines de règles
  prennent la config convergée en argument (`C: Cfg` requis) et les
  effets lisent des PORTS injectés par le moteur dans le contexte
  (`ctx.ports { C, capitaleDe, rangNiveau, garnisonVille }`) ; les
  25 cycles d'imports du moteur sont cassés (graphe entièrement
  acyclique : indexPopulation, rangs, progresTech, garnisons,
  geographie — nouveaux modules bas niveau ré-exportés par leurs
  modules d'origine) ; **façade engine.ts supprimée** le 2026-10-24 :
  runTurn + sermentsPossedes → tour.ts, entrée bundle Edge → edge.ts,
  20 consommateurs recâblés vers les modules sources ; **Ponton→proximité** :
  « côtière » = TOUTE proximité autre que « Plaine » (l'arbitrage
  2026-10-22 câblé littéralement — une future proximité comptera sans
  toucher au code) ; **Grand bailli** supprimé (« c'est un ministre,
  on supprime pour l'instant ») — plus aucun effet moteur ni mention
  code. Scalabilité (mémoïsation du cfgOf par référence) : vague
  suivante.
- **Vague scalabilité (2026-10-24, mémoïsation actée)** : la condition
  de sûreté actée vague 2 (« une seule config globale, jamais
  remodifiée après adoption ») est désormais PORTANTE — cfgOf est
  mémoïsé par RÉFÉRENCE de config (WeakMap) : une config éditée EN
  PLACE au lieu d'être remplacée par une nouvelle référence servirait
  un cache périmé, la règle de remplacement doit donc rester
  intangible. L'index de population (id → vivant) devient chirurgical
  (naissance/décès en O(1), le mariage n'y touche plus) et la
  réaffectation des métiers partitionne les vivants par ville une
  fois par joueur. Bench 16 000 habitants : fin de tour ~9,8 s →
  ~2,0 s, état du jeu strictement identique (A/B déterministe
  3 tours). Détail : docs/ia/journal-technique.md.


## Domiciles, bonheur et statut social (2026-10-24, arbitrages Thibaut)

**Domiciles** — SIMPLE : un type = un nom + une qualité 0-4
(Masure 0, Maison 1, Auberge 2, Maison de notable 3, Palais 4 —
la qualité EST le gain de prestige par tour) ;
pas de capacité ni coût (les bâtiments constructibles viendront) ;
le rang de la ville DÉFINIT l'offre (stock `City.domiciles`,
posé à la création et au changement de rang). **Unité (arbitrage
final 2026-10-24, confirmé après l'audit B3 : « 1 personne =
1 maison »)** — l'ATTRIBUTION loge par FOYER (une maison par
famille, 1 place), le BONHEUR mesure par HABITANT (pression
immobilière par tête) : deux échelles volontaires.

**Qualité des métiers** — aménagement = roturier, bâtiment =
bourgeois (Commerçant/Scientifique/Banquier/Troubadour/Professeur/
Garde), lignée nobleSeul = noble. Champ donnée, ne change rien
à l'affectation.

**Bonheur des villes** — moyenne SIMPLE de 5 scores [0-100] :
- Emploi, Logement, Sécurité : formule OPTIMUM symétrique (100
  si offre = demande EXACTEMENT, malus IDENTIQUE en manque et en
  excès : ±25 % → 75, ×2 → 0) ;
- Logement PAR HABITANT (1 logement = 1 habitant logé) ;
- Sécurité : cible = 100 × rang d'habitation ;
- Santé : 100 − % de malades ;
- Tourisme : part du joueur dans le tourisme MONDIAL (une course) ;
- Indicateur PUR pour l'instant (aucun effet natalité/impôts).

**Prestige et rangs sociaux** — le prestige est FAMILIAL :
- convergence des couples (moyenne + gain commun) ;
- héritage à l'âge adulte : 50 % du prestige MOYEN des parents,
  joué une fois (la génération fondatrice sans parents n'hérite
  pas — elle part de 0) ;
- rangs dérivés : < 100 roturier, ≥ 100 bourgeois, ≥ 250 noble ;
  anoblissement AUTOMATIQUE pour l'instant (la grâce du souverain
  reste une piste) ;
- gain par tour : −2 sans emploi / sans domicile / malade,
  domicile +0..+4 (qualité −1), métier +2 bourgeois / +5 noble,
  +1 si bonheur de la ville > 50 ;
- mariages LIBRES + bonus de même condition (mariageMemeRang
  +0,10 — aucune interdiction entre conditions).

**Chute** — par érosion naturelle du prestige (les conditions qui
se dégradent l'usent ; à 0 le foyer retombe roturier). Journal
des changements de rang (📈 bourgeoisie, 👑 noblesse, 📉 chutes).

## La cour, le rang de naissance et les logements (arbitrages Thibaut, 2026-10-26)

**Rang d'un personnage (rangDe)** — le rang affiché (colonne
« Dynastie · Rang », page Population) tient compte de la NAISSANCE :
- dynastie NOBLE → NOBLE DE NAISSANCE, quel que soit le prestige ;
- dynastie roturière → rang du prestige (roturier < 100,
  bourgeois ≥ 100, anobli ≥ 250).

**300 prestige de base pour les nobles de naissance**
(PRESTIGE_NOBLE_NAISSANCE) :
- posé à la CRÉATION du personnage (setup — couple royal, fratrie,
  enfants ; naissances — bébé de dynastie noble, bâtard noble
  inclus ; familles nobles ajoutées en cours de partie, joueurs et
  cités libres) ;
- héritage avec PLANCHER : à l'âge adulte, un enfant de dynastie
  noble ne peut pas hériter sous 300 (au-dessus, l'héritage normal
  prime — 50 % de parents à 700+700 = 350) ;
- 300 ≥ 250 → le noble de naissance est noble AUSSI par le
  prestige : consommation Nourriture noble, hébergement prioritaire
  dans l'ordre de service, score de mariage — sans règle spéciale.

**La cour** (tableau supérieur de la page Population) — appartenance
par RANG : nobles de naissance + roturiers anoblis par le prestige.
La famille dirigeante y siège DÈS LE DÉPART. Le mariage manuel reste
limité aux maisons de DYNASTIE noble (un anobli de dynastie
roturière reste refusé — la question reste ouverte).

**Colonnes du tableau population** — « Dynastie » et « Rang »
FUSIONNÉES en une seule cellule : nom de dynastie + badge de rang +
prestige en muted.

**Logements** —
- la CAPITALE démarre avec 8 PALAIS (à la place de la Maison de
  notable du rang de départ) : servie la première dans l'ordre de
  prestige décroissant, la famille dirigeante (nobles de naissance
  à 300) y vit ;
- les TYPES DE LOGEMENT (table domiciles : Taudis 0, Maison 1,
  Auberge 2, Maison de notable 3, Palais 4) sont visibles dans les
  Référentiels (onglet « Habitations ») et éditables dans les
  Paramètres (onglet « Habitations ») ; la qualité 0-4 d'un logement
  EST son gain de prestige par tour pour l'habitant logé.

**Convention UI** (retour Thibaut 2026-10-26) — les textes de
l'interface ne citent plus les arbitrages ni les retours de session :
le contexte de design vit dans CE document (les tooltips de la page
Population ont été nettoyés en conséquence).

## Le mariage manuel suit le RANG (arbitrage Thibaut, 2026-10-27)

« Le mariage manuel reste limité aux nobles, mais un bourgeois qui
devient noble doit pouvoir être marié manuellement. »

- **Avant** : le mariage manuel (bouton « 💍 Marier avec… » de la page
  Population, moteur `marierPersonnages`) exigeait une DYNASTIE noble
  chez les deux époux — un roturier anobli par le prestige (rang
  noble à 250+) restait exclu.
- **Après** : l'éligibilité suit le RANG (`rangDe`) — sont mariables
  les personnages de rang **noble**, c'est-à-dire :
  - nobles de NAISSANCE (dynastie noble, base 300), ou
  - roturiers ANOBLIS par le prestige (250+, rang « noble »).
  Un bourgeois (100-249) ou un roturier (< 100) reste exclu.
- Le moteur (`marierPersonnages`) et le picker de l'interface
  (`eligibleMariage`) appliquent la même règle : deux sites, un seul
  critère. Les autres gardes-fous ne changent pas (majeurs, vivants,
  célibataires, même porteur pour le picker, déménagement chez le
  conjoint).

## Les effets des bâtiments et les routes commerciales (arbitrage Thibaut, 2026-10-27)

« Les effets des bâtiments ne sont pas clairs. J'ai l'impression qu'ils
sont codés en dur, alors que la banque sert justement à éviter ça, et
je ne vois pas dans l'échoppe la possibilité de posséder une route
commerciale supplémentaire. »

**Où vivent les effets d'un bâtiment** (règle d'architecture, rappel) :
- flux de production (Or, Nourriture, Tourisme, Charbon…) et Garnison
  → la BANQUE D'EFFETS (rules/registry → contributionBanque), dont la
  source est le champ structuré `effets` du référentiel ;
- emplacements de métiers → champ `emplacements` ;
- logements → champs `taudisApportes` / `domicilesApportes` ;
- santé / écoles → champs `ecoleRang`, `malContraction`,
  `bonusGuerison`… ;
- et désormais ROUTES commerciales → champ **`routesApportees`**.

**Le cas des routes** : le cap conseillé de routes commerciales
(`maxRoutesJoueur`) comptait des NOMS de bâtiments codés en dur
(« Plateforme commerciale », « Guilde des marchands », « Echoppe ») —
les deux premiers n'existent même PLUS au référentiel (vestiges du
classeur), et la **Place du marché**, qui promet pourtant « 1 route
commerciale supplémentaire » dans sa description, n'était PAS comptée.
Depuis 2026-10-27 : chaque bâtiment présent apporte ses
`routesApportees` du référentiel (Echoppe [Ville] : 1, Echoppe
[Château] : 1, Place du marché : 1), le moteur somme le champ pour
toutes les villes du joueur (bon groupe Ville/Château), et le résumé
affichable (picker « + Construire », badges de la carte de ville,
wiki Référentiels → Bâtiments) affiche « +1 route commerciale » —
l'effet de l'échoppe est donc VISIBLE à l'écran. Un bâtiment hors
référentiel n'apporte rien, comme pour toute production. Le cap
reste un cap CONSEILLÉ (jamais bloquant — convention du jeu).

## Coûts, prérequis, métiers et logements : des valeurs, par la banque (arbitrage Thibaut, 2026-10-27)

**Retour Thibaut** : « je veux que le coût ne soit pas textuel mais des
valeurs qui passent par la banque. Idem pour l'attribution de métiers
(champs "valeur"/"métier"), idem pour les logements. »

**Le coût** : le coût d'une construction vivait dans un TEXTE libre du
référentiel (« 25 Or + 4 Fer », « Silo à grain requis, 15 Or + 4 Bois +
4 Bétail ») interprété par une regex (`parseCoutTexte`). Depuis
2026-10-27, chaque entrée porte ses coûts en DONNÉES :
`couts: [{ressource, valeur}]` — 94/94 entrées migrées, 198 paires,
fidélité vérifiée pair à pair (0 écart avec l'ancienne lecture). Le
moteur agrège (`coutConstructionRef`), l'UI affiche le calcul
(« 25 Or + 4 Fer »), l'onglet 🎛 Paramètres édite les paires
(ressource + valeur) via `CoutEditor`.

**Le prérequis** : il vitait DANS le texte du coût, extrait par regex
(« X requis. »). Il devient un champ dédié `requis` (12 entrées :
Caserne → Poste de garde, Place du marché → Echoppe, Clinique →
Herboristerie…), éditable dans Paramètres, lu par
`prerequisConstruction` — règle inchangée : le prérequis doit être
construit dans la MÊME ville (garde-fou non bloquant, ⚠ dans le log).

**Les métiers et les logements passent par la banque** : la banque
d'effets est la voie UNIQUE des effets depuis 2026-10-19, mais les
EMPLACEMENTS de métiers (`emplacements: [{metier, places}]`) et les
LOGEMENTS (`taudisApportes`, `domicilesApportes`) étaient encore lus
en champs AD HOC par le moteur. Depuis 2026-10-27, le registre
(`rules/registry.ts`) les TRADUIT en effets de banque au même titre
que les flux :
- `emplacements` → effets **`placesMetier`** {metier, valeur} ;
- `taudisApportes` / `domicilesApportes` → effets **`logements`**
  {logement, valeur} — les Taudis et les autres domiciles passent par
  le MÊME canal.

La contribution de la banque gagne deux canaux (`placesMetier`,
`logements`), lus par `emplacementsConstructionRef` /
`logementsConstructionRef` (métiers : caps par ville ; logements :
parc de la ville, bonheur, attribution des domiciles). Une
construction porte une règle dès qu'elle a un effet QUELCONQUE.
Les lectures acceptent la config de la partie en argument — les
éditions de Paramètres s'appliquent (effets, emplacements, logements).

**Textes vidés** : les champs textuels `cout`, `production` et
`description` des constructions sont VIDÉS du référentiel (plus aucun
lecteur ; ils restent OPTIONNELS dans le type pour les vieilles
configs). Les colonnes « Production (texte) » et « Description » de
l'onglet Paramètres et du wiki Référentiels sont retirées — le résumé
affichable (`resumeConstruction`), calculé par le moteur, fait foi.

**Compatibilité des configs sauvegardées** : `migrerConstructions`
passe de « ajouter les entrées manquantes » à une complétion CHAMP À
CHAMP par (nom, groupe) — même patron que `migrerFactions`. Les
vieilles configs reçoivent les champs nouveaux (`couts`, `requis`) ;
tout champ sauvegardé garde la priorité (une édition perso survit).

**Camp de bâtisseurs** : sa réduction (5 Or, 1 Bois) est un repli
STRUCTURÉ (champ `reduction` si le Camp entre un jour au référentiel
— mécanisme dormant) — plus d'analyse de description textuelle.

**Idem types d'habitation** (retour Thibaut 2026-10-27, « appliquer
aux types d'habitation les changements faits sur les bâtiments et
aménagements ») : le coût d'amélioration des rangs (Hameau → Grande
Cité, Motte → Forteresse) vit désormais en paires
`couts: [{ressource, valeur}]` — les 6 rangs migrés (Hameau 20 Or +
10 Bois + 6 Bétail… Forteresse 120 Or + 10 Pierre + 12 Fer), texte
`cout` vidé. `coutRang` (engine/habitations.ts) agrège les paires
(`agregerCouts`, partagé avec `coutConstructionRef`) ;
`debiterCoutHabitation` débite le stock à la construction du rang.
L'analyseur de texte `parseCoutTexte` est RETIRÉ du moteur — plus
AUCUN coût du jeu n'est analysé, tout est lu des données. L'onglet
Paramètres édite les paires via `CoutEditor` (même éditeur que les
constructions) ; le wiki Habitations et le sélecteur de rang (page
Pays) affichent le coût calculé. `migrerTypesHabitation` complète
`couts` depuis la ligne du défaut de même (type, rang) — idempotent,
même patron que `domicilesRang`.

## Le registre de règles, vu PAR CANAL (retour Thibaut, 2026-10-27)

La migration « tout par la banque » a fait passer le registre de ~15
règles manuscrites (les seules exceptions) à **90 règles générées**
(une par construction qui a un effet quelconque ; les 4 règles
« merveille » ont disparu le jour même avec la suppression des
merveilles, cf. ci-dessous) — plus rigoureux, mais moins lisible
à l'inspection. Le diag
(`scripts/diag.ts` → `diag-out.txt`, joué par la CI) rend désormais
le registre **filtré par canal** (type d'effet) :

```
total : 86 règles — sources : batiment 40, amenagement 42, regime 1, culture 3
── canal placesMetier : 71 règles ──
  batiment.poste-de-garde@ville — Poste de garde (Ville) : Garde +4 · Taudis +10
── canal logements : 47 règles ──
── canal fluxVille : 9 règles ──
── canal garnisonVille : 1 règle ──
── canal fluxParAmenagement : 1 règle ──
── canal fluxParVilleCultureMonde : 3 règles ──
```

Chaque ligne porte l'id stable, le nom (et le groupe Ville/Château),
les conditions éventuelles (`[si regime=Socialisme, saison=Été]`) et
les effets signés. Un effet bizarre en partie se localise par canal
puis par nom — plus de lecture séquentielle.
(NOTE 2026-10-29, refonte « 12 lois » : l'extrait ci-dessus est
HISTORIQUE — le canal `fluxParVilleCultureMonde` et la source
`culture` sont retirés du registre ; il ne reste que les canaux
des constructions et du régime, 84 règles.) Une règle multi-canaux
apparaît dans chaque canal concerné (le canal est un filtre, pas un
tri) ; un canal inconnu est signalé `⚠`.

## Merveilles supprimées, remplacements purgés, HabitationDef unifié (audit, arbitrages Thibaut 2026-10-27)

À la demande de Thibaut, un audit des modules bâtiments, aménagements,
population et métiers (erreurs, code mort, SOLID, cohérence) a été
suivi de quatre arbitrages :

1. **Suppression de TOUTES les merveilles « pour l'instant »** (retour
   explicite de Thibaut). Les 4 entrées du référentiel (Sanctuaire de
   Salmodiva, Jardins d'Alexandrie, Mont Caracole, Grands bains)
   disparaissent, avec le module `engine/merveilles.ts` (effet
   one-shot, réduction de levée, doublement de Science du Laboratoire
   de Falheim) et `engine/statutAuto.ts` (pastilles vert/jaune/rouge
   — elles ne concernaient plus que les merveilles). Le sélecteur
   « + Construire » n'a plus de catégorie « Merveilles · rang N », le
   wiki n'a plus de famille Merveille, et `SourceRegle` perd la
   valeur `'merveille'` (jamais réutilisable — stabilité des règles
   déjà saisies ; le registre passe de 90 à 86 règles).
   **Compatibilité vieilles parties** (MÀJ le jour même, retour
   Thibaut « on peut supprimer les anciennes parties » puis « oui,
   purge à l'ouverture » — voir la section suivante) : les 4
   entrées encore portées par une config d'avant le retrait sont
   PURGÉES à l'ouverture par la migration v5 ; seuls les bâtiments
   merveilles DÉJÀ CONSTRUITS dans les villes restent dans l'état —
   bâtiments inconnus du référentiel, ils ne produisent rien, pas de
   crash (même logique que les bâtiments rang 2 retirés puis
   réactivés).
2. **Table REMPLACE purgée** : seuls restent les remplacements dont
   les DEUX extrémités existent au référentiel (Camp de
   travailleurs→Camps de bûcheron/mineur, Silo à grain→Grange, Moulin
   à vent→Silo/Grange, Ecole intermédiaire→Ecole élémentaire). Les
   clés et cibles mortes (guildes et écoles supprimées du
   référentiel) partent — la règle « un remplaçant neutralise les
   effets du remplacé » ne change pas.
3. **Code mort retiré** (aucun appelant, aucun test) : `batimentRef`,
   `habitantsRequisVille`, les vues normalisées
   `AmenagementDef/amenagementsDefs/AMENAGEMENTS/amenagementDef`
   (le champ `effet` est vide depuis le passage aux coûts
   structurés), les replis inatteignables de `coutAmenagement`
   (Baleinier, coût forcé 8 Or/3 Bois — le nom est désormais REQUIS
   et un aménagement hors référentiel n'a pas de coût). Les exports
   usage-interne uniquement sont dé-exportés (13 fonctions/types).
   `metiersAccessibles` perd son paramètre joueur inutilisé.
4. **HabitationDef unifié** : l'interface n'est plus définie en
   double (engine/types.ts et config/defaultConfig.ts) — l'unique
   définition vit dans engine/types.ts, importée et ré-exportée par
   la config ; les deux définitions étaient structurellement
   identiques.

L'audit a par ailleurs confirmé SAIN la voie unique banque partout
(flux, métiers, logements, garnisons), le passage de la config à tous
les sites d'appel moteur et l'orchestration population.

## Réalignement automatique des BÂTIMENTS au chargement (arbitrage Thibaut, 2026-10-27 — migration v5)

Après le tour « audit », Thibaut constate sur sa partie (Ctrl+F5) :
« tu as récupéré les anciennes règles des bâtiments, par exemple le
bûcheron qui donne du bois plutôt que des emplacements de bûcheron ».

**Diagnostic** : la config vit DANS la partie sauvegardée. Les parties
d'avant le rework « production → emplacements » portent encore les
vieux effets de flux (`effets: [{Bois, 1}]` pour le Camp de bûcheron),
et `migrerConstructions` fusionne champ à champ `{...défaut, ...entrée}`
— le champ SAUVEGARDÉ prime, donc le vieux flux survivait alors que
les `emplacements` absents étaient complétés par le défaut : le
bâtiment produisait le Bois de l'ancienne règle ET les emplacements de
la nouvelle (double comptage). Les parties à tampon ≥ 4 ne repassaient
plus par les migrations, figeant le problème.

**Arbitrage** : « on peut supprimer les anciennes parties, et oui, le
réalignement doit être automatique au chargement. »

1. **SCHEMA_VERSION_CONFIG 4 → 5** : les configs tamponnées v4
   repassent UNE fois par le bloc de migrations (patron règle (x)).
   Les vieilles parties sont jetables — la résurrection éventuelle
   d'entrées disparues est acceptable.
2. **`realignerAmenagements` devient `realignerConstructions`** : le
   réalignement v4 (aménagements, vague 3a) s'étend aux BÂTIMENTS.
   Toute construction du référentiel est une donnée de RÉFÉRENCE,
   pas de personnalisation : toute entrée de même (nom, groupe) est
   REMPLACÉE par l'entrée courante du référentiel (effets,
   emplacements, couts, textes). Les constructions PERSO (clé absente
   du référentiel) sont conservées telles quelles, et une édition
   saisie APRÈS la convergence survit aux re-lectures (le
   réalignement ne joue qu'une fois, à la migration).
3. **Purge des merveilles à l'ouverture** : les 4 merveilles encore
   portées par les vieilles configs disparaissent à la migration v5
   (filtre `famille !== 'Merveille'` avant le réalignement) — le
   « (52) » constaté dans l'onglet Paramètres redevient 48. Les
   bâtiments merveilles déjà construits restent dans l'état.

Verrous : config.test.ts — réalignement du Camp de bûcheron
pré-rework (effet de flux disparu, emplacements `2 Bûcheron`, couts
du référentiel), purge des 4 merveilles, perso conservé, idempotence,
édition post-convergence non écrasée ; les tests des migrations
ciblées passent leurs configs à schemaVersion 5.

## La case requise dans le titre des aménagements (arbitrage Thibaut, 2026-10-27)

« Pour les aménagements, met la case requise entre parenthèses dans le
titre de l'aménagement. » Le titre affiché partout (picker
« + Aménager une case… », badge d'un aménagement construit, wiki)
est « nom (case requise) » : « Baleinier (Baleine) », « Champ
(Plaine) », « Baleinier (tier 2) (Baleine) » — les parenthèses
viennent APRÈS le nom complet des tiers. Un aménagement perso sans
case requise reste au titre nu.

- Les parenthèses sont un pur AFFICHAGE : jamais stockées dans
  l'état ni la config — l'éditeur des Paramètres édite le nom brut
  (champ `terrain` à part), le picker embarque le nom brut en
  `value`.
- Les anciens emplacements de la même info sont retirés pour éviter
  le doublon : suffixe « · terrain » à droite du coût du picker,
  suffixe « (terrain) » du résumé muet du badge, colonne Terrain du
  wiki.

## Le 4e tableau « Métiers » de la carte de ville (arbitrage Thibaut, 2026-10-27)

« Ajouter un nouveau tableau avec les 3 tableaux de logement, culture et
garnison, qui recense tous les métiers disponibles et occupés. » Le bloc
POPULATION, GARNISON & LOGEMENTS de chaque carte de ville porte un
4e tableau « Métiers : N en poste » :

- une ligne par métier OCCUPÉ (en poste > 0) ou DISPONIBLE (cap
  finie : base du rang d'habitation + emplacements des bâtiments et
  aménagements), la ligne Sans-emploi toujours présente (rôle
  neutre — impôt nul, aucun effet) ;
- colonnes : en poste · places libres (« — » pour les métiers non
  plafonnés ici : rôles de cour, armée, Banquier, Troubadour,
  Dirigeant/Héritier…) ; le surnombre s'affiche en rouge ;
- pied de tableau : habitants en poste / vivants de la ville ;
- mêmes données que le panneau Population (helper moteur
  occupationsMetierVille) : aucune règle nouvelle, aucune logique
  dupliquée — la carte de ville et le panneau Population ne
  peuvent pas se contredire.

## Le régime des taxes PAR RESSOURCE (arbitrage Thibaut, 2026-10-28)

« J'aimerais maintenant changer les taxes : faibles avec naissances et production
nourritures ×1,25, mais toutes les autres productions ×0,75. Normales. Hautes
avec naissances et production nourritures ×0,75, mais toutes les autres
productions ×1,25. » Le niveau de taxes d'une ville (et des cités libres) module
la production des habitants **ressource par ressource** — la **Nourriture part
du côté des naissances**, toutes les **autres ressources à l'envers** :

| Niveau | Naissances | Nourriture | Autres productions |
| --- | --- | --- | --- |
| Faible | ×1,25 | ×1,25 | ×0,75 |
| Moyenne | ×1 | ×1 | ×1 |
| Forte | ×0,75 | ×0,75 | ×1,25 |

- **Portée inchangée** : le facteur module la production des MÉTIERS des
  habitants (c'est « ce que les taxes rapportent ») — bâtiments, aménagements,
  lignes « Autres », commerce et proximité ne sont PAS taxés ; la consommation
  de Nourriture reste non taxée. Idem cités libres (transfert au suzerain) —
  le facteur s'applique après la règle « Chasseurs ×1,1 » propre aux cités.
- Les bonus de taxe (Gouverneur +10 %, Banquier/Professeur/Troubadour +10 % sur
  leur ressource) restent ADDITIFS par ressource, appliqués APRÈS le facteur de
  niveau de taxes.
- **Paramètres** (groupes « Taxes ») : nouvelles clés `taxNourrFaibles`/`taxNourrHautes`
  (1,25/0,75) ; les clés historiques `taxOrFaibles`/`taxOrHautes` (0,75/1,25)
  changent de SENS — elles ne portent plus que les ressources hors Nourriture
  (valeurs inchangées, les configs sauvegardées restent valides) ;
  `taxNaissFaibles`/`taxNaissHautes` (1,25/0,75) ne bougent pas (marqueur (z),
  reconfirmé).
- Les multiplicateurs ne s'appliquent PAS à ce que la Nourriture a de spécial :
  la « Nourr - été » des aménagements et la proximité restent hors taxes.

## Les armées par la banque (arbitrage Thibaut, 2026-10-28)

« Je me fiche qu'ils vivent dans les paramètres, général et soldat sont des
métiers, ils doivent donc vivre dans la banque, tout ce qui est logique de se
trouver en banque doit rejoindre la banque. » — les données d'armée qui avaient
une FICHE naturelle migrent du pot commun des paramètres vers le RÉFÉRENTIEL,
et les réductions de levée deviennent un CANAL de la banque comme les flux :

- **Puissances et âges → LIGNES DE MÉTIER** (onglet Métiers du référentiel) :
  Soldat `puissanceArmee` 15, `ageMin` 16, `ageMax` 30 ; Commandant
  `puissanceArmee` 45. Lues par `puissanceArmeeMetier(metier, C, repli)` et
  `agesRecrutementSoldat(C)` (engine/armees.ts) — le recrutement, le calcul de
  puissance et l'init de levée suivent la fiche éditée immédiatement.
- **Réductions de levée → FICHES DE CONSTRUCTION** (champ `reductionLeveeArmee`),
  traduites par le registre en effet de banque `reductionLeveeArmee` (type
  RESTAURÉ le 2026-10-28 avec un producteur — il avait été purgé le 2026-10-24
  « sans producteur ») :

  | Construction | Groupe | Réduction de levée |
  | --- | --- | --- |
  | Terrain d'entrainement | Château | 10 Or |
  | Ecole militaire | Château | 25 Or |
  | Guilde des explorateurs | Château | 20 Or |
  | Grande caserne | Capitale | 8 Or |

  Le canal s'agrège dans la contribution (`reductionLeveeArmee`) et se lit par
  `reductionLeveeBatiments(ville, C)` : `prixArmee(puissanceCible, C, ville)`
  facture `armeePrixOr` Or par tranche de `armeePriXPuissance` points, MOINS la
  somme des réductions des bâtiments de la VILLE DE LEVÉE (plancher 0). La levée
  se passe dans une habitation (retour 2026-10-15) : les aménagements ne
  comptent pas, seuls les bâtiments de la ville s'appliquent.
- **Périmètre inchangé** : les prix de base `armeePrixOr` (1) et
  `armeePriXPuissance` (2) RESTENT en paramètres (aucune fiche naturelle) ;
  la garnison des Gardes (`garnisonParGarde`) reste HORS périmètre armées.
- **Flag mort retiré** : `prochaineArmeeReduite` (Stratégies militaires I,
  −50 Or sur la prochaine levée, revue 2026-10-15) était mort depuis la purge
  du système de progrès du 2026-10-24 (aucun producteur) — arbitrage : « garde
  la fonction en banque mais retire cet effet précisément ». Le champ
  disparaît du type et de prixArmee ; une vieille sauvegarde qui le porte
  encore se charge sans erreur (champ inconnu ignoré).
- **Migration `armeesBanque2026`** (marqueur (z), sans bump de tampon) : les
  configs sauvegardées AVANT l'arbitrage portent les valeurs dans les
  paramètres — la migration les SÈME sur les lignes de métier et les fiches de
  construction (en préservant tout champ déjà défini), puis pose le drapeau.
  Les 4 paramètres historiques (`puissanceSoldat`, `puissanceGeneral`,
  `soldatAgeMin`, `soldatAgeMax`) restent des REFLIS de compatibilité :
  lus uniquement si la ligne ne porte pas le champ, plus éditables dans
  l'onglet Paramètres (retirés de PARAM_META).
- **UI** : la page Armées lit les métiers dynamiquement (titre « Soldat 15 pts,
  Commandant 45 pts » dérivé, paragraphes d'âge et de prix dynamiques) ;
  l'onglet Métiers du wiki gagne une colonne « Armée » (puissance + âges) ;
  l'éditeur des constructions gagne une colonne « Réduc. levée (Or) » ;
  `resumeConstruction` affiche « levée d'armée −N Or » (picker, badges, wiki).

## Pertes, renfort et retrait de la cible (arbitrage Thibaut, 2026-10-28)

> ⚠ AMENDÉ LE MÊME JOUR (2e retour) — voir la section suivante : le point 1 ci-dessous
> (dérivation pour les armées suivies) est ABANDONNÉ. La puissance stockée fait foi
> pour TOUTE armée, et les pertes abaissent AUSSI la puissance cible.

Trois retours arbitre après la session « les armées rejoignent la banque » :

1. **Pertes d'une armée non suivie** (bug « infliger des pertes réduit l'armée à 45 à
   chaque fois ») : une armée dont `soldats` est vide — levée fraîche pas encore passée
   par le recrutement d'un tour, ou import du classeur — n'adosse sa puissance à AUCUN
   personnage. Sa puissance **STOCKÉE fait foi** : les pertes y sont **soustractives**
   (nb × points du Soldat, + points du Commandant s'il tombe), sans tuer personne et
   SANS dérivation — l'ancienne dérivation `soldats × 15 + commandant` l'écrasait à son
   seul commandant (45), quel que soit le nombre de pertes. La fin de service y est
   soustractive aussi (le commandant libéré redevient Chasseur). Une armée **suivie**
   (soldats non vide) garde son comportement : soldats réels tués, puissance dérivée.
   `recomputeArmy` reste une dérivation pure — contrat : ne l'appeler QUE sur une
   armée suivie (les mutateurs capturent « suivie » AVANT les kills, pour qu'une armée
   dont tous les soldats tombent retombe juste à 0 ou au commandant survivant).
   Un commandant mort entre deux tours coûte ses points à l'armée non suivie (détaché,
   −45 sur la stockée).
2. **Renfort** (« considéré en tout point comme une levée d'armée au sein d'une armée
   existante ») : même prix que la levée (Or × pts / armeePriXPuissance), mêmes
   **réductions de la ville de renfort** (canal `reductionLeveeArmee`), Or débité une
   fois, **puissance cible relevée de N** — le recrutement de chaque tour comble
   l'écart par de vraies recrues. Pour une armée non suivie, les premières recrues la
   font passer en dérivation (migration vers le suivi) : sa puissance devient alors
   celle de ses soldats réels — si la population manque de candidats, l'écart s'affiche
   tel quel (vérité des nombres).
3. **Retrait de la case « cible »** : la sélection d'un joueur visé ne servait à rien
   — champ `cible` retiré du type `Army` et de l'UI (note RETRAIT in situ) ; une
   vieille sauvegarde peut encore porter la clé, elle est ignorée.

## La puissance stockée fait foi ; les pertes abaissent la cible (arbitrage Thibaut, 2026-10-28, 2e retour)

Suite du renfort déployé ce matin : le renfort fonctionne, mais les pertes et la fin de
service font encore retomber une armée à 45. Cause : les recrues du renfort faisaient
passer l'armée au modèle « suivie », et toute perte RE-DÉRIVAIT la puissance depuis les
soldats survivants — 2 recrues tuées dans une armée de plateau de 200 pts → 0 soldat +
commandant = 45. Décisions :

1. **Plus aucune dérivation** : la puissance STOCKÉE d'une armée — sa valeur de plateau,
   levée, renfort ou pertes décomptées — n'est JAMAIS recalculée depuis ses soldats,
   qu'elle les suive ou non. `recomputeArmy` (dérivation soldats × pts + commandant)
   est RETIRÉ du moteur.
2. **Pertes et fin de service soustractives sur la puissance ET la puissance cible** :
   N pertes = −N × points du Soldat, + points du Commandant s'il tombe (plancher 0 sur
   les deux) ; les soldats réellement suivis meurent (ou redeviennent Chasseurs),
   jusqu'à N ; une armée non suivie ne perd que des points.
3. **Pas de remplissage automatique** : la cible suivant les pertes, l'armée ne se
   re-remplit pas au tour suivant. Le renfort (ou une levée) relève la cible ; le
   recrutement de chaque tour comble l'écart en AUGMENTANT la stockée de la valeur des
   recrues — sans jamais la re-dériver. Un commandant mort entre deux tours est détaché
   et coûte ses points, la vacance se comble par recrutement (la cible est intacte).

   AMENDEMENT (3e retour, même jour) : le point « une armée non suivie ne perd que des
   points » est CADUC — l'armée est liée à la population, cf. section suivante.

## L'armée est liée à la population ; les pertes tuent de vrais habitants (arbitrage Thibaut, 2026-10-28, 3e retour)

Deux retours d'arbitre sur le panneau Armées : (1) « plutôt que des champs textes pour
pertes, ajouts et levée d'armées, affichez un menu déroulant, ce sera plus simple » ;
(2) « l'armée est liée à la population, donc des pertes dans une armée doit tuer des
habitants ». Décisions :

1. **Les pertes tuent de VRAIS habitants** : les soldats réellement suivis meurent
   d'abord (ordre d'engagement), puis le COMPLÉMENT est pris parmi les candidats
   RECRUTABLES — mêmes critères que le recrutement : vivants, aux âges de la ligne
   Soldat (16-30 ans par défaut), sans armée, métier libre ou Chasseur — dans l'ordre
   du recensement. Un Dirigeant ou un homme d'âge mûr ne meurt pas au front. Le pool
   épuisé, les points SEULS continuent de baisser (plancher 0).
2. **Fin de service symétrique** : au-delà des soldats suivis, le complément est
   démobilisé parmi les mêmes candidats recrutables, qui quittent la vie civile et
   redeviennent Chasseurs (convention Dissoudre) — ils restent vivants et productifs.
3. **Menus déroulants** : plus AUCUN champ de saisie — pertes (1 à 20, « N pertes
   (−N × pts) »), renfort (+15 à +300 pts, prix de levée affiché par option), puissance
   cible de levée (45 à 300 pts, prix affiché par option). `NumberInput` retiré du
   panneau Armées.
4. **Journal des armées enrichi** : pertes et fin de service listent les noms des
   tombés / libérés, pour lecture immédiate au fil du recensement.

## Flux de migration par bonheur (arbitrage Thibaut, 2026-10-28, 2e arbitrage du jour)

« J'aimerais un flux de migration en fonction du bonheur : plus le bonheur est bas, plus un
habitant a de chances de quitter sa ville, pour une autre ville aléatoire, pondérée par la
culture similaire et le bonheur de chacune des villes. » Décisions (retours explicites
Thibaut : linéaire « entre 0 % et 10 %, le 10 % à 0 de bonheur et le 0 % à 100 » ;
destinations « toutes les villes du monde » ; exclusions « tous les vivants sauf Dirigeant
et Héritier ») :

1. **Départ LINÉAIRE** : à chaque fin de tour, chaque habitant vivant (sauf Dirigeant et
   Héritier, qui ne déménagent jamais — règle 2026-10-21 — et sauf soldats/commandants
   EN ARMÉE : l'armée lie l'habitant, cf. « L'armée est liée à la population » ; AMENDEMENT
   du jour) quitte sa ville avec
   `p = migrationBonheurMax × (100 − bonheur de sa ville) / 100` — 0 % à 100 de bonheur,
   5 % à 50, 10 % à 0 (défauts). Bonheur = la moyenne des 5 facteurs du système de
   bonheur (2026-10-24), calculé une fois par ville et par tour.
2. **Destination pondérée, pas filtrée — v2 (retour Thibaut, 3e arbitrage du
   jour)** : tirage parmi TOUTES les villes du monde (tous joueurs, transfert physique
   de population au besoin — même principe que l'ancienne migration scolaire ; les
   cités libres ne sont pas destinations), chaque ville candidate pesant
   `poids = (ville du MÊME JOUEUR ? migrationBonheurMemeJoueur : 1) × (culture
   identique à celle du migrant ? migrationBonheurCulture : 1) × (1 + bonheur de la
   candidate / 100)` — une ville du même joueur pèse 1,5× (défaut : la migration
   interne est privilégiée), une ville de SA culture 1,25× (défaut — le ×4 de la mise
   en place du matin est REMPLACÉ), une ville à 100 de bonheur pèse 2× une ville à 0 —
   les trois effets se multiplient. Exclusion de la ville source PAR IDENTITÉ
   (plusieurs joueurs peuvent avoir une ville homonyme, ex. « Capitale ») — la seule
   exclue du tirage : un personnage peut REVENIR vers une ville d'où il vient (retour
   Thibaut explicite : « ce n'est pas un bug »).
   AMENDEMENT v3 (6e arbitrage, 2026-10-29 : « la formule se base sur le
   bonheur et tous les autres modificateurs sont additifs ») :
   `poids = attrait × (1 + même joueur + culture identique + bonus du
   tiré)` — l'attrait `1 + bonheur/100` (×[1 ; 2]) reste la seule base
   multiplicative ; défauts +0,5 même joueur, +0,25 culture, +1
   emploi/logement pour qui manque. Exemple arbitre : culture + même
   joueur = attrait × 1,75. Le multiplicatif v2 ci-dessus est REMPLACÉ
   (historisé).
3. **Conséquences** : tout déménagement applique `perteDemenagement` (métier ET domicile
   perdus — convention établie) et journalise en type « Système » avec le motif
   « cherche meilleure vie » ; un habitant ne migre qu'UNE fois par tour.
4. **Placement étape 4bis** (après tous les moteurs de population) : un migrant n'est
   pas retraité (vieillissement, maladie) au même tour chez son nouveau porteur —
   l'ancienne migration scolaire vivait DANS populationTurn et cumulait ces effets.
5. **Paramètres** (groupe Population) : `migrationBonheurMax` (0,10),
   `migrationBonheurCulture` (1,25 — v2) et `migrationBonheurMemeJoueur` (1,5 — v2,
   NOUVEAU). Pas de plafond par ville : la linéarité 0-10 % fait foi. À proba max 0,
   le flux est coupé. AMENDÉ le 2026-10-29 (5e arbitrage) : s'ajoutent
   `migrationBonheurEmploi` (1,5) et `migrationBonheurLogement` (1,5) — cf. point 8.
   AMENDÉ le 2026-10-29 (6e arbitrage, v3 ADDITIVE) : `migrationBonheurCulture`
   **0,25**, `migrationBonheurMemeJoueur` **0,5**, `migrationBonheurEmploi`
   **1**, `migrationBonheurLogement` **1** — bonus ADDITIFS sur la base
   d'attrait du bonheur (cf. points 2 et 8) ; les multiplicatifs ×1,25/×1,5
   (v2) et ×1,5 (emploi/logement) sont REMPLACÉS (historisés).
6. **FOYER COMPLET (amendement du jour, retour CI du flux v1 puis 4e retour
   arbitre « lorsqu'un personnage déménage, il déménage avec son/sa conjoint.e et
   leurs enfants non mariés »)** : le tirage individuel séparait des époux entre
   porteurs — or le moteur interdit le remariage tant que l'époux vit (cour) : un
   « divorcé par la distance » ne pouvait plus jamais fonder de foyer. Un départ
   emporte donc le conjoint de la même ville ET leurs ENFANTS NON MARIÉS de la ville
   (mereId/pereId d'un membre du couple, sans mariageId — la majorité n'exclut pas,
   seul le mariage fait foyer propre ; un enfant marié part avec SON conjoint à son
   propre tirage, jamais emporté par ses parents), tous sans tirage propre, à la
   destination du tirage du foyer ; si le conjoint est ancré (Dirigeant, Héritier,
   en armée), le foyer NE PART PAS ; si le conjoint est absent de la ville (défunt ou
   domicilié ailleurs), l'habitant part avec ses enfants non mariés ; un enfant ancré
   (Héritier, soldat) RESTE — il ne déménage jamais et n'entrave pas le départ du
   reste du foyer. Invariants : aucun mariage ne traverse deux porteurs après le
   flux, et aucun enfant non marié ne reste sans parent dans sa ville de départ.
7. **Cultures recalculées** : les arrivées pouvant renverser la majorité, le flux
   recalcule la culture de chaque ville (majorité des vivants) en fin d'étape 4bis —
   l'invariant de l'étape 3.6 de populationTurn tient aussi après le flux.
8. **FACTEURS EMPLOI & LOGEMENT (arbitrage Thibaut, 2026-10-29, 5e retour du flux :
   « un habitant sans métier qui migre a davantage d'intérêt à rejoindre une ville
   avec des emplois disponibles, idem pour le logement »)** : le poids d'une candidate
   est multiplié par `migrationBonheurEmploi` (défaut 1,5) si le TIRÉ est sans
   métier et que la ville a des postes non pourvus (postes offerts > adultes en
   poste), et par `migrationBonheurLogement` (défaut 1,5) s'il est sans domicile
   et que la ville a des lits libres (logements > habitants vivants) — les deux se
   multiplient avec les facteurs v2 (même joueur, culture, bonheur). Le statut
   regardé est celui du tiré AVANT départ : à l'arrivée, perteDemenagement laisse
   tous les migrants sans métier ni domicile ; le foyer (conjoint, enfants) suit le
   statut de son chef sans influer. Les disponibilités sont photographiées UNE fois
   par ville et par tour au début du flux — les arrivées du flux n'occupent ni
   poste ni lit (réaffectation au tour suivant). NB setup : au démarrage toutes les
   villes ont postes et lits libres — les facteurs pèsent alors uniformément sur
   toutes les candidates (aucun changement de tirage) ; ils ne différencient que
   les mondes où certaines villes saturent.
   AMENDEMENT v3 (6e arbitrage, 2026-10-29 : « on peut mettre facteur emploi et
   facteur logement à ×2 ») : les facteurs deviennent des BONUS ADDITIFS —
   défaut +1 chacun (la ville pèse ×2 pour qui manque), passés en argument
   `bonusAdditifs` de `poidsDestination` où ils S'ADDITIONNENT aux
   modificateurs même joueur (+0,5) et culture (+0,25) :
   `poids = attrait × (1 + joueur + culture + bonus)` ; le multiplicatif ×1,5
   du 5e arbitrage est REMPLACÉ (historisé). La photographie des disponibilités
   et le statut du TIRÉ avant départ sont conservés tels quels.

## Retrait de la migration par scolarité (arbitrage Thibaut, 2026-10-28)

« Commence par retirer la migration par scolarité. » Le seul système de migration
automatique restant (la migration spontanée par attrait touristique avait déjà été
retirée le 2026-10-19) disparaît à son tour. Décisions :

1. **Plus AUCUNE migration automatique de population** : `migrerPopulation`, le cache
   `villesAvecProfesseur`, l'interface `CibleVille` et l'étape 3.6bis du tour sont
   supprimés (note RETRAIT in situ avec l'historique VBA : 10 % même joueur, 2 %
   suzerain, 1 % monde, Obstinés exclus). Un enfant sans Professeur dans sa ville y
   reste, point final.
2. **Les seuls déplacements restants sont VOLONTAIRES** : mariages et cour (un époux
   non ancré déménage chez l'autre), transferts de cour, acquisition d'une cité libre.
   Le principe survit dans `cour.ts` : un personnage qui change de joueur est
   physiquement déplacé dans le tableau de population de son nouveau joueur.
3. **Paramètres en REFLIS** : `migrationEcole` (0,10), `migrationSuzerain` (0,02) et
   `migrationMonde` (0,01) ne sont plus éditables dans l'onglet Paramètres (retrait de
   PARAM_META, patron du retrait armées) mais restent dans l'interface et les défauts
   pour les configs sauvegardées — plus aucun lecteur au moteur.
4. **Tests de régression** : sur 20 tours avec un Professeur disponible chez un autre
   joueur, aucun enfant ne quitte sa ville et aucune entrée « scolarité » n'apparaît
   au journal.


## Refonte des cultures — 12 lois (arbitrages Thibaut, 2026-10-29)

Proposition de Thibaut (« voici ce que je pensais faire des cultures »),
revue design puis actée. **Périmètre** : une culture porte une **loi de
VILLE** (joue pour la culture MAJORITAIRE de la cité, `ville.culture`)
et une **loi d'HABITANT** (joue pour la culture PROPRE du personnage,
où qu'il vive). Les 6 noms de cultures sont conservés ; les régimes
(loi de royaume) ne sont pas touchés. Toutes les ANCIENNES lois sont
REMPLACÉES/HISTORISÉES (Entraide, Prier les dieux/Enfant Divin,
Prêcheurs/Soldats de la Lumière, Ecologisme, Adaptation/Sorcellerie,
Supériorité évidente/Par le fer — historique git) : les règles de pays
« +N par habitation de cette culture dans le monde » quittent la
banque (source `culture`, effet `fluxParVilleCultureMonde` supprimés).

### Les 12 lois (défauts du référentiel)

| Culture | Loi de VILLE | Loi d'HABITANT |
| --- | --- | --- |
| Communautarisme (Parité) | **Logements élargis** — +5 Taudis au parc | **Bourgeoisie facile** — seuil bourgeois 100 → 80 |
| Déisme (Masculine) | **Monuments pieux** — +1 place de Scientifique par bâtiment de faction | **Lavages de main** — −2 % de contraction des maladies |
| Lunisme (Masculine) | **Villes Saintes** — +2 Palais au parc | **Foi supérieure** — nobles : +1 Tourisme/tour |
| Naturalisme (Parité) | **Champs nourriciers** — fermiers : +1 Nourriture/tour en été | **Walpurgis** — fertFactor 1,1 (+10 % naissances) |
| Sethisme (Féminine) | **Caravanes** — ≥3 aménagements : +1 route au cap | **Conseil des Sages** — nobles : +0,1 Science/tour |
| Zélotisme (Féminine) | **Ferveur martiale** — habitations hors culture : −20 Garnison × rang | **Corps de fer** — Gardes : +10 Garnison, +0,2 Or/tour |

### Arbitrages et interprétations actés

1. **Logements élargis / Villes Saintes** : les lits de la loi suivent la
   MÊME convention que les apports de constructions — comptés dans le
   parc (`logementsVille` → axe Logement du bonheur et magnét migratoire
   v3 `logementsLibres`), affichés dans le tableau Logements de la carte
   de ville, NON attribuables nommément (`attribuerDomicilesVille` ne
   lit que `ville.domiciles`). NB : aucun rang n'offre de Palais — la loi
   Lunisme est le premier fournisseur. (REMPLACÉ le même jour, 6e retour
   arbitre Thibaut : « il faut que les lits des lois puissent abriter
   des habitants, sinon ça ne sert à rien » — les lits des lois sont
   désormais ATTRIBUTABLES nommément : `attribuerDomicilesVille` ajoute
   `domicilesCultureVille` au stock de service, au même titre que le
   stock du rang ; les Palais issus de la loi restent RÉSERVÉS aux
   nobles (retour 2026-10-28). ASYMÉTRIE assumée : les lits des
   CONSTRUCTIONS restent non attribuables — convention inchangée, non
   visée par le retour.)
2. **Monuments pieux** : les « bâtiments de faction » n'existent plus
   comme donnée depuis le 2026-10-19 — l'ancienne loi (crédit de +4
   Science à la construction, `scienceParConstruction`) est retirée ;
   la nouvelle loi est un **EMPLACEMENT** : +1 place de Scientifique
   par bâtiment (catégorie Bâtiment, aménagements exclus) dans les
   villes de culture Déisme. (REMPLACÉ le même jour, retour arbitre
   Thibaut : « les bâtiments de faction vont revenir — laisse le
   Monuments pieux sur eux » : la loi ne compte plus TOUS les
   bâtiments mais les seuls **BÂTIMENTS DE FACTION**, identifiés par
   le marqueur `batimentDeFaction` du référentiel — marqueur
   dormant, aucune entrée ne le porte aujourd'hui, la loi compte 0
   emplacement jusqu'au retour des 19 constructions de faction.)
3. **Lavages de main** : modificateur additif de contraction
   (`maladieContractMod` −0,02), lu sur la culture PROPRE du personnage.
4. **Bourgeoisie facile** : le seuil bourgeois devient un PARAMÈTRE de
   `rangSocial` (`seuilBourgeoisCulture` : 80 pour le Communautarisme,
   100 ailleurs) ; `rangDe` (le rang affiché ET mécanique : conso/prod,
   mariage, hébergement, lois nobles) l'applique. Le seuil noble (250)
   ne bouge pas.
5. **Champs nourriciers** : le Fermier est déjà un métier `ete` — le
   bonus suit la même saison ; × multiplicateur de rang, avant taxes
   (même pattern que le bonus Ponton/Pêcheur).
6. **Foi supérieure / Conseil des Sages / Corps de fer (Or)** : lois
   d'HABITANT agrégées par `loisHabitants` (canal « Régimes &
   cultures » du récap, étape 3septies avec la loi du régime ; le
   Tourisme luniste compte dans « stock = production »). « Noble » =
   le rang `rangDe` (noblesse de naissance incluse).
7. **Caravanes** : le cap `maxRoutesJoueur` est PAR JOUEUR — le « cap de
   cette ville » se traduit par **+1 au cap du joueur par ville sethiste
   qualifiée** (≥3 aménagements). Le cap reste une annonce, jamais
   bloquant.
8. **Corps de fer (Garnison)** : le +10 est une valeur d'ÉTAT qui **SE
   CUMULE** au défaut moteur `garnisonParGarde` (un Garde zélotiste =
   20) ; le +0,2 Or/tour est un flux (banque des lois d'habitant).
9. **Ferveur martiale** : malus MONDIAL permanent — dès qu'au moins une
   ville de culture Zélotisme existe (villes des JOUEURS, cités libres
   hors champ), chaque habitation qui n'est PAS de cette culture perd
   20 × rang de l'habitation, appliqué UNE fois par habitation (pas de
   cumul si plusieurs villes zélotistes), **plancher 0**. La ligne
   « culture » apparaît dans le détail de garnison.

## Refonte des régimes — 8 lois (arbitrages Thibaut, 2026-10-29)

Proposition de Thibaut (4 régimes politiques × 2 lois), revue puis actée.
**Principe réaffirmé par Thibaut** : un bonus de VILLE s'applique au
joueur qui CONTRÔLE la ville ; un bonus d'HABITANT s'applique à
l'habitant porteur, donc au joueur qui le possède (ex. Sethisme : les
Caravanes créditent le propriétaire de la ville, la Science des nobles
sethistes suit le noble où qu'il vive). **Périmètre** : chaque loi est
lue par le MOTEUR là où elle agit — la VOIE BANQUE est CLOSE pour les
régimes (source `regime` retirée du registre, 84 → 83 règles) ;
Élections et Droit Divin étaient déjà codées, Conscription existait en
texte depuis l'origine mais n'avait JAMAIS été codée.

### Les 8 lois (défauts du référentiel)

| Régime | Loi 1 | Loi 2 |
| --- | --- | --- |
| Autoritarisme | **Conscription** — prix de levée d'armée −10 Or par rang du pays | **Frontières closes** — départs migratoires ×0,8 (20 % de chances de moins de partir) |
| Socialisme | **Terre d'accueil** — +1 Or par migrant arrivant | **Redistribution** — bourgeois 1 / nobles 2 Nourriture par tour |
| Démocratie | **Élections** — sacre d'avènement gratuit | **Le pouvoir du peuple** — +5 Bonheur par habitation |
| Monarchie | **Droit Divin** — +1 serment | **Vassaux dévoués** — tribut reçu ×1,05 |

### Arbitrages et interprétations actés

1. **Conscription** : −10 Or × rang du PAYS (`rangPaysNiveau` :
   Baronnie 1, Comté 2, Duché 3, Royaume 4, Empire 5 — hors échelle 0)
   dans `prixArmee`, CUMULÉ à la réduction de ville (Terrain
   d'entraînement −10), PLANCHER 0. La levée reste payée par le joueur
   qui lève, via ses propres ressources.
2. **Frontières closes** : multiplicateur ×0,8 sur la probabilité de
   DÉPART du tirage migratoire (les arrivées ne changent pas).
3. **Terre d'accueil** : +1 Or par migrant ARRIVANT — foyer ENTIER (un
   foyer de 3 comptant 3 migrants), déménagements INTERNES inclus,
   crédité au joueur DESTINATAIRE, une ligne de log par migrant.
4. **Redistribution** : la consommation passe par
   `consoNourrHabitant(c, C, regime?)` — bourgeois 1 (défaut 2),
   nobles 2 (défaut 4) Nourriture/tour. (REMPLACÉ/historisé :
   l'ancienne loi Socialisme de la banque « Pour le peuple » était la
   dernière règle vivante de la source `regime`.)
5. **Élections** : sacre d'avènement GRATUIT (structurelle :
   `engine/sante.ts`, `fDemocratie`) — déjà codée depuis l'origine.
6. **Le pouvoir du peuple** : +5 Bonheur par HABITATION du joueur,
   plafonné à 100 (`bonusBonheurRegime` + `bonheurVilleComplete`
   min(100, …)).
7. **Droit Divin** : +1 SERMENT (structurelle : `engine/tour.ts`,
   `bonusMonarchie`) — déjà codé.
8. **Vassaux dévoués** : le tribut REÇU est ×1,05 — le vassal paie SA
   part (la différence est CRÉÉE : aucun vassal ne paie plus, seul le
   suzerain reçoit davantage).
9. **(RETRAIT banque)** : la source `regime` quitte le registre —
   `reglesRegimes`/`effetsRegime` supprimés ; anciennes lois
   « garnison des habitations +15 par rang d'habitation »
   (`garnisonParRang`) et « +5 Nourriture d'été pour champs et
   rizières » (`nourrEteChampRiziere`) REMPLACÉES/historisées (git).
   Le canal du récap ressources est RENOMMÉ « Lois des cultures »
   (clé `loisCultures` — il ne porte plus que les lois d'HABITANT des
   cultures ; l'ancienne clé `regimesCultures` reste orpheline dans
   les vieux historiques pour ne pas corrompre les sauvegardes).
10. **Paramétrage intégral** : les 7 montants chiffrés
    (`leveeOrParRangPays` 10, `departHabitantsMult` 0,8,
    `orParMigrant` 1, `consoNourrBourgeoisRegime` 1,
    `consoNourrNobleRegime` 2, `bonheurParHabitation` 5,
    `tributVassalMult` 1,05) vivent dans le référentiel — éditables
    via l'onglet Régimes des Paramètres et visibles dans le wiki
    Référentiels (colonne « Loi chiffrée »).

## Classes sociales des villes — l'inventaire social (retour Thibaut, 2026-10-28, 6e retour du jour)

Thibaut demande un tableau des classes sociales PRÉSENTES dans chaque
ville, sous le tableau des métiers. Même esprit que « Cultures
présentes » : une photographie sociale de la ville.

### Arbitrages et interprétations actés

1. **Classes présentes seulement** : une classe sans habitant dans la
   ville ne s'affiche pas (cohérent avec Cultures présentes et avec
   les tableaux métiers récents) ; ville vide → « aucun habitant ».
2. **Ordre hiérarchique** : noble, puis bourgeois, puis roturier —
   du sommet de l'échelle vers le bas, comme la colonne Rang du
   panneau Population.
3. **Le rang suit la règle moteur `rangDe`, sans redéfinition** :
   noble de NAISSANCE (dynastie noble) ou prestige ≥ 250 ; bourgeois
   ≥ 100 ; roturier sinon. La refonte 12 lois s'applique donc
   TELLE QUELLE : un habitant Communautarisme passe bourgeois dès 80
   (« Bourgeoisie facile ») dans ce tableau comme partout ailleurs.
4. **Colonnes** : classe · nombre de vivants · part en % des vivants
   de la ville (même convention d'arrondi que les cultures) ;
   la classe Noble en gras, les autres en neutre.
5. **Position** : colonne droite de la carte de ville, SOUS le
   tableau des métiers (le wrapper d'empilement sert désormais aux
   deux colonnes — filets identiques entre tous les tableaux).

## Dogmes de culture — paliers de Tourisme (arbitrages Thibaut, 2026-10-30)

Quand une CULTURE (pas un joueur) atteint un palier de Tourisme, le
joueur dominant de cette culture choisit un DOGME qui affecte les
habitants ou les villes de cette culture. La MISE EN FORME a été
codée en 1re séance (fondations, table vide) ; en 2e séance du
30/10, les **12 DOGMES DÉFINITIFS retenus par Thibaut** sont entrés
au référentiel et leurs effets sont BRANCHÉS MOTEUR.

1. **Paliers** : un palier tous les 50 de Tourisme (paramètre
   éditable `palierTourismeDogme`, groupe Culture) — 50, 100, 150…
   Un dogme à CHAQUE palier ; les dogmes se CUMULENT à l'infini,
   jamais retirés, jamais remplacés.
2. **Tourisme d'une culture** : SOMME des valeurs de Tourisme des
   villes de cette culture, TOUS JOUEURS confondus, SANS les cités
   libres. Même lecture que le tableau de production de la ville
   (`productionVille`, canal « total »).
3. **Dominant** : le joueur dont les villes de la culture
   totalisent le plus de Tourisme — le choix du palier lui revient
   au moment du choix (il peut CHANGER d'un palier à l'autre ;
   égalité : plus petit n° de joueur, déterminisme). Le dogme est
   inscrit au nom du dominant, pas de l'appelant.
4. **Cumul** : dogmes, lois et effets de culture se CUMULENT.
5. **Choix validé** : le dogme doit exister dans la table
   `dogmes` du référentiel POUR CETTE culture — les 12 dogmes du
   30/10 sont GÉNÉRIQUES (`culture: '*'` : proposés à toute
   culture). Un dogme est UNIQUE par culture : le cumul à l'infini
   porte sur des dogmes DIFFÉRENTS, jamais le même deux fois
   (`choisirDogme` refuse le doublon).

**Distinction** : les seuils `tourismeSeuils` du référentiel
(Rang I/II/III à 100/180/340) sont les PONTIFICATS, par JOUEUR —
mécanisme distinct des dogmes, par CULTURE, cumulables à l'infini.

### Les 12 dogmes (défauts du référentiel, 2e séance du 30/10)

Tous GÉNÉRIQUES (`culture: '*'`) ; les chiffres vivent dans le
champ `effets` de la table (source de vérité : éditer la valeur au
référentiel change l'effet des dogmes DÉJÀ pris, lu par type par
`effetsDogmeCulture`).

| Dogme | Effet (type référentiel, valeur) |
|---|---|
| Dogme du Travail | travailNourriture +1 — sans-emplois de la culture : +1 Nourriture/tour (avant taxes, sans multiplicateur de rang) |
| Dogme de la Famille | fecondite +0,1 — fécondité ×1,1 pour les personnages de la culture, CÔTÉ HOMME ET CÔTÉ FEMME : chaque époux apporte SA part de fécondité au JET de conception (un époux porteur multiplie sa part) — mais la fécondité AFFICHÉE d'une épouse ne monte jamais à cause de la culture de son mari (5e retour) |
| Dogme de la Patrie | gardeParHabitation +2 — cap de Garde +2 dans les villes de la culture |
| Dogme de l'Égalité | consoNourrBourgeois 1 — les bourgeois de la culture consomment 1 Nourriture (FIXE : l'emporte sur régime et défaut) |
| Dogme de la Solidarité | taudisParHabitation +5 — +5 Taudis par habitation de la culture (lits attribuables, entrée séparée de la loi) |
| Dogme de la Fraternité | AUCUN effet moteur — révoltes −20 % : la mécanique des révoltes n'est PAS implémentée (le dogme est au référentiel, son effet viendra avec elle) |
| Dogme de la Liberté | bonheurVille +10 — +10 Bonheur dans les villes de la culture (avant le plafond 100) |
| Dogme de la Santé | maladieContractMod −0,05 — −5 points de contraction pour les personnages de la culture |
| Dogme de l'Évangile | pressionCulture +0,1 — poids de la culture ×1,1 dans la conversion culturelle (le poids FINAL, présence locale incluse) |
| Dogme de la Mère Patrie | tributVassal +0,05 — tribut REÇU par un suzerain de la culture ×1,05 (les DEUX chemins : fin de tour et impôt manuel ; le vassal paie SA part, la différence est créée) |
| Dogme des Guerres Saintes | garnisonHorsCulture −40 — garnison des villes d'une AUTRE culture −40, une fois PAR culture porteuse (les villes porteuses sont protégées, plancher 0) |
| Dogme du Nationalisme | conversionLocale +0,15 — habitants d'autres cultures vivant dans une ville de la culture : +15 % de chances DANS le tirage de conversion de se convertir à elle (pas de jet séparé) |

### Interprétations d'implémentation (à arbitrer)

- **Loi d'habitant vs loi de ville** : Travail, Famille, Égalité et
  Santé portent sur la culture PROPRE du personnage, où qu'il vive
  (même lecture que la loi « Lavages de main » du Déisme) ;
  Patrie, Solidarité, Liberté, Évangile et Nationalisme portent sur
  la culture de la VILLE ; Guerres Saintes et Mère Patrie sur les
  cultures porteuses au MONDE (garnison / tribut).
- **Égalité** : le dogme FIXE la consommation (1), il l'emporte
  sur la loi de régime et le défaut moteur ; sans `state` (cités
  libres), le dogme n'est pas consulté.
- **Famille** (correctif arbitre 30/10, 4e retour : « le
  multiplicateur est côté homme et femme » ; PUIS 5e retour : « le
  calcul de la conception prend en compte la fécondité homme et la
  fécondité femme — une femme n'a pas à gagner en fécondité si son
  mari est d'une culture féconde ») : chaque personnage porte la
  fécondité de SA culture propre (côté homme et côté femme). Le JET
  de conception (qui multiplie la fécondité homme et la fécondité
  femme) fait intervenir chaque époux avec le dogme de SA culture :
  un mari porteur multiplie SA part dans le JET (une épouse
  non porteuse conçoit ×1,1 avec lui), un couple porteur des deux
  côtés conçoit ×1,21. Mais la fécondité AFFICHÉE d'une épouse
  (computeFecondite) ne monte JAMAIS à cause de la culture de son
  mari — le facteur de l'époux de l'affichage ne porte plus son
  dogme.
- **Nationalisme** (correctif arbitre 30/10, 4e retour : « ce n'est
  pas un nouveau jet, mais pris en compte dans le test de
  conversion culturelle déjà présent ») : PAS de tirage séparé —
  dans le tirage pondéré existant, la culture d'accueil gagne
  +0,15 × le poids total des autres cultures. Les chances en plus
  ne mènent QUE vers la culture d'accueil (jamais une tierce
  culture), et le log est l'entrée de conversion normale.
- **Portée générale** (confirmée par l'arbitre) : aucun dogme
  n'a d'effet sur les personnages des autres cultures — seuls les
  habitants de la culture porteuse (loi d'habitant) ou les villes
  de la culture (loi de ville) sont touchés, selon la ligne du
  tableau ci-dessus.
- **Mère Patrie** : la culture du SUZERAIN compte (tribut reçu),
  pas celle du vassal — la différence ×1,05 est CRÉÉE pour le
  suzerain (même arbitrage que la loi « Vassaux dévoués »).
- **Guerres Saintes** : à montant FIXE (pas × rang, contrairement
  à la Ferveur martiale), cumulées entre cultures porteuses,
  plancher 0 ; les cités libres ne portent pas la protection.
- **Fraternité** : zéro effet moteur tant que les révoltes
  n'existent pas — retour Thibaut explicite « non implémenté ».
- **Pas d'annonce de palier au journal de fin de tour** (choix
  maintenu) : l'entrée « Culture » part du CHOISIR du dominant ;
  une annonce répétée tant que le choix pend serait du bruit.

**Affichage** : carte « Culture du pays » (page Pays) — total
Tourisme de la culture tous joueurs, palier en cours, dogmes pris
(avec la description du référentiel), paliers en attente (badge
warn + dominant) et CHOIX INTERACTIF : le dominant clique un
dogme disponible par palier en attente (mutateur
`choisirDogmeJoueur` de PlayerView → `choisirDogme` valide et
journalise ; un refus part au journal « Système »). La carte
« Dogmes de culture » du wiki (onglet Tourisme, page
Référentiels) montre la table complète — retour de la carte
retirée le 24/10. L'annonce de palier à chaque fin de tour reste
non codée (choix ci-dessus).

**ONGLET « Dogmes » (5e retour arbitre Thibaut du 30/10 : « il
faudrait un onglet Dogmes, au même titre qu'un onglet royaume et
Pays »)** : nouvelle section de premier niveau de la navigation
(🕯 Dogmes, entre Pays et Population), avec la barre J1..J8 —
vue TOUTES CULTURES PRÉSENTES : une carte par culture (Tourisme
moteur, paliers franchis, dominant, dogmes pris avec descriptions,
paliers en attente et CHOIX INTERACTIF quand le joueur sélectionné
est dominant — même mutateur généralisé à toute culture), plus la
table complète du référentiel (12 dogmes, effets moteur, cultures
qui les ont pris). La carte « Culture du pays » de la page Pays
reste inchangée.

**Historique** : un ancien système de dogmes (effets d'affichage
Pontife/Fidèles, jamais branché moteur) a été retiré le 2026-10-24
« un éventuel retour des dogmes repartira de zéro » — c'est ce
retour ; la purge cfgOf ne retire plus que les entrées ANCIEN
format (sans champ `culture`), le nouveau format passe.
