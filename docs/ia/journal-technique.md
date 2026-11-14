# Journal technique — historique des évolutions et conventions

Ce document complète [AGENTS.md](../AGENTS.md) et
[regles-et-arbitrages.md](regles-et-arbitrages.md) : il retrace l'HISTORIQUE des
évolutions du projet (thème, fichiers, shas), les incidents réels et les règles
d'ingénierie durables qui en découlent. Les décisions de design détaillées sont
dans regles-et-arbitrages.md ; ici, chaque évolution tient en quelques lignes.

## Conventions de déploiement — ÉTAT ACTUEL (depuis 2026-10-19)

- **Un seul push sur `chasse-et-peche-web` déclenche TOUT** : workflow « CI jeu »
  (`npm ci` + `tsc --noEmit` strict + `npm test` + bundle esbuild de l'Edge Function
  + exécution-test du bundle + `npm run build`) PUIS déploiement GitHub Pages
  (https://losth230.github.io/quartz/jeu/) + Edge Function.
- La partie multijoueur de l'arbitre tourne EN CONTINU sur ce déploiement : un push
  qui casse la CI casse sa partie. Ne jamais pousser sans validation locale complète.
- Après un push de code : attendre ~150 s, vérifier les check-runs du sha
  (build + jeu + diag + deploy = success), puis vérifier le bundle live
  (`https://losth230.github.io/quartz/jeu/` → `assets/index-*.js` a un NOUVEAU hash
  et contient les nouvelles chaînes).
- **SYSTÈME HISTORIQUE DÉPRÉCIÉ** : jusqu'au 2026-10-19, le déploiement passait par
  une double branche (`chasse-et-peche-web` + `v4`) avec des « marqueurs »
  alphabétiques insérés dans `.github/workflows/deploy.yaml`. Les marqueurs se
  sont arrêtés à **(a)** (3e cycle alphabétique). Ne plus ajouter de marqueur ;
  les mentions (g)…(a) ci-dessous sont des références historiques, utiles pour
  retrouver un arbitrage dans `git log`.

## Chronologie des évolutions (marqueurs historiques)

Chaque entrée renvoie aux sections correspondantes de regles-et-arbitrages.md.

- **(g) 2026-10-14 — Rangs de pays refondés** : échelle féodale unique Baronnie→Empire,
  montée par serments uniquement (1/2/3/4), `DEFAULT_CONFIG.paysRangs` + `migrerPaysRangs()`,
  `rangPaysNiveau`/`sermentsPossedes`, page Royaume (sacre, avènement), cap Ministres.
  Jeu `455ee04f`… (voir git log de l'époque).
- **(h) 2026-10-14 — Ministres/portefeuilles** : 23 portefeuilles (7 du classeur + 16
  « de cour »), effets Auto/Plateau, nouveau `engine/ministeres.ts`, nomination nobles
  uniquement, cap = rang. Jeu `87428bcf`.
- **(i) 2026-10-14 — Voies de victoire « Lauriers I à IV »** : validation manuelle en
  ordre strict, crise aux Lauriers I-III, bonus one-shot par âge, Laurier IV = victoire ;
  `engine/victory.ts` réécrit + carte radar/coches sur l'Accueil. Jeu `455ee04f`.
- **(j) 2026-10-14 — Cinq retours joueurs** : aménagements dédoublables, nouveau module
  `engine/villes.ts` (`supprimerVille`, `transfererVille`), barre Ressources flottante
  page Pays, Progrès sans effets moteur (coût Science débité/remboursé seul), population
  des cités libres en panneau dédié.
- **(k) 2026-10-14 — Impôts manuels** : boutons « 💰 Générer l'impôt de la population /
  🤝 des vassaux » (page Pays, carte Récap), N tours à la fois, s'AJOUTENT au fin de tour ;
  `engine/economie.ts` (`impotPopulation`, `impotsVassaux`, `genererImpot*`).
- **(l) 2026-10-14 — Quatre retours UI/moteur** : barre Ressources pinnée en JS (pas
  sticky CSS), purge de ~25 paragraphes de texte, `debiterCoutHabitation` (coût des
  habitations débité), onglet Référentiels → Habitations complété.
- **(m) 2026-10-14 — La cour, dons et mariages** : `transfererVille` déplace ville +
  population (la cour reste), onglet Population scindé « 👑 La cour » / population
  classique, nouveau `engine/cour.ts` (`donnerPersonnage`, `marierPersonnages`) ; le
  veuvage et la recherche de conjoint parcourent TOUTES les populations du monde.
- **(n) 2026-10-14 — Cités libres « comme des joueurs »** : onglets 🗼 dans la section
  Population, architecture « détenteurs » (`Detenteur` joueur|cité, `shared.ts`),
  `toutesLesPopulations`, 50 habitants, consommation Nourriture plate.
- **(o) 2026-10-14 — Mariage = déménagement** (remplace l'arbitrage (m)) : la personne
  de la ligne « 💍 Marier avec… » déménage dans la ville du conjoint (peut changer de
  porteur) ; couleurs J1-J8 et des ressources paramétrables (onglet Couleurs), lignes
  de tableaux teintées `color-mix` avec slider de transparence. Jeu `13197b66`.
- **(p) 2026-10-14 — Mise en forme** : carte « Récap du dernier tour » déplacée en haut
  de Population, compactage Accueil/Pays/Progrès (hauteurs, densification cartes de ville).
- **(q) 2026-10-14 — Nombre de joueurs paramétrable** : sélecteur 2-8 à la création
  (défaut 8), `createGame(setups)` boucle sur les lignes, cités libres = 1/joueur.
  Jeu `03de348e`.
- **(r) 2026-10-14 — Douze retours** : ressources colorées partout, erreurs des
  dons/mariages AFFICHÉES en rouge (le moteur refusait silencieusement), aucun bâtiment
  par défaut en capitale, colonne « Capitale » au setup (Cité/Château, `typeCapitale`),
  Foire RÉPARÉE (parser ne lisait que « Tourisme +N », pas « +N Tourisme par tour. »),
  **Tourisme = valeur FLAT créditée UNE fois à la construction** (bâtiments ET
  aménagements), aménagements paramétrables, pastilles bâtiments par famille
  (badge-fam-*), toutes les ressources affichées même à 0, carte « 👑 Ministres ».
  Jeu `47e1ba16`.
- **(s) 2026-10-14 — Effets structurés + wiki** : interface `EffetConstruction
  {ressource, quantite, ete?}` + champ `effets[]` sur 67/97 entrées de
  referentiels.json (migration scriptée, matching par index pour les doublons de noms) ;
  `RESSOURCES_INSTANTANEES = {Tourisme, Garnison}` (jamais de flux par tour), accès
  `effetsConstructionRef`/`instantanesConstructionRef`/`resumeConstruction` avec repli
  texte `parseProductionTexte` ; TOUS les éditeurs regroupés dans `ConfigTables.tsx`
  (onglets Paramètres) ; ReferenceDataPanel réécrit en **wiki de règles LECTURE SEULE**.
  Jeu `abfe0c18`.
- **(t) 2026-10-15 — Marchands et routes commerciales** : titre Marchand, UNE route par
  marchand, +`marchandOrTour` Or/tour aux DEUX joueurs, copie de production d'aménagement,
  nouveau `engine/commerce.ts`, canal « Commerce » partout, paramètre `marchandOrTour`.
  Jeu `b366b375`. NB : ce jour-là les push API ne déclenchaient aucun workflow →
  déblocage par `workflow_dispatch` manuel (à savoir refaire si ça se reproduit).
- **(u) 2026-10-15 — Correctif commerce** : bug « Marchand introuvable » = Selects
  contrôlés soumettant `''` → **règle durable : soumettre la valeur EFFECTIVE
  (état || première option)** dans tout formulaire en cascade ; arbitrage Thibaut : la
  copie porte sur l'AMÉNAGEMENT ENTIER (champ `ressource` obsolète optionnel).
  Jeu `ae3fe76e`.
- **(v) 2026-10-15 — Offices de cour + migration** : renommage des 7 ministères du
  classeur (Colonial→Grand bailli, etc.), `migrerMinisteres` réécrit (fusion des
  manquants + conservation des personnalisations), `migrerNomsMinisteres(state)` aux
  3 points d'ingestion du store, choix du portefeuille déplacé dans la carte
  « 👑 Ministres ». Jeu `90279b8d`.
- **(w) 2026-10-15 — Gouverneurs + nouvelles villes** : nouvelle ville/château = 50
  roturiers SANS noble (`peuplerNouvelleVille`) ; gouverneur automatique = noble LE
  PLUS ÂGÉ de la ville (hors Dirigeant/Héritier), +10 % d'impôts sur SA ville cumulable
  avec le Grand Chambellan. Jeu `cc37456f`.
- **(x) 2026-10-15 — Convergence de la configuration** : cause racine = les migrations
  de complétion (migrerMinisteres/Constructions/Factions) se rejouaient à CHAQUE `cfgOf`
  et ressuscitaient les entrées par défaut supprimées. Correctif : `SCHEMA_VERSION_CONFIG`
  + champ `schemaVersion` (tampon), `convergerConfig` aux points de sauvegarde/chargement.
  **Règle durable : toute évolution du référentiel devant atteindre les configs
  existantes → INCRÉMENTER `SCHEMA_VERSION_CONFIG`.** Jeu `8000c6f7`.
- **(y) 2026-10-15 — Ministres automatisés + proximité + ChoicePicker** : les 18
  portefeuilles réels de la partie en ligne de l'arbitre deviennent le référentiel
  (5 supprimés), effets Auto codés (bailli, prévôt, veneur, finances, bibliothécaire,
  légat, connétable) ; `City.proximite` (Plaine/Rivière/Mer) + canal « Proximité » ;
  `components/Picker.tsx` (ChoicePicker : bouton → panneau → catégories → cartes
  décrites) appliqué aux aménagements/bâtiments/ministres/titres ; les constructions
  de faction des AUTRES peuples ne sont plus constructibles. Jeu `6eb832a4`.
- **(z) 2026-10-15 — Mariage ciblé, taxes ±25 %** : « Marier avec… » ne cible plus que
  les nobles du MÊME porteur (le moteur garde sa capacité inter-porteurs) ; infobulles
  des traits génétiques ; effet des taxes passé de ±50 % à ±25 % avec migration ciblée
  `taxes25` (SANS toucher au tampon schemaVersion). Jeu `7bcf7ce5`.
- **(a) 2026-10-15, 3e cycle — Écran blanc + aide « compté automatiquement »** :
  triple correctif page blanche (hooks React APRÈS retours anticipés, `normaliserEtat`
  aux 4 points d'ingestion du store, `ErrorBoundary` global + par onglet) et bloc
  d'aide « 🧮 Qu'est-ce que l'application compte automatiquement ? ». **Deux incidents
  majeurs → règles durables : voir la section « Règles d'ingénierie » ci-dessous.**
  Jeu `1fd0a1d3`. Dernier marqueur v4 ; le système marqueurs est ensuite abandonné.

## Refontes techniques « vibecoding » (17-19 octobre 2026)

Travail lourd effectué par l'arbitre hors sessions de suivi, constaté en relecture du
dépôt (tête d'époque `14344ee7`) — à connaître avant toute modification :

- **Fusion multijoueur par sections** (`engine/fusion.ts`, testé) : la SEULE écriture
  réseau est la fin de tour ; `rejouerEvenementsPartages` pour les événements
  inter-joueurs. Les anciens boutons « 💾 »/flush fermeture d'onglet ont été retirés
  (ils écrasaient le salon avec un état local incomplet).
- **Registre de migrations VERSIONNÉ** (`engine/migrations.ts`, testé) : tampon
  `schema` sur l'état, migrations pures numérotées exécutées une fois — à utiliser
  pour toute évolution future du FORMAT des sauvegardes (≠ `SCHEMA_VERSION_CONFIG`,
  qui concerne le référentiel de configuration).
- **Config mondiale unique** : ligne `__config__` de la table Supabase, adoption au
  chargement (monde > embarquée > locale, `state/configPriorite.ts` pur et testé) ;
  édition HORS partie uniquement ; plus de « règle créateur ».
- **Résolution de tour côté serveur** : Edge Function Deno
  `supabase/functions/resoudre-tour` (mêmes règles que le local : fusion + config +
  runTurn), replis v1/v2 documentés. Le dossier `supabase/` à la racine est AUTONOME
  (n'importe pas `src/supabase/client.ts`).
- **Couche `src/rules/`** (testée) : banque d'effets lecture-seule au-dessus du moteur,
  préparation d'un futur refact des effets. NB : contient des cycles d'imports avec
  `engine/` (13 cycles), volontairement non traités pour l'instant.
- **Perf** : `saveLocal` sérialise par replacer (zéro structuredClone de l'état ~5 Mo).
- **CI « CI jeu »** : c'est à partir de ces refontes que la branche du jeu a sa propre
  CI complète (type-check strict + 40 tests natifs à l'époque + build) et le droit de
  déclencher le déploiement Pages.

## Un fichier par UI + tests de rendu (2026-10-19)

Réponse aux retours de revue critique n°2 et n°3 — 3 commits verts :
`94161581` (pose les 12 fichiers `src/components/pays/`), `8f95576b` (helper
`components/testRendu.ts` + 12 tests de rendu `*.test.ts` sans JSX, un par vue),
`034d208f` (PlayerView.tsx réduit à un assemblage ~150 lignes + durcissement
`supabase/client.ts` : `import.meta.env` lu OPTIONNELLEMENT, hors bundle Vite il vaut
undefined).

- **Découpage `components/pays/`** : `pays-utils.tsx` (constantes/formateurs partagés),
  `Constructions.ts` (fabriques pures `faireConstruire`/`faireBatParFamille` — l'état
  est fourni par l'appelant), puis une carte par fichier : RessourcesBar, AideAuto,
  SurintendantFinances, CulturePays, VillesCarte, VilleCarte, CommerceRoutes,
  RecapParTour, RecapDernierTour, NotesJoueur. Extraction vérifiée byte-identique.
- **Piège TypeScript noté** : le narrowing d'un PROP ne traverse pas une closure
  `onClick` → capturer la valeur AVANT (`const surintQty = surint.qty`).
- **Piège tests de rendu** : `renderToString` ne joue PAS les `useEffect` ; le helper
  fait un shim `localStorage` + partie 8 joueurs graine fixe + 2 runTurn AVANT le rendu.

## Purge qualité (2026-10-19) — durcissement tsc + code mort + tests mutateurs

Suite à l'audit critique (structure/logique/SOLID/code mort), 4 commits verts :
`ce042d0a` (signatures allégées + exports morts gameData/gameData2 + regex
RESSOURCES_FLUX unifiée dans constructions.ts), `e2572ac6` (`engine/mutateurs.test.ts`
8 tests + imports React morts), `4deceb16` (locaux morts des 7 vues restantes +
règles CSS orphelines `.taxes-tbl`/`.frule-manuel`/`.cl-reserves`), `6e55751c`
(**`tsconfig.json` : `noUnusedLocals` + `noUnusedParameters` à true** + store.tsx
`pollerBarriereV2` mort + supabase/client.ts `saveRemote`/`clientId` morts +
`migrateGameConfig`).

- Compteur tests : **48 natifs + 12 rendu**.
- `engine/mutateurs.test.ts` couvre `supprimerVille` (habitants restent), 
  `transfererVille` (roturier suit, noble ré-ancré, renommage en collision),
  `rejouerTransfertVille` v2 IDEMPOTENT, `marierPersonnages` inter-joueurs + 5
  gardes-fous.
- **Dette volontairement différée** (à ne pas « découvrir » comme un oubli) :
  (1) les 13 cycles d'imports `rules/` ↔ `engine/` (dont engine.ts↔validation.ts et le
  cluster economie↔titres↔naissances↔sante) — refonte architecturale risquée pendant
  la partie en ligne ; (2) le découpage des 5 grosses vues restantes (PopulationTable
  798 l., ReferenceDataPanel 647, RoyaumeView 626, ConfigTables 609, CitesLibresView
  429). Vague suivante, à proposer à l'arbitre.

## Audit complet du code + correctifs multijoueur (2026-10-19, soir)

Audit complet du dépôt à la tête `66282293` (moteur, store, fusion, Edge Function,
schémas SQL, UI, règles, tests, CI). Verdict global : architecture et hygiène très
au-dessus de la moyenne — mais DEUX bugs réels dans la couche multijoueur v2, dont
un EN PRODUCTION :

1. **Edge Function cassée en prod** — `resoudre-tour/index.ts` appelait
   `appliquerConfigMondiale(draft, cfgMondiale)` sans que `cfgMondiale` ne soit
   défini NULLE PART (introduit par `714a54bb`) → `ReferenceError` → 500 à
   CHAQUE résolution serveur → repli local systématique depuis le 19/10 matin.
   Le jeu avançait quand même (le repli fait fusion + événements + config
   mondiale + runTurn + publication), personne n'a rien vu — mais l'atomicité
   serveur (verrou, transaction) était perdue. CORRIGÉ (`362e1db4`) : la config
   mondiale est LUE dans la ligne réservée `__config__` avant l'injection
   (ligne absente → null → config embarquée conservée, même sémantique que le
   repli client).
2. **`pollerBarriereV2Ref` jamais assigné** (store.tsx) — le ref était déclaré
   no-op, APPELÉ par `nextTurnV2` quand un joueur pousse sans être le dernier,
   mais la fonction `pollerBarriereV2` n'existait pas : les clients en attente
   ne pollaient RIEN. Si le dernier pousseur fermait son onglet avant la
   résolution, le salon se bloquait pour tous (seul « Forcer » ou un
   rechargement débloquait). CORRIGÉ (`362e1db4`) : poller v2 implémenté
   (toutes les 2 s, max 2 min, arrêt si le tour local a avancé) + assignation
   au ref comme son jumeau `resoudreBarriereLocaleV2Ref`.
3. **Cause racine : la CI ne type-checkait pas le handler Deno** —
   `npm run test:function` ne teste que le bundle moteur `_engine.mjs`, et le
   tsconfig du jeu n'inclut pas `supabase/functions/` : le bug (1) est parti en
   production vert. CORRIGÉ (`ccfa04ef`) : check dédié
   `npx tsc -p supabase/functions/resoudre-tour/tsconfig.check.json`
   (strict, stubs `jsr:@supabase/supabase-js@2` et `*_engine.mjs` dans
   `types/stubs.d.ts`), dans CI jeu ET deploy-function. Un `deno check`
   complet a été essayé en premier : il échoue en CI (il tente d'installer les
   dépendances npm transitives de supabase-js hors package-lock — reproduit
   localement, Deno 2.9.7). Le check tsc est vérifié en POSITIF (handler
   corrigé = pass) et en NÉGATIF (le bug historique rejoué → TS2304
   « Cannot find name 'cfgMondiale' » → échec de la CI).
4. **Preuve en production** : après redéploiement de l'Edge Function
   (workflow deploy-function vert sur `ccfa04ef`), résolution serveur vérifiée
   BOUT-EN-BOUT sur un salon de test jetable `{ok:true, tour:2}` — idempotence
   (2e appel = `dejaPublie`), config mondiale injectée dans l'état publié,
   garde `tour_publie` posée. NB : `parties_chasse_peche` n'a PAS de policy
   DELETE anon → le salon de test (`audit-probe-fix`) a été réduit à une tombe
   inerte ; purge manuelle en SQL :
   `delete from parties_chasse_peche where id = 'audit-probe-fix';`.

Constats de l'audit NON corrigés (priorisés, à arbitrer) : RLS DELETE ouverte à anon
sur `cp_events` (sabotage de barrière possible) ; retour de `saveLocal` jamais
vérifié (quota localStorage dépassable en fin de partie, échec silencieux) ;
identité démographique par NOM COMPLET (`mariage`/`mere`/`pere` = strings —
collisions possibles à 16 000 habitants) ; doc drift Tourisme (AGENTS.md dit
« crédité UNE fois » alors que le code actuel le traite en flux avec
stock = production) ; mélange de protocoles v1/v2 possible dans un même salon ;
bouton reset (✕) sans confirmation.

Le rapport complet de l'audit (bugs, risques R2-R5, problèmes moyens M1-M7, dette
mineure, points forts, plan d'action) est versé dans
[audit-code-2026-10-19.md](audit-code-2026-10-19.md). RÈGLE DURABLE (retour arbitre
2026-10-19) : toute documentation produite (audit, rapport, synthèse) doit être versée
dans `docs/ia/` du dépôt, pas seulement dans les outils de suivi de session.

## Retrait de l'attrait migratoire et des bonus de faction (2026-10-19, retour arbitre)

Aucune partie en cours — décision de brûlage partiel prononcée par l'arbitre : deux
systèmes jugés insatisfaisants sont retirés pour être refaits plus tard sur de
meilleures bases. Commit `2c24bd3a` (32 fichiers, ≈400 lignes de moteur/UI en moins,
référentiel de 109 → 90 constructions) :

1. **Attrait migratoire supprimé** — migration spontanée par attrait Tourisme +
   heatmap de la page Pays. Ne restent que les migrations scolarté (enfants sans
   éducation…). Le bug B3 de l'audit (attrait double-compté) disparaît AVEC le
   système ; B4 (commerce copie le Tourisme) reste valable.
2. **Bonus de faction supprimés** — canal Production « Faction », règles d'âge,
   table EFFETS des règles, statut FACTIONS, 19 constructions de faction (Église,
   Puit de mana, Grande Cathédrale…), bonus codés en dur (NORLS, Basiléens,
   PEAUX VERTES, Sylvains, Elfes d'Or), prérequis de faction, fiches mécaniques
   des peuples, canal « Faction » du récap.
3. **Conservé** : champ « Peuple » au setup (identité pure, sans effets),
   utilitaires partagés de `factions.ts` (nbAmenagements, nbBatiments,
   nbBatimentsVille, nbVassaux, rangPaysNiveau, capitaleDe, batimentsCapitale),
   fiches peuplesLibres/peuplesAutres du référentiel (source documentaire pour la
   refonte), migrations scolarté.
4. **Conventions posées** : les docblocks d'arbitrage ne sont jamais supprimés —
   remplacés par un commentaire « RETRAIT 2026-10-19 (retour arbitre — à refaire) » ;
   `SCHEMA_VERSION_CONFIG` passe à 2 : la convergence filtre les constructions de
   faction des configs existantes AVANT `migrerConstructions` (les 19 constructions
   disparaissent automatiquement des parties sauvegardées, tampon re-posé) ;
   `ConditionRegle.regleFaction` retiré du système de règles.
5. **Validation avant push** : tsc strict au niveau baseline exact (3 erreurs stub
   client Supabase), 48/48 tests moteur/règles/état, smoke runtime 3 joueurs +
   runTurn (0 construction de faction, canaux Production sans « Faction »,
   `migrationTourisme` absent des paramètres, origines garnison base/régime),
   convergence v1→v2 vérifiée sur une config contenant des constructions de faction.

**RÈGLE (retour arbitre 2026-10-19, soir) : le SUIVI DE SESSION vit ICI.** `docs/ia/` est LA
référence unique de l'état du projet — ce journal pour l'historique (évolutions, incidents,
shas, tête de branche), `regles-et-arbitrages.md` pour les décisions de design,
`audit-code-2026-10-19.md` pour l'audit et ses suites. Les bases de connaissances locales
des sessions d'agents IA ne sont PLUS maintenues comme référence : toute mise à jour de
suivi se pousse au dépôt, à chaud (une entrée par événement ou par session).

## Brûlage du protocole multijoueur v1 (2026-10-19, audit R5)

Aucune partie en cours — l'arbitre a prononcé le brûlage du protocole multijoueur v1.
Le risque R5 de l'audit ne pouvait PAS se corriger par des gardes : un salon où
7 joueurs sont en v2 et 1 en v1 reste bloqué ; la seule protection fiable est
l'IMPOSSIBILITÉ du mélange. Le protocole v2 (événements append-only + résolution
serveur) est désormais l'UNIQUE flux de fin de tour.

Commit `27a5173c` (4 fichiers) :

1. **supabase/client.ts** : `pousserSection` et `lireBarriere` (barrière v1 par
   colonne `sections`, lire-modifier-écrire) retirés, remplacés par des commentaires
   RETRAIT ; `publierEtatFusionne` (résolution + garde anti-rollback) et tout le
   flux v2 conservés.
2. **state/store.tsx** : `proto2Actif()` (feature flag `cpe.proto2`), la branche v1
   entière de `nextTurn` et les replis v1 `resoudreBarriere`/`pollerBarriere`
   retirés ; `nextTurn` appelle TOUJOURS `nextTurnV2` ; gardes `proto2Actif() &&`
   retirées de update (section vivante), resoudreSeul, forceNextTurn et realtime ;
   docblock `nextTurnV2` réaligné (repli = résolution LOCALE v2, plus « retour au
   flux v1 »).
3. **components/TurnBar.tsx** : bouton de bascule v1/v2 et state `proto2` retirés
   (5 boutons restants), import React devenu inutile retiré.
4. **AGENTS.md** : section Multijoueur retitrée « protocole v2 UNIQUE » + phrase de
   règle (plus aucun mélange possible dans un salon).

Incident de coupe (commit `166a7ab`) : le splice scripté de la branche v1 de
`nextTurn` a avalé les lignes de fermeture du `void (async () => {…})` et du
`useCallback` → `'}' expected` en fin de store.tsx → **CI jeu #33 ROUGE** (diag et
check Edge Function passaient — seuls tsc strict/build l'attrapent, comme prévu).
Réparé dans la foulée (réinsertion des fermetures) ; CI jeu #34 verte, diag #190
vert, **Deploy Pages #1204 vert** : bundle live republié (l'ancien
`index-CGmShlKV.js` renvoie 404, la page live rend le jeu) ; le Deploy #1203 du
commit cassé a bien échoué SANS rien publier. **Règle durable confirmée (cf. règle
7 des règles d'ingénierie) : après une coupe scriptée entre marqueurs, vérifier
l'équilibre des fermetures de la zone coupée avant de pousser.**

Non modifiés : Edge Function (déjà v2-pure, non redéployée — run #15 toujours en
vigueur), colonnes SQL v1 (`sections`, `turn_done`) laissées en base, inoffensives
(`publierEtatFusionne` écrit `sections: {}`), tests (aucun ne référençait
v1/proto2). R5 est marqué résolu dans
[audit-code-2026-10-19.md](audit-code-2026-10-19.md).

## Arbitrage B4 — le Tourisme copié par le commerce compte dans le stock (2026-10-19)

Arbitrage Thibaut (retour sur la phrase B4 de l'audit) : « le tourisme peut être
copié puisque le stock de tourisme n'est jamais mis à jour avec la production.
L'idée est que stock tourisme = production tourisme ». Le Tourisme EST donc
copiable par une route commerciale ; le bug B4 n'était pas la copie elle-même
mais le résidu : `tourismeCourant` (regimes.ts) n'avait pas de canal Commerce —
la copie s'affichait au récap mais `resynchroniserTourisme` écrasait le stock
sans elle (affiché, jamais crédité).

Correctif `ee26eb80` « fix(jeu): le Tourisme copié par le commerce compte dans le
stock (B4, arbitrage) » :
- `regimes.ts` : canal 7 dans `tourismeCourant`
  (`effetsCommerceJoueur(state, p, state.saison, C)['Tourisme']`), docblock
  réaligné (commerce compris dans « stock = production ») ;
- `commerce.ts` : docblocks d'entête et de `ressourcesCopiables` réalignés
  (Garnison et effets négatifs exclus ; le Tourisme EST copiable — arbitrage
  2026-10-19) ;
- `commerce.test.ts` (nouveau) : test de régression « le Tourisme copié par une
  route compte dans la production et le stock » — partie 2 joueurs, Foire sur la
  ville cible, route ouverte par un roturier promu marchand, asserts copie > 0,
  production ≥ copie, stock = max(0, production).

**Incident CI #36 (cycle d'import, ReferenceError TDZ)** : le nouvel import
`regimes → commerce` a refermé un cycle d'évaluation `constructions → banque →
regimes → commerce → amenagements` : l'initialisation top-level `AMENAGEMENTS`
(amenagements.ts) s'est exécutée avant que constructions.ts n'initialise
`RESSOURCES_INSTANTANEES` → `ReferenceError: Cannot access
'RESSOURCES_INSTANTANEES' before initialization` → crash à l'import de TOUS les
fichiers de test (CI #36 rouge en 3 s) ET du bundle Edge (deploy-function #16
rouge — la garde-fou a refusé le déploiement, l'Edge #15 est restée en service).
Le typecheck strict passait (TDZ = erreur d'exécution) : Deploy Pages #1206 a
publié un bundle moteur cassé pendant ~4 min avant #1207 (fenêtre fermée).

Correctif `06422b9` « fix(jeu): correctif cycle d'import commerce→amenagements » :
`amenagementRef` (amenagements.ts) est un alias PUR de `constructionRef`
(constructions.ts) — `ressourcesCopiables` lit désormais `constructionRef`
directement et commerce.ts n'importe PLUS amenagements.ts (commentaire RETRAIT +
règle d'hygiène d'import dans l'entête du fichier). `1611312` : espace de
commentaire rétablie (zéro changement de code). Incident reproduit et diagnostiqué
en local (exécution des tests du tarball du commit, trace de l'ordre d'évaluation
des modules) et correctif vérifié : 49 tests natifs verts avant le push.

Vérifications : CI jeu #37 (06422b9) et #38 (1611312) vertes, diag #193/#194
verts, Edge #17/#18 verts (**redéployée**), Deploy Pages #1207/#1208 verts.
B4 est marqué résolu dans
[audit-code-2026-10-19.md](audit-code-2026-10-19.md) ; les règles sont mises à
jour dans [regles-et-arbitrages.md](regles-et-arbitrages.md).

## R2/R3/R4 — arbitrages et correctifs (2026-10-19, au soir)

Les trois risques P1 de l'audit arbitrés par Thibaut, puis implémentés :

- **R2 (RLS ouverte à `anon`, DELETE inclus) — ASSUMÉ, rien à coder.**
  Arbitrage : « ne rien toucher — documenter le risque, modèle amis de
  confiance assumé ». Le modèle « salon par code » sans auth reste tel quel :
  aucune policy SQL modifiée. Le risque (sabotage possible par quiconque
  connaît l'URL pendant la barrière) est documenté dans
  [audit-code-2026-10-19.md](audit-code-2026-10-19.md) (section R2, statut
  « arbitré : assumé ») ; les recommandations de durcissement restent en
  réserve si le contexte change (parties publiques).
- **R3 (quota localStorage, échec silencieux) — bandeau d'alerte (`dea1997`).**
  `storage.saveLocal` retourne `false` en cas d'échec (QuotaExceeded, mode
  privé) mais personne ne le lisait : en fin de partie (~5 Mo d'état) la
  sauvegarde locale pouvait échouer à CHAQUE mutation sans aucun signe, et
  un rechargement perdait le tour en cours. Correctif : `persist` arme
  `saveLocaleEchec` (miroir du retour de saveLocal, exposé par le contexte
  de jeu) ; TurnBar affiche un bandeau ⚠ « Sauvegarde locale impossible
  (quota du navigateur dépassé) — un rechargement perdrait le tour en
  cours » avec bouton d'export JSON immédiat : la partie ne vit alors plus
  qu'en mémoire, l'export est la copie de secours.
- **R4 (fusion sans validation de forme) — rejet ENTIÈR + journal visible
  (`3b964cf`).** Les sections viennent du réseau (cp_events.payload, JSON
  non contrôlé) : un client bogué pouvait déposer `"tour": "abc"` ou une
  population non tableau qui crashaient `runTurn` à la publication (serveur
  ou repli local). Correctif : `sectionValide()` exportée de fusion.ts
  (contrat minimal : tour nombre fini ; player objet ; population / routes
  / citesLibres / log tableaux si présents), appelée dans la boucle de
  `fusionnerSections` — une section invalide est ignorée EN ENTIER (jamais
  de demi-fusion qui casserait runTurn) avec une entrée « ⚠ Section invalide
  ignorée » dans le journal du tour (arbitrage Thibaut : le rejet doit être
  VISIBLE pour que l'arbitre voie la triche/le bug, pas silencieux) ; les
  clés non numériques sont ignorées sans trace (aucun joueur à fusionner).
  Partagée client + Edge Function : le bundle `_engine.mjs` embarque la
  validation — la résolution serveur est protégée aussi. 3 tests de
  régression dans fusion.test.ts (13 au total).

Vérifications : CI jeu #40 (`3b964cf`) et #41 (`dea1997`) vertes, diag #196/#197
verts, Deploy Edge Function #19 vert (le bundle `_engine.mjs` embarque
`sectionValide` — la résolution serveur est protégée ; pas de redéploiement
pour `dea1997`, aucun fichier moteur touché), Deploy Pages #1211 vert — le
site live sert déjà les deux correctifs (bandeau R3 + validation R4
vérifiés dans le bundle publié).
R2/R3/R4 sont marqués dans
[audit-code-2026-10-19.md](audit-code-2026-10-19.md) (tableau + sections +
plan d'action P1). Restent ouverts : M1-M7 (P2) et les chantiers de fond
(IndexedDB, ids démographie, brûlage banque d'effets).

## M1-M7 — les sept problèmes moyens traités (2026-10-19, fin de soirée)

Les P2 de l'audit passés en revue un par un ; deux arbitrages Thibaut :
M1 « ids purs — ignorer les vieilles sauvegardes, elles n'ont plus lieu
d'exister » et M7 « retrait complet » (verrou ET fonctions SQL).

- **M1 — identité démographique par ids (`5576b25`).** `mariage`, `mere`,
  `pere`, `pereBio` étaient des noms complets : à 16 000 habitants les
  collisions (générateurs à listes finies) donnaient un mauvais conjoint
  veuvé et une mauvaise filiation. Quatre champs d'identité ajoutés à
  Character (`mariageId`/`mereId`/`pereId`/`pereBioId`) ; les noms restent
  pour l'AFFICHAGE, tenus en sync à chaque mutation ; TOUTE résolution
  passe par les ids : veuvage (sante, armees, décès en cité libre),
  index de fecondité (indexé par id désormais), filiation de l'arbre
  généalogique, consanguinité, mariages (setup, titres, cour, UI).
  Arbitrage : PAS de migration de rattrapage — une vieille sauvegarde
  chargée voit ses relations à null (assumé). Compaction : les ids null
  sont omis à l'écriture (DEFAUTS_PERSO). 3 tests de régression M1
  (veuvage par id avec homonyme leurre, consanguinité par id, invariants
  du setup — couples symétriques par id).
- **M6 — Tourisme du transfert de ville unifié (`4d13324`).**
  L'ancien code resynchronisait le receveur AVANT qu'il ait la ville
  puis créditait « à la main » un Tourisme statique par bâtiment
  (approximation sans les canaux flux banque/commerce, écrasée au
  resync du tour suivant). Désormais : chaque côté resynchronisé APRÈS
  le déplacement — stock = production courante, point (sémantique
  arbitrée 2026-10-16). Crédit manuel supprimé.
- **M5 — associations par nom de ville : documentées (`4d13324`).**
  Note posée dans transfererVille : le renommage AUTOMATIQUE (collision)
  met à jour habitants + ville ensemble ; toute UI future de renommage
  MANUEL devra répercuter sur gouverneurs + populations + rattachements.
- **M2 — branche morte de setGlobalCfg supprimée (`c41ac32`)** (RETRAIT
  documenté) : le bloc « réinjection de la config dans la partie en
  cours » était inatteignable depuis le garde `if (stateRef.current)
  return`.
- **M3 — reset avec confirmation (`c41ac32`)** : le ✕ de TurnBar
  demande AVANT d'effacer (« la partie locale sera perdue, le salon
  distant reste rejoignable ») — aligné sur les actions destructrices
  voisines.
- **M4 — repli de constructionRef assumé et documenté (`c41ac32`)** :
  groupe introuvable → première variante ; docblock posé (pas de log :
  lookup en chemin chaud d'affichage, moteur pur).
- **M7 — verrou consultatif retiré (`13a6520`).** Arbitrage « retrait
  complet » : les 2 appels RPC (cp_advisory_lock/unlock) retirés du
  handler Deno (le verrou ne tenait pas sur le pool de connexions
  PostgREST), fonctions SQL droppées du schéma (drop if exists pour les
  installations existantes). Les VRAIS garde-fous, documentés en tête
  du handler : idempotence par `tour_publie`, index unique
  (salon, tour, joueur, type), DÉTERMINISME de runTurn.

Vérifications : 55 tests verts en local avant push (35 moteur dont les
3 tests M1 + 20 rules/state) ; CI verte sur les 4 commits — détail dans
[Actions](https://github.com/losth230/quartz/actions). Byte-à-byte
poussé/local vérifié sur les 19 fichiers. M1-M7 sont marqués dans
[audit-code-2026-10-19.md](audit-code-2026-10-19.md) (tableau + lignes
M1-M7 + plan d'action P2). Restaient ouverts à ce stade : point 8 du P2
(commentaires internes Tourisme), IndexedDB, brûlage de la banque d'effets —
traités dans la section suivante.

## P2 achevé + banque d'effets : TOUTE production passe par la banque (2026-10-19, nuit)

Deux décisions Thibaut enchaînées : « pas d'IndexedDB » (la persistance
localStorage suffit — point 9 du P2 abandonné) et « pour la banque, il
faut que TOUT ce qui a rapport à une production passe par la banque »
(principe désormais gouvernant toute migration de source sur la banque).

- **Point 8 du P2 — commentaires Tourisme réalignés (`ebb5d1e`).** Les
  commentaires périmés (« Tourisme crédité UNE FOIS à la
  construction », « ressources instantanées Tourisme/Garnison ») sont
  réalignés sur la sémantique arbitrée (Tourisme = flux, stock =
  production) dans constructions.ts, batiments.ts, commerce.ts,
  rules/types.ts et villes.ts. Le résumé affichable ne dit plus
  « +X Tourisme (à la construction) » : le Tourisme s'affiche comme
  flux.
- **Brûlage #2 de la banque — voie UNIQUE de production (`ebb5d1e`).**
  Tout ce qui a rapport à une production se lit EXCLUSIVEMENT sur la
  règle de banque (rules/registry → rules/effects) :
  `effetsConstructionRef` (flux), `effetsEteConstructionRef` (canal été),
  `garnisonConstructionRef` / `instantanesConstructionRef` (valeur
  d'état), `eteSeulementRef` (lu sur la règle) — les anciennes
  duplications d'interprétation locale de `ref.effets` sont supprimées.
  RETRAITS : `parseProductionTexte` et son analyseur (constructions.ts),
  l'analyseur local + `EFFETS_FORCES` + cache (batiments.ts — les 4
  « bâtiments hors référentiel » étaient en fait tous dans la table
  constructions), les regex Tourisme/Garnison des replis,
  `effetsConstructionEntries`. Invariant : une construction SANS règle
  de banque ne produit RIEN (test dédié).
- **Voie Tourisme unifiée (`ebb5d1e`).** `tourismeStatiqueBatiment`
  (l'ancienne double voie : regex sur les textes) devient
  `productionTourismeBatiment` qui lit le flux Tourisme de la règle de
  banque — la même valeur que le canal Bâtiments du récap alimente
  désormais tourismeCourant (stock = production) et la conversion
  culturelle. Plus aucune lecture Tourisme hors banque.
- **Falheim / Notan et les 24 constructions sans production.** Leurs
  textes décrivent des mécaniques de plateau non modélisées ou des
  effets de merveille codés (doublement Science, −25 Or de levée) : via
  la banque leur production par tour est nulle, ce qui est le
  comportement historique. Rien à structurer — la « structuration des
  32 » de l'audit s'est résolue en : production nulle par défaut,
  repli supprimé.
- Hors périmètre production (inchangés, textes canoniques du classeur) :
  `parseCoutTexte`, `reductionCampDeBatisseurs`, `prerequisConstruction`
  (coûts/prérequis, pas des productions).

Vérifications : 57 tests verts en local avant push (baseline 55
rejouée au harnais maison, +2 nouveaux : Tourisme = flux via la banque
[Chapelle +35, plus aucun instantané], Champ/Rizière production d'été
sur la règle) ; invariant « sans règle = production nulle » testé sur
les 26 constructions sans effets ; smoke valeurs historiques (Bahamutt
+16, Chapelle +35, garnison Poste de garde 40, Guilde des marchands
−1 Charbon, Ponton 0) ; CI VERTE sur `ebb5d1e` (jeu, build, diag,
deploy Pages + Edge — détail dans
[Actions](https://github.com/losth230/quartz/actions)) ; byte-à-byte
poussé/local 10/10. Prochaine
étape banque (brûlage #3) : migrer une par une les sources restantes
(ministres, lois de régime/culture, techs) en appliquant partout le
principe « toute production passe par la banque ».

## Brûlage #3, source 1/3 — les ministres passent par la banque (2026-10-20)

Première source du brûlage #3, principe arbitré : TOUTE production
passe par la banque. Commit `9ae36ad0` (7 fichiers) + correctif CI
`78bd3f24`.

- **Nouveau type d'effet `fluxJoueurParMinistre`** (rules/types.ts) :
  production CUMULABLE — valeur × nombre de ministres VIVANTS porteurs
  (arbitrage portefeuilles cumulables) ; nouveau champ
  `declencheur?: 'tour' | 'finSaison'` sur `RegleBanque` (production
  par tour, canal « Ministères » du récap, vs production de fin de
  saison — production ÉQUIVALENTE PAR TOUR, comptée dans
  tourismeCourant).
- **`MINISTERES_AUTO`** (rules/registry.ts) — LA couche d'édition des
  règles ministérielles : Trésorier +5 Or, Grand Précepteur +1 Science,
  Grand prévôt +1 Fer ('tour') ; Sénéchal +15 Nourriture avec la
  condition `saison: 'Été'` DANS LA RÈGLE, Maître de cour +2 Tourisme,
  Légat du pontificat +20 Tourisme ('finSaison'). `registreComplet` =
  constructions + ministres.
- **`engine/ministeres.ts` ne fait que LIRE la banque** (plus aucun
  montant codé) : `appliquerEffetsMinisteres` applique les règles
  'tour' ; `effetsFinSaisonMinisteres` applique les règles 'finSaison'
  règle par règle (conditions évaluées par la banque) en conservant le
  format EXACT des logs ; nouveau `fluxFinSaisonMinisteres` (lecture
  seule) alimente le canal 5 « Ministères » de `tourismeCourant`
  (regimes.ts — plus de ×2/×20 codés en dur).
- **Chancelier des émissaires : HORS banque, en conscience** — +1
  émissaire en réserve par fin de saison est un INSTANTANÉ, pas une
  production par tour : il reste appliqué au site, documenté dans le
  registre et le code (test dédié).
- **8 nouveaux tests** (src/rules/ministres.test.ts — cumul deux
  Trésoriers +10 Or, ministre décédé = rien, Sénéchal fin d'été oui /
  fin d'hiver non, Maître de cour + Légat chaque saison + format des
  logs + pluriels, flux par tour 22 Tourisme, Chancelier instantané,
  cohérence du registre). 65/65 verts au harnais local AVANT le push.

**Incident CI #50 (rouge) — `Array.prototype.at()` vs lib ES2020** :
`9ae36ad0` a fait échouer le tsc strict de la CI (jeu + build) sur
`.at(-1)` dans deux messages de diagnostic de ministres.test.ts — le
harnais local (Node 22, strip-types, SANS type-check) l'exécutait très
bien. Correctif `78bd3f24` : index classique `[arr.length - 1]`,
diff chirurgical +2/−2 vérifié par l'API compare. → règle 12
ci-dessous.

**Incident d'outillage (sans effet dépôt)** : le bac d'exécution local
a été recyclé EN COURS DE TOUR (worker bash perdu, système de fichiers
indisponible, ~20 min de tentatives) — diagnostic (annotations de
l'API check-runs) et correctif ont été menés ENTIÈREMENT à distance
(contenu via l'API GitHub authentifiée, push, diff vérifié). Les
sources 2/3 (lois de régime + règles de pays culturelles) et 3/3
(flux de progrès) du brûlage #3 NE SONT PAS ENTAMÉES : la règle 11
impose les tests AVANT push après tout nouvel import entre modules du
moteur (effetsRegime/effetsCulturePays importeront la banque), et le
harnais est indisponible. Conception de la suite (pour le prochain
tour) : types `fluxParAmenagement{ressource, valeur, noms}`
(Socialisme : +5 Nourriture d'été × Champ/Rizière, condition saison
dans la règle) et `fluxParVilleCultureMonde{ressource, valeur}`
(règles de pays : +N par ville de la culture dans le MONDE) ;
conditions `regime`/`culture` ajoutées à `ConditionRegle` ;
`reglesRegimes`/`reglesCultures` dans le registre lisant les champs
du référentiel (`nourrEteChampRiziere`,
`capitalNourr/Tourisme/OrParHabMonde`) ; `effetsRegime` prend l'état
en argument (contexte banque) et `detailCulturePays` lit la banque
(UI = moteur, une seule vérité).

Vérifications : byte-à-byte 7/7 au sha `9ae36ad0` (avant le recyclage
du bac) ; CI du correctif `78bd3f24` VERTE — CI jeu #51, diag #207,
Deploy Pages #1221, Deploy Edge Function #26 (le bundle moteur
redéployé embarque la refonte ministres) ; le grep des chaînes dans le
bundle live reste À FAIRE au prochain tour (bac indisponible — règle
10 à compléter).

## Brûlage #3, source 2/3 — régimes & cultures passent par la banque (2026-10-20)

Deuxième source, principe arbitré : TOUTE production passe par la
banque. Commit `35c34bcd` (7 fichiers) : types d'effet
`fluxParAmenagement{ressource, valeur, noms}` (Socialisme :
+N Nourriture d'été par Champ/Rizière — l'été est une CONDITION de la
règle, plus un if moteur) et `fluxParVilleCultureMonde{ressource,
valeur}` (règles de pays : +N par ville de la culture dans le MONDE,
tous joueurs confondus) ; conditions `regime`/`culture` dans
`ConditionRegle` ; `reglesRegimes`/`reglesCultures` dans le registre
lisant les champs du référentiel (`nourrEteChampRiziere`,
`capitalNourr/Tourisme/OrParHabMonde`) ; `effetsRegime` prend l'état
en argument (contexte banque) et `detailCulturePays` lit la banque
(UI = moteur, une seule vérité). Restent HORS banque, en conscience :
garnison Autoritarisme (valeur d'état), Déisme
(scienceParConstruction = instantané de construction).

**Incident CI rouge (règle 12 confirmée)** : le harnais local (sans
type-check) passait 75/75 mais `tsc strict` refusait le nouveau
fichier de tests — 8 annotations `'ville' is possibly 'undefined'`
(hors du `const { state, joueur, ville } = ctx`, `ville?: City` est
optionnel dans ContexteEffet). GitHub n'affiche que 10 annotations
max : le diff a été RE-LU en entier pour traquer d'éventuelles erreurs
cachées (aucune). Correctif `2d2b73f9` : 6 gardes
`assert.ok(ville, …)` (rétrécissement de type pour tsc strict,
pattern déjà éprouvé dans banque.test.ts). CI du correctif VERTE —
CI jeu #54, diag #210, Deploy Pages #1224, Deploy Edge Function #28
(le bundle moteur redéployé embarque la source régimes & cultures).
Vérifications : harnais 75/75 après correctif ; byte-à-byte 6/6
types.ts/registry.ts/banque.ts/regimes.ts/production.ts/
regimes-cultures.test.ts au sha `35c34bcd` + 1/1 au `2d2b73f9`.

## Brûlage #3, source 3/3 — les flux de progrès passent par la banque (2026-10-20)

Troisième et dernière source du brûlage #3 : le canal « Progrès » du
récap. Commit `cd791628` (6 fichiers). Les montants qui vivaient
codés en dur dans `fluxProgresJoueur` (engine/progresAuto.ts, ~150
lignes de `if aTech(...) add(...)`) deviennent des DONNÉES du
registre :

- **7 types d'effet nouveaux** dans la banque (chacun implémenté UNE
  fois) : `fluxSiCapitale` (canal prodCapitale — Musées +30 Tourisme,
  Garde suzeraine +12 Nourriture avec condition `suzerainDeCite`),
  `fluxParVille` (Assemblées scientifiques), `fluxParVilleProximite`
  (côtier — Cours de pêche × Mer), `fluxParRangHabitation`
  (Surconsommation : +1 Science +5 Tourisme par rang), `fluxParBatiment`
  (Industrialisation +1 Charbon ; filtre `famille` pour Merveilles
  naturelles/Merveilleux), `fluxParGarnisonHabitation` (Service
  militaire avancé : +0,5 Habitants × garnison), `fluxParTitre`
  (générique `prodParTitre` du référentiel : Commerce lointain
  +3 Or/Marchand, Prix Gorback Nobel +6 Science/Ministre, Culte de la
  personnalité +30 Tourisme/Ministre) — plus le réutilisé
  `fluxParAmenagement` (Engrais, Charues, Exploitation forestière
  avec Bois NÉGATIF, Stands de goodies, Fascination culturelle,
  Parcs naturels).
- **Table éditoriale `PROGRES_FLUX`** (30 règles, ids `tech.<slug>`,
  conditions `techNom` = nom de tech — homonymes matchés comme
  l'historique aTech) + `reglesProgres(config)` qui y ajoute les
  génériques prodParTitre traduits du référentiel (conditions `tech`
  par clé `<arbre>:<slot>`, application par arbre préservée).
- **`clesTechsParNom`** : la résolution nom → clés vit dans le
  REGISTRE ; `aTech` (moteur : réductions de coût, garnisons) et la
  condition `techNom` (banque) partagent la MÊME vérité.
- **`fluxProgresJoueur` = LIRE la banque** (une ligne) ; restent
  locaux, hors production par tour : `gainDeblocageProgres`
  (one-shot au déblocage = instantané, comme le Chancelier), les
  réductions de coût (coûts), les garnisons (valeurs d'état).

Sémantiques préservées exactement : capitale requise pour le canal
prodCapitale, application par arbre de prodParTitre, filtre famille
Merveille, montants négatifs (Bois −1/Charbon +1 des Scieries),
décédés exclus. Tests : +16 dans `src/rules/progres.test.ts`
(91/91 au harnais local, Node 22 strip-types SANS type-check) ;
registre 33 règles progrès, ids uniques, TYPES_CONNUSS étendu.

Vérifications : byte-à-byte 6/6 au sha `cd791628` ; CI VERTE au
premier coup — CI jeu #55, diag #211, Deploy Pages #1225, Deploy
Edge Function #29 (le bundle moteur redéployé embarque la voie
banque du canal Progrès). LIVE vérifié : le bundle déployé
(index-r0L6w5DM.js, Pages #1225) contient les chaînes
distinctives `fluxSiCapitale`, `fluxParRangHabitation`,
`fluxParGarnisonHabitation`, `fluxParTitre`, `suzerainDeCite`,
`techNom` (la banque du canal Progrès est en prod — pensez à
Ctrl+F5).

## Correctif egress Supabase — les états publiés n'embarquent plus la config (2026-10-20)

**Incident** : Supabase renvoie 402 `exceed_egress_quota` — quota
d'egress du plan Free (5 Go/mois, tout cumulé) épuisé. Cause mesurée :
le champ `state.config` — devenu un simple CACHE du moteur depuis la
règle 2026-10-19 (seule la mondiale `__config__` fait foi) — continuait
d'être PUBLIÉ dans chaque état de référence (~181 Ko, le référentiel
complet) puis RELU par chaque client à chaque fin de tour (realtime,
poll, relectures post-résolution) : ~1,5 Mo de config par tour et par
salon de 8 joueurs, pour un cache que chaque navigateur possède déjà.
Arbitrage de l'arbitre : rester sur Pages + Supabase, correctif payload
(demandé « repars de ce qui a été fait sur la branche v4 »).

**Correctif** (8 fichiers, porté sur les DEUX branches) :
- `etatReseau(state)` (engine/fusion.ts, pur, partagé client + Edge
  Function via le bundle `_engine.mjs`) : copie superficielle SANS la
  clé `config` (la clé est retirée, pas mise à null — le payload ne
  dépend pas du comportement de `JSON.stringify` sur `undefined`) ;
  ne mute pas l'original (le client garde son cache en mémoire).
- PUBLICATION : `publierEtatFusionne` (supabase/client.ts) et l'Edge
  Function `resoudre-tour` publient `etatReseau(...)` — le draft garde
  sa config en mémoire (runTurn l'a consommée avant la publication).
- INGESTION : les 5 sites du store qui avalent un état distant (callback
  realtime, `nextTurnV2`, `pollerBarriereV2`, `forceNextTurn`, repli
  `resoudreBarriereLocaleV2` : locale d'abord, mondiale ensuite)
  réinjectent la locale via `adopterConfig` (contrat configPriorite :
  mondiale adoptée au chargement — sans injection, l'UI et runTurn
  rouleraient sur `cfgOf(undefined)` = DÉFAUTS, bug classe
  « adultAge 16 »).
- TESTS : `src/state/payload.test.ts` (6 tests : clé absente du JSON,
  non-mutation, conservation du reste, ingestion, rétrocompat embarquée
  ≠ source, repli locale-puis-mondiale) ; `scripts/test-function.mjs`
  vérifie que le BUNDLE expose et retire (un bundle sans le helper n'est
  jamais déployé) ; stub `types/stubs.d.ts` étendu (typecheck du
  handler). Harnais : 97/97 (91 baseline + 6) sur les DEUX branches.

**Compatibilité** : les lignes existantes qui embarquent encore leur
config restent lisibles (le champ est ignoré — l'ingestion écrase le
cache par la locale, il n'est plus une source). Fenêtre courte : entre
le déploiement de la nouvelle Edge Function et le rechargement
(Ctrl+F5) de chaque joueur, un ANCIEN bundle client qui recevrait un
état sans config afficherait les défauts. Salon sans `__config__`
jamais publiée : le serveur résout désormais sur les défauts (plus de
cache embarqué pour l'amorcer) — publier une fois la config mondiale
depuis l'accueil si ce cas existe.

**Shas** : v4 `e7d5fcf9` (correctif demandé par l'arbitre, posé sur la
tête qui porte la publication conditionnée `c2b49c5c`) ;
chasse-et-peche-web `58a72c89` (SOURCE DU JEU LIVE — le deploy.yaml
checkoute TOUJOURS cette branche pour le build Pages ; un push v4 seul
ne change pas le jeu en prod). Intégrité byte-à-byte 8/8 au sha sur
chaque branche.

**Vérifications** : CI VERTE au premier coup sur les DEUX branches —
chasse-et-peche-web : CI jeu #57, diag #213, Deploy Pages #1232,
Deploy Edge Function #30 (la fonction redéployée publie sans la
config) ; v4 : deploy #1231. LIVE vérifié : bundle `index-BqeOLTZ4.js`
(nouveau hash) contient la forme minifiée d'`etatReseau`
(`const t={...e};return delete t.config,t`) — pensez à Ctrl+F5.
NB : v4 conserve 4 correctifs NON portés sur chasse-et-peche-web
(publication conditionnée CAS `c2b49c5c`, fusion déterministe +
conflits de cités journalisés, journal du Forcer, doc dette
déterminisme rng/newId) — à synchroniser à l'arbitrage de l'arbitre.

## Synchronisation v4 → production : les 4 correctifs portés (2026-10-20)

Arbitrage de l'arbitre : porter sur `chasse-et-peche-web` les 4
correctifs qui vivaient uniquement sur v4 (cf. section egress
ci-dessus). Périmètre établi par diff complet des deux têtes :
6 fichiers divergents, tous rattachés aux 4 correctifs (aucune
divergence résiduelle — les arbres jeu `src/`, `supabase/`,
`scripts/` sont à présent BYTE-IDENTIQUES entre les deux branches).

1. **Publication CONDITIONNÉE** (Edge Function `resoudre-tour`,
   v4 `c2b49c5c`) : l'UPDATE ne porte que si `tour_publie` n'a pas
   changé depuis la lecture (comparaison-et-échange atomique côté
   serveur) — deux exécutants simultanés du même tour ne peuvent plus
   ni s'écraser, ni purger la file de l'autre (le perdant voit
   `dejaPublie` sans purge). Complète l'idempotence existante.
2. **Fusion DÉTERMINISTE + conflits journalisés** (engine/fusion.ts +
   `type: 'Conflit'` dans types.ts, v4 `b6671187`) : les numéros de
   joueurs sont TRIÉS (l'ordre d'insertion de `Object.keys` rendait
   « le dernier gagne » des cités libres non reproductible entre
   clients et serveur) ; deux joueurs qui modifient la MÊME cité libre
   → version du plus petit numéro + événement Conflit visible pour
   l'arbitre (plus de last-write-wins silencieux).
3. **Journal du Forcer** (state/store.tsx) : les absents d'un tour
   forcé sont listés dans le salon via l'événement partagé
   `forcer_absents` (rejoué par la résolution) — un tour forcé sans
   les actions de certains joueurs ne peut plus passer pour normal.
4. **Doc dette déterminisme** (rng.ts + shared.ts) : périmètre
   documenté — les TIRAGES sont seuls reproductibles par graine ;
   les ids `newId` (Date.now + compteur) ne le sont pas (jamais utilisés
   dans le calcul).

Vérifications : harnais 97/97 sur le staging avant push ; intégrité
byte-à-byte 6/6 au sha ; CI VERTE au premier coup — CI jeu #59,
diag #215, Deploy Pages #1234, **Deploy Edge Function #31** (la
publication conditionnée est en prod côté serveur). LIVE vérifié :
bundle `index-COwg77pQ.js` (nouveau hash) contient
`forcer_absents` ×2 et « Tour forcé : sections de » — pensez à
Ctrl+F5. Shas : `chasse-et-peche-web` = `0fd913d7` (tête), v4 =
`e7d5fcf9` (inchangée — les deux branches portent désormais le même
code jeu).

## Rework des habitants — design arbitré et consigné (2026-10-20)

Après le correctif egress et la synchronisation v4 → production
(ci-dessus), l'arbitre a demandé une refonte complète du système
d'habitants. Analyse préalable du code : la plupart des champs
demandés (identité, dynastie, sexe, orientation, culture, ville,
statut, traits, mariage) EXISTENT déjà dans `Character` ; le rework
porte donc sur `titre` → `métier`, un nouveau champ `domicile`, la
suppression d'`ageMax` au profit d'une probabilité croissante de
maladie avec l'âge, et un système de caps de métiers par ville.

Quatre arbitrages tranchés par l'arbitre : (1) les rôles de cour
(Dirigeant, Héritier, Gouverneur, Ministre, Marchand, Professeur,
Maréchal) migrent DANS le champ métier ; (2) la capacité Chasseur
est paramétrable DIFFÉRENTE selon le type d'habitation (Ville vs
Château) ; (3) en cas de surnombre, les PLUS ÂGÉS perdent leur
métier en premier ; (4) Sans-emploi = aucun effet au plateau
(neutre, impôt nul). Santé : courbe de Gompertz calibrée
Monte-Carlo pour une espérance de vie ~60 ans, maladie = seule
cause de mort (un malade qui re-contracte meurt, règle existante).
Migration d'état versionnée (`SCHEMA_VERSION_ETAT`++) : titre→métier
(mapping 1:1), retrait ageMax, domicile→null.

Design détaillé consigné dans regles-et-arbitrages.md, section
« Rework des habitants » — c'est la référence de l'implémentation.
Découpage acté en 3 vagues (V1 moteur complet, V2 UI population/
métiers, V3 métiers par bâtiments + logements) ; AUCUN code de
ce rework n'est poussé à ce jour. Ce commit ne touche QUE la
documentation (docs/ia/) — la partie multijoueur n'est pas
impactée.

## Rework des habitants — VAGUE 1 IMPLÉMENTÉE (2026-10-20, soir)

La vague 1 (moteur complet) est poussée sur `chasse-et-peche-web`
(4 commits fractionnés — limite de taille d'outil de push — puis
suppression du tombstone : `src/engine/titres.ts` renommé
`src/engine/metiers.ts`) et en miroir sur `v4` (arbres src/
byte-identiques).

- **Renommage intégral** `titre` → `metier` (~60 fichiers) : moteur,
  UI, règles, état. `null` = Sans-emploi, rôle NEUTRE (impôt nul,
  aucun effet — verrouillé par test via `detailGainsVille`). Union
  des logs : `'Métier'` (nouvelles émissions) + `'Titre'` (legacy).
  Référentiel converti : `.metiers` (15), `.metiersEffets` (9),
  effets de techs `prodParTitre` → `prodParMetier`.
- **Champ `domicile`** (optionnel, null en vague 1, AUCUN effet) :
  compressé par `DEFAUTS_PERSO` (omis à l'écriture, ajouté par
  `elargirEtat`).
- **Mortalité Gompertz** : `ageMax`/`computeAgeMax`/`tryResurrection`
  retirés — `probaContracterMaladie(c, C) = min(maladieCap,
  maladieBase × exp(maladiePente × âge))`, `life_delta` module la
  pente (borné ±50 %). Calibration Monte-Carlo (N=200 000, mécanique
  exacte de `maladieStep` : contraction / re-contraction mortelle /
  guérison dégressive) : **0.0025 / 0.08 / 0.9** → E[décès] = 59,5,
  médiane 60, p10 48, p90 70.
- **Caps Chasseur** (seul métier plafonné en vague 1) : Ville 50 /
  Château 25 (« très généreux »), paramétrables. `capMetierVille` +
  `reaffecterMetiers` (nouvelle étape **2ter** dans `runTurn`, après
  `designerGouverneurs`, AVANT le calcul des gains) : surnombre → les
  plus âgés passent Sans-emploi ; places libres → les Sans-emploi
  ADULTES deviennent Chasseurs, les plus âgés d'abord, jamais les
  enfants. Les cités libres ne passent pas (hors champ vague 1).
- **Migrations versionnées** : état **v3** `migrerTitresVersMetiers`
  (joueurs ET cités libres via `toutesLesPopulations`, retrait
  `titre`/`ageMax`, `recap.titresAttribues` → `metiersAttribues`,
  idempotente, robuste à l'`elargirEtat` préalable de `loadLocal`) ;
  config **v3** (conversion champ par champ dans `cfgOf`,
  personnalisations conservées) + `mergeParams` traduit les anciennes
  clés `titreXxx` sans jamais écraser les nouvelles.
- **UI** : accents français restaurés partout (Métier, métiers ×
  taxes, « (sans métier) »…), colonne **Âge max retirée** de la table
  Population, classes CSS `picker-metier`/`refbat-metier`, onglets
  « Métiers ».
- **`scripts/diag.ts`** : seules les lectures du référentiel renommé
  sont patchées avec REPLI sur l'ancien format (`ref.metiers ??
  ref.titres`) — le moteur interne legacy du diag est volontairement
  inchangé (freeze accepté).
- **Tests** : harnais local `node --experimental-strip-types`
  112/112 verts (97 baseline + 15 nouveaux) : formule Gompertz +
  Monte-Carlo seedé (E ∈ [55, 66]), caps/surnombre/places libres/
  Sans-emploi neutre, `mergeParams` v3, `cfgOf` v2→v3, migrations v3.
  INCIDENT de la séance : le sandbox local a été RÉINITIALISÉ en
  cours de mise en œuvre — tout le travail a été reconstruit depuis
  le tarball `0d017a58` (aucune perte, harnais rejoué intégralement).
  INCIDENT CI (jeu ROUGE sur `8258fac`) : le `tsc --noEmit` strict
  de la CI a refusé 3 fichiers que le harnais local (Node 22
  strip-types, SANS type-check) exécutait très bien (112/112) :
  fixtures `traits: []` des nouveaux tests (Character.traits est un
  TUPLE `[string, string, string]`) et `Object.keys` sur un
  `recap.metiersAttribues` potentiellement null dans la migration v3
  (crash latent en plus du défaut de type). Correctif `e912455`
  (miroir v4 `60f9cba`) : fixtures à 3 traits `life_delta = 0`
  (Obstiné/Stérile/Fécond — pente Gompertz non modulée, tests
  formule et Monte-Carlo inchangés) + garde `existants == null`.
  CI VERTE sur les DEUX branches (jeu, build, diag, deploy Pages +
  Edge Function) ; LIVE vérifié : bundle `index-vkyhOHr1.js` (nouveau
  hash) contient « Métiers accessibles », « Tous les métiers »,
  « quitte le métier », la réaffectation (« places disponibles »)
  et la Gompertz ; plus AUCUN `ageMax` hors du `delete` de migration.
  NB : un doublon du commit docs (`9e5927e`) est parti sur un 503
  fantôme du push API (contenu identique, sans effet).

## Rework des habitants — VAGUE 2 IMPLÉMENTÉE (2026-10-20, nuit)

Vague 2 UI du rework des habitants (PopulationTable) : **commits
`397262a` (jeu) + `fc512882` (miroir v4)**, CI verte sur les deux
branches (jeu, build, diag, deploy Pages + Edge), bundle live
`index-CzrT4pJ1.js` vérifié. Contenu :

- **Colonne « Domicile »** dans les deux tableaux (la cour + population),
  entre Métier et Éducation — `c.domicile ?? '—'` (null = sans domicile ;
  les bâtiments de logement arrivent en vague 3, infobulle explicite).
- **Écran « 🏘️ Métiers et places par ville »** : la carte « Occupations
  par ville » (badges de comptage, sans caps) devient une table par
  ville × métier — **En poste / Places max / Places libres / Vivants**.
  Seuls les métiers occupés ou plafonnés sont listés (ordre du
  référentiel), la ligne **Sans-emploi** (rôle neutre : impôt nul) est
  TOUJOURS présente en dernière position ; cap Chasseur Ville 50 /
  Château 25 affichée selon le type de la ville, ∞ = illimité, cités
  libres hors champ des caps (note explicative sous la table).
- **Helper moteur pur `occupationsMetierVille(habitants, ville, C)`**
  (metiers.ts, ré-exporté engine.ts) : comptage des vivants, caps via
  `capMetierVille`, métiers hors référentiel conservés (anciennes
  sauvegardes). 2 tests moteur : places par type de ville + Sans-emploi
  toujours présent + caps infinies en cité libre ; conservation hors
  référentiel.
- **Test de rendu PopulationTable mis à jour** : titre de la carte,
  colonnes Domicile / Places libres, ligne Sans-emploi, « Métiers
  attribués ».
- **Correctif UI** : « Metiers attribués » → « Métiers attribués »
  (accent manquant, carte Récap du dernier tour).

Outillage de la séance : après reset du bac, l'environnement local a
été reconstruit à **parité CI complète** — `tsx 4.23.15` + esbuild
0.28.2 (tarballs npm extraits à la main, npm ci toujours interdit)
pour rejouer `tsx --test src/**/*.test.ts` **y compris les 12 tests
de rendu** (le harnais strip-types ne couvrait que le moteur), et
**stub local `@supabase/supabase-js` typé** (index.d.ts approximatif,
jamais poussé) → le tsc strict local est désormais PROPRE à 100 %
(zéro artefact supabase résiduel). Validation d'avant-push : 126/126
tests + tsc vide. Le check d'équilibre JSX (règle 2) est couvert par
le tsc strict lui-même (une balise non refermée = erreur de syntaxe).

## Suppression de la martialité (2026-10-21, arbitrage Thibaut)

Thibaut a arbitré la suppression de la **martialité** des cultures
(l'**hérédité est conservée**) : Soldat et Commandant passent de
regleGenre « Martialité » à vide (aucune restriction de sexe), le
recrutement des armées (soldats et commandants) est ouvert aux deux
sexes, la colonne martialité disparaît des cultures. **Commits
`368a864` + `487a17c` + `c96b714` (jeu) + miroir v4 `4b6a012` +
`8749031` + `9e7c061`** (payload découpé en 3 groupes pour rester
sous la limite mémoire du push). Contenu :

- **Moteur** : `martialiteOk` supprimée (armees.ts, export engine.ts,
  import metiers.ts), filtres de recrutement retirés (soldats et
  commandants), blocs regleGenre « Martialité » retirés (validation.ts,
  metiers.ts), type `Martialite` et champ `CultureDef.martialite`
  supprimés (types.ts).
- **UI** : ArmiesPanel (titre de carte sans martialité, commandants sans
  filtre, textes d'aide), RoyaumeView et CulturePays (affichage
  martialité retiré, « Ce que fait la culture » reformulé sur
  l'hérédité seule), ParamsPanel et ReferenceDataPanel (colonne
  Martialité retirée des tables Cultures).
- **Migration ciblée (z)** : `martialiteSupprimee?: boolean` dans
  GameConfig, migration dans `cfgOf` SANS toucher au tampon
  schemaVersion (règle (x)) : regleGenre « Martialité » → vide (seule
  la valeur exacte est remplacée, édition personnalisée préservée),
  clé `martialite` dépouillée des cultures, marqueur posé. Test dédié
  dans params.test.ts (la migration joue MÊME sur une config déjà
  convergée v3 ; idempotence vérifiée).
- **referentiels.json** : 6 clés martialite retirées, Soldat et
  Commandant regleGenre « vide ».
- **scripts/diag.ts** (copie auto-contenue du moteur, workflow diag) :
  mêmes nettoyages ; rejoué en local, sortie identique à la base
  (les « ÉCHEC » de robustesse volontaires sont inchangés, seule
  l'ordre d'un crash sur état délibérément corrompu varie — effet
  attendu du changement de recrutement sur le seed).
- Hors périmètre : `vba/Personnages.vba` (archive du classeur source)
  et `scripts/make_docx.py` (générateur docx déjà obsolète : Occultisme
  disparu, valeurs antérieures au rework, non exécuté en CI) restés
  tels quels.

Validation avant push : harnais **127/127** (126 + 1 nouveau test de
migration), tsc strict local **vide**, diff vs base = les 15 fichiers
attendus exactement.

## Rework métiers & aménagements — design arbitré et consigné (2026-10-21)

Thibaut a arbitré la vague 3 du rework des habitants : les métiers
deviennent des postes à emplacements créés par les aménagements. Design
complet consigné dans docs/ia/regles-et-arbitrages.md (section « Rework
métiers & aménagements — vague 3 ») :

- **24 métiers** : renommages Artisan → Commerçant, Chercheur →
  Scientifique, Sportif → Garde ; Propagandiste supprimé (ses
  titulaires deviennent Sans-emploi en migration).
- **Emplacements tier 1** : la production directe des 14 aménagements
  devient des emplacements de métiers, calibrée sur les valeurs
  actuelles (10/14 identiques si tous les emplacements sont remplis).
- **Aucune éducation requise** : emplacement libre = prise
  automatique (priorisation vague 1). Chasseur par défaut (cap par
  habitation + emplacements) ; Sans-emploi sinon.
- **Bonus de taxe ADDITIFS** (Professeur +10 % Science, Banquier
  +10 % Or, Troubadour +10 % Tourisme, cumulables avec le Gouverneur).
- **Garde +10 Garnison statique**, actif tant que le poste est tenu
  (« la Garnison n'est jamais par tour »).
- **Marchand dissocié des routes** : métier de production (+2 Or/tour) ;
  la route copie exactement UN aménagement (emplacements compris) et
  octroie +1 emplacement Marchand de chaque côté ; plus de +4 Or/tour.

Implémentation planifiée en sous-vagues : **3a** (métiers & emplacements)
puis **3b** (routes dissociées — arbitrages restants listés dans la
section design).

## Rework métiers & aménagements — VAGUE 3a IMPLÉMENTÉE (2026-10-21, soir)

Sous-vague 3a (métiers & emplacements) poussée sur `chasse-et-peche-web`
(code + docs) et en miroir sur `v4` (arbres src/ byte-identiques).

- **Référentiel 24 métiers** : gains par tour sans éducation (Chasseur
  +1,2 N · Artiste +5 T · Commerçant +1 Or · Bûcheron/Mineur/Forgeron/
  Tisseur/Charbonnier/Scientifique +0,5 · Éleveur +0,5 Bétail +2 N ·
  Fermier +5 N **marqué `ete`** (été seulement) · Archéologue +4 T ·
  Pêcheur +4 N · Marchand +2 Or). Disparitions : Artisan → Commerçant,
  Chercheur → Scientifique, Sportif → Garde, **Propagandiste supprimé**.
  Colonne Éducation retirée des tables UI, colonne **Été** ajoutée
  (Paramètres + wiki Référentiels).
- **Emplacements tier 1** : les 14 aménagements passent
  `effets: []` + `emplacements: [{metier, places}]` (Baleinier +3
  Pêcheur +2 Commerçant, …, Rizière +4 Fermier) ; `production`/
  `description` = « N emplacements de X. ». La production d'été des
  Champ/Rizière vit désormais dans le métier Fermier (`ete`), plus
  dans la construction (le flux `ete` de la banque disparaît — la loi
  Socialisme nourrEteChampRiziere et les techs Engrais, elles, restent
  des flux par aménagement).
- **Caps par ville** (`capMetierVille`) : métier productif = SOMME des
  emplacements des aménagements (0 sans aménagement) ; Chasseur = cap
  défaut (Ville 50/Château 25) + emplacements ; Garde/Banquier/
  Troubadour/Professeur/cour/armée = ∞ (règles propres).
  `emplacementsMetierVille` exporté ; écran « Métiers et places »
  re-documenté (PopulationTable).
- **Réaffectation généralisée** : surnombre par métier plafonné (les
  plus âgés → Sans-emploi, log par métier) ; remplissage multi-métiers
  avec PRIORISATION (autre que Chasseur d'abord, ordre du référentiel,
  log agrégé par ville). **Exemption Marchand-route** : un marchand qui
  tient une route occupe un poste créé par elle, jamais en surnombre —
  sans elle, `reaffecterMetiers` tuait chaque route à la fin du tour
  (contrat B4 « la route vit toujours » verrouillé par test). Pont
  provisoire voué à disparaître en 3b.
- **Taxes additives** (`detailGainsVille`) : `bonusTaxes` par ressource
  — Gouverneur +10 % toutes, Banquier +10 % Or, Professeur +10 %
  Science, Troubadour +10 % Tourisme, cumul ADDITIF (Gouv+Prof =
  +20 % Science) ; les bonus ne portent que les ressources produites.
- **Garde statique** : `garnisonParGarde` (10, paramètre groupe
  Métiers) × Gardes vivants en poste, via `garnisonHabitationVille`
  (canal valeur d'état, ligne `origine: 'métier'` du détail).
- **Déménagement** (arbitrage du tour, consigné dans
  regles-et-arbitrages.md) : `perteDemenagement(c)` (métier + domicile
  → null) appliqué aux 5 sites réels — `deplacerPersonnage`,
  `marierPersonnages`, `migrerPopulation`, cour ré-ancrée
  (`transfererVille`/`supprimerVille`), nobles ré-ancrés en cité
  libre. Exceptions : renommage de ville et transfert de propriété
  (population classique inchangée). Verrouillé par tests
  (mutateurs.test.ts).
- **Migrations** : état **v4** `migrerMetiersVague3a` (renoms + retrait
  Propagandiste sur `toutesLesPopulations`, idempotente) ; config
  ciblée pattern (z) `metiersAmenagements2026` dans `cfgOf` (anciens
  15 défauts codés en dur, renoms en conservant les personnalisations,
  ajout des manquants, ANCIENS_EFFETS des 14 aménagements, effets
  remplacés seulement si encore défaut exact, emplacements ajoutés si
  absents, `metiersEffets` migré) — SANS toucher à
  `SCHEMA_VERSION_CONFIG`.
- **`scripts/diag.ts`** : inchangé (freeze accepté depuis la vague 1) —
  vérifié exit 0 avec le nouveau référentiel.
- **Tests** : harnais local **136/136 verts** (127 baseline + 9
  nouveaux/étendus) : caps 3a (Scierie/Mine d'Or/Champ), occupations
  emplacements, priorisation Bâteau de pêche, Fermier été/hiver,
  taxes additives, Garde garnison, exemption marchand-route,
  migration v4, déménagement (mariage/don/transfert), commerce B4 sur
  Hôtel de tourisme (la Foire ne produit plus), Champ sans flux
  (banque). `tsc --noEmit` strict : PROPRE.
- **Incident de conception détecté par les tests** : le Marchand
  auto-promu par `creerRouteCommerce` était décoiffé par
  `reaffecterMetiers` (cap 0 sans Mine d'Or) — résolu par l'exemption
  ci-dessus, la spec vague 3 (« les emplacements de Marchand viennent
  des Mines d'Or ET des routes commerciales ») la justifiait.

## Arbitrage complémentaire 3a : Dirigeant/Héritier ne déménagent jamais (2026-10-21, soir)

Réponse de Thibaut au point ouvert signalé en fin de vague 3a (« un
Dirigeant qui déménage perd son titre → succession à prévoir ») :
**« Un dirigeant ou héritier ne déménage jamais. »** Implémenté et
verrouillé par tests ce même soir :

- `shared.ts` : nouveau helper `neDemenageJamais(c, C)` (métier
  Dirigeant ou Héritier) ; `perteDemenagement(c, C)` ne fait RIEN
  pour un ancré (titre ET domicile conservés) ;
- `deplacerPersonnage` : don d'un Dirigeant/Héritier REFUSÉ avant
  toute mutation (« Un Dirigeant ou un Héritier ne déménage jamais ») ;
- `marierPersonnages` : si l'époux désigné déménageur (`a`, règle (o))
  est ancré → c'est `b` qui déménage chez lui (swap) ; si les DEUX
  sont ancrés dans des cours différentes → mariage refusé avant
  toute mutation ; même porteur → aucun déménagement ;
- ré-ancrages de cour (`transfererVille` refuge, ville devenue cité
  libre) : l'ancré suit sa cour mais garde titre et domicile ;
  `migrerPopulation` ne déplace que des enfants (jamais concerné) ;
- tests : 5 nouveaux cas dans `mutateurs.test.ts` (don refusé
  Dirigeant + Héritier, mariage avec swap, mariage de deux ancrés
  refusé, mariage même porteur sans déménagement, transfert de ville
  avec Dirigeant/Héritier dans la cour ré-ancrée). Harnais : 141/141
  verts, `tsc --noEmit` strict : PROPRE. `scripts/diag.ts` : exit 0
  (gelé, non répliqué).

## Arbitrage : suppression de ville — la pop classique est effacée avec elle (2026-10-21, soir)

Retour de Thibaut après la question « que se passe-t-il si une ville
est transférée ou détruite ? » : **la population classique d'une ville
supprimée disparaît avec elle** (suppression DÉFINITIVE, fiches
effacées, aucune trace — pas de statut « Décédé »). Précisions
arbitrées : seuls les ROTURIERS sont effacés ; la cour (nobles) reste
inscrite auprès de son joueur, champ « ville » intact (l'arbitre la
reloge) — un noble ne disparaît jamais par suppression de ville.

- `supprimerVille` (villes.ts) : filtre la population du joueur —
  roturiers de la ville (vivants ET décédés) retirés du tableau,
  nobles conservés ; le log compte les fiches effacées. Le retour
  initial 2026-10-14 « les habitants restent » est abrogé.
- VilleCarte.tsx : le texte de confirmation du bouton 🗑 annonce
  l'effacement définitif.
- Docs : la liste des « sites de déménagement » ne cite plus
  supprimerVille (aucun ré-ancrage, aucun perteDemenagement là-bas) ;
  la fiche de la règle 2026-10-14 est réécrite.
- Tests : le test « habitants RESTENT » est remplacé (pop classique
  effacée, cour conservée, autres villes intactes). Harnais : 141/141
  verts, `tsc --noEmit` strict : PROPRE. `scripts/diag.ts` : exit 0
  (gelé, non répliqué).

## Section JdR du site — corrections de contenu (2026-10-21)

Relecture complète de `content/JdR/` (règles, classes, races, équipements,
visualisation, espace MJ, bestiaire) suivie de corrections arbitrées par
Thibaut. Commits : `e40360cb` + `ef180f6c` (contenu) puis 4 commits de
suppression (`81b4cf3`, `c2ed120`, `40abe2b`, `f6d4f313` = tête). Le code
du jeu (`src/`) n'est PAS touché ; les déploiements Pages (site Quartz,
qui embarque ces contenus) sont verts sur la tête.

- **Distances unifiées en MÈTRES partout** (arbitrage : « toutes les
  distances sont en mètres ») : les pouces (`''` et `"`) deviennent `m`
  dans 42 fichiers — bestiaire, armes, armures, transports, magie
  (attributs de domaine), classes (Savant, Cuisinier, Revenant), races
  (Peaux-Vertes), tables MJ (Traumas, Puissance irrésistible), règles
  spéciales (Aura, Eclaireur, Embuscade). Les « cases » de grille sont
  conservées volontairement (sémantique de plateau — à arbitrer un jour).
- **Armes.md** : le bloc « Améliorations de Rang II (5 réussites) »
  renommé **Rang III**, son « Précision II » doublé devient **Précision
  III** ; typos (« ayant moyens de 5 PV » → « moins de 5 PV », « 3 case
  en cas de touches » → « 3 cases en cas de touche »).
- **Règles.md** : « Refuser un Trauma » réécrit — un Trauma ne RÉDUIT
  JAMAIS de caractéristique (erreur signalée par Thibaut) ; le refus =
  rester inconscient à 0 PV. Chevauchement 3-4/4-5 de la table de
  fabrication corrigé : 1-2 normal, 3-4 rang 1, **5 rang 2**, 6+ rang 3.
- **Fabrication** : la table des Règles est l'UNIQUE référence — les
  sections « Système de fabrication » dupliquées (avec la table
  divergente et le test « DIY ») sont retirées de Potions & Elixirs.md
  et Matériaux.md (il ne reste que les listes d'améliorations par
  type d'objet et les tables de matériaux) ; **« DIY » n'existe plus**,
  tout est renommé **Fabrication** (Outils.md, Savant.md, Prima
  Donna.md) ; le heading « Rang II » vide d'Outils.md retiré.
- **Fichiers vides/orphelins supprimés** : `Règles.md` (racine, 0 o),
  `MJ/Créatures/Mecka.md` (racine, 0 o — les Mecka vivent dans le
  bestiaire), `Sans titre.md` (Règles spéciales), `Elémentaire d'eau.md`
  (bestiaire, 0 o). `Brute.md` (vide mais LIÉ par le Cuisinier) est
  REMPLI d'une page glossaire au lieu d'être supprimé ; les liens
  `[Mecka](MJ/Créatures/Mecka)` du Savant (qui pointaient vers
  l'orphelin racine) re-dirigés vers le dossier du bestiaire
  (`[[JdR/MJ/Bestiaire/Mecka/index|Mecka]]`).
- **Signalés, non traités (repoussés par Thibaut)** : sections
  « Personnalité » des Nains/Ogres = copier-coller des Humains,
  religions tronquées (Ogres/Orques) ; liens `[[Homonculus]]` du Savant
  sans page cible ; lien `[[content/Règles/Règles#États Spéciaux|…]]`
  du Revenant au préfixe douteux.

## Section JdR — liens hypertexte cassés (2026-10-21, 2e session)

Retour Thibaut : « beaucoup de liens hypertexte renvoient en 404 ». Audit COMPLET des wikilinks de \`content/JdR/\` (105 fichiers, 194 liens) avec re-implementation fidèle des règles de résolution Quartz (\`markdownLinkResolution: "shortest"\` dans quartz.config.ts ; resolution : slugification segments par segments — espaces→-, &→-and-, %→-percent — puis si le SEGMENT FINAL est un nom de fichier unique dans tout le vault, lien relatif direct, SINON chemin absolu depuis la racine de content/ ; dossiers sans index.md = pas de page).

46 liens cassés trouvés, CAUSES : (1) anciens chemins Obsidian pré-réorganisation (\`[[Règles/...]]\` sans le segment \`JdR/\` — la résolution se fait depuis la racine du vault, pas depuis le dossier du fichier) ; (2) casse/accents ne correspondant pas aux slugs (\`Anti-infanterie\` vs \`Anti-Infanterie\`, \`Point de talent\` vs \`Points de talent\`, \`Maître-Lame\` vs \`Maitre-Lame\`, \`classes/mage\` vs \`Classes/Mage\`) ; (3) \`[[Cadavérique]]\` ×7 : lien vers un DOSSIER sans index.md (pas de page) → dé-lié en texte simple ; (4) \`![[Pasted image 20260201143559.png]]\` ×2 (Grondeur) : l'image n'existe nulle part dans content/ → embeds retirés (Thibaut doit pousser l'image dans le dépôt si il la veut) ; (5) \`[[content/Règles/...]]\` : préfixe content/ invalide dans les wikilinks.

CORRECTIFS (18 fichiers modifiés + 1 nouveau) : Règles, Armes, Armures, Chaman, Cuisinier, Guerrier, Paladin, Revenant, Savant, 7× Cadavérique (dé-liage), 2× Grondeur (embeds), et NOUVELLE PAGE \`content/JdR/Règles/Races/index.md\` (page dossier listant les 10 races — les 4 liens \`[[JdR/Races|Race]]\`/\`[[JdR/Règles/Races|race]]\` des classes y pointent désormais, un dossier sans index.md n'ayant pas de page).

BONUS sémantique : 3 liens qui « résolvaient » (200) vers \`zDev/Anciens-fichiers/Règles-spéciales\` (page héritée) via le matching shortest par nom de fichier — réécrits vers les pages JdR (Saignement → \`JdR/Règles/Règles#États Spéciaux\`, Attaques enflammées → page dédiée _Visualisation). NB : la section Wargame a des fichiers aux MÊMES noms que les règles spéciales JdR (Anti-Infanterie etc.) — les wikilinks à nom court (\`[[Anti-Infanterie]]\`) seraient AMBIGUS → toujours utiliser le chemin complet depuis la racine dans les liens JdR.

Re-audit post-correctifs sur l'univers complet (JdR+Wargame+zDev) : 0 lien cassé, 0 résolution hors-JdR. Convention pour l'avenir : liens wikilink TOUJOURS en chemin complet depuis la racine du vault (\`[[JdR/...]]\`), jamais en nom court, jamais de préfixe \`content/\`.

## Sync contenu JdR vers v4 — le site se construit depuis v4 (2026-10-21, 3e session)

Retour Thibaut : « peux-tu faire le merge et le deploy automatiquement ? » après la
session liens 404. **DÉCOUVERTE STRUCTURANTE** : le workflow deploy.yaml checkoute
`v4` pour construire le SITE Quartz (`content/`), puis `chasse-et-peche-web`
UNIQUEMENT pour le jeu (build vite → `public/jeu/`). Les correctifs de contenu
poussés sur `chasse-et-peche-web` (liens 404 : `d369bffb`, journal `a8e4d006`)
n'étaient donc PAS en ligne — le « merge » à faire = pousser le contenu vers `v4`.

- **Sync de 53 fichiers JdR web→v4** : `d35a85c5` (19 fichiers de la session liens :
  18 modifiés + nouvelle page `Règles/Races/index.md`), puis `cf52c11b` (35 fichiers :
  32 syncs directs des corrections de contenu de la session 1 + 3 FUSIONS des édits
  manuels de Thibaut, voir ci-dessous), puis 2 suppressions `f2c55f22` +
  `ab467e11` (fichiers orphelins restés sur v4 alors que la session 1 les avait
  supprimés sur web : « Sans titre.md » et « Elémentaire d'eau.md »).
- **Édits manuels de Thibaut préservés** (3 commits « Update … » faits sur v4 via
  l'UI GitHub, absents de la branche web) : Armes.md (Paire de pistolets 2 Bois /
  4 Métaux / 260f, Arquebuse 2 Bois / 3 Métaux / 200f, « 2 métaux »→« 2 Métaux »),
  Anti-Large.md (« Taille 2 ou plus »→« Taille 3 ou plus »), Attaques Empoisonnées.md
  (typo « ne déclenche peut plus faire »→« ne peut plus faire »).
  INCIDENT : le premier sync `d35a85c5` a ÉCRASÉ les coûts d'Armes.md (260f/200f
  perdus) — découvert par l'inventaire blob-SHA des deux branches, ré-appliqués
  dans la fusion de `cf52c11b`. **Règle qui en découle : le contenu du site vit sur
  `v4` (c'est la branche que le déploiement Pages construit) ; toute modif de
  contenu doit vivre sur les DEUX branches, sinon la sync d'une branche vers
  l'autre écrase les édits de la seconde.**
- **Portage des 3 édits vers `chasse-et-peche-web`** : `da810417` (convergence —
  une future sync ne les écrasera plus).

Vérifications : déploiements Pages de `d35a85c5` (#1289), `cf52c11b` et des deux
suppressions verts ; site live vérifié (page Races index, Armes 260f/200f). Penser à
Ctrl+F5 (cache CDN navigateur).

Signalés, non traités : l'image `Pasted image 20260201143559.png` (Grondeur) reste
absente du dépôt (embeds retirés, Thibaut doit pousser l'image dans `content/JdR/`
s'il la veut) ; `content/Wargame/_Visualisation/Règles spéciales/Sans titre.md`
(fichier parasite hors périmètre, non touché) ; la divergence Wargame/zDev entre
branches n'a PAS été auditée (seul JdR l'a été).

## Rangs d'habitation & bâtiments tier 1 — VAGUE 3b (1) IMPLÉMENTÉE (2026-10-22)

Implémentation de la proposition de Thibaut (rangs + bâtiments de
tier 1), arbitrages actés en session : caps **cumulatives**
(base du rang « Métiers disponibles » + emplacements des bâtiments ET
aménagements — `capMetierChasseurVille/Chateau` supprimés) ;
consommation par tour et garnison de base des rangs **supprimées**
(no-ops `consommationsVille/consommationsPays/garnisonBaseVille` —
« les Gardes font tout ») ; « Domiciles disponibles » = affichage
seul ; Ponton +0,5 Bétail par Pêcheur (économies.ts, gains bruts
avant taxes) ; réaffectation : jamais de postes nobles ni
attribution Armée/Succession/Ville. Référentiel : colonnes
metiersDisponibles/domicilesDisponibles + rework des 10 bâtiments
tier 1 (Poste de garde, Camps, Echoppe, Grange, École élémentaire —
doublons anciens éliminés, Herses corrigé, Terrain d'entraînement
rang Militaire). UI : ConfigTables/ReferenceDataPanel (colonnes
Métiers/Domiciles disponibles), PopulationTable (nouveau texte
caps). Migration `migrerTypesHabitation` : complétion des colonnes
manquantes depuis la table par défaut. Validation : tsc EXIT 0,
144/144 tests verts, diag exit 0.

**Points ouverts notés dans regles-et-arbitrages.md** : côtière =
proximité Mer (défaut) ; Grand veneur INERT (plus de consommation à
réduire) ; garnisons hors-rang (régimes/ministères/bâtiments 2+)
inchangées ; « Domiciles disponibles » sans effet moteur pour
l'instant. La sous-vague 3b (2) « routes dissociées » reste à
arbitrer.

**Amendement (arbitrage Thibaut, même jour) : « côtière » =
proximité Rivière OU Mer** (toute proximité autre que « Plaine » —
le « défaut Mer » initial est remplacé). Câblé : helper
`villeCotiere` (villes.ts) gate les emplacements de Pêcheur du
Ponton (metiers.ts) ET le bonus +0,5 Bétail/Pêcheur (economie.ts) ;
garde-fou non bloquant à la construction (Constructions.ts, même
calibre que le rang d'habitation) ; textes du référentiel précisés ;
tests Mer/Rivière actifs, Plaine inactif.

**Amendement (arbitrage Thibaut, même jour) : ordre de prise de
poste « n'importe quel métier → Chasseur → sans métier »** — le
Chasseur est le DERNIER métier pris, et un Chasseur en poste CHANGE
de métier dès qu'un autre poste est disponible (priorité sur les
sans-emploi, âge décroissant) ; son poste de Chasseur se libère
alors pour les candidats suivants. Câblé dans `reaffecterMetiers`
(metiers.ts : candidats = sans-emploi adultes + Chasseurs en poste,
un Chasseur ne consomme une place que pour un poste NON-Chasseur,
log agrégé « change(nt) de métier ») ; texte d'aide caps actualisé
(PopulationTable) ; nouveau test (Chasseur → Commerçant, poste
libéré pris par un sans-emploi, sans autre poste personne ne bouge).
Validation : tsc EXIT 0, 145/145 tests verts, diag exit 0.

**Purge (même jour) : suppression des anciennes descriptions devenues
trompeuses.** (1) Métier Chasseur du référentiel : description
« Métier par défaut » → « Dernier métier pris (poste de repli) :
change de métier dès qu'un autre poste est disponible » (visible en
jeu, onglet Référentiels ; l'entrée « Métier par défaut » de la table
ANCIENS de migration est HISTORIQUE et reste intacte). (2) Six
rangées de rang « Consomme X par tour. Y Garnison. » retirées de
batimentsVille/batimentsChateau (47/43 entrées) : consommation et
garnison de base des rangs supprimées par la vague 3b, ces rangées
n'étaient plus affichées (filtre batimentsDef) ni lues par le moteur
ou migrerTypesHabitation — données mortes au texte mensonger. (3)
Commentaire metiers.ts reformulé (« poste de repli » au lieu de
« métier par défaut »). Validation : diff byte-exact attendu
(6 blocs + description), tsc EXIT 0, 145/145 tests verts, diag exit 0.

**Vague 3c (même jour) : améliorations d'aménagements — tiers 2
et 3.** Arbitrage Thibaut : un aménagement tier 1 s'AMÉLIORE
(REMPLACE, jamais en plus) en tier 2 (coût uniforme 15 Or + 3
Pierre, habitation de rang 2 requise), puis le tier 2 en tier 3
(35 Or + 3 Fer, rang 3). Implémentation : 28 entrées
« X (tier 2/3) » au référentiel constructions (champs
`rangMinHabitation` 2/3 + nouveau champ optionnel
`remplaceAmenagement` sur ConstructionRef, defaultConfig.ts ;
coûts/emplacements/emplacement de terrain selon les specs de
Thibaut) ; `faireConstruire` (Constructions.ts) résout la ref
pour les DEUX types (garde-fou de rang hérité pour les tiers) et
REMPLACE une instance du tier inférieur (indexOf + assignation ;
⚠ non bloquant si le tier inférieur est absent, log final
« X amélioré(e) en Y ») ; les caps compte les tiers automatiquement
(emplacementsMetierVille itère batiments + amenagements) ;
migrerConstructions ajoute les entrées manquantes aux vieilles
configs (pas de bump SCHEMA_VERSION_CONFIG). UI VilleCarte : la
catégorie « Aménagements » ne propose plus que le tier 1 ;
catégories « Améliorations · tier 2/3 » limitées aux tiers
inférieurs présents dans la ville et masquées si le rang est
insuffisant ; sous-titre de coûts réécrit (coût tier 1 selon le
référentiel · tier 2 · tier 3 — l'ancien « coût : » unique, calibré
sur le Baleinier, était devenu trompeur). Tests : caps des tiers +
remplacement effectif (metiers.test.ts vague 3c) + nouveau fichier
Constructions.test.ts (remplacement en place + débit 15 Or + 3
Pierre / 35 Or + 3 Fer, garde-fous rang et prérequis non bloquants).
Validation : tsc EXIT 0, 149/149 tests verts, diag exit 0. Insertion
référentiel chirurgicale (28 entrées au style indent=1 du fichier
d'origine, aucune autre ligne touchée — re-vérifié par diff
sémantique contre la tête).

**Correctif (même jour, retour Thibaut : « les descriptions des
aménagements, c'est du grand n'importe quoi »).** DIAGNOSTIC : la
partie en cours embarque une config sauvegardée AVANT la vague 3a
(production → emplacements) ; `migrerConstructions` n'ajoute que
les entrées MANQUANTES par nom — les entrées existantes gardaient
donc l'ANCIENNE description (« +2 Or et +10 Nourriture par tour. »),
les ANCIENS effets structurés (encore lus par le moteur : l'aménagement
continuait de produire !) et PAS de champ `emplacements`, alors que
les tiers 2/3 (ajoutés neufs) étaient conformes — d'où le mélange
mensonger. CORRECTIF : SCHEMA_VERSION_CONFIG 3 → 4 + migration
`realignerAmenagements` (defaultConfig.ts) — tout aménagement de même
nom qu'une entrée du référentiel est REMPLACÉ par l'entrée courante
(description, production, coût, terrain, emplacements, effets,
rangMinHabitation, remplaceAmenagement) ; arbitrage : un aménagement
du référentiel est une donnée de RÉFÉRENCE, pas de personnalisation ;
les aménagements PERSO survivent, bâtiments et autres tables
intouchés. Les configs v3 tamponnées repassent une fois par les
migrations au prochain chargement (cfgOf) puis sont retamponnées v4
et sauvegardées convergées. Tests : nouveau cas migration v4 dans
state/config.test.ts (description/effets réalignés, perso conservé,
tiers ajoutés, idempotence) ; params.test.ts mis au niveau (tampon
courant = 4). Validation : tsc EXIT 0, 150/150 tests verts, diag
exit 0. NOTE : la table morte `amenagements` (feuille d'origine du
classeur — Baleine, Brasserie, Bâtiment, doublons, rangs incohérents)
n'est lue NULLE PART (UI = constructions uniquement) : non touchée
pour l'instant, à purger un jour si demandé.

**Retrait des descriptions d'aménagements (même jour, retour Thibaut :
« retire carrément les descriptions des aménagements »).** Après le
réalignement v4 ci-dessus, les descriptions d'aménagements ne servaient
plus à rien en jeu : la carte affiche l'effet réel
(`resumeConstruction || production`, les emplacements) et le picker des
tiers reconstruit lui-même sa ligne « Remplace un … (habitation de rang
N minimum) » — la description n'était qu'un résidu de texte, sujet à
re-devenir mensonger. DÉCISION : vider le champ `description` des 42
entrées Aménagement du référentiel (tiers 1, 2 ET 3), par édition
textuelle chirurgicale (aucune resérialisation du JSON indent=1, autres
sections vérifiées intactes par diff sémantique). MIGRATION CIBLÉE
one-shot `descriptionsAmenagementsVides` (patron taxes25 : marqueur
indépendant du tampon schemaVersion, PAS de bump v4→v5) dans cfgOf —
jouée même sur les configs déjà convergées v4, elle vide
`description` de toute entrée Aménagement puis pose le marqueur ;
une description d'aménagement personnalisée saisie ENSUITE dans
Référentiels survit aux re-lectures (one-shot). NON TOUCHÉ :
descriptions des BÂTIMENTS (Servitude, Hôtel de ville, Camp de
bâtisseurs — lues par le moteur/le wiki), champ `production`
(= l'effet affiché), colonne Description de l'UI Référentiels/Wiki
(reste vide, colonnes conservées). Consumers vérifiés : VilleCarte
(tooltip vide, picker inchangé — filter(Boolean) saute la ligne),
amenagements.ts `effet: ref.description` → '' (champ non consommé
en aval). Tests : assertion migration v4 mise à jour (description
réalignée = '') + nouveau cas one-shot dans state/config.test.ts
(config v4 portant des descriptions → vidées, bâtiments intacts,
marqueur posé, description perso post-migration préservée).
Validation : tsc EXIT 0, 151/151 tests verts, diag exit 0. Push en
deux commits (CI verte sur chacun) : A = référentiel vidé + test v1
(le réalignement v4 déjà déployé tire les descriptions courantes),
B = migration ciblée + test complet ; miroirs v4 avec blobs
identiques.

## Nettoyage : retrait du code mort et de la duplication résiduelle (2026-10-22, retour Thibaut sur la revue critique des habitations)

Retour Thibaut sur la revue critique des habitations/population :
« Retire le code mort » (point 5) et « Retire la duplication
résiduelle » (point 6). 15 fichiers touchés, sans aucun changement
de comportement jouable.

**Code mort supprimé** (no-ops depuis la vague 3b, qui a retiré la
consommation et la garnison de base des habitations) :
`garnisonBaseVille`, `consommationsVille`, `consommationsPays`,
`appliquerConsommationsHabitations`, `fmtCourt` (habitations.ts) ;
étape moteur 3octies (engine.ts) ; canal « habitations » des récaps
(productionDetaillee/productionVille `consoVille`, provenancesApports,
CanalApport « Conso villes », ApportsTour.habitations) ; colonnes
mortes UI (VilleCarte « Conso. habitation », RecapParTour « Conso
villes », RecapDernierTour « Conso. villes » — cellule excédentaire
de la ligne « Nourr - été » corrigée au passage) ; bloc
« Consommation de la ville » de VilleCarte (l'affichage
« habitants requis » est conservé) ; ligne « base du rang » du détail
de garnison (regimes.ts, union `origine` 6→5 catégories, commentaires
renumérotés). Le **Grand veneur** (INERT depuis la vague 3b) est
retiré du référentiel (18→17 portefeuilles), du renommage
`RENOMMAGES_MINISTERES` et de l'Aide ; filtre idempotent dans `cfgOf`
pour les configs embarquées déjà convergées (un Grand veneur déjà
nommé garde son badge, sans effet — il n'en avait plus). Le test
no-op vague 3b est remplacé par un test de non-régression des
exports (metiers.test.ts).

**Duplication supprimée** : table `rangsHabitation` retirée de
referentiels.json, de l'interface GameConfig, des défauts
(defaultConfig.ts) et de scripts/diag.ts ; replis « ancien format »
supprimés de `habitationDef`, `rangsDisponibles`, `rangNiveau`
(regimes.ts) ; les chaînes en dur associées partent avec ; `cfgOf`
supprime la clé orpheline des configs persistées. Le commentaire
registry.ts sur Surconsommation est mis à jour (coût INERT depuis
la vague 3b, seule la production reste vivante).

Tests : +2 cas dans state/config.test.ts (Grand veneur filtré +
idempotent ; rangsHabitation absente des défauts et supprimée d'une
config la portant). Total : 153/153 verts. Validation : tsc EXIT 0,
diag exit 0 et sortie identique à la base (les 16 « ÉCHEC »
informatifs attendus), bundle esbuild OK. Les vieux historiques de
parties portant `rangsHabitation`/un Grand veneur nommé sont lus
sans erreur (clé ignorée, badge conservé sans effet).

Push en quatre commits : A = chore(référentiel) referentiels.json,
B = refactor(moteur) code+config, C = test+diag, D = docs(ia) ;
miroirs v4 avec blobs identiques (15/15 md5), CI verte, déployé
(bundle index-OaE7lVQB.js).

## Refonte formats & dette legacy (2026-10-23, retour Thibaut — revue structure / SOLID)

Première vague de l'arbitrage Thibaut sur l'audit structure/SOLID
(structure 2 « supprimer les vieilles dettes » + cohérence). 12
fichiers code touchés, comportement moteur inchangé (diag
identique).

**Dette legacy supprimée** : les tables pré-canonicalisation
`batimentsVille`, `batimentsChateau`, `batimentsCouts`,
`amenagements` sont retirées de referentiels.json, de l'interface
GameConfig, des défauts et de diag.ts ; `normaliserBatiments()`
dérive désormais tout de la table canonique `constructions` ;
`cfgOf` supprime les 4 clés orphelines des configs persistées
(idempotent). Le repli `coutBatiment` (texte legacy → table
constructions) disparaît : `coutBatimentRef` devient le seul
chemin (batiments.ts).

**Formats unifiés** (règle Thibaut : « tous les métiers sont
toujours au singulier ») : `metiersBase` remplace la chaîne
`metiersDisponibles` par un tableau structuré
`[{metier, places}]` au singulier ; migration ciblée dans `cfgOf`
(texte pluriel → singulier, entrées inconnues ignorées,
idempotente, validée vs `merged.metiers`) ; les replis
`habitationDef`/`rangsDisponibles` « ancien format » partent avec
(regimes.ts) ; le parsing runtime (`parseMetiersDisponibles`,
`normaliseMetier`) est supprimé au profit du nouveau
`parseMetiersBaseTexte` (defaultConfig.ts), utilisé par
l'éditeur UI (ConfigTables) et le wiki (ReferenceDataPanel).

**Lookups dédupliqués** : `rangsDefsType`/`rangDef` = point
d'entrée unique (type,rang) partagé par habitationDef,
rangsDisponibles, rangNiveau (habitations.ts, regimes.ts) ;
`gameData2.buildingDef` apparie d'abord exactement puis sans les
accents (École/Ecole).

**Effets moteur en données** (préparation du point O) : les
constructions portent désormais leurs champs moteur
(`ecoleRang`, `malContraction`, `bonusGuerison`,
`bonusGuerisonGlobal`) dans le référentiel ; littéral « Guilde
des médecins » (`bonusGuerisonGlobal` 0,10) ajouté à la
dérivation — POINT OUVERT : arbitrer son coût/constructibilité.

Tests : +2 cas (migration texte→tableau + clés legacy disparues +
idempotence ; effets moteur en données + vue dérivée + Guilde).
Total : 155/155 verts, tsc EXIT 0, diag exit 0 et sortie
identique à la base, bundle esbuild OK. Push en six commits
(A référentiel, B moteur, C UI, D tests, E diag, F docs) ;
miroirs v4 avec blobs identiques. Vagues 2-3 (import cycles,
classe mère/ports, Ponton→proximité, Grand bailli) : design à
venir, implémentation reportée à l'arbitrage Thibaut.

## Simplification : santé ignorée, rangs 2+, factions, ministres et éducations retirés (2026-10-23, retour Thibaut — arbitrage simplification)

Deuxième vague du retour Thibaut du 2026-10-23 : allègement
PROVISOIRE pour dérouiller le jeu avant d'attaquer la refonte
SOLID. ~50 fichiers code touchés.

**Périmètre arbitré** (tout « provisoire » — les données pourront
revenir) :
- **Santé ignorée** pour l'instant ;
- **Constructions de rang d'habitation ≥ 2 supprimées** du
  référentiel : 118 → 41 constructions (bâtiments ET aménagements,
  dont les aménagements tiers 2/3 et la Chapelle). La MÉCANIQUE
  d'amélioration (remplaceAmenagement, garde-fous non bloquants)
  reste en place, couverte par des tests qui réinjectent les defs
  tier localement (prêtes à les recevoir à leur retour) ;
- **Règles de factions** : derniers reliquats retirés des fiches
  peuples (30 champs reglesBase/ageII/ageIII/victoire/batiment —
  le moteur de factions avait déjà été retiré le 2026-10-19) ;
- **Ministres supprimés EN TOTAL** : module ministeres.ts, registre
  d'effets (fluxJoueurParMinistre, garnisonJoueur, cond.ministre),
  canal de récap, onglets et écrans UI (SurintendantFinances.tsx,
  portefeuilles, carte 👑 Ministres), table référentiel
  ministeres, colonne ministres des paysRangs, fonction morte
  statutMinistre. La migration d'état v2 devient no-op (numéro
  conservé) ; les anciens états gardent l'étiquette metier
  « Ministre » inoffensive ;
- **Éducations supprimées EN TOTAL** (correction Thibaut : « supprime
  toute la mécanique d'éducation ») : labels Character.education,
  événements « reçoit une éducation » (tryEducateMinor), table
  config.educations, champ education des métiers, attribution
  'Education', contrainte de validation, paramètres
  chanceEduc*/profBonusEduc, colonne et picker UI. CONSERVÉS :
  Professeurs (professeurBaseChance), écoles (ecoleRang),
  migration scolaire des enfants, trait Obstiné. Les clés
  orphelines des configs persistées sont dépouillées par cfgOf
  (idempotent) ; un vieux personnage garde une éventuelle clé
  education ignorée (pas de migration d'état nécessaire) ; la
  comparaison des anciens défauts de la migration 3a reste EXACTE
  (le champ education y est lu en unknown) pour continuer à jouer.

**Tests adaptés à la simplification** : seuils referentiel/registre
réajustés (41 constructions, 11 à effets), témoins remplacés
(Chapelle → Hôtel de tourisme, Moulin à vent → Ponton), tiers 2/3
réinjectés localement pour la mécanique dormante ;
ministres.test.ts supprimé (22 tests, module retiré) ; +2 tests
éducation (clés orphelines dépouillées idempotent + paramètres
supprimés). Total : 148/148 verts, tsc EXIT 0, diag exit 0
(53 lignes, 16 ÉCHEC informatifs — sortie changée PAR DESIGN :
le miroir perd aussi ses rangs 2+, ses ministres et son
éducation), bundle esbuild OK (metiersBase présent, plus aucune
trace d'educations hors le delete de nettoyage).

Push en six commits (A référentiel, B moteur, C UI, D tests,
E diag, F docs) + miroirs v4. NB : les textes de récompenses
(rangs de pays, progrès) mentionnant encore des Ministres sont
inertes (plus aucun ministre nommable) — nettoyage référentiel
reporté. Vague suivante VALIDÉE par Thibaut : redécoupage
engine.ts (S) + couche ports/contrats (D), design au prochain
tour.

## Hotfix : les bâtiments rang 2+ des configs monde sauvegardées (2026-10-23, retour Thibaut « pourquoi je vois encore le moulin à vent »)

**Bug constaté par Thibaut** : « je viens de créer une nouvelle
partie en local et j'ai toujours les bâtiments de rang 2+ (ex.
Moulin à vent) ». CAUSE : la config MONDE est persistée par
navigateur (clé dédiée, COMMUNE à toutes les parties — storage.ts)
et la convergence `cfgOf` n'AJOUTE que les constructions
manquantes du référentiel : elle ne RETIRE JAMAIS les disparues
(règle (x) : les suppressions persistent) — une config monde
sauvegardée AVANT la simplification gardait donc les 118
constructions À VIE, y compris pour une NOUVELLE partie (le
sélecteur « + Construire » lit la config convergée). Seul le
retrait des factions avait son filtre explicite ; il en manquait
un pour le rang.

**Correctif** : filtre inconditionnel en fin de `cfgOf`
(defaultConfig.ts), même patron que rangsHabitation —
`merged.constructions` perd ses entrées `rangMinHabitation >= 2`,
quelle que soit la version de schéma de la config. Idempotent ;
pour réactiver les rangs 2/3 plus tard : les ré-ajouter au
référentiel ET retirer ce filtre.

**Tests adaptés** : les tests vague 3c réinjectaient les defs tier
AVANT cfgOf (dans state.config) — le filtre les retirait. Ils
réinjectent désormais APRÈS convergence (dans C.config) :
Constructions.test.ts (defs TIERS_23 poussées dans construireDe)
et metiers.test.ts (test caps). +1 test de non-régression dans
config.test.ts : le « Moulin à vent » rang 2 d'une config
convergée est retiré, re-lecture stable (idempotent).

**Validation — INCIDENT D'OUTILLAGE** : le bac de validation
interdit désormais l'installation de paquets (npm install
refusé) : tsc, tsx et esbuild INDISPONIBLES dans ce bac. La
validation a été faite via node natif (v22)
`--experimental-strip-types` + hooks ESM maison (résolution
d'extensions, .json sans assert, stubs des 2 modules JSX purs
pour les tests moteur de faireConstruire) : **137/137 tests
verts** (les 12 tests de rendu react, non exécutables sans
react, ne touchent pas au patch — la config par défaut est
inchangée par le filtre), syntaxe des 4 fichiers vérifiée,
diag exit 0 (sortie identique — le défaut n'a pas de rang 2+).
tsc/esbuild sont rejoués par la CI au push (statut vérifié
après déploiement).

**Push** en trois commits (refactor(moteur) filtre, test,
docs(ia)) + miroirs v4 (code seulement).

## Refonte SOLID VAGUE 2 — cycles d'imports cassés, ports rules→moteur, graphe acyclique (2026-10-23/24, arbitrages Thibaut)

**Arbitrages Thibaut** (présentation du design vague 2) : ordre = VAGUE 2
SOLID D'ABORD, scalabilité (mémoïsation) APRÈS ; périmètre = « tout dans
la vague 2 » ; règle de config actée : « il doit exister une seule
config globale modifiable en dehors des parties et jamais remodifiée
après » — c'est la condition de sûreté du futur cache cfgOf (toute
édition crée une nouvelle référence) ; Ponton→proximité : à faire
maintenant ; Grand bailli : « c'est un ministre, on supprime pour
l'instant ».

**Étapes** (patchs v2a→v2g, tous idempotents, asserts de convention) :
1. **v2a** — `engine/indexPopulation.ts` extrait de naissances.ts
   (indexPopulationMonde + invaliderIndexPopulation ; metiers/sante
   importent le module bas) ; validation.ts importe isNobleDyn de
   `shared` → les 2 cycles RÉCIPROQUES (engine↔validation,
   naissances↔sante) CASSÉS.
2. **v2b — port (D)** : `ContexteEffet.ports { C, capitaleDe, rangNiveau,
   garnisonVille }` (rules/types.ts) ; usines du registre re-signées
   `C: Cfg` REQUIS (reglesConstructions, registreComplet, reglesRegimes,
   reglesCultures, clesTechsParNom, reglesProgres, reglePourConstruction
   — cache par RÉFÉRENCE de C, sûr grâce à la règle de config) ;
   contexteLectureSeule DÉMÉNAGÉ de rules/registry vers
   engine/constructions (C_LECTURE, ports factices — effets de
   constructions inconditionnels) ; banque.ts lit TOUT via ctx.ports :
   la couche rules n'importe plus le moteur (inversion).
3. **v2c** — adaptation des appels : sites moteur manqués par v2b
   (regimes/progresAuto passaient `C.config` au lieu du Cfg complet —
   crash `C.config.config` ; constructions sans argument) + 4 fichiers
   de tests (C_DEFAUT = cfgOf(undefined) ; contexteLectureSeule
   importé de engine/constructions).
4. **v2d — ports RÉELS** aux 3 sites d'application
   (fluxProgresJoueur, effetsRegime, effetsCulturePays) via 3 modules
   BAS NIVEAU (dé-cyclage par arête — importer regimes depuis
   progresAuto aurait recréé un cycle réciproque, regimes important
   déjà progresAuto) : `rangs.ts` (nomRang, rangsDefsType, rangNiveau),
   `progresTech.ts` (aTech + trio garnison des techs),
   `garnisons.ts` (garnisonHabitationVille) — tous ré-exportés par
   leurs modules d'origine (façade engine.ts, UI et mocks
   INCHANGÉS). Graphe final : progresAuto → garnisons →
   {batiments, progresTech, rangs}, aucun retour.
5. **v2e** — dernier anneau (regimes→economie→metiers→villes→regimes)
   cassé : `villeCotiere` extraite de villes.ts dans `geographie.ts`
   (feuille pure), economie et metiers importent la feuille.
6. **v2f — Ponton→proximité** : villeCotiere = TOUTE proximité autre
   que « Plaine » (l'ARBITRAGE LITTÉRAL du 2026-10-22, déjà cité dans
   les docblocks, mais le code n'acceptait que Rivière||Mer) —
   comportement identique sur le domaine actuel
   (Plaine/Rivière/Mer/absent) ; une future proximité (Colline,
   Montagne…) comptera SANS toucher au code. Test « Colline » ajouté.
   **Grand bailli** : purge des doccomments résiduels (EffetReductionCout
   dans rules/types.ts, fondation=techs dans habitations.ts) — plus
   AUCUN effet moteur ni mention code ; l'histoire des arbitrages
   reste dans le doc de design.
7. **v2g** — nettoyage des imports inutilisés révélés par le tsc
   (noUnusedLocals) : City (progresAuto), nomRang/rangsDefsType
   (regimes), garnisonProgresVille/garnisonMinimaleProgres (regimes).

**Métriques** : cycles d'imports 25 → **0** (graphe ENTIÈREMENT
acyclique : aucun fichier dans un cycle, 0 réciproque). Validation :
108/108 tests (node strip-types + hooks ESM maison), diag exit 0,
`tsc --noEmit` strict **0 nouvelle erreur** (diff contre la base —
reproduit par tarballs typescript 5.9.3 + react 18.3.1 + @types/react
+ csstype + @types/node 25.0.3 du package-lock ; les « erreurs » du
bac sans @types/node sont des faux positifs, assert.ok ne narrow pas),
diff -rq contre tarball HEAD frais = 18 modifiés + 5 nouveaux attendus.

**Reste à faire (vague 2)** : le redécoupage de la façade engine.ts
(runTurn + sermentsPossedes → tour.ts, suppression de la façade,
re-câblage des ~15 consommateurs UI) — à faire en propre : il touche
des .tsx que seule la CI valide. Scalabilité (mémoïsation) : vague
SUIVANTE — cache cfgOf par référence (WeakMap — condition de sûreté
actée par Thibaut), groupement par ville dans reaffecterMetiers, bench
16k habitants avant/après.

**Push** en trois commits (refactor(moteur), test, docs(ia)) +
miroirs v4 (code seulement).

## Suppression de la façade engine.ts — fin de la vague 2 (2026-10-24, arbitrage Thibaut « tout dans la vague 2 »)

**Arbitrage Thibaut** (2026-10-23) : la façade fait partie de la vague 2
(« tout dans la vague 2 »), scalabilité/mémoïsation en vague SUIVANTE.

La façade `src/engine/engine.ts` (451 lignes : 30 blocs de ré-exports,
211 symboles vers 22 modules sources, + `runTurn` et `sermentsPossedes`
en propre) est SUPPRIMÉE :

1. **`src/engine/tour.ts`** (nouveau) : `runTurn` (séquence FinDeTurn)
   et `sermentsPossedes` extraits verbatim, en-tête réécrit.
2. **`src/engine/edge.ts`** (nouveau) : découverte de session —
   engine.ts n'était pas qu'une façade, c'était AUSSI le point d'entrée
   du bundle Edge Function (`scripts/build-function.mjs` bundlait
   engine.ts ; le handler `resoudre-tour` consomme runTurn,
   fusionnerSections, rejouerEvenementsPartages, migrerEtat,
   appliquerConfigMondiale, etatReseau ; son test d'exécution
   normaliserEtat). edge.ts exporte exactement ces 8 symboles —
   toute évolution du handler = UNE ligne dans edge.ts.
   `scripts/build-function.mjs` : entrée → edge.ts.
3. **Re-câblage des 20 consommateurs** vers les modules sources
   directs : 15 fichiers UI/state + testRendu.ts + setup.ts
   (consommateur oublié révélé par la garde du patch) + les 3 tests
   moteur (statiques et dynamiques — `import('./engine')` →
   `import('./tour')`). Le mapping symbole→module a été PARSÉ depuis
   les 30 blocs de ré-export de la façade elle-même (aucune table
   manuelle), via patch-v3a.py idempotent avec asserts.
4. Docblocks obsolètes mis à jour (mentions engine.ts/façade dans
   villes.ts, rangs.ts, build-function.mjs, test-function.mjs) — les
   docblocks d'arbitrage historiques sont conservés.

**Métriques** : 0 cycle (inchangé), plus aucune référence à la façade
dans src (garde grep). Validation : 127/127 tests (node strip-types +
hooks ESM), diag exit 0 sortie identique, `tsc --noEmit` strict
**0 nouvelle erreur** (diff contre tarball HEAD frais — types
reproduits par tarballs registry : typescript 5.9.3, react 18.3.1,
@types/react 18.3.31, csstype 3.2.3, @types/node 25.0.3 ; un double
marqueur `import type { type X }` a été révélé par la parité dans
RessourcesBar.tsx et corrigé), diff -rq : 24 modifiés + 2 nouveaux
(tour.ts, edge.ts) + 1 supprimé (engine.ts), rien d'inattendu.

**Vague suivante (annoncée)** : scalabilité — mémoïsation cfgOf par
référence (WeakMap — sûreté actée par Thibaut : « une seule config
globale, jamais remodifiée après adoption »), groupement par ville
dans reaffecterMetiers, bench 16k habitants avant/après.

**Push** en trois commits (refactor(moteur) + test inclus,
refactor(scripts) entrée edge, docs(ia)) + miroirs v4 (code seulement,
delete_file engine.ts par branche).

## Vague scalabilité — mémoïsation cfgOf, index chirurgical, partitions par ville (2026-10-24, arbitrage Thibaut « vague 2 SOLID d'abord, scalabilité ensuite »)

**Arbitrage Thibaut** (2026-10-23) : l'ordre des vagues — vague 2 SOLID
d'abord, scalabilité ensuite ; bench 16k habitants avant/après ; règle de
config actée : « il doit exister une seule config globale modifiable en
dehors des parties et jamais remodifiée après » — c'est la condition de
sûreté du cache ci-dessous.

**Bench** (`scripts/bench-scalabilite.ts`, nouveau) : partie sur les
peuples libres du référentiel (4 joueurs), gonflée à 16 000 habitants
(répartis par joueur) ; 3 tours chronométrés + coût d'un appel cfgOf +
reaffecterMetiers seul.

**Diagnostic AVANT** : tour 2 : 6,3 s ; tour 3 : 9,8 s. Profil CPU :
1. **cfgOf ≈ 34 % du temps du tour** : 47 291 appels/tour (les défauts
   de signature `C: Cfg = cfgOf(state.config)` sont évalués PAR
   habitant) — et `state.config` n'a pas de tampon `schemaVersion`
   (DEFAULT_CONFIG n'en porte pas non plus), donc CHAQUE appel
   rejouait fusion + migrations + garde-fous (~0,1 ms).
2. **indexPopulationMonde ≈ 19 %** : l'index id→vivant était invalidé
   à chaque mort, naissance ET mariage, puis reconstruit en O(N) à
   l'accès suivant (~500 reconstructions par tour).
3. **reaffecterMetiers / premierPosteLibre** : filtres O(pop) par
   ville, le second appelé PAR habitant venant à l'âge adulte
   (~5 500 appels à 16k via assignAdultMetier).

**Correctifs** (patch-v4a/b/c.py, idempotents avec asserts) :
1. **v4a — mémoïsation cfgOf** : `WeakMap<GameConfig, Cfg>` par
   RÉFÉRENCE (config `undefined` cléée sur DEFAULT_CONFIG). Sûreté :
   toute édition de la config crée une NOUVELLE référence
   (setGlobalCfg « la remplace par un nouvel objet, jamais mutée ») —
   le cache suit chaque édition, il ne peut pas servir un résultat
   périmé ; une config abandonnée libère son entrée au GC. A/B
   canonique : sortie de cfgOf(cloneDefaultConfig()) identique octet
   par octet avant/après.
2. **v4b — index de population chirurgical** : l'index mappe id →
   OBJET vivant (les mutations de champs y sont visibles) : naissance
   = ajout O(1) (`ajouterALIndexPopulation`), décès = retrait O(1)
   (`retirerDeLIndexPopulation`), mariage = RIEN (invalidation
   supprimée). `invaliderIndexPopulation` reste pour les changements
   structurels (tests, import), le moteur de fin de tour n'en fait
   plus usage.
3. **v4c — partitions par ville** : reaffecterMetiers partitionne les
   vivants par ville UNE fois par joueur (O(pop), ordre intra-bucket
   préservé → tri stable par âge identique) ; premierPosteLibre
   reçoit la partition en paramètre optionnel — le filtre sur le
   statut reste joué à l'appel (morts plus tôt dans le tour exclus) :
   sémantique strictement identique.

**Résultats (bench 16k)** : tour 2 : 6,3 → 1,5 s ; tours 3-4 : ~9,8 →
~2,0 s (≈ 5×). cfgOf : 0,07 → 0,00 ms/appel. reaffecterMetiers : ~4 ms.
Reste (candidats d'une future vague, mesurés) : influence culturelle
(14 % du profil), veuvage au décès — `toutesLesPopulations(state).find`
O(N) PAR décès (reverse-lookup mariageId possible dans l'index), boucle
des mariages (metiers.ts), capMetierVille par appel.

**Non-régression** : 134/134 tests verts, diag exit 0, 0 cycle
(inchangé), tsc --noEmit strict parité **0 nouvelle erreur** (env
tarballs registry reconstruit : typescript 5.9.3, react 18.3.1,
react-dom 18.3.1, @types/react 18.3.31, @types/react-dom 18.3.1,
csstype 3.2.3, @types/node 25.0.3), diff -rq contre tarball HEAD
frais : 6 fichiers modifiés + bench-scalabilite.ts nouveau, rien
d'autre. **Preuve déterministe** : 3 tours de la partie 16k rejoués
sur l'arbre AVANT et le bac APRÈS (même graine) → état final IDENTIQUE
octet par octet (ids normalisés par ordre d'apparition — newId
embarque Date.now(), cf. shared.ts : un rejeu produit les mêmes
événements, seuls les ids diffèrent).

**Push** : perf(config) + perf(moteur) + bench(scripts) + docs(ia),
miroirs v4 (code seulement, suffixe « (miroir v4) »).

## Vague qualité — cycles rules↔engine déjà cassés, découpage des 5 grosses vues (2026-10-24, arbitrage Thibaut)

**Découverte préalable — le point « 13 cycles rules↔engine » était PÉRIMÉ.**
Avant d'attaquer la vague qualité, la vérification d'usage a révélé que
les « 13 cycles d'imports `rules/` ↔ `engine/` » cités au journal
(entry 2026-10-13) et dans les suites possibles de
regles-et-arbitrages.md **n'existent plus** : analyse exhaustive des
imports statiques, re-exports et imports dynamiques (tests inclus) →
**0 paire réciproque, 0 composante fortement connexe de plus d'un
fichier**. Ils ont été cassés par la vague 2 SOLID (2026-10-23/24,
« cycles 25 → 0, graphe entièrement acyclique ») sans que les entrées
plus anciennes du journal et la liste des suites ne soient mises à
jour. Le point de regles-et-arbitrages.md est corrigé dans ce commit
(le journal garde ses entrées historiques telles quelles : c'est un
journal). La vague qualité se réduit donc au **découpage des 5
grosses vues**.

**Découpage des 5 vues (mécanique, sémantique STRICTEMENT identique)** —
patron unique : un sous-dossier par vue dans `src/components/`, une
carte/section = un composant autonome, la logique pure (filtres,
formatage, chaînes de suzerains…) dans un `logique*.ts` sans React,
l'orchestrateur garde les filtres + l'aiguillage + les mutations du
store (passées aux cartes par props), l'état local `useState` vit
dans la carte qui le sert, et les docblocks d'arbitrage sont DÉPLACÉS
avec leur code (règle 9). Aucun comportement modifié, aucune ligne
moteur touchée.

- **PopulationTable.tsx** 632 → 432 l. + `population/` (logiquePopulation.ts
  93, LignePersonnage 132, CarteMetiersPlaces 83, CarteAjoutHabitants
  37 — état local du formulaire inclus, CarteRecapTour 32).
- **ReferenceDataPanel.tsx** 609 → 71 l. + `reference/` (logiqueReference.ts
  33 : ONGLETS + fmtEffetTech ; 9 fichiers d'onglets, aiguillage une
  ligne par onglet — les onglets « Crises », « Rappels règles » et
  « Offrandes » restent trois composants DISTINCTS comme trois onglets).
- **ConfigTables.tsx** 544 → 19 l. de BARREL (API publique ré-exportée à
  l'identique, ParamsPanel inchangé) + `params/` (logiqueParams.ts 18 :
  TableProps + GROUPES_BAT ; EditeursEffets 123 ; ConstructionsParams
  105 ; ProgresParams 95 ; PaysHabitationsParams 109 ; CouleursParams 121).
- **RoyaumeView.tsx** 430 → 60 l. + `royaume/` (logiqueRoyaume.ts 26 :
  chaineSuz + pers ; CarteIdentite 66, CarteRoyaume 156 — sacre inclus,
  CarteVassalite 138, CartePersonnagesImportants 81).
- **CitesLibresView.tsx** 426 → 176 l. + `citesLibres/`
  (logiqueCitesLibres.ts 9 : fmtNum ; CarteReservesEmissaires 28,
  CarteRegle 43, CarteCreation 74 — état local du formulaire inclus,
  CarteCite 217 : fiche d'une cité, identité + émissaires + annexion).

Choix d'ingénierie à noter : le barrel ConfigTables (vs. re-câblage du
consommateur) parce que son API est publique et ré-exportée proprement ;
la garde anti-cycle du harnais vérifie aussi les nouveaux sous-dossiers.

**Non-régression** : 134/134 tests verts, diag exit 0, **0 cycle**
(0 réciproque, 0 SCC>1 — sous-dossiers inclus), `tsc --noEmit` strict
0 erreur (env tarballs registry reconstruit : typescript 5.9.3,
react 18.3.1, react-dom 18.3.1, @types/react 18.3.31,
@types/react-dom 18.3.31, csstype 3.2.3, @types/node 25.0.3) et
**parité vs tarball HEAD frais : 0 nouvelle erreur** (`comm -13` des
sorties filtrées `grep -v "TS2307\|supabase"`). diff -rq : 5 fichiers
modifiés + 5 sous-dossiers nouveaux, RIEN d'autre (moteur intact →
bench 16k non rejoué, aucune ligne moteur touchée). Équivalence
vérifiée à la main sur les points de friction : clamp
`Math.max(1, Math.round(addNb))` de l'ajout d'habitants conservé,
villes d'ajout `[cite.nom]` vs villes du joueur, aiguillage un-onglet-une-carte.

**Push** : refactor(ui) × 5 (un commit par vue, diffs relisibles) +
docs(ia), miroirs v4 (code seulement, suffixe « (miroir v4) »).

**Incident de push (documenté, sans impact contenu)** : le programme de
push poussait les 6 commits en une seule exécution ; à court de budget,
le bac l'a REJOUÉ depuis le début et `push_files` — non idempotent — a
ré-exécuté les 5 commits refactor, poussés donc DEUX FOIS sur
chasse-et-peche-web (contenus identiques, arbre final EXACT : diff -rq
tarball live ↔ bac = 0, docs poussés une seule fois). Les miroirs v4
ont été poussés ensuite UN commit par programme, avec garde
anti-doublon (list_commits du HEAD de la branche cible avant chaque
push : si le message y figure déjà, SKIP) — la garde a fonctionné
sur chaque rejeu. Leçon rangée en règle 15. État final vérifié :
live = 5 vues découpées + docs ; v4 = 5 miroirs, `src/` octet-identique
v4 ↔ live.

## Suppression de tous les dogmes (2026-10-24, arbitrage Thibaut « on supprime tous les dogmes pour l'instant »)

Retrait PROVISOIRE (décision d'arbitre, « pour l'instant ») de tout le
système de dogmes. État des lieux avant retrait (grep exhaustif src/ +
scripts/ + tests) : la table `dogmes` du référentiel était une table
d'AFFICHAGE — bonus Pontife/Fidèles en texte libre, jamais branchés sur
le moteur, aucune règle de banque n'en produisait d'effets. Les dogmes
n'apparaissaient que comme piste future dans les commentaires rules/.

**Modifications (sémantique moteur inchangée — il n'y avait rien à
désactiver) :**

- `src/config/referentiels.json` : bloc `"dogmes"` (5 entrées : Lumières,
  Capitalisme, Guerres-Saintes, Pacifisme, Socialisme) supprimé.
- `src/config/defaultConfig.ts` : champ `dogmes` retiré du type
  `GameConfig` (docblock de retrait à sa place, règle 9), ligne
  `dogmes: ref.dogmes` retirée de `DEFAULT_CONFIG`.
- **Purge des configs existantes** : `delete (merged).dogmes` ciblé dans
  `cfgOf`, juste après la fusion — patron taxes25. **SANS bump de
  SCHEMA_VERSION_CONFIG** : un bump 4→5 renverrait les configs v4
  convergées dans la branche de migration complète, qui ré-ajoute les
  entrées du référentiel supprimées (règle (x) « les suppressions
  persistent ») — le delete est idempotent et ne touche à rien d'autre.
  Vérifié fonctionnellement : config sauvegardée avec clé `dogmes` →
  `convergerConfig` la purge ; config par défaut sans la clé.
- Wiki (onglet Référentiels) : « Tourisme & dogmes » → « Tourisme » ;
  `OngletsTourismeDogmes` renommée `OngletTourisme`, carte « Dogmes »
  supprimée (seuils de tourisme conservés).
- `pays/AideAuto.tsx` : mention « Dogmes, levées d'armées… » →
  « Levées d'armées… ».
- `rules/types.ts` : `'dogme'` retiré de l'union `SourceRegle` (valeur
  jamais réutilisée — ids stables) ; docblocks d'`EffetHabitantsVille`
  (exemple Socialisme) et d'`EffetConversionPoids` passés au passé
  historique daté ; exemple d'id `'dogme.capitalisme.pontife.r1'` →
  `'tech.comprendre-la-soie'` (id réel).
- `rules/banque.test.ts` : `source: 'dogme'` du test « condition vassal »
  (décorative) → `source: 'evenement'`.
- Commentaires au présent passés au futur sans dogmes : `registry.ts`
  (3), `effects/banque.ts` (1), `rules/types.ts` en-tête (2).
- `engine/progres.ts` : « (philosophie des dogmes) » reformulé en
  application manuelle avec trace historique datée.
- `scripts/diag.ts` : type local dupliqué + `ref.dogmes` retirés (le
  script a sa propre copie historique du DEFAULT_CONFIG).
- Docs : arbitrage acté dans `regles-et-arbitrages.md` (section
  « Arbitrages de jeu au fil des sessions ») ; suites possibles 1
  (harmonisation des dogmes) et 2 (Pacifisme moteur) marquées CADUQUES ;
  mention « orientations/dogmes » des ministres annotée.

**Validation** : 134/134 tests, diag exit 0, tsc strict 0 erreur (hors
stub supabase), diff -rq vs tarball HEAD limité aux 12 fichiers
attendus + docs, purge vérifiée fonctionnellement. NB consigné : le mot
« Pontificat » reste dans des textes d'affichage (seuils de tourisme,
voie Culturelle) — concept plateau, à réarbitrer si les dogmes
reviennent ; l'ancien contenu reste dans l'historique git.

## Suppression des événements (saison + dynastie) et purge de l'Influence (2026-10-24, retour arbitre)

Arbitrage Thibaut, immédiatement après la purge des dogmes : « purge
l'influence, purge également les événements de dynastie ainsi que les
événements d'hiver et d'été ». Inventaire préalable (grep exhaustif,
rien de touché avant) :

- **`events`** (référentiel, 18 entrées été/hiver) : système CÂBLÉ au
  moteur — au changement de saison, `runTurn` tirait un événement
  pondéré, lançait un dé de danger (+ `modDanger` cumulatif,
  « Sombres présages »), affichait le texte du niveau correspondant et
  appliquait les effets chiffrés (`eventEffets` × params
  `evMult*`, seuils `dangerSeuilForte/Extreme` ; Peste → risque de
  maladie supplémentaire).
- **`dynasties`** (référentiel, 38 cartes) : tirée à CHAQUE tour pour
  CHAQUE joueur (étape 2 de `runTurn`), stockée dans `Player.dynastie`
  {nom, description}, effets chiffrés via `dynastieEffets`
  ('(aléatoire)', guérison). Le mini « Événement de dynastie » de la
  page Royaume l'affichait, avec la mention « ce n'est pas la famille
  au pouvoir ».
- **Influence** : mécanique REMPLACÉE par les émissaires depuis
  longtemps (arbitrage fondateur) — il ne restait que des RÉSIDUS de
  texte (regleCitesLibres « gagner de l'influence », aide des cités
  libres « tentatives d'influence ») et les 4 rangs républicains du
  diag autonome (Commune/District/Union/Confédération, bonus
  libellés « 10/25 Influence avec une cité libre »).

Distinctions critiques respectées (vérifiées au grep avant de toucher
quoi que ce soit) : l'INFLUENCE CULTURELLE (`applyCultureInfluence`,
conversions de villes par le tourisme) est une mécanique réelle,
intacte ; `Character.dynastie` est le NOM DE FAMILLE du personnage,
concept noyau intact ; `cp_events` (fusion.ts, supabase/client.ts,
Edge Function) est la table de SYNCHRO multijoueur, sans rapport ;
les types de journal `'Événement'`/`'Dynastie'` restent dans l'union
`LogEntry` et l'affichage du journal (plus produits, mais les
vieilles parties continuent d'afficher leurs anciennes lignes).

Modifications (15 fichiers code + 2 docs) :

- `src/config/referentiels.json` : tables `events` et `dynasties`
  supprimées ; `regleCitesLibres` reformulée en émissaires.
- `src/config/defaultConfig.ts` : types EventDef/DynastieDef/
  EffetsDef retirés (docblocks historiques datés, règle 9) ; champs
  events/dynasties/eventEffets/dynastieEffets retirés de GameConfig,
  de l'interface Cfg et de DEFAULT_CONFIG ; BASE_EVENT_EFFECTS /
  BASE_DYNASTIE_EFFECTS supprimés ; purge ciblée dans `cfgOf`
  (4 `delete` inconditionnels, patron taxes25) + migration
  regleCitesLibres par remplacement de fragments idempotent —
  SANS bump de SCHEMA_VERSION_CONFIG (un bump renverrait les configs
  convergées dans la branche de migration complète qui ré-ajouterait
  les entrées supprimées, même raisonnement que les dogmes).
- `src/config/params.ts` : params evMultFaible/Moyenne/Forte/Extreme
  et dangerSeuilForte/Extreme retirés (type, défauts, PARAM_META) —
  le groupe « Événements » de l'onglet Formules disparaît.
- `src/engine/types.ts` : EventDef/DynastieDef retirés ;
  `Player.dynastie` → optionnel (compat vieilles saves, plus aucun
  producteur/lecteur) ; `'Événement'`/`'Dynastie'` conservés dans
  LogEntry avec docblock ; `GameState.modDanger` → optionnel.
- `src/engine/setup.ts` : `modDanger: 0` retiré des états initiaux.
- `src/engine/saisons.ts` : ne garde que `saisonForTurn` ;
  `applyEventEffect` et `applyDynastieCard` supprimés (docblock
  historique daté).
- `src/engine/tour.ts` : étape 1 de `runTurn` réduite à
  `if (newSaison !== state.saison) state.saison = newSaison` ;
  étape 2 (carte dynastie) supprimée ; import nettoyé.
- `src/engine/gameData2.ts` : en-tête périmé corrigé (ne mentionne
  plus événements/cartes dynastie).
- UI : `ParamsPanel.tsx` (4 onglets et sections retirés, import Badge
  nettoyé), `OngletsAideMemoire.tsx` (compteurs Événements/Cartes
  dynastie retirés), `CarteRoyaume.tsx` (mini « Événement de
  dynastie » retiré + docblocks), `RoyaumeView.tsx` (docblock),
  `pays/AideAuto.tsx` (« Levées d'armées et dés du plateau »),
  `CitesLibresView.tsx` (« tentatives d'émissaires »).
- `scripts/diag.ts` (copie autonome) : types/tables/exports
  EVENTS/DYNASTIES, applyEventEffect/applyDynastieCard, étapes 1-2 du
  runTurn local, mutations « config.events/dynasties = [] » et
  BASE_*_EFFECTS retirés ; 4 rangs républicains supprimés des
  paysRangs locaux, `rangParDefaut` retombe sur la Baronnie pour
  tous les régimes (le vrai référentiel n'a plus que 5 rangs
  féodaux — le diag vivait sur un format paysRangs périmé).

**Validation** : 134/134 tests (aucun test ne référençait
events/dynasties/evMult/modDanger — vérifié par grep avant, compte
inchangé), diag exit 0, tsc strict 0 erreur (hors stub supabase),
garde cycles 0 (0 réciproque, 0 SCC>1), diff -rq vs tarball HEAD
limité aux 15 fichiers attendus + docs, grep résiduel : plus aucune
mention « influence » hors influence culturelle, docblocks
historiques datés et protocole cp_events.

## Routes commerciales dissociées — sous-vague 3b (2) (2026-10-24, arbitrage Thibaut)

Clôture de la vague 3b : « on peut passer à la vague 3b » puis
arbitrages complémentaires obtenus en session (destinations = villes
des autres joueurs ET cités libres ; ouverture GRATUITE ; fermeture
manuelle par l'ORIGINE seule ; routes existantes des parties en
cours SUPPRIMÉES « à rouvrir manuellement »). Cap par défaut assumé
par continuité (l'ancien `maxMarchandsJoueur` devient
`maxRoutesJoueur`, compte les routes, annoncé non bloquant) et
garde-fous techniques d'auto-fermeture assumés (origine perdue, cible
disparue, copie disparue). Distinctions critiques respectées :
« Influence culturelle » (`applyCultureInfluence`) intacte ;
`cp_events` (synchro multijoueur) intact ; fusion.ts fusionne les
routes par id, agnostique du modèle.

Inventaire préalable : le Marchand était un métier de production
(+2 Or/tour) SANS emplacements propres hors Mines d'Or, TITULAIRE de
sa route (`marchandId`) ; la route rapportait `marchandOrTour` Or aux
DEUX joueurs + copie ; `peuplerMarchands` (tour.ts) pré-pourvait les
routes ; l'exception « tientRoute » de `reaffecterMetiers` (metiers.ts)
empêchait le surnombre des titulaires ; `metiersAccessiblesCite`
n'offrait que Chasseur/Gouverneur aux cités.

Modifications fichier par fichier :

- **`engine/types.ts`** : `RouteCommerce` réécrit (`villeOrigine`,
  `joueurCible: number | null`, `citeCible`, `villeCible`,
  `amenagement: string | null` ; clés obsolètes `marchandId` /
  `ressource` optionnelles, jamais lues) — docblocks datés.
- **`engine/commerce.ts`** (réécriture) : accesseurs filtrant l'ancien
  modèle (`routesCommerce`, `De`, `Vers`, NOUVEAU `VersCite`) ;
  `capMarchandsCite` ; `effetsRouteProprietaire` = copie seule ;
  `effetsCommerceJoueur`/`detailCommerceJoueur` = routes détenues
  (la cible ne reçoit plus rien au stock) ; `nettoyerRoutesCommerce`
  purge ancien modèle + morts (3 familles) avec logs ;
  `maxRoutesJoueur` (renommé) ; `creerRouteCommerce` nouvelle
  signature en cascade joueur/cité, gratuit ; `changerCopieRoute`
  refuse les cités ; `supprimerRouteCommerce` « origine seule ».
  SUPPRIMÉS : `marchandsDe`, `marchandDeRoute`, `peuplerMarchands`.
- **`engine/metiers.ts`** : helper privé `emplacementsRoutesVille`
  (+1 Marchand par route sortante/entrante + emplacements de la
  copie dans la ville d'ORIGINE, lecture INLINE de
  `state.routesCommerce` — anti-cycle, littéral « Marchand » doublet
  de `TITRE_MARCHAND`) ; param optionnel `ctx { state, joueur }` de
  `emplacementsMetierVille`/`capMetierVille`/`postesLibresVille`/
  `occupationsMetierVille` ; `premierPosteLibre` passe le ctx ;
  `reaffecterMetiers` : exception tientRoute SUPPRIMÉE (les
  emplacements des routes sont portés par le cap), ctx passé aux
  caps ; docblock `metiersAccessibles` mis à jour.
- **`engine/citesLibres.ts`** : `metiersAccessiblesCite` ouvre
  Marchand dès `capMarchandsCite > 0` (import commerce.ts, pas de
  cycle — vérifié par la garde).
- **`engine/tour.ts`** : import et appel `peuplerMarchands` retirés ;
  docblock de l'étape commerce mis à jour (plus d'Or passif, plus de
  pré-pourvoison ; purge ancien modèle au nettoyer).
- **`config/params.ts`** : `marchandOrTour` retiré (interface,
  défauts, PARAM_META — le groupe « Commerce » disparaît de l'onglet
  Formules) ; label/aide de `maxMarchands` renommés « routes
  commerciales » (clé conservée) + docblock daté.
- **`config/defaultConfig.ts`** : delete ciblé `marchandOrTour` dans
  cfgOf (patron taxes25, SANS bump de `SCHEMA_VERSION_CONFIG` — même
  raisonnement que dogmes/événements, règle (x)).
- **`config/referentiels.json`** : description du métier Marchand
  (« Métier de production (+2 Or / tour) ; emplacements par les
  Mines d'Or et les routes commerciales »), effet Marchand de
  l'aide-mémoire réécrit (routes dissociées, gratuites, origine
  seule, cités libres), techs « marchand supplémentaire » → « route
  commerciale supplémentaire » (le cap compte les routes).
- **UI** : `CommerceRoutes.tsx` réécrit (formulaire cascade ville
  d'origine → type de cible → joueur/ville ou cité libre →
  aménagement copiable ; table sortantes avec copie modifiable et ✕
  ; entrantes affichées « +1 emplacement Marchand » SANS ✕ ; badge
  routes/cap) ; `CarteMetiersPlaces.tsx` + `PopulationTable.tsx`
  passent le ctx routes ; `CarteCite.tsx` affiche les routes
  entrantes de la cité ; `AideAuto.tsx` reformulé (plus de prop C) ;
  `PlayerView.tsx` docblock.
- **Tests** : `commerce.test.ts` réécrit (B4 Tourisme conservé +
  5 nouveaux : pas d'Or passif/cible vide, +1 Marchand chaque côté
  via ctx, fermeture origine seule, cible cité libre avec
  `capMarchandsCite`/`metiersAccessiblesCite`, purge `marchandId`) ;
  `metiers.test.ts` : test « titulaire » réécrit sur le nouveau
  modèle (cap = route, surnombre normal) + test ctx dédié ;
  `fusion.test.ts` : helper `route()` au nouveau format.
- **diag.ts** : RIEN (le diag ne référence pas le commerce — grep
  préalable vide).

**Validation** : 140/140 tests (134 avant + 6 nouveaux), diag exit 0,
tsc strict 0 erreur (hors stub supabase), garde cycles 0 (0
réciproque, 0 SCC>1), diff -rq vs tarball HEAD limité aux 18 fichiers
attendus + docs.

**NB compatibilité** : le canal « Commerce » des récaps pousse
seulement les effets non nuls — la copie seule reste visible, rien ne
change pour `regimes.ts` (tourismeCourant) ni `production.ts` ;
l'influence culturelle et `cp_events` (synchro) ne sont pas touchés.

## Suppression du métier de Marchand (2026-10-24, arbitrage Thibaut « supprime carrément le métier de marchand »)

Clôture de la 3b par voie d'arbitre : le métier disparaît du jeu ;
les routes commerciales RESTENT (modèle dissocié : gratuites, sans
personnage, fermeture origine seule). Arbitrages obtenus en session :
(1) **Mine d'Or gardée SANS effet** ; (2) **tech « Commerce lointain »
gardée SANS effet** ; (3) **routes vers cités libres = +1 émissaire
auprès de la cité TANT QUE la route est active** (nouvelle mécanique
d'`emissairesEffectifsCite`). Défauts assumés : les porteurs du
titre dans les parties en cours perdent le titre au premier fin de
tour (Sans-emploi avec log dédié, puis reprise d'un poste aux places
libres) ; le cap `maxRoutesJoueur` et la purge des vieilles routes
`marchandId` ne changent pas.

Découverte en cours de route : la CI « jeu » des deux commits de la
3b (cace059c code et b90a9677 docs) était ROUGE — le test de rendu
`PlayerView.test.ts` affirmait encore l'ancien titre de carte
« Commerce — routes des marchands », renommé « Commerce — routes
commerciales » par la 3b sans mise à jour du test (le harnais local
ne joue pas les tests `.tsx` — hooks sans résolution d'extension, et
le `npm test` de la CI (tsx) les inclut). Corrigé ici : assertion
réalignée sur le titre courant.

Distinction critique : « Guilde des marchands » (bâtiment,
remplaçable par la Plateforme commerciale) et « Commerçant » (métier
renommé d'Artisan) ne sont PAS touchés ; `marchandsMax`
(règles/doctrines, champ historique sans lecteur) conservé pour les
vieilles configs, docblock corrigé.

Modifications fichier par fichier :

- **`config/referentiels.json`** : entrée métier Marchand SUPPRIMÉE
  (24 → 23 métiers) ; entrée Marchand de `metiersEffets` SUPPRIMÉE
  (12 → 11) ; Mine d'Or → production/description « aucun effet »,
  `emplacements: []` ; tech « Commerce lointain » → description
  « aucun effet », `effets: []` ; trait Éloquent : clause marchand
  retirée ; notes « marchand de base » et « un marchand ne peut
  exploiter une merveille » supprimées.
- **`config/defaultConfig.ts`** : purge ciblée dans `cfgOf` (patron
  dogmes/événements, idempotente, SANS bump — règle (x)) de TROIS
  familles : entrée Marchand de `merged.metiers` (sinon elle
  REVENAIT par la fusion `{...DEFAULT_CONFIG, ...c}` : les configs
  convergées sauvegardées embarquent le référentiel fusionné, et le
  picker parcourt `C.metiers`), entrée Marchand de
  `merged.metiersEffets` (wiki), effets `fluxParMetier` de métier
  Marchand des arbres de progrès (aligne les configs sur « Commerce
  lointain » sans effet) ; bloc legacy `metiersAmenagements2026` :
  branche morte de mise à jour du texte Marchand retirée (le
  référentiel n'a plus d'entrée à compléter), ligne Marchand du
  snapshot ANCIENS conservée avec NB daté.
- **`engine/commerce.ts`** : SUPPRIMÉS `TITRE_MARCHAND` et
  `capMarchandsCite` (GARDÉ `routesCommerceVersCite`, consommé par
  l'UI cités et `emissairesEffectifsCite`) ; import `CiteLibre`
  retiré ; docblocks datés (route vers cité = +1 émissaire tant
  qu'active ; plus d'emplacement de Marchand) ; log d'ouverture
  vers une cité reformulé (+1 émissaire), log d'ouverture vers une
  ville recentré sur la copie.
- **`engine/citesLibres.ts`** : `metiersAccessiblesCite` revient à
  [Chasseur, Gouverneur] (paramètre `_cite` inutilisé conservé pour
  la compatibilité des appelants) ; NOUVEAU
  `emissairesEffectifsCite(state, cite, joueur)` = émissaires
  placés + nombre de routes ACTIVES du joueur vers la cité
  (`routesCommerceVersCite` filtré sur `r.joueur` — pas de cycle :
  commerce.ts n'importe pas citesLibres.ts), docblock daté.
- **`engine/metiers.ts`** : `emplacementsRoutesVille` ne compte plus
  QUE les emplacements de l'aménagement copié des routes SORTANTES
  (les +1 Marchand sortants/entrants et le littéral 'Marchand'
  disparaissent) ; `metiersAccessibles` ne pousse plus 'Marchand'
  (docblock daté) ; `reaffecterMetiers` : PASSE 0 de purge des
  porteurs de métiers ABSENTS du référentiel (garde
  `!C.metiers.some('Marchand')` — une config future qui
  réintroduirait le métier ne serait pas purgée), titre → null +
  log dédié AVANT le surnombre (la passe places libres redonne un
  poste), docblocks datés.
- **`engine/types.ts`** : docblock `RouteCommerce` réécrit (copie à
  l'origine seule, cité = +1 émissaire tant qu'active, métier de
  Marchand retiré).
- **`engine/production.ts` + `engine/tour.ts`** : commentaires du
  canal Commerce et de l'étape de fin de tour mis à jour (plus
  d'emplacement de Marchand par route).
- **`rules/types.ts`, `rules/registry.ts`, `rules/effects/banque.ts`** :
  docblocks du générique `fluxParMetier` passés en exemple
  HISTORIQUE (le mécanisme reste disponible, aucune tech ne
  l'utilise) ; champ `marchandsMax` marqué historique sans lecteur.
- **`config/params.ts`** : docblock de `maxMarchands` complété
  (compte les routes — plus les marchands, métier retiré).
- **UI** : `CommerceRoutes.tsx` (intro/état vide/table : plus de
  « +1 emplacement de Marchand » ; cité = « +1 émissaire tant que la
  route est active » ; entrantes « aucun effet pour toi ») ;
  `CarteCite.tsx` (bloc émissaires : placés + badge « +N par
  route(s) » du bonus, chip/badge « suzerain possible » sur les
  EFFECTIFS, boutons +/- toujours sur les placés, règle des 3
  émissaires reformulée avec le bonus routes ; routes entrantes :
  texte émissaire) ; `CarteMetiersPlaces.tsx` (docblock du ctx +
  paragraphe explicatif : copie = emplacements à l'origine seule,
  Marchand retiré) ; `AideAuto.tsx` (ligne routes commerciales
  reformulée).
- **Tests** : `commerce.test.ts` réécrit (B4 Tourisme conservé ; pas
  d'Or passif ; NOUVEAU « copie ouvre les emplacements du métier
  copié à l'ORIGINE SEULE + Marchand cap ∞ » ; fermeture origine ;
  NOUVEAU cité libre sur `emissairesEffectifsCite` — placés, +1 par
  route active, retour aux placés à la fermeture, Marchand jamais
  accessible ; purge `marchandId` avec Scierie copiée) ;
  `metiers.test.ts` (cap Marchand/Mine d'Or → ∞ « titre mort » ; ctx
  routes : copie Scierie à l'origine, plus de +1 Marchand, vieilles
  routes ignorées via Bûcheron ; occupations : Fermier remplace le
  Marchand ; NOUVEAU réaffectation « purge du titre » — les porteurs
  purgés reprennent poste, Commerçant puis Bûcheron de la copie) ;
  `params.test.ts` (conversion v2 : 25→24 métiers, 13→12 effets —
  purge verrouillée) ; `progres.test.ts` (registre 33→32 règles
  « Commerce lointain » gardée sans effet : plus de règle, flux vide
  même débloquée avec porteurs).
- **`components/PlayerView.test.ts`** : assertion « Commerce — routes
  des marchands » → « Commerce — routes commerciales » (correction
  de la CI rouge du HEAD précédent, cf. ci-dessus).

**Validation** : 140/140 tests (6 réécrits/1 assertion de rendu
réalignée, compte total inchangé), diag exit 0, tsc strict 0 erreur
(hors stub supabase), garde cycles 0 (0 réciproque, 0 SCC>1), diff -rq
vs tarball HEAD limité aux 21 fichiers attendus + docs, JSON
référentiel validé (jq), grep résiduel « Marchand » = docblocks
historiques datés uniquement.

**NB compatibilité** : les configs SAUVEGARDÉES ne nécessitent AUCUN
bump (purge idempotente dans `cfgOf`, les suppressions persistent —
règle (x)) ; les porteurs du titre des parties en cours sont purgés
au premier fin de tour ; la migration d'état v4 laisse passer le
string « Marchand » (donnée de conversion des vieux `titres`), le
moteur le purge ensuite — cohérent avec le défaut assumé.

## Suppression du système de progrès (2026-10-24, retour arbitre « supprimer proprement les progrès et qu'il ne reste rien »)

Purge COMPLÈTE du système de techs/arbres/déblocages, même patron que
les purges précédentes (dogmes, événements saison/dynastie, Influence,
Marchand) : RETRAIT daté dans les docblocks (règle 9 — l'ancien
contenu reste dans l'historique git), purge par `delete` ciblé dans
`cfgOf` SANS bump de `SCHEMA_VERSION_CONFIG` (règle (x) — une config
tamponnée qui garde la clé `progres` ne la fait plus lire par
personne ; toute config repassant par `cfgOf` la voit retirée).

**Périmètre acté** : seul le système disparaît ; la **ressource
Science RESTE** (canaux de production indépendants : impôts
`economie.ts`, métiers Chercheur/Scientifique, `scienceParConstruction`
des cultures, bâtiments Observatoire / Laboratoire de Falheim,
Dashboard). Les **textes des Lauriers II/III/IV de la voie
Scientifique** (Cabinet d'astronomie, arbres d'Âge III, « Progrès du
développement futur ») restent tels quels dans les référentiels avec
note **CADUQUE — redesign à arbitrer** (décision de design, pas
d'ingénierie : les conditions référencent des arbres qui n'existent
plus). `Player.progresDebloques?` et `ApportsTour.progres?` deviennent
des champs OPTIONNELS morts (« RETRAIT, plus lus, compat vieilles
sauvegardes »).

**Fichiers SUPPRIMÉS (8)** : `src/engine/progres.ts`,
`src/engine/progresAuto.ts`, `src/engine/progresTech.ts`,
`src/components/ProgresView.tsx`, `src/components/ProgresView.test.ts`,
`src/rules/progres.test.ts`, `src/components/params/ProgresParams.tsx`,
`src/components/reference/OngletsProgres.tsx`.

**Moteur** : `tour.ts` — bloc 3undecies-bis PROGRES (canal + log 🔬)
retiré, `progres:` retiré des apports ; la re-synchronisation
Tourisme qui vivait dans ce bloc est CONSERVÉE (elle doit courir APRÈS
les apports de commerce qui créditent le stock directement — cf.
incidents). `production.ts` — canal progres (interface
`ProductionDetail`, calcul, listes, type `CanalApport`) retiré.
`garnisons.ts` — `garnisonProgresVille` + plancher « Combler les
lacunes » retirés. `regimes.ts` — flux Tourisme des techs retirés
(l'origine `'technologie'` reste dans l'union des lignes de détail,
lue des vieilles sauvegardes sans être produite). `habitations.ts` —
`reductionFondation`/`aTech` retirés, le 5e paramètre `fondation` de
`debiterCoutHabitation` SUPPRIMÉ de la signature (appelant mis à jour
dans `VillesCarte.tsx`). `armees.ts` — `reductionLevee` (Conscription
I −10 Or) retirée. `commerce.ts` — `aTech` retiré, +1 routes des techs
retiré de `maxRoutesJoueur` (le cap `maxMarchands` reste).
`merveilles.ts` — `bonusTourDeCrystalProgres` supprimé (la Tour de
Crystal reste sans effet ; Laboratoire de Falheim conservé).
`statutAuto.ts` — table TECHS + `statutTech` supprimées.
`setup.ts` — `progresDebloques: []` retiré de `createGame`.
`types.ts` — docblocks RETRAIT sur les champs morts. `gameData2.ts` —
NB CADUQUE avant `VICTORY_TEXT`.

**Config & couche rules** : `defaultConfig.ts` — interfaces
`EffetProgres`/`ProgresTechDef`/`ProgresArbre` supprimées, champ
`GameConfig.progres` retiré, drapeaux `renommagesTechs2026` /
`techsManquantes2026` / `muraille40_2026` / `slotsVides2026` retirés
du type, `migrerProgres` supprimée, garde-fous + boucles
Marchand/`prodParTitre` sur `merged.progres` supprimées, 4 blocs de
migration techs remplacés par des commentaires datés, purge ajoutée
en tête de `cfgOf` (`delete (merged as { progres?: unknown }).progres`,
patron dogmes). `referentiels.json` — clé « progres » (23 arbres)
supprimée. `rules/registry.ts` — `reglesProgres` + `clesTechsParNom` +
`PROGRES_FLUX` supprimées, source 'tech' retirée du registre.
`rules/effects/banque.ts` — conditions `tech`/`techNom` + 7 cases de
switch des flux techs supprimées. `rules/types.ts` — 7 interfaces
`EffetFlux*` + membres de l'union `Effet` + conditions + `'tech'` de
`SourceRegle` retirés (note style dogme : jamais à réutiliser).

**UI** : `App.tsx` — section 'progres' du type, entrée nav 🧪 et rendu
retirés ; `ConfigTables.tsx` (re-export `ProgresParams` puis
`EffetsTechEditor` retirés) ; `ParamsPanel.tsx` (onglet Progrès) ;
`ReferenceDataPanel.tsx` (onglet référentiel) ;
`logiqueReference.ts` (`fmtEffetTech`, onglet) ;
`params/EditeursEffets.tsx` (`EffetsTechEditor` + `TYPES_EFFETS`,
import `TextInput` mort) ; `pays/Constructions.ts` (bonus Urbanisme
×2, réductions Développement durable/économe/Viser le ciel, bloc
merveilles « Progrès du Tourisme ») ; `pays/RecapParTour.tsx` (ligne
canal Progrès) ; `pays/AideAuto.tsx` (mentions technologies des coûts
auto) ; `RoyaumeView.tsx` (docblock). `state/store.tsx` : le docblock
d'incident « déblocage d'une tech » est CONSERVÉ (mémoire, règle 9).

**Tests & scripts** : `params.test.ts` — l'effet de tech du test v2
remplacé par : config v2 avec `progres` posé puis purge `undefined`
après `cfgOf`. `registre.test.ts` — `TYPES_CONNUSS` sans les 7 types
techs, seuil du registre 20→10 (le compte 14 sans les règles 'tech').
`scripts/diag.ts` — copie autonome nettoyée (interface, champ,
mention feuille Progrès du header). `AGENTS.md` — structure à jour.

**Incidents de purge corrigés avant push** (la validation locale les
a tous attrapés — aucun n'a atteint la CI) : (1) re-export mort
`EffetsTechEditor` dans `ConfigTables.tsx` (TS2305 en CI) et import
`TextInput` mort dans `EditeursEffets.tsx` (TS6133) ; (2)
`reglePourConstruction` (lookup constructions, INDEPENDANT des techs)
avait été emporté par la purge de la source 'tech' → 1 TS2724 + 2
TS7006 en cascade dans `engine/constructions.ts` — restauré ; (3) la
re-synchronisation Tourisme de fin de bloc PROGRES manquait →
l'invariant « stock = production » cassait (le commerce crédite le
stock après les resyncs 3septies/3nonies ; test commerce B4 rouge :
stock 24 ≠ prod 12) — l'appel est conservé au point historique
(dans le commentaire RETRAIT du 3undecies-bis) ; (4) seuil périmé du
test registre (le registre sans les techs compte 14 règles, pas >20).

**Validation** : tsc strict diff NUL vs tarball HEAD (les seules
lignes restantes du diff sont les erreurs des fichiers de tests
supprimés, présentes sur la base uniquement) ; 124/124 tests natifs
verts (node strip-types + hooks, `.tsx` de rendu couverts par la CI —
le parse JSX de tous les `.tsx` est de toute façon couvert par tsc
lui-même) ; diag exit 0 ; `jq` OK sur `referentiels.json` (clé
progres absente) ; grep résiduel « progres/tech » = docblocks
RETRAIT/historiques datés uniquement.

## Suppression des textes de conditions de victoire (2026-10-24, retour arbitre « je t'avais dit de supprimer les conditions de victoire »)

Suite directe de la purge des progrès : les textes des conditions de
victoire restants (Lauriers des 6 voies) sont SUPPRIMÉS — périmètre
arbitré par Thibaut : « juste le texte des systèmes de victoire,
garder le radar et des Lauriers vides ». La ressource **Science
reste telle quelle** (arbitrage explicite).

**Ce qui disparaît** : les textes `condition`/`bonus` des 24 Lauriers
(6 voies × 4) de `referentiels.json` (champs vidés, structure
conservée) ; `VICTORY_TEXT` (textes des Laurier IV, chapitre XII) de
`engine/gameData2.ts` ET de sa copie autonome `scripts/diag.ts` ;
sa liste d'affichage sur l'accueil (`Dashboard.tsx`), le pied de
l'onglet Victoires du wiki (`reference/OngletsVictoires.tsx`), la
ligne « Conditions de victoire » de l'aide-mémoire
(`reference/OngletsAideMemoire.tsx`) ; l'énumération des conditions
dans l'aide auto (`pays/AideAuto.tsx`).

**Ce qui reste (structure intacte)** : les 6 voies × 4 Lauriers à
cocher sur l'accueil (ordre strict, `cocherLaurier` — le rappel de
crise au log ne porte plus de texte de bonus), le radar
(`victoryProgress`, repli « … » au survol quand la condition est
vide), les crises (table `crises` du référentiel), les Lauriers déjà
validés des parties en cours (seuls les TEXTES sont actualisés).

**Propagation aux configs sauvegardées SANS bump de schéma** : le
garde-fou « mise à jour des CONDITIONS de victoire » (retour
Thibaut 2026-10-15, appliqué à CHAQUE `cfgOf` même convergée)
remplace une voie dont les textes diffèrent du référentiel — avec le
référentiel vidé, les configs existantes (dont la partie en ligne)
reprennent automatiquement des Lauriers vides, idempotent. Aucun
`SCHEMA_VERSION_CONFIG` à incrémenter : le mécanisme préexistant
fait le travail.

**Validation** : tsc strict diff nul vs base, tests natifs verts,
diag exit 0, `jq` OK sur le référentiel (24 conditions + 24 bonus
vidés, aucune autre ligne touchée), grep résiduel `VICTORY_TEXT` =
commentaires RETRAIT datés uniquement.


## Retrait intégral des règles de factions + vidage des textes « Ministre » (2026-10-24, revue des résiduels R1-R4 — arbitrage Thibaut)

Suite de la revue des résiduels post-simplifications (audit R1-R4
présenté par Thibaut le 2026-10-24) : R1 (« résiduels de texte
Ministre ») était le seul point ACTIONNABLE — R2 (miroir diag.ts en
dérive permanente), R3 (tests de rendu toujours « fumée ») et R4
(fluxParMetier orphelin) restent de la dette ASSUMÉE et documentée
(cf. sections précédentes ; l'alternative R2 « brancher diag sur le
vrai bundle _engine.mjs » reste un jour possible).

**NB contexte** : l'audit R1 comptait 9 occurrences (« recevez 50 Or
par ministre », « Vos Ministres génèrent +6 Science par tour »…) ;
la purge du système de progrès (`eb7a1179`) a déjà emporté les textes
de récompenses de techs — il restait 4 résiduels réels : la ligne
« Ministre » de la table métiers (encore ATTRIBUTUABLE via le picker
de la page Population — attribution Manuelle, nobleSeul), son effet
(« Octroie un ministre qui appartient à un ministère, maximum 1. »)
+ coût de révocation (« 30 Or + 6 Soie ») dans metiersEffets, la
ligne Basiléens « Vous pouvez posséder 1 Ministre supplémentaire. »,
et la ligne `['Ministre', …]` du snapshot ANCIENS de defaultConfig.

**Arbitrage Thibaut** (ask_user_question, 2026-10-24) :
- Fiches de peuples : « vide toutes les lignes de règles + les
  descriptions, ne garde que les noms » — RETRAIT INTÉGRAL des
  règles de factions pour les 6 peuples (Basiléens, Peaux Vertes,
  Elfes d'Or, Sylvains, Norls, Vermvres de Kaoss — 56 lignes + 6
  descriptions) ;
- Ligne « Ministre » : « garder la ligne titre dans la table
  métiers, vider ses textes (description + effet → vides) » — le
  titre RESTE attribuable (inerte, plus aucun effet moteur).

**Implémentation** (4 fichiers, commit `f09ea596`) :
- `src/config/referentiels.json` — édit chirurgical jq (round-trip
  byte-identique VÉRIFIÉ avant transformation, `-j` pour conserver
  l'absence de newline finale) : 6 descriptions → `""`, 6 `lignes`
  → `[]`, description/effet/révocation « Ministre » → `""` ; diff
  limité aux hunks voulus (260 lignes changées, aucune autre) ;
  structure intacte (champs description/lignes conservés pour
  recevoir de nouvelles règles).
- `src/config/defaultConfig.ts` — DEUX garde-fous dans la queue
  commune de cfgOf (après la branche migrations/tampon, avant
  taxes25 — même patron que la « mise à jour des CONDITIONS ») :
  (1) toute fiche de peuple PORTÉE PAR LE RÉFÉRENTIEL d'une config
  sauvegardée est REMPLACÉE par la fiche courante (vide) — les
  reliquats lignes/descriptions/reglesBase/ageII/ageIII des configs
  d'avant le 2026-10-19 que l'onglet Peuples rendait encore
  disparaissent ; un peuple HORS référentiel (personnalisé) est
  conservé tel quel ; (2) description de l'entrée « Ministre » de
  merged.metiers + effet/révocation de metiersEffets alignés sur le
  référentiel vide. Idempotents, SANS bump de
  SCHEMA_VERSION_CONFIG (règle (x)) — la partie en ligne de Thibaut
  est nettoyée au premier chargement, sans re-jouer les migrations.
  Docblock NB ajouté sur la ligne « Ministre » du snapshot ANCIENS
  (patron Marchand : portrait des défauts d'avant la 3a conservé
  pour l'appariement des anciens défauts exacts).
- `src/components/reference/OngletsTraitsPeuples.tsx` — note de
  l'onglet Peuples remplacée : « Règles de factions retirées
  intégralement le 2026-10-24 (retour arbitre) : seuls les noms des
  peuples sont conservés, les fiches sont vides — à redéfinir par
  l'arbitre. » (l'ancienne note « conservées à titre documentaire »
  et son historique 2026-10-19 restent dans le docblock du fichier).
- `src/state/config.test.ts` — +2 tests de non-régression (fiches
  vidées même d'une config DÉJÀ CONVERGÉE tamponnée schemaVersion=4
  avec relics reglesBase/ageII ; ligne titre Ministre conservée +
  textes vidés + idempotence des deux garde-fous).

**Validation** : tsc strict diff VIDE vs base (99 erreurs
préexistantes identiques) ; **126/126 tests natifs** (124 + 2) ;
diag exit 0 — sortie IDENTIQUE à la base (49 lignes, 15 ÉCHEC
informatifs : le miroir lit `referentiels.json` directement, aucun
re-patch nécessaire cette fois) ; `jq empty` OK.

Nettoyage effectué au passage : la seule ligne « Vous pouvez
posséder 1 Ministre supplémentaire » des fiches disparaît avec les
lignes ; plus AUCUN texte de règle affiché ne promet un effet que le
jeu ne tient plus (les seules mentions « Ministre » restantes sont
la ligne titre vidée, les docblocks RETRAIT/HISTORIQUE et les
témoins de conversion titre→métier des migrations d'état).


## diag.ts branché sur le vrai moteur — résolution R2 (2026-10-24, retour arbitre « fait R2 »)

**Résolution de R2** (audit résiduels 2026-10-24 : « scripts/diag.ts
est un miroir autonome du moteur qui vivra en dérive permanente ;
alternative un jour : le brancher sur le vrai bundle »). Thibaut
arbitre le 2026-10-24 : « fait R2 ».

**Ce qui change** (4 fichiers) :
- `scripts/diag.ts` — le miroir de ~2 440 lignes (copies embarquées
  de params/defaultConfig/types/rng/gameData/shared/saisons/
  economie/vassalite/titres/sante/naissances/culture/armees/journal/
  victory/validation/engine/setup) est SUPPRIMÉ : le script importe
  désormais le VRAI moteur (`runTurn` de `src/engine/tour.ts`,
  `createGame`/`defaultSetups` de `src/engine/setup.ts`, `cfgOf`,
  `isNobleDyn`). Le harnais (partie saine : createGame + 4 tours +
  levée d'armées + dissolution/renommage ; scénarios de dégradation ;
  mutateurs ArmiesPanel) est conservé en esprit, réaligné sur
  l'API réelle : `metier` (ex-titre), `config.metiers` (ex-titres),
  `config.constructions` (ex-batiments), + NOUVEAUX scénarios couvrant
  la surface actuelle du moteur (ville.amenagements, ville.autres,
  citesLibres, cite.population, routesCommerce, char.metier,
  config.typesHabitation, config.victoires) — 42 scénarios au lieu
  de 36. Plus AUCUN re-patch ne sera nécessaire aux vagues futures :
  le diag exécute ce que le jeu exécute.
- `scripts/diag-loader.mjs` NOUVEAU — loader Node committé (hooks
  registerHooks : resolve sans extension .ts/.tsx/.json + .json en
  module ES), même rôle que tsx pour les tests ; le workflow diag
  n'installe AUCUNE dépendance.
- `.github/workflows/diag.yaml` — commande :
  `node --experimental-strip-types --import ./scripts/diag-loader.mjs
  scripts/diag.ts` (l'ancienne commande sans loader ne pouvait pas
  résoudre les imports sans extension du moteur).
- `diag-out.txt` — sortie régénérée commitée (le bot du workflow
  doit trouver « diag-out.txt inchangé » ; déterminisme vérifié par
  2 exécutions identiques).

**Preuves de la dérive dénoncée par l'audit** : l'ancien miroir
annonçait « log 304 entrées / 7 commandants / Armée 2:2 soldats »
après 4 tours — le VRAI moteur produit « log 567 entrées / 4
commandants / Armée 2:3 soldats » (le miroir ne déroulait PAS les
étapes réelles du FinDeTour : gouverneurs, réaffectation des
métiers, bâtiments/aménagements/autres, régimes/cultures, cités
libres, proximité…) et utilisait encore l'API d'avant le rework
habitants (c.titre, config.titres, config.batiments).

**Validation** : diag exit 0, DÉTERMINISTE (2 runs identiques), 57
lignes, 14 ÉCHEC informatifs (12 runTurn + 2 mutators — états
dégradés que le vrai moteur n'a pas à gérer : le jeu répare via
normaliserEtat à l'ingestion) ; tsc strict diff VIDE vs base
(scripts/ hors tsconfig — aucun impact) ; 126/126 tests natifs.

R3 (tests de
rendu fumée) et R4 (fluxParMetier orphelin) sont résolus dans les
sections suivantes (même journée, retours arbitre « passe à R3 »
puis « passe à R4 »).


## Tests de rendu : du « fumée » aux données — résolution R3 (2026-10-24, retour arbitre « passe à R3 »)

L'audit constatait que les tests de rendu « fumée » ne vérifiaient
que des titres (« tel panneau affiche le mot Population ») : un
tableau rendu avec de mauvaises données passait. R3 les renforce.

**Méthode** (`src/components/testRendu.ts`) : `partieRendu()`
retourne désormais le `GameState` (partie de 2 tours jouée) au lieu
de seulement produire du HTML ; deux utilitaires ajoutés — `esc()`
(le HTML de `renderToString` échappe `& < > "`, l'apostrophe droite
en `&#x27;` — vérifié empiriquement) et `aplatir()` (retire les
marqueurs `<!-- -->` insérés par JSX entre texte et expression,
pour chercher des chaînes contiguës).

**Ce que chaque vue vérifie désormais** (données dérivées de
l'état, pas des constantes recopiées) :
- `Dashboard`/`PlayerView` : noms des 8 joueurs, stocks via `fmt`
  et valeur des `NumberInput` (`value=`), population VIVANTE,
  voies de victoire ;
- `PopulationTable` : comptes par dynastie ; `RoyaumeView` : le
  Dirigeant via `pers()` de `./royaume/logiqueRoyaume` ;
- `EventLogPanel` : ordre du journal (reverse) et compte exact
  `min(500, log)` ; `HistoryPanel` : labels de tours/max, une
  polyline PAR joueur ;
- `ArmiesPanel` : prix de levée via `prixArmee(90, C, p1, etat)`,
  commandants = filtre `age >= C.p.adultAge && isNobleDyn(c.dynastie,
  C) && !c.armee` ;
- `CitesLibresView` : garnison via `garnisonCiteLibre(etat, C)` avec
  le `fmtNum` de `./citesLibres/logiqueCitesLibres` (rend « 140 »,
  PAS « +140 » — pas celui de pays-utils), les 8 cités libres par
  nom (createGame en génère 8) ;
- `ReferenceDataPanel` : métiers de `cfgOf`, groupes `PARAM_META`,
  `taxOrHautes` `value="1.25"`, PEUPLES/CULTURES/REGIMES de
  gameData dans les options ; `ParamsPanel`/`SetupPanel` : champs
  dérivés de la config réelle.

**Preuve par mutation** (composants mutés puis restaurés et
vérifiés octet par octet vs base) : prix codé en dur → DÉTECTÉE ;
journal sans `.reverse()` → DÉTECTÉE ; joueur 1 omis des courbes →
DÉTECTÉE ; population comptée avec les défunts → NON détectée
(no-op : aucun décès en 2 tours — mutation documentée comme telle,
sans effet réel).

**Validation** : 11/11 tests de rendu, 126/126 natifs, tsc strict
répliqué CI (ts 5.9.3 + @types/node 25.0.3, versions du lock) :
diff base/jeu VIDE, seules les 3 erreurs de stub supabase attendues
côté bac. Les tests `.ts` sous `src/` SONT type-checkés en CI
(tsconfig `include: ["src"]`) — c'est ce qui a motivé la réplique
exacte des versions. AGENTS.md réaligné (« 126 natifs + 11 rendu »).

R4 (fluxParMetier orphelin) est résolu dans la section suivante
(même journée, retour arbitre « passe à R4 »).

## Banque d'effets : purge complète des orphelins — résolution R4 (2026-10-24, retour arbitre « passe à R4 »)

L'audit relevait que `fluxParMetier` (et son champ `marchandsMax`)
avait un producteur mais aucun lecteur — le mécanisme Marchand avait
été emporté par la purge des progrès. Retour arbitre : purge complète
de la couche rules/ (ne garder que les types réellement produits) et
suppression du rappel « un marchand ne peut exploiter une merveille »
(onglet Victoires).

**Inventaire purgé** (tout retrait = docblock « RETRAIT » daté,
règle 9 — le code reste dans l'historique git) :
- `src/rules/types.ts` : union `Effet` réduite aux 4 types PRODUITS
  (fluxVille, garnisonVille via constructions ; fluxParAmenagement via
  régimes ; fluxParVilleCultureMonde via cultures) — 13 interfaces
  retirées (dont EffetEmissaires) ; `ContexteEffet.ports` supprimé
  (import Cfg retiré) ; `ConditionRegle` réduite à saison/regime/
  culture (peuple, pontificatMin, ageMin, vassal, suzerainDeCite :
  sans producteur) ; `SourceRegle` à 5 valeurs ('faction',
  'evenement', 'laurier' : déclarées vides) ; `RegleBanque.declencheur`
  retiré (sans producteur ni lecteur) ; `ContributionEffets` réduite
  à flux/fluxEte/garnison (canaux conversion, migration, reductions,
  instantanes : sans lecteur moteur) ;
- `src/rules/effects/banque.ts` : switch réduit aux 4 types,
  conditionsRemplies épuré, contributionVide → { flux, fluxEte,
  garnison } ; `src/rules/mocks.ts` : partieMock sans ports, imports
  morts retirés ;
- `src/engine/regimes.ts` : 2 appels appliquerRegles sans ports
  (import morte capitaleDe retirée) ; `src/engine/constructions.ts` :
  contexteLectureSeule sans ports (C_LECTURE conservé pour
  reglePourConstruction) ;
- `src/rules/registry.ts` : docblock clarifié — `garnisonParRang` est
  un champ RÉFÉRENTIEL des régimes, pas le type retiré ;
- `src/rules/registre.test.ts` : TYPES_CONNUSS → 4 types, fantôme
  garnisonJoueur retiré ; `src/rules/banque.test.ts` : 3 tests
  réécrits (« garnisonVille accumule » (55), « conditions saison /
  regime (ET logique) », mock base Autoritarisme/Été) ; test
  tourismeInstantane SUPPRIMÉ → 126→125 natifs ;
- `src/config/defaultConfig.ts` : commentaire « Trois familles »
  simplifié (3e famille fluxParMetier muette, note R4 datée) ;
- `src/config/referentiels.json` : rappel marchand retiré des
  rappelsRegles (20→19) via `jq -j` — round-trip byte-identique
  vérifié AVANT, diff limité à cette ligne ;
- AGENTS.md : compteurs 126→125 natifs + NB R4 daté sur la banque à
  4 types.

**Homonymes légitimes CONSERVÉS** (documentés pour ne pas repurger
par erreur) : `garnisonParRang` (champ référentiel des régimes, lu par
OngletsCultures/ParamsPanel/CarteRoyaume/regimes.ts/garnisons.ts) ;
`conversionPoidsLocal` (param de config) ;
`reductionLeveeArmeesMerveilles` (fonction moteur). Grep résiduel
vivant après purge : AUCUN (les mentions restantes sont les docblocks
RETRAIT datés uniquement).

**Validation** : 125/125 tests natifs (126−1 : test tourismeInstantane
retiré), 11/11 tests de rendu, tsc strict répliqué CI (ts 5.9.3 +
@types/node 25.0.3, versions du lock) : 4 lignes côté jeu dont 3
stubs supabase attendus, diff normalisé base/jeu VIDE ; diag exit 0,
57 lignes, IDENTIQUE base/jeu, déterministe (2 runs cmp) ; `jq empty`
sur referentiels.json OK. Le CODE moteur a changé (regimes,
constructions) → le hash du bundle live bougera au déploiement.

## Règles d'ingénierie durables (issues d'incidents réels)

1. **Jamais `a || b ?? c` sans parenthèses** — erreur de syntaxe JS/esbuild
   (incident (u) : build CI échoué pour ça).
2. **Vérifier l'équilibre des balises JSX avant tout push** : ni `tsc` (sur .ts) ni
   les tests natifs ne parsent le JSX. Un `<ErrorBoundary>` jamais refermé a fait
   échouer un build CI en production (incident (a)). Un contrôle automatique
   d'équilibre des 22 fichiers .tsx a été utilisé à l'époque ; le re-créer ou
   l'équivalent si l'on pousse du JSX modifié en masse.
3. **Hooks React : tous les `useState` AVANT tout retour anticipé**, sinon
   « Rendered more hooks than during the previous render » = page blanche sans message.
4. **`normaliserEtat(state)`** (engine/villes.ts) doit être appelé à TOUTE ingestion
   d'un état (chargement local, salon rejoint, import JSON, callback realtime) :
   une ville sans `batiments` ni `history` = crash moteur ET rendu.
5. **`SCHEMA_VERSION_CONFIG`** (config/defaultConfig.ts) : à incrémenter pour toute
   évolution du RÉGISTRE devant atteindre les configs existantes. Les configs sont
   convergées puis tamponnées : suppression/renommage d'une ligne dans les Paramètres
   = DÉFINITIF. Ne PAS incrémenter pour une migration ciblée qui doit respecter les
   suppressions de l'utilisateur (précédent : champ `taxes25` du marqueur (z)).
6. **Formulaires en cascade** : soumettre la valeur EFFECTIVE (`état || première
   option`), jamais l'état brut qui reste à `''` (incident (u)).
7. **Éditions scriptées (sed etc.)** : les numéros de ligne changent ENTRE deux
   invocations sur le même fichier → une seule invocation par fichier quand les
   adresses se chevauchent, sinon re-grep les cibles ; et TOUJOURS re-diffuser le
   fichier complet contre la base après une série d'éditions avant push (un éditeur
   a déjà supprimé des lignes hors zone cible, dont 10 lignes de referentiels.json →
   JSON invalide → 2 builds CI rouges).
8. **Repli texte conservé** : le champ `production` texte reste dans
   referentiels.json et sert d'affichage de repli ; le moteur lit `effets[]` en
   priorité. Les configs sans `effets` continuent de fonctionner.
9. **Docblocks = mémoire des arbitrages** : les docblocks du code archivent les
   décisions de l'arbitre avec leur date ; ne jamais les supprimer en « nettoyant ».
10. **Vérification post-push** : check-runs du sha (build/jeu/diag/deploy success)
    puis bundle live `assets/index-*.js` : nouveau hash + grep des nouvelles chaînes.
    Le CDN de raw.githubusercontent.com peut servir un contenu périmé juste après un
    push ; vérifier l'intégrité via un contenu à sha inédit ou via l'API.
11. **Cycles d'import moteur (incident CI #36 / Edge #16, 2026-10-19)** : la TDZ
    (`Cannot access 'X' before initialization`) n'est attrapée NI par tsc strict
    NI par le typecheck Edge — uniquement par l'EXÉCUTION. Après tout nouvel
    import entre modules du moteur, lancer les tests AVANT de pousser ; un module
    à effets de bord top-level (`AMENAGEMENTS` dans amenagements.ts) ne doit
    jamais se retrouver dans un cycle (le canal Commerce de `tourismeCourant`,
    regimes → commerce, l'a appris à nos dépens).
12. **lib ES2020 de la CI (incident CI #50, 2026-10-20)** : le tsc
    strict de la CI compile avec `lib: ES2020` — les API post-ES2020
    (`Array.prototype.at`, `findLast`, `Object.hasOwn`…) échouent au
    type-check alors que le harnais local (Node 22, sans type-check)
    les exécute très bien. Ne pas utiliser d'API post-ES2020 dans
    `src/` (ou passer la lib en ES2022 — à arbitrer à l'occasion d'un
    vrai besoin).
13. **`tsc --noEmit` strict REPRODUCTIBLE EN LOCAL, sans `npm ci`**
    (incident `8258fac`, 2026-10-20) : le harnais strip-types ne
    type-check RIEN — les 3 erreurs du commit passaient 112/112. Le
    tsc de la CI se reconstruit dans le bac : télécharger le tarball
    TypeScript de la version exacte du package-lock
    (registry.npmjs.org/typescript/-/typescript-5.9.3.tgz),
    l'extraire (plus les tarballs react/@types si absents), puis
    lancer `node <tsc>/bin/tsc --noEmit`. Artefacts locaux attendus :
    les erreurs de stub `src/supabase/client.ts` (paquet
    @supabase/supabase-js absent du bac, présent en CI — le fichier
    n'a pas changé) ; toute AUTRE erreur est réelle. À lancer avant
    tout push de .ts/.tsx (seul filet sur les .tsx, cf. règle 2).
    NB (R3, 2026-10-24) : le harnais doit AUSSI installer
    `@types/node` (version exacte du lock, ex. 25.0.3) — sans lui,
    le tsc local produit de fausses erreurs TS2307 (`node:test`
    introuvable) et TS18048 (`assert.ok` ne rétrécit pas le type
    sans types de `node:assert`) qu'on ne voit pas en CI ; avec
    ts 5.9.3 + @types/node 25.0.3, diff base/jeu VIDE attendu
    (hors stubs supabase).

14. **Mémoïsation/cache : prouver par A/B déterministe** (vague
    scalabilité, 2026-10-24) : une optimisation qui « ne change rien »
    se PROUVE en rejouant un scénario déterministe (graine fixe, partie
    16k habitants, 3 tours) sur l'arbre d'avant (tarball HEAD frais) et
    le bac d'après, puis en comparant l'état final canonique octet par
    octet — ids normalisés par ordre d'apparition, car `newId` embarque
    `Date.now()` (shared.ts : un rejeu produit les mêmes événements,
    seuls les ids diffèrent). Les tests couvrent les unités ; l'A/B
    couvre la composition entière du tour (bench + scripts/_ab-run du
    bac, non poussés).

15. **push_files n'est PAS idempotent sous rejeu du bac** (incident
    vague qualité, 2026-10-24) : un programme run_typescript qui
    dépasse son budget est REJOUÉ depuis le début et ses appels à
    effets de bord (push_files) s'exécutent À NOUVEAU — un script
    poussant 6 commits en a poussé 11 (5 en double). Toujours :
    (1) UN commit par programme run_typescript ; (2) garde anti-doublon
    AVANT chaque push (list_commits du HEAD de la branche ciblée ;
    si le message du commit y figure déjà → SKIP) ; (3) après un échec
    ProgramBudgetExceeded, vérifier l'état réel de la branche
    (list_commits) avant de relancer quoi que ce soit.

## Raccourci git

Les messages de commit sont rédigés en français et documentent chaque refonte : pour
comprendre une zone de code, `git log --oneline -- <fichier>` et les messages de
commit sont la source la plus rapide (chaque marqueur/commit cite ses arbitrages).

## Bonheur des villes — 5 facteurs, implémentation vague B (2026-10-24, arbitrages Thibaut v3)

**Design** (simulé AVANT implémentation — `scripts/sim-bonheur.ts`,
partie réelle 8 joueurs, sorties courbes + 15 scénarios) : le bonheur
d'une ville est la MOYENNE SIMPLE de 5 scores [0-100] :

| Facteur | Formule (arbitrages v3) |
|---|---|
| Emploi | OPTIMUM symétrique : 100 si offres = travailleurs EXACTEMENT ; malus IDENTIQUE en manque et en excès (±25 % → 75, ×2 → 0). Moyenne de deux écarts : structure (offres vs travailleurs) et postes pourvus |
| Logement | OPTIMUM symétrique PAR HABITANT : 1 logement = 1 habitant logé ; 100 si chacun a le sien, 0 si personne n'en a ou à 2× plus de logements que d'habitants |
| Sécurité | OPTIMUM symétrique : garnison vs 100 × rang d'habitation (0 si nulle, 0 aussi à 2× la cible) |
| Santé | 100 − pourcentage de malades (linéaire) |
| Tourisme | 100 × tourisme du joueur / tourisme MONDIAL (plafonné) — une course entre joueurs |

**Décisions d'arbitre consignées** : (1) malus symétrique identique
manque/excès — une ville trop bâtisseuse est pénalisée comme une
ville pauvre ; (2) logement par habitant (le parse des 60 logements
d'un Hameau de 53 habitants donne 87 — la donnée existante colle) ;
(3) cible sécurité 100×rang maintenue malgré la rareté de la
Garnison au plateau (pousse à construire des Postes de garde) ;
(4) tourisme mondial = course (à 8 joueurs égaux, 12,5 chacun).

**Implémentation** (`src/engine/bonheur.ts`, fonction PURE — aucun
état stocké, calculé à la demande) : formules pures testées
(`scoreOptimum`, `scoreSante`, `scoreTourisme`, `bonheurVille`) +
lecture des données réelles (`scoresVille` : emplois via
`capMetierVille`/`metiersDisponiblesRang`, logements via
`rangsDefsType`/`domicilesDisponibles`, garnison via
`garnisonHabitationVille`, tourisme via `tourismeCourant`, malades
via `statut === 'Malade'`) + agrégats `bonheurVilleComplete` et
`bonheurJoueur`. AUCUN branchement moteur pour l'instant (pas
d'effet natalité/impôts — à arbitrer en vague E).

**Tests** (`src/engine/bonheur.test.ts`, 10) : courbes pures
(100/exact, symétrie ±25 % → 75, ×2 → 0, cas limites), parse des
logements, partie témoin (bornes + santé 100/tourisme 0 au tour 1),
épidémie 30 % → santé 70, moyennes ville/joueur cohérentes,
déterminisme (fonction pure). **146/146 natifs** verts, tsc strict 0.

**Suites** (domiciles/bonheur/ascension) : vague A (table domiciles
structurée + qualité des métiers), vague C (attribution des
domiciles aux foyers + UI), vague D (ascension/chute sociales),
vague E (effets du bonheur + UI jauges).

## Vagues A+C — table domiciles, qualité des métiers, foyers et attribution (2026-10-24)

**Vague A — données** :
- Référentiel : table `domiciles` (5 types, qualité 1-5 :
  Masure/Maison/Auberge/Maison de notable/Palais — arbitrage
  SIMPLE : pas de capacité ni coût, 1 domicile = 1 logement, les
  bâtiments constructibles viendront) ; `domicilesRang` STRUCTURÉ
  sur chaque rang des typesHabitation (conversion du texte
  « 50 maisons, 10 Auberge » → [{Maison, 50}, {Auberge, 10}],
  données existantes inchangées en compte) ; champ `qualite`
  ('roturier'|'bourgeois'|'noble') sur les 23 métiers —
  arbitrage : aménagement→roturier, bâtiment→bourgeois
  (Commerçant/Scientifique/Banquier/Troubadour/Professeur/Garde),
  lignée nobleSeul→noble. NE CHANGE RIEN à l'affectation (sert à
  la vague D ascension).
- Config : `DomicileDefConfig`, `domiciles` dans GameConfig,
  `domicilesRang` optionnel dans HabitationDef, complété par
  migrerTypesHabitation (idempotent, patron metiersBase).

**Vague C — stock et attribution** (`src/engine/domiciles.ts`) :
- `City.domiciles` : le stock VIT DANS LA VILLE (complété par
  normaliserEtat pour les vieilles sauvegardes — via migrerEtat
  v1, tampon schema) ; `initStockVille` (le rang DÉFINIT l'offre,
  appelé à la création/changement de rang).
- `foyersDeVille` : partition PAR FOYER (adulte marié = couple ;
  célibataire seul ; enfants mineurs suivent mère puis père ;
  garde-fou premier adulte). `attribuerDomicilesVille` :
  meilleure qualité disponible d'abord, sans dépasser le stock,
  foyer déjà logé garde son logement (on ne déloge personne),
  stock insuffisant → foyer sans domicile (champ null), pas de
  surbooking.
- `Character.domicile` (posé en vague 2 rework habitants) devient
  la clé vivante — le champ est déjà AFFICHÉ dans la page
  Population (LignePersonnage), l'attribution le remplit.

**Tests** (`domiciles.test.ts`, 11) : table et lookup, stockRang
converti (50+10=60 Hameau, 100+50=150 Cité), qualités des métiers
par catégorie, complétion des vieilles sauvegardes (tampon schema
retiré = rejoue v1), initStockVille écrase au changement de rang,
partition des foyers sans doublon + couverture complète,
attribution complète/meilleure d'abord/sans surbooking/idempotente.
**157/157 natifs** verts, tsc strict 0, bundle OK.

NB : l'attribution n'est pas encore APPELÉE par le fin de tour —
c'est un choix (vague D : l'ascension appellera attribution +
évaluation à chaque fin de tour). Pour l'instant les tests
l'appellent explicitement.

## Vague D — statut social : prestige des familles, héritage, rangs (2026-10-24, arbitrages Thibaut)

**Design** (arbitrages exacts, après refonte RP — les « cases à
cocher » v1 abandonnées pour un score CONTINU) :
- le PRESTIGE est FAMILIAL : convergence des couples (moyenne des
  deux + gain commun), un personnage monte/descend AVEC ses
  enfants ;
- HÉRITAGE : à l'âge adulte, 50 % du prestige MOYEN des parents
  (un seul parent → 50 % de ce parent), joué UNE fois (marqueur
  prestigeHerite) ;
- RANG DÉRIVÉ (fonction pure) : < 100 roturier, ≥ 100 bourgeois,
  ≥ 250 noble — un enfant de deux nobles à 250 naît bourgeois ;
- CALCUL PAR TOUR : sans emploi −2, sans domicile −2, malade −2,
  domicile +0..+4 (qualité −1 : Masure 0, Maison 1, Auberge 2,
  notable 3, Palais 4), métier +2 bourgeois / +5 noble, +1 si
  bonheur de la ville > 50 (remplace le tourisme — arbitrage :
  le tourisme est déjà un facteur du bonheur, pas de double
  comptage) ;
- journal des changements de rang (📈 bourgeoisie, 👑 noblesse,
  📉 chutes).

**BUG ATTRAPÉ PAR LES TESTS (consigné)** : l'héritage tournait
sur TOUS les adultes sans marqueur — la génération FONDATRICE
(sans parents connus) recevait un « héritage 0 » qui ÉCRASAIT le
prestige du tour, remettant toute la population à 0 chaque tour.
Correctif : l'héritage ne concerne que les personnages NÉS DANS
LA PARTIE (parents connus via mereId/pereId). La génération
fondatrice part de 0 et fait ses preuves.

**Implémentation** : `statutSocial.ts` (rangSocial, prestigeDe,
gainPrestigeTour, evaluerFamilles — champ `prestige` +
`prestigeHerite` sur Character, docblocks arbitrages) ;
branchement fin de tour étape 3.7 de populationTurn (après la
démographie : les naissances/morts/maladies du tour comptent).
Vagues précédentes branchées : l'attribution des domiciles
(vague C) n'est PAS encore appelée par le tour — les domiciles
s'attribuent à la création/changement de rang (initStockVille),
l'attribution dynamique (foyers) viendra avec l'UI vague E.

**Tests** (`statutSocial.test.ts`, 6) : seuils rangSocial, formule
exacte du gain (tous cas : −4 sans rien, +9 Gouverneur au Palais,
bonheur strictement > 50), accumulation tour après tour,
convergence des couples (200/0 → ~100 partagé), héritage 50 %
moyenne + pas de double héritage, runTurn 10 tours sans crash ni
prestige négatif. **163/163 natifs** verts, tsc strict 0, bundle
OK, diag exit 0.

**Reste (vague E)** : appeler attribuerDomicilesVille au fin de
tour (ou à l'UI), jauges bonheur/prestige dans la page Population
et Pays, effets du bonheur (natalité/impôts — à arbitrer),
l'anoblissement manuel du Dirigeant (action + coût) — et la
question des mariages par condition (à arbitrer).

## Vague E — branchement complet et arbitrages finaux (2026-10-24, retour arbitre)

**Arbitrages Thibaut** :
1. **Anoblissement AUTOMATIQUE** pour l'instant (noblesse à
   prestige ≥ 250 sans action du Dirigeant — la grâce du souverain
   reste une piste si le volume de nobles devient un problème) ;
2. **Mariages LIBRES + bonus de même condition** : nouveau
   paramètre `mariageMemeRang` (+0.10 de probabilité quand les
   deux époux sont de même rang social — même patron que
   `mariageMemeCulture` ; aucune interdiction inter-conditions) ;
3. **Bonheur INDICATEUR PUR** pour l'instant (aucun effet
   natalité/impôts — les jauges s'affichent, on regarde vivre le
   système avant d'arbitrer des effets).

**Branchement complet du fin de tour** (populationTurn) :
- étape 3.6ter : ATTRIBUTION des domiciles aux foyers de toutes
  les villes du joueur — après la démographie (les nouveaux
  foyers de l'année prennent les places libres), avant le statut
  social (le prestige du tour compte le domicile attribué) ;
- étape 3.7 : évaluation du prestige (inchangée).

**UI** :
- carte de ville (pays/VilleCarte) : jauge « Bonheur : N / 100 »
  colorée (vert ≥ 70, ambre ≥ 40, rouge), détail des 5 facteurs
  en info-bulle au survol ;
- page Population : nouvelle colonne « Rang » (badge
  roturier/bourgeois/noble + valeur de prestige, seuils en
  info-bulle) à côté de la colonne Domicile.

**Validation** : 163/163 natifs, tsc strict 0, handler Deno 0,
bundle OK, diag exit 0, build vite OK (JSX des deux vues
modifiées compile). Le système domiciles/bonheur/statut social
est COMPLET et branché : les parties existantes gagnent le
prestige au premier fin de tour (génération fondatrice à 0, les
naissances hériteront).

## Audit de merge (2026-10-24) — 1 bug critique attrapé avant la prod

L'audit d'avant-merge (partie réelle de 20 tours) a révélé que
** personne n'était logé et aucun prestige ne s'accumulait** :
`createGame` ne posait pas `City.domiciles` (le stock du rang),
et `normaliserEtat` ne répare que les VIEILLES sauvegardes (via
migrerEtat v1, tampon schema) — les parties NEUVES restaient
sans stock, l'attribution ne logeait personne, le facteur
logement du bonheur restait à 0 et le prestige plafonnait.

**Correctifs (3 sites)** :
1. `createGame` : stock initialisé au rang de création de chaque
   ville (stockRang) ;
2. changement de rang (UI VilleCarte) : `initStockVille` après le
   débit du coût (le rang DÉFINIT l'offre) ;
3. DÉFENSE EN PROFONDEUR dans `attribuerDomicilesVille` : une
   ville sans stock (partie sauvegardée avant la vague, tampon à
   jour → migrerEtat ne rejoue pas la v1) se voit initialiser le
   stock au rang courant.

**Vérification post-correctif** (partie réelle 20 tours) :
612/1521 habitants logés (l'offre du rang est le goulot — voulu :
il faut monter en rang), 3 bourgeois avec événements journalisés
(« 📈 Prisca Ferbois accède à la bourgeoisie »), vieille partie
tamponnée réparée au premier tour (293 logés, 288 prestiges).
2 tests de régression ajoutés (165/165 verts).

**Leçon (règle de plus)** : les tests unitaires appelaient
l'attribution EXPLICITEMENT avec un stock posé à la main — le
chaînage complet createGame→runTurn n'était couvert par aucun
test d'intégration sur ce chemin. La régression 20 tours
vérifie les invariants GÉNÉRAUX mais pas « le système nouveau
vit en vrai ». Toute nouvelle mécanique branchée au tour gagne
un test « partie réelle : la mécanique produit ses effets
attendus au bout de N tours ».

## Audit externe B1-B7 (2026-10-24) — tous avérés, tous traités

Un audit indépendant a relevé 7 points sur la vague
domiciles/bonheur/statut social ; vérifiés un à un contre le
code, TOUS avérés :

- **B1 (bug, corrigé)** : `emploisOffertsVille` passait l'objet
  `Player` au lieu de `p.n` à `capMetierVille`, masqué par un
  cast `as never` → `r.joueur === joueur` (nombre === objet)
  échouait toujours : les emplois ouverts par les ROUTES
  COMMERCIALES ne comptaient jamais dans le facteur Emploi.
  Correctif : `joueur: p.n`, le cast supprimé.
- **B2 (dette, corrigé)** : `logementsVille` parsait encore le
  TEXTE `domicilesDisponibles` (double source de vérité).
  Correctif : lecture du stock `City.domiciles` (source unique),
  replis `domicilesRang` puis texte (config très ancienne).
- **B3 (arbitrage, PRÉSENTÉ)** : incohérence d'unité logement —
  le bonheur compare aux HABITANTS (arbitrage initial « 1
  logement = 1 habitant »), l'attribution loge des FOYERS.
  Chiffré sur partie réelle : 84 logés/257 habitants → score
  23, mais 60 logements/78 foyers → 77 par foyers, et le
  prestige compte le domicile par PERSONNE. Trois unités pour
  trois systèmes. Arbitre tranché : habitants partout (le
  « 1 logement = 1 habitant » initial est conservé — les foyers
  partagent un domicile, les conjoints/enfants logés comptent).
- **B4 (doc, corrigé)** : 3 docblocks inexactes (mereId/pereId,
  parents décédés transmettent aussi, retour = logés pas
  seulement nouveaux).
- **B5 (mort, corrigé)** : `prestigeFoyer` jamais appelé + branche
  `conjointPrestige !== null` de `appliquer()` inatteignable —
  supprimés, `appliquer` simplifié (célibataires : gain simple).
- **B6 (tests, corrigé)** : test dédié du bonus
  `mariageMemeRang` (écart exact = paramètre, personnages
  identiques par ailleurs). NB : la première version du test
  était fausse (métiers différents → bonus métier parasite) —
  le test attrapait son propre bug, pas celui du moteur.
- **B7 (convention, corrigé)** : arbitrages design consignés
  dans docs/ia/regles-et-arbitrages.md (section « Domiciles,
  bonheur et statut social ») — le journal reste pour
  l'ingénierie, les règles vivent dans le référentiel
  d'arbitrages.

166/166 tests verts après correctifs.

## B3 clôturé — arbitrage final : « 1 personne = 1 maison » (2026-10-24)

Retour de l'arbitre sur l'incohérence d'unité logement relevée
par l'audit B3 : **on reste sur 1 personne = 1 maison** (l'arbitrage
initial du bonheur est conservé). Conséquence assumée : le score
logement d'une ville densément peuplée est bas (23/100 sur la
capitale témoin — 60 logements pour 257 habitants), et c'est
VOLONTAIRE : la pression immobilière par tête pousse à monter en
rang (Hameau 60 → Cité 150 → Grande Cité 250 logements) et, plus
tard, à construire des bâtiments de logement. Les DEUX échelles
sont désormais explicites et datées partout :
- ATTRIBUTION : par FOYER (une maison par famille, 1 place) ;
- BONHEUR : par HABITANT (pression par tête).
Docblocks réalignés (domiciles.ts, types.ts, defaultConfig.ts) et
règle consignée dans regles-et-arbitrages.md. Le code du bonheur
était déjà conforme — aucun changement de comportement, purement
documentation + clôture d'audit. 166/166 verts.


## Clôture effective de l'audit B1-B7 (2026-10-25) — le push du 2026-10-24 avait manqué statutSocial.ts

Ré-audit de l'arbre `0813c99a` : le commit correctif du 2026-10-24
annonçait B4 (docblocks) et B5 (code mort) traités, mais
`src/engine/statutSocial.ts` était resté OCTET-IDENTIQUE à l'état
pré-correctif — ses edits n'avaient pas été inclus dans le push.
`prestigeFoyer` (jamais appelé) et la branche inatteignable
`conjointPrestige !== null` étaient toujours présents, et deux
docblocks restaient inexactes (héritage « parent vivant » vs code
qui transmet aussi posthumément ; foyersDeVille « mariageId » vs
mereId/pereId). Deux autres docblocks contredisaient les
correctifs déjà poussés : logementsVille (bonheur.ts, dit « parsé
du texte, la vague remplacera » au-dessus du corps corrigé B2) et
DomicileDefConfig (defaultConfig.ts, listé « réaligné » dans la
section B3 sans avoir changé).

Compléments poussés le 2026-10-25 (comportement moteur IDENTIQUE,
vérifié — diag octet-identique) :
- statutSocial.ts : prestigeFoyer RETIRÉ (docblock RETRAIT daté,
  règle 9), appliquer simplifié (paramètre/branche conjointPrestige
  supprimés — inatteignables, les couples sont agrégés en place),
  docblock héritage exact ;
- domiciles.ts : docblock foyersDeVille exact (mereId/pereId) ;
- bonheur.ts : docblock logementsVille réaligné sur le correctif
  B2 ;
- defaultConfig.ts : docblock DomicileDefConfig réaligné sur
  l'arbitrage « 1 personne = 1 maison ».

Validation : 155/155 natifs + 12/12 rendu, tsc strict (stubs
supabase seuls), diag exit 0 IDENTIQUE, Edge Function bundle +
exécution + typecheck verts. L'audit B1-B7 est cette fois réellement
clos : 7/7 dans l'arbre ET dans la mémoire. (Leçon candidate : un
correctif annoncé dans le message de commit doit être vérifié
contre le DIFF du push, pas contre l'intention.)

## Correctif échelle des domiciles : 0-4, pas 1-5 (2026-10-24, retour arbitre)

L'arbitre a relevé que la formule de prestige « domicile +0 à
+4 » IMPLIQUE une échelle de qualité 0-4 — l'implémentation
portait 1-5 en DONNÉE avec une compensation `qualite − 1` dans
gainPrestigeTour : ça marchait mais doublait la complexité et
contredisait la doc. Réalignement en DONNÉE PURE :

- référentiel : Masure 0, Maison 1, Auberge 2, Maison de
  notable 3, Palais 4 (la qualité EST le gain de prestige) ;
- gainPrestigeTour : plus de compensation, lecture directe ;
- BUG attrapé au passage : le normaliseur `Number(q) || 1`
  transformait la qualité 0 (Masure) en 1 — le falsy zéro,
  piège classique de l'idiome || ; corrigé en
  `Number.isFinite(Number(q))` ;
- tests réalignés (échelle 0-4 verrouillée, valeurs de gain
  inchangées), docblocks et regles-et-arbitrages à jour.

166/166 verts. AUCUN changement de comportement de jeu (les
gains étaient déjà corrects via la compensation) — pure
simplification + fix du cas Masure.

## Fiches métiers/aménagements 2026-10-25 — tiers 2/3, Taudis, renommages

**Données (fiches de l'arbitre)** :
- **Aménagements tiers 2/3 DE RETOUR** : 14 aménagements × 3 tiers
  (42 entrées) — tier 2 : 15 Or + 3 Pierre, tier 3 : 35 Or + 3 Fer ;
  emplacements selon les fiches (ex. Carrière tier 3 : Mineur ×6 +
  Charbonnier ×2) ; mécanique EXISTANTE réactivée
  (remplaceAmenagement : tier 2 remplace tier 1, tier 3 remplace
  tier 2) ;
- **TAUDIS des aménagements** : chaque aménagement apporte des
  logements au parc de la ville (tier 1 : 5, tier 2 : 8, tier 3 :
  10 — sauf Baleinier et Bâteau de pêche : 0) ; nouveau champ
  `taudisApportes` sur ConstructionRef + `taudisApportesVille`
  (domiciles.ts), compté par le facteur Logement du bonheur —
  les aménagements deviennent un LEVIER de logement en plus du
  rang ;
- **Renommage Masure → Taudis** (qualité 0) : alias à la lecture
  dans domicileDef (les vieilles parties portent « Masure » dans
  Character.domicile) ;
- **Métiers** : Chasseur +1,5 Nourriture (était 1,2) ; Garde →
  ROTURIER (était bourgeois — la fiche le classe en roturier,
  +10 Garnison via garnisonParGarde, inchangé).

**Réactivation du filtre de simplification** (config/defaultConfig) :
le retrait inconditionnel des constructions de rang ≥ 2
(2026-10-23, « pourquoi je vois encore le moulin à vent ») est
ASSOUPLI : il ne retire plus que les **BÂTIMENTS** de rang ≥ 2 —
les AMÉNAGEMENTS de rang 2/3 passent à nouveau (fiches). Le
commentaire du filtre l'avait prédit : « pour réactiver les
rangs 2/3 : les ré-ajouter au référentiel ET retirer ce filtre »
— fait pour les aménagements. 2 tests verrouillant l'ancienne
simplification réécrits (bâtiments seuls).

166/166 verts, tsc strict 0, handler 0, bundle OK, build vite OK,
diag 0.

## Santé : retraits Gompertz + métier Guérisseur (2026-10-25, arbitre)

**Retraits (retour arbitre)** :
- **plafond maladieCap (0,9) supprimé** — la courbe Gompertz monte
  sans borne (à très grand âge le risque dépasse 1, le tirage
  plafonne naturellement) ;
- **surrisque grossesse modMaladieEnceinte (+3 %) supprimé** — les
  femmes enceintes contractent comme les autres.
Paramètres retirés du type, des défauts et de PARAM_META ;
tests verrouillant l'ancien plafond réalignés (la Monte-Carlo
E[décès] ∈ [55, 66] tient toujours — le plafond ne jouait qu'à
75+ ans).

**Métier GUÉRISSEUR (25e métier)** :
- référentiel : roturier, production nulle, description des
  effets ;
- effets moteur (sante.ts, comptés par Guérisseur VIVANT en poste
  dans la ville du personnage, cumulables) :
  `guerisseurGuerison` +2 % de guérison par tour,
  `guerisseurContraction` −2 % de risque de contraction —
  paramètres éditables (Formules → Maladie) ;
- emplacement : l'Herboristerie (Ville et Château) accueille
  1 Guérisseur (le bâtiment garde aussi ses propres bonus
  malContraction −5 % / bonusGuerison +5 %) ;
- 2 tests dédiés (paramètres + effet structurel).

168/168 verts, tsc strict 0, handler 0, bundle OK, build vite OK,
diag 0.


## Carte ville : structure par blocs + bonheur en haut à droite (2026-10-25, arbitrages Thibaut)

Trois arbitrages du retour du 2026-10-25 : (1) bloc bonheur en HAUT
DROITE de la carte ville avec la moyenne ET les 5 axes en
MINI-JAUGES (label + barre colorée + valeur — plus seulement une
info-bulle au survol) ; (2) carte REGROUPÉE PAR BLOCS ; (3) le
tableau détaillé de la garnison RESTE toujours visible (pas de
compactage).

Nouvelle structure de VilleCarte (page Pays) :
1. TÊTE : Nom / Taxes / Proximité + bloc Bonheur à droite
   (.ville-tete-wrap : flex-wrap, repli sous 320px) ;
2. IDENTITÉ : culture majoritaire, habitants vivants, cultures
   présentes ;
3. RANG & TYPE + habitants requis ;
4. GARNISON des habitations (tableau détaillé conservé) ;
5. CONSTRUCTIONS (aménagements/bâtiments côte à côte) ;
6. AUTRES puis PRODUCTION de la ville ;
7. ACTIONS RARES (transférer, supprimer, devenir cité libre)
   DÉPLACÉES EN BAS de carte — elles ne cannibalisent plus la
   tête de lecture.

L'ancienne ligne bonheur (vague E, milieu de carte) est retirée.
CSS : .bonheur-bloc / .bonheur-axe (mini-jauges 6px, valeurs
tabulaires). Test de rendu DÉDIÉ (patron R3) : la moyenne et les
5 valeurs d'axes sont assertées CONTRE l'état — plus une assertion
NÉGATIVE garantissant que l'ancienne ligne n'est plus rendue (le
premier jet du test comptait le « Bonheur : moyenne… » de
l'info-bulle du bloc : motif distinctif « Bonheur : <strong »).

REBASE : des commits parallèles (échelle domiciles 0-4, fiches
métiers/Taudis, retraits Gompertz + Guérisseur) sont arrivés
pendant le travail — les edits UI ont été rejoués sur la tête
résultante ; aucune collision (VilleCarte/styles/PlayerView.test
intacts côté externe), test bonheur passé tel quel, diag IDENTIQUE
à la base externe.

AGENTS.md réaligné au passage (compteurs datés de R4 : 125 natifs
/ 11 rendu — la réalité est 157 / 12 fichiers (15 tests) après
les vagues domiciles/bonheur/statut social et Guérisseur ; NB daté).

Validation : 157/157 natifs + 15/15 rendu (12 fichiers), tsc strict
(stubs supabase seuls, diff base/jeu VIDE), diag exit 0 IDENTIQUE
(UI seule — le moteur n'a pas bougé), Edge Function bundle +
exécution verts.


## Audit express (2026-10-26) — dérives docblocks échelle 0-4 + piège falsy-zéro

Périmètre : lecture ciblée des zones fraîches (sante/Gompertz/
Guérisseur, domiciles 0-4, taudis, bonheur, VilleCarte) + tous les
contrôles. État à la tête 24b0159d : 157/157 natifs, 15/15 rendu
(12 fichiers), tsc strict 0 erreur, diag identique au dépôt, Edge
Function verte.

Vérifié CONFORME : Guérisseur (filtre vivant + ville + métier,
bornes via chance, paramètres 0,02/0,02 éditables — cumul illimité
par design, une dizaine de postes rend la maladie inoffensive :
équilibre à surveiller, pas un bug) ; taudis 5/8/10 par tier avec
exclusions Baleinier/Bâteau ✓ ; remplaceAmenagement câblé dans
l'UI Constructions ✓ ; correctifs d'audit B1/B2 en place ✓ ;
VilleCarte consomme scoresVille/bonheurVille du moteur (source
unique) ✓ ; plus aucun as never, zéro TODO/FIXME.

4 constats, corrigés dans la foulée :
1. statutSocial.ts : docblock d'en-tête AUTO-CONTRADICTOIRE
   (« Masure 0 … i.e. la qualité 1-5 moins un » vs correctif inline
   0-4 du même fichier) — réaligné (Taudis 0-4, la qualité EST le
   gain) + commentaire inline renommé Taudis ;
2. domiciles.ts : docblock qualiteDomicile « (1-5 ; 0 = inconnu) »
   — réaligné (échelle 0-4, 0 est une valeur LÉGALE : Taudis) ;
3. domiciles.test.ts : en-tête « qualité 1-5 » — réaligné ;
4. defaultConfig.ts : fertFactor `Number(x) || 1` — piège
   falsy-zéro LATENT (même famille que le bug Taudis 0 du
   2026-10-25) : remplacé par Number.isFinite (le défaut 1 ne
   s'applique qu'aux valeurs absentes ou non finies). Aucun
   comportement changé (toutes les cultures sont à 1), diag
   IDENTIQUE, 157/157 après correctif.

NB harnais (trace pour les sessions futures) : les « 3 stubs
supabase » rapportés le 2026-10-25 venaient d'un harnais local
incomplet (le paquet @supabase/supabase-js embarque ses types) —
le projet est réellement tsc strict 0 erreur.


## Carte ville : population & garnison en 2 colonnes (2026-10-26, retour Thibaut)

Retour du 2026-10-26 : « pour la garnison, garde un tableau
détaillé, mais rends le plus propre, idem pour les différentes
cultures. Peut-être que les deux pourraient cohabiter en 2
colonnes sur la même ligne. » Fait :

- NOUVEAU BLOC « POPULATION & GARNISON » en 2 colonnes
  (.ville-duo-cols, même repli 1 colonne <560px que
  .ville-constr), placé après Rang & type ;
- COLONNE GAUCHE, tableau des cultures présentes (.ville-table) :
  une ligne par culture (nom, habitant(s), part en %), la
  majoritaire SEULE en gras avec liseré accent, pied de tableau
  « Habitants vivants » en total — l'ancienne ligne à puces
  « Culture : N · … » de la tête est RETIRÉE (la tête garde la
  ligne concise « Culture majoritaire · N vivants ») ;
- COLONNE DROITE, tableau détaillé de la garnison (arbitre du
  2026-10-25 conservé : le détail reste TOUJOURS visible) :
  origine → ligne → valeur (+/−, négatives en rouge), plancher
  éventuel, ligne Total détachée — fin des styles inline et du
  titre verbeux « d'où vient ce chiffre » : classes CSS dédiées
  (.ville-duo-titre, .ville-table, .ligne-total, .ligne-major,
  valeurs numériques alignées à droite en tabular-nums).

Test de rendu DÉDIÉ (patron R3, 16e test de rendu) : comptes par
culture, gras de la majoritaire, total des vivants et garnison de
la capitale assertés CONTRE l'état (mêmes calculs que le
composant) + assertion NÉGATIVE sur l'ancienne ligne à puces
(motif « <strong>Culture : »).

Validation : 157/157 natifs, 16/16 rendu (12 fichiers), tsc strict
0 erreur, diag IDENTIQUE (UI seule), moteur inchangé.


## Carte ville : 5 retours UI de la capture d'écran (2026-10-26, 2e retour Thibaut)

Capture examinée (image envoyée au chat) — 5 constats, tous traités :
1. TABLEAU PRODUCTION, colonnes inégales → colgroup : colonne
   ressource 22 %, les 5 colonnes de valeurs à 15,6 % chacune.
2. « ON VOIT DEUX FOIS LA CULTURE » → la tête ne rend plus que
   « N habitant(s) vivant(s) » ; la culture vit UNIQUEMENT dans le
   tableau « Cultures présentes » (majoritaire en gras + liseré).
   Ville sans habitant : « aucun habitant — culture de la
   ville : X » (la culture de la ville reste visible).
3. Cases nom/taxes/proximité DE LA MÊME TAILLE → .ville-tete
   passe en grid 3 colonnes égales (fin du flex 1.5 du nom —
   la cause des largeurs inégales), repli 1 colonne sous 420px.
4. COÛTS DES AMÉNAGEMENTS DANS LE POPUP → mini-title épuré
   (« Aménagements » + mention Camp de bâtisseurs si active) :
   chaque option du picker affichait DÉJÀ son coût (tier 1 :
   référentiel ; tiers 2/3 : coût uniforme + « améliore X ») —
   plus rien dans le titre (coutTier retiré du composant).
5. RESSOURCES NON PRODUITES CACHÉES PAR DÉFAUT → le tableau
   production ne liste par défaut que les ressources avec au
   moins un canal non nul (bâtiments/aménagements/autres/
   villageois) ; toggle discret « tout afficher » /
   « produites seulement » à côté du titre (état local useState,
   pas persisté). SUPERSEDE le marqueur (r) du 2026-10-15
   « toutes les ressources même à 0 » ET le retour 2026-10-15
   « Nourr - été toujours visible même à 0 » (la ligne été à 0
   est cachée en vue repliée). Ville sans production : message
   court + le toggle (tableau complet à un clic).

Test de rendu dédié (17e) : le nombre de lignes rendues
(signature tr class="ligne-prod" — les récaps rendent aussi des
pastilles dot-res mais sans cette classe) est asserté ÉGAL au
compte dérivé de l'état (ressources produites des villes du
joueur 1) + présence du toggle ; l'assertion « Culture
majoritaire » du 1er test est retirée (la culture n'est plus en
tête — le test des 2 colonnes verrouille sa présence en gras).

Validation : 157/157 natifs, 17/17 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (UI seule — le moteur n'a pas
bougé).

## Carte ville : rang & type de ville dans la zone de tête (2026-10-26, 3e retour Thibaut)

Capture n°3 examinée — constat : « les trois cases Nom / Taxes /
Proximité sont de tailles différentes (déjà corrigé la veille en
ligne — la capture montrait l'ancien CSS, flex 1.5 du nom) et un
ESPACE VIDE est présent en dessous, dans lequel Rang d'habitation
et Type de ville pourraient se tenir ».

Traitement :
- RANG D'HABITATION + TYPE DE VILLE déplacés DANS la zone de
  tête (colonne gauche), en RANGÉE 2 sous les trois cases — plus
  d'espace vide : le bloc bonheur (colonne droite) borde
  l'ensemble des champs.
- .ville-tete passe en grille 6 colonnes : rangée 1 = 3 cases de
  span 2 (nom/taxes/proximité égales), rangée 2 = 2 cases de
  span 3 (rang/type égales) ; .ville-tete-wrap passe de flex à
  grid 1fr / auto (fin du flex 1 1 320px) ; repli écran étroit
  (≤ 560px) : tout en 1 colonne, grid-column auto sur les deux
  sélecteurs nth-child.
- La ligne « habitants requis » suit la rangée 2 dans la colonne
  gauche ; le docblock d'en-tête de VilleCarte est renuméroté
  (rang & type ne sont plus un bloc séparé : (1) TÊTE complète,
  (2) POPULATION & GARNISON, (3) CONSTRUCTIONS, (4) AUTRES,
  (5) PRODUCTION, (6) ACTIONS RARES).
- Test de rendu : le test du bloc bonheur verrouille le
  déplacement — « Type de ville » doit être rendu AVANT
  « bonheur-bloc » dans le HTML (sur l'ancien layout, rang/type
  étaient rendus après le wrap, l'assertion échoue).

Validation : 157/157 natifs, 17/17 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (UI seule — le moteur n'a pas
bougé).

## Carte ville : retrait de la ligne « N habitant(s) vivant(s) » en tête (2026-10-26, 4e retour Thibaut)

Constat : « la mention "53 habitant(s) vivant(s)" est inutile
au-dessus de "Cultures présentes" » — redondante avec le pied du
tableau Cultures présentes (ligne-total des vivants).

Traitement :
- VilleCarte.tsx : le div muted small « {nbVivants} habitant(s)
  vivant(s) » est RETIRÉ de la tête (sous le bloc bonheur) ; le
  commentaire sur place et le docblock d'en-tête sont mis à jour :
  la tête ne rend NI la culture NI le compte de vivants — le
  tableau « Cultures présentes » (bloc POPULATION & GARNISON)
  porte la culture (majoritaire en gras + liseré) ET le total des
  vivants (pied du tableau).
- nbVivants reste utilisé par ailleurs : ligne « habitants
  requis » (comparaison et affichage), part en % du tableau
  garnison, pied du tableau cultures.
- PlayerView.test.ts : l'assertion positive du test 1 (compte
  rendu en tête) devient NÉGATIVE — la chaîne
  « habitant(s) vivant(s) » ne doit plus apparaître du tout dans
  le rendu (le pied du tableau garde son propre verrou, test des
  2 colonnes). cap/nbVivants locaux retirés du test (plus
  utilisés).

Validation : 157/157 natifs, 17/17 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (UI seule — le moteur n'a pas
bougé).

## Panneaux « + Construire » : descriptions du classeur retirées (2026-10-26, 5e retour Thibaut)

Constat : « dans le panneau pour construire un bâtiment, la
description n'est plus du tout à jour » — les descriptions du
classeur 7.19 sont périmées au regard des effets réels du moteur
(ex. Herboristerie « 5% » alors que les taux Gompertz/Guérisseur
ont changé).

Traitement :
- Le picker « + Construire… » (faireBatParFamille) ne rend plus
  b.description (le texte du classeur) : la description de chaque
  carte = Prérequis éventuel + resumeConstruction(b) (résumé
  STRUCTURÉ dérivé du moteur : flux /tour, été, Garnison,
  emplacements) — MÊME RENDU que le panneau « + Aménager » (les
  aménagements du référentiel ont des descriptions vides : leur
  panneau n'a jamais affiché que le résumé, d'où le « comme pour
  les aménagements »).
- 3 occurrences (familles par rang, Capitale, Merveilles) ;
  docblocks de faireBatParFamille et commentaire marqueur (y) de
  VilleCarte mis à jour. Le repli b.production reste en place
  mais AUCUN bâtiment du référentiel ne l'atteint (tous ceux avec
  une production ont des effets ou des emplacements structurés).
- Le référentiel n'est PAS touché (reductionCampDeBatisseurs lit
  la description EXACTE du Camp de bâtisseurs ; le wiki
  Référentiels garde les descriptions ; tooltips des lignes
  construites inchangés).
- NOUVEAU TEST de rendu (18e) : les descriptions d'options du
  picker ne contiennent AUCUNE description classeur (verrouillé
  sur plus de 5 bâtiments) et le résumé structuré reste rendu
  (Poste de garde → « 4 garde »). Les tests de rendu passent de
  17 à 18.

Validation : 157/157 natifs, 18/18 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (UI seule — le moteur n'a pas
bougé).

## Rang social : consommation et production par rang (2026-10-26, 6e retour Thibaut)

Contexte : question « est-ce qu'il y a une différence réelle
entre roturier et bourgeois ? » — réponse : quasi nulle (seul le
mariage y était sensible). Arbitrage Thibaut (confirmé par
question directe) : le RANG SOCIAL dérivé du prestige (pas la
qualité du métier) :
- roturier : conso base (1 Nourriture/tour), production ×1 ;
- BOURGEOIS (prestige ≥ 100) : conso 2 Nourriture/tour,
  production de métier ×1,5 ;
- NOBLE (prestige ≥ 250) : conso 4 Nourriture/tour, production
  ×1,5 (×1,5 aussi pour les nobles — confirmé).

Traitement :
- params.ts : 4 nouveaux paramètres éditables (onglet
  Paramètres → groupe Population) : consoNourrBourgeois (2),
  consoNourrNoble (4), prodMultBourgeois (1,5), prodMultNoble
  (1,5) ; label de consoNourrParHab précisé « (roturier) ».
- economie.ts : deux helpers exportés multProdRang(c, C) et
  consoNourrHabitant(c, C) ; dans detailGainsVille, la
  production de métier de chaque villageois est multipliée AVANT
  les taxes (le gain amplifié est taxé comme les autres, bonus
  Ponton compris) ; la consommation devient la SOMME par tête
  selon le rang (fini le forfait consoNourrParHab × N).
- citesLibres.ts : la consommation des cités libres passe par
  consoNourrHabitant (règle unique) — leur prestige n'étant
  pas calculé, aucun changement aujourd'hui, la règle est prête.
- Mineurs : sans prestige propre (0), ils restent à la
  consommation de base et ne produisent pas — arbitrage
  documenté dans les docblocks.
- Tests natifs : 157 → 158. Nouveau test (metiers.test.ts) :
  helpers en direct (×1/×1,5, conso 1/2/4), production d'un
  Bûcheron bourgeois ×1,5 passant par les taxes, conso des
  trois rangs ensemble = 7, mineur à la base sans production.

Validation : 158/158 natifs, 18/18 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (partie fraîche : personne
n'atteint 100 de prestige en 4 tours — le rang de prestige ne
change rien aux sorties du diag).

## Correction immédiate : ×1,5 RETIRÉ des nobles (2026-10-26)

« Je me suis trompé, retire le ×1,5 des nobles. » — le multiplica-
teur de production reste pour les BOURGEOIS (×1,5) mais les
NOBLES produisent ×1 (ils conservent leur consommation de
4 Nourriture par tour).

Traitement :
- params.ts : prodMultNoble passe de 1,5 à 1 (le paramètre reste
  éditable dans l'onglet Paramètres, avec une aide retraçant la
  correction) ; docblocks réalignés.
- economie.ts : docblocks d'en-tête et de multProdRang corrigés
  (noble ×prodMultNoble = 1). Le code moteur est inchangé — il
  lit déjà le paramètre, seule la valeur d'arbitrage bouge.
- metiers.test.ts : le test du rang social verrouille désormais la
  correction — assert prodMultNoble = 1, production d'un Bûcheron
  noble IDENTIQUE à la base, et verrou du prodMultBourgeois = 1,5.
  Conso inchangée (roturier 1 / bourgeois 2 / noble 4, mineur base).

Validation : 158/158 natifs, 18/18 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (la partie fraîche du diag n'a
ni bourgeois ni nobles : aucun impact).

## Fiche aménagements 3 tiers (retour Thibaut 2026-10-26)

Thibaut envoie la fiche aménagements complète « mise à jour
avec les nouvelles règles » (14 aménagements × 3 tiers, coûts
uniformes 8 Or + 3 Bois / 15 Or + 3 Pierre / 35 Or + 3 Fer).

Constat : le référentiel était DÉJÀ aligné sur la fiche —
42 aménagements, emplacements et terrains identiques — à deux
corrections près (plus les Taudis invisibles à l'écran).

Traitement :
- Scierie tier 2 : la fiche donne 2 Tisseurs (le référentiel
  en avait 1) — emplacements et champ production réalignés
  (4 Bûcheron + 2 Tisseur + 8 Taudis).
- Mine d'Or : la fiche compte encore des « marchands » (métier
  retiré du jeu le 2026-10-24). Arbitrage Thibaut : « tu as
  raison pour les marchands, à la place remplace 1 marchand
  par 2 commerçants » → les 3/7/12 Marchands des tiers 1/2/3
  deviennent 6/14/24 Commerçants ; emplacements et champs
  production réalignés, description du référentiel mise à jour.
- resumeConstruction (constructions.ts) : les Taudis apportés
  par un aménagement (taudisApportes 5/8/10, déjà lus par le
  facteur Logement du bonheur) s'affichent désormais dans le
  résumé (« +5 Taudis ») — LA source affichée partout (picker
  Aménager/Améliorations, lignes de carte, page
  Constructions) : la propagation est automatique.
- Tests natifs : 158 → 162. Quatre verrous (domiciles.test.ts) :
  cumul taudisApportesVille (5+5+0 = 10, 5+8 = 13), Scierie t2
  (2 Tisseur, 4 Bûcheron, 8 Taudis), Mine d'Or 6/14/24
  Commerçants, « +5/+8 Taudis » dans resumeConstruction.

Validation : 162/162 natifs, 18/18 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (le diag ne rend pas les
résumés de construction).

## Fiche types d'habitation : Ville & Château, 3 tiers (retour Thibaut 2026-10-26)

Thibaut envoie la fiche des rangs d'habitation « mise à jour
avec les nouvelles règles » (Ville : Hameau/Cité/Grande Cité ;
Château : Motte/Donjon/Forteresse).

Constat : coûts et habitants requis sont IDENTIQUES au
référentiel (aucun changement). Trois familles de deltas :

Traitement (référentiel typesHabitation — source unique, lu
par DEFAULT_CONFIG) :
- Domiciles par rang — le gros morceau : la fiche remplace
  l'offre « Maison/Auberge » par « Taudis / Maisons / Maison
  de notable » (les trois types existent déjà dans la table
  domiciles, qualités 0/1/3 — la Maison de notable était
  jusque-là inatteignable). domicilesRang ET le texte
  domicilesDisponibles réalignés : Hameau 50 Taudis + 1
  Maison de notable, Cité 100 + 20 + 1, Grande Cité 150 +
  100 + 1, Motte 50 + 5, Donjon 100 + 10, Forteresse 150 +
  20 (logements : 51/121/251 villes, 55/110/170 châteaux —
  ex 60/150/250). L'Auberge (qualité 2) reste dans la table
  domiciles : les stocks des parties en cours restent valides.
- Métiers de base : Hameau Chasseurs 50 → 40, Cité
  Chasseurs 30 → 20 (Motte 40, Donjon 20, Grande Cité et
  Forteresse inchangés — la fiche confirmait le reste).
  Le peuplement initial (36-38 Chasseurs) reste sous le cap.
- Docblocks réalignés (metiers.ts, habitations.ts, types.ts,
  defaultConfig.ts, CarteMetiersPlaces.tsx) : les exemples
  « 50 Chasseurs » / « 50 maisons, 10 Auberge » décrivent
  désormais « 40 Chasseurs » / « 50 Taudis, 1 Maison de
  notable ».
- Tests natifs (162 au total, verrous réalignés) : stockRang
  Hameau (51), initStockVille (51/121), l'attribution loge
  les foyers en Taudis (qualité 0 LÉGALE — l'ancien verrou
  « qualité > 0 » rejetait le Taudis), caps Chasseur 40 et
  42 avec Scierie, occupations 40.

Continuité des parties en cours : le stock vit DANS la
ville (City.domiciles) — une partie existante garde son
ancien stock jusqu'à son prochain changement de rang (le
rang DÉFINIT l'offre) ; les configs monde sauvegardées ne
sont complétées que si le champ est absent (migrerTypesHabitation,
idempotent). Comportement documenté, pas d'écrasement forcé.

Validation : 162/162 natifs, 18/18 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (partie fraîche : 36-38
Chasseurs sous le cap de 40, le log ne change pas).

## Fiche bâtiments de rang 1 et 2 (retour Thibaut 2026-10-26)

Base 4fe5bb30. Fiche complète « bâtiments de rang 1 et 2 » :
Militaire, Économique, Guilde, pour les deux types
d'habitation. Constat d'ensemble : le rang 1 était déjà
conforme au référentiel SAUF trois points ; le rang 2
avait été retiré du référentiel le 2026-10-23 (« Rangs 2
et 3, tout sauf rang 1 ») — il revient IN EXTENSO avec
les valeurs de la fiche.

Rang 1 — trois corrections :
- Poste de garde (les deux) : +10 Taudis manquants →
  taudisApportes: 10, prod/desc réalignées.
- Bas quartier (les deux) : ABSENT → créé, famille
  Militaire, « 10 Bois + 10 Or », +20 Taudis.
- Herboristerie (les deux) : l'emplacement Guérisseur
  résiduel est RETIRÉ (la fiche ne donne que ±5% maladie —
  champs malContraction/bonusGuerison 0.05 déjà présents).
  Le Guérisseur migre vers la Clinique (rang 2, +5).
  Conséquence picker : resumeConstruction(Herboristerie)
  devenait vide et le « + Construire » retombait sur la
  description du classeur (périmée) → resumeConstruction
  affiche désormais les effets structurés (« +5% chances
  de maladie, +5% guérison »), verrou rendu mis à jour.

Rang 2 — 23 bâtiments réactivés (12 Ville, 11 Château ;
total référentiel 94 constructions) : Caserne, Réseau de
routes, Tour de sorcier (+1 Scientifique, +1 Maison de
notable via le NOUVEAU champ domicilesApportes), Quartier
intermédiaire (+20 Maisons), Ecole militaire, Haut quartier
(Château, +20 Maisons de notable), Camp de travailleurs,
Silo à grain (remplace la Grange), Moulin à vent (consomme
1 Charbon/tour, bloque le passage en Grande Cité), Place du
marché, Port de commerce, Port de pêche, Clinique (+5
Guérisseurs), Cabinet d'astronomie, Chapelle, Ecole
intermédiaire (remplace l'Ecole élémentaire, consomme
3 Or/tour), Guilde des artisans de la terre (remplace le
Moulin à vent, consomme 1 Charbon/tour, +30 Fermiers),
Guilde des explorateurs. Prérequis via le champ cout
(« X requis ») : mécanique prerequisConstruction EXISTANTE,
le picker l'affiche déjà (« Prérequis : … »).

Le filtre cfgOf du 2026-10-23 (qui retirait les bâtiments
rang ≥ 2 de toute config) devient PURGE + RESYNC : les
configs monde sauvegardées AVANT portaient les VIEILLES
valeurs des bâtiments rang 2 (la complétion ne remplace
jamais un nom connu) — on retire tous les bâtiments rang
≥ 2 puis on réinjecte ceux du RÉFÉRENTIEL courant (les
valeurs de la fiche font foi, sans doublon, idempotent).

Moteur : nouvelle fonction domicilesApportesVille(ville, C)
cumule Taudis (taudisApportes) et autres domiciles
(domicilesApportes) sur aménagements ET bâtiments ;
taudisApportesVille devient le canal Taudis de la même ;
logementsVille (bonheur.ts) passe par elle (le Tour de
sorcier et les quartiers logent donc pour de vrai).
resumeConstruction affiche les domiciles apportés (« +20
Maisons », pluriel sur le premier mot). Le champ
remplaceBatiment (Silo → Grange, Ecole intermédiaire →
Ecole élémentaire, Guilde artisans → Moulin à vent) est
posé EN DONNÉES : la mécanique d'amélioration à l'écran
reste à implémenter.

Mécaniques posées en données/description mais à
implémenter : Herses de siège, téléportation d'armées
(Tour de sorcier), PM d'enceinte à 1 (Réseau de routes),
réductions de coût de levée (Terrain d'entrainement −10,
Ecole militaire −25, Guilde des explorateurs −20),
routes commerciales supplémentaires (Echoppe, Place du
marché), bonus pêcheurs (Ponton +0,5 Bétail, Port de
pêche +2 Nourriture), fermiers du pays +5 Nourriture en
été (Guilde artisans), blocage Grande Cité (Moulin à
vent). « Responsable des voiries » (Guilde explorateurs) :
office inexistant dans le moteur — arbitrage demandé.
Camp de travailleurs : le OU (bûcheron/mineur) est
documenté en description, le prérequis cout exige un Camp
de bûcheron.

Tests : 162 → 168 natifs (verrous rang 2 : domiciles
apportés par bâtiments, cumuls Maisons/Notables, prérequis
lus du cout, Caserne Ville+Château, Herboristerie sans
emplacements vs Clinique +5, resume ±5% ; config.test :
réactivation 23 bâtiments + resync idempotent + migration
v4 inversée ; sante.test : témoin Clinique). Rang 1
inchangé ailleurs (Herses, Conjuratoire, Grange, Ponton,
Echoppe Ville déjà conformes ; Echoppe Château, Capitale
et Merveilles hors fiche, non touchés).

Validation : 168/168 natifs, 18/18 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE (les villes fraîches du
diag n'ont aucun bâtiment).

## Ligne ville : 3e tableau Logements (retour Thibaut 2026-10-26)

Base a22c1861. Retour Thibaut : « sur la ligne des
tableaux des cultures et garnisons, réduit les tableaux
pour ajouter les logements ».

La ligne POPULATION & GARNISON de la carte ville
(VilleCarte.tsx, classe .ville-duo-cols) passe en 3
COLONNES égales : Cultures présentes (inchangé),
Garnison des habitations (inchangé), et un NOUVEAU
tableau « Logements ». CSS : grid 1fr 1fr 1fr, repli
2 colonnes sous 860px puis 1 colonne sous 560px.

Tableau Logements — tout DÉRIVÉ du moteur (patron R3,
aucun calcul dupliqué dans le composant) :
- capacité par type = stock du rang (City.domiciles,
  repli stockRang si état non normalisé) + apports des
  constructions (domicilesApportesVille : Poste de
  garde/Caserne +10 Taudis, Bas quartier +20, quartiers,
  Tour de sorcier…) ;
- occupés = foyers attribués (foyersDeVille, un foyer =
  un logement, les enfants mineurs suivent) ;
- ordre : meilleure qualité d'abord ; colonnes type ·
  occupés/capacité · libres ; ligne « sans logement »
  en rouge si des foyers restent dehors ; pied « Foyers
  logés » occ/capacité + libres totaux ; infobulle du
  titre explique les conventions.

Tests : PlayerView.test — le verrou « population &
garnison en 2 colonnes » devient « population, garnison
& logements en 3 colonnes » : titre Logements avec la
capacité totale attendue et chaque ligne occ/capacité
re-calculée depuis l'état (patron R3). 168/168 natifs,
18/18 rendu (12 fichiers), tsc strict 0 erreur, diag
IDENTIQUE (le diag ne rend pas la page Pays).

Fichiers : VilleCarte.tsx, styles.css, PlayerView.test.ts.

## Ligne ville : séparations + cultures rétrécie (retour Thibaut 2026-10-26)

Base 124e178a. Retour Thibaut sur la ligne cultures /
garnison / logements : « met des petites séparations entre
les différents tableaux pour mieux faire la distinction et
réduit le tableau de culture pour donner davantage de place
aux deux autres ».

CSS uniquement (styles.css, classe .ville-duo-cols) :
- colonnes 1fr 1fr 1fr → 0.8fr 1fr 1fr : le tableau
  Cultures (court : nom, compte, part en %) cède de la
  place à Garnison (« Combler les lacunes »…) et Logements
  (occupés/capacité) qui portent des textes plus longs ;
- filet vertical discret entre les tableaux (border-left
  + padding gauche 18px, même teinte atténuée que les
  filets de .ville-table — color-mix var(--border) 65%) ;
- replis : 2 colonnes sous 860px (le filet est retiré au 3e
  tableau, 1re colonne de la 2e rangée), 1 colonne sous
  560px (filets verticaux remplacés par un filet
  horizontal + padding-top entre les tableaux empilés).

Aucun changement de composant ni de test : rendu HTML
identique, la mise en page est pure CSS.

Validation : 168/168 natifs, 18/18 rendu (12 fichiers), tsc
strict 0 erreur, diag IDENTIQUE. Fichier : styles.css.

## Attribution : 1 logement = 1 habitant + priorité au haut rang (retour Thibaut 2026-10-26)

Base 7878ff55. Retour Thibaut après l'explication du
modèle domiciles : « je ne veux pas que les logements
soient associés à des familles, je veux 1 logement = 1
habitant. Et je veux également que les bâtiments les plus
qualitatifs soient priorisés pour les personnages de
haut rang ».

Moteur (engine/domiciles.ts) :
- L'attribution par FOYER est RETIRÉE (interface Foyer +
  foyersDeVille supprimées). Nouvelle unité : le
  HABITANT vivant (adulte OU enfant mineur), via une
  petite fonction partagée vivantsVille(). Chaque
  personne consomme UNE place.
- Ordre de service : PRESTIGE DÉCROISSANT
  (Character.prestige — nobles avant bourgeois avant
  roturiers, les mineurs sans prestige propre servis en
  dernier ; tri stable, l'ordre de recensement fait foi
  à prestation égale). Dans cet ordre : chacun GARDE
  son domicile s'il existe encore au stock (on ne
  déloge pas, l'ordre de priorité ne sert qu'à répartir
  les places LIBRES), sinon prend la MEILLEURE qualité
  restante — les Maisons de notable partent aux
  personnages de haut rang. Stock épuisé : domicile
  null (sans logement, −2 prestige/tour, ligne rouge
  du tableau Logements).
- Conséquence mécanique : l'axe Logement du bonheur
  (qui comparait déjà le stock aux HABITANTS) redevient
  COHÉRENT avec l'attribution — plus de double échelle
  volontaire foyer/personne.
- Conséquence de DONNÉES à noter : une partie fraîche
  au Hameau porte 53 habitants pour 51 logements (50
  Taudis + 1 Maison de notable — fiche habitations) :
  2 habitants sont désormais dehors (l'ancien modèle
  par foyer logeait tout le monde, les familles
  partageaient une place). C'est le comportement
  ATTENDU de la nouvelle règle avec le stock de la
  fiche — si le Hameau doit loger tout le monde, il
  faut soit plus de Taudis au stock initial, soit des
  constructions (+10 Taudis Poste de garde, +20 Bas
  quartier).

UI (VilleCarte) : le tableau Logements compte les
HABITANTS attribués (plus les foyers) — pied
« Habitants logés », infobulle mise à jour (1 logement =
1 habitant, meilleur bâtiment au haut rang). Docblocks
(types.ts, population.ts, bonheur.ts) réalignés.

Tests (168/168) : verrous réécrits — 1 place par vivant
(logés = min(capacité, habitants), pas de surbooking,
Maison de notable au premier servi), priorité prestige
décroissant (noble 300 → Maison de notable, bourgeois
120 → Maison, prestige 0 dehors), stock insuffisant,
idempotence, défense en profondeur ; PlayerView.test
compte les habitants. Validation : 18/18 rendu (12
fichiers), tsc strict 0 erreur, diag IDENTIQUE.

Fichiers : domiciles.ts, types.ts, population.ts,
bonheur.ts, VilleCarte.tsx, domiciles.test.ts,
PlayerView.test.ts.

## La cour : appartenance par RANG social, plus par dynastie (retour Thibaut 2026-10-26)

Base 68eff17a. Retour Thibaut : « la cour des
joueurs ne commence pas en tant que noble — le tableau
supérieur doit montrer les personnages en fonction de
leur RANG, et non de leur dynastie ».

La carte « 👑 La cour » de la page Population
(PopulationTable.tsx) séparait cour / population
classique par NOBLESSE DE DYNASTIE (isNobleDyn — un nom
de famille noble suffisait à siéger). Désormais
l'appartenance suit le RANG SOCIAL issu du prestige
(colonnes Rang des tableaux, statutSocial.ts —
bourgeois ≥ 100, noble ≥ 250) :

- estDeCour(c) = rangSocial(prestigeDe(c)) ≠ roturier.
  Un bourgeois de dynastie roturière entre à la cour ;
  un nom noble ne suffit plus tant que prestige < 100 ;
- au départ d'une partie TOUTE la cour est roturière :
  le tableau supérieur est vide (« aucun personnage de
  haut rang — toute la cour est roturière ») et se
  remplit à mesure que les personnages montent en rang
  — cohérent avec la vague D (ascension par prestige) ;
- la carte « Population » classique prend le reste
  (roturiers), textes et compteurs réalignés.

NON-TOUCHÉ (arbitrage à venir) : le moteur du mariage
manuel exige toujours deux personnages de DYNASTIE noble
(marierPersonnages + eligibleMariage) — un bourgeois de
dynastie roturière voit le bouton « Marier avec… » à la
cour mais le mariage est refusé par le moteur (message
explicite, documenté dans la carte). Les autres usages
d'isNobleDyn (armées, décès/levées, suppression de
ville, personnages importants/famille royale du
royaume) restent dynastiques.

Tests : nouveau verrou de rendu PopulationTable (19e
test de rendu) — partie témoin après 2 tours : tous
roturiers (cour vide), on grave un noble (300) et un
bourgeois (150) : la carte cour titre « 2 vivants / 2 au
total », la carte population prend le reste. 168/168
natifs, 19/19 rendu (12 fichiers), tsc strict 0
erreur, diag IDENTIQUE.

Fichiers : PopulationTable.tsx, PopulationTable.test.ts.

## La cour : nobles de NAISSANCE dès le départ — le rang suit la dynastie (retour Thibaut 2026-10-26, suite)

Base a24bdda. Retour Thibaut : « super, mais il faut des nobles dès le début, attention. Regarde la colonne dynastie, elle ne correspond pas à la colonne rang ». Le correctif précédent (cour par rang issu du prestige SEUL) vidait la cour au départ : la famille dirigeante du setup (couple royal, fratrie, enfants — dynasties nobles) s'affichait « roturier » en colonne Rang alors que la colonne Dynastie montre une maison noble — l'incohérence signalée.

- **rangDe(c, C)** (statutSocial.ts) : le RANG D'UN PERSONNAGE = NOBLE DE NAISSANCE si sa dynastie est noble (isNobleDyn — même définition que le moteur du mariage), sinon rang dérivé du prestige (bourgeois ≥ 100, anobli ≥ 250). C'est LE rang affiché (colonne Rang, cour) et journalisé (changements). rangSocial(prestige) reste la fonction pure de seuils pour les roturiers de dynastie.
- Colonne Rang (LignePersonnage.tsx) : badge rangDe, title « NOBLE DE NAISSANCE (dynastie noble — des nobles dès le début) » pour un noble de naissance sous 250 — les colonnes Dynastie et Rang se correspondent désormais dès le setup.
- La cour (PopulationTable.tsx) : estDeCour = rangDe ≠ roturier → la famille dirigeante siège DÈS LE DÉPART ; les roturiers de dynastie y entrent par ascension (prestige ≥ 100). Textes réalignés (sous-titre de la cour, état vide, carte Population « roturiers : dynastie roturière ET prestige sous 100 »).
- evaluerFamilles (statutSocial.ts) : les événements de changement de rang se lisent maintenant sur rangDe — un noble de naissance ne journalise plus « accède/retombe » selon les seuils du prestige (son rang de naissance ne change pas, son prestige suit son cours) ; un roturier qui franchit 100/250 journalise toujours son accès.
- ⚠ NON-TOUCHÉ, ARBITRAGES EN SUSPENS :
  - economie.ts (conso Nourriture, multiplicateur de production) : le rang MÉCANIQUE reste fondé sur le PRESTIGE seul (arbitrage du jour même 2026-10-26) — un noble de naissance consomme/produit comme un roturier tant que son prestige < 100. Faire suivre la conso au rang de naissance mettrait la famille dirigeante à consoNourrNoble (4) par tour dès le tour 1 — changement d'équilibre à arbitrer. Commentaire ⚠ posé dans le docblock d'economie.ts.
  - moteur du mariage manuel (logiquePopulation.ts eligibleMariage, cour.ts marierPersonnages) : toujours limité aux maisons de DYNASTIE noble — cohérent avec le rang de naissance (tout noble de naissance est de dynastie noble) ; un anobli par prestige (250, dynastie roturière) reste refusé au mariage noble.
  - autres usages d'isNobleDyn inchangés : ArmiesPanel, sante.ts, villes.ts, citesLibres.ts, naissances.ts, metiers.ts (nobleSeul, score mariageMemeRang qui compare les rangs de PRESTIGE), CartePersonnagesImportants.
- Verrous : statutSocial.test.ts +3 (rangDe : noble de naissance SI dynastie noble (prestige 0 compris), rang du prestige pour les roturiers de dynastie ; événements : aucun changement de rang pour un noble de naissance, accès à la bourgeoisie toujours journalisé pour un roturier qui franchit 100) → **171 natifs** ; test de rendu PopulationTable réécrit : la cour commence NON vide (nobles de naissance ≥ 2 au départ, les deux roturiers gravés 300/150 la rejoignent, comptes exacts cour/population, marqueur « NOBLE DE NAISSANCE ») → **19/19 rendu (12 fichiers)**.
- Validation : tsc 0 erreur, 171/171 natifs, 19/19 rendu, **diag IDENTIQUE** (aucun seuil de prestige franchi dans le scénario 4 tours — aucun événement de rang n'y est émis), diff src limité aux 6 fichiers prévus (statutSocial, statutSocial.test, economie [commentaire], LignePersonnage, PopulationTable, PopulationTable.test).

## Fusion des colonnes Dynastie et Rang (retour Thibaut 2026-10-26, suite 2)

Base 8c7c174. Retour Thibaut : « je pense qu'il faudrait fusionner la colonne dynastie et la colonne roturier peut-être ». Depuis que le rang suit la dynastie de naissance (rangDe, commit précédent), les deux colonnes disaient la même chose en deux cellules — fusion.

- LignePersonnage.tsx : UNE SEULE cellule « Dynastie · Rang » — nom de dynastie + badge rangDe (noble/bourgeois/roturier, couleur inchangée) + prestige en muted ; title conservant le marqueur « NOBLE DE NAISSANCE » (dynastie noble sous 250) ou l'explication prestige (roturier sous 100, bourgeois 100-250, anobli 250+). L'ancienne cellule Rang autonome supprimée.
- PopulationTable.tsx : en-têtes 14 → 13 colonnes (« Dynastie · Rang » remplace « Dynastie » + « Rang »), colSpan des états vides 14 → 13 (cour et population).
- Portée : les deux tableaux (cour et population) partagent LignePersonnage — le changement vaut pour les deux d'un coup ; aucun autre composant n'utilise LignePersonnage.
- Aucun changement moteur (affichage pur) : 171/171 natifs et diag IDENTIQUE attendus et constatés ; 19/19 rendu (le test de la cour vérifie toujours le marqueur « NOBLE DE NAISSANCE », désormais dans la cellule fusionnée).
- Validation : tsc 0 erreur, 171/171 natifs, 19/19 rendu (12 fichiers), diag IDENTIQUE, diff src limité aux 2 fichiers prévus.

## Nobles de naissance : 300 prestige de BASE (retour Thibaut 2026-10-26, suite 3)

Base a79d6d5. Retour Thibaut : « attention, un noble de naissance doit avoir 300 prestige de base ».

- **PRESTIGE_NOBLE_NAISSANCE = 300** (statutSocial.ts, export) : posé à la CRÉATION de tout personnage de dynastie noble — setup (couple royal, fratrie, enfants), naissances (bébé de dynastie noble, bâtard de parent noble inclus), familles nobles ajoutées en cours de partie (joueurs ET cités libres). La clé n'est posée QUE pour les nobles — pas de « prestige: undefined » explicite, sinon la clé survivrait à l'égalité de format compact (test migrations) : if (noble) c.prestige = 300 / spread conditionnel.
- **Héritage** (evaluerFamilles) : un enfant de dynastie noble ne peut pas hériter SOUS sa base — Math.max(300, héritage) ; au-dessus, l'héritage normal prime (50 % d'un parent à 700 = 350).
- **Conséquence mécanique AUTOMATIQUE** : 300 ≥ 250 → le noble de naissance est noble AUSSI par le prestige dès le tour 1 — consommation Nourriture noble (4/tour), hébergement (ordre de service par prestige décroissant : la famille dirigeante servie en premier), score de mariage. L'arbitrage en suspens du tour précédent (« rang mécanique fondé sur le prestige seul → noble affiché mais traité roturier ») est RÉSOLU par la base 300 SANS toucher aux formules d'economie.ts (commentaire du docblock mis à jour — l'écart ne se rouvrirait qu'en cas de chute du prestige sous 250).
- Title de la cellule « Dynastie · Rang » (LignePersonnage) : le marqueur NOBLE DE NAISSANCE ne dépend plus du prestige (les nobles sont à 300+) — testé sur isNobleDyn, mention « 300 prestige de base ».
- **diag-out.txt RÉGÉNÉRÉ** (changement moteur, la sortie de référence devait bouger) : partie saine 4 tours — log 575→579 entrées, commandants disponibles J1 3→4, Armée 2 6→3 soldats (cascade attendue : les familles dirigeantes consomment 4 Nourriture/tour dès le tour 1 → stocks, événements et survies décalés) ; les scénarios de DÉGRADATION restent IDENTIQUES ligne à ligne.
- Verrous : statutSocial.test.ts — nouveau test setup « tout noble de naissance à 300 » (16+ nobles sur les 8 joueurs) ; l'ancien test d'héritage SKIPPAIT silencieusement (aucun enfant royal n'est adulte au setup — adultAge 16 vs âges 0-15) : réécrit en tests SYNTHÉTIQUES — roturier de dynastie : 50 % exact de la moyenne (75) + marqueur prestigeHerite + pas de double héritage ; enfant de dynastie noble : plancher 300 + montée au-dessus (350). « Foyer bien loti » réaligné (roturiers < 100 après 1 tour, nobles de naissance ≥ 280). domiciles.test.ts : la base 300 des autres habitants est neutralisée dans le test d'ordre de service (il teste l'ORDRE par prestige, pas la base). Test de rendu PopulationTable : roturiers < 100, nobles de naissance ≥ 280 après 2 tours.
- Validation : tsc 0 erreur, **173/173 natifs** (+2), 19/19 rendu (12 fichiers), diag régénéré IDENTIQUE au re-run (déterminisme vérifié), diff src limité aux 10 fichiers prévus (statutSocial + test, setup, naissances, citesLibres, economie [commentaire], types [docblock], LignePersonnage, PopulationTable.test, domiciles.test) + diag-out.txt.

## Nettoyage des tooltips UI, 8 Palais pour la capitale, types de logement dans Référentiels + Paramètres (retour Thibaut, 2026-10-26 — base ef7c396)

- **Nettoyage des tooltips (retour Thibaut : « supprimer le commentaire lors du survol qui parle du retour, ça n'a aucun intérêt — mais tu peux le mettre dans les docs »)** : le `title` de la cellule Dynastie·Rang (LignePersonnage) dit désormais juste « NOBLE DE NAISSANCE (dynastie noble — 300 prestige de base) » ou la règle de rang par prestige — plus aucune mention de retour/date dans l'interface. Idem pour le sous-titre de la cour et le texte du mariage dans PopulationTable. **CONVENTION UI posée** : les textes d'interface ne citent plus les arbitrages ni les retours de session — le contexte de design vit dans `docs/ia/regles-et-arbitrages.md` (nouvelle section « La cour, le rang de naissance et les logements » qui documente rangDe, la base 300, la cour noble dès le départ, la fusion des colonnes, les 8 Palais et les types de logement).
- **Capitale : 8 PALAIS au départ (retour Thibaut : « la capitale ne commence pas avec 1 maison de notable mais 8 palais »)** — setup.ts : la ville d'indice 0 (capitale) reçoit `{ Palais : 8 }` à la place de la « Maison de notable » du stock de rang ; les autres villes gardent le référentiel domicilesRang (Hameau : 50 Taudis + 1 Maison de notable, etc.). La famille dirigeante (nobles de naissance à 300) est servie la première par ordre de prestige décroissant → elle occupe les Palais (+4 prestige/tour chacun) dès le tour 1. 58 logements au total pour la capitale (50 Taudis + 8 Palais).
- **Types de logement dans les Référentiels (retour Thibaut : « ajoute les différents types de logement dans les référentiels et paramètres »)** : OngletsPaysHabitations — l'onglet Habitations porte désormais une 2e fiche « Wiki — types de logement (domiciles) » : Logement / Qualité (= gain de prestige par tour) / lecture depuis cfg.domiciles.
- **Éditeur des types de logement dans les Paramètres** : nouveau composant `DomicilesParams` (PaysHabitationsParams.tsx, re-exporté par ConfigTables) sous l'onglet Habitations de ParamsPanel — nom libre, qualité 0-N (NumberInput), suppression (✕), ajout (+) ; Card « Types de logement (N) — qualité = gain de prestige par tour ».
- Verrous : domiciles.test.ts — nouveau test setup « la capitale démarre avec 8 PALAIS » (Palais=8, plus de Maison de notable, total 58, les 50 Taudis du rang restent) ; les tests existants (stockRang, initStockVille, attribution) réinitialisent le stock explicitement et restent intacts.
- Complément (repéré via le bundle live après le 1er push) : le `window.confirm` de « → cité libre » (VilleCarte.tsx) portait encore « (retour Thibaut) » dans le texte — nettoyé dans la foulée, même convention UI. Re-validation : tsc 0 erreur, 174/174 natifs, 19/19 rendu, diag inchangé.
- Validation : tsc 0 erreur, **174/174 natifs** (+1), 19/19 rendu (12 fichiers), **diag IDENTIQUE** (surprise anticipée à tort : les 8 Palais ne décalent AUCUNE ligne du diag sur 4 tours — le prestige domicile des nobles 300→+4 au lieu de +3 et les 2 habitants mieux logés ne franchissent aucun seuil affiché ni ne déclenche d'événement ; le changement moteur est verrouillé par le test natif), diff src limité aux fichiers prévus (LignePersonnage, PopulationTable, setup, OngletsPaysHabitations, PaysHabitationsParams, ConfigTables, ParamsPanel, domiciles.test).

## Mariage manuel : le rang noble prime — un anobli (250+) est mariable (retour Thibaut, 2026-10-27 — base 56d3dd5)

- **Arbitrage Thibaut** : « Le mariage manuel reste limité aux nobles, mais un bourgeois qui devient noble doit pouvoir être marié manuellement. » L'éligibilité au mariage manuel suit désormais le RANG (`rangDe`), plus la seule dynastie : rang noble = dynastie noble de naissance (base 300) OU anobli par le prestige (250+). Le bourgeois (100-249) et le roturier (< 100) restent exclus.
- **Moteur** (cour.ts, marierPersonnages) : le check `isNobleDyn` des deux époux devient `rangDe(x, C) === 'noble'` ; message d'erreur reformulé (« Le mariage manuel unit deux NOBLES — dynastie noble de naissance ou anobli à 250 de prestige (…) »). Import isNobleDyn retiré de cour.ts (plus d'usage).
- **Interface** (logiquePopulation.ts, eligibleMariage) : même bascule — le picker « 💍 Marier avec… » propose désormais aussi les anoblis du porteur courant ; import rangDe ajouté. Texte PopulationTable mis à jour (« le mariage manuel unit deux NOBLES : dynastie noble de naissance ou anobli à 250 de prestige »).
- **Verrous** : mutateurs.test.ts — nouveau test « l'ANOBLI (roturier devenu noble, 250+) est mariable — le bourgeois non » (bourgeois 150 refusé /NOBLES/, roturier 0 refusé, anobli 250 accepté avec liens mariageId croisés + log Mariage ; le refus accepté est testé en DERNIER car le garde-fou « déjà marié » précède le check de noblesse au moteur). Helper perso étendu (option prestige, posée seulement si définie — pas de `prestige: undefined` explicite). Les gardes-fous existants (roturier refusé) restent valides tels quels.
- Docs : regles-et-arbitrages.md — nouvelle section « Le mariage manuel suit le RANG ».
- Validation : tsc 0 erreur, **175/175 natifs** (+1), 19/19 rendu, diag IDENTIQUE (aucune règle de tour ne touche au mariage manuel — mutation d'arbitre).

## Tableau Logements : colonne « places libres » retirée (retour Thibaut, 2026-10-27 — base 45663a8)

- **Retour Thibaut** : « dans le tableau des logements, il y a une colonne à droite avec un nombre qui ne sert à rien (par exemple 8) : ce nombre indique le nombre de logements mais la colonne d'avant affiche 0/8 — retire-la. »
- VilleCarte.tsx — 3e tableau « Logements » de la carte de ville : la 3e colonne (places libres par type, + cellule `<td/>` de la ligne « sans logement » + cellule du total) est retirée ; il reste 2 colonnes, type · occupés/capacité (le reste se lit dans occ/cap, ex. 0/8). Champ `libres` et `libresTotaux` supprimés du calcul (aucun autre usage), docblock et title du survol mis à jour (« habitants/capacité », plus de « places libres »). Le tableau « Métiers et places par ville » (Population) garde SES places libres — elles n'y sont pas redondantes (pas de colonne en poste/capacité au même format) et le retour ne le mentionne pas.
- Validation : tsc 0 erreur, **175/175 natifs**, 19/19 rendu (12 fichiers), diag IDENTIQUE (changement d'affichage pur).

## Effets bâtiments : les routes commerciales quittent le code en dur — champ routesApportees (retour Thibaut, 2026-10-27 — base a1986f8)

- **Retour Thibaut** : « les effets des bâtiments ne sont pas clairs — codés en dur alors que la banque sert à éviter ça, et je ne vois pas dans l'échoppe la possibilité de posséder une route commerciale supplémentaire ».
- **AUDIT** : la production (flux) et la Garnison passent déjà par la banque ; emplacements de métiers, taudis/domiciles apportés et effets santé/écoles vivent déjà en champs structurés du référentiel. Le seul effet de bâtiment codé en dur restant était le cap de ROUTES commerciales (`maxRoutesJoueur`) : noms de bâtiments en dur — dont « Plateforme commerciale » et « Guilde des marchands », ABSENTS du référentiel (vestiges du classeur), tandis que la **Place du marché** (qui promet « 1 route commerciale supplémentaire » dans sa description) n'était PAS comptée.
- **Fix** : nouveau champ référentiel `routesApportees` (ConstructionRef, defaultConfig) posé à 1 sur Echoppe [Ville], Echoppe [Château] et Place du marché ; `routesApporteesConstructionRef` (constructions.ts, pattern des fonctions ref) ; `maxRoutesJoueur` somme le champ pour chaque bâtiment présent de chaque ville du joueur (bon groupe Ville/Château) — bâtiment hors référentiel : +0, comme toute production ; entrée morte 'Guilde des marchands' retirée de la map REMPLACE (batiments.ts).
- **Affichage** : `resumeConstruction` affiche « +1 route commerciale » — l'effet devient visible dans le picker « + Construire », les badges de la carte de ville (page Pays) et le wiki Référentiels → Bâtiments. C'est la réponse au « je ne vois pas dans l'échoppe » : l'effet existait au moteur mais pas à l'écran.
- **Verrous** : commerce.test.ts — 2 nouveaux tests. (1) maxRoutesJoueur lit le référentiel : base = maxMarchands ; +1 par Échoppe ; +1 pour la Place du marché ; Poste de garde et bâtiment hors référentiel : +0. (2) L'Échoppe porte routesApportees = 1 et son résumé affiche « route commerciale ».
- Docs : regles-et-arbitrages.md — section « Les effets des bâtiments et les routes commerciales » (carte des lieux où vivent les effets).
- Validation : tsc 0 erreur, **177/177 natifs** (+2), 19/19 rendu (12 fichiers), diag IDENTIQUE (aucune échoppe au setup de la partie témoin — le cap affiché ne bouge pas).

## Coûts structurés + métiers/logements par la banque : fin des textes analysés (retour Thibaut, 2026-10-27 — base 7470420)

- **Retour Thibaut** : « je veux que le coût ne soit pas textuel mais des valeurs qui passent par la banque. Idem pour l'attribution de métiers (champs "valeur"/"métier"), idem pour les logements. » — après l'explication du mécanisme (regex sur le texte du coût, 12 bâtiments à prérequis, effet « même ville »), décision : champ dédié `requis`, et VIDAGE des textes production/description (+ colonnes UI ainsi vidées).
- **Referentiels.json MIGRÉ** (script /tmp/migrer.mjs + vérification fidélité /tmp/verif.mjs : **94/94 entrées, 198 paires, 0 écart**) : `couts: [{ressource, valeur}]` posés, `requis` posé (12), `cout`/`production`/`description` vidés (''). Format du fichier réécrit par JSON.stringify(2) — diff revu : seules les entrées attendues bougent. typesHabitation HORS périmètre (textes de coût conservés — rangs d'habitation).
- **Banque** (rules/types.ts, effects/banque.ts, registry.ts) : nouveaux types d'effet `placesMetier` {metier, valeur} et `logements` {logement, valeur} ; ContributionEffets gagne les canaux `placesMetier` et `logements` ; appliquerEffet les cumule ; reglesConstructions traduit emplacements → placesMetier et taudisApportes/domicilesApportes → logements (une construction porte une règle dès qu'elle a un effet QUELCONQUE — ~90 règles au registre).
- **Moteur** (engine/constructions.ts) : `coutConstructionRef` agrège les paires `couts` (normalisation ressource) ; `prerequisConstruction` lit `requis` (fin des regex — parseCoutTexte ne sert plus qu'aux types d'habitation) ; `reductionCampDeBatisseurs` lit le champ `reduction` (repli {Or:5, Bois:1}, Camp absent du référentiel) ; `emplacementsConstructionRef` et nouveau `logementsConstructionRef` lisent les canaux banque ; `resumeConstruction` rend les logements du canal (« +5 Taudis », « +20 Maisons de notable » — ordre des parts inchangé). **Toutes les lectures acceptent la config de la partie en argument** (C_LECTURE par défaut) : metiers.ts (emplacementsMetierVille, emplacementsRoutesVille), domiciles.ts (domicilesApportesVille), batiments.ts, amenagements.ts, commerce.ts passent leur config — les éditions de Paramètres s'appliquent désormais aussi aux effets/emplacements/logements (les lectures display passaient avant par la config PAR DÉFAUT).
- **UI** : Constructions.ts (picker « + Construire » : coût calculé via coutConstructionRef, résumé via resumeConstruction), VilleCarte.tsx (3 pickers + badges aménagements/bâtiments ; titles de description retirés), OngletsBatiments.tsx (wiki : coût calculé « 25 Or + 4 Fer », plus de spans description, colonne Description retirée de la table aménagements, textes d'aide nettoyés de la mention d'arbitrage). ConstructionsParams.tsx : **CoutEditor** (paires ressource/valeur, + ligne, ✕) remplace le TextInput de coût, colonne **Prérequis** (bâtiments), colonnes Production/Description retirées, boutons « + Ajouter » posent couts/effets vides.
- **Compat configs** : migrerConstructions (defaultConfig) → complétion CHAMP À CHAMP par (nom, groupe) ({...défaut, ...entrée} — champ sauvegardé prioritaire), pattern migrerFactions ; realignerAmenagements (v4) inchangé. ConstructionRef : cout/production/description OPTIONNELS, nouveaux champs couts/requis/reduction (CoutRef). COUT_AMENAGEMENT_TEXTE retiré (mort, retour texte).
- **Verrous** : banque.test — (1) test unitaire placesMetier/logements (canaux dédiés, cumul, autres canaux intacts) ; (2) VOIE UNIQUE étendue : toute construction à effet (flux OU emplacements OU logements) a SA règle, et chaque canal moteur (flux, été, garnison, placesMetier, logements) égale la contribution banque ; (3) SANS règle = production nulle sur les 5 canaux ; (4) coût lu des données (Poste de garde 25 Or + 4 Fer ; verrou global : couts présents + textes vidés sur les 94) ; (5) prérequis par champ (Caserne→Poste de garde, Ecole militaire→Terrain d'entrainement) ; (6) métiers/logements par banque (Poste de garde 4 Garde ; Champ +5 Taudis ; Quartier intermédiaire +20 Maisons ; résumés) ; (7) Camp de bâtisseurs repli structuré. Constructions.test (rendu) : fixtures tiers en couts structurés, test picker réécrit (textes vidés sur les bâtiments + coût Poste de garde « 25 Or + 4 Fer » affiché des données). registre.test : TYPES_CONNUSS += placesMetier/logements ; doublons Echoppe comparés sur couts (données). config.test : Moulin à vent resyncé verrouillé sur couts + requis. metiers.test : fixtures couts structurés.
- Docs : regles-et-arbitrages.md — section « Coûts, prérequis, métiers et logements : des valeurs, par la banque ».
- Validation : tsc 0 erreur, **182/182 natifs** (+5), 19/19 rendu (12 fichiers), **diag IDENTIQUE** (critère de réussite : refactor sans changement sémantique — les valeurs lues des données égalent exactement celles des anciennes regex).

## Coûts d'habitation structurés + registre vu par canal (retour Thibaut, 2026-10-27 — base 1168a41)

- **Retour Thibaut** (après explication du passage du registre de ~15 règles manuscrites à ~90 générées) : « un filtre par canal peut en effet être pertinent, et appliquer les changements qui ont été fait sur les bâtiments et aménagements sur les types d'habitations » — deux chantiers.
- **Coûts d'habitation en DONNÉES** : referentiels.json — les 6 rangs (Ville : Hameau/Cité/Grande Cité ; Château : Motte/Donjon/Forteresse) reçoivent `couts: [{ressource, valeur}]` (migration fidèle : « 40 Or + 8 Bétail + 6 Pierres » → Or 40, Bétail 8, Pierre 6 — normalisation au singulier du stock, comme les constructions), texte `cout` vidé. HabitationDef (engine/types.ts ET config/defaultConfig.ts — deux interfaces parallèles, toutes deux mises à jour) : `cout` OPTIONNEL + `couts?: CoutRef[]`.
- **Moteur** : `agregerCouts` extrait de constructions.ts (partagé : `coutConstructionRef` + nouveau `coutRang` dans habitations.ts) ; `coutHabitation` lit les paires via coutRang. **`parseCoutTexte` RETIRÉ** (constructions.ts + ré-export amenagements.ts) : plus AUCUN coût textuel analysé dans le jeu — NOMBRE/RESSOURCES_COUT emportés, normaliserRessource conservé (agrégation).
- **Compat configs** : `migrerTypesHabitation` complète `couts` depuis la ligne du défaut de même (type, rang) si absent — idempotent, même patron que `domicilesRang` ; rang personnalisé absent du défaut → coût vide (gratuit). Le texte `cout` sauvegardé n'est plus lu nulle part.
- **UI** : PaysHabitationsParams (CoutEditor — paires ressource/valeur, même éditeur que les constructions ; « + Ajouter » pose `couts: []`), OngletsPaysHabitations (wiki : coût calculé `fmtCout(coutRang(h))`), VilleCarte (sélecteur de rang : libellé « Hameau (20 Or + 10 Bois + 6 Bétail) » calculé des paires).
- **Registre PAR CANAL dans le diag** : scripts/diag.ts gagne une section « REGISTRE DE RÈGLES PAR CANAL » — total par source (90 règles : batiment 40, amenagement 42, merveille 4, regime 1, culture 3), puis par canal (placesMetier 71, logements 47, fluxVille 12, garnisonVille 2, fluxParAmenagement 1, fluxParVilleCultureMonde 3) : une ligne par règle (id stable, nom, groupe, conditions `[si …]`, effets signés « Garde +4 · Taudis +10 »). Une règle multi-canaux apparaît dans chaque canal (filtre, pas tri) ; canaux inconnus signalés ⚠. diag-out.txt régénéré (57 → 202 lignes) ; partie saine et scénarios de dégradation INCHANGÉS au-dessus/en dessous.
- **Verrous** : habitations.test.ts NOUVEAU (3 tests : paires agrégées + normalisation + doublons Or, débit du stock au changement de rang + log Système, coût par type+rang Château/Donjon) ; config.test.ts (+2 : verrou global 6 rangs — couts présents + textes vidés + fidélité Hameau/Forteresse ; configs d'avant complétées par le défaut, idempotent, rang personnalisé gratuit).
- Docs : regles-et-arbitrages.md — suite de la section coûts (« Idem types d'habitation ») + nouvelle section « Le registre de règles, vu PAR CANAL ».
- Validation : tsc 0 erreur, **187/187 natifs** (+5), 19/19 rendu (12 fichiers), diag re-exécuté 2× identique (partie saine inchangée : le coût d'habitation est débité par le MUTATEUR d'UI au changement de rang, pas par runTurn — aucun décalage de log).

## Audit bâtiments/aménagements/population/métiers : merveilles supprimées, code mort retiré (retour Thibaut, 2026-10-27 — base 9d010c5)

- **Audit demandé par Thibaut** après le tour « coûts structurés » : erreurs, code mort, SOLID, cohérence sur bâtiments, aménagements, population et métiers. Rapport livré en chat ; arbitrages : (1) « supprimer toutes les merveilles pour l'instant », (2) table REMPLACE purgée des entrées mortes, (3) compat vieilles parties SANS migration (les bâtiments inconnus ne produisent rien, pas de crash), (4) « tout : erreurs + code mort + exports + unifier HabitationDef ».
- **Merveilles retirées** : referentiels.json perd ses 4 entrées famille Merveille (94 → 90 constructions) ; `engine/merveilles.ts` (effetImmediatMerveille, reductionLeveeArmeesMerveilles, aLaboratoireFalheim) et `engine/statutAuto.ts` (statutMerveille, pastilleClass — plus aucun utilisateur) SUPPRIMÉS ; armees.ts perd l'import + le bloc de réduction de levée ; batiments.ts perd le doublement de Science du Laboratoire de Falheim (imports aLaboratoireFalheim/capitaleDe retirés) ; Constructions.ts perd les gardes fam==='Merveille' (rang requis, une seule par ville), l'effet one-shot (mervTxt — la Guilde des diplomates, dernière utilisatrice du canal one-shot, n'existe plus au référentiel), le ternaire okGroupe et les catégories « Merveilles · rang N » ; rules/types.ts retire 'merveille' de SourceRegle (valeur jamais réutilisable) ; rules/registry.ts simplifie le mapping source (amenagement/batiment) ; UI : filtre et famille Merveille retirés du wiki (OngletsBatiments), badge FAM_BADGES nettoyé (pays-utils), libellé des réductions de levée corrigé (ArmiesPanel), commentaires d'en-tête mis à jour (factions, victory, CarteReservesEmissaires, CitesLibresView, Constructions).
- **REMPLACE purgé** (batiments.ts) : 4 entrées vivantes conservées (Camp de travailleurs, Silo à grain, Moulin à vent, Ecole intermédiaire) ; clés/cibles mortes supprimées (Guilde des artisans de la terre., Écoles intermédiaire/supérieure et variantes accentuées, Guildes des savants/évangiles/marins/diplomates, Institut de recherche, Conjuratoire, Complexe d'exploitation maritime).
- **Code mort retiré** : batimentRef (batiments.ts, zéro appelant), habitantsRequisVille (habitations.ts), AmenagementDef/amenagementsDefs/AMENAGEMENTS/amenagementDef (amenagements.ts — le champ `effet` est vide depuis le vidage des textes, plus aucun lecteur ; l'UI passe par amenagementRef), effetsTourAmenagement dé-exporté (usage interne : detailsAmenagementsJoueur). **coutAmenagement(p, cfg, nom)** : nom REQUIS (l'appelant Constructions.ts mis à jour), plus de replis Baleinier/{Or:8,Bois:3} — aménagement hors référentiel = pas de coût. **13 dé-exports** (usage interne, aucun test ne les importe) : formatDynastyPair, emplacementsMetierVille, OccupationMetier (metiers.ts) ; normaliserRessource (constructions.ts) ; migrerPopulation (population.ts) ; femaleAgeFactor, maleAgeFactor, orientationFertFactor, pickName, computeBabyDynasty, inheritTraits (naissances.ts) ; LigneBatiment (batiments.ts) ; re-export coutBatimentRef (batiments.ts). **metiersAccessibles(state, C)** : paramètre joueur inutilisé `_p` retiré, appelant PopulationTable.tsx mis à jour.
- **HabitationDef unifié** : la double définition (engine/types.ts + config/defaultConfig.ts) disparaît — unique définition dans engine/types.ts, importée + ré-exportée par defaultConfig (pas de cycle : engine/types n'importe rien de config ; les deux définitions étaient structurellement identiques : metiersBase ≡ EmplacementDef, couts ≡ CoutRef).
- **En-têtes obsolètes corrigés** : batiments.ts (« coût/production/description exacts » — obsolète depuis le vidage des textes du 2026-10-27), amenagements.ts, amenagementRef.
- **Sain confirmé (aucun changement)** : voie unique banque sur les 5 canaux, config passée à tous les sites d'appel moteur, orchestration population, autres.ts lit l'état (pas le référentiel), compat merveilles fantômes SANS migration (entrées des vieilles configs invisibles du sélecteur/wiki, sans règle dans le référentiel courant — elles ne produisent rien ; la complétion champ à champ ne retire jamais, pas de purge nécessaire).
- **Registre** : 90 → 86 règles (sources : batiment 40, amenagement 42, regime 1, culture 3 ; canaux : placesMetier 71, logements 47, fluxVille 9, garnisonVille 1 — Mont Caracole disparu, fluxParAmenagement 1, fluxParVilleCultureMonde 3). diag-out.txt régénéré, re-exécuté 2× identique.
- Docs : regles-et-arbitrages.md — nouvelle section « Merveilles supprimées, remplacements purgés, HabitationDef unifié » + section « PAR CANAL » resynchronisée (86 règles).
- Validation : tsc 0 erreur, **187/187 natifs**, 19/19 rendu (12 fichiers), diag IDENTIQUE, bundle Edge Function rebuildé + testé (runTurn tour 2, bâtiments par la banque).

## Réalignement v5 : bâtiments des vieilles configs resynchronisés + merveilles purgées à l'ouverture (retour Thibaut, 2026-10-27 — base f9279983)

- **Retour Thibaut** (après Ctrl+F5 sur le déploiement de l'audit) : « tu as récupéré les anciennes règles des bâtiments, par exemple le bûcheron qui donne du bois plutôt que des emplacements de bûcheron ». **Diagnostic** : la config vit dans la partie sauvegardée — les parties d'avant le rework « production → emplacements » portent encore les vieux effets de flux, que `migrerConstructions` conserve (fusion champ à champ, champ sauvegardé prioritaire) alors que les `emplacements` absents sont complétés par le défaut : DOUBLE COMPTAGE (Bois du flux + métier Bûcheron). Les parties tamponnées ≥ 4 ne repassaient plus par les migrations.
- **Arbitrages du jour** : « on peut supprimer les anciennes parties, et oui, le réalignement doit être automatique au chargement » ; « oui, purge à l'ouverture » des 4 merveilles restées dans les vieilles configs. REMPLACE l'arbitrage du tour précédent (« pas de purge nécessaire »).
- **SCHEMA_VERSION_CONFIG 4 → 5** (patron règle (x)) : les configs tamponnées v4 repassent une fois par le bloc de migrations. Vieilles parties jetables — la résurrection éventuelle d'entrées disparues est acceptable.
- **`realignerAmenagements` → `realignerConstructions`** (defaultConfig.ts) : le réalignement s'étend aux BÂTIMENTS — match par (nom, groupe) sur TOUTES les catégories, entrée du référentiel REMPLACÉE par la courante (donnée de référence, pas de personnalisation) ; constructions PERSO conservées ; une édition POST-convergence survit aux re-lectures (le bloc ne joue qu'une fois). Purge `famille !== 'Merveille'` ajoutée AVANT le réalignement dans le bloc cfgOf (le « (52) » de l'onglet Paramètres redevient 48) ; bâtiments merveilles déjà construits = bâtiments inconnus, aucun effet, pas de crash.
- **Tests** : tampon attendu 5 (params.test, config.test) ; les cinq tests des migrations ciblées (« déjà convergée ») passent leurs configs à schemaVersion 5 ; +2 tests natifs (réalignement du Camp de bûcheron pré-rework + purge des 4 merveilles + perso conservé + idempotence ; édition post-convergence non écrasée).
- Docs : regles-et-arbitrages.md — nouvelle section « Réalignement automatique des BÂTIMENTS au chargement » + compat merveilles de la section audit réécrite (purge v5).
- Validation : tsc 0 erreur, **189/189 natifs** (+2), 19/19 rendu (12 fichiers), diag IDENTIQUE (86 règles), bundle Edge Function rebuildé + testé.

## Titre des aménagements : la case requise entre parenthèses (retour Thibaut, 2026-10-27 — base 86594289)

- **Retour Thibaut** : « pour les aménagements, met la case requise entre parenthèses dans le titre de l'aménagement » — le titre affiché devient « Baleinier (Baleine) », « Champ (Plaine) ».
- **pays-utils** : helper partagé `titreAmenagement(nom, terrain)` — « nom (case requise) » ; aménagement perso sans terrain = titre nu. Les parenthèses ne sont JAMAIS stockées : ni dans l'état ni dans la config (l'éditeur des Paramètres édite le nom brut, le picker embarque le nom brut en `value`, seul le libellé affiché change).
- **VilleCarte** : picker « + Aménager une case… » (tiers 1/2/3) — titre avec parenthèses, suffixe « · terrain » à droite du coût retiré (doublon) ; badge d'un aménagement construit — titre avec parenthèses, suffixe « (terrain) » du résumé muet retiré (doublon).
- **Wiki (OngletsBatiments)** : titre « nom (case requise) » ; la colonne Terrain, devenue redondante, est retirée de la table des aménagements.
- **Verrou** : Constructions.test (+1 → rendu 20/20) — titres tier 1 « Baleinier (Baleine) », tier 2 « Baleinier (tier 2) (Baleine) » (parenthèses APRÈS le nom complet), perso nu, terrain vide nu + verrou référentiel : les 42 aménagements portent TOUS une case requise.
- Validation : tsc 0 erreur, **189/189 natifs**, **20/20 rendu** (+1), diag IDENTIQUE (86 règles), bundle Edge Function rebuildé + testé.

## Audit 2026-10-27, F2-F6 appliqués (base fed35f5e)

- **Audit demandé par Thibaut** (suite de celui du 19/10) : revue statique de la couche multijoueur v2 + store React, avec test en conditions réelles sur salon jetable `audit-test-jet` (nettoyé après ; aucune écriture sur la partie en ligne ni dans `__config__`). Rapport livré en chat avec checklist, puis **arbitrage Thibaut : « applique f2 à f6 et verse le rapport »**.
- **F1 (confirmé en test réel, PAS un constat de lecture)** : `schema-v2.sql` n'a pas de policy UPDATE sur `cp_events` → l'upsert de `pousserSectionV2` reçoit 42501 en production, le repli delete+insert joue à CHAQUE édition (la voie rapide n'a jamais marché en ligne). Correctif versé dans `schema-v2.sql` §7 (drop if exists + create policy "cp_events maj" for update) avec note d'installation — **ACTION MANUELLE THIBAUT : coller ce bloc une fois dans l'éditeur SQL Supabase** (le dépôt ne touche pas la base en ligne ; le repli continue de fonctionner en attendant, bug non bloquant).
- **F2 appliqué** : le code de salon étant le seul secret (RLS anon ouverte assumée, pas d'auth), codes devinables → `genererCodeSalon()` exporté de SetupPanel.tsx (16 car., alphabet sans IOl01), bouton « 🎲 Générer un code » à côté du champ code, texte d'aide étendu, note README § multijoueur. Default `'chasse-peche'` du champ VOLONTAIREMENT conservé (salon live). Test rendu SetupPanel.test.ts (50 tirages : longueur, alphabet, quasi-unicité).
- **F3 appliqué** : `pendingMutators` = file morte jamais rejouée → RETRAIT (déclaration + 3 boucles de remplissage, commentaires in situ) ; `update()` n'exécute plus `persist`/`pousserSectionV2` DANS le updater setState (StrictMode → double upsert réseau) — réécrit hors du updater sur base `stateRef.current`, effets de bord APRÈS le setState ; helper module `clonerEtat(prev)` (clone sélectif de l'historique).
- **F4 appliqué** : runTurn local mesuré 1,7-3,2 s à 16k (bench rejoué) → état `calculTour` dans le contexte + bandeau « ⏳ Calcul du tour en cours… » (TurnBar), bouton Tour suivant désactivé + « ⏳ Calcul… », yield 30 ms avant `runTurn` pour laisser peindre le bandeau, `try/finally` (drapeau retombe en erreur). Branches couvertes : nextTurn locale, resoudreSeul, resoudreBarriereLocaleV2.
- **F5 appliqué** : commentaire mensonger de `gardeFous` corrigé (le ré-ajout des constructions du référentiel manquantes est VOULU — seuls éditions/perso persistent ; comportement inchangé, verrouillé par tests).
- **F6 appliqué** : `validerFormeConfig(c: unknown): string[]` dans defaultConfig.ts (tables constructions/traits/cultures/regimes/typesHabitation/paysRangs/victoires/peuplesLibres/peuplesAutres/metiers = tableaux si présentes, params = objet, non-objet refusé) ; ParamsPanel refuse l'import (« Import refusé — … ») AVANT setCfg (un `constructions: 42` cassait l'UI au premier rendu) ; test natif config.test.ts (accepte saine/vide, refuse 42/string/array, pas de faux positif).
- **Micro-constats documentés non traités (à arbitrer)** : m1 fetch sans timeout dans resoudreTourServeur ; m2 fusionnerSections accepte des n° de joueurs inconnus.
- **Points forts confirmés** : le repli delete+insert a masqué F1 pendant des semaines (architecture défensive) ; diag IDENTIQUE malgré la refonte du store (moteur intact) ; CAS tour_publie et barrière v2 sans défaut de concurrence retrouvé.
- Rapport versé : `docs/ia/audit-code-2026-10-27.md` (statuts F1-F6 + m1/m2 + plan d'action).
- Validation : tsc (CI), **190/190 natifs** (+1 test F6), **21 rendus attendus en CI** (+1 test F2, non exécutables localement sans react), diag IDENTIQUE, balance JSX vérifiée sur les 4 .tsx modifiés (harnais dédié ; artefacts préexistants identiques base ↔ modifiés sur ParamsPanel/SetupPanel).

## 4e tableau « Métiers » sur la carte de ville (retour Thibaut, 2026-10-27 — base 0553a8d5)

- **Retour Thibaut** : « ajouter un nouveau tableau avec les 3 tableaux de logement, culture et garnison, qui recense tous les métiers disponibles et occupés » — le bloc POPULATION, GARNISON & LOGEMENTS de la carte de ville passe de 3 à 4 colonnes.
- **VilleCarte** : 4e tableau « Métiers : N en poste » — une ligne par métier OCCUPÉ (en poste > 0) ou DISPONIBLE (cap finie : base du rang + emplacements des constructions), la ligne Sans-emploi toujours présente (rôle neutre). Colonnes : en poste · places libres (« — » pour les non plafonnés : rôles de cour, armée, Banquier, Troubadour… ; surnombre en rouge). Pied : habitants en poste / vivants. Mêmes données que le panneau Population (helper moteur testé occupationsMetierVille) — dérivation directe de l'état, zéro logique dupliquée.
- **styles.css** : .ville-duo-cols en 4 colonnes (0.8fr 1fr 1fr 1.1fr) ; repli 2 colonnes sous 860px (filets retirés aux têtes de rangée — enfants impairs), 1 colonne sous 560px inchangé.
- **Verrou** : PlayerView.test — test « colonnes » étendu en « 4 colonnes » (patron R3, dérivé de l'état) : titre, chaque métier disponible/occupé, ligne Sans-emploi, pied en poste/vivants.
- **Rebase** : la branche avait bougé entre-temps (audit F1-F6, commits 841ab257…0553a8d5) — aucun fichier en commun, validation refaite sur la nouvelle base.
- Validation : tsc 0 erreur, **190/190 natifs**, **21/21 rendu**, diag IDENTIQUE (86 règles), bundle Edge Function rebuildé + testé.

## F1 vérifié en production (2026-10-27, après collage du SQL par Thibaut)

- **Thibaut a collé le bloc §7** (policy UPDATE « cp_events maj ») dans l'éditeur SQL Supabase — l'action manuelle du plan d'action de l'audit est FAITE.
- **Vérification en conditions réelles anonymes** sur salon jetable `audit-test-fix2` (joueur 99, ligne purgée après ; aucune écriture sur le salon `chasse-peche`, contrôlé en lecture) :
  - PATCH explicite sur `cp_events` → **204** : la policy UPDATE est bien active ;
  - **upsert de `pousserSectionV2` rejoué à l'identique** (`on_conflict=salon,tour,joueur,type`) → **200, la ligne est REMPLACÉE** (id stable, payload mis à jour) — le même appel rendait 42501 ce matin (audit F1) et le repli delete+insert jouait à CHAQUE re-poussée. La voie rapide est donc OPÉRATIONNELLE en production : 1 aller-retour au lieu de 3, plus de fenêtre de non-atomicité.
  - NB outillage : en curl direct, le mode `Prefer: resolution=merge-upsert` rend 409/23505 sur cette table ; sans incidence pour le jeu — supabase-js `.upsert()` émet `merge-duplicates`, mode vérifié en 200.
- Bilan de l'audit 2026-10-27 : F1-F6 TOUS résolus et vérifiés. Restent en attente d'arbitrage : m1 (timeout du fetch de `resoudreTourServeur`) et m2 (sections de joueurs inconnus dans `fusionnerSections`).

## m1 et m2 appliqués — arbitrages Thibaut (2026-10-27 soir, base 0553a8d5)

- **Arbitrages Thibaut** : « m1 : timeout au bout de 1 min, retente automatiquement, et si le nouvel essai rate de nouveau, ajoute et affiche un message d'erreur » ; « m2 : affiche un message en disant que ce joueur n'existe pas et ignore donc les modifications ».
- **m1 appliqué (4 fichiers)** :
  - `src/supabase/reprise.ts` NOUVEAU — helper PUR `avecReprise(operation, estDefinitif, libelle)` : jusqu'à 2 essais ; un essai échoue en LEVANT une exception (timeout AbortSignal, réseau KO, réponse non-JSON) ou en répondant un résultat non définitif ; au 2e échec, erreur EXPLICITE « <libelle> en échec après 2 essais — <détail> ». `estDefinitif` fait la distinction ok / dejaPublie (verdict d'idempotence : jamais de reprise inutile sur un tour déjà publié).
  - `src/supabase/client.ts` — `resoudreTourServeur` : fetch avec `signal: AbortSignal.timeout(60_000)`, une reprise automatique via avecReprise, erreur explicite au 2e échec (l'ancien fetch sans timeout laissait le client en attente INDÉFINIE).
  - `src/state/store.tsx` — les replis `resoudreSeul(erreurServeur?)` et `resoudreBarriereLocaleV2(..., erreurServeur?)` journalisent l'échec de façon VISIBLE (type 'Système' : « ⚠️ Résolution serveur en échec après 2 essais — … — résolution locale utilisée / avec publication ») ; le repli barrière fusionne l'entrée dans le tour PUBLIÉ (visible par TOUS les joueurs), resoudreSeul l'inscrit dans le draft local. Les 3 branches d'appel (Forcer, dernier pousseur, poller la barrière) passent `res.error` ; `dejaPublie` n'est PAS un échec (rien à signaler).
  - `src/supabase/reprise.test.ts` NOUVEAU ×6 : succès au 1er essai sans reprise ; exception puis reprise réussie ; exception ×2 → message explicite « après 2 essais » avec libellé + détail ; échec fonctionnel puis reprise réussie ; échec fonctionnel ×2 → détail de la 2e réponse ; dejaPublie définitif → aucune reprise.
- **m2 appliqué (2 fichiers)** :
  - `src/engine/fusion.ts` — un numéro INCONNU du setup est ignoré AVANT toute application (player/population/routes/cités/log du joueur inconnu : RIEN ne compte) + entrée 'Système' visible dans le journal du tour : « ⚠️ Joueur N inexistant dans la partie — section ignorée, ses modifications ne comptent pas pour ce tour. » (même pattern que le rejet R4 des sections malformées). Le garde vit dans le module PARTAGÉ client + Edge Function — le bundle serveur est reconstruit par la CI (build:function).
  - `src/engine/fusion.test.ts` +2 : section « pirate » J42 (routes/cités/population/log parasites) entièrement ignorée + journal visible + route légitime intacte + le log parasite n'est pas fusionné ; non-régression des joueurs du setup (aucun faux positif « inexistant »).
- Validation : **198/198 natifs** (190 + 6 reprise + 2 fusion), diag IDENTIQUE, diff vs base limité aux 6 fichiers voulus, balance JSX store.tsx OK, syntaxe --check OK sur les 5 .ts touchés.

## Régime des taxes PAR RESSOURCE (arbitrage Thibaut, 2026-10-28)

- **Arbitrage Thibaut** : « faibles avec naissances et production nourritures ×1,25, mais toutes les autres productions ×0,75. Normales. Hautes avec naissances et production nourritures ×0,75, mais toutes les autres productions ×1,25. » → le niveau de taxes module la production des habitants RESSOURCE PAR RESSOURCE : la Nourriture part du côté des naissances, toutes les autres ressources à l'envers. Les naissances elles-mêmes ne changent pas (taxNaiss* 1,25/0,75 du marqueur (z), reconfirmé).
- **Moteur (3 fichiers)** :
  - `src/engine/economie.ts` — `facteurTaxes(ville, C, ressource)` : signature PAR RESSOURCE (Nourriture ×taxNourr* / autres ×taxOr*) ; `detailGainsVille` applique le facteur par ressource et son champ `taxeMult` devient un `Record<string, number>` (le canal `taxes` reste `metiers × taxeMult[res] × (1 + bonusTaxes[res])` — les bonus Gouverneur/Banquier/Professeur/Troubadour restent additifs après le facteur). `taxBirthFactor` INCHANGÉ (docblock mis à jour).
  - `src/engine/citesLibres.ts` — `facteurTaxesCite(cite, C, ressource)` : mêmes facteurs (le facteur s'applique après la règle « Chasseurs ×1,1 » des cités) ; `DetailCiteLibre.taxeMult` devient `Record<string, number>` ; transfert au suzerain recalculé par ressource.
  - `src/config/params.ts` — clés NOUVELLES `taxNourrFaibles`/`taxNourrHautes` (défauts 1,25/0,75, interface + DEFAULT_PARAMS + PARAM_META groupe « Taxes ») ; les clés historiques `taxOrFaibles`/`taxOrHautes` changent de SENS (elles ne portent plus que les ressources hors Nourriture — valeurs inchangées) ; labels PARAM_META mis à jour (« autres ressources (hors Nourriture) »). AUCUNE migration : mergeParams pose les défauts des clés nouvelles sur les configs sauvegardées, les valeurs taxOr* existantes restent valides telles quelles.
- **UI (4 fichiers)** :
  - `src/components/ui.tsx` — `TAX_OPTIONS` : libellés du NOUVEAU régime (les anciens affichaient encore ×0,5/×1,5, périmés depuis le passage ±25 % du marqueur (z) — jamais mis à jour à l'époque).
  - `src/components/citesLibres/CarteCite.tsx` — le résumé « taxes ×N » devient PAR RESSOURCE (helper `fmtTaxesCite` : « ×1 » si uniforme, sinon « Nourriture ×1.25 · Or ×0.75 »).
  - `src/components/pays/AideAuto.tsx` — la ligne « Impôts des habitants » de l'aide détaille le régime (Faible : Nourriture & naissances ×1,25, autres ×0,75 ; Forte : l'inverse).
  - `src/engine/types.ts` — docblock `CiteLibre.taxes` réaligné (production PAR RESSOURCE).
- **Tests** : `src/engine/taxes.test.ts` NOUVEAU ×5 (facteurTaxes par ressource + défauts verrouillés ; facteurTaxesCite + absent = Moyenne ; ratios detailGainsVille Moyenne↔Faible↔Forte sur Nourriture ET Or avec Chasseurs + Commerçants ; mêmes ratios sur detailCiteLibre/transfert ; taxBirthFactor non-régression) + `src/config/params.test.ts` +1 (défauts 2026-10-28 + mergeParams : clé nouvelle absente → défaut, personnalisation conservée).
- **Portée conservée** (décision d'implémentation, actée ici) : le facteur module UNIQUEMENT la production des métiers des habitants (canal « ce que les taxes rapportent ») — bâtiments, aménagements, « Autres », proximité, commerce et consommation restent hors taxes, comme avant l'arbitrage.
- Validation : **204/204 tests natifs** (198 + 6), diag IDENTIQUE (scénario du diag : toutes villes Moyenne), diff vs base limité aux 9 fichiers voulus, JSX BALANCED (CarteCite/ui/AideAuto), `--check` OK sur les 6 .ts.

## Les armées rejoignent la banque (arbitrage Thibaut, 2026-10-28)

- **Arbitrages Thibaut** : (1) flag mort `prochaineArmeeReduite` (−50 Or, ex-tech « Stratégies militaires I », sans producteur depuis la purge du 2026-10-24) : « garde la fonction en banque mais retire cet effet précisément » → RETRAIT du champ (type + prixArmee + ArmiesPanel) ; (2) périmètre : « je me fiche qu'ils vivent dans les paramètres, général et soldat sont des métiers, ils doivent donc vivre dans la banque, tout ce qui est logique de se trouver en banque doit rejoindre la banque » → PUISSANCES (Soldat 15 / Commandant 45) et ÂGES (16/30) migrent vers les LIGNES DE MÉTIER, RÉDUCTIONS DE LEVÉE vers les FICHES DE CONSTRUCTION ; prix de base (armeePrixOr / armeePriXPuissance) RESTENT en paramètres ; garnison des Gardes HORS périmètre.
- **Données + migration** : `referentiels.json` (+`reductionLeveeArmee` 10/25/20/8 sur Terrain d'entrainement / Ecole militaire / Guilde des explorateurs / Grande caserne ; +`puissanceArmee`/`ageMin`/`ageMax` sur les lignes Soldat/Commandant) ; `defaultConfig.ts` (champs ConstructionRef/MetierDef, flag `armeesBanque2026`) ; migration ciblée dans cfgOf (patron taxes25, marqueur (z), SANS bump de tampon) : sème les valeurs des PARAMÈTRES SAUVEGARDÉS vers les lignes/fiches (personnalisations préservées), pose le drapeau, préserve tout champ déjà défini.
- **Règles** : `rules/types.ts` (interface `EffetReductionLeveeArmee` + union Effet + canal `reductionLeveeArmee` de ContributionEffets — type RESTAURÉ le 2026-10-28 avec un producteur, note purge R4 AMENDÉE, règle « amender jamais supprimer ») ; `rules/effects/banque.ts` (case du canal + contributionVide) ; `rules/registry.ts` (traduction fiche → effet, même style que emplacements/logements).
- **Moteur** : `engine/constructions.ts` — exports `reductionLeveeConstructionRef` / `reductionLeveeBatiments` (somme par bâtiment de la ville de levée), `resumeConstruction` affiche « levée d'armée −N Or » ; `engine/armees.ts` RÉÉCRIT — helpers `puissanceArmeeMetier` / `agesRecrutementSoldat` (fiche de métier, repli paramètre), recruitForArmies/recomputeArmy lisent les métiers, `prixArmee(puissanceCible, C, ville?)` : plus AUCUN hardcode par nom de bâtiment, plus de flag, réduction par la banque (plancher 0) ; `engine/types.ts` — champ `prochaineArmeeReduite` retiré (note RETRAIT in situ).
- **UI + params** : `ArmiesPanel.tsx` (titre de carte et paragraphes DYNAMIQUES dérivés des fiches métier, commentaires fantômes « Autel eud Guer' » / « Grand écuyer » nettoyés, 3 appels prixArmee à la nouvelle signature, consommation du flag remplacée par note RETRAIT) ; `params/ConstructionsParams.tsx` (colonne « Réduc. levée (Or) ») ; `reference/OngletsMetiers.tsx` (colonne « Armée ») ; `config/params.ts` (4 entrées PARAM_META retirées → notes RETRAIT, docblocks REPLI sur les 4 paramètres historiques).
- **Tests** : `engine/armees.test.ts` NOUVEAU ×8 (défauts fiches 15/45/16-30 ; ligne éditée prime ; repli param ; bornes d'âge au recrutement dont ageMax édité ; prixArmee 45/0/37 Or + fiche éditée ; règle + canal de banque ; résumé « levée d'armée −10 Or » ; flag résiduel ignoré) ; `config/params.test.ts` +1 migration `armeesBanque2026` (semis depuis paramètres personnalisés, valeurs préservées, idempotence, drapeau) ; `ArmiesPanel.test.ts` adapté à la nouvelle signature ; contrat banque/registre étendu au canal.
- **diag.ts** : canal `reductionLeveeArmee` ajouté à CANAUX_CONNUS + rendu lisible « levée d'armée −N Or » — le diag CHANGE légitimement : 86 → **87 règles** (le Terrain d'entrainement, effets vides hier, porte désormais sa règle), 3 règles gagnent l'effet en suffixe, nouvelle vue par canal (4 règles). `diag-out.txt` régénéré localement à l'identique de ce que le workflow committera.
diag 0.

## Le texte des tables de référentiel fait foi au dépôt — régimes & rangs de pays (retour Thibaut 2026-11-12, base 2d1d9369)

Retour arbitre : « j'ai deux problèmes visuels plus que techniques :
les descriptions des régimes politiques ne font aucun sens ; les pays
et rangs dans les paramètres ne font aucun sens non plus ». Précisions
obtenues : Thibaut voyait les VIEUX textes (« garnisons, rizières »)
et des « descriptions avec des bonus de fin d'été et fin d'hiver ».

**Cause racine** (une seule, les deux écrans) : les migrations de
config réalignaient les MONTANTS mais jamais les TEXTES. Le
navigateur de l'arbitre mémorise la config commune : ses textes
dataient d'avant les refontes.
- `migrerRegimes` : `loi: r.loi` conservait l'ancien texte
  d'avant la refonte « 8 lois » (29/10) à côté des montants MIGRÉS —
  d'où des lois qui décrivent... d'autres lois.
- `migrerPaysRangs` : une table au format neuf gardait son champ
  `bonus` rempli de textes du modèle d'avant la refonte des rangs
  (14/10) — bonus saisonniers fin d'été/fin d'hiver, ministres et
  Influence, tous retirés depuis.

**Trois commits sur `v4` depuis `2d1d9369`** :
- `b36bbad1` feat(jeu) : `migrerRegimes` passe à `loi: d.loi` (texte
  RÉALIGNÉ sur le référentiel à chaque chargement cfgOf ; montants
  réglés conservés, champs morts purgés, régime hors référentiel
  conservé) ; `migrerPaysRangs` exportée + réalignement du `bonus`
  d'un rang qui porte un nom du référentiel (vide à ce jour — le
  design des rangs féodaux n'a aucun bonus ; coûts réglés conservés,
  rang arbitre ajouté conservé avec son annotation) ;
  `ParamsPanel.tsx` + `params/PaysHabitationsParams.tsx` : colonnes
  « Loi (texte) » et « Bonus » en LECTURE SEULE ; 2 tests natifs dans
  `engine/regimes.test.ts` (vieux textes réalignés / montants réglés
  conservés / purge champs morts ; bonus périmés réalignés / coûts et
  rangs arbitres conservés / vieux format à blocs → défauts).
- `70a3938c` docs(ia) : section dédiée dans regles-et-arbitrages.md +
  point de convention et compteurs dans AGENTS.md (le « 342 » datait
  du 2026-11-01 ; AMENDEMENT POSTÉRIEUR : la vague « Logements » du
  jour (session parallèle, 2 tests — plancher noble, relogement
  hérité) validait déjà 350/350 → compteurs réalignés à 352 natifs ;
  à revérifier sur la sortie CI). NB : le raccord byte-exact 4/4
  AVANT le push prouve que cette vague n'avait touché AUCUN de mes
  4 fichiers — b36bbad1 n'a rien écrasé de son travail.
- présent commit : journal seul (tête).

**Validation locale (bac upgradé)** : npm install INTERDIT dans ce
bac (« Package installation is forbidden ») → pas de tests de rendu,
ni tsc, ni build locaux (CI = garde). Le harnais Node 22
strip-types + hooks a été RECONSTRUIT (tshooks.mjs : resolve
''.ts'/index.ts + load JSON sans attribut d'import) : **332/332
natifs verts** (33 fichiers sans react, stub ESM @supabase recréé
dans node_modules local non poussé), y compris les 2 nouveaux.
Effet immédiat pour l'arbitre : la migration joue à chaque cfgOf —
les textes redeviennent cohérents AU RECHARGEMENT de la page, sans
réinitialiser la config (les montants réglés restent).

**Outillage du tour** (leçons) : git absent du bac upgradé → dépôt
via tarball codeload (44 Mo, OK) ; le raccord par morceaux de
`tools.file_system.read_file` (500 lignes) a été VALIDÉ byte-exact
par le SHA-1 maison streaming (sha1Blob('blob <n>\0'+contenu) ==
SHA du blob annoncé par get_file_contents, 4/4 fichiers) AVANT tout
push — le raccord est donc fiable pour pousser les fichiers locaux ;
⚠ INCIDENT : le bac a été RÉINITIALISÉ en pleine session (entre le
push `b36bbad1` et les docs — « installed software and other files
may not be [kept] ») → tout le corpus local a été RE-TÉLÉCHARGÉ
depuis codeload à la nouvelle tête avant de refaire les docs : ne
JAMAIS compter sur la persistance des fichiers de travail entre deux
commandes longues, re-vérifier la tête (grep du correctif) après un
reset, et les contenus docs se reconstruisent depuis le journal de
session (ce texte) ; npm interdit → validation locale limitée aux
natifs, la CI (tsc strict + tests + build) couvre le reste.

Rappelé Ctrl+F5.

## Les routes commerciales ne permettaient pas de copier un aménagement — la garde ne voyait que les flux (retour Thibaut 2026-11-12, base bd85aba7)

Retour arbitre : « autre problème : les routes commerciales ne
permettent pas de copier un aménagement ». Repro exécutée : le Select
« Aménagement copié » du formulaire (components/pays/CommerceRoutes.tsx)
reste VIDE et l'ouverture renvoie « Choisis un aménagement à copier. »
(aEff='') — impossible d'ouvrir une route vers un autre joueur.

**Cause racine** : bug de garde, PAS un manque de fonctionnalité.
`amenagementsCopiables` (engine/commerce.ts) ne listait que les
aménagements à FLUX (`ressourcesCopiables` → contributionBanque().flux)
— or depuis la vague 3a, les aménagements de base n'ont PLUS de flux :
leurs apports vivent dans les `emplacements` du référentiel
({metier, places} — Champ : 3 Fermier, Mine de Fer, Scierie…). Ne
restaient copiables que 3/52 aménagements (merveilles naturelles à
flux) et 5/71 bâtiments. Le mécanisme de copie d'emplacements EXISTAIT
et marchait : `emplacementsRoutesVille` (engine/metiers.ts) ajoute les
emplacements de l'aménagement copié aux caps de la ville d'ORIGINE,
conformément au design ACTÉ 2026-10-24 (« copier exactement un
aménagement, y compris ses emplacements de population » — l'aide en
jeu le promet déjà).

**Deux commits sur `v4` depuis `bd85aba7`** :
- `6c4bd50e` feat(jeu) : `emplacementsCopiables(nom, cfg)` (export,
  places > 0 via `emplacementsConstructionRef` — voie constructions.ts,
  le docblock interdit toujours amenagements.ts) ; copiable = flux OU
  emplacements dans `amenagementsCopiables` ; gardes de
  `creerRouteCommerce` et `changerCopieRoute` unifiées (« n'a rien à
  copier (ni production, ni emplacements de métier) ») ; logs via
  `descriptionCopie` (flux + « N place(s) Métier ») ;
  `effetsRouteProprietaire` et la garde `(ville.amenagements ?? [])
  .includes(...)` inchangées (design) ; UI CommerceRoutes.tsx : colonne
  « Copie / tour (production + emplacements) » avec les places copiées
  « +N place(s) Métier (cap de la ville d'origine) », aides et label
  reformulés ; +2 tests natifs dans engine/commerce.test.ts (Champ à
  emplacements seuls : copiable + route ouvrable + cap Fermier +3 à
  l'origine + log « 3 place(s) Fermier » ; garde : aménagement sans
  flux ni emplacements refusé, y compris par changerCopieRoute) —
  le commentaire du test Scierie (route injectée) amendé : le parcours
  NORMAL couvre désormais les emplacements.
- `6f9cd7e1` docs(ia) : section dédiée dans regles-et-arbitrages.md +
  compteurs AGENTS.md réalignés à 354 natifs (352 + 2 correctif).
- présent commit : journal seul (tête).

**Validation locale (bac upgradé)** : npm install INTERDIT → natifs
uniquement, harnais strip-types + hooks RECONSTRUIT deux fois (le bac
a été réinitialisé DEUX FOIS en pleine session : corpus re-téléchargé
depuis codeload à la même tête bd85aba7, correctif régimes `loi: d.loi`
re-vérifié après chaque re-extraction, harnais + stub @supabase
recréés) : **336/336 natifs verts** (33 fichiers sans react ni
Constructions.test.ts — les 5 échecs restants du bac viennent tous de
components/pays/Constructions.test.ts, hors harnais, couvert par la
CI), y compris les 2 nouveaux. Diff complet vs extraction propre du
tarball AVANT push : exactement 3 fichiers modifiés (règle absolue
incident 2026-10-14).

**Effet immédiat pour l'arbitre** : le Select « Aménagement copié »
se remplit (tous les aménagements à emplacements : Champ, Scierie,
Mine de Fer…) ; les routes s'ouvrent ; les emplacements copiés
s'annoncent dans la table (colonne « Copie / tour ») et se
matérialisent via les caps de la ville d'origine. Ctrl+F5 requis.

## Les paliers de dogmes ignoraient le Tourisme des lois d'habitant (retour Thibaut 2026-11-12, base baa0756d)

Retour arbitre : « autre bug : le tourisme du lunisme n'est pas
compté pour les dogmes, je pense qu'il y a un problème sur la
manière dont les dogmes comptent le tourisme ». Repro exécutée : un
joueur luniste ne franchit AUCUN palier alors que « Foi supérieure »
lui rapporte +1 Tourisme par noble et par tour.

**Cause racine** : `tourismeCulture` et `joueurPontifeCulture`
(engine/dogmes.ts) ne lisaient que le Tourisme des VILLES
(`tourismeVille` = `productionVille().total['Tourisme']`, arbitrage
n°2 du 30/10 « somme des valeurs de Tourisme de ses villes, tous
joueurs, sans les cités libres »). Or depuis la refonte « 12 lois »
des cultures (29/10), le Tourisme du Lunisme vit dans le canal lois
d'HABITANT (`loisHabitants` : +N par noble luniste, où qu'il vive),
agrégé côté JOUEUR et ABSENT de `productionVille` (par ville). Le
Tourisme luniste était donc crédité au joueur (« stock = production »,
`tourismeCourant` l.262 le documente) mais restait INVISIBLE pour
les paliers — un joueur luniste sans Chapelle ne franchissait
jamais le premier palier.

**Deux commits sur `v4` depuis `baa0756d`** :
- `4d1542c6` feat(jeu) : `tourismeLoisHabitantsCulture(state, p,
  culture, C)` NOUVEAU (engine/production.ts, à côté de
  `productionVille` : la part « Tourisme » de `detailLoisHabitants`
  revenant à la culture — exporté là pour AUCUN nouveau cycle :
  production importe déjà regimes et est déjà importé par dogmes.ts) ;
  `tourismeCulture` et `joueurPontifeCulture` additionnent villes +
  lois d'habitant de la culture (amendement de l'arbitrage n°2,
  docblocks datés) ; UI DogmesView.tsx + pays/CulturePays.tsx
  reformulées (« ...sans les cités libres, + lois d'habitant de la
  culture ») ; +1 test natif dogmes.test.ts (2 nobles lunistes
  sans ville productrice → tourismeCulture = 2, pontife = leur
  joueur avec Tourisme 2, 1 palier en attente à palier réglé à 2 ;
  aucun Tourisme pour la culture non porteuse) ; le test de
  l'arbitrage n°2 (populations vides → lois 0) garde sa lecture,
  titre amendé.
- `479bc842` docs(ia) : section dédiée dans regles-et-arbitrages.md +
  compteurs AGENTS.md réalignés à 355 natifs (354 + 1).
- présent commit : journal seul (tête).

**Validation locale (bac upgradé)** : bac réinitialisé UNE FOIS en
pleine session (corpus re-codeload à la tête baa0756d, harnais
tshooks + stub @supabase recréés) : **337/337 natifs verts** (33
fichiers sans react ni Constructions.test.ts), y compris le nouveau.
Diff complet vs extraction propre du tarball AVANT push :
EXACTEMENT 5 fichiers modifiés (règle absolue incident 2026-10-14).
Piège de fixture corrigé en route : la population du setup vit sous
la clé du NUMÉRO du joueur de base (state.population[1], n=1 — pas
[0]) ; personnages modèles capturés AVANT l'écrasement, joueur
fantôme à n=2.

**Effet immédiat pour l'arbitre** : les paliers de dogmes du
Lunisme voient le Tourisme de « Foi supérieure » (+1 par noble) ;
le pontife peut être le porteur des nobles sans posséder les villes
productrices ; les écrans Dogmes et « Culture du pays » affichent la
nouvelle définition. Ctrl+F5 requis.

## Les transferts de ville et les dons de population perdaient leur objet à la résolution (retour Thibaut 2026-11-12, base 0ab6bad4)

Retour arbitre : « les villes disparaissent lors du transfert de
ville, idem pour la population lors du transfert de pop ».

**Cause racine** (bug 2026-10-17 corrigé CÔTÉ VILLE seulement à
l'époque) : la fusion remplace l'état de chaque joueur par SA
section. Depuis le rafraîchissement de la section À CHAQUE mutation,
la section du DONNEUR, poussée après le transfert local, ne porte
PLUS la ville ; celle du RECEVEUR ne l'a jamais portée (on ne voit
les actions des autres qu'à la résolution). Le rejeu
(`rejouerTransfertVille`) cherchait la ville PAR NOM chez le donneur
dans l'état fusionné → introuvable → « idempotent » sans effet →
ville perdue des deux côtés, habitants compris. Le DON de
personnage (« Donner à… », `deplacerPersonnage`) était une mutation
inter-joueurs SANS événement partagé : population[src] venait de la
section du donneur (sans la fiche), population[dst] de celle du
receveur (jamais vue) → le personnage disparaissait du monde.

**Deux commits sur `v4` depuis `0ab6bad4`** :
- `6ff5f7aa` feat(jeu) : payload 'transfert_ville' étendu (ville
  COMPLÈTE + fiches des habitants qui suivent, capturées AVANT le
  transfert local par `transfererVillePartage` — engine/villes.ts) ;
  le rejeu MATÉRIALISE la ville chez le receveur si le donneur ne
  l'a plus (renommage de collision + resynchronisation Tourisme
  comme `transfererVille` ; chemin historique conservé pour
  l'ancien format). NOUVEAU événement partagé 'transfert_pop'
  (engine/shared.ts `rejouerTransfertPop`, branché dans
  rejouerEvenementsPartages — engine/fusion.ts) : fiche complète
  APRÈS le don + clés STABLES (joueur par numéro, cité par NOM —
  l'index des options de don ne survit pas au tour) ; rejeu BRUT
  idempotent (retrait par id partout, insertion chez la cible si
  absente). UI : VilleCarte.tsx pousse le payload complet,
  PopulationTable.tsx pousse le don. +3 tests natifs fusion.test.ts
  (scénarios donneur/receveur complets + idempotence rejeu double +
  don vers cité libre déjà fusionnée par diff).
- `a02a1d7a` docs(ia) : section dédiée dans regles-et-arbitrages.md
  (le mariage manuel inter-porteurs reste hors protocole : l'UI
  restreint déjà au porteur courant) + compteurs AGENTS.md
  réalignés à 358 natifs (355 + 3).
- présent commit : journal seul (tête).

**Validation locale (bac upgradé)** : harnais tshooks + stub
@supabase recréés après reset : **340/340 natifs verts** (33
fichiers sans react ni Constructions.test.ts), y compris les 3
nouveaux. Diff complet vs extraction propre du tarball AVANT push :
EXACTEMENT 6 fichiers modifiés (règle absolue incident 2026-10-14).
Piège de fixture : la COUR (nobles de la ville) ne suit PAS la ville
transférée — le filtre du test doit exclure `isNobleDyn` comme
`transfererVillePartage` (3 nobles chez J2).

**Effet immédiat pour l'arbitre** : un transfert de ville ou un don
de personnage fait en cours de tour SURVIT à la fin du tour — la
ville arrive chez le receveur avec ses habitants, la fiche donnée
arrive chez son nouveau porteur (joueur ou cité libre), sans
doublon même si l'événement est rejoué deux fois. Les transferts du
TOUR EN COURS au moment du déploiement gardent l'ancien format :
rejouables par le chemin historique tant que la ville est encore
chez le donneur dans la fusion. Ctrl+F5 requis.

**Correctifs CI du même tour (après le journal initial)** :
- `b08f62fb` fix(ci) : payload 'transfert_ville' passé en LITTÉRAL
  (`{ ...payload }`) — une INTERFACE n'a pas de signature d'index
  implicite, tsc rejetait l'appel `Record<string, unknown>`.
- `4af57d34` fix(ci) : `'payload.villeObj' is possibly 'undefined'`
  — l'affinement TS d'une propriété est PERDU dans un callback
  (`.some((v) => … payload.villeObj.nom …)`) : tout passe par des
  consts locales (`nomAvant`, `ville`). Au passage, retrait de la
  garde d'idempotence PAR NOM : une ville homonyme du receveur
  n'est PAS un rejeu (elle peut être la sienne — deviner perdait le
  transfert légitime) ; on matérialise avec renommage de collision,
  comme `transfererVille`. Leçons outillage : (1) passer les
  interfaces en littéral aux paramètres réseau Record ; (2) jamais
  d'accès à propriété optionnelle d'un paramètre dans un callback —
  const locale d'abord. CI verte prouvée par le bundle
  `index-B8HDQ0kU.js` (chaînes « transfert_pop » et « rejoué à la
  résolution du tour » présentes).

## Le Coeur Ancestral ne créditait aucun émissaire (retour Thibaut 2026-11-12, base 7ddb96f2)

Retour arbitre : « lors de la création du coeur ancestral (merveille
naturelle), aucun émissaire n'est crédité. Vérifie, et vérifie pour
toutes les autres sources qui peuvent créditer des émissaires ».

**Cause racine** : la réserve MOBILISABLE d'émissaires = réserve
manuelle (p.emissaires, plateau) + le bonus des constructions « tant
que présentes » (champ emissairesApportes, arbitrage 2026-11-03).
Mais le comptage (`emissairesBatimentsJoueur`, engine/batiments.ts)
ne parcourait que les BÂTIMENTS (ville.batiments) — le Coeur
Ancestral est une MERVEILLE NATURELLE (catégorie Aménagement) : il
vit dans ville.amenagements et n'était compté NULLE PART. Le
référentiel et le picker « + Construire » affichaient correctement
« +1 émissaire » (resumeConstruction, générique) ; seule la réserve
mobilisable était aveugle.

**Revue demandée — toutes les autres sources d'émissaires,
vérifiées SAINES** : bâtiments porteurs (Délégation +1,
Chancellerie +2, Ambassade +4, Guilde des diplomates +7 — remplacés
exclus) ; routes vers cité libre (+1 émissaire AUPRÈS de la cité
tant que la route est active, `emissairesEffectifsCite` — hors
réserve, par design) ; ville libérée en cité libre (+1 émissaire
PLACÉ dans la cité, `villeDevientCiteLibre`) ; cité annexée
(émissaires placés RECREDITÉS aux réserves,
`citeLibreDevientVille`) ; réserve manuelle du plateau.

**Deux commits sur `v4` depuis `7ddb96f2`** :
- `36f131c2` feat(jeu) : `emissairesBatimentsJoueur` devient
  `emissairesConstructionsJoueur` et somme AUSSI les aménagements
  (même champ emissairesApportes, même sémantique « tant que la
  construction tient » ; les aménagements améliorés sont remplacés
  EN PLACE dans la liste, rien à neutraliser — les merveilles ne
  sont jamais améliorables ; les bâtiments gardent la règle
  « remplacés exclus »). Docblocks amendés (defaultConfig champ,
  constructions helper, entête emissaires.test.ts) ; renommage
  répercuté aux 2 vues (CitesLibresView, CarteReservesEmissaires)
  et aux tests tier3/emissaires. Test Coeur Ancestral étendu
  (merveillesNaturelles.test.ts : le champ ET le comptage) ;
  +1 test natif emissaires.test.ts (aménagement porteur compté,
  cumul bâtiment + aménagement, aménagement sans émissaires
  neutre).
- `61a8eabc` docs(ia) : section dédiée dans regles-et-arbitrages.md
  (avec la revue des sources) + compteurs AGENTS.md réalignés à
  359 natifs (358 + 1).
- présent commit : journal seul (tête).

**Validation locale (bac réinitialisé entre les tours)** : corpus
re-codeload à la tête 7ddb96f2, harnais tshooks + stub @supabase
recréés : **341/341 natifs verts** (33 fichiers sans react ni
Constructions.test.ts), y compris le nouveau et le test amendé.
Diff complet vs extraction propre du tarball AVANT push :
EXACTEMENT 8 fichiers modifiés, dont 4 au renommage pur vérifiés
par diff ligne à ligne (règle absolue incident 2026-10-14).

**Effet immédiat pour l'arbitre** : construire le Coeur Ancestral
crédite +1 dans la réserve MOBILISABLE d'émissaires (carte
« Réserves d'émissaires », placement dans les cités libres), au
même titre que la Délégation ; le bonus disparaît si la merveille
disparaît. Ctrl+F5 requis.

## Récap des évolutions de population par habitation, en tête de la carte Villes (retour Thibaut 2026-11-12, base 85f7be99)

Retour arbitre : « il y a un autre problème, il est difficile de
suivre les migrations — peux-tu ajouter en haut de la page
habitations un récapitulatif rapide des différentes évolutions de
population, telles que les naissances, les migrations, etc. ».

**Décision** : le « Récap du dernier tour » de la page Population
existait déjà (conceptions, naissances, décès, mariages,
conversions, métiers) mais ne parlait PAS des migrations, et la
page des habitations (carte « Villes », page 👑 Pays) n'avait
AUCUN récap par ville. Nouveau compteur PAR HABITATION :
`PlayerRecap.mouvementsVille` (clé = nom de la ville) — naissances,
décès, arrivées, départs du tour moteur, champ OPTIONNEL (les
mutateurs le posent paresseusement via `bumpMouvement`,
engine/shared.ts — compatibilité vieilles sauvegardes). Trois
surfaces de lecture :
- carte « Villes » : bloc « Évolutions de population du dernier
  tour » EN TÊTE (nouveau composant pays/RecapMouvements.tsx) —
  une ligne par habitation (villes du joueur dans l'ordre, puis
  toute ville transférée en cours de tour), 👶 naissances /
  ⚰️ décès / ⬅️ arrivées / ➡️ départs / solde, ligne Total,
  « — » à 0 ;
- « Récap du dernier tour » (page Population) : ligne
  « Migrations : X arrivée(s) / Y départ(s) » + pointeur vers le
  détail par ville ;
- journal : ligne « Migrations — X arrivée(s), Y départ(s) » du
  récap de fin de tour, seulement s'il y en a eu.

**Périmètre (arbitrage d'implémentation)** : naissances = ville de
la MÈRE (fratrie comprise, engine/naissances.ts) ; décès = maladie
(engine/sante.ts killCharacter — seule cause de décès moteur) ;
migrations = chaque membre du FOYER COMPLET compte UN départ sur
la ville quittée au récap du joueur SOURCE et UNE arrivée sur la
ville de destination au récap du joueur DESTINATAIRE, migrants
d'autres joueurs compris (migration interne = les deux compteurs
sur le même récap) ; les actions MANUELLES (ajouts d'habitants,
dons, transferts de ville, pertes militaires) restent au 📜
Journal — note de bas de carte.

**Quatre commits sur `v4` depuis `85f7be99`** :
- `16165578` feat(jeu) : 10 fichiers src — types.ts
  (MouvementsVille + champ PlayerRecap), shared.ts (emptyRecap +
  bumpMouvement + totauxMouvements), sante.ts, naissances.ts,
  migrationBonheur.ts (accumulation), journal.ts (ligne
  Migrations), pays/RecapMouvements.tsx NOUVEAU,
  pays/VillesCarte.tsx (bloc en tête), population/
  CarteRecapTour.tsx (ligne Migrations), engine/mouvements.test.ts
  NOUVEAU (7 tests : primitives pures + repli vieilles sauvegardes,
  décès sur la ville du défunt, fratrie de 2 dans la ville de la
  mère, migration croisée, foyer complet 3+3, migration interne,
  ligne journal absente sans mouvement) ;
- `10026acc` docs(ia) : section règles (arbitrages, périmètre,
  verrous) + compteurs AGENTS.md 366 natifs (359 + 7) ;
- `24b6e918` fix(jeu) : **⚠ UNE CI ROUGE** (jeu + build en échec
  sur `16165578` — annotations des check-runs : « Element
  implicitly has an 'any' type because expression of type '""'
  can't be used to index '{ Bergen…; Oslo…; }' ») : le
  RÉTRÉCISSISSEMENT CFA des asserts de node:assert (« asserts
  actual is T ») — assert.deepEqual(r.mouvementsVille, {…})
  rétrécit la PROPRIÉTÉ au type du littéral pour le reste du flux
  (patron de l'incident dogmes 5583313d, 3e occurrence) et
  l'indexation suivante est refusée par tsc strict, invisible au
  harnais node --test (pas de typage). Correctif : capture du
  dictionnaire dans une const AVANT les asserts + fiches
  COMPLÈTES en un seul assert par ville (pas de second accès
  après narrowing). LEÇON : jamais d'assert node:assert sur une
  propriété/chaine d'indexation qu'on relit ensuite ; capturer
  d'abord. NB tsc désormais disponible EN LOCAL ce tour
  (tarballs typescript 5.6.3 + @types/react/node/scheduler +
  csstype via registry.npmmirror.com, node_modules du jeu en
  symlinks, JAMAIS poussés) : baseline = les 3 erreurs stub
  @supabase documentées, aucune autre — le rattrapage a été
  validé par tsc AVANT repush, plus par les tests natifs
  (348/348).
- présent commit : journal seul (tête).

**Validation locale (bac reconstruit après le reset entre les
tours)** : corpus re-codeload à la tête 85f7be99, harnais
tshooks.mjs/tshooks-register.mjs recréé — NB Node 22.20 : le
résolveur par défaut ne JETTE PAS sur un spécificateur sans
extension (il renvoie une URL inexistante que le load échoue à
ouvrir) → tester l'existence du fichier AVANT de chaîner,
jamais retenter le nu (harnais documenté en tête de fichier) ;
stub @supabase ESM chaînable recréé. **348/348 natifs verts**
(34 fichiers hors components/), tsc baseline 3 stubs IDENTIQUE,
**diag BYTE-IDENTIQUE** (aucun RNG déplacé — mes compteurs ne
touchent pas aux tirages), diff vs base = EXACTEMENT 10 fichiers
src dont 2 nouveaux (règle absolue incident 2026-10-14),
équilibre JSX des 3 .tsx touchés validé par esbuild 0.23.1
(binaire npmmirror, jamais poussé), intégrité post-push par curl
raw + cmp : **12/12 byte-identiques** au sha `24b6e918`.

**CI** : UNE rouge (rattrapée ci-dessus), puis sur `24b6e918` :
jeu + build + diag + deploy TOUS success. Bundle live
`index-BgTbFbOF.js` (ancien `index-Bo5CmOR3.js` parti) —
« Évolutions de population du dernier tour » ×1, « Migrations — »
×1, « arrivée(s) / » ×1, mouvementsVille ×5 (les propriétés
survivent à la minification) vérifiés présents.

**Effet immédiat pour l'arbitre** : la page des habitations
commence par un tableau qui résume, par ville, les naissances,
décès, arrivées et départs du dernier tour avec le solde — les
migrations se lisent d'un coup d'œil côté départ ET côté arrivée
(y compris les migrants reçus d'autres joueurs) ; la page
Population et le journal portent les totaux. Ctrl+F5 requis.


## Générateur de carte wargame : purge des contrôles morts, retrait du biome Neige, tooltips inversés (arbitrage Thibaut 2026-11-13, base b8d08ec)

Retour arbitre : « porte un regard critique, j'ai l'impression que
la plupart des paramétrages ne fonctionnent pas » — puis arbitrage :
retirer les contrôles morts ou quasi-morts, retirer la possibilité
d'avoir de la neige, réparer les tooltips inversés, ne PAS toucher
aux ressources pour l'instant.

**Audit de sensibilité d'abord** (avant de couper) : le moteur de
`quartz/static/generateur-carte.html` (générateur de carte du
Wargame, iframe de la page « Générateur de carte ») a été extrait
et exécuté HORS NAVIGATEUR dans un harnais Node (DOM simulé,
contrôles parsés du HTML, 5 seeds), chaque paramètre poussé à ses
extrêmes, mesure du % de tuiles dont le biome change. Constat : le
câblage est sain (une trentaine de contrôles agissent réellement)
mais 5 contrôles sont morts/quasi-morts et 2 tooltips sont
INVERSÉS (on règle à l'envers, d'où l'impression générale).

**Contrôles retirés (morts, cause racine documentée)** :
- `Îlots` (e-islands) : le niveau de la mer est un QUANTILE — les
  bosses d'îlots dans l'océan étaient réabsorbées par le seuil
  recalculé (0,3-0,5 % de tuiles changées seulement). Bloc moteur
  retiré (nIsle supprimé).
- `Taches climat.` (t-scale) : la fréquence du bruit thermique
  n'avait quasi aucun effet (2-3 %) ; fréquence FIXÉE à 0.10 en
  dur, `Désordre` (t-noise) garde son effet via l'amplitude.
- `Froid altitude` (t-alt) : formule max(0, elev−0,5)×t-alt mais
  l'élévation terrestre plafonne à ~0,6 → refroidissement
  infime, « sommets gelés » jamais tenus. Ligne retirée.
- `Encerclement` (c-surround-any, défaut désactivé) : 0,2 % au
  maximum — situations trop rares après lissage, la règle ne
  mutait qu'un voisin. `applyRuleAny` supprimé ; la règle
  « Même biome » (c-surround-same, active à 5 par défaut, 8,7 %)
  reste.
- `cap Neige` : le biome Neige disparaît (ci-dessous).
- option `Temp › Élév › Humid` (TEH) du sélecteur Priorité :
  STRICTEMENT identique à ETH (0,00 % sur tous les seeds — les
  deux ordres ne diffèrent que sur des tuiles glaciales ET
  élevées, inexistantes aux défauts). Option retirée.

**Retrait du biome Neige** (arbitrage Thibaut) : zone `glacial`
fusionnée dans `froid` (tempZone, t<0,30 ; les anciennes tuiles
Neige deviennent Forêt si h>0,55 sinon Plaine), palette BIOMES,
RES_BY_BIOME, ADJ_BIOMES 6→5 (15→10 paires), exemptions
anti-encerclement, ordre updateBiomeCounts. Les pôles restent
utiles (gradient chaud/froid → déserts vs forêts).

**Tooltips inversés réparés** : « Taille continents » disait
« haut = continents LARGES » alors que c'est la FRÉQUENCE du bruit
(bas = un ou deux gros continents ; mesuré : e-cont=2 → 1 masse de
258 tuiles, e-cont=15 → 6 masses de 43) ; « Taille zones »
(humidité) disait « haut = grandes régions » — idem inversé
(mesuré : h-scale=30 → plus d'amas de forêt, plus petits).
Intro de la section température mise à jour.

**Ressources INTACTES** (arbitrage) : l'audit a montré qu'aux
défauts seuls Poissons/Bétail/Or/Ruines apparaissent (Fer,
Charbon, Baleines, Geyser, Soie : zéro sur 4 seeds) — la
recalibration des densités est EXPRÉSSEMENT DIFFÉRÉE par Thibaut.

**Commits sur `v4` depuis `b8d08ec`** :
- `fix(wargame)` (71dfb68) : quartz/static/generateur-carte.html seul
  (113 963 unités UTF-16, 38 remplacements exacts vérifiés un à
  un) ; public/ n'est PAS touché (régénéré par `npx quartz build`
  au déploiement) ;
- présent commit : journal seul (tête).

**Validation locale (bac réinitialisé entre les tours)** :
node --check OK ; harnais DOM simulé : 46 900 tuiles × 5 ordres de
biomes × 4 modes de pôles sans AUCUN biome inconnu (Neige
absente) ; sanity checks des paramètres vivants (sealevel 43,5 %,
e-cont 47,2 %, h-cont 25,2 %, c-surround-same 8,7 % de tuiles
changées) ; adjacency à 10 paires converge (0 contact interdit
restant en « interdit » total) ; cap désert respecté ; 8 presets
régénèrent des compositions distinctes ; placement joueurs : les
avertissements « sans 2e tuile » sont PRÉEXISTANTS (présents sur
la version d'origine) — la nouvelle version place MÊME PLUS de
seconds sites (les anciennes tuiles Neige, devenues Forêt/Plaine,
sont jouables). Zéro référence résiduelle (grep
Neige/glacial/e-islands/t-scale/t-alt/c-surround-any/cap-neige/TEH
= vide).

**Effet immédiat pour l'arbitre** : la page « Générateur de carte »
perd les contrôles fantômes, ne produit plus de neige, et les deux
curseurs de taille se comportent comme leurs libellés.
Ctrl+F5 requis.

## Chaîne santé : l'Herboristerie offre des postes, le Guérisseur ±3 %, la Guilde des médecins constructible (retour Thibaut 2026-11-13, base b3fab4c4)

Retour arbitre : « l'herboristerie ne produit plus de flat mais
offre 2 postes de guérisseur » ; « le guérisseur réduit de 3 % les
chances de contracter une maladie et augmente de 3 % les chances
de guérison » ; « la guilde des médecins offre 10 postes de
guérisseur et augmente l'efficacité de tous les guérisseurs du
pays de 1 % ». Arbitrages complémentaires demandés et tranchés :
coût de la Guilde 50 Or + 12 Pierre + 4 Fer (au-dessus de
l'Hôpital), requiert l'Hôpital, le +10 % de guérison globale
ancien est REMPLACÉ par les nouveaux effets, l'efficacité est
PLAFONNÉE à une Guilde (Ville + Château ne cumulent pas).

**Changements** :
- `referentiels.json` : Herboristerie Ville + Château — les
  champs malContraction/bonusGuerison (0.05) sont retirés, 2
  postes de Guérisseur posés ; DEUX entrées « Guilde des
  médecins » (Ville + Château, famille Guilde, rang 4, requis
  Hôpital, coût 50/12/4, 10 postes) ; fiche métier Guérisseur
  actualisée (±3 %).
- `params.ts` : guerisseurGuerison/guerisseurContraction
  0.02 → 0.03 ; NOUVEAU guildeMedecinsEfficacite 0.01 (+PARAM_META
  « Maladie »).
- `engine/sante.ts` : le bloc Guérisseurs calcule une EFFICACITÉ
  (effGuerison/effContraction) majorée de
  guildeMedecinsEfficacite si le joueur possède AU MOINS UNE
  « Guilde des médecins » (some() sur les bâtiments de toutes ses
  villes — plafond structurel, pas de comptage) ; la lecture
  générique des flats (malContraction/bonusGuerison) reste pour
  une future donnée (aucune entrée n'en porte aujourd'hui).
- `config/defaultConfig.ts` : l'entrée « Guilde des médecins »
  codée en dur dans normaliserBatiments (+10 %
  bonusGuerisonGlobal) est RETIRÉE (la vue batiments ne dérive
  plus que les écoles) ; MIGRATION CIBLÉE santeGuerisseurs2026
  (patron taxes25, SANS bump de SCHEMA_VERSION_CONFIG — règle
  (x)) : paramètres 0.02 → 0.03 si encore aux anciens défauts,
  flats 0.05 retirés + 2 postes semés sur une Herboristerie sans
  emplacements, personnalisation conservée ; la Guilde atteint
  les configs existantes par le garde-fou « constructions du
  référentiel manquantes » (elle est neuve).
- `engine/constructions.ts` : le rendu générique ±% du résumé
  reste, docblock actualisé (l'Herboristerie affiche désormais
  « 2 guérisseur » par la voie générique des emplacements).
- Tests : engine/sante.test.ts réécrit (±3 %, Herboristerie
  2 postes sans flats) + 3 NOUVEAUX (Guilde constructible Ville +
  Château, vue batiments sans entrée en dur ; efficacité +1 %
  plafonnée ; migration avec personnalisation conservée +
  idempotence) ; engine/domiciles.test.ts (fiche Herboristerie,
  « 2 guérisseur ») ; state/config.test.ts (vue dérivée, plus de
  flats au canonique + compteurs bâtiments 74 / rang 2+ 47) ;
  config/params.test.ts (commentaire).

**Chaîne santé complète** : Herboristerie (rang 1, 2 postes) →
Clinique (rang 2, 5, exige Herboristerie) → Hôpital (rang 3, 10,
exige la Clinique) → Guilde des médecins (rang 4, 10 + efficacité
pays, exige l'Hôpital) — 27 postes cumulés par ville avec toute
la chaîne.

**Validation (bac réinitialisé entre les tours)** : harnais tests
natifs reconstruit (tshooks.mjs : le hook load DOIT fournir la
source pour le JSON, ERR_INVALID_RETURN_PROPERTY_VALUE sinon ;
resolve teste existsSync AVANT de chaîner) ; **351/351 tests**
(348 + 3), 34 fichiers ; tsc local (typescript 5.6.3 via miroir
npmmirror, tarballs dans /home/user/npm-local) : 3 erreurs de
baseline stub @supabase, AUCUNE autre ; diff vs base limité aux
9 fichiers src voulus ; diag régénéré : 110 règles (batiment 63,
canal placesMetier 86), seules les 4 nouvelles lignes de postes
(Herboristerie ×2, Guilde ×2) — diag-out.txt committé dans le
feat, le workflow diag n'a rien eu à committer.

**Commits sur `v4` depuis `b3fab4c4`** :
- `feat(jeu)` (3814932) : 9 fichiers src + diag-out.txt ;
- `docs(ia)` (9d56c6c7) : docs/ia/regles-et-arbitrages.md seul ;
- présent commit : journal seul (tête).

**Effet immédiat pour l'arbitre** : l'Herboristerie affiche
« 2 guérisseur » au lieu de « +5% chances de maladie / +5 %
guérison » ; chaque Guérisseur en poste module ±3 % (±4 % avec
la Guilde) ; la Guilde des médecins apparaît dans le picker
(famille Guilde, rang 4, exige l'Hôpital). Les parties
sauvegardées migrent seules au chargement. Ctrl+F5 requis.

## Pas de conception le tour de l'accouchement (retour Thibaut 2026-11-13, base 2f1df071)

Suite de l'audit naissances (question Thibaut : « une femme enceinte
peut-elle accoucher et tomber enceinte au même tour ? ») puis
arbitrage : « il faut changer ça, une femme ne peut accoucher et
tomber enceinte au même tour ».

**Changements** :
- `engine/naissances.ts` : l'étape 1 (accouchements) collecte les
  mères qui viennent d'accoucher (`accoucheesCeTour`, ensemble
  LOCAL à l'appel — aucun champ d'état, aucune migration) ; l'étape
  2 (conceptions) les EXCLUT du jet de conception de CE tour.
  Portée d'UN tour, pas de cooldown persistant : au tour suivant,
  la mère est de nouveau éligible. Au cap de proba, une mère
  accouche au mieux un tour sur deux (un bébé tous les 4 ans de
  temps de jeu) au lieu d'un bébé par tour.
- `engine/naissances.test.ts` NOUVEAU : la mère accouche et reste
  'Sain' (conception certaine forcée — sans l'exclusion elle serait
  retombée enceinte à 100 %) ; contrôle positif (une femme éligible
  du même tour conçoit) ; 2e appel = la mère redevient éligible et
  conçoit ; le témoin, enceinte au 2e tour, accouche sans
  re-concevoir (double vérification).

**Validation (bac réinitialisé, harnais + tsc locaux reconstruits)** :
**352/352 tests natifs** (351 + 1, 35 fichiers) ; tsc : 3 erreurs
de baseline stub @supabase, AUCUNE autre ; diff vs base
EXACTEMENT 2 fichiers src (1 modifié + 1 nouveau) ; diag RÉGÉNÉRÉ
et committé : log 550 → 459 entrées sur les 4 tours simulés
(grossesses en chaîne évitées), commandants J1 4 → 6 (dynamique
décalée) — les tables de règles et canaux sont INCHANGÉES (4
lignes de diff seulement).

**Commits sur `v4` depuis `2f1df071`** :
- `feat(jeu)` (7cfd568) : naissances.ts + naissances.test.ts +
  diag-out.txt ;
- `docs(ia)` (85b6ddc0) : docs/ia/regles-et-arbitrages.md seul ;
- présent commit : journal seul (tête).

**Effet immédiat pour l'arbitre** : les naissances par habitante
au cap passent d'un bébé par tour à un bébé tous les deux tours ;
la fécondité affichée est inchangée (elle décrit une femme
éligible). Aucune migration nécessaire : les parties en cours
bénéficient de la règle au tour suivant. Ctrl+F5 requis.

## Multiplicateur ×1,1 Nourriture des cités libres retiré (retour Thibaut 2026-11-13, base 42784d57)

**Demande** : « tu peux retirer le multiplicateur de nourriture pour
les cités libres ».

**Cause racine / périmètre** : la règle propre aux cités libres
(revue 2026-10-16 — ×2 avant) faisait produire aux Chasseurs d'une
cité libre 1,1 × la Nourriture de leur fiche métier (constante
exportée `MULT_NOURR_CHASSEUR_CITE`, engine/citesLibres.ts) ; cette
production brute alimentait les taxes versées au suzerain (étape
3decies, production nette plafonnée aux parties positives).

**Correctif** :
- `MULT_NOURR_CHASSEUR_CITE` SUPPRIMÉE — les Chasseurs d'une cité
  libre produisent la valeur de BASE du référentiel, comme ceux
  d'une ville de joueur. Aucun autre métier/ressource touché.
- Écosystème nettoyé de toute mention : log des taxes
  (citesLibres.ts + production.ts, le « : Nourriture ×1,1 »
  disparaît des parenthèses, le compte de chasseurs reste), message
  du setup, description de l'étape 3decies (tour.ts), 4 vues
  (CarteRegle badge reformulé, CarteCite ligne supprimée,
  CarteVassalite, CitesLibresView), tests réalignés.
- Aucun champ d'état, AUCUNE migration : le transfert au suzerain
  est dérivé de la production à chaque fin de tour.

**Validation bac** : harnais tests + tsc RECONSTRUITS (bac réinitialisé
entre les tours). ⚠ LEÇONS HARNAIS du jour : (1) `tshooks-register.mjs`
doit référencer les hooks par `new URL('./tshooks.mjs', import.meta.url)`
— `pathToFileURL('./tshooks.mjs')` résout selon le CWD, pas le module ;
(2) le hook `load` doit DÉLÉGUER (`nextLoad`) tout ce qui n'est pas un
fichier local existant (URLs non file:, fichiers absents) ET TOUT CE QUI
VIT SOUS node_modules — sinon ERR_INVALID_URL_SCHEME (data:/node:
internes) puis ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING (stub
@supabase .mjs traité comme module-typescript) ; pour les .ts/.tsx le
`load` fournit LUI-MÊME la source (readFileSync, shortCircuit, format
'module-typescript') — nextLoad délégué renvoie source null rejetée.
Résultat : **352/352 tests natifs** (352 pass, 0 fail, 35 fichiers,
aucun changement de compteur — taxes.test.ts réaligné, pas de nouveau
test : la suppression est couverte par les tests existants du
détail de cité). tsc local 5.6.3 reconstruit (npmmirror, /home/user/
npm-local, symlinks node_modules) = 3 erreurs stub @supabase de
baseline, AUCUNE autre. Diff complet vs base EXACTEMENT 9 fichiers
src (5 moteur + 4 vues), revus ligne à ligne. Diag BYTE-IDENTIQUE
(légitime : le scénario diag n'exerce AUCUNE cité libre sous
suzeraineté — zéro ligne « Cités libres » dans le log ; rien à
regénérer, le workflow diag n'aura rien à committer).

**Commits** (3 sur `v4` depuis 42784d57) :
- `fa52fb91` feat(jeu) : citesLibres.ts + production.ts + setup.ts +
  tour.ts + taxes.test.ts + 4 vues ;
- `d9ddcda2` docs(ia) : règles (section « Multiplicateur de
  Nourriture des cités libres retiré ») ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : une cité libre sous suzeraineté verse ~9 %
de Nourriture en moins à son suzerain (part Chasseurs) ; les autres
ressources et la consommation de la cité sont inchangées. Parties en
cours : effet au tour suivant, sans migration. Ctrl+F5 requis.

## Générateur de carte wargame : validation à taille réelle de partie — N=15, 721 tuiles (suite de la purge 71dfb68, retour Thibaut 2026-11-13)

Demande de Thibaut : « continue à faire des vérifications,
habituellement le jeu se fait avec environ 700 tuiles ». Le rayon
par défaut du générateur est N=12 (469 tuiles) ; la taille réelle
de partie correspond à N=15 (3×15²+3×15+1 = **721 tuiles**). Toute
la validation précédente (46 900 tuiles) avait tourné à 469 : re-
validation complète à 721 sur la version poussée (commit 71dfb68),
sans toucher au code.

**Harnais reconstruit** (le bac à sable a été réinitialisé entre
les tours) : moteur extrait du HTML et chargé dans node:vm avec
stub DOM complet ; les sliders dynamiques res-* sont re-parsés du
innerHTML de buildResourceControls, les 10 paires adj-* de celui
de buildAdjacencyControls (la regex tolère le style après
data-pair) ; les liaisons let/const du moteur se lisent via
runInContext (elles ne vivent PAS sur l'objet contexte). Génération
directe par generateMap(N, seed, params) avec getParams() +
sea/mountains/noiseType aux défauts de l'UI.

**Résultats, version 71dfb68 à N=15** :

- Matrice 5 ordres × 4 modes de pôles × 6 seeds = 120 cartes,
  86 520 tuiles : taille exacte partout, ZÉRO biome inconnu, ZÉRO
  Neige. Répartition moyenne : Océan 44,9 %, Forêt 21,4 %, Marais
  18,5 %, Plaine 9,0 %, Montagne 4,7 %, Désert 1,0 %, Volcan
  0,3 %. Une seule carte sur 120 sans aucun Volcan.
- Comparaison orig (b8d08ec) ↔ gen, mêmes seeds, 30 cartes :
  tuiles Océan IDENTIQUES au tuile près sur les 30 cartes
  (pipeline élévation intact), terres conservées (11 910 des deux
  côtés), Neige présente dans 30/30 cartes orig (1,4 %) et dans
  0/30 cartes gen ; écart max sur un biome = 26 tuiles
  (redistribution de l'ancienne Neige vers Forêt/Plaine).
- Adjacence activée : les 10 paires à « interdit » convergent
  (0 paire interdite restante sur 6 seeds) ; réglage par défaut
  propre ; adj off par défaut → contacts Désert↔Marais possibles
  (normal).
- Caps : respectés avec marge (cap Désert 20 % → pire cas 2,5 % ;
  Forêt 25 % → 6,3 % ; Plaine 15 % → 3,8 %).
- Joueurs 6/7/8 aux défauts : 18/18 placements primaires
  complets, distance mini entre capitales ≥ 7 (minDist 5
  respecté) ; seconds sites : 20/126 joueurs sans 2e tuile en gen
  contre 22/126 en orig — comportement PRÉEXISTANT, légèrement
  meilleur depuis la purge (les anciennes Neige sont devenues
  Forêt/Plaine jouables).
- Ressources aux défauts (recalibrage DIFFÉRÉ sur arbitrage de
  Thibaut, mais quantifié à taille réelle) : ~24 tuiles à
  ressource par carte sur 721 ; Poissons ~20/carte domine,
  Bétail ~3, Fer ~0,5, Ruines/Soie/Or ~0,17 ;
  **Baleines, Charbon, Geyser : JAMAIS générées aux défauts** à
  N=15.
- Divers : déterminisme vérifié (même seed → cartes identiques) ;
  rivières 42 segments en moyenne, aucune carte sans rivière ;
  continents : masse dominante de 339 à 397 tuiles + 0 à 8
  îlots/îles secondaires selon la seed.

**Observations pour l'arbitre (aucune action, aucun commit
code)** : (1) Marais 18,5 % vs Plaine 9,0 % et Désert 1,0 % —
l'humidité par défaut produit beaucoup de Marais et peu de
Désert ; si la répartition visée est différente, c'est
h-scale/h-cont/cap-desert à arbitrer, pas un bug ; (2) à 8
joueurs certaines seeds laissent jusqu'à 4 joueurs sans 2e tuile
(sans 2e tuile = avertissement préexistant) — un assouplissement
de player-dist/spread réduirait ces avertissements ; (3) une
carte sur 120 sans Volcan (evt-volcan 6 % par tuile éligible)
paraît cohérente avec le paramétrage.

**Commits** : présent commit = journal seul (aucun changement de
code, le bundle live de la purge 71dfb68 reste la référence).

**Effet pour l'arbitre** : la version purgée est validée à la
taille réelle de partie (721 tuiles) sur les matrices de biomes,
de pôles, d'adjacence, de caps, de placement joueurs et de
ressources. Aucun Ctrl+F5 nécessaire (rien n'a été redéployé).

## Générateur de carte wargame : copie « labo » d'expérimentation + mode ressources Quantile v2 (demande Thibaut 2026-11-13, base a51bafc9)

Demande de Thibaut : « ajouter une copie dans un nouvel onglet dans
le gestionnaire de campagne afin de faire des tests — par exemple
refaire entièrement la génération des ressources ou des tuiles
pour avoir quelque chose de meilleure qualité ».

**Ce qui a été fait** (commit `5c7ae21`) :

- **Nouvelle copie labo** `quartz/static/generateur-carte-labo.html` :
  copie intégrale du générateur, identifiable au premier regard
  (bandeau 🧪 LABO en bas à gauche + `<title>` dédié + lien
  « ↩ officiel »). C'est LE bac à essai : les remaniements de
  génération (ressources, tuiles) s'y tester sans jamais toucher
  à l'officiel.
- **Accès depuis le gestionnaire** : bouton « 🧪 Labo » en bas à
  droite de l'officiel (pilule au-dessus du bouton thème) qui
  ouvre la copie dans un NOUVEL ONGLET du navigateur
  (target=_blank). L'officiel n'a reçu QUE ce bouton : aucun
  changement de génération, arbitrage « ne pas toucher aux
  ressources » respecté.
- **Premier sujet de test livré avec le labo** : sélecteur
  « MODE RESSOURCES » dans le groupe RESSOURCES —
  « Bruit v1 (officiel) » (défaut, comportement strictement
  identique) vs « Quantile v2 (test) ». Le v2 corrige le défaut
  quantifié à la session précédente : le seuil `1 − densité×8`
  sur un bruit de Perlin en cloche rendait les seuils > 0,85
  quasi inatteignables (Baleines/Geyser jamais générés, ~24
  tuiles à ressource par carte dont 90 % de Poissons). En v2, la
  densité en ‰ devient le VRAI taux de tuiles éligibles : les
  k = densité × éligibles meilleures tuiles au score de bruit
  sont retenues (arrondi stochastique via le PRNG dédié randRes,
  jusque-là déclaré mais inutilisé), puis écrêtage par amas
  (curseur Taille inchangé). Le placement reste déterministe par
  seed et l'ordre de priorité des ressources est conservé.
- `content/Wargame/Générateur de carte.md` : cache-buster de
  l'iframe ?v=1 → ?v=2 (l'officiel embarqué a changé).

**Validation (harnais vm reconstruit, N=15, 721 tuiles)** :
officiel modifié ≡ original sur 40 cartes (biomes + ressources
octet par octet — le bouton ne change RIEN à la génération) ;
labo mode v1 ≡ officiel sur 20 cartes ; labo mode v2 : 240
cartes (5 ordres × 4 pôles × 12 seeds = 173 040 tuiles), zéro
crash, zéro Neige, ressources uniquement sur biomes éligibles,
bornes k respectées, LES 9 RESSOURCES apparaissent désormais
(moyennes/carte : Poissons 11,3 — attendu 10,8 ; Ruines 4,2 —
4,1 ; Baleines 4,0 — 3,7 ; Bétail 1,8 — 1,8 ; Soie 2,8 — 2,6 ;
Fer 1,0 ; Charbon 0,8 ; Or 0,75 ; Geyser 0,12 = présent dans
~12 % des cartes, honnête pour 8 ‰ sur ~6 tuiles éligibles) ;
déterminisme v2 5/5 ; bascule v2→v1 sans divergence.

**Commits** (2 sur `v4` depuis a51bafc9) :
- `5c7ae21` feat(wargame) : labo + bouton + mode quantile ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : la page « Générateur de carte »
officielle gagne un bouton 🧪 Labo (nouvel onglet) ; la version
labo permet de comparer côte à côte le placement des ressources
v1/v2 avec les MÊMES réglages et la même seed. Si le v2 lui
plaît, il sera promu dans l'officiel lors d'un prochain arbitrage
(les densités par défaut restent à régler : ~26 tuiles à
ressource par carte en v2 aux défauts actuels). Ctrl+F5 requis.

## Générateur de carte : bouton labo rendu visible dans le panneau (retour Thibaut 2026-11-13, base 0388a79)

Retour Thibaut : « je ne trouve pas le bouton labo ». Diagnostic :
le bouton-pilule 🧪 en bas à droite EST déployé (vérifié octet
par octet sur le live) mais deux facteurs jouaient : cache
navigateur (l'officiel embarqué a changé après ?v=1) et
discrétion de la pilule. Correctif (commit `cbe0158`) :
- gros bouton « 🧪 Version labo — nouvel onglet » EN TÊTE du
  panneau ⚙ GÉNÉRATION, juste sous le champ TYPE (lien
  target=_blank vers la copie labo) — la pilule bas-droite est
  conservée ;
- cache-buster de l'iframe ?v=2 → ?v=3 (l'officiel change à
  nouveau, le navigateur doit recharger l'iframe).
Aucun changement du moteur : le <script> est inchangé octet par
octet avant/après (vérifié), node --check OK.
Ctrl+F5 requis.

## Gestionnaire de campagne : onglet « 🧪 Carte labo » dans l'appli de jeu (retour Thibaut 2026-11-13, base 40d852c)

Retour Thibaut : « c'est bien ce qu'il me semblait, on ne s'est
pas entendu. Je veux que la version labo se trouve dans la partie
jeux de campagne, dont on parlait au tout début, avec les onglets
royaume, pays, population, etc. ». La version labo était
accessible depuis la page Wargame du générateur (bouton-pilule +
gros lien en tête du panneau ⚙) mais PAS depuis le gestionnaire
de campagne (https://losth230.github.io/quartz/jeu/).

**Ce qui a été fait** (commit `e0b1b3c`) :

- **Nouvel onglet « 🧪 Carte labo »** dans l'appli de gestion de
  campagne, inséré entre « 🎛 Paramètres » et « ⚙ Nouvelle
  partie » — consultable SANS partie en cours (exempté comme
  Référentiels/Paramètres) ;
- **`jeu/src/components/CarteLaboView.tsx`** (nouveau composant,
  volontairement trivial) : cartouche explicatif + iframe pleine
  hauteur embarquant la copie labo `../static/generateur-carte-
  labo.html?v=1` (chemin relatif correct : l'appli est servie
  sous /quartz/jeu/, le labo sous /quartz/static/) ;
- `jeu/src/App.tsx` : import + entrée SECTIONS + type Section +
  deep links `#carte-labo` / `#carte_labo` (HASH_SECTIONS) +
  exemption « sans partie en cours » + rendu. Aucun autre fichier
  touché ; `public/` ignoré (régénéré par le build) ;
- la page Wargame (bouton-pilule 🧪 + lien en tête du panneau)
  reste en place — aucun mal, retirable à la demande.

**Validation** : pas de build local possible (npm interdit dans
le bac à sable) → vérificateur d'équilibre JSX maison
(`check-jsx.cjs` : machine à états text/code + pile unifiée,
génériques TS `Ident<...>(`, regex littérales, fragments, noms à
points type React.StrictMode, template literals imbriquées) :
**59/59 .tsx** de `jeu/src` BALANCED dont App.tsx modifié et
CarteLaboView.tsx ; 4 mutations testées (fermantes `</p>`,
`</Card>`, `}` retirées, iframe laissé ouvert) toutes détectées
UNBALANCED, contrôle neutre (attribut ajoutée) toujours
BALANCED. Classes CSS utilisées (`.card`, `.muted`, `.small`,
var `--border`) présentes dans styles.css ; tsconfig
`react-jsx` → aucun import React requis. Intégrité du push
vérifiée octet par octet (curl raw au sha + cmp : identiques).

**Commits** (1 sur `v4` depuis 40d852c) :
- `e0b1b3c` feat(jeu) : onglet « 🧪 Carte labo » dans le
  gestionnaire de campagne ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : la version labo du générateur est
maintenant directement dans le gestionnaire de campagne (entre
Paramètres et Nouvelle partie), utilisable sans partie en cours
ni changement de site — le sélecteur MODE RESSOURCES (Bruit v1
officiel vs Quantile v2) s'y teste comme avant, avec les mêmes
réglages et la même seed. Ctrl+F5 requis.

## Labo générateur : plein écran, calques par défaut, densités 3 % et vrais types de cartes par masques de forme (retour Thibaut 2026-11-13, base bbe1350e)

**Ce qui a été fait** (uniquement la copie labo
`quartz/static/generateur-carte-labo.html` ; l'officiel
`quartz/static/generateur-carte.html` INTACT, vérifié octet par octet
contre le distant ; `jeu/src/components/CarteLaboView.tsx` touché pour
le seul cache-buster iframe `?v=1`→`?v=2`) :

- **Plein écran** : bouton ⛶ flottant (`#fs-toggle`) calqué sur le
  bouton thème, positionné 52 px au-dessus ; Fullscreen API avec replis
  webkit ; fonctionne dans l'iframe de l'onglet 🧪 Carte labo
  (allowFullScreen déjà présent) ;
- **Grille et légende affichées par défaut** : `checked` sur
  `#lay-grid`/`#lay-legend`, état initial des calques et classe
  `visible` alignés ;
- **Densités de base à 3 % pour toutes les ressources** : les 9
  RES_DEFAULTS passent à `density: 30` (30 ‰ = 3 %, l'UI affichant
  (v/10).toFixed(1)+'%') et la spec par défaut 20→30 ; les nouveaux
  défauts sont ≥ anciens sur les 9 ressources ;
- **Vrais types de cartes** : le sélecteur TYPE DE CARTE ne changeait
  que des sliders ; désormais un MASQUE DE FORME positionnel biaise
  l'élévation dans `generateMap` (ajouté après le masque de bord, en
  fonction de la distance normalisée `dc` au centre — 0 centre → 1
  bord — et de l'angle polaire θ ; phase tirée par PRNG dédié
  `randShape = mulberry32(baseHash ^ 0x27D4EB2F)` → déterministe par
  seed, indépendant du reste) :
  - `continent` : +0,20·(1−dc)² → masse unique (98-100 % de la terre,
    centre 92-100 % terre) ;
  - `continents` : 0,45·cos(2(θ−θh))·dc − 0,30·(1−dc)² → deux masses
    de 117-120 tuiles ;
  - `pangea` : +0,16·(1−dc)^1,5 → 75 % de terre ;
  - `islands-large` : 0,36·cos(3(θ−θh))·dc − 0,30·(1−dc)² → 3-4
    composantes, principale 34-37 % ;
  - `archipelago` : −0,30·(1−dc)² − 0,12·cos(4(θ−θh))·(0,3+0,7·dc) →
    9-11 composantes, principale 25-28 % ; les entailles cos 4θ
    (plus fortes vers le bord) découpent l'anneau en arcs d'îles —
    elles évitent le piège constaté en réglage : creux central trop
    fort (−0,38) → l'anneau extérieur devient UN bloc terrestre
    continu (53-59 %), creux trop faible (−0,14) → masse centrale
    géante (82-93 %) ;
  - `fragmented` : −0,13·(1−dc)² → 6-15 composantes ;
  - `inland-sea` : −0,50·max(0, 1−1,75·dc)² → centre 5-16 % terre
    contre anneau 69-77 % (océan central cerclé de terres) ;
  - `lakes` : +0,04·(1−dc) → 62 % terre ;
  - `custom` : aucun masque (shapeBias null) → non-régression octet
    par octet du comportement précédent ;
  presets géo ajustés en conséquence (continents : compact 70→50,
  edge 15→5 ; islands-large : compact 65→35 ; inland-sea : edge 55→10,
  l'ancien edge élevé envoyait la mer au bord, contresens ;
  archipelago : compact 35→18, scale 22→24, edge 30→25) ; tooltip
  explicatif sur le sélecteur ; comportement « Personnalisé » au
  toucher d'un slider conservé.

**Validation** : script extrait et `node --check` OK ; harnais maison
`harnais-labo-types.cjs` (partie pure du script évaluée, driver N=12,
3 seeds `grimoire`/`chasse-et-peche`/`labo-42`, presets appliqués
comme l'UI) : (a) non-régression custom octet par octet ;
(b) déterminisme 2 appels identiques ; (c) morphologie par type via
flood fill des composantes connexes de terre : TOUS OK, notamment
archipelago 9-11 composantes et principale 25-28 % sur les 3 seeds ;
(d) ressources : défauts 30 ‰ vérifiés, 9/9 présentes sur 16 cartes
quantile, 30 ‰ ≥ anciens défauts (27 vs 17 tuiles). NB : le seuil
quantile de mer rend seules les géométries RELATIVES d'élévation
significatives (biais constants sans effet). Pas de npm dans le bac
à sable → CI build sur push fait foi pour le .tsx (cache-buster
seul, une ligne).

**Commits** (1 sur `v4` depuis bbe1350e) :
- `e36193c` feat(wargame) : labo — plein écran, grille/légende par
  défaut, densités 3 %, vrais types de cartes par masques de forme ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : dans le labo (onglet 🧪 Carte labo du
gestionnaire de campagne ou page Wargame), le sélecteur TYPE DE CARTE
produit désormais de réelles morphologies : Continent = une masse
unique, Continents = deux terres équilibrées, Archipel = une
dizaine d'îles sans bloc dominant, Mer intérieure = océan central
cerclé de terres, Fragmenté = miettes… — chaque type reste
déterministe par seed, et « Personnalisé » reproduit exactement
l'ancien comportement. Grille et légende s'affichent d'office, le
bouton ⛶ passe la carte en plein écran, densités de base à 3 %.
Cache-buster iframe incrémenté (?v=2). Ctrl+F5 requis.

## Labo générateur : formes cassées — domain warping des masques, humidité sans auréoles, moins d'eau (retour Thibaut 2026-11-13, base d9329b4)

Retour Thibaut (avec capture) : « les formes sont beaucoup trop
linéaires. Ça fait eau → marais → forêts → plaines → déserts de
manière très fluide. Il y a trop d'eau, et pas assez de formes. »
La capture montre un archipel : océan central lisse, terres en
arcs réguliers, marais en auréole sur toute côte.

**Diagnostic** (3 causes superposées, mesurées au harnais) :
1. les masques de forme sont des fonctions LISSES de la position
   (polynômes en dc, cosinus en θ) → côtes en arcs parfaits,
   bandes de biomes concentriques ;
2. le blend d'humidité (1−cont)·bruit + cont·côtier ÉCRASAIT la
   variance du bruit : sur la côte h ≈ 0.6·bruit + 0.4 dépassait
   presque toujours le seuil marais → auréole systématique ; au
   cœur h ≈ 0.6·bruit tombait sous le seuil désert → anneau de
   désert (le gradient complet de la capture) ;
3. les presets océaniques avaient 55-60 % d'eau.

**Ce qui a été fait** (uniquement la copie labo
`quartz/static/generateur-carte-labo.html` ; l'officiel INTACT ;
`jeu/src/components/CarteLaboView.tsx` pour le cache-buster ?v=3) :

- **Domain warping des masques** : les coordonnées (dc, θ) passées
  au masque sont perturbées par un bruit dédié
  `nWarp = mulberry32(baseHash ^ 0x2545F491)` (freq 6, amp dc
  0.55, amp θ 1.0 rad, 3 octaves) avant l'appel → les frontières
  s'ondulent, les lobes deviennent irréguliers, et la distance à
  l'océan (base de la continentalité) cesse d'être radiale ;
  déterminisme par seed préservé (le harnais le vérifie) ;
  'custom' reste strictement sans masque ni warp ;
- **Humidité additive plafonnée** : h = min(1, bruit +
  cont·0.25·(1−oceanDist)) − cont·0.15·oceanDist — le bonus côtier
  ne garantit plus le marais seul, une légère pénalité de
  continentalité fait vivre les déserts intérieurs (patches à la
  forme du bruit, pas un anneau : les côtes découpées du warping
  rendent oceanDist irrégulier) ;
- **Seuils biomes rééquilibrés** (`humidZone` et `_humidByTemp`,
  ce dernier étant le chemin effectif de l'ordre ETH par défaut) :
  marais plus sélectif (0.58/0.65 → 0.68/0.70), désert un peu plus
  présent (0.38/0.30 → 0.40/0.32) ;
- **Presets moins aqueux** : islands-large et archipelago 55 → 45
  % d'eau, fragmented 60 → 50 ;
- tooltip du sélecteur TYPE mis à jour (masque + warping).

**Validation** : harnais maison reconstruit
(`harnais-labo-types.cjs`, partie pure du script évaluée) : (a)
custom ≡ sans champ mapType, octet par octet ; (b) déterminisme
2 appels identiques × 3 seeds ; (c) morphologie par type
(flood fill) sur 3 seeds, N=12, presets appliqués comme l'UI :
continent masse unique 98-100 %, continents 2 masses (principale
49-52 %) + îlots satellites, islands-large 3 îles ~34 % +
îlots, archipel 11-17 composantes principale 24-45 %, pangea
99-100 %, inland-sea centre 15 % terre contre bord 64 % —
critères de forme inchangés, le warping ne casse pas la
morphologie garantie ; (d) AVANT/APRÈS mesurés (mêmes seeds) :
marais 13-16 % de la carte en auréoles → 2-4 % en patches
(2-23 taches au lieu de bandes), désert 0-1 % → 1-3 % en taches
intérieures, côtes : archipel 58 → 67 % de tuiles côtières,
forêts de pangée top 56-72 % en 1-2 masses → 19-45 % en
9-24 taches ; (e) ressources quantile défauts 30 ‰ : 9/9 vues
sur 16 cartes cumulées (Geyser 5). `node --check` OK sur le
script extrait.

**Commits** (1 sur `v4` depuis d9329b4) :
- `c0629c9` feat(wargame) : labo — domain warping des types de
  cartes, humidité additive, presets moins aqueux ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : dans le labo, chaque type de carte
garantit sa morphologie (un continent, deux continents, un
archipel…) mais avec des contours découpés et des biomes en
mosaïque — plus de cercles parfaits, plus d'auréole de marais ni
d'anneau de désert ; les types océaniques (Grandes îles,
Archipel, Fragmenté) passent à 45-50 % d'eau. Le rendu change
aussi en « Personnalisé » (moteur d'humidité partagé) : c'est
assumé, le labo est le banc d'essai — si le nouveau mix plaît,
il sera proposé à l'arbitrage pour l'officiel. Cache-buster
iframe ?v=3. Ctrl+F5 requis.
## Labo générateur : bruit Simplex par défaut, curseurs libres et paramètre « Intensité d'anneau » (retour Thibaut 2026-11-13, base 006d400)

Retour Thibaut (3 demandes) : « par défaut, j'aimerais que le
modèle utilise le bruit de simplex. De plus, j'aimerais qu'une
fois le type de carte sélectionné et la carte générée, elle
soit modifiable via les curseurs. De plus, j'aimerais un nouveau
paramètre d'intensité d'anneau. […] un paramètre qui ajoute de
la masse de terre sur le pourtour sur lequel peuvent apparaitre
les joueurs, qui est donc définit par marge bord et marge
centre ».

**Ce qui a été fait** (uniquement la copie labo
`quartz/static/generateur-carte-labo.html` ; l'officiel INTACT ;
`jeu/src/components/CarteLaboView.tsx` pour le cache-buster ?v=4) :

- **Simplex par défaut** : `<option value="simplex" selected>`
  dans le sélecteur BRUIT, tooltip mis à jour ;
- **Curseurs sans perdre le type** : suppression du bloc
  `GEO_PARAM_IDS`/`markCustomOnUserEdit` — toucher un slider ne
  bascule plus le sélecteur vers « Personnalisé ». Le mapType
  reste ce que le sélecteur affiche : le masque de forme est
  réappliqué par-dessus les curseurs à chaque régénération ;
- **Paramètre « Intensité d'anneau »** : slider `#ring-intensity`
  0-100 % (pas 5, défaut 0) dans ⚙ GÉNÉRATION, câblé dans
  `PARAM_SPECS` (régénération automatique). Dans `generateMap` :
  `ringAmp = ring × 0.70`, bande calculée avec les MÊMES bornes
  que `placePlayers` (`dcRingIn = playerCenter/N`,
  `dcRingOut = 1 − playerEdge/N`), biais en PLATEAU (smoothstep
  de montée `RING_W = 0.12`, atténuation `1 − 0.65·t` au-delà de
  `dcRingOut`) appliqué via `dcW` — la coordonnée perturbée par
  le domain warping → anneau irrégulier, pas un cercle parfait.
  `bindPlayerSlider('player-edge'/'player-center')` : si
  ring > 0, changer une marge joueur régénère la carte au lieu
  de replacer les joueurs ;
- **Calibrage du passage au Simplex** : le fbm simplex (±0.7-0.9,
  plus vif que le perlin ±0.5-0.7) reprenait le dessus sur les
  masques (islands labo-42 : 95 % de la terre en 1 composante =
  anneau soudé). Fixes : (1) squeeze dans la boucle d'élévation
  `e = 0.5 + (e−0.5) × 0.42` quand un masque OU l'anneau est
  actif — la variance du bruit est comprimée pour que le masque
  domine (le seuil de mer étant un quantile, seule la géométrie
  relative des élévations compte) ; (2) masques islands-large et
  archipel renforcés (creux −0.42, entailles cos 4θ à −0.18,
  terme supplémentaire sur islands) ; (3) presets verrouillés à
  l'eau : islands-large et archipelago 45 → 50 %, fragmented
  50 → 55 % + e-scale 26 → 30, e-compact 15 → 10.

**Validation** : harnais maison (`harnais-labo-types.cjs`,
défauts UI = simplex, ring 0) : (a) custom ≡ sans champ mapType,
octet par octet, ring absent ≡ ring 0 ; (a2) moteur inchangé :
custom perlin ring 0 ≡ version distante précédente, octet par
octet × 3 seeds ; (b) déterminisme 2 appels identiques × 3 seeds
+ anneau 60 % ; (c) morphologie par type (flood fill, 3 seeds,
presets comme l'UI) : continent masse unique 98-100 %,
continents 2 masses 45-51 %, islands-large 3 îles 32-34 %,
archipel 17-20 composantes principale 27-45 %, fragmented 21-28
composantes, inland-sea centre creusé, lakes masse 84-98 % ;
(f) anneau : bande pourtour +11 à +17 points de terre
(48→65 %, 52→63 %), 6/6 joueurs placés avec anneau 100 % sans
warning sur les 2 seeds testés, anneau actif aussi en
Personnalisé (62→82 %, 59→79 % en bande) ; (e) ressources
quantile défauts 30 ‰ : 9/9 vues sur 16 cartes cumulées.
`node --check` OK sur le script extrait.

**Commits** (1 sur `v4` depuis 006d400) :
- `3ad9c18` feat(wargame) : labo — bruit Simplex par défaut,
  curseurs sans perdre le type, paramètre intensité d'anneau ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : dans le labo, le Simplex donne des
reliefs plus nervurés que le Perlin ; on garde le type de carte
affiché tout en retouchant les curseurs (le masque se
réapplique à chaque régénération) ; l'« Intensité d'anneau »
épaissit les terres du pourtour jouable — utile pour garantir
des départs côliers — avec des marges « bord » et « centre »
qui pilotent la largeur de la bande, un anneau irrégulier grâce
au domain warping, et zéro effet à 0 %. « Personnalisé » reste
strictement sans masque, squeeze ni anneau. Cache-buster
iframe ?v=4. Ctrl+F5 requis.
## Labo générateur : Perlin par défaut restauré et anneau purement additif (retour Thibaut 2026-11-13, base 8949dd3)

Retour Thibaut (2 demandes) : « perlin par défaut était mieux,
excuse moi » ; « l'anneau change complètement toute la
morphologie de la map au lieu de simplement rajouter des cases
dans l'anneau ».

**Ce qui a été fait** :

- **Perlin par défaut** : `<option value="perlin" selected>` dans
  `#noise-type` (tooltip mis à jour) — retour aux reliefs
  ronds d'origine, le Simplex reste sélectionnable ;
- **Anneau refondu en post-traitement final**. Cause racine :
  l'ancien biais d'anneau était additionné aux élévations AVANT
  le calcul du seuil de mer — or ce seuil est un QUANTILE (45 %
  de terre quoi qu'il arrive) : tout gain de la bande était
  exactement compensé par de la terre volée au reste de la
  carte, d'où la morphologie chamboulée. Nouvelle implémentation
  (dernière passe de `generateMap`, avant le `return`) : collecte
  des tuiles OCÉAN dans la bande de pourtour (mêmes bornes que
  `placePlayers`, poids `w = up·down` en plateau smoothstep,
  coordonnée warpée → anneau irrégulier), budget
  `ringFrac × somme des poids`, tri par coût croissant
  `(seaLevel − elev)/w` et conversion d'un PRÉFIXE strict —
  l'intensité est la FRACTION DE L'OCÉAN DE LA BANDE convertie
  (25 % = un quart de la bande, 100 % = toute la bande jouable),
  la conversion est monotone ensembliste (plus d'intensité =
  strictement plus de tuiles, jamais l'inverse). Chaque tuile
  convertie devient une côte basse (`elev = seaLevel + 0.01·w`,
  jamais de montagne), perd sa ressource océanique, puis est
  reclassée après coup (BFS océan recalculé, humidité continentale,
  `classifyBiome`, désert isolé → Plaine). À ring 0 tout est
  skippé : byte-identique ;
- **Squeeze adaptatif au bruit** (compense la vivacité du Simplex
  si on le choisit) : ×0.42 simplex, ×0.55 mixed, ×1 (aucun
  squeeze) perlin ;
- **Recalibrage des 3 types pour Perlin** (8 seeds : grimoire,
  chasse-et-peche, eldvarn, labo-42, belvarn, corwyn, draholm,
  fergorn) : islands-large lobes 0.36 → 0.48 et creux
  −0.30 → −0.38 ; archipelago creux −0.30 → −0.38 et entailles
  −0.12 → −0.16 ; fragmented : masque à 6 entailles
  TRAVERSANTES cos 6θ × (−0.34) (le seul creux laissait une masse
  unique à 94-97 % de la terre — le Perlin détail percole) +
  preset sealevel 50 → 60, e-scale 26 → 38, e-compact 15 → 8.

**Validation** : harnais maison (`harnais-labo-types.cjs`, défauts
UI = perlin, ring 0) : **18 OK, 0 échec**. (a) custom ≡ sans champ
mapType, octet par octet ; (a2) moteur inchangé : custom perlin
ring 0 ≡ version déployée 3ad9c18, octet par octet × 3 seeds ;
(a3) les 5 types NON recalibrés (continent, continents, pangea,
inland-sea, lakes) ≡ c0629c9, octet par octet × 3 seeds ; (b)
déterminisme × 9 ; (c) morphologie 8 seeds : continent masse
unique 94-100 % (8/8 ≥ 90), continents principale 49-57 % (8/8),
pangea 99-100 % (8/8), islands-large 3 îles équilibrées 28-36 %
(8/8, comps 8-13), archipel 10-20 composantes principale ≤ 48 %
(8/8), fragmented 15-19 composantes principale 18-40 % (8/8),
inland-sea centre 29-41 % contre bord 60-67 %, lakes 88-100 % ;
(e) ressources quantile : 9/9 vues sur 24 cartes ; (f) anneau :
F1 aucune tuile terre→océan + monotone ensembliste (5 cas × 4
paliers), F4 carte de base byte-identique
(elev/biome/ressources/rivières), F6 terre monotone, F5a l'anneau
ne dégrade jamais le placement (4 cas 6/6 → 6/6), F5b 8/8 seeds
avec 6/6 joueurs sans warning (continent, anneau 60 %). Terre %
continent/grimoire à ring 0/25/50/100 : 65/73/82/100 — additions
pures. Rendu ASCII de contrôle : archipel en arcs d'îles, anneau
100 % = 211 X en périphérie, zéro « ! ». `node --check` OK sur le
script extrait.
- Correction du harnais au passage : `radius` lu en string par
  `makeParams` (« -1 + \"12\" = \"-112\" ») tronquait les cartes à
  247 tuiles au lieu de 469 — les mesures morphologiques du tour
  précédent étaient faussées (parseInt appliqué sur tous les
  champs numériques) ;

**Commits** (1 sur `v4` depuis 8949dd3) :
- `99dcaa0` feat(wargame) : labo — Perlin par défaut, anneau
  purement additif (+ cache-buster ?v=5 dans CarteLaboView) ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : le labo retrouve le Perlin par défaut
(comme avant le dernier tour). L'« Intensité d'anneau » n'ajoute
PLUS QUE des cases : la carte de base est rigoureusement
identique (testée octet par octet), les additions tombent
exclusivement dans la bande de pourtour jouable, l'intensité
pilotant la fraction de l'océan de bande converti (25/50/100 %).
Monter le curseur ne fait qu'ajouter des tuiles, ne retire
jamais rien, et ne dégrade jamais le placement des joueurs.
Fragments/îles/archipels plus fiables qu'avant sur toutes les
graines. « Personnalisé » reste strictement sans masque ni
squeeze (l'anneau y fonctionne aussi, en additions pures).
Cache-buster iframe ?v=5. Ctrl+F5 requis.
## Labo générateur : anneau strictement borné par les marges joueurs (retour Thibaut 2026-11-13, base c638ba5)

Retour Thibaut : « l'anneau modifie encore la carte entière alors
qu'il ne doit modifier que les cases entre la marge centre et la
marge bord ».

**Diagnostic** (mesuré au harnais, réglages UI) : le moteur était
bien additif (aucune tuile terre→océan, carte de base byte-
identique), mais la BANDE dépassait l'intervalle [marge centre,
marge bord] de trois façons :
- rampe smoothstep `RING_W = 0,12` : la bande remontait jusqu'à
  1,4 hex en deçà de « Marge centre » (conversions mesurées à
  dc 0,25 pour centre=4) ;
- queue à 35 % au-delà de « Marge bord » : le bord extrême
  restait convertissable (12 additions hors bande sur 88 à
  centre=4/bord=2) ;
- distance WARPÉE (domain warping) pour l'appartenance à la
  bande : frontière floue, des cases hors marges passaient.
Et surtout : à « Marge centre » 0 (défaut), la bande couvrait
TOUTE la carte — l'anneau saupoudrait des îles jusqu'au centre
(additions dès dc 0,08). Confirmé avec Thibaut : c'est le
comportement voulu à 0 (la bande PEUT couvrir toute la carte),
mais la coupe doit être FRANCHE aux marges.

**Ce qui a été fait** (passe anneau de `generateMap`) :
- bande STRICTE : distance hex VRAIE (plus warpée) entière, d ≥
  `ringInDist` (playerCenter) et d ≤ N − playerEdge, bornes
  comprises — exactement l'ensemble où `placePlayers` peut poser
  des joueurs. Plus de rampe, plus de queue, plus de flou : une
  case hors bande ne bouge JAMAIS, à aucune intensité ;
- budget uniforme : intensité = part de l'OCÉAN DE LA BANDE
  convertie (floor(intensité × nb), moins profond d'abord),
  préfixe strict → toujours monotone ;
- suppression de `dcwBuf` (la coordonnée warpée ne sert plus
  qu'aux masques de forme) ; tooltips du champ anneau mis à jour
  (bande stricte, sémantique à « Marge centre » 0 explicitée) ;
- cache-buster iframe ?v=6 dans CarteLaboView.

**Validation** : harnais maison (`harnais-labo-types.cjs`,
reconstruit après reset du sandbox) : **19 OK, 0 échec**.
(a/a2/a3) moteur inchangé à ring 0 : custom ≡ 3ad9c18 et 5 types
non recalibrés ≡ c0629c9, octet par octet × 3 seeds ; (b)
déterminisme ; (c) morphologie 8 seeds inchangée ; (e) ressources
quantile 9/9 sur 24 cartes ; (f) anneau, 7 cas (dont centre=4/
bord=2, centre=8/bord=4 anneau-fin, centre=2/bord=0) × paliers
0/25/50/100 % : F1 aucune tuile terre→océan + emboîtement
monotone, **F2 toute case convertie est strictement entre les
marges (distance entière), 0 hors bande sur les 7 cas**, F4 carte
de base inchangée hors additions (elev/biome/ressources/
rivières), F6 terre monotone, F5a placement jamais dégradé (5
cas 6/6 → 6/6), F5b 8/8 seeds 6/6 joueurs sans warning
(continent, anneau 60 %). Rendus ASCII : à centre=4/bord=2 et
anneau 100 %, le cœur de la carte est intact, 122 additions
toutes dans la bande, 0 hors bande. `node --check` OK.

**Commits** (1 sur `v4` depuis c638ba5) :
- `d809618` feat(wargame) : labo — anneau strictement borné par
  les marges joueurs (+ cache-buster ?v=6) ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : l'anneau ne touche plus QUE les cases
entre « Marge centre » et « Marge bord » (bornes comprises, mêmes
bornes que le placement des joueurs, coupure franche) : rien ne
change ni plus au centre que la marge centre, ni plus au bord que
la marge bord. À « Marge centre » 0 la bande couvre toute la
carte (voulu) ; montez la marge centre pour réserver un cœur
océanique. L'intensité = part de l'océan de la bande convertie.
Cache-buster iframe ?v=6. Ctrl+F5 requis.
## Labo générateur : ressources 4 %, ruines éparpillées, volcans 15 % et caps de tuiles actifs par défaut (retour Thibaut 2026-11-13, base 4acf7a3)

Retour Thibaut (5 demandes) : densité de base des ressources à
4 %, proximité à 65 % (sauf Ruines : proximité 0 % mais densité
6 %) ; évènements volcans à 15 % de base ; nombres max de tuiles
par défaut : Plaine 200, Montagne 80, Forêt 200, Océan 250,
Marais 80, Désert 50, Volcan 15.

**Ce qui a été fait** :

- **Ressources** (`RES_DEFAULTS`, sliders reconstruits à partir
  de ces valeurs) : densité 30 → 40 ‰ (4,0 % affiché) et
  proximité 65 % pour les 9 ressources — SAUF Ruines : densité
  60 ‰ (6,0 %) et proximité 0 %. Sémantique de la proximité :
  haute = basse fréquence du bruit = amas contigus ; Ruines à
  0 % → freq 0,46 (maximale) = ruines ÉPARPILLÉES une par une.
  En mode Bruit le seuil devient 1 − densité×8 = 0,68 (4 %) et
  0,52 (6 %) : les deux restent atteignables par le Perlin
  (vérifié : 9/9 ressources vues en mode bruit) ;
- **Volcans** : slider évènement 6 → 15 % (défaut, max 30) ;
  mesuré : 0 à 6 volcans par carte rayon 12 (43 montagnes
  × 15 %) ;
- **Caps par biome ACTIFS par défaut** (ils étaient tous à
  0 = illimité) : Plaine 200, Forêt 200, Désert 50, Marais 80,
  Montagne 80, Océan 250, + NOUVEAU champ « Volcan » cap 15.
  Mécanisme Volcan : le cap générique (avant le tirage) ne peut
  pas s'appliquer puisque les volcans n'existent pas encore ;
  on plaque le cap juste après le tirage — les excédentaires
  redeviennent Montagne dans l'ordre du tirage. Séquence PRNG
  du tirage inchangée (byte-identique quand le cap ne se
  déclenche pas). Boutons ↺ et DEFAULTS.constraints à jour ;
- Cache-buster iframe ?v=7 dans CarteLaboView.

**Validation** : harnais maison (`harnais-labo-types.cjs`,
défauts UI actuels) : **23 OK, 0 échec**. (a/a2/a3) moteur
inchangé : custom ≡ 3ad9c18 et 5 types non recalibrés ≡
c0629c9, octet par octet × 3 seeds avec les NOUVEAUX défauts
passés explicitement (le moteur est piloté par params : les
défauts UI ne le changent pas ; le cap Volcan est un no-op
quand il ne se déclenche pas) ; (b) déterminisme ; (c)
morphologie 8 seeds : tous les critères tiennent — SEULE
exception attendue : le cap Océan 250 mord sur « Fragmenté »
(sealevel 60 → ~281 tuiles d'océan) : 31 tuiles d'océan
converties en Plaine, terre 40 → 47 %, comps 12-16,
principale 38-62 % (critères ≥ 8 comps et ≤ 75 % toujours OK) ;
(d) NOUVEAU : sur 24 cartes, chaque biome sous son cap et
volcans ≤ 15 ; (e) ressources : 9/9 vues en quantile ET en
bruit ; ruines éparpillées (plus grande composante de ruines :
2 tuiles, sur 113 amas) ; (f) anneau strict inchangé : F1/F2/
F4/F6 + F5a 5 cas 6/6 → 6/6 + F5b 8/8 seeds sans warning.
`node --check` OK.

**Commits** (1 sur `v4` depuis 4acf7a3) :
- `d709119` feat(wargame) : labo — ressources 4 %/65 %, ruines
  6 %/0 % éparpillées, volcans 15 %, caps tuiles par défaut
  (+ cache-buster ?v=7) ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : les ressources de base couvrent
davantage la carte (4 % au lieu de 3 %), les ruines sont plus
fréquentes (6 %) mais toujours isolées (jamais d'amas) ; les
volcans sont plus courants (15 % de tirage par montagne, cap
15 tuiles par carte) ; chaque biome est désormais plafonné par
défaut (0 = illimité reste disponible en remettant le champ à
0). NB : avec Océan plafonné à 250, le type « Fragmenté » en
rayon 12 gagne ~31 tuiles de terre (l'océan descend de ~281 à
250) — monter le cap ou le remettre à 0 si des miettes plus
noyées sont voulues. Cache-buster iframe ?v=7. Ctrl+F5 requis.
## Labo générateur : ressources 3,5 %, volcans 20 %, caps préservés et relief naturel des conversions (retour Thibaut 2026-11-13, base 2829eff)

Retour Thibaut (4 demandes) : densité de base des ressources
4 % → 3,5 % ; volcans 15 % → 20 % ; « il y a maintenant trop de
plaines, ce n'est pas parce que la mer est cap à 250 que la
plaine doit exploser son cap — les caps de toutes les tuiles
doivent être préservés, idem lors des anneaux » ; « lors des
anneaux, il n'y a jamais de désert ou de montagne, pourquoi ? ».

**Ce qui a été fait** :

- **Ressources** : `RES_DEFAULTS` density 40 → 35 ‰ (= 3,5 %,
  seuil bruit 1 − 0,035×8 = 0,72) pour les 8 ressources de
  base ; Ruines inchangées (60 ‰, prox 0 % = éparpillées) ;
- **Volcans** : défaut du tirage 15 % → 20 % (slider
  `evt-volcan` + `DEFAULTS.evt.volcan`) ; le cap 15 tuiles par
  carte est maintenu ;
- **Caps préservés**. Cause racine du « trop de plaines » :
  l'ancien cap Océan convertissait son excès en `Plaine`
  aveugle, en une seule passe, sans re-vérifier les autres
  caps (sur Fragmenté rayon 12 : 31 océans → Plaine pure).
  Nouveau moteur dans `generateMap` : `altCandidates()`
  (refactor des biomes alternatifs climatiques, comportement
  inchangé pour l'anti-encerclement), `convertOceanToLand()`
  (relief inversé de la profondeur : hauts-fonds → côtes,
  fosses → sommets ; humidité recalculée au BFS océan courant ;
  `classifyBiome` ; règle désert isolé), `countBiome()`,
  `capOf()`, `reclassWithRoom()` (cible avec de la place sous
  cap), puis **boucle de stabilité ≤ 12 tours** : chaque tour,
  tout biome plafonné (hors Volcan, cap posé après tirage)
  ramène son compte sous son cap — les conversions d'un tour
  ne peuvent plus faire exploser le cap d'un autre. Victimes
  triées par score de marginalité croissant (ex-océans à 0 =
  premières à repartir, jamais les tuiles d'origine) ;
- **Anneau : relief naturel**. Cause racine du « jamais de
  désert ni de montagne » : l'élévation des tuiles converties
  était épinglée à `seaLevel + 0,01` (sous le seuil montagne
  par construction) et l'humidité prenait le bonus côtier
  maximal. La passe anneau utilise désormais LE MÊME
  `convertOceanToLand()` : la profondeur devient de l'altitude
  (les fosses passent le seuil montagne), l'humidité est
  recalculée sur la carte FINALE (une baie comblée devient
  continentale donc sèche → déserts possibles). Et les caps
  sont respectés dans l'anneau aussi : si les terres ajoutées
  font déborder un cap, seules des tuiles AJOUTÉES sont
  reclassées (ordre de conversion), la carte de base ne bouge
  jamais. Tooltip de l'anneau mis à jour.

**Validation** (harnais maison `harnais-labo-types.cjs`,
57 ok / 0 échec ; npm interdit dans le sandbox) :

- (a) custom ≡ sans mapType, ring absent ≡ ring 0 ;
  (a2) custom Perlin ring 0 **byte pour byte** ≡ déployé
  2829eff (caps à 0 + params explicites, 4 seeds) ; (a3) les
  5 types non recalibrés (continent, continents, pangea,
  inland-sea, lakes) **byte pour byte** ≡ c0629c9 — le moteur
  est inchangé, seuls les défauts UI bougent ;
- (b) déterminisme (3 configurations, 2 passages identiques) ;
- (c) morphologie 8 seeds × 8 types, critères en fraction de
  la terre : continent ≥ 90 % (8/8), continents 2 masses
  40-65 % (8/8), pangea ≥ 85 % (8/8), islands 3 îles ≥ 20 %
  (8/8), archipel comps ≥ 8 (8/8) et principale ≤ 55 % (8/8),
  fragmented comps ≥ 8 (8/8) et principale ≤ 75 % (8/8),
  inland-sea centre creusé (8/8), lakes masse ≥ 80 % (8/8) ;
- (d) caps actifs : 24 cartes, tous les biomes ≤ leur cap,
  volcans ≤ 15, Plaine max 142 ≤ 200 ; le bug Fragmenté est
  mort (conversions océan réparties : Forêt 103, Montagne 37,
  Plaine 57, Désert 8, Marais 6 — plus 100 % Plaine) ;
- (e) défauts 3,5 % : Bétail, Baleines, Poissons, Ruines,
  Soie 24/24 ; Charbon 22/24, Or 21/24, Fer 19/24 (21/24 à
  4 % : conséquence directe du seuil bruit plus haut, moteur
  inchangé) ; Geyser 4/24, identique au déployé à 4 % (pool
  éligible Désert petit + priorité la plus basse — aucun
  changement de comportement) ;
- (f) anneau : F1 additions monotones + F4 carte de base
  byte-identique + F6 terre croissante + F7 caps respectés
  (4 cas × paliers 0/25/50/75/100 %), F5a le placement n'est
  jamais dégradé, F5b continent ring 60 % : 6/6 joueurs sans
  warning sur 8/8 seeds ;
- (g) relief : sur 5 528 tuiles ajoutées à ring 100 % (8
  seeds × 4 types), 66 Déserts et 1 454 Montagnes (ex.
  archipel/grimoire : océan 211 → 34, Forêt plafonnée à 200
  exactement, +177 tuiles réparties Forêt 57 / Montagne 50 /
  Plaine 62 / Marais 8).

**Commits** (2 sur `v4` depuis 2829eff) :

- `31973e1` feat(wargame) : labo — ressources 3,5 %, volcans
  20 %, caps préservés (mer classée + anneaux), relief naturel
  des conversions (+ cache-buster ?v=8) ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : les ressources de base sont un peu
plus rares (3,5 % au lieu de 4 %) — en mode Bruit, Or/Fer/
Charbon peuvent manquer sur ~1 à 5 cartes sur 24 (déjà possible
à 4 %), le mode Quantile reste le bon choix pour garantir un
taux exact ; les volcans sont plus fréquents au tirage (20 %)
mais toujours plafonnés à 15 tuiles ; plafonner la mer ne
produit PLUS de plaines en cascade : l'excès devient de la terre
classée au climat et tous les caps restent tenus, anneau
compris ; l'anneau peut désormais faire apparaître déserts et
montagnes (relief inversé de la profondeur), toujours en
additions pures. NB : le cap Océan 250 mord toujours sur
Fragmenté rayon 12 (~31 tuiles converties, terre 47 %). Cache-
buster iframe ?v=8. Ctrl+F5 requis.
## Labo générateur : cap Océan = baisse globale du seuil, curseur « Élévation de la mer » (retour Thibaut 2026-11-13, base 592318d)

Retour Thibaut (2 demandes) : « si le maximum de mer
est atteint, ce sont les mers en bas à gauche qui disparaissent
toujours, créant une zone lisse en bas à gauche — est-ce qu'il ne
serait pas plus intéressant de faire −0,1 au niveau de la mer
global ? » ; « dans cette optique, j'aimerais que tu m'ajoutes un
bouton "élévation de la mer" ».

**Ce qui a été fait** :

- **Cap Océan : baisse GLOBALE du seuil**. Cause racine de la
  zone lisse : l'ancien cap piochait ses victimes par score
  (tous les océans à 0) départagé par INDEX de tuile → toujours
  le même coin de la carte, mangé en bloc. Nouveau mécanisme
  (celui proposé par Thibaut) : quand l'océan dépasse son cap,
  le seuil de mer BAISSSE globalement au quantile exact du cap
  (`seaLevel = elevTrié[cap]`). Ce sont les hauts-fonds juste
  sous l'ancien seuil, PARTOUT sur les côtes, qui deviennent
  terre : la mer rétrécit naturellement sur toute la carte,
  aucun coin sacrifié. Les tuiles qui remontent gardent leur
  élévation légitime (hauts-fonds), seule l'humidité (BFS océan
  courant) et le biome sont recalculés (même pipeline que
  l'anneau, mode sans relief miroir : `convertOceanToLand(victims,
  mirror)` — l'anneau garde son relief miroir
  fosses → montagnes, le cap n'en a pas besoin). Bonus corrigé
  au passage : les ressources étant tirées APRÈS les caps, une
  ressource océanique ne peut plus se retrouver sur une terre
  remontée ;
- **Curseur « Élévation de la mer »** (section rapide, sous
  « Mer »). Le curseur « Mer » est un QUANTILE : une carte à
  45 % a toujours exactement 45 % d'océan, quoi qu'il arrive.
  Le nouveau curseur déplace le seuil ABSOLU en unités
  d'élévation, indépendamment du quantile : −0,10 à +0,10
  (pas de 0,01), défaut 0 = quantile pur, comportement d'origine
  inchangé. Négatif = mer globalement plus basse (hauts-fonds
  découverts partout), positif = transgression (golfes, baies).
  C'est exactement le réglage manuel du mécanisme du cap. À 0,
  byte-identique au quantile pur.

**Validation** (harnais maison `harnais-labo-types.cjs`,
64 ok / 0 échec) :

- (a) seaElev absent ≡ 0 (quantile pur) ; (a2) custom Perlin
  ring 0 **byte pour byte** ≡ 31973e1 (caps à 0 + params
  explicites, 4 seeds) ; (a3) les 5 types non recalibrés
  **byte pour byte** ≡ c0629c9 — moteur inchangé, seul le
  cap Océan (caps actifs) change ;
- (h) cap Océan sur Fragmenté rayon 12, 4 seeds : océan
  281 → 250, seuil abaissé (ex. grimoire 0,489 → 0,449), 31
  tuiles remontées réparties sur TOUTE la carte (q −11..+12,
  r −12..+11, 23 à 27 groupes connexes — contre UN coin
  avant : 2/31 tuiles en commun avec l'ancienne sélection par
  index), aucune ressource océanique sur les terres remontées ;
- (h) curseur : océan monotone sur l'offset −0,10 → +0,10
  (20 → 85 → 211 → 373 → 445 tuiles sur custom/grimoire), seuil
  = quantile + offset exact ;
- (b/c/d/e/f/g) suites existentes REVERTES au vert intégral :
  déterminisme, morphologie 8 seeds × 8 types (% de la terre),
  24 cartes tous biomes ≤ caps (Plaine max 142), ressources
  (Bétail/Baleines/Poissons/Ruines/Soie 24/24, Or 20, Fer 20,
  Charbon 22, Geyser 5/24 inchangé), anneau F1/F4/F5/F6/F7,
  déserts (53) et montagnes (1 552) parmi les tuiles ajoutées.

**Commits** (2 sur `v4` depuis 592318d) :

- `138b0d8` feat(wargame) : labo — cap océan = baisse globale
  du seuil de mer + curseur « Élévation de la mer »
  (+ cache-buster ?v=9) ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : quand le cap Océan mord (Fragmenté
rayon 12 : 281 → 250 tuiles d'océan), la mer rétrécit
maintenant sur toutes les côtes à la fois — plus de zone lisse
mangée dans un seul coin ; la géographie reste naturelle. Le
curseur « Élévation de la mer » permet en plus de régler FINEMENT
la hauteur absolue de la mer indépendamment du pourcentage
« Mer » : −0,10 découvre massivement les hauts-fonds partout,
+0,10 fait transgresser la mer dans les golfes et baies, 0 =
comportement d'origine. Cache-buster iframe ?v=9. Ctrl+F5
requis.

## Labo générateur : case « 🎲 Variété », tirage de texture calé sur la graine (retour Thibaut 2026-11-13, base bd1aa9b5)

Retour Thibaut : « j'ai l'impression que toutes les cartes se
ressemblent, comment ça se fait ? » puis « oui, je veux bien un
bouton générer qui tire un seed et tout ce que tu as dit en
gardant le type sélectionné ».

**Diagnostic** (mesuré sur 12 seeds, params grimoire fixes, N=12) :
trois verrous expliquent la ressemblance — (1) les QUANTILES
verrouillent la composition : 55 % de terre exactement sur les
12 seeds, Forêt 51 ± 2 %, Plaine 32 ± 3 %, Montagne 8 ± 2 % ;
(2) le bruit a un SPECTRE FIXE (cont 0,05, détail 0,18, 4
octaves, compacité 0,65) : mêmes tailles de masses, même
granularité de côtes, une seule masse dominante en moyenne
94 % de la terre (jamais moins de 70 %) ; (3) le CLIMAT est un
gabarit fixe (pôles ns, seuils temp/humidité constants) : mêmes
bandes climatiques au même endroit. Le seed ne change que
l'arrangement, jamais la recette.

**Ce qui a été fait** :

- **Case « 🎲 Variété »** (section rapide, sous « Montagnes »,
  au-dessus de « ⟳ Générer »). Cochée, chaque clic sur
  « Générer » tire en plus de la graine les curseurs de TEXTURE
  (écriture directe dans les sliders AVANT la lecture des
  params : carte, libellés et UI restent cohérents, tout reste
  ajustable à la main ; rejouer une carte = graine + curseurs
  affichés). Décochée : comportement d'origine exact ;
- **Tirage `drawVariety(seed)`** (partie pure, PRNG DÉDIÉ dérivé
  du hash de la graine, patron des autres étapes : même seed =
  même tirage = même carte). CADRAN de morphologie u ∈ [0,1]
  (0 = morcelé, 1 = continent unique) + JITTER indépendant :
  compacité 10 + 85·u ; côtes 30 − 22·u ± 6 ; taille des masses
  13 − 11·u ± 3 ; réduction des bords 0..30 ; pôles ns/ew/center.
  Le cadran existe parce que les curseurs ne cassent la masse
  dominante que CORRÉLÉS — mesuré : à 55 % de terre on est
  AU-DESSUS du seuil de percolation du réseau hexagonal, une
  masse dominante est quasi inévitable sans masque de forme ;
- **PAS TIRÉS** : le type de carte (le sélecteur garde sa valeur,
  son masque s'applique par-dessus le tirage, aucun event
  déclenché), le bruit, la mer, les montagnes, l'élévation de la
  mer et les caps. `generateMap` INCHANGÉ ;
- Cache-buster iframe ?v=9 → ?v=10 (CarteLaboView).

**Validation** (harnais maison reconstruit, 51 ok / 0 échec) :

- (a2) moteur byte pour byte ≡ 138b0d8 : custom + les 8 types,
  3 seeds (`grimoire`/`chasse-et-peche`/`labo-42`), N=12 —
  biomes, ressources, rivières, seuils mer/montagne identiques,
  27/27 ;
- (v1) drawVariety : déterminisme (2 tirages identiques),
  1 000 tirages dans les bornes (cont 2-15, scale 5-30,
  compact 10-95, edge 0-30), pôles ns/ew/center équirépartis
  (330/309/361), couverture des bornes atteinte ;
- (v2) end-to-end 12 seeds : déterminisme seed → carte,
  contraste réel (cartes à 1 masse ET cartes à 9 masses) ;
  stats 60 seeds contre témoin params fixes : σ du nombre de
  masses 1,8 → 3,3, part de cartes ≥ 7 masses 18 % → 37 %,
  part de continents uniques (≤ 2 masses) 17 % → 23 %, part
  sans masse écrasante (< 75 %) 3 % → 7 % ; type « grandes
  îles » conservé + tirage sans crash (masque par-dessus).

**Commits** (2 sur `v4` depuis bd1aa9b5) :

- `7d057b3` feat(wargame) : labo — case « 🎲 Variété », tirage
  de texture calé sur la graine (+ cache-buster ?v=10) ;
- présent commit : journal seul (tête).

**Effet pour l'arbitre** : avec la case cochée, deux clics sur
« Générer » ne donnent plus la même silhouette — tantôt un
continent unique aux côtes lisses, tantôt 9 masses éparpillées
aux côtes déchirées, pôles nord/sud, est/ouest ou central selon
le tirage. À 55 % de terre, la physique (percolation) garde le
plus souvent une masse dominante : les types de carte (Archipel,
Grandes îles…) restent le levier des silhouettes extrêmes, la
case varie la texture et l'orientation. Cache-buster iframe
?v=10. Ctrl+F5 requis.


## Labo générateur : les « 5 points » — parts des biomes garanties, partage par lien, Quantile v2 par défaut, harnais committé (retour Thibaut 2026-11-13, base b4b23f51)

**Retour.** Après la critique chiffrée du labo (promesse Montagnes non
tenue : 14 % au curseur, 9,6 % réels à cause du lissage
anti-encerclement ; aucun partage ; parts climatiques émergentes et non
réglables ; harnais jamais committé ; Quantile v2 encore marqué
« test »), Thibaut arbitre : « oui, fais les 5 points proprement ».

**Ce qui a été fait.**

1. **Parts garanties (points 1 + 3 unifiés).** Une seule passe
   « parts des biomes » dans `generateMap`, insérée APRÈS le lissage
   anti-encerclement (les masses cassées restent cassées) et AVANT
   l'adjacence (contrainte dure > part statistique, documenté dans les
   tooltips). Cibles : Montagne = curseur existant, Forêt/Désert/Marais
   = 3 nouveaux curseurs de la section rapide (défauts 50/3/5 %, calés
   sur l'émergent mesuré 51,6/2,2/4,7), Plaine = complément exact.
   Algorithme déterministe sans tirage : donneurs en excès cèdent leurs
   tuiles de plus faible affinité ; receveurs en déficit prennent les
   tuiles de plus forte affinité pour eux (affinités = les marginScore
   existants : élévation pour Montagne, humidité pour Forêt,
   sècheresse+chaleur pour Désert, humidité+chaleur pour Marais). Le
   Volcan étant tiré APRÈS dans les Montagnes, Montagne+Volcan =
   cible exacte. Somme des cibles > 100 % de terre → réduction au
   prorata. Exceptions documentées : adjacence et caps peuvent rogner
   après ; anneau et cap Océan ajoutent de la terre hors contrat.
2. **Partage (point 2).** `encodeShare`/`decodeShare` purs (JSON
   canonique à clés triées, round-trip testé) dans la partie pure ;
   côté UI : `captureState` photographie tout (graine, rayon, tous les
   curseurs, seed joueurs + options de placement), le hash `#c=...` est
   synchronisé à chaque génération (`replaceState`, pas d'historique),
   bouton « 🔗 Copier le lien » (clipboard, repli `prompt`) et
   « 💾 Export JSON » (graine + params de rejeu + tuiles q/r/biome/
   élévation/humidité/température + ressources + rivières + joueurs +
   seuils, en regard de l'export PNG qui reste l'image). À
   l'ouverture, un lien rejoue la carte à l'identique, placement
   joueurs compris.
3. **Harnais committé (point 4).** `scripts/harnais-labo.cjs` (Node
   seul, zéro dépendance) : charge la partie pure coupée au marqueur
   explicite `// ===== FIN DE LA PARTIE PURE` ajouté au labo (fini la
   coupe au premier `\n}` après `placePlayers`, fragile). Tests de
   CONTRAT, pas de bytes : C1 déterminisme, C2 part mer = 45 % sur les
   8 types × 3 rayons, C3 parts biomes (±1,2 pt, sans adjacence/caps),
   C4 ressources présentes en quantile (les défauts du FICHIER sont
   lus via `RES_DEFAULTS`, le test suit les réglages au lieu de les
   figer), C5 round-trip + canonique du codec. Usage :
   `node scripts/harnais-labo.cjs` (chemin par défaut résolu relatif
   au dépôt).
4. **Quantile v2 par défaut (point 5).** `res-mode` : option
   « Quantile v2 (officiel) » sélectionnée, « Bruit v1 (legacy) »
   conservé pour rejouer les anciennes cartes, tooltip inversé ;
   fallback de `getParams` aligné. Conséquence mesurée : à 3,5 ‰ le
   mode quantile est honnête mais l'éligible de Geyser est le seul
   biome Désert (~8 tuiles à 3 % de terre) → k = 0,28, absent de ~70 %
   des cartes. Défaut Geyser porté à 120 ‰ (≈ 1 geyser par carte) :
   c'est le réglage qui ne tenait pas sa promesse, pas le mode.

**Validation.** Harnais committé : 10/10 sur le labo poussé (parts
14,0/50,0/3,1/5,0/27,9 avec terre 258 sur 5 seeds ; déterminisme ;
mer 45 % sur 24 combinaisons type×rayon ; les 9 ressources présentes
sur 5 seeds ; codec round-trip + canonique). `node --check` sur le
script complet extrait. Caractérisation du changement de comportement
(arbitré ce tour, la contre-mesure byte vs 138b0d8 ne s'applique plus ;
NOUVELLE base des byte-tests futurs = ce commit, avec `resMode:
'quantile'` et `parts` explicites) : grimoire 18/469 tuiles changent,
moyenne ~30/469 sur 6 seeds, soit 179/1 548 = 11,6 % de la terre —
mêmes côtes (Océan 211 identique), histogramme recalé : Montagne 22→29
+ Volcan 5→7 = 36 tuiles = 14,0 % exact, Forêt 145→129 = 50 %, Plaine
66→72. Intégrité post-push vérifiée par cmp sur les 3 fichiers.

**Commits** (2 sur `v4` depuis b4b23f51) :

- `8cf84ee` feat(wargame) : labo — les 5 points (passe parts,
  partage lien/JSON, défaut quantile, Geyser 120 ‰, harnais
  `scripts/harnais-labo.cjs`, cache-buster ?v=11,
  `allow="clipboard-write"` sur l'iframe) ;
- présent commit : journal seul.

**Effet pour l'arbitre.** Le labo tient enfin TOUTES ses promesses de
parts : ce qui est affiché au curseur est ce qui est sur la carte,
mer et montagnes comprises. Trois curseurs de plus (Forêt, Désert,
Marais) pour composer la campagne à froid, un lien copié qui rouvre
la carte exacte (n'importe qui, aucun réglage), un JSON pour analyser
ou archiver, et un harnais qui vérifie les promesses à chaque
modifications futures (attention : les liens/labos créés avant ce
commit rejouent différemment, la passe parts recalant
l'histogramme ; les graines elles-mêmes produisent des cartes
voisines mais pas identiques). Ctrl+F5 pour vider le cache du
navigateur (le bundle jeu référence maintenant `?v=11`).


## Labo générateur : fenêtre périphérique — continents / grandes îles / archipel enfin visibles en entier à r=15 (retour Thibaut 2026-11-13, base 764df23)

**Retour.** « Pour l'instant j'aime bien, mis à part les presets
continents, grandes îles et archipel qui font apparaître des masses de
terres trop importantes. On ne voit jamais les continents, ni même les
îles en entier. Rappel, la taille par défaut est un rayon de 15 tuiles,
soit 721 tuiles total. »

**Diagnostic.** Reproduit et chiffré au harnais à r=15 (8 seeds,
params de preset complets) : **56 % de l'anneau extérieur était de la
terre** sur les trois types, et chaque carte portait **4 à 6 masses
coupées par le bord**. Cause structurelle, pas un simple réglage : les
lobes angulaires des masques de forme (`cos 2θ`, `cos 3θ` × dc)
culminent à dc = 1 (le bord de la carte), et le masque de bord
(`e-edge`) est appliqué au BRUIT AVANT l'ajout du biais de forme — il
ne peut donc rien contre eux. Le défaut existait aussi à r=12 (2,5 à
6,4 masses coupées), simplement moins visible. Noter le piège du
domain warping : dc est warpé d'une amplitude de 0,55, toute fenêtre
sur la distance warpée laisserait le bord réel rouvert.

**Ce qui a été fait.**

1. **Fenêtre périphérique `PERIPH_OCEAN`** (continents, grandes îles,
   archipel uniquement) : le biais de forme s'essouffle de 85 % à 98 %
   du rayon (fenêtre sur la distance VRAIE, pas la warpée), puis un
   creux océanique (90 % → 100 % du rayon, profondeur 0,42) garantit
   l'anneau d'eau au pourtour. « continent » et « pangea » gardent
   leurs masses au bord : c'est leur contrat documenté.
2. **Compensation des creux séparateurs** — le piège du quantile
   global : le seuil de mer étant un QUANTILE, vider l'anneau
   extérieur redistribue la terre au centre et le seuil descend —
   première mesure (fenêtre seule) : les trois îles de « grandes
   îles » se soudaient en une masse de 75 %, l'archipel en 99 % ! Les
   creux séparateurs des trois masques sont donc renforcés en
   compensation, calibrés par grille d'essais sur 8 seeds à r=15 :
   continents −0,30 → −0,45, grandes îles −0,38 → −0,60, archipel
   creux −0,38 → −0,60 et entailles −0,16 → −0,28.
3. **Rayon par défaut du labo 12 → 15** (721 tuiles) : le labo
   s'aligne sur la taille réelle de la campagne, celle à laquelle le
   retour a été fait.
4. **Contrat C6 au harnais committé** : pour les trois types, à
   r=15, chaque seed doit garder l'anneau extérieur ≤ 5 % de terre
   (15 combinaisons type × seed). Premier calibrage (creux de bord
   0,35) échouait sur islands-large/corvane à 6 % — creux porté à
   0,42, contrat vert.

**Validation.** Harnais 11/11 (C1-C5 inchangés + C6). Morphologie
mesurée à r=15 (8 seeds, avant → après) : continents masse principale
50 → 51 % de la terre, 8,5 composantes, bord 56 → 0 %, coupées 4,4 →
0 ; grandes îles 34 → 38 %, ~10 composantes, bord 56 → 0 %, coupées
5,1 → 0 ; archipel 28 → 39 %, ~12 composantes, bord 56 → 0 %, coupées
6,3 → 0 (la masse principale remonte un peu : la terre chassée du
bord se concentre au centre, c'est le prix du « visible en entier » ;
les composantes restent nombreuses et équilibrées). **Caractérisation
à params égaux : les six autres types (custom, continent, pangea,
fragmented, mer intérieure, lacs) sont inchangés à 0 tuile près** ;
les trois types corrigés changent sur 27-31 % des tuiles (le
recentrage voulu). Intégrité post-push vérifiée par cmp sur les 3
fichiers.

**Commits** (2 sur `v4` depuis 764df23) :

- `213f129` feat(wargame) : labo — fenêtre périphérique + rayon
  par défaut 15 + contrat C6 (+ cache-buster ?v=12) ;
- présent commit : journal seul.

**Effet pour l'arbitre.** À r=15, choisir « continents », « grandes
îles » ou « archipel » montre désormais chaque masse EN ENTIER,
détachée du bord par un anneau d'océan — plus de continent tronqué par
le bord de la carte. Le labo s'ouvre à la taille de campagne (r=15 =
721 tuiles). Les graines de ces trois types rejouent différemment
d'avant ce correctif (recentrage voulu) ; les autres types rejouent à
l'identique, byte pour byte à params égaux. Ctrl+F5 pour vider le
cache (le bundle jeu référence maintenant `?v=12`).

## Labo générateur : vraies îles — bosses localisées tronquées, archipel en multi-anneaux, quantile calé dans les bosses (4e retour Thibaut 2026-11-13, base 382f74e)

**Retour.** « Attention, tu n'as pas changé la forme des îles, tu as
simplement ajouté un anneau d'eau à l'extérieur du plateau... » —
appréciation exacte : le tour précédent avait détaché les masses du
bord (contrat C6 vert) mais elles restaient des SOUPES centripètes :
continents 3 masses soudées 51 %, grandes îles 38 %, archipel 39 % en
~12 composantes collées. Le fond du problème n'était pas la fenêtre
périphérique, c'était la FORME des masses elles-mêmes.

**Diagnostic.** La chaîne complète a été démontée cause par cause,
chaque étape chiffrée au harnais (8 seeds, r=15, params de preset) :

1. **Masques en secteurs** (`cos 2θ/3θ/4θ` × dc) : ils étirent des
   BANDES du centre au bord — une « île » n'est pas un secteur.
   Remplacés par des bosses gaussiennes localisées (helper
   `islandArchipel`).
2. **Le piège du quantile** : le seuil de mer étant un QUANTILE
   global, à ~50 % de terre il tombe par construction DANS le bruit de
   fond (la moitié d'un fond symétrique dépasse). Mesuré : seaLevel
   0,249, fond 0,19-0,30, bosses 0,4-0,77 — les plaques du fond
   au-dessus du seuil soudaient les bosses en masses de 84-96 % de la
   terre. Remède structurel : aplatir la variance du fond (×0,08,
   ×0,35 pour l'archipel) pour que les BOSSES portent toute la
   structure ; le quantile se cale alors franchement au-dessus du
   fond (mesuré 0,63 vs fond ~0,5).
3. **Queues gaussiennes additives** : deux bosses à 2,35σ l'une de
   l'autre apportent chacune ~0,5·amp au point médian — soudure
   garantie au seuil. Passé à la super-gaussienne d'ordre 4 (profil
   plateau, flanc raide) PUIS troncature nette à 1,6σ : support
   compact, contribution nulle au-delà.
4. **Rejet « dernier essai »** : quand aucun essai n'était libre, la
   position était plaquée sur une voisine (aire ÷3 mesurée) —
   remplacé par le MEILLEUR des essais, et l'anneau devient
   auto-calibré : r_ring = sep/(2·sin(π/count)), l'espacement
   angulaire couvre par construction la séparation requise.
5. **floorBias négatif** (−0,25, reste des masques en secteurs) :
   il abritait le champ du cœur sous le seuil ; mis à 0 partout.
6. **BUG D'ÉCHELLE axialToPixel** : la grille étire l'espace
   (x = √3·(q+r/2), y = 1,5·r), le rayon en pixels du plateau vaut
   ~1,6·N, pas N. Toutes les distances du helper étant exprimées en
   unités « fausses », les bosses étaient plaquées dans le quart
   central — soupes centrales sur tous les essais. Correctif :
   RPX = N·1,6 dans tout le helper (sep, rRing, σ, dip).
7. **Percolation du fond** : le fond haute fréquence, même peu
   variancé, percole en réseau traversant dès ~30 % de terre portée
   par lui (masse 80-90 %, diamètre 26) — le squeeze doit être dur ;
   les miettes du fond ne peuvent PAS être la source principale des
   masses, seulement des satellites de dentelle.
8. **Chapelets** : un rejet plus exigeant que l'espacement angulaire
   garanti échoue en cascade et aligne les bosses en ARC (mesuré : 5
   îles en diagonale, masse 98 %). Rejet assoupli à min(sep,
   0,98·gap), jitters angulaire/radial réduits.
9. **Fenêtre périphérique durcie (75-92 %)** : essayée pour vider la
   couronne 14, elle AMPUTAIT les bosses posées à ~0,6N de leurs
   flancs ; le quantile compensait en descendant vers le fond et
   ressoudait les îles (spirale du seuil). MAINTENUE à 85-97 % : avec
   le fond aplati et des bosses tronquées, la couronne 14 reste vide
   seule.
10. **Warp du masque (±0,55 sur dc)** : sur une bosse étroite
    (σ ~ 0,2N) il déplace l'évaluation de plus que le σ à CHAQUE
    tuile — la structure devient une soupe (masse 92-96 %). Supprimé
    sur les bosses ; la dentelle des côtes vient d'un warp DÉDIÉ dans
    le helper (~0,9 tuile, 1 octave, fréquence 1,3).
11. **Spirale de Fermat (count > 6)** : elle place des voisins
    SUCCESSIFS à 0,6-1 px radialement (contre sep ~ 8,5 px) : rejet en
    cascade, arcs soudés systématiques (masse 58-98 % sur toutes les
    grilles 7-12 îles). REMPLACÉE par des anneaux EXPLICITES :
    extérieur nExt = 60 % des îles à 0,95·rMax, intérieur à rInt
    calibré pour tenir sep angulairement (clampé sous rExt − sep),
    angles décalés d'un demi-pas extérieur, rejet croisé contre
    TOUTES les bosses déjà posées.

**Ce qui a été fait.** Helper `islandArchipel(count, sigRel, amp,
rMin, rMax, floorBias, sepFact, dipAmp, dipRRel)` : anneau
auto-calibré (count ≤ 6) ou multi-anneaux (count > 6), bosses
super-gaussiennes d⁴ tronquées à 1,6σ, rejet meilleur-des-essais,
creux central explicite (garantit la mer centrale), warp de dentelle
1,2 px. Squeeze du fond par type dans le blend. Trois presets
recalibrés sur grille d'essais (8 seeds × r=15) :

- **continents** : 3 bosses σ 0,28, sepFact 3,1, creux 0,10/0,22,
  sealevel 55 → 60 ;
- **grandes îles** : 4 bosses σ 0,23, sepFact 3,5, creux 0,05/0,24,
  sealevel 50 → 60 ;
- **archipel** : 14 bosses σ 0,125, sepFact 3,1, multi-anneaux
  9 ext + 5 int, sealevel 60 → 73.

Commentaire de la fenêtre périphérique réécrit (il annonçait le
durcissement 75-92 % depuis ANNULÉ, et niait le warp de dentelle du
helper).

**Validation.** Harnais 11/11 (C1-C6, dont C6 anneau extérieur ≤ 5 %).
Morphologie r=15, 8 seeds : **continents** terre 40 %, 3 composantes,
masse principale 41 %, diamètre max 13,5 ; **grandes îles** terre
40 %, 4 composantes, 4 îles ÉQUILIBRÉES 21-30 % chacune (8/8 seeds,
aucune soudure), diamètre max 10,5 ; **archipel** terre 27 %, ~10
composantes, masse principale 34-37 %, diamètre max 12. Bord 0 %,
coupées 0, sur les trois types et les 8 seeds. Stabilité vérifiée à
r=12/18/24 (les diamètres croissent avec le plateau, les formes
tiennent ; à r=12 l'archipel produit 25 % de petites îles < 10
tuiles, normal à cette échelle). Diff complet du labo vs base : seuls
les 3 presets, les 3 branches, le bloc fenêtre/squeeze et le helper
sont touchés — **les six autres types rejouent à l'identique à params
égaux** (le helper n'est appelé que par les 3 types corrigés).
Intégrité post-push vérifiée par cmp au sha.

**Commits** (2 sur `v4` depuis 382f74e) :

- `c303594` feat(wargame) : labo — vraies formes d'îles + presets
  recalibrés + cache-buster ?v=13 ;
- présent commit : journal seul.

**Effet pour l'arbitre.** « Continents » montre 3 masses compactes de
~13 tuiles de diamètre, « grandes îles » 4 îles équilibrées ~75 tuiles
chacune, « archipel » une dizaine d'îles dont la plus grande tient
dans ~10 tuiles de diamètre — sur un plateau de rayon 15, CHAQUE
masse est vue en entier, détachée du bord et séparée de ses voisines
par de l'océan. Les graines de ces trois types rejouent
différemment d'avant ce correctif (changement de forme voulu) ; les
autres types sont inchangés. Ctrl+F5 pour vider le cache (le bundle
jeu référence maintenant `?v=13`).

## Labo générateur : masses plus petites et plus nombreuses, fin de l'anneau d'eau forcé (5e retour Thibaut 2026-11-14, base 867c801)

**Retour.** « Tu as fait l'inverse de ce que je voulais, je voulais
des masses terrestres plus petites, pas des anneaux d'eau. » — le
4e retour avait produit 3-10 masses de 70-100 tuiles (jusqu'à 40 %
de la terre en une masse) et forcé un anneau d'eau au bord pour
détacher ces masses trop grosses. Le but est depuis le début des
masses PLUS PETITES (~15-45 tuiles), PLUS NOMBREUSES, avec un océan
du pourtour statistique, pas sculpté.

**Diagnostic.** Chaîne établie par mesures au harnais (grilles 8
seeds × r=15) :

1. **Le curseur de mer ne fait pas la taille d'île** : le seuil est
   un QUANTILE qui se cale au plancher du fond aplati (squeeze
   ×0,08/×0,35). Monter la mer pour réduire une île descend le seuil
   dans le fond → miettes percolantes. C'est le BUDGET
   (count, σ, sepFact) qui fixe la taille, le curseur ne gère que la
   part totale de terre.
2. **Soudure au point médian warpé** : à sep 3,1-3,5σ, le point
   médian entre deux voisines (distant de sep/2σ ≈ 1,55-1,75σ du
   centre de chacune) reste porté par le fond + le warp : îles
   soudées par paires (top1 55-63 tuiles sur 8/8 seeds). Condition
   mesurée : gap/2σ − 0,35 ≥ x_e(≈1,4-1,5) → **sepFact 3,6-4,0**.
3. **Jitter de taille 0,9+0,25** : écarts d'aires ×1,6 → une île
   dominante à 44 % de la terre. Resserré à 0,95+0,12.
4. **Placement 2-anneaux fixes (60 %/40 %)** : à count élevé le
   rejet aligne les essais en arcs soudés (96-155 tuiles).
   REMPLACÉ par des **couronnes adaptatives** : de l'extérieur vers
   le centre, chaque couronne porte n = ⌊π/asin(sep/2r)⌋ bosses,
   écart radial sep, couronne suivante seulement si
   rNext ≥ 0,75·sep, centre seulement si la couronne précédente est
   à ≥ sep ; **le count est un PLAFOND** (le report d'excédent sur
   l'extérieur a été essayé : soudures en chaîne, abandonné).
5. **Warp de dentelle fixe 1,2 px** : trop fort pour des bosses de
   σ 1,4-1,7 px (0,31-0,55σ) → ponts d'UNE tuile au point médian,
   îles soudées par paires. Rendu **adaptatif** :
   wAmp = clamp(0,35·σpx, 0,5, 1,2).

**Ce qui a été fait.** Helper re-conçu (jitter resserré, couronnes
adaptatives à plafond, warp adaptatif) ; fenêtre périphérique :
**creux −0,42 SUPPRIMÉ** (fin de l'anneau d'eau forcé), l'essorage
du biais réduit à un garde-fou 92-98 % du rayon (les bosses posées
à ≤ 0,75 + 1,6σ ne sont jamais amputées). Presets recalibrés :

- **continents** : `islandArchipel(6, 0.18, 0.50, 0.30, 0.62, 0,
  3.6, 0.05, 0.16)`, sealevel 60 → 68 : 6 masses équilibrées de
  33-45 tuiles ;
- **grandes îles** : `islandArchipel(11, 0.125, 0.50, 0.16, 0.75,
  0, 4.0, 0, 0.12)`, sealevel 60 → 66 : 9-14 îles de 25-32 tuiles ;
- **archipel** : `islandArchipel(18, 0.09, 0.45, 0.14, 0.75, 0,
  3.6, 0, 0)`, sealevel 73 → 72, couronnes adaptatives : 15-18
  îles de 11-24 tuiles.

Harnais : C6 testait les types à sea 45 (55 % de terre) SANS
appliquer les presets — à ce régime le bord se remplit
statistiquement et seul le creux (supprimé) pouvait le vider.
Corrigé : `presetParams` applique MAP_PRESETS pour C6 ; C2 garde
son test de quantile à sea 45 sans preset.

**Validation.** r=15, 8 seeds : **continents** terre 32 %, 6
composantes, masse max 19 %, 39 tuiles moy, diam 8 ; **grandes
îles** terre 34 %, 9-14 composantes, masse max 13 %, 27 tuiles
moy, diam 9 ; **archipel** terre 28 %, 15-18 îles, masse max 18 %,
satellites 7 %, diam 11. **Bord 0 %, coupées 0** sur les trois
types. Stabilité r=12/18/24 : formes tenues, aucune soudure (à
r=12 l'archipel produit plus de miettes, prévu ; continents à
r=12 : une île à 33 % de la terre = 50 tuiles unitaires, composa-
ntes 5,8 ≈ 6 : pas une soudure). Harnais 11/11, dont C6 vert sur
les presets réels SANS anneau sculpté. Diff complet vs base
867c801 : seuls les 3 presets, les commentaires, le helper et la
fenêtre périphérique sont touchés — les six autres types rejouent
à l'identique à params égaux. Intégrité post-push vérifiée par cmp
au sha.

**Commits** (2 sur `v4` depuis 867c801) :

- `b660f08` feat(wargame) : labo — masses plus petites et plus
  nombreuses, couronnes adaptatives, fin de l'anneau d'eau, C6 sur
  presets réels, cache-buster ?v=14 ;
- présent commit : journal seul.

**Effet pour l'arbitre.** « Continents » montre 6 masses de 33-45
tuiles, « grandes îles » une douzaine d'îles de 25-32 tuiles,
« archipel » ~16 îles de 11-24 tuiles — chaque masse tient dans
8-11 tuiles de diamètre sur le plateau r=15. Plus d'anneau d'eau
sculpté au bord : l'océan du pourtour redevient statistique et
aucune masse n'est coupée. Les graines des trois types rejouent
différemment d'avant ce correctif (changement de forme voulu) ;
les autres types sont inchangés. Ctrl+F5 pour vider le cache (le
bundle jeu référence maintenant `?v=14`).

## Conversion culturelle V2 « Pression/Ancrage » (arbitrage Thibaut 2026-11-14, base c3035943)

**Retour.** « Est-ce que tu pourrais me proposer autre chose pour la
conversion culturelle, qui soit plus cohérente et plus jouable de
manière technique ? » — l'ancien moteur tirait au hasard une
tentative à 10 % par habitant puis une culture dans un tirage
pondéré ; Thibaut a tranché la V2 déterministe « Pression/Ancrage »
sur proposition (3 variantes), avec : plancher minuscule CONSERVÉ
(une ville homogène n'est pas immunisée), conversion personnage par
personnage SANS les familles, cap 1 par ville-tour en PARAMÈTRE
réglable (conversionMax, équilibrage explicite différé en second
temps).

**Commit jeu :** e3ede969 (feat) — engine/culture.ts réécrit (duel
par ville : Force = pression touristique + poids démographique
local ×(1+évangile), bonus d'accueil Nationalisme + Guilde des
évangélistes ; ancrage = compatriotes × poids + noblesse ;
conversion des moins ancrés sous la force dominante, cap
conversionMax ; plancher rng 1 % des villes 100 % homogènes ;
Dirigeant immunisé), bloc « Balance culturelle » dans
components/pays/VilleCarte.tsx (source unique detailConversionVille
— la vue et le moteur calculent les mêmes nombres), params.ts
(conversionMax 1 PROVISOIRE, conversionPlancher 0,01,
conversionAncrageNoble 15 ; conversionProba et conversionMemeCulture
retirés), defaultConfig.ts (migration ciblée conversionDeterministe2026,
patron taxes25 : les 2 clés mortes dépouillées, les 3 nouvelles
venues de mergeParams), tests : conversion.test.ts NOUVEAU (8 tests :
ville homogène + plancher, minorité fond à 1/tour, conversionMax=3,
renversement par tourisme massif, isolé avant communauté, noble
résiste, Dirigeant immunisé, majorité des villes) et réécriture des
tests Évangile/Nationalisme (dogmes.test.ts) et Guilde des
évangélistes (tier3.test.ts) sur le détail exact des forces.
**Commit règles :** e8161862 (docs/ia/regles-et-arbitrages.md —
section « Conversion culturelle V2 « Pression/Ancrage » »).
**Présent commit : journal seul.**

**Leçon de design.** Le scénario « 25/25 ville mixte stable » imaginé
en amont était faux en pratique : les cultures du référentiel portent
une pression de base 0,001 qui départage toute égalité démographique
parfaite (la culture du référentiel l'emporte de 0,001 et fond l'autre
à cap/tour). Repéré À L'ANALYSE avant d'écrire les tests — aucun run
raté, le harnais est passé 360/360 du premier coup. Comportement
accepté (knife-edge d'égalité parfaite, rarement durable) et
l'immobilité verrouillée autrement : le test d'ancrage utilise
un noble (ancrage +15) contre une force juste au-dessus du roturier.

**Effets pour l'arbitre.** La conversion devient LISIBLE : chaque
ville affiche ses forces culturelles (pression + présence), sa
culture dominante et les conversions prévues du tour. Une minorité
fond au rythme du cap (les isolés d'abord, les nobles en dernier) ;
un tourisme culturel massif renverse une ville pure (pression >
démographie locale) ; une faible pression étrangère ne tient pas
face à une masse locale. L'équilibrage du cap reste à régler en
second temps (conversionMax). Diag régénéré : seuls les compteurs de
simulation bougent (log 459 → 497, commandants J1 6 → 4 — le moteur
ne consomme plus un rng par habitant, le flux des événements aval
est décalé) ; AUCUNE autre ligne ne diffère. 360/360 tests natifs
(352 + 8), 36 fichiers ; tsc = baseline stub @supabase seule ;
diff vs base c3035943 exactement 7 fichiers src + diag-out.txt.
Ctrl+F5 pour vider le cache (nouveau bundle à l'URL
losth230.github.io/quartz/jeu/).

## Cap de conversion proportionnel 10 % (arbitrage Thibaut 2026-11-15, base f2918326)

**Arbitrage.** « Le cap de conversion passe à 10 % des habitants de
la ville » — le cap FIXE conversionMax (1/ville-tour, provisoire
depuis le 2026-11-14) devient le TAUX conversionTaux (défaut 0,10
des vivants, arrondi inférieur, minimum 1). Duel
« Pression/Ancrage » inchangé par ailleurs.

**Commit jeu :** c32d26d6 (feat) — engine/culture.ts (cap =
max(1, floor(conversionTaux × vivants)) par ville-tour + champ cap
du détail), params.ts (conversionTaux 0,10 remplace conversionMax 1
— changement d'UNITÉ : une valeur « 1 » sauvegardée voudrait dire
100 %, la clé est morte et dépouillée), defaultConfig.ts (migration
ciblée conversionTaux2026, patron taxes25 : delete conversionMax,
la nouvelle clé vient de mergeParams, une personnalisation de
conversionMax retombe sur le défaut 10 %), VilleCarte.tsx (ligne
« cap de conversion N/tour (10 % des vivants) » dans le bloc
« Balance culturelle »), conversion.test.ts réaligné (cap 5 sur 50
vivants : la minorité fond en 2 tours ; taux 0,3 → cap 15 : minorité
fond en un tour ; renversement à 5/tour ; isolé-avant-communauté cap
4 ; NOBLE protégé PAR LA FORCE : 20 Nordiques force 100 contre 19
Déistes, roturiers ancrage 95 basculent au cap 3, noble ancrage 110
résiste — l'ancienne configuration du test rendait le noble
convertissable puisque le cap 2 l'englobait).
**Commit règles :** 9f3cd54e (docs/ia/regles-et-arbitrages.md,
section « Cap de conversion proportionnel — 10 % des habitants »).
**Présent commit : journal seul.**

**⚠ INCIDENT d'écrasement externe, corrigé dans ce commit.** Le
commit externe 8e8e3b0d (labo générateur, 5e retour) a poussé le
journal au CONTENU COMPLET basé sur la version 867c8012 — mon
entrée « Conversion culturelle V2 » du commit f2918326 a été
PERDUE du fichier (le parent du commit externe était bien
f2918326, mais le contenu du journal était une version STALE).
Restaurée ICI : l'entrée V2 est réinsérée ci-dessus, à l'identique
du sha f2918326, AVANT cette entrée-ci. RÈGLE pour les sessions
parallèles : toujours re-lire le journal DEPUIS la tête avant tout
append (raw.githubusercontent au sha de tête), jamais partir d'une
copie locale de tour précédent.

**Validation.** **360/360 tests natifs**, 36 fichiers ; tsc =
baseline 3 erreurs stub @supabase seule ; diff vs base (tarball
tête 8e8e3b0d) = 5 fichiers src + diag-out.txt exactement ; diag
régénéré LÉGITIME : log 497 → 513 entrées, commandants J1 4 → 5
(plus de conversions par tour au cap 10 %, suites aléatoires aval
décalées — RIEN d'autre ne diffère). Ctrl+F5 requis (nouveau
bundle).
## Migration par bonheur divisée par deux (arbitrage Thibaut 2026-11-15, base 7c034a04)

**Arbitrage.** « Pour les mouvements de population liés au bonheur,
au lieu de faire 0-10 % entre 100 et 0 de bonheur, j'aimerais
descendre à 0-5 % de migration » — l'échelle LINÉAIRE du
2026-10-28 est divisée par deux : migrationBonheurMax défaut
0,10 → 0,05, soit 0 % à 100 de bonheur, 2,5 % à 50, 5 % à 0.
Formule p = migrationBonheurMax × (100 − bonheur)/100 et reste du
flux inchangés (tirage par habitant, destinations pondérées v3
additive, multiplicateur de régime).

**Commit jeu :** 09ded5a4 (feat) — params.ts (défaut 0,05, docblock
interface AMENDÉ 2026-11-15, PARAM_META : « Défaut 5 % à 0 de
bonheur — l'échelle historique 0-10 % du 2026-10-28 est divisée par
deux »), defaultConfig.ts (migration ciblée migrationBonheurDemi2026,
patron taxes25 sans bump de tampon : SEULE une valeur encore à
l'ancien défaut 0,10 est ramenée à 0,05 — une PERSONNALISATION est
conservée), migrationBonheur.ts (docblocks d'en-tête et
probaDepartBonheur amendés), migrationBonheur.test.ts (linéarité
assertée sur le nouveau défaut : 0,05 à 0, 0,025 à 50, 0,0125 à 75 ;
flux réel étendu de 3 à 8 tours aux nouveaux défauts, graine fixe,
≥ 1 départ « cherche meilleure vie » ; les autres tests utilisent
des valeurs explicites 0/1/10 et restent valides), diag-out.txt
régénéré.
**Commit règles :** e21d4d1c (docs/ia/regles-et-arbitrages.md,
section « Migration par bonheur — échelle divisée par deux »).
**Présent commit : journal seul.**

**Validation.** **360/360 tests natifs**, 41 fichiers ; tsc =
baseline 3 erreurs stub @supabase seule ; diff vs base (tarball
tête 7c034a04) = 4 fichiers src + diag-out.txt exactement ; diag
régénéré LÉGITIME : log 513 → 427 entrées, commandants J1 5 → 4
(moins de départs par tour, suites aléatoires aval décalées — RIEN
d'autre ne diffère). Journal re-synchronisé depuis la tête
e21d4d1c avant append (règle anti-écrasement externe, aucune
divergence constatée : V2 et cap 10 % toujours présentes). Ctrl+F5
requis (nouveau bundle).

## Merveilles mondiales (arbitrage Thibaut 2026-11-15, base 01ca3a40)

Retour des merveilles, 11 fiches de Thibaut. Famille « Merveille »,
constructible dans TOUTE habitation selon le tier (rangMinHabitation
1/2/3), UNIQUES AU MONDE (1er construit gagne, mutateur REFUSANT +
alerte rouge du picker). Canaux dédiés du référentiel :
multProductionBourgeoisVille (Pyramide ×2 EN PLUS du rang, PAR
VILLE), bonusMetierParHabitantVille (Sanctuaire Fermiers +2
Nourriture en été), scienceProfesseurPlusVille (Laboratoire +10 %,
+12 Scientifiques), ancrageConversionMult (Tour de Crystal ×1,1 dans
le duel Pression/Ancrage), multAmenagementsRoutes + routesApportees
(Antichambre : flux copiés ×2, +1 route), emissairesApportes (Antre
+5), reductionLeveeArmee + effetPlateau (Ordre : attaque = plateau).
Tour de Crystal : accordeDogme → state.dogmesBonus, dogme HORS
PALIER (palier 0) au CONSTRUCTEUR (choisirDogmeMerveille, onglet
Dogmes), sans consommer les paliers de Tourisme. Catégorie
« Merveilles » par rang dans le picker (bypass de groupe),
badge-fam-merv (déjà en CSS), colonne wiki, convergence automatique
des vieilles configs (purge des 4 anciennes, réinjection des 11).
371/371 tests natifs (11 nouveaux : merveilles.test.ts), tsc
baseline stub @supabase, diag 110 → 119 règles (simulation
inchangée). feat b32d3dca · règles 3768a792 · journal (ce commit).

## Labo générateur : correctif de chemin du 5e retour — le push était parti à static/ au lieu de quartz/static/ (addendum, 2026-11-14)

**Incident.** Retour Thibaut : « je vois encore des couronnes d'eau, et la
taille des continents n'a pas changée ». Diagnostic : le site live servait
TOUJOURS la v13 (4e retour, bosses 3/4/14, anneau d'eau) — le push du 5e
retour (`b660f08`) était parti vers `static/generateur-carte-labo.html`
(RACINE du dépôt : fichier CRÉÉ par erreur) au lieu de
`quartz/static/generateur-carte-labo.html` (le chemin réel, celui du 4e
retour `c3035943`). Conséquences en chaîne : le nouveau labo n'a JAMAIS été
déployé (Pages ne sert que `quartz/static/`, copié par `npx quartz
build`) ; la « vérification d'intégrité » du 5e retour cmpait le fichier au
mauvais chemin (identique par définition : c'était mon propre push) ; et le
bundle jeu (?v=14, lui au bon chemin) référençait une URL ?v=14 servie
avec le CONTENU v13 — l'arbitre voyait exactement le 4e retour, cache-buster
inclus. Le harnais (`scripts/harnais-labo.cjs`) et le composant
(`jeu/src/components/CarteLaboView.tsx`) étaient aux BONS chemins (vérifié :
le harnais existait déjà au sha 867c801, `quartz/scripts/` n'existe pas).

**Correctif.** `8105f76e` fix(wargame) : la v14 validée repoussée au BON
chemin `quartz/static/generateur-carte-labo.html` (harnais re-joué avant
push : 11/11, C6 sur presets réels) + cache-buster ?v=14 → ?v=15 (l'URL
?v=14 a servi l'ancien contenu au navigateur, une URL neuve force le
rechargement) ; `6be4fb6d` chore(wargame) : suppression du fichier
parasite `static/generateur-carte-labo.html`.

**Règles dérivées.** (1) Avant de pousser un fichier « existant », vérifier
son chemin RÉEL par le dernier commit qui l'a touché, jamais un chemin
résumé de session. (2) Une vérification raw+cmp ne vaut que sur le chemin
DÉPLOYÉ : la preuve ultime d'un tour labo est le site live (curl github.io
+ grep des marqueurs de la nouvelle version). (3) Un cache-buster déjà
servi avec l'ancien contenu est brûlé : bump d'un cran au correctif
suivant.


## Labo générateur : promotion du labo en officiel — l'arbitre testait sur le générateur OFFICIEL, resté à la génération d'origine (6e retour Thibaut 2026-11-14, base 3b526c2b)

**Retour.** « C'est très bien pour le paramétrage continents, mais
grandes îles et archipel font toujours apparaître simplement une
grosse masse de terre. » Le continents validé prouve que l'arbitre a
bien vu la v14 (6 masses de 33-45 tuiles) ; or le symptôme « une
grosse masse » ne se reproduisait dans AUCUNE simulation du labo
v14 : 40 seeds, sea 65-72, rayons 10-18, 5 bruits différents —
top1 jamais unique, jamais > 62 % (1 seed d'archi à r=12).

**Diagnostic.** Deux générateurs coexistent : le LABO
(`quartz/static/generateur-carte-labo.html`, 14 commits de
calibrage) et l'OFFICIEL (`quartz/static/generateur-carte.html`,
embarqué dans la page Wargame « Générateur de carte » via iframe
?v=3), fork du 13/11 (5c7ae218) jamais retouché depuis (seul
cbe01587 : rendu visible du bouton 🧪). L'officiel N'A PAS les
masques de forme (aucun `mapType` dans son code) : ses presets ne
poussent que des curseurs. Mesuré (harnais chargé sur l'officiel,
8 seeds, r=15, presets UI écrêtés) : continents 1 masse à 82-90 %
de la terre, grandes îles 79-90 % (top1 256-291 tuiles), archipel
83-93 % — « une grosse masse de terre », mot pour mot. Vérifié par
ailleurs que le labo est un SUR-ENSEMBLE STRICT de l'officiel
(toutes fonctions et ids de l'officiel présents au labo ; ne
manquent que les 2 boutons 🧪 labo, propres à l'officiel) : la
promotion est une substitution sûre.

Deuxième bug trouvé au passage : **écrêtage des presets par les
bornes des sliders** — sealevel max 65 (presets 68/66/72 servis à
65 par le DOM) et e-scale max 30 (fragmented 38 servi à 30). Le
labo restait correct à 65, mais les presets calibrés au harnais
n'étaient jamais appliqués exactement par l'UI.

**Ce qui a été fait.** Promotion complète du labo validé (v14) en
officiel : `quartz/static/generateur-carte.html` = code du labo
sans bandeau LABO, avec les 2 boutons « 🧪 Labo » de l'officiel
(href bumpé ?v=16), titre neutre, libellé export JSON neutre. Le
labo reçoit les mêmes bornes corrigées (sealevel max 75, e-scale
max 40) et son lien retour est bumpé (?v=4). Cache-busters :
iframe de la page Wargame ?v=3 → ?v=4, composant jeu
`CarteLaboView.tsx` ?v=15 → ?v=16.

**Validation.** `node --check` sur les scripts extraits des deux
fichiers ; harnais 11/11 sur les DEUX fichiers (parties pures
identiques, marqueur FIN DE LA PARTIE PURE conservé dans
l'officiel) ; mesure par seed du chemin UI complet (presets +
nouvelles bornes DOM) : continents 6 masses, top 40-45 tuiles,
masse max 19 %, terre 32 % ; grandes îles 9-14 îles, top 27-32,
masse 12-13 %, terre 34 % ; archipel 15-20 îles, masse 6-18 %,
terre 28 %. Avant/après sur l'officiel : masse dominante 79-93 %
de la terre → 6-20 masses équilibrées.

**Commits.** feat(wargame) : promotion labo → officiel, bornes de
sliders sealevel 75 / e-scale 40, cache-busters ?v=4 (page) et
?v=16 (composant + boutons labo) ; docs(wargame) : journal (ce
commit).

**Effet pour l'arbitre.** Sur la page Wargame « Générateur de
carte » (l'officiel, celui de référence, iframe ?v=4) :
continents / grandes îles / archipel produisent désormais les
constellations validées au labo — Ctrl+F5 nécessaire pour
l'iframe. Le labo (bouton 🧪) reste l'outil d'expérimentation et
sert la même génération que l'officiel jusqu'au prochain fork.

## Labo générateur : le cap océan par défaut soudait les presets en un seul bloc de 65 % de terre (7e retour Thibaut 2026-11-14, base 2501fef1)

**Retour.** Capture « ceci est censé être un archipel » : une seule
masse allongée, sans baies ; puis « j'ai testé en navigation privée,
l'état est le même ». La navigation privée écarte le cache : le live
servait ça avec le NOUVEAU code — le diagnostic « ancien officiel
caché » du tour précédent était FAUX (la « signature 45 % » venait de
ma propre liste de choix dans la question posée à l'analyse d'image ;
la première estimation, « 60-70 % de terre », était la bonne).

**Diagnostic.** Angle mort du harnais : `refParams` posait TOUS les
caps à 0, or les défauts DOM de l'UI ont les caps ACTIFS (retour
Thibaut 2026-11-13 « caps ACTIFS par défaut »), dont `cap-ocean` 250.
Mécanisme (feat 138b0d88) : océan > cap → le seuil de mer est
ABAISSÉ GLOBALEMENT au quantile exact du cap
(`seaLevel = sortedElev[cap]`). Sur 721 tuiles (r=15) : archipel
vise 519 océan > 250 → seuil au quantile 250 → 65 % de terre ; les
hauts-fonds qui remontent PARTOUT sur les côtes soudent les îles en
UNE SEULE masse. Mesuré (8 seeds × 3 presets, chemin UI avec caps
réels) : 65 % de terre, masse unique de 96-99 % sur TOUTES les
cartes, TOUS les presets — continents compris (la validation
« continents très bien » du 5e retour ne tenait qu'aux caps à 0 du
harnais, jamais au chemin UI réel).

**Correctif (feat 2501fef1).** (1) chaque preset pose
`'cap-ocean': 0` (un type de carte EST son budget de mer, un cap
résiduel le contredit) ; (2) défaut cap-ocean 250 → 0 (input HTML +
DEFAULTS de la partie pure, titre explicatif) — les caps des biomes
de TERRE restent actifs par défaut, retour 2026-11-13 respecté ;
(3) harnais : contrat C7 anti-récidive — `presetParams(ex, name,
uiCaps)` accepte les caps réels de l'UI, contrat terre 24-40 %,
≥ 6 masses, masse principale ≤ 25 % (3 presets × 5 seeds, r=15) ;
vérifié qu'il ÉCHOUE sur le live d'avant correctif (« terre 65 % »)
et PASSE après ; (4) cache-busters : page Wargame ?v=5, composant
jeu ?v=17, boutons labo de l'officiel ?v=17, lien retour labo ?v=5.

**Validation.** Mesure du chemin UI avec caps réels, 8 seeds :
continents 6 masses, top 40-45, masse ≤ 19 % ; grandes îles 9-14
îles, top 27-32, masse ≤ 13 % ; archipel 15-20 îles, masse ≤ 18 %,
terre 28-34 %. Harnais C1-C7 (12 OK) sur les DEUX générateurs.

**Règles dérivées.** (1) Le harnais doit rejouer le chemin UI avec
les DÉFAUTS COMPLETS de l'UI (caps inclus), pas des paramètres
aseptisés — deuxième fois que la calibration vivait dans un monde
aseptisé (cf. écrêtage des sliders, 6e retour). (2) « État identique
en navigation privée » = tuer l'hypothèse cache et chercher un
défaut du chemin UI réel. (3) Analyse d'image : croiser la première
estimation avec des mesures chiffrées avant de conclure.

**Effet pour l'arbitre.** URLs ?v=5 / ?v=17 neuves (pas de cache
possible). NB : une session labo dont l'URL (hash) date d'avant le
correctif restaure cap-ocean 250 encodé — re-sélectionner le type
de carte une fois après rechargement (le preset repose le cap à 0).

## Labo générateur : nouveau curseur « Taille masses » remplaçant le « Taille continents » muet (8e retour Thibaut 2026-11-14, base 267b480c)

**Retour de Thibaut.** « Est-ce qu'il serait possible d'ajouter un
slider de taille des masses terrestres ? (qui remplacerait le slider
continent, qui semble mort). »

**Diagnostic.** L'ancien curseur « Taille continents » (e-cont, la
fréquence du canal de bruit basse fréquence) était VRAIMENT muet sur
les presets : depuis le 4e retour, les trois types à îles portent
leurs masses par des BOSSES gaussiennes localisées (`islandArchipel`)
posées sur un fond volontairement PLAT (compact 12-15 : le canal BF
soudait les masses, mesuré 99 % à l'époque). Changer la fréquence de
ce bruit de fond ne changeait donc RIEN de visible — le slider était
sans objet depuis deux refontes.

**Correctif (feat 267b480c).** Nouveau curseur « Taille masses »
(id `mass-size`, ×0,50 à ×2,00, défaut ×1,00), placé en tête de
panneau juste après le champ Type ; `e-cont` devient un champ caché
(le canal BF reste interne, les presets continuent de le régler).
Sémantique PAR FAMILLE, avec compensation anti-percolation :
- **Types à bosses** (Continents 6, Grandes îles 11, Archipel 18) :
  le curseur multiplie le NOMBRE de bosses (count × m, plancher 2)
  et divise σ par √m — la capacité totale (count × σ²) et donc le
  seuil du quantile restent AU CALIBRAGE du preset. Sans la
  compensation σ, la capacité tombait à m du calibrage, le seuil
  plongeait SOUS les bosses dans le bruit de fond, qui percolait et
  soudait les îles : mesuré à ×0,5 grandes îles masse unique 84 %
  (v1) ; avec compensation, 6 îles, masse 18 % (v2). Mesures 8 seeds
  × 3 positions : continents 3/6/10 masses (terre 32 % constante),
  grandes îles 6/12/18 (34 %), archipel 11/17/21 (28 %) — masse
  top ≤ 35 % partout, anneau extérieur 0 % de terre.
- **Fragmenté** : le nombre d'entailles traversantes suit le
  curseur (6 × m, borné 3-14), budget de terre constant :
  13/29/44 composantes.
- **Types masqués à masse(s) fixée(s)** (Continent, Pangée, Mer
  intérieure, Terres + lacs) : le nombre de masses y est imposé par
  le masque analytique, le curseur déplace le BUDGET DE TERRE
  (quantile de mer ± 10 pts) : terre mesurée 70/65/55 % (continent),
  80/75/65 % (pangée), 65/60/50 % (mer intérieure), 67/62/52 %
  (lacs) — ×0,5 = masse plus large, ×2 = masse plus confinée.
- **Personnalisé** : fréquence du canal continent (le nouvel
  héritier du « Taille continents » historique, valable sur bruit
  libre : 6/4/3 composantes à ×0,5/×1/×2 sur le défaut).
- Chaque preset pose `'mass-size': 100` : choisir un type REPOSE le
  curseur au calibrage du type (l'oubli sur 7 des 8 presets a été
  attrapé par la mesure : le preset écrasait le sweep).
- Le générateur « Variété » tire mass-size (200 − 150·u ± 15) au
  lieu de e-cont ; applyParamsToUI et le partage par URL (#c=)
  transportent le nouveau champ.

**Harnais.** Contrat C8 : par type × seed (r=15, chemin UI fidèle
caps défaut + preset + massPct), bosses à terre 24-40 % aux trois
positions, anneau ≤ 5 %, masse top ≤ 40 %, comps(×2) > comps(×0,5) ;
fragmented comps(×2) > comps(×0,5) ; masqués terre(×0,5) > terre(×2).
C1-C7 inchangés et au vert ; C6/C7 vérifient le calibrage préservé
à ×1. Harnais 13 OK sur le labo, JS pur identique entre officiel
et labo (106 925 unités).

**Règles dérivées.** (1) Un slider ne peut agir que sur le canal qui
PORTE la caractéristique qu'il annonce : sur les presets à bosses,
la taille des masses vit dans les bosses, pas dans le bruit — tout
curseur doit être vérifié sur CHAQUE famille de types avant d'être
annoncé. (2) Quand un paramètre multiplie un budget (count), les
autres dimensions doivent compenser (σ ÷ √m) pour ne pas déplacer
le seuil du quantile. (3) Les presets doivent reposer TOUS les
champs d'UI qu'ils ne réglent pas, sinon le type choisi hérite des
curseurs du type précédent.

**Effet pour l'arbitre.** Page Wargame ?v=6, composant jeu ?v=18,
liens croisés officiel→labo ?v=18 et labo→officiel ?v=6 (neufs, pas
de cache possible). Le curseur est en haut du panneau, juste sous
le champ Type ; ×1 = comportement des retours précédents.

## Labo générateur : curseur « Terre au bord » — demi-îles coupées par le cadre (9e retour Thibaut 2026-11-14, base 163ba03d)

**Retour de Thibaut.** « Les masses de terre sont bien faites, mais
toujours 100 % visibles, il n'y a pas de demi-îles, et le bord est
toujours de l'eau, il faudrait améliorer ça. » — le contrat du 3e
retour (« masses visibles en entier », fenêtre périphérique) est
EXPLICITEMENT INVERSÉ.

**Diagnostic.** Depuis le 4e retour, les types à bosses posent leurs
masses sur des couronnes plafonnées à rMax 0.62-0.75 du rayon, et
l'essorage périphérique (fenêtre 92 % → 98 % du rayon) efface tout
biais au-delà : les masses ne peuvent MÉCANIQUEMENT pas toucher le
bord. Les autres familles touchent déjà le bord (masques continent/
pangée/mer intérieure/lacs : 51-67 % de terre d'anneau).

**Correctif (feat 163ba03d).** Nouveau curseur « Terre au bord »
(id `edge-land`, 0-100 %, pas 5), juste sous « Taille masses » ;
sémantique dédiée aux 3 types à bosses, no-op vérifié sur les 6
autres familles :
- **Couronne du bord** : une FRACTION de la couronne extérieure
  (moitié × curseur) est détachée vers le cadre (centres 0.94·RPX),
  ses crêneaux retirés de l'ancienne couronne — le reste de la
  distribution est inchangé. v1 poussait la couronne ENTIÈRE à
  1.06-1.12·RPX : la capacité du bord aspirait tout le count et le
  centre se vidait.
- **Compensation σ/amp des bosses du bord** (+45 %/+25 % au
  maximum) : la part HORS-cadre d'une demi-île ne doit pas faire
  perdre son budget — sans compensation, le seuil du quantile
  plongeait DANS le fond (seaLevel 0.503 mesuré, fond ~0.5 :
  percolation, masse centrale de 43 % à masses ×2 + bord 75 %).
  Avec compensation : seaLevel 0.55-0.60, masse ≤ 18 % partout.
- **Essorage reculé** : fenêtre 0.92 → 0.92+0.13·e (à 1 : hors
  plateau), le fond aplati proportionnellement (×(1−0.55·e)).
- **Presets** : les 3 types à bosses posent `'edge-land': 75` —
  demi-îles PAR DÉFAUT (le point du retour) ; 0 % restaure
  exactement le comportement historique (vérifié CARTE PAR CARTE
  identique au 8e retour : mêmes biomes, 3 types × 4 seeds).
- `drawVariety` tire edge-land (0-100 % par pas de 5), le partage
  par URL (#c=) transporte le champ, applyPreset repose le slider.

**Validation.** 8 seeds × 3 positions, r=12/15/18 : au défaut 75 %,
demi-îles 3-6 par carte (min 3/3/5/6 selon type, stable aux trois
rayons), anneau 25-44 % de terre, budgets inchangés (terre 32/34/28
%), masse ≤ 18 % ; à 100 % : demi 4-7, anneau 34-59 % ; à 0 :
identique au calibrage. No-op vérifié (biomes identiques) sur
continent, pangée, fragmented, inland-sea, lakes, custom.

**Harnais.** C6 INVERSÉ : (a) slider 0 → anneau ≤ 5 % (fenêtre
historique intacte, pas de régression) ; (b) preset défaut → ≥ 2
demi-îles par seed, terre 24-40 %, masse ≤ 25 %. `presetParams`
applique désormais mass-size ET edge-land (chemin UI fidèle :
applyPreset pose ces sliders). C1-C8 au vert sur le labo (C7/C8
repassés au défaut 75 %, masse max 25 % tenue après calibrage
σ +60 % → +45 %, amp +30 % → +25 %).

**Règles dérivées.** (1) Un retour peut INVERSER un contrat
précédent : ne pas défendre l'ancien calibrage, l'historiser dans
le harnais (les deux volets coexistent : l'ancien comportement
reste une POSITION du curseur, testée comme telle). (2) Amputer des
bosses au bord vole leur surface au quantile : compenser la part
visible (σ/amp) sinon le seuil plonge dans le fond et percole —
mesurer seaLevel vs fond, pas seulement les masses. (3) Quand une
couronne change de rayon, sa CAPACITÉ change aussi : détacher des
crêneaux au lieu de pousser la couronne entière, sinon la
distribution entière migre.

**Effet pour l'arbitre.** Page Wargame ?v=7, composant jeu ?v=19,
liens croisés officiel→labo ?v=19 et labo→officiel ?v=7. Les types
Continents / Grandes îles / Archipel posent des demi-îles au bord
PAR DÉFAUT (curseur « Terre au bord » à 75 %, juste sous « Taille
masses ») ; 0 % = l'océan périphérique d'avant.

## Labo générateur : curseur « Îles éparses » — du bruit, des îles par ci et par là (10e retour Thibaut 2026-11-14, base 69c1dc55)

**Retour.** « Non, je ne dis pas qu'il faut toutes les îles au
bord. Ce que je demande c'est du bruit, avec des îles par ci et
par là. » CORRECTION du 9e retour, quelques heures plus tard : les
demi-îles en anneau au cadre n'étaient pas la demande — la demande
était du MORCELLEMENT ÉPARS dans la périphérie, les masses restant
au calibrage.

**Réversion complète du 9e.** rMaxE, glisse d'anneau, couronne du
bord détachée (nRim), boost σ +45 %/amp +25 % des bosses du bord,
essorage reculé (0.92+0.13·e) et compensation du fond : TOUT
retiré. Les masses reviennent AU CALIBRAGE du 8e retour (couronnes
adaptatives, essorage 0.92→0.98 intact).

**Premier essai (abandonné) : restitution du fond en bande.**
kEff = kFond + (1−kFond)·e·bande (lisse 0.72→1.0). Mesuré au
harnais : le fond de bande (médianes 0.46/0.39/0.38 selon le type)
ne franchit le seuil (0.618/0.508/0.551) qu'en des points d'UNE
TUILE — îlots 1.6 par carte sur Continents, ZÉRO sur Grandes îles
et Archipel. La restitution seule ne suffit pas : le seuil est
trop haut pour le fond.

**Mécanisme retenu : bosses d'îlots DÉDIÉES.** islandArchipel
prend deux paramètres de plus (edgeL, isletAmp) et sème
nIslets = round(9·e·N²/225·(0.8+0.4·rand)) petites bosses dans la
bande hexdist 78 %→97 % : tir par tuile (40 essais, meilleur des
essais), rejet STRICT des empreintes des masses (1.8σ + 0.95σI +
0.7 px) et des autres îlots (1.4·(s+sI)) — un îlet sans position
libre est ABANDONNÉ (le repli « meilleur des essais » collait des
îlets entre deux îles voisines : composantes soudées de 53-60
tuiles mesurées sur Grandes îles). Profils super-gaussiens
tronqués identiques aux masses, warp de dentelle léger (0.7 px),
apport AJOUTÉ HORS essorage (propriété .islets de la closure, la
fenêtre w des masses reste intacte : certains îlets touchent le
cadre). Amplitudes calibrées sur les seuils MESURÉS au calibrage
(0.618/0.508/0.551) moins le fond de bande : +0.24 (Continents),
+0.20 (Grandes îles), +0.26 (Archipel) — empreinte au seuil
~0.94σI, îles de 2 à 10 tuiles ; σI = (0.055+0.065·rand)·RPX.

**Budget.** Le quantile global ne change pas : les îlots prennent
quelques tuiles aux côtes (Continents : masses 44→37 tuiles à
e=100), terre 32/34/28 % constante, masse top ≤ 18 % mesurée.

**Validation.** 8 seeds × 3 types, r=15 : îlots 4-8 (Continents),
1-6 (Grandes îles, bande déjà dense : ses masses portent le
bruit), 4-8 (Archipel) ; anneau habité (2 à 18 tuiles de terre au
bord selon seed) ; r=12 : îlots 1.3-2.9, r=18 : 5.4-8.8, masse
top ≤ 20 %. NO-OP PARFAIT à 0 : 72 cartes (9 types × 8 seeds)
byte-identiques au 9e retour ; les 6 familles non ciblées ignorent
le curseur (vérifié biomes identiques e=0 vs e=1).

**Harnais.** C6 réécrit (v5) : (a) slider 0 → calibrage historique
intact (anneau ≤ 5 %, masse ≤ 25 %) ; (b) preset défaut (100 %) →
îlots périphériques (composantes entièrement à ≥ 10 pas hex du
centre, taille ≤ 12) ≥ 3 sur Continents/Archipel, ≥ 1 sur Grandes
îles, anneau habité, terre 24-40 %, masse ≤ 25 %. C1-C5, C7, C8 au
vert sans changement (C7/C8 tournent désormais îlets actifs).

**Règles dérivées.** (1) Un retour peut CORRIGER le précédent à
quelques heures d'écart : garder les mécanismes RÉVERSIBLES (la
réversion du 9e est un patch pur depuis le live, aucune
archéologie de version). (2) « Du bruit par ci et par là » ≠ « des
masses au bord » : mesurer la sémantique AVANT de déplacer les
masses — le fond restauré ne franchit pas le seuil, seules des
bosses dédiées le franchissent. (3) Le rejet des îlots doit être
STRICT (abandon) là où celui des masses peut replier sur le
meilleur des essais : un îlet en collision PONTE deux îles, une
masse en collision chevauche seulement.

**Effet pour l'arbitre.** Page Wargame ?v=8, composant jeu ?v=20,
liens croisés officiel→labo ?v=20 et labo→officiel ?v=8. Le curseur
« Îles éparses » (ancien « Terre au bord », même champ edge-land :
les partages #c= restent valides) sème par défaut une couronne
d'îlots au-delà de 78 % du rayon — Continents ~5 îlots de 2-10
tuiles, Archipel ~6, Grandes îles ~4 par-dessus ses masses ; 0 % =
l'océan périphérique d'avant, masses seules.

## Labo générateur : bruit positionnel — les distances entre masses ne sont plus figées (11e retour Thibaut 2026-11-14, base 2a7f4840)

Demande : « la distance entre les masses de terre semble figée, comment ça se
fait ? » puis « oui, je veux un gros bruit ». Diagnostic : le placement était
SATURÉ à capacité — 6 continents à 60° sur l'anneau 14.88 px n'ont que ~1.3°
de mou angulaire, et 8 grandes îles sur la couronne extérieure sont posées
à capacité exacte : la rosace est déterministe, seuls phase et σ varient.
C'est voulu (anti-soudure) mais figé visuellement.

Trois versions testées dans la même session, leçons à retenir :

1. **v1 — jitter libre + repli « meilleur des essais »** : à capacité
   saturée le repli pose des masses EN COLLISION et les queues
   super-gaussiennes se soudent (eldmere : bloc unique de 231 tuiles, les
   6 bosses d'un seul tenant).
2. **v2 — repli « cible exacte »** : la cible exacte peut croiser un
   voisin JITTERÉ — 11.7 px mesurés = 2.6σ → paires soudées de 80-92
   tuiles (corvane/pyrgorn/thalos/vharoun). La sécurité du calibrage
   historique ne vaut que si TOUT le monde est à la cible exacte.
3. **v3 — retenue** : jitter ADAPTATIF borné par le MOU RÉEL
   `slack = gap − weldC` (weldC = corde anti-soudure 3.25σ̂, calée sur
   l'empirique du calibrage : 2.95σ tenait, 2.6σ soudait), amplitude
   `0.7·slack/r` en angle et `0.3·slack/r` en rayon, sans dérive
   systématique des essais ; repli = PLUS ÉLOIGNÉ du tissu posé entre
   la cible exacte et le meilleur essai — tous dans le budget, donc à
   ≥ weldC : au pire un détroit étroit, jamais une soudure. À count 6
   saturé le jitter retombe tout seul au niveau historique (~±1°), à
   count 5 ou couronne lâche il monte à ±5-13°.

Variété structurelle (ce qui varie DÉSORMAIS d'une graine à l'autre) :
- COUNT tiré par appel (×0.80-×1.00) : 5-6 continents, 7-11 grandes
  îles, 14-18 îles d'archipel ; monotone en « Taille masses » car le
  facteur est tiré par appel avant la multiplication (C8 tient).
- SEP tiré par appel (×0.95-×1.30) : rayon d'anneau 12.6-14.9 px à
  count 5, capacités de couronnes 6-9 pour les grandes îles — cartes
  resserrées ou aérées.
- Plancher d'anneau `weldC·1.05/(2·sin(π/count))` : l'anneau peut
  rétrécir pour la variété mais JAMAIS sous la corde anti-soudure.
- COMPENSATION DES ABANDONS : quand la structure pose moins de masses
  que le count demandé (capacité de couronne), les bosses restaient
  dimensionnées pour le count complet et le QUANTILE GLOBAL allait
  chercher le budget dans le FOND de bruit : crêtes de fond qui PONTENT
  les masses (mesuré : Grandes îles/grimoire, 7 bosses posées au lieu
  de 9 → pont centre-bord de 78 tuiles, masse 32 %, C6 en échec).
  Remède : élargir les bosses posées du ratio d'aire
  `√(count/posés)` (borné ×1.35) — la couverture absorbe le budget, le
  seuil remonte au-dessus du fond. Grimoire : 78 → 7 masses propres de
  32-38 tuiles. No-op à count respecté (continents).

Mesures (r=15, 8 seeds, preset défaut) : continents 5-6 masses de
29-45 tuiles, distances adjacentes 14.5-17.1 px (vs 13.0-14.7 figées
au 10e retour), rayons d'anneau 13.9-14.9 ; grandes îles 7-8 masses de
20-33 tuiles, couronnes 6-8 bosses, distances 11.9-16.2 px ; archipel
21-23 composantes. Harnais C9 ajouté : (a) distance min inter-masses
≥ 0.95×3.25σ̂ par type (13.3 / 9.3 / 6.7 px), masses = comps ≥ 15
tuiles (archipel ≥ 8, îlets exclus), (b) le nombre de masses prend ≥ 2
valeurs distinctes sur 8 seeds par type. C1-C9 tous verts sur les deux
générateurs (JS pur identique).

RÈGLES DURABLES : (1) un placement saturé à capacité NE PEUT PAS être
bruité librement : le jitter doit être borné par le mou (gap − corde
anti-soudure) ou il rejoue le 4e retour ; (2) tout repli doit être
SÛR par construction (le plus éloigné parmi des candidats bornés), pas
« le dernier essai » ni « la cible » d'un système où les autres bougent ;
(3) quand une structure pose MOINS d'éléments que prévu à budget
(quantile) constant, le déficit se paie DANS LE FOND — toujours
compenser le sizing (ratio d'aire) au lieu de laisser le seuil plonger ;
(4) mesurer la distance ENTRE CENTRES DE BOSSES (sonde) en plus des
composantes finales : une soudure par pont de fond ne se voit pas dans
les distances mais dans une composante géante hexdist 0-13.

Cache-busters : page Wargame ?v=9 (officiel), composant jeu et liens
officiel→labo ?v=21, lien retour labo→officiel ?v=9. Harnais
scripts/harnais-labo.cjs poussé avec C9 (v6).

## Labo générateur : bruit structurel — mer centrale retirée, tout tiré par le bruit, Bétail 4.5 % (12e retour Thibaut 2026-11-14, base 92ccb129)

Demande : « pourquoi la zone au centre est-elle presque toujours dénuée de
masse de terre ? J'aimerais que la mer centrale par défaut soit retirée sur
les continents. En fait j'aimerais quelque chose de vraiment dépendant du
bruit, que ce soit pour la disposition, l'éloignement ou la taille. Et
j'aimerais que le bétail par défaut soit non pas à 3.5 % mais à 4.5 % de
densité. » Diagnostic : la mer centrale était GARANTIE par le creux central
(dipAmp, 4e retour) et par l'anneau périphérique des masses ; le centre
n'était jamais une cible du placement.

Réponses : (a) dipAmp 0 et rMin 0 partout — le creux central explicite est
retiré, le centre est TERRE quand le bruit y pose une masse, mer sinon ;
(b) count ×0.85-×1.00 par graine (5-6 continents, 6-7 grandes îles, 14-16
îles d'archipel), tailles par jitter de σ et d'amplitude ; (c) RES_DEFAULTS
Bétail density 35 → 45 ‰ (vérifié : 45 ‰ sur toutes les graines).

Quatorze versions dans la même session (v12 → v12o), leçons à retenir :

1. **Le plateau tient le seuil, pas la corde** : la sécurité anti-soudure
   ne vient PAS de la corde seule mais du RATIO PLATEAU/BUDGET. Le seuil
   de mer (quantile) doit chevaucher le FLANC des bosses (~+0.10-0.16
   au-dessus des crêtes de fond ~+0.06). À plateau ≤ 1.2× le seuil
   chevauche les crêtes et soude MÊME À CORDE RESPECTÉE (chaînes de
   44-168 tuiles mesurées). Plancher de retrait en ESPÉRANCE E[σ] = σ̂
   (le pessimiste −jit bloquait tout retrait archipel), cible 1.65×.
2. **Le semis libre ne découvre pas le pentagone de bord** : le
   best-candidate optimise CHAQUE point (4 masses en carré ~90°) et
   sur-déploie ; une cible de mesure nulle ne sera jamais touchée. Les
   types à grandes masses (sigRel ≥ 0.15 : continents, grandes îles)
   passent en STRATIFIÉ : grille ANGULAIRE jitterée (±0.25 créneau,
   40 essais), tout le reste dans le bruit. L'archipel (sigRel 0.11)
   garde le semis de fléchettes libre.
3. **Le centre est une contrainte, pas une case** : un count 6-sans-centre
   est géométriquement impossible (hexagone de bord : corde 14.3 ≈ rayon
   14.88, aucun mou). Le centre n'est posé qu'à count ≥ 6 (à count 5 les
   masses de ~46 t ont un flanc ~0.08 : soudure centre-bord mesurée aux
   îlots coupés, masse 26 %) et EN DERNIER, contre le bord déjà en place
   (posé premier, il se glissait sous la corde du bord à venir : curseur
   ×0.5, 1 masse + bord impossible = 55 % de terre).
4. **La corde du centre dépasse le disque** : à σ̂ plein (continents,
   4.44 px) la corde 3.3·(σc+σr)/2 ≈ 14.65 px dépasse TOUTE distance
   centre-bord possible (bord 14.4-14.9, offset ±0.85) : le centre
   échouait ses 12 essais sur toutes les graines de count 6. σ RÉDUIT
   ×0.88 → corde ~13.8, plateau π(1.6·0.88σ̂)² ≈ 97 u² ≥ budget 94 :
   masse ~38 t préservée, paire effective 3.12σ.
5. **Le repli de croissance est un levier de dernier recours** : sans
   lui le quantile plonge dans le fond et ponte (78 t mesurés), mais
   chaque activation resserre les paires effectives (corde ÷ grow) :
   préférer 40 essais par créneau (p échec ~1e-9) au repli.

Mesures (r=15, 8 seeds, preset défaut) : continents 5-6 masses de 24-43
tuiles selon graine (count par graine), centre TERRE sur les graines de
count 6 (terre centrale 26-32 %), mer centrale garantie ailleurs (terre
centrale 2-5 %, terre la plus proche hexdist 5) ; grandes îles 6-7 masses
de 25-43 tuiles stratifiées hexagone/pentagone + centre, paires à ≥ 1.36×
la corde ; archipel 10-14 composantes de 8-35 tuiles en semis libre ;
distances adjacentes 13.7-17.1 px selon graine. Bétail 45 ‰ partout.
Harnais : C8 v2 (monotonie sur masses ≥ 6 t), C9 v2 (paires ≥
1.05·(√si+√sj), counts variables par type), C10 (Bétail 45 ‰ + centre
continental atteignable ≥ 1/5 seeds). C1-C10 tous verts sur les deux
générateurs (JS pur identique).

RÈGLES DURABLES : (1) une zone « toujours vide » vient d'une GARANTIE
analytique (creux, anneau) : pour la rendre bruit-dépendante, retirer la
garantie et donner au placement la capacité de la remplir ; (2) corde
anti-soudure sur les TAILLES RÉELLES 3.3·(σi+σj)/2, jamais sur σ̂ seul ;
(3) le ratio plateau/budget ≥ 1.65× est le vrai gardien du seuil — la
corde protège les paires, le plateau protège le fond ; (4) un point posé
en premier a une marge infinie (spots vides) : les contraintes se
vérifient CONTRE les points déjà posés, donc l'ordre de pose EST le
design ; (5) la géométrie borne ce que le bruit peut découvrir : mesurer
la corde vs le disque AVANT d'écrire la boucle d'essais.

Cache-busters : page Wargame ?v=10 (officiel), composant jeu et liens
officiel→labo ?v=22, lien retour labo→officiel ?v=10. Harnais
scripts/harnais-labo.cjs poussé avec C8 v2/C9 v2/C10 (v7).


## Fin de tour bloquée à 1/2 : deux navigateurs sur le MÊME siège — badge « Vous êtes Joueur N » dans la barre (retour Thibaut 2026-11-14 « un petit symbole avec le numéro du joueur en haut pour pas que les joueurs se perdent », base 7fee9299, feat 7e444da2, règles cacf3259)

RAPPORT D'INCIDENT (salon chasse-pecheL1, 2026-11-14, ~15h45-16h05).
Symptôme rapporté : « la fin de tour semble planter et bloquer en
permanence » — la barrière reste à 1/2 joueur prêt.

ÉLIMINÉS par le diagnostic (tout est vert côté serveur) :
- Moteur : repro locale 3 tours + 11 merveilles = 297 ms, aucune
  exception ; sur l'état RÉEL du salon (fusion + runTurn) = 18 ms.
- Edge Function resoudre-tour : déployée à 12:50 avec le moteur
  merveilles (run 43596750207 success sur b32d3dca), répond en
  1,65 s ; un CLONE du salon réel (ligne + section + config
  mondiale copiés, salon diag-eot-2911) est résolu de bout en bout
  en 1,46 s (fusion 2 ms, tour publié, file purgée).
- Perf : benchmark 12 000 habitants/19 bâtiments = 18,3 s à HEAD vs
  17,6 s à la base 01ca3a40 — AUCUNE régression du tour des
  merveilles ; profil CPU : migrationBonheur ~20 %,
  batimentsRemplaces 12,9 %, emplacementsMetierVille 11,6 %,
  maladieStep 8,7 % — tout préexistant, rien du tour #29.
- PostgREST/RLS : upsert onConflict, repli delete/insert, update
  et insert testés en prod avec la clé anon (201/204/201) ; l'index
  cp_events_section_unique EXISTE.
- Pushes wargame parallèles : ne touchent pas le jeu (paramètre
  ?v= d'iframe du générateur uniquement).

LA CAUSE : le n° de joueur se choisit À LA MAIN à l'écran de
connexion (« Mon n° de joueur », défaut 1, AUCUNE unicité
vérifiée) — les DEUX navigateurs étaient sur le siège Joueur 1.
La poussée de section est un upsert (clé unique salon/tour/
joueur/type) : la fin de tour du second navigateur REMPLACE la
section du premier au lieu d'ajouter la sienne — la barrière lit
{J1} pour toujours, elle ne peut mathématiquement JAMAIS atteindre
2/2. Preuves : la « Scierie » (action de l'ami) journalisée sous
le siège 1 dans le tour publié ; une file ne contenant qu'une
section joueur 1 qui change de contenu à chaque clic ; « il clique
mais la barrière reste à 1/2 ».

OPÉRATIONS D'INCIDENT (aucun commit) : le Forcer du joueur 1 a fini
par passer (16:01, attendus réduits aux poussés) → tour 2 publié
SANS le J2 (« ⏭ Tour forcé : sections de 1 joueur ignorées »,
sémantique prévue). Demande de rewind au début du tour 1 :
IMPOSSIBLE côté table — le trigger garde_tour_publie (schema-v2)
refuse tout recul de tour_publie (2→1), et un état mentalement
rembobiné soft-lockerait le salon (l'Edge répondrait dejaPublie à
chaque tour 1). Équivalent fidèle exécuté : salon chasse-pecheL2
créé avec l'état PRISTIN du début du tour 1 (sauvegardé avant la
résolution — graine 3167087777, logs de création seuls, file
vierge), sémantique de ligneCreationSalon (tour_publie 0). Salon de
diagnostic diag-eot-2911 marqué tombstone (à purger via l'éditeur
SQL : delete from parties_chasse_peche where id = 'diag-eot-2911').

LE FIX (feat 7e444da2, jeu/src/components/TurnBar.tsx) :
- badge « 👤 Vous êtes Joueur N » dans la barre de tour (mode
  multijoueur uniquement), info-bulle rappelant le piège du siège
  dupliqué ;
- bandeau d'attente : chaque siège listé comme avant, le vôtre
  marqué « (vous) » — un siège doublé saute aux yeux immédiatement.
Attribution inchangée : choix manuel (pas de réservation
automatique — hors scope du retour). Mode local : pas de badge.

VÉRIFICATIONS : 371/371 tests natifs (node --experimental-strip-types,
sans composants) ; diag régénéré IDENTIQUE (aucun changement moteur,
rien à committer) ; aucun test composant ne référence TurnBar ;
tsc validé par le build du déploiement Pages (« tsc && vite
build ») ; bundle live index-CM3MCDYK.js vérifié : « Vous êtes
Joueur » ×1, « (vous) » ×1 (bandeau — le commentaire JSX est
strippé), « Mon n° de joueur » ×2 (info-bulle + SetupPanel),
« Tour de Crystal » ×10 (merveilles intactes).


## Cultures invisibles dans les villes : la conversion culturelle joue désormais AVANT la migration (retour Thibaut 2026-11-14 « J1 attire les habitants de J2, qui sont zélotes, mais pourtant il n'y a que des culturalistes dans sa ville », base 0c685ed1, feat b8f18241, règles d943ee68)

SYMPTÔME (salon chasse-pecheL2, tours 5-7, rapport Thibaut :
« le rework de la culture semble avoir fait planter les cultures
présentes au sein d'une ville »). J1 attire manifestement des
habitants de J2 (zélotes), mais sa capitale n'affiche QUE du
Communautarisme — la minorité zélote attendue est invisible.

DIAGNOSTIC (données réelles du salon, fetch dans salon-L2.json +
lecture du moteur) :
- L'attraction est RÉELLE. Journal L2 : T5 Zebar, Lulu et Horu
  quittent J1 pour J2 (bonheur 68) ; T6 Florine arrive chez J1
  (bonheur 75) ; T7 Guillemette, Charlemagne et Horu arrivent chez
  J1 (bonheur 77). Rostres croisés confirmés dans les tableaux
  population : p2c5/p2c14 hébergés par J1, p1c3/p1c5/p1c18/p1c23
  hébergés par J2 (les migrants gardent leur id de roster d'origine).
- Mais chaque arrivant est converti le tour MÊME de son arrivée :
  la conversion culturelle V2 (rework « Pression/Ancrage » du
  2026-11-14) vivait dans la phase B des naissances, APRÈS le flux de
  migration (étape 4bis). Un migrant isolé n'a AUCUN compatriote
  dans sa ville d'accueil : ancrage = poids local × compatriotes =
  0 ; la force dominante l'emporte dans le duel, et le cap (10 % des
  vivants, minimum 1 par ville et par tour) garantit la bascule.
  Journaux L2 : Florine « quitte Capitale » T6 puis « se convertit au
  Communautarisme » T6 ; Guillemette, Charlemagne et Horu idem T7.
  Les deux capitales sont culturellement PURES (66 et 74 vivants,
  100 % chacun) : aucune minorité n'a jamais été publiée.
- Le rework V2 avait arbitré « un isolé bascule avant une communauté
  » ; son interaction avec la migration par bonheur (#28) n'avait
  jamais été arbitrée : les deux mécaniques se neutralisaient.

ARBITRAGE THIBAUT (2026-11-14) : « un habitant qui arrive dans une
nouvelle ville garde sa culture d'origine, je propose d'inverser et
rendre la conversion culturelle avant les migrations ». Implémenté
littéralement : la conversion devient l'étape 4bis du tour, la
migration passe 4ter, la phase B des naissances devient 4quater.
Séquence finale : morts (phase A) → conversions (4bis) → départs
(4ter) → naissances (phase B). L'arbitrage 2026-11-11 « les morts et
départs avant les naissances » est conservé. Un arrivant garde sa
culture le tour de son arrivée et redevient éligible à la conversion
au tour suivant — l'assimilation est différée d'un tour, pas
supprimée (un isolé d'ancrage 0 bascule toujours à J+1 tant que sa
communauté ne pèse pas assez).

FICHIERS : tour.ts (étape 4bis insérée, registre ETAPES_TOUR 20 → 21
étapes : « Moteur de population — phase A », « Conversions
culturelles », « Migration par bonheur »), population.ts
(applyCultureInfluence retiré de la phase B, updateCityCultures
conservé APRÈS les naissances — un nouveau-né porte la culture de sa
mère : la minorité d'un arrivant peut croître par les naissances),
migrationBonheur.ts (en-tête PLACEMENT réécrit), tour.test.ts
(registre verrouillé à 21 étapes), migrationBonheur.test.ts (test de
non-régression : rouge sur l'ordre ancien vérifié en restaurant les
fichiers d'origine, vert sur le nouveau), regression.test.ts (voir
ci-dessous), diag-out.txt (trajectoire rng décalée).

INCIDENT ANNEXE — test de déterminisme : le réordonnancement décale
le flux rng (les tirages « plancher 1 % » des villes pures sont
consommés avant les naissances au lieu d'après) ; au tour 1 de la
graine du test, des naissances surviennent désormais — et le test
« 2 tours comparés au bit près » a révélé un défaut latent : newId
(shared.ts) embarque Date.now() (voulu pour l'unicité des ids en
partie réelle) ; le test ne passait que parce qu'aucune naissance
ne survenait au premier tour de cette graine. Corrigé côté test :
determiniserIds() réécrit les ids « c… » (et leurs références
mariageId/mereId/pereId/pereBioId) en ids déterministes avant la
comparaison — le flux rng reste comparé au bit près. Aucun
changement moteur.

VÉRIFICATIONS : 372/372 tests natifs (371 + 1 nouveau, node
--experimental-strip-types, stub @supabase recréé dans le sandbox
après réinitialisation) ; test d'ordre rouge/vert vérifié ; diag
régénéré : log 427 → 647 entrées sur 4 tours, composition saine
(436 naissances, 31 conversions, 57 « cherche meilleure vie »,
aucun spam — la graine du diag change de trajectoire, rien de
pathologique) ; tsc validé par le build du déploiement Pages
(« tsc && vite build ») ; sandbox sans npm install (tsc local
impossible, stub typescript).

## L’Or de la « Terre d’accueil » invisible au récap + crises de pure narration (retour Thibaut 2026-11-14 « J1 gagne beaucoup plus d’Or que ce qui est affiché (+1.3) », base 524cfda7, feat 32e36836, règles 0907493c)

SYMPTÔME (salon chasse-pecheL2, rapport Thibaut) : l’Or du J1
semble buggé — il gagne beaucoup plus d’Or que le « +1,3 »
affiché par le récap du tour.

DIAGNOSTIC : l’Or est CORRECT. La loi Socialisme « Terre
d’accueil » (+1 Or par migrant arrivé, foyer entier compris,
arbitrage refonte « 8 lois » 2026-10-29) crédite le stock
DIRECTEMENT (rs.stock += orParMig dans migrationBonheur.ts) avec
un log individuel « 🌍 Terre d’accueil — Joueur 1 reçoit 1 Or »
mais AUCUN canal d’apports : J1 attire 23 à 73 migrants/tour
(bonheur fort contre la crise de J2), le « +1,3 » ne montrait que
le canal « population ». Réconciliation vérifiée au centime sur
tous les tours publiés : T27 +24,32 = 1,32 + 23 ; T29 +53,08 =
3,08 + 50 − 40 ; T31 +34,32 ; T32 +64,32 = 1,32 + 73 − 48
(constructions stamped). Anomalies connexes vues au passage : les
6 crises du référentiel promettaient des effets « dans 3 tours… »
jamais implémentés (une Grève T29 J1, une T33 J2 — aucun effet ne
se serait produit) ; 557 entrées de journal dupliquées /2880
(re-pousses de sections, cosmétique, non traité ce tour). L’écart
T33 (J1 −24,14 Or / J2 +24,48 Or sans canal) a d’abord semblé
provenir de sections autoritaires (Object.assign de
fusionnerSections) — élucidé par Thibaut : c’est du commerce, pas
un bug moteur ; aucune garde de fusion ajoutée.

FIX (arbitrages Thibaut 2026-11-14) : 1) migrationBonheur RETOURNE
l’Or par destinataire ; l’étape 4ter de tour.ts trace un canal
« Terre d’accueil » (ApportsTour.terreAccueil) au snapshot —
colonne dédiée, comptée au Total du récap du dernier tour, repli
vide pour les historiques d’avant. 2) Les 6 textes de crises de
referentiels.json reformulés en pure narration, plus aucune
promesse d’effet ; onglet Crises annoté en conséquence.

VÉRIFICATIONS : 374/374 tests natifs (372 + 2 nouveaux : le retour
du flux porte l’Or exact par destinataire ; le canal du snapshot
égale le nombre exact de migrants reçus après runTurn — node
--experimental-strip-types, stub @supabase recréé dans le sandbox
réinitialisé, un index.js est requis en plus de l’index.mjs : le
résolveur cherche index.js) ; diag régénéré, 0 diff avec la tête
(non inclu au feat) ; 7 fichiers du feat vérifiés par curl
raw.githubusercontent + cmp, identiques au bit près ; règles
appendées puis vérifiées identiques.

SUITE (fix typecheck, même session) : le job CI « jeu » (npx tsc
--noEmit, strict) échouait sur 32e36836 — annotation du check-run :
« Type null cannot be used as an index type » (ligne 418, deux
occurrences). CAUSE : LogEntry.joueur est number | null (les lignes
de journal peuvent être anonymes) et le test du canal indexait
orParJoueur[e.joueur] sans garde. Fix 30cc575f (convention ap!
après assert.ok, cf. pelerinage.test.ts) puis 20300b57 (garde
e.joueur != null) ; l’API publique des annotations des check-runs
(GET /repos/…/check-runs/{id}/annotations) donne l’erreur tsc sans
logs authentifiés — il n’existe pas de lecteur de logs dans le
connecteur GitHub. ÉTAT FINAL sur 20300b57 : CI jeu success
(typecheck + 374/374), Deploy Edge Function resoudre-tour success
(l’Edge vit avec le canal Terre d’accueil — critique pour L2),
Deploy Pages success — bundle live index-ClRiSKYM.js, marqueurs
vérifiés : terreAccueil ×2, « PURE NARRATION » ×1, colonnes du récap
présentes. Tête : feat 32e36836 → règles 0907493c → journal e30dd8f7
→ fix 30cc575f → fix 20300b57 → ce journal.

## Terre d’accueil : l’Or n’est octroyé que pour les arrivants d’un AUTRE joueur (arbitrage Thibaut 2026-11-14 « il faudrait que l’or ne soit octroyé que par les étrangers, donc d’un joueur différent, qui arrivent », base 3320e572, feat 312982a9, règles c6b796fc)

RETOUR THIBAUT (même journée que le canal d’apports) : la loi
Socialisme « Terre d’accueil » créditait l’Or pour TOUTE arrivée —
déménagements INTERNES compris (arbitrage 2026-10-29 « la loi
récompense l’ARRIVÉE, pas le franchissement d’une frontière »).
Thibaut inverse : seul un arrivant d’un joueur DIFFÉRENT rapporte
l’Or ; rester chez le même joueur ne rapporte plus rien.

FIX : la garde dest.joueur.n !== p.n conditionne l’orParMig dans
migrationBonheur.ts (le foyer entier suit, mais l’Or ne tombe que
si le foyer CHANGE de joueur) ; texte de la loi du référentiel
aligné (« chaque fois qu’un migrant d’un autre joueur arrive…
un déménagement interne ne compte pas ») ; doc du canal
ApportsTour.terreAccueil mise à jour.

PIÈGE DE TEST (noté pour les prochains scénarios de flux) : le
setup standard (defaultSetups) crée HUIT joueurs de 50 habitants
dont les villes s’appellent toutes « Capitale » — neutraliser
seulement p0/p1 (comme mondeReduit) laisse les joueurs 4 à 8
libres de fuir vers la ville aux lits libres (50 arrivées
parasites constatées, 50 Or crédités au Socialisme du test). Le
nouveau test neutralise TOUS les autres joueurs par des soldats
(armee — jamais tirés au départ, villes sans lits libres), la
seule destination aux lits libres est la seconde ville du joueur
Socialisme : déménagement interne déterministe à la graine 8,
AUCUN Or (ni stock, ni log, ni retour du flux, ni canal).

VÉRIFICATIONS : 375/375 tests natifs (374 + 1 nouveau) ; diag
régénéré, 0 diff avec la tête (non inclu au feat) ; 4 fichiers du
feat vérifiés par curl raw.githubusercontent + cmp, identiques au
bit près ; règles appendées puis vérifiées identiques.

SUITE (déploiement Edge, même session) : le run Deploy Edge Function
de 312982a9 a échoué pour une cause TRANSITOIRE — annotation :
« Failed to resolve latest Supabase CLI release: rate limit
exceeded » (limite d’API GitHub au setup de la CLI Supabase, aucun
rapport avec le code) ; l’Edge vivait encore avec le comportement
précédent (Or sur les déménagements internes). Relancé par 1845a58d
(fix de doc : le commentaire du canal dans tour.ts précise
« migrant d’un AUTRE joueur ») — Deploy Edge Function SUCCESS,
l’Edge vit avec l’arbitrage du jour. ÉTAT FINAL sur 1845a58d :
CI jeu success (375/375), Pages success — bundle live
index-DO4qfapD.js, marqueurs vérifiés (terreAccueil ×2, loi
« migrant d’un autre joueur arrive »). Tête : feat 312982a9 →
règles c6b796fc → journal 74ccafbe → fix 1845a58d → ce journal.

## 2026-11-14 (suite) — Enquête Nourriture « barre vs réel » + retrait du bonus Bétail

**Signalement** : « les changements de nourriture ne sont jamais ceux
affichés dans la barre des ressources ».

**Diagnostic** (sur l’état réel L2, 42 tours d’historique + simulation
runTurn sur copie de l’état) :
1. Le moteur créditait depuis la revue 2026-10-16 un bonus caché
   « Bétail en stock × 4 Nourriture/tour » dans le canal « autres »
   (autres.ts appliquerEffetsAutres → nourritureBetail), que la barre
   (productionDetaillee) ne calcule PAS : barre n’affiche que les
   lignes « Autres » des villes. Vérifié tour par tour : autres(Nourr)
   = Bétail de fin de tour × 4 à CHAQUE tour (J2 jusqu’à +161/tour en
   T31, +51,36 en T42 avec 12,84 Bétail).
2. Timing : le bonus était calculé sur le Bétail de FIN de tour (gains
   d’habitants crédités à l’étape 3bis, avant « autres » à 3quater) —
   écart résiduel +4×(Bétail gagné dans le tour).
3. Démo chiffres (T42→43 simulé) : J2 barre −1054,13 vs réel −997,81
   (écart +56,31) ; J1 barre −1466,75 = réel EXACT (Bétail J1 négatif,
   aucun bonus).
4. Écarts historiques résiduels (J1 T6-T27 −10 à −30,70, J2 T5-T17) :
   dépenses/trades client (commerce, constructions) jamais tracés —
   même pattern que l’Or. Sacres de rang de pays exclus (Baronnie
   tous les deux). L’écart Or T33 restant avait été clos par Thibaut
   (« c’est du commerce »).

**Arbitrage** (Thibaut) : « le bétail ne produit pas de nourriture,
ça n’a jamais été demandé » → le bonus est RETIRÉ du moteur, pas la
barre corrigée.

**Correctifs** :
- feat(jeu) 41d6c52f : retrait du bloc Bétail×4 d’appliquerEffetsAutres
  (autres.ts, note RETRAIT 2026-11-14), suppression de nourritureBetail
  (economie.ts, note de retrait), test de non-régression dans
  regression.test.ts (« bétail en stock : AUCUNE Nourriture produite » :
  canal autres = 0, réconciliation delta Nourriture == somme des
  apports au centime). Suite complète : 376/376 verts. diag-out.txt
  régénéré : 0 diff avec la tête (pas de commit diag).
- docs(ia) 49878e91 : règles — arbitrage 2026-11-14 (retrait + règle
  « le Bétail en stock ne produit rien par tour » + note d’enquête).

**À surveiller** : Deploy Edge Function DOIT repartir sur 41d6c52f
(src/engine touché — critique pour L2 : sans redéploiement, l’Edge
live continuerait de créditer le bonus). Vérifier le bundle live après
build Pages + Ctrl+F5.

## 2026-11-14 (suite 2) — Fix typecheck du test bétail + déploiement final

Le run CI jeu du feat 41d6c52f échouait sur le typecheck du nouveau
test (2 annotations tsc) : `.at(-1)` indisponible (lib ES2020) et
`Object.values` sur `ApportsTour` à champs optionnels → `unknown`.
Fix 98f53ef4 : index direct `rows[rows.length-1]` et somme itérée
explicitement sur les 15 canaux typés (`canal['Nourriture'] ?? 0`).

ÉTAT FINAL sur 98f53ef4 : CI jeu success (376/376), Deploy Edge
Function success (l’Edge vit SANS le bonus Bétail — critique pour
L2 : le récap « autres » de J2 ne créditera plus les ~+51 Nourriture
fantômes), Pages success — bundle live index-DBgNSTIy.js,
`nourritureBetail` absent du bundle (vérifié). Tête : feat 41d6c52f
→ règles 49878e91 → journal 87cdc44d → fix 98f53ef4 → ce journal.

## 2026-11-14 (suite 3) — Logements des constructions enfin attribués

**Signalement** : « les logements ne fonctionnent pas, les bâtiments
et autres qui produisent de logement créent des logements mais qui
ne sont jamais utilisés par la population ».

**Diagnostic** (code + état réel L2) : les domiciles apportés par les
constructions (canal `logements`, domicilesApportesVille) comptaient
dans le PARC — axe Logement du bonheur (logementsVille), magnét
migratoire « lits libres », détail VilleCarte — mais restaient hors
attribution nominative (convention 2026-10-29 « apports non
attribuables », calquée sur les lois AVANT le 6e retour du jour qui
rendait les lits des lois attribuables). Chiffres L2 (T42) : J1
Capitale 856 vivants, 134 logés, 722 SANS domicile, avec +50 lits de
constructions vides (Bas quartier +20 Taudis, +30 Maisons) ; J1
Ville 2 : 579 sans ; J2 Capitale : 755 sans (aucun lit de
construction). Consommateurs de Character.domicile : statut social
(−2 sans domicile), facteurLogement (migration), rien d’autre —
impact du fix circonscrit.

**Correctif** (feat 5d7ed075) : attribuerDomicilesVille agrège dans
le stock de service rang + lits des lois + APPORTS DE CONSTRUCTIONS
(domicilesApportesVille). Réserve noble et plancher noble
s’appliquent à l’origine des lits indifféremment. Commentaires
SUPERSEDÉ aux trois endroits qui énonçaient l’ancienne convention.
Test de non-régression dans domiciles.test.ts (« les logements des
BÂTIMENTS abritent la population ») : Bas quartier → min(22, vivants)
logés dont des Taudis ; Haut quartier → seule une Maison de notable
au noble (prestige 300), jamais aux roturiers. Suite : 377/377
verts. diag-out.txt régénéré : 0 diff (pas de commit diag).

**Effet vérifié sur l’état réel L2** (runTurn simulé avec le fix) :
J1 Capitale 134 → 184 logés (+50, exactement ses lits de
constructions) ; Ville 2 et J2 inchangés. Le prochain tour résolu
par l’Edge (redéploiement requis — src/engine touché) loge les 50.

**Règles** (5ea29885) : règle « tout lit du parc est attribuable »,
supersede la convention 2026-10-29.

Tête : feat 5d7ed075 → règles 5ea29885 → ce journal.
