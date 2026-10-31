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
- **Découverte d'implémentation (actée)** : `cloneDefaultConfig()` ne porte PAS de `schemaVersion` → la conversion v2→v5 rejoue et `realignerConstructions` REMPLACE toute fiche connue du référentiel par celle du défaut (« donnée de référence, pas de personnalisation », v5 2026-10-27) — le test de migration tamponne donc `schemaVersion` au courant pour simuler la vraie sauvegarde convergée.
- Incident d'environnement : reset du sandbox mi-tour (working copies et harnais disparus) — cp-audit/cp-base re-téléchargés (codeload tar.gz), loader.mjs/register.mjs/check-jsx.mjs reconstruits et re-validés (55/55 .tsx base BALANCED, test négatif OK).
- Validation : **213/213 tests natifs** (204 + 9), diag diff EXACTEMENT le changement de registre attendu (rien d'autre ne bouge : scénario du diag sans armée, villes Moyenne), diff vs base limité aux 17 fichiers src voulus + scripts/diag.ts + diag-out.txt, JSX BALANCED (ArmiesPanel/ConstructionsParams/OngletsMetiers), `--check` OK sur les 12 .ts touchés, JSON re-validé par json.load.

## Pertes des armées non suivies, renfort, retrait de la cible (retours arbitre, 2026-10-28)

- **Reproduits puis corrigés** (3 retours arbitre) : (1) BUG « les pertes réduisent l'armée à 45 à chaque fois » — reproduit en isolation (armée 200 pts, `soldats: []`, commandant vivant → pertes 2 → 45) : `recomputeArmy` dérive `soldats × 15 + commandant` et écrase la puissance stockée d'une armée NON SUIVIE à son seul commandant ; le moteur était correct pour les armées suivies (75/15/90 vérifiés) et le défaut existait déjà à 325ab8e (pas une régression du rework banque). (2) RENFORT manquant. (3) case « cible » inutile.
- **Moteur** (`engine/armees.ts`) : le branchement SUIVIE/NON SUIVIE vit dans les mutateurs — `infligerPertes` / `libererSoldats` capturent `soldats.length > 0` AVANT les kills : armée non suivie → pertes et fin de service **SOUSTRACTIVES** (nb × pts Soldat, + pts Commandant si coché ; commandant réel tué/libéré, veuvage par id géré) ; armée suivie → comportement inchangé (kills réels + dérivation, retombée juste à 0/commandant si tous tombent). `recruitForArmies` : base = puissance STOCKÉE pour une non suivie (plus d'écrasement à 45 ; le commandant vivant n'est PAS ajouté — pas de double comptage), commandant mort entre deux tours → détaché + −pts sur la stockée ; les recrues d'un renfort font passer l'armée en dérivation (migration vers le suivi). `recomputeArmy` : comportement inchangé (dérivation pure) + CONTRAT documenté (ne l'appeler que sur une armée suivie). `prixArmee` : docblock renfort.
- **Type** : `engine/types.ts` — champ `cible: string | null` RETIRÉ de `Army` (note RETRAIT in situ ; clé résiduelle des vieilles sauvegardes ignorée).
- **UI** (`ArmiesPanel.tsx`) : Select « cible » et state supprimés (grid-2 → Select commandant seul, notes RETRAIT) ; nouvelle rangée **Renfort** par armée : delta (NumberInput pas 15, 15-300), ville de renfort (Select, réductions via `prixArmee(delta, C, ville)`), bouton « ⚔ Renforcer +N pts (M Or) » — Or débité, `puissanceCible += N`, log type Armée, disabled si Or insuffisant ; dialog des pertes reformulé (couvre le cas non suivie) ; paragraphe bas mentionne le renfort. JSX BALANCED.
- **Tests** (`engine/armees.test.ts`) : +5 (213 → 218) — pertes armée suivie (60 puis 0 avec commandant) ; pertes non suivie (200→170→110, PAS 45, personne tué) ; fin de service non suivie (commandant redevient Chasseur) ; recruitForArmies non suivie (stockée conservée ; renfort +30 → 2 recrues réelles, devient suivie, dérivation 75) ; commandant mort entre tours (−45 sur la stockée). Littéraux Army sans `cible`.
- **Diag** : IDENTIQUE (aucune règle ne bouge — le scénario diag n'a pas d'armée).
- Incident d'environnement : resets du sandbox entre les messages (working copies + harnais disparus) — cp-audit/cp-base re-téléchargés à la tête via rebuild.sh, register.mjs/loader.mjs/check-jsx.mjs reconstruits, 55/55 .tsx base BALANCED + tests négatifs OK.
- Validation : **218/218 tests natifs**, diag diff IDENTIQUE, diff vs base limité aux 4 fichiers src voulus (armees.ts, types.ts, ArmiesPanel.tsx, armees.test.ts), JSX BALANCED, `--check` OK.

## La puissance stockée fait foi ; les pertes abaissent la cible (2e retour arbitre, 2026-10-28)

- **Reproduit puis corrigé** (retour « le renforcement fonctionne, mais infliger des pertes ou libérer en fin de service baisse la puissance de l'armée à 45 ») : repro exacte — armée de plateau 200 pts + renfort +30 → 2 recrues réelles (migration vers le suivi) → pertes 2 → les recrues meurent → `recomputeArmy` dérive 0 soldat + commandant = 45. La migration « suivi » du matin était le piège : les recrues réelles ne couvriront jamais les points de plateau, et toute dérivation écrase la stockée.
- **Arbitrage Thibaut (2e retour, acté)** : (1) PLUS AUCUNE DÉRIVATION — la puissance stockée fait foi pour toute armée ; (2) pertes et fin de service = SOUSTRACTIVES sur la puissance ET la puissance CIBLE (pas de remplissage automatique — retour explicite « infliger des pertes ou libérer doit diminuer la puissance cible »).
- **Moteur** (`engine/armees.ts`) : `recomputeArmy` RETIRÉ (note RETRAIT in situ avec historique) ; `infligerPertes` / `libererSoldats` UNIFIÉS (plus de branche suivie/non suivie) : kills/libérations réels jusqu'à nb + `perte = nb × pts soldat + (commandant ? pts)` soustraite à puissance ET puissanceCible (plancher 0), log « −N pts sur la puissance et la cible, puissance restante (cible X) » ; `recruitForArmies` : base = stockée pour TOUTE armée (commandant vivant = pas de double comptage ; commandant mort = détaché + −pts, cible intacte, recrutement comble la vacance).
- **UI** (`ArmiesPanel.tsx`) : dialogs pertes/fin de service reformulés (−N × pts sur puissance ET cible, pas de remplissage) ; commentaire renfort amendé (les recrues n'entraînent plus aucune re-dérivation) ; paragraphe explicatif complété.
- **Tests** (`engine/armees.test.ts`) : section réécrite — 13 tests dont le test de RÉGRESSION exact du bug du soir (200 + 2 recrues → pertes 2 → 200, PAS 45, cible 200, aucun re-remplissage au tour suivant), pertes/fin de service suivie et non suivie (puissance ET cible), ligne de métier éditée prime (soldat 20 pts), commandant mort (155 puis comblement 200). Test recomputeArmy retiré (note RETRAIT).
- Incident d'environnement : reset du sandbox entre les messages — cp-audit/cp-base re-téléchargés à la tête db836cb, harnais reconstruit ; check-jsx RÉÉCRIT avec un comptage par NOM de balise (les auto-fermées décrémentent, les fermetures tronquent la pile) — 55/55 .tsx BALANCED, suppressions de `</div>`/`</strong>`/`</p>` détectées ; loader.mjs corrigé (hook `load` : JSON nu en shortCircuit AVEC `source`, sinon ERR_IMPORT_ATTRIBUTE_MISSING / ERR_INVALID_RETURN_PROPERTY_VALUE).
- Validation : **218/218 tests natifs**, diag IDENTIQUE, diff vs base limité aux 3 fichiers src voulus (armees.ts, armees.test.ts, ArmiesPanel.tsx), JSX BALANCED, `--check` OK, repro corrigée (200 → 200, cible 200).

## L'armée est liée à la population ; menus déroulants (3e retour arbitre, 2026-10-28)

- **Arbitrage Thibaut (3e retour, acté)** : (1) « l'armée est liée à la population, donc des pertes dans une armée doit tuer des habitants » ; (2) « plutôt que des champs textes pour pertes, ajouts et levée d'armées, affiche un menu déroulant, ce sera plus simple ».
- **Moteur** (`engine/armees.ts`) : `infligerPertes` et `libererSoldats` prennent le COMPLÉMENT des pertes/libérations parmi les candidats RECRUTABLES (vivants, âges de la ligne Soldat, sans armée, métier libre ou Chasseur — mêmes filtres que `recruitForArmies`), dans l'ordre du recensement ; pertes → `tuer` (statut « Décédé », veuvage M1, retiré des suivis), fin de service → `liberer` (re-titré Chasseur, vivant). Pool épuisé → les points seuls baissent (plancher 0 inchangé). Docblocks amendés in situ, logs enrichis : « — tombés : noms » / « — libérés : noms ».
- **UI** (`ArmiesPanel.tsx`) : les 3 `NumberInput` (pertes, renfort, puissance de levée) deviennent des `Select` — pertes 1-20 (« N pertes (−N × pts) »), renfort +15 à +300 (« +N pts (P Or) », prix de levée avec réductions de la ville de renfort), levée 45-300 (« N pts (P Or) »). Import `NumberInput` retiré du panneau.
- **Tests** (`engine/armees.test.ts`) : test « non suivie pure » RÉÉCRIT en « liée à la population » (j1/j2 tuées par ordre du recensement, Dirigeant et 35 ans épargnés, pool épuisé → points seuls, commandant en plus) ; NOUVEAU test « suivie au-delà des soldats suivis » (s1 + j1 + j2 tués, 90 → 45) ; « fin de service » amendée (le complément libère s1, `liberes2` = commandant + s1) — 219 tests.
- Validation : **219/219 tests natifs**, diag IDENTIQUE, diff vs base limité aux 3 fichiers src voulus, JSX BALANCED, `--check` OK.

## Retrait de la migration par scolarité (arbitrage Thibaut, 2026-10-28)

- **Arbitrage Thibaut (acté)** : « commence par retirer la migration par scolarité » — seul système de migration automatique restant (l'attrait touristique était déjà retiré le 2026-10-19).
- **Moteur** (`engine/population.ts`) : `migrerPopulation`, le cache `villesAvecProfesseur` (et son invalidation par état), l'interface `CibleVille` et l'appel étape 3.6bis du tour SUPPRIMÉS ; banner de section réécrit en mémoire RETRAIT (historique VBA conservé : 10 %/2 %/1 %, Obstinés exclus) ; imports morts retirés (`City`, `fullName`, `perteDemenagement` — ne servaient qu'à la migration).
- **Paramètres** (`config/params.ts`) : `migrationEcole/Suzerain/Monde` quittent PARAM_META (plus éditables) et restent en REFLIS de compatibilité dans l'interface et DEFAULT_PARAMS — patron du retrait armées (puissanceGeneral & co).
- **Tests** (`engine/population.test.ts` NOUVEAU, ×2) : 20 tours avec Professeur chez un autre joueur → aucun enfant ne bouge, aucune entrée « scolarité » au journal ; REFLIS aux valeurs historiques.
- Validation : **221/221 tests natifs** (219 + 2), diag IDENTIQUE, diff vs base limité aux 3 fichiers voulus (population.ts, params.ts, population.test.ts NOUVEAU), `--check` OK. Aucun .tsx touché.

## Flux de migration par bonheur (2e arbitrage du jour, 2026-10-28)

- **Arbitrage Thibaut (acté)** : flux de migration par bonheur — « plus le bonheur est bas, plus un habitant a de chances de quitter sa ville, pour une autre ville aléatoire, pondérée par la culture similaire et le bonheur de chacune des villes » ; arbitrages complémentaires par interview : linéaire 0-10 % (0 % à 100, 10 % à 0), toutes les villes du monde, tous les vivants sauf Dirigeant/Héritier.
- **Moteur** (`engine/migrationBonheur.ts` NOUVEAU) : `probaDepartBonheur` (pure, linéaire), `poidsDestination` (pure, culture ×N × (1 + b/100)), `migrationBonheur` (étape 4bis du tour, APRÈS tous les populationTurn — un migrant inter-joueurs n'est pas retraité au même tour) ; bonheur calculé UNE fois par ville et par tour (fiches) ; exclusion de la source PAR IDENTITÉ (villes homonymes « Capitale » chez 8 joueurs) ; photo des habitants avant déplacement + set des déplacés (pas de double migration, pas de re-tir des arrivants).
- **Branchement** : `tour.ts` étape 4bis + `params.ts` (`migrationBonheurMax` 0,10 / `migrationBonheurCulture` 4, PARAM_META groupe Population).
- **Tests** (`engine/migrationBonheur.test.ts` NOUVEAU, ×6) : formules pures (linéarité, pondération, ville sans culture) ; conservation exacte de la population mondiale (aucune perte, aucun doublon, une entrée de journal par migration, métier+domicile perdus) ; interrupteur proba 0 ; Dirigeant/Héritier ancrés même à proba max 1 (NB : ne pas compter les ARRIVANTS dans la longueur du tableau) ; départs dès les premiers tours aux défauts (graine fixe).
- **Amendement** `engine/population.test.ts` : le contrat « plus AUCUN déplacement automatique » du retrait scolaire est CADUC — flux coupé (max = 0) pour isoler le contrat scolaire ; invariant recentré sur « aucune entrée scolarité ».
- Validation : **227/227 tests natifs** (221 + 6), `--check` OK, aucun .tsx touché. Diag CHANGE LÉGITIMEMENT (patron armées-par-la-banque) : « log 579 → 687 entrées » (≈108 migrations sur 4 tours) et « commandants disponibles 4 → 5 » — les 14 lignes [ÉCHEC] des scénarios de dégradation sont IDENTIQUES base↔nouveau ; `diag-out.txt` régénéré (même taille par coïncidence de largeur de chiffres).
- **⚠ INCIDENT CI « CI jeu » ROUGE sur le push v1 (npm test, exit 1 en 7 s — annotations génériques, logs 403 sans admin)** : les 13 fichiers de TESTS DE RENDU (src/components) tournent EN CI (tsx --test src/**/*.test.ts) mais PAS dans le harnais local (react introuvable, npm install interdit par le sandbox, Node 22 ne charge pas .tsx, symlink realpath par l'ESM) — l'échec exact est resté INVISIBLE. Forensique locale : reproduction de partieRendu (graine 20261019, 2 tours) → le flux v1 SÉPARAIT 32 COUPLES entre porteurs (mariageId croisé = conjoint introuvable dans le tableau du porteur). **Correctif (amendement, même arbitrage)** : (1) COUPLES INSÉPARABLES — un marié ne part qu'avec son conjoint de la même ville (le foyer suit, une entrée de journal par membre) ; conjoint ancré (Dirigeant/Héritier/en armée) → le foyer ne part pas ; conjoint absent → il part seul ; (2) les SOLDATS/COMMANDANTS EN ARMÉE ne déménagent plus (l'armée lie l'habitant) ; (3) `updateCityCultures` rappelé pour tous les joueurs en fin de flux (les arrivées peuvent renverser la majorité). Invariant vérifié en sim : 0 mariage croisé après correctif. **229/229 natifs** (227 + 2 : « le conjoint suit » et « conjoint ancré/soldat → foyer reste »), diag régénéré (log 579→728, ÉCHEC identiques). RÈGLE À RETENIR : les tests de RENDU ne passent que par la CI — prévenir Thibaut qu'un push peut rougir la CI pour le seul périmètre rendu.

## Flux de migration par bonheur — pondération v2 (3e arbitrage du jour, 2026-10-28)

- **Arbitrage Thibaut (acté)** : retour sur la PONDÉRATION de destination — « pour les facteurs, les habitations du même joueur ×1,5, et les habitations de la même culture que le personnage qui migre ×1,25 » ; précision : « un personnage peut migrer vers la ville d'où il vient, ce n'est pas un bug ».
- **Moteur** : `poidsDestination` prend un 5e argument `memeJoueur` — `poids = (même joueur ? migrationBonheurMemeJoueur : 1) × (culture identique ? migrationBonheurCulture : 1) × (1 + bonheur/100)` ; le tirage passe `f.joueur.n === p.n` ; le RETOUR vers une ville d'origine reste légitime (aucune exclusion d'anciennes résidences, seule la ville source courante est exclue par identité).
- **Params** : `migrationBonheurCulture` 4 → **1,25** (note REMPLACÉ dans le docblock, le ×4 du matin est historisé) ; `migrationBonheurMemeJoueur` **1,5** NOUVEAU (interface + DEFAULT_PARAMS + PARAM_META groupe Population, avec le NB du retour légitime).
- **Tests** : pondération réécrite en v2 (×1,25 culture, ×1,5 même joueur, produit ×1,5×1,25×2 = 3,75, ville sans culture garde le facteur seul) ; défauts verrouillés 0,10/1,25/1,5.
- Validation : **232/232 tests natifs**, `--check` OK, aucun .tsx touché. Diag CHANGE LÉGITIMEMENT (patron RNG) : « log 728 → 724 entrées » et « Armée 2 : 6 → 3 soldats » au recrutement — les 14 lignes [ÉCHEC] IDENTIQUES base↔nouveau ; `diag-out.txt` régénéré. Diff vs base 3 fichiers (migrationBonheur.ts, migrationBonheur.test.ts, params.ts).

## Flux de migration par bonheur — FOYER COMPLET (4e arbitrage du jour, 2026-10-28)

- **Arbitrage Thibaut (acté)** : « lorsqu'un personnage déménage, il déménage avec son/sa conjoint.e et leurs enfants non mariés. »
- **Moteur** (`engine/migrationBonheur.ts`) : le foyer du départ = le migrant + son conjoint de la même ville + leurs ENFANTS NON MARIÉS de la ville (mereId OU pereId d'un membre du couple, sans mariageId — la majorité n'exclut pas). Enfant marié = foyer PROPRE (il part avec SON conjoint à son propre tirage, jamais emporté par ses parents). Enfant ancré (Héritier) ou en armée RESTE — il ne déménage jamais et n'entrave pas le départ du reste du foyer. Conjoint ancré → le foyer NE PART PAS (y compris les enfants). Conjoint absent (défunt/ailleurs) → l'habitant part avec ses enfants non mariés. Tous les membres du foyer partent sans tirage propre, à la destination du tirage du foyer, chacun avec son entrée de journal (« suit X — quitte »).
- **Tests** : test « couples inséparables » RÉÉCRIT en « foyer complet » (couple + 2 enfants non mariés dont un adulte → même destination ; enfant marié part avec SON conjoint et AUCUNE entrée « suit Pers-cp1/cp2 » pour lui ; enfant Héritier et enfant soldat RESTENT ; 4 entrées de journal pour les 4 partants) ; test « conjoint ancré » étendu (l'enfant du foyer d'un Dirigeant ne part pas non plus, aucune entrée journalisée).
- Validation : **232/232 tests natifs**, `--check` OK, aucun .tsx touché. Diag CHANGE LÉGITIMEMENT (patron RNG : log 724 → 730, commandants, soldats du recrutement) — les 14 lignes [ÉCHEC] IDENTIQUES base↔nouveau ; `diag-out.txt` régénéré. Diff vs base 2 fichiers (migrationBonheur.ts, migrationBonheur.test.ts).


## Flux de migration par bonheur — FACTEURS EMPLOI & LOGEMENT (5e arbitrage, 2026-10-29)

- **Arbitrage Thibaut (acté)** : « pour les migrations, j'aimerais appliquer des facteurs : un habitant sans métier qui migre sans emploi a davantage d'intérêt à rejoindre une habitation avec des emplois disponibles, idem pour le logement. »
- **Moteur** (`engine/migrationBonheur.ts`) : `FicheVille` étendue de `emploisLibres` (postes offerts > adultes en poste) et `logementsLibres` (stock de logements > vivants), photographiés UNE fois par ville et par tour au début du flux (les arrivées du flux n'occupent ni poste ni lit — réaffectation au tour suivant) ; deux fonctions pures `facteurEmploi` / `facteurLogement` (ne parlent QUE pour qui manque et là où c'est libre) composées dans le `pickWeighted` avec la pondération v2 : poids = v2 × facteurEmploi(sans métier ?) × facteurLogement(sans domicile ?). Le statut regardé est celui du TIRÉ avant départ (à l'arrivée, perteDemenagement laisse TOUS les migrants sans métier ni domicile) ; le foyer (conjoint, enfants) suit le statut de son chef sans influer.
- **Params** : `migrationBonheurEmploi` **1,5** et `migrationBonheurLogement` **1,5** NOUVEAUX (interface + DEFAULT_PARAMS + PARAM_META groupe Population, aide complète du retour).
- **Tests** (×3 NOUVEAUX, 232 → 235) : facteurs purs (4 cas chacun + défauts verrouillés 1,5/1,5) ; deux tests de flux sur un « monde réduit déterministe » (3 joueurs : ville de p1 SATURÉE — 60 adultes en poste > 44 postes offerts, 60 vivants > 58 lits ; ville de p2 LIBRE (vide) ; migrant chez p0 à bonheur 23/100 → départ certain à proba max 10) : le SANS-MÉTIER (logé) rejoint la ville qui embauche à facteur 1e9, le SANS-DOMICILE (pourvu) rejoint la ville qui loge. Scénario sondé par probe AVANT écriture (graines 20261029/7/8), probe supprimée après coup.
- Validation : **235/235 tests natifs**, aucun .tsx touché ; pas de tsc local (node_modules absent du tarball, npm install interdit par le sandbox) → contrôle de types reporté sur la CI (tsc && vite build), comme les tests de rendu. Diag IDENTIQUE base↔nouveau — LÉGITIME : au setup toutes les villes ont postes et lits libres, les facteurs pèsent uniformément sur toutes les candidates (aucun changement de tirage) ; `diag-out.txt` INCHANGÉ. Diff vs base : 3 fichiers (params.ts, migrationBonheur.ts, migrationBonheur.test.ts) + les 2 docs.


## Flux de migration par bonheur — PONDÉRATION v3 ADDITIVE (6e arbitrage, 2026-10-29)

- **Arbitrage Thibaut (acté)** : « il faudrait que la formule se base sur le bonheur et que tous les autres modificateurs soient additifs, par exemple bonheur × (culture identique + joueur), donc bonheur × 1,75. On peut mettre facteur emploi et facteur logement à ×2 je pense. » — le multiplicatif v2 creusait trop l'écart entre candidates (max ×3,75 d'attrait, jusqu'à ×8,44 avec les facteurs ×1,5 du 5e arbitrage).
- **Moteur** (`engine/migrationBonheur.ts`) : `poidsDestination` prend un 6e argument `bonusAdditifs` — `poids = attrait × (1 + même joueur + culture + bonusAdditifs)`, l'attrait `1 + bonheur/100` (×[1 ; 2]) restant la seule base multiplicative ; `facteurEmploi`/`facteurLogement` deviennent des BONUS (renvoient le paramètre si applicable, **0** sinon) additionnés au call site du `pickWeighted`. Exemple arbitre verrouillé en test : culture + même joueur = attrait × 1,75. La photographie des disponibilités et le statut du TIRÉ avant départ (5e arbitrage) sont conservés tels quels.
- **Params** : `migrationBonheurCulture` 1,25 → **0,25** ; `migrationBonheurMemeJoueur` 1,5 → **0,5** ; `migrationBonheurEmploi` 1,5 → **1** ; `migrationBonheurLogement` 1,5 → **1** — docblocks d'interface, DEFAULT_PARAMS et PARAM_META amendés en v3 ADDITIVE (notes REMPLACÉ/historisé sur le multiplicatif v2 et le ×1,5 du 5e arbitrage).
- **Tests** : test pur v2 RÉÉCRIT en v3 additive (base 1, +0,25 culture, +0,5 joueur, exemple arbitre 1,75, attrait ×2, bonus additifs 1 et 2 → 2,5 et 7,5, ville sans culture) ; test facteurs RÉÉCRIT (bonus +1 ou 0, défauts verrouillés 1/1) ; défauts verrouillés 0,10/0,25/0,5/1/1. Les tests de flux « monde réduit » (bonus 1e9 écrasant) restent valides tels quels : le bonus additionné domine de la même façon.
- Validation : **235/235 tests natifs**, `--check` OK, aucun .tsx touché, contrôle de types reporté sur la CI (npm install interdit par le sandbox). Diag CHANGE LÉGITIMEMENT (patron RNG : « log 730 → 762 entrées », « commandants disponibles 5 → 3 » — les ratios additifs changent les tirages aux graines fixes) — les 14 lignes [ÉCHEC] IDENTIQUES base↔nouveau ; `diag-out.txt` régénéré. Diff vs base : 3 fichiers src (params.ts, migrationBonheur.ts, migrationBonheur.test.ts) + diag-out.txt + les 2 docs.


## Refonte des cultures — 12 LOIS (2026-10-29)

- **Arbitrage Thibaut (acté)** : proposition des 12 lois des 6 cultures (« voici ce que je pensais faire des cultures ») + 4 arbitrages complémentaires via questions : Ferveur martiale = malus mondial une seule fois par habitation avec plancher 0 ; Corps de fer +10 Garnison SE CUMULE au défaut garnisonParGarde (Garde zélotiste = 20) et le +0,2 Or/tour est le seul flux ; Caravanes = +1 au cap du JOUEUR par ville sethiste qualifiée (le cap maxRoutesJoueur étant par joueur) ; toutes les anciennes lois REMPLACÉES (partent à l'historique git).
- **Périmètre** : loi de VILLE = culture majoritaire (`ville.culture`) ; loi d'HABITANT = culture propre du personnage où qu'il vive ; régimes non touchés ; 6 noms conservés.
- **Config** (`config/defaultConfig.ts` + `referentiels.json`) : `CultureDef` réécrit — `regleVille`/`regleHabitant` (anciens reglePays/reglePerso RENOMMÉS) + 13 champs chiffrés optionnels ; anciens champs `capital*ParHabMonde`/`scienceParConstruction` SUPPRIMÉS (notes REMPLACÉ/historisé). `migrerCultures` : construction EXPLICITE (supprime les clés mortes des configs sauvegardées) + patron taxes25 pour `fertFactor` (la valeur 1 de l'ancien défaut ne bloque pas le nouveau défaut Walpurgis 1,1). PAS de bump de SCHEMA_VERSION_CONFIG.
- **Moteur** : `domicilesCultureVille` (+5 Taudis / +2 Palais, même convention que les apports — comptés, non attribuables) ; `logementsVille` l'inclut ; Déisme = emplacements de Scientifique par bâtiment (`emplacementsMetierVille`) + `maladieContractMod` dans `maladieStep` ; Naturalisme = bonus Fermier d'été dans `detailGainsVille` (pattern Ponton) + fertFactor 1,1 ; Sethisme = cap routes (`maxRoutesJoueur`) + `scienceParNoble` ; Zélotisme = `garnisonParGardeCulture` cumulé + `orParGarde` + `malusFerveurMartiale` (plancher 0, une fois, joueurs seulement) dans `garnisons.ts` ; Communautarisme = `seuilBourgeoisCulture` → `rangDe` partout (conso/prod, mariage même rang, lois nobles).
- **Banque** : la source 'culture' est RETIRÉE — `reglesCultures`, l'effet `fluxParVilleCultureMonde`, la condition `culture` et le canal diag partent avec (notes RETRAIT, historique git). `regimes.ts` : `effetsCulturePays`/`detailCulturePays`/`nbVillesCultureMonde` REMPLACÉS par `loisHabitants`/`detailLoisHabitants` (nobles et gardes de la population vivante) ; détail de garnison enrichi (lignes 'métier' Corps de fer et 'culture' Ferveur martiale) ; `tourismeCourant` et l'étape 3septies (`appliquerEffetsRegimesCultures`) suivent. `production.ts` : canal « Régimes & cultures » = régime + lois d'habitants.
- **UI** : OngletsCultures (wiki → colonnes Culture/Hérédité/Homo/Fécondité/Loi ville/Loi habitant) ; ParamsPanel (table d'édition : 13 colonnes chiffrées + 2 textuelles) ; CulturePays réécrit (textes des lois + badges `detailLoisHabitants`) ; CarteRoyaume ; VilleCarte (parc logements + plancher garnison « Ferveur martiale : maintenue à 0 ») ; Constructions (RETRAIT du crédit Science à la construction).
- **Tests** (235 → **242**) : NOUVEAU `engine/cultures.test.ts` (défauts des 12 lois verrouillés, migration des vieilles configs, chaque loi testée moteur : parc, emplacements, seuil 80, −2 % contraction, fermiers d'été, cap routes, lois d'habitants, Corps de fer cumulé, Ferveur martiale une fois/plancher/levée) ; `rules/regimes-cultures.test.ts` réécrit (registre régime seul, ABSENCE de règles culture dans la banque) ; `rules/registre.test.ts` (contrat sans `fluxParVilleCultureMonde`) ; 2 tests de `statutSocial.test.ts` adaptés (culture à seuil 100 et dynastie roturière — `rangDe` traite une dynastie noble comme noble).
- Validation : **242/242 tests natifs** ; .tsx touchés (6 fichiers UI) → contrôle de types reporté sur la CI (npm install interdit par le sandbox). Diag CHANGE LÉGITIMEMENT (patron RNG : Walpurgis 1,1 change les naissances, +5 lits communautaristes change le bonheur — « log 762 → 749 entrées », « commandants 3 → 4 » ; registre 87 → 84 règles, canal `fluxParVilleCultureMonde` retiré) — les 14 lignes [ÉCHEC] IDENTIQUES base↔nouveau ; `diag-out.txt` régénéré. Diff vs base : 25 fichiers modifiés + `engine/cultures.test.ts` + `diag-out.txt`.
- **Rattrapage CI (3 commits, tête finale `daee1a05`)** : la CI `npx tsc --noEmit` puis `tsx --test src/**/*.test.ts` (tests de COMPOSANTS exécutés seulement en CI — react indisponible en local) ont demandé trois correctifs après le feat : (1) `b6454d33` — rétrécissement `assert.ok(ville)` ×7 dans `engine/cultures.test.ts` (la ville du mock `ContexteEffet` est `City | undefined`) + cast `(r.source as string) !== 'culture'` (SourceRegle ne contient plus 'culture') ; (2) `16871227` — reste `${sci > 0 …}` dans le journal de construction (`components/pays/Constructions.ts`), orphelin du crédit Science retiré (aurait été ReferenceError à la première construction — attrapé par le typecheck strict) ; (3) `daee1a05` — `components/PlayerView.test.ts` : le parc logements attendu doit inclure `domicilesCultureVille` (la fixture partieRendu donne Communautarisme au joueur 1 → +5 Taudis, 63 ≠ 58). CI verte intégrale (jeu + build + deploy + diag), bundle live `index-ClioWiBj.js`.

## Monuments pieux sur les BÂTIMENTS DE FACTION (retour arbitre Thibaut, 2026-10-29)

- **Retour Thibaut** (après le déploiement des 12 lois) : « les bâtiments de faction vont revenir, donc non, laisse le monument pieux sur le bâtiment de faction ». Le **Monuments pieux** du Déisme ne compte plus TOUS les bâtiments : uniquement les **bâtiments de faction**, identifiés par le marqueur `batimentDeFaction` (champ optionnel de `ConstructionRef`). Marqueur **dormant** : les 19 constructions de faction sont retirées du référentiel depuis le 2026-10-19 (« à refaire ») — aucune entrée ne le porte aujourd'hui, la loi DORT à 0 emplacement jusqu'à leur retour. Rien de codé en dur : le marqueur vit dans le référentiel, le montant (`scientifiqueParBatiment`) dans le panneau Paramètres.
- Moteur : `emplacementsMetierVille` (metiers.ts) filtre `constructionRef(b)?.batimentDeFaction === true` (docblock REMPLACÉ/RETRAIT en cascade) ; texte du référentiel (« bâtiments de faction offrent +1 emplacement ») ; colonne ParamsPanel « Scient./bât. faction » ; section 12 lois des docs AMENDÉE (tableau, arbitrage 2 REMPLACÉ, note Science) ; test `cultures.test.ts` RÉÉCRIT (deux constructions de faction INJECTÉES dans la config, même patron que les tiers 2/3 de pays/Constructions.test.ts : +1 par bâtiment de faction sur 3, loi DORT à 0 sans marqueur, aménagements exclus).
- (NB attributions, même retour : les lits des lois de logement — +5 Taudis / +2 Palais — suivent la convention des apports de constructions : comptés dans le parc pour l'axe Logement du bonheur et le magnét migratoire, NON attribuables nommément. Convention maintenue.)


## Lits des lois ATTRIBUTABLES (6e retour arbitre Thibaut, 2026-10-29)

- **Retour Thibaut** : « il faut que les lits des lois puissent abriter des habitants, sinon ça ne sert à rien. » — les +5 Taudis du Communautarisme « Logements élargis » et les +2 Palais du Lunisme « Villes Saintes » deviennent **ATTRIBUTABLES nommément** : `attribuerDomicilesVille` (engine/domiciles.ts) ajoute `domicilesCultureVille` au stock de service, en plus du stock du rang — un sans-abri d'une ville communautariste reçoit un Taudis de la loi, un noble luniste un Palais. Les Palais issus de la loi passent par la même RÉSERVE NOBLE que les autres (`reserveNobleDomicile`, retour 2026-10-28). ASYMÉTRIE assumée avec les apports de constructions (`domicilesApportesVille`), qui restent du parc non attribuable — non visés par le retour.
- Consommateurs vérifiés SANS changement moteur : `logementsVille` (bonheur) et le magnét migratoire v3 `logementsLibres` comptaient déjà les lits dans le parc — le score Logement reste cohérent (l'occupation monte, la capacité ne change pas) ; VilleCarte reflète l'occupation (`occLog`) automatiquement, les sans-abri chutent. Docblocks amendés en REMPLACÉ (`domicilesCultureVille`, `attribuerDomicilesVille`, commentaire parc de `bonheur.ts`, commentaire `capLog` de `VilleCarte.tsx`).
- Tests : `engine/cultures.test.ts` étendu d'un test d'attribution nominative (parc vide + habitants sans domicile : sans loi personne n'est logé ; Communautarisme → exactement 5 Taudis de la loi attribués, au-delà sans-abri ; Lunisme sans noble → Palais de la loi vides ; un noble à 300 → Palais de la loi, les non-nobles n'y touchent pas). `engine/domiciles.test.ts` : la ville témoin du setup étant COMMUNAUTARISTE, `partieTemoin` passe en culture SANS loi de logement — les tests de MÉCANIQUE d'attribution (1 lit = 1 habitant, qualité d'abord, réserve noble, pas de surbooking) restent des contrats sur le STOCK DU RANG SEUL.
- Validation : **243/243 tests natifs** (242 + 1 nouveau) ; diag RE-LANCÉ : les 14 lignes [ÉCHEC] IDENTIQUES et `diag-out.txt` BYTE-IDENTIQUE (aucun sans-abri dans les villes à loi de la fixture — l'attribution n'y change rien, diff légitime nul) ; diff vs tête `92514428` : 5 fichiers src. Contrôle de types reporté sur la CI (npm install interdit par le sandbox, seul `VilleCarte.tsx` est touché côté .tsx — commentaires seuls).
## Refonte des régimes — 8 LOIS (2026-10-29)

- **Arbitrage Thibaut (acté)** : proposition des 8 lois des 4 régimes politiques (Autoritarisme, Socialisme, Démocratie, Monarchie). Principe directeur réaffirmé en séance : bonus de VILLE → joueur qui contrôle la ville ; bonus d'HABITANT → habitant porteur (donc son joueur) — ex. Sethisme : Caravanes au propriétaire de la ville, Science des nobles sethistes au possesseur du noble. Élections (sante.ts fDemocratie) et Droit Divin (tour.ts bonusMonarchie) déjà codées ; Conscription existait en TEXTE depuis l'origine mais n'avait jamais été codée.
- **Config** (`referentiels.json` bloc régimes réécrit : 4 régimes × loi textuelle + 7 champs chiffrés) : `leveeOrParRangPays` 10, `departHabitantsMult` 0,8, `orParMigrant` 1, `consoNourrBourgeoisRegime` 1, `consoNourrNobleRegime` 2, `bonheurParHabitation` 5, `tributVassalMult` 1,05. `defaultConfig` : `RegimeDef` + `migrerRegimes` EXPLICITE (purge les champs morts `garnisonParRang`/`nourrEteChampRiziere` des configs sauvegardées — PAS de bump de SCHEMA_VERSION_CONFIG). `rules/types.ts` : source `regime` et `fluxParAmenagement` retirés.
- **Moteur** : `rangs.ts` (`rangPaysNiveau` : Baronnie 1 → Empire 5, hors échelle 0) ; `armees.ts` (prixArmee 4e arg `{ regime?, rang? }` — Conscription −10 × rang du PAYS, cumulée à la réduction de ville, plancher 0) ; `economie.ts` (Redistribution : `consoNourrHabitant(c, C, regime?)` bourgeois 1 / nobles 2, chemin `detailGainsVille` inclus) ; `bonheur.ts` (`bonusBonheurRegime` +5 par habitation, `bonheurVilleComplete` plafonne à 100) ; `migrationBonheur.ts` (`multDepartRegime` pur ×0,8 au tirage de départ ; Terre d'accueil +1 Or par migrant ARRIVANT — foyers entiers, déménagements internes inclus, joueur DESTINATAIRE, 1 ligne de log par migrant) ; `vassalite.ts` (tribut REÇU ×1,05, le vassal paie sa part, la différence est créée) ; `garnisons.ts` (bonus de régime retiré du détail) ; `regimes.ts` (docblocks REMPLACÉ/RETRAIT, `effetsRegime`/`reglesRegimes` supprimés, `appliquerEffetsRegimesCultures` SANS saison, étape 3septies = lois d'habitant seules) ; `tour.ts` (clé `loisCultures`, l'ancienne `regimesCultures` orpheline pour les vieux historiques) ; `production.ts` (canal « Lois des cultures » : lois d'habitant seules ; RETRAIT du DERNIER appel `effetsRegime` dans `provenancesApports` — symbole supprimé non importé, attrapé AVANT le push : il aurait fail `npx tsc --noEmit` en CI, les tests natifs ne l'exercent pas).
- **RETRAIT banque** : source `regime` retirée — `reglesRegimes`/`effetsRegime` supprimés, registre 84 → 83 règles (canal diag `fluxParAmenagement` parti avec). Anciennes lois « garnison +15/rang d'habitation » et « nourriture d'été champs/rizières » REMPLACÉES/historisées (git).
- **UI** : `RecapParTour`/`RecapDernierTour` (colonne « Lois des cultures », repli `loisCultures ?? regimesCultures ?? {}`) ; `OngletsCultures` (wiki 7 colonnes + note) ; `CarteRoyaume` (`loiChiffree` 7 champs + badge) ; `ParamsPanel` (7 NumberInput, step 0,05 pour les multiplicateurs) ; `ArmiesPanel` (6 call sites `prixArmee` avec p/target/x) ; `VilleCarte` (bonus Bonheur + title + marqueur `({p.regime} +{bonus})`).
- **Tests** (243 → **254**) : NOUVEAU `engine/regimes.test.ts` (12 tests : Conscription prix/cumul/plancher, `rangPaysNiveau`, montants verrou des 7 champs, Frontières closes ×0,8, Redistribution conso + chemin `detailGainsVille` −7/−14/−4/−8, Pouvoir du peuple ×2, Vassaux ×2, lois structurelles Élections/Droit Divin) ; `rules/regimes-cultures.test.ts` RÉÉCRIT (3 tests) ; `rules/banque.test.ts` (source 'batiment' pour le test saison) + `rules/registre.test.ts` (contrat sans `fluxParAmenagement`) adaptés ; `engine/migrationBonheur.test.ts` (`partie()` neutralise `pl.regime` — le défaut Autoritarisme des 8 joueurs faussait le tirage — + 2 tests Terre d'accueil, seed 20261029).
- Validation : **254/254 tests natifs** ; diag CHANGE LÉGITIMEMENT (log 749 → 726 entrées — les lois changement les tirages aux graines fixes ; registre 84 → 83 règles ; canal `fluxParAmenagement` retiré) — les 14 lignes [ÉCHEC] IDENTIQUES base↔nouveau ; `diag-out.txt` régénéré. Diff vs base `997f3870` : 28 fichiers modifiés + `engine/regimes.test.ts` (nouveau) + `diag-out.txt` + les 2 docs.

## Sync v4 de rattrapage + audit du 30/10 (2026-10-30)

- **SYNC v4** : constat d'ouverture — le miroir `v4` avait **123 commits de retard** (dernier sync `1d8d590`, miroir de `700895e` du 2026-10-25) ; `v4` restant la branche qui construit le SITE Quartz (le jeu, lui, se déploie depuis `chasse-et-peche-web`). Périmètre du miroir vérifié par tarballs des deux têtes : **`src/` + `supabase/` uniquement** (les configs racine de v4 = site Quartz ; `docs/ia` et `AGENTS.md` hors miroir). Baseline PROPRE avant sync : `v4/src` et `v4/supabase` byte-identiques à `700895e` — aucun édit manuel à fusionner (la règle inventaire-blob avant sync a été respectée : rien à merger côté v4). **93 fichiers poussés en 9 commits thématiques** (`14b1cbf2` config → `c5319494` UI+SQL, messages `sync(jeu) : rattrapage 25→29 oct — lot N/9`, cf. tête web `849d64c2`) **+ 2 suppressions** : `13e16d25` (`src/engine/merveilles.ts`) puis tête v4 `e03a6deb` (`src/engine/statutAuto.ts`) — retraits de l'audit du 27/10 absents du miroir. Intégrité vérifiée par RE-TARBALL de la tête v4 : `diff -rq` NUL sur `src/` ET `supabase/` (158/158 fichiers identiques entre branches — round-trip push_files UTF-8/accents/emojis sans perte). CI : runs intermédiaires #1578-1584 cancelled (concurrence Pages, normal), run **#1585 sur la tête `e03a6deb` SUCCESS** (1m24s) ; site + jeu live répondent 200 (contenu inchangé — le jeu se construit depuis la tête web, identique).
- **AUDIT 2026-10-30** (rapport complet : [audit-code-2026-10-30.md](audit-code-2026-10-30.md)) : base `fed35f5e` (27/10) → tête `849d64c2` (29/10), 69 fichiers modifiés + 9 nouveaux dans `src/`. Constats : **A1** 🟠 `normaliserEtat` ne complète pas `p.armees` → crash fin de tour (« p.armees is not iterable ») sur un état ingéré antérieur aux armées (2026-10-17) — **REPRODUIT** au harnais ; correctif d'UNE ligne + test proposés, **à arbitrer** ; **A2** 🟡 perf 16k habitants : 3,2-4,3 s/tour (1,7-3,2 s le 27/10), dont `migrationBonheur` ≈ 0,21 s isolés — surveillance (bandeau F4 tient, partie live très en dessous) ; **a1** `malusFerveurMartiale` = première culture martiale du référentiel seulement (conforme à l'arbitrage actuel — une seule : Zélotisme) ; **a2** le dernier recrutement peut dépasser la puissance cible (soldat indivisible, sans action) ; **a3** compteurs AGENTS.md périmés → **corrigés ce jour** (254 natifs / 12 fichiers 21 tests de rendu, 2e dérive — les compteurs devraient suivre chaque vague de tests). Points forts relevés : refonte « 8 lois » sans double comptage banque/moteur (source `regime` fermée, repli `loisCultures ?? regimesCultures`), docblocks-arbitrages intacts y compris sur les abandons de modèle (dérivation armée → stockée fait foi ; pondération multiplicative → additive v3), m1/m2 multijoueur appliqués et testés, migrations de config à drapeaux ciblés sans bump de SCHEMA_VERSION_CONFIG.
- **Validation du jour** : **254/254 tests natifs** rejoués en local (engine + rules + config + state + supabase, harnais `node --experimental-strip-types` + loader du dépôt ; tests de rendu UI couverts par la CI verte de la tête) ; `scripts/diag.ts` rejoué **IDENTIQUE** à `diag-out.txt` (14 lignes [ÉCHEC] informatives) ; bench 16k cf. A2 ; repro A1 ancrée au rapport.
- **Poussé ce jour (docs seuls — bundle live inchangé attendu)** : `docs(ia)` audit-code-2026-10-30.md + compteurs AGENTS.md + la présente entrée.
- **INCIDENT CI « jeu » ROUGE — découvert à l'audit, corrigé le jour même** : le check « jeu » était en ÉCHEC sur la tête `849d64c2` **depuis `2f253c09`** (29/10, refonte 8 lois — le « fix CI » `849d64c2` n'a pas suffi) ; les commits docs de l'audit en héritaient. **Le live n'a jamais été impacté** (`deploy.yaml` tourne indépendamment de la CI jeu — déployé SUCCESS, site + jeu 200). Cause : `ArmiesPanel.test.ts` calculait `prixArmee(90, C)` SANS le joueur alors que la refonte 8 lois fait passer le JOUEUR au panneau — le joueur 1 de la fixture est Autoritarisme, sa loi « Conscription » (−10 Or × rang) rend **35 Or** quand le test attendait **45 Or** ; test de rendu joué uniquement en CI (React indisponible en local jusqu'ici) → rouge invisible hors CI. **Correctif `a1523107`** (réparation d'urgence, la convention interdit une CI rouge) : le test calcule le prix COMME LE PANNEAU — `prixArmee(90, C, undefined, p1)` (sans ville de levée : valeur effective `''` du Select en cascade → `villeLeveeObj` undefined, AVEC le joueur) + commentaire in situ. Validation locale après correctif : **254/254 natifs + 21/21 rendus, diag IDENTIQUE**. Rapport d'audit amendé (constat **A0** ajouté).
- **OUTILLAGE : harnais de rendu LOCAL reconstruit (fin du « rouge invisible hors CI »)** : npm restant bloqué dans l'environnement, les **tarballs npmjs passent par curl** — react 18.3.1 + react-dom + scheduler 0.23.2 extraits dans `node_modules/`, stub `@supabase/supabase-js` (createClient inerte), binaire esbuild 0.23.1 ; les 12 fichiers de tests de rendu sont bundlés (`esbuild X.test.ts --bundle --jsx=automatic --packages=external --loader:.json=json --format=esm`) vers `.tmp-rendu/` puis joués par `node --test`. Les tests de rendu sont donc désormais rejouables EN LOCAL à chaque session — à régénérer après tout changement de `src/`.
- **ARBITRAGE Thibaut (30/10, constat A1)** : PAS de correctif — les vieilles sauvegardes locales antérieures aux armées (2026-10-17) sont OBSOLÈTES, il les supprime de son côté (localStorage navigateur) ; aucun état créé par `createGame` n'est concerné. Rapport d'audit mis à jour (A1 arbitré/refusé, constat et reproduction conservés pour mémoire).
- **CORRECTIFS a1 + a2 (arbitrage Thibaut 30/10 « corrige les mineurs a1 et a2 »)** : a1 `2dc36c6e` — `malusFerveurMartiale` applique TOUTES les lois `garnisonHorsCultureParRang` présentes dans le monde (la boucle historique s'arrêtait à la première culture martiale du référentiel) : une fois par habitation ET PAR CULTURE, une habitation de culture martiale protégée de SA loi mais subissant celle des autres cultures martiales présentes ; test avec une 2e culture martiale (Marsisme, loi −10 × rang) injectée au référentiel ; à une seule culture (Zélotisme, l'état actuel du jeu) le comportement est INCHANGÉ. a2 `d59383f9` — `recruitForArmies` n'engage une recrue que si ses points TIENNENT dans la puissance cible (`while (puissance + puissanceSoldat <= armee.puissanceCible)`) : plus de dernier recrutement au-delà de la cible (ex. 40 → 55 pour une cible à 50) ; le Soldat étant indivisible, une armée peut rester juste SOUS la cible si l'écart restant est inférieur aux points du Soldat ; à écart multiple des points du Soldat (levée, renfort, pertes — alignés par construction), comportement inchangé. Miroir v4 `9ee2e0bc`. Validation : **256/256 natifs** (254 + 2 nouveaux tests) + **21/21 rendus** (harnais local reconstruit après reset : tarballs react/esbuild via curl, les 12 fichiers de rendu y compris `components/pays/Constructions.test.ts`), diag IDENTIQUE (byte-identique), diff vs base limité aux 4 fichiers voulus.

## Carte de ville : tableau des CLASSES SOCIALES (6e retour Thibaut du 28/10, séance du 30/10 — base c2be6c81)

- **Retour Thibaut** : « Dans les villes, dans les tableaux, ajoute sous le tableau des métiers un tableau avec les classes sociales présentes dans la ville (roturier, bourgeois, noble) ». Le tableau vit dans la colonne DROITE de la carte (celle des métiers), empilé SOUS celui-ci — la colonne gauche (cultures, logements, garnison) ne change pas.
- **Moteur** : nouveau helper `compterClassesSociales(habitants, C)` dans `engine/statutSocial.ts` (sous `rangDe`) — comptage des vivants par `rangDe`, ordre hiérarchique noble → bourgeois → roturier, classes PRÉSENTES seulement (> 0). Comme il s'appuie sur `rangDe`, il hérite GRATUITEMENT de la refonte 12 lois : la loi « Bourgeoisie facile » du Communautarisme (seuil bourgeois 80) se reflète dans le tableau sans code supplémentaire.
- **UI** (`VilleCarte.tsx`) : la colonne droite passe sous le wrapper `ville-col-stack` (même empilement + filets que la colonne gauche) — métiers PUIS « Classes sociales », mêmes colonnes que Cultures présentes (label · nombre · part en % des vivants), label Noble en gras, ville vide → « aucun habitant ». Tooltip du titre : rappel de la règle du rang (naissance/250/100). `styles.css` : commentaire seul — le wrapper existant sert aux deux colonnes, zéro CSS structurel nouveau.
- **Tests** : `engine/statutSocial.test.ts` +1 test moteur (hiérarchie noble 3 / bourgeois 1 / roturier 1, classe unique, ville vide → []) ; `components/PlayerView.test.ts` : titre présent, position APRÈS « Métiers : », lignes dérivées du MÊME helper (fixture capitale : nobles + roturiers, PAS de bourgeois → négatif sur la ligne absente). **256 → 257 natifs**, 21 rendus.
- **REBASE** : la branche avait avancé entre les séances (sync v4 + audit du 30/10, base locale `f36fc388` → tête `c2be6c81`, correctifs a1/a2 + refonte 12 lois touchant `statutSocial.ts`/`VilleCarte.tsx`/`PlayerView.test.ts`) — bac resynchronisé par tarball codeload à `c2be6c81`, modifications ré-appliquées SANS conflit (zones disjointes : seuil bourgeois culturel, bonus bonheur régime, lits des lois).
- Validation : `tsc --noEmit` OK ; **257/257 natifs + 21/21 rendus** (harnais esbuild local) ; `diag-out.txt` BYTE-IDENTIQUE ; bundle fonction rejoué OK. Diff vs base : 5 fichiers (statutSocial.ts, statutSocial.test.ts, VilleCarte.tsx, styles.css, PlayerView.test.ts).

## Dogmes de culture — MISE EN FORME (arbitrages Thibaut du 30/10, 2e séance)

- **Arbitrages Thibaut (actés ce jour)** : quand une CULTURE (pas un joueur) franchit un palier de Tourisme (50, 100, 150… — paramètre `palierTourismeDogme`, défaut 50, groupe Culture), le joueur ayant le plus de Tourisme dans cette culture choisit un DOGME affectant les habitants ou les villes de cette culture. (1) Un dogme à CHAQUE palier, cumul à l'infini ; (2) Tourisme de culture = somme des valeurs de Tourisme des villes de la culture, TOUS JOUEURS confondus, SANS les cités libres ; (3) le dominant peut changer d'un palier à l'autre, un dogme n'est PAS remplaçable ; (4) dogmes, lois et effets de culture se CUMULENT. Retour d'implémentation : « code la mise en forme sans dogme réellement créé, les dogmes définitifs viendront plus tard » → fondations complètes, table `dogmes` du référentiel VOLONTAIREMENT VIDE, AUCUN effet moteur, PAS d'UI de choix interactif. Candidats dogmes ébauchés par Thibaut (Travail, Famille, Patrie, Solidarité, Liberté, Santé… + Egalité/Fraternité à définir) : À VENIR au référentiel avec les effets chiffrés (champ `effets` de DogmeDef, non lu pour l'instant).
- **Retour des dogmes** : l'ANCIEN système (effets d'AFFICHAGE Pontife/Fidèles en texte libre, jamais branché moteur) retiré le 2026-10-24 avec la promesse « un éventuel retour des dogmes repartira de zéro » — c'est ce retour. La purge cfgOf est AMENDÉE : elle ne supprime plus la table entière (delete) mais FILTRE les entrées ANCIEN format (sans champ `culture`) et POSE la table. Subtilité découverte en validation : `gardeFous` ne passe que dans la branche « déjà convergée » de cfgOf (les configs sans `schemaVersion` à jour prennent la branche migration) — la purge doit donc POSER la clé elle-même (table filtrée, possiblement vide) pour qu'elle soit bien typée dans les DEUX branches. Deux incidents d'outil edit rattrapés au diff : `citesLibres: ref.citesLibres` un instant supprimé de DEFAULT_CONFIG (rétabli) ; clé `dogmes` en DOUBLON dans le littéral (tsc l'aurait refusé — esbuild l'a signalé en warning au bundle, clé unique gardée à l'emplacement historique, sous `tourismeSeuils`).
- **Moteur** (`engine/dogmes.ts`, NOUVEAU — 7 fichiers au total : types.ts, villes.ts, params.ts, defaultConfig.ts, dogmes.ts, dogmes.test.ts, CulturePays.tsx) : `tourismeVille` (= `productionVille` canal « total » — la valeur affichée en bas du cadre ville) ; `tourismeCulture` (tous joueurs, cités libres exclues PAR CONSTRUCTION — n'itère que `state.players`) ; `nbPaliersDogmes` (floor, plancher 1 sur le pas) ; `dogmesCulture` (tri palier croissant) ; `joueurDominantCulture` (le plus de Tourisme dans SES villes de la culture, égalité → plus petit n°, undefined si personne) ; `paliersDogmesEnAttente` (franchis moins consommés, toutes cultures, dominant évalué à la LECTURE) ; `choisirDogme` (mutateur : palier multiple du pas / non consommé (« un dogme n'est pas remplaçable ») / franchi / dogme au référentiel POUR la culture ; inscrit `{culture, palier, nom, choisiPar: dominant, choisiAuTour}` au nom du DOMINANT + entrée de journal « Culture » ; retourne null ou message d'erreur). `GameState.dogmes?: Dogme[]` optionnel complété par `normaliserEtat` (contrat routesCommerce/citesLibres — l'arbitrage A1 du 30/10 ne concernait QUE les sauvegardes antérieures aux armées, déclarées obsolètes). Distinction documentée : `tourismeSeuils` = PONTIFICATS par JOUEUR (Rang I/II/III), mécanisme DIFFÉRENT des dogmes (par CULTURE, cumul infini).
- **UI** (`CulturePays.tsx`) : section « Dogmes de la culture » dans la carte — Badge tourisme total + prochain palier, paliers franchis vs dogmes pris, liste des dogmes pris, palier en attente en Badge warn avec dominant (« c'est à toi » si c'est le joueur affiché), note « aucun dogme encore défini » tant que la table référentiel est vide pour la culture, ligne de règle. Carte de LECTURE : le choix interactif viendra avec les dogmes définitifs. Aucune annonce de palier au journal de fin de tour à ce stade (une annonce répétée tant que le choix pend serait du bruit — l'entrée part du CHOISIR).
- **INCIDENT CI (rattrapé en 2e push)** : la CI « jeu » est passée ROUGE sur `3fbfcb27` — `npx tsc --noEmit` refusait `dogmes.test.ts` alors que les tests PASSAIENT : `assert.equal(state.dogmes, undefined, …)` (strictEqual typé « asserts actual is T ») rétrécissait `state.dogmes` à undefined pour tout le reste du flux → accès `never` (choisiPar, palier, length…) ; + 2 déstructurations non lues (noUnusedLocals). Correctif `5583313d` : capture dans une const AVANT l'assert (le rétrécissement s'applique à la capture, pas au champ) + déstructurations élaguées. Le live n'a pas été impacté (deploy/diag SUCCESS sur le même sha, workflows indépendants).
- **OUTILLAGE (nouveau)** : `tsc` est désormais rejouable EN LOCAL — tarball npm typescript 5.6.3 + @types/react, react-dom, node via curl (même contournement que react/esbuild), `node tools/typescript/lib/tsc.js --noEmit -p tsconfig.json` validé AVANT le push (zéro erreur hors stub @supabase local). Fin du « typage visible uniquement en CI » : les trois niveaux (natifs, rendus, tsc) sont désormais locaux.
- **Poussé** : `1d8632be` (config) + `3fbfcb27` (moteur+UI+tests) sur chasse-et-peche-web, correctif `5583313d` ; miroir v4 `4f690f78` + `1abda870` + `62661ce1` (compare GitHub : exactement les 7 fichiers, 2+1 commits). Validation : **265/265 natifs** (257 + 8 nouveaux dogmes) + **21/21 rendus** + tsc --noEmit OK + diag IDENTIQUE (byte-identique).
- **À VENIR (dogmes définitifs)** : entrées réelles au référentiel avec `effets` chiffrés, branchement moteur des effets (cumul lois/effets de culture, arbitrage n°4), UI de CHOIX interactif pour le dominant (câblée sur `paliersDogmesEnAttente`/`choisirDogme` déjà en place), annonce de palier au journal de fin de tour.

## Dogmes de culture — RETOUR DES DOGMES DÉFINITIFS (3e séance du 30/10, base 018e6aef)

- **Retour Thibaut** : « voici les dogmes que j'ai retenus et que tu peux mettre en place » — les 12 dogmes définitifs (Travail, Famille, Patrie, Égalité, Solidarité, Fraternité, Liberté, Santé, Évangile, Mère Patrie, Guerres Saintes, Nationalisme) entrent au référentiel avec leurs effets chiffrés, branchés au moteur, + UI de choix interactif. La Fraternité est explicitement « non implémenté » (révoltes) : au référentiel, AUCUN effet moteur.
- **Design (2e séance)** : tous GÉNÉRIQUES (`DogmeDef.culture = '*'` — proposés à toute culture) ; un dogme est UNIQUE par culture (le cumul à l'infini porte sur des dogmes DIFFÉRENTS — `choisirDogme` refuse le doublon) ; les chiffres vivent dans `DogmeDef.effets`, lus PAR TYPE par `effetsDogmeCulture(state, culture, type, C)` (somme des dogmes pris par la culture — le référentiel est la source de vérité, éditer une valeur change l'effet des dogmes déjà pris, même philosophie que les lois de culture). 11 types d'effet documentés au docblock de DogmeDef.
- **Interprétations à faire valider par l'arbitre** (section « Dogmes de culture » de regles-et-arbitrages.md, docblocks moteur) : Travail/Famille/Égalité/Santé = culture PROPRE du personnage (loi d'habitant) ; Patrie/Solidarité/Liberté/Évangile/Nationalisme = culture de la VILLE ; l'Égalité FIXE la consommation (l'emporte sur régime et défaut — `consoNourrHabitant` 4e arg optionnel `state`, non consulté pour les cités libres) ; la Famille agit sur la proba de CONCEPTION (côté femme, ×1,1) ; la Mère Patrie porte sur la culture du SUZERAIN (×1,05 les DEUX chemins : `impotsVassaux` impôt manuel + `transfererTributVassal` fin de tour, le vassal paie sa part, différence créée) ; les Guerres Saintes = malus FIXE −40 une fois PAR culture porteuse, villes porteuses protégées, plancher 0 (nouvelle fn exportée `malusGuerresSaintes`, même famille que la Ferveur martiale à montant fixe) ; l'Évangile multiplie le poids FINAL de la culture (×1,1, présence locale incluse) ; le Nationalisme = jet SUPPLÉMENTAIRE dédié vers la culture d'accueil APRÈS la tentative normale (log « (dogme du Nationalisme) ») ; la Fraternité = zéro effet moteur.
- **Branchement moteur (12 fichiers)** : `economie.ts` (Travail : sans-emploi → +v Nourriture par le canal `metiers` de `detailGainsVille`, avant taxes, sans multiplicateur de rang — culture propre du personnage ; Égalité dans `consoNourrHabitant` ; Mère Patrie dans `impotsVassaux`) ; `vassalite.ts` (Mère Patrie fin de tour) ; `naissances.ts` (Famille ×(1+v) dans `computeFecondite`) ; `metiers.ts` (Patrie : `capMetierVille` +v Garde, ctx optionnel — ajouté aux DEUX branches de cap finie) ; `domiciles.ts` (Solidarité : entrée Taudis SÉPARÉE de la loi dans `domicilesCultureVille`, `state` optionnel) ; `bonheur.ts` (Liberté : `logementsVille`/`bonheurVilleComplete` +10 avant plafond 100) ; `migrationBonheur.ts` (call site `logementsVille`) ; `sante.ts` (Santé : `contractMod` additif dans `maladieStep`) ; `garnisons.ts` (Guerres Saintes : `malusGuerresSaintes` + branchement dans `garnisonHabitationVille`, plancher 0 conservé) ; `culture.ts` (Évangile poids ×(1+v) ; Nationalisme : `culteAccueil` capturé AVANT conversion, `if (rng.chance(...))` au lieu du `continue`, jet dédié ensuite).
- **UI (3 fichiers)** : `CulturePays.tsx` — dogmes pris affichés avec la description du référentiel + CHOIX INTERACTIF pour le dominant (bouton par dogme disponible, prop `choisir?: (palier, nom) => void` — absente : carte de lecture, tests de rendu inchangés) ; `PlayerView.tsx` — mutateur `choisirDogmeJoueur` (le joueur résolu DANS `update` comme `faireConstruire` ; `choisirDogme` valide tout seul et journalise « Culture », un refus part au journal « Système ») ; `OngletsCultures.tsx` — retour de la carte « Dogmes de culture » dans l'onglet Tourisme du wiki (table nom/culture/description/effets du moteur — retour de la carte retirée le 24/10). Pas d'annonce de palier au journal fin de tour (choix maintenu : bruit répétitif tant que le choix pend).
- **Tests (`dogmes.test.ts` 8 → 20)** : intégrité du référentiel verrouillée (12 dogmes génériques, effets EXACTS par type — la table est la source de vérité du moteur) ; choisirDogme générique accepté + doublon refusé + `dogmesDisponiblesCulture` filtré ; UN test PAR EFFET avec le dogme injecté directement dans `state.dogmes` (rng factice pour `maladieStep`/`applyCultureInfluence` : le tirage de contraction reçoit exactement −0,05 plancher 0 compris ; poids Évangile ×1,1 exact ; Nationalisme : 1 tirage sans dogme, 2 avec, conversion par le jet dédié) ; Mère Patrie aux DEUX chemins (ratio ×1,05, le vassal paie sa part) ; tests de la 1re séance adaptés au référentiel non vide (« Dogme Inconnu » pour le refus, défaut 12 hérité par clé absente — NB : `cfgOf` fusionne `{...DEFAULT_CONFIG, ...c}`, une config sans la clé `dogmes` hérite maintenant du DÉFAUT, comme toute clé absente).
- **INCIDENT CI (intermédiaire, tête VERTE)** : mauvais découpage de mes lots — le lot 1 (`141c3d89` : référentiel + module + tests) est arrivé AVANT le lot 2 des hooks : la CI « jeu » de `141c3d89` est ROUGE (tsc : `malusGuerresSaintes` inexistant, signatures 3/4 arguments) alors que la TÊTE `2c574409` est VERTE (jeu + diag + deploy success — annotations vérifiées : uniquement le séquençage). Leçon notée : les tests d'un effet vont avec SON hook, pas avec la table. Miroir v4 : `d68b6ed7` + `03c70062` (deploy success).
- **Validation** : **277/277 natifs** (265 + 12 nouveaux) ; **21/21 rendus** (12 fichiers re-bundlés esbuild — le stub local @supabase/supabase-js reconstruit après reset avait une accolade non fermée, réparée) ; `tsc --noEmit` OK (zéro erreur hors stub supabase local) ; diag BYTE-IDENTIQUE (aucun dogme pris dans la fixture, hooks inertes — attendu). Diff vs base : 16 fichiers src exactement, chaque suppression relue au diff (aucune ligne perdue).

## Dogmes — correctifs Famille et Nationalisme (4e retour arbitre Thibaut du 30/10, base 0d4b9da8)

- **Retour Thibaut** (2 correctifs, + confirmation du périmètre) : « pour la famille, le multiplicateur est côté homme et femme » ; « tous ces dogmes n'affectent que les habitants de cette culture ou les villes de la culture, et n'ont aucun effet sur les personnages des autres cultures » (déjà le cas — périmètre confirmé, verrouillé aux tests) ; « pour le nationalisme, ce n'est pas un nouveau jet, mais pris en compte dans le test de conversion culturelle déjà présent ».
- **Famille** (`naissances.ts`, `computeFecondite`) : le ×(1+v) passe sur les TROIS voies du facteur — le return masculin (affichage de la fécondité d'un homme porteur), le facteur de l'ÉPOUX (`factorMari` — un mari porteur multiplie SA part : une femme d'une autre culture mariée à un porteur conçoit ×1,1) et le côté femme (inchangé). Description du référentiel amendée (« côté homme et côté femme… chaque époux porteur multiplie sa part »).
- **Nationalisme** (`culture.ts`, `applyCultureInfluence`) : le jet dédié d'après-tentative est RETIRÉ (ainsi que le log « (dogme du Nationalisme) ») — le bonus est intégré AU TIRAGE pondéré existant : la culture d'ACCUEIL (celle de la ville du personnage, si elle porte le dogme et qu'il est d'une autre culture) gagne +v × le poids TOTAL des autres cultures. Les chances en plus ne mènent QUE vers la culture d'accueil, jamais vers une tierce culture ; les autres poids ne bougent pas ; un seul `rng.chance` par personnage. Description du référentiel amendée (« dans le tirage de conversion culturelle… pas de jet séparé »).
- **Tests** (`dogmes.test.ts`, 2 réécrits, total inchangé à 20) : Famille — les trois voies vérifiées par ratio exact ×1,1 (femme seule, homme, femme d'une autre culture mariée à un porteur via `mariageId` + `indexPopulationMonde`), un personnage d'une autre culture non marié inchangé ; Évangile/Nationalisme — part (b) réécrite : UN seul tirage avec ou sans dogme, poids d'accueil = poids sans dogme + 0,15 × Σ des autres poids (exact à 1e-9), autres poids inchangés, conversion par le log NORMAL (plus de mention dédiée).
- **Validation** : **277/277 natifs**, **21/21 rendus**, `tsc --noEmit` OK (zéro erreur hors stub supabase local), diag BYTE-IDENTIQUE (aucun dogme pris dans la fixture). Diff vs base : 4 fichiers exactement (naissances.ts, culture.ts, defaultConfig.ts, dogmes.test.ts), chaque suppression relue au diff.

## Dogmes — correctif Famille (jet vs affichage) + onglet Dogmes (5e retour arbitre Thibaut du 30/10, base ab6a5391)

- **Retour Thibaut** (2 demandes) : « il faudrait un onglet Dogmes, au même titre qu'un onglet royaume et Pays » ; « pour la fécondité regarde bien, le calcul de la conception prend en compte la fécondité homme et la fécondité femme. Une femme n'a pas à gagner en fécondité si son mari est d'une culture féconde ».
- **Diagnostic au code** : le correctif du 4e retour avait une lacune RÉELLE — le jet de conception (`conceptionEtNaissances`, qui duplique la formule de `computeFecondite`) ne portait AUCUN effet dogme : le ×1,1 de la Famille ne multipliait que la valeur AFFICHÉE, jamais les conceptions réelles. Et la fécondité affichée d'une épouse incluait le dogme de SON MARI (via `factorMari`) — exactement ce que l'arbitre conteste.
- **Famille (5e retour)** : chaque personnage porte la fécondité de SA culture propre (côté homme : return masculin ; côté femme : sa part). Le JET de conception prend en compte la fécondité homme ET la fécondité femme : `factorMari` du jet porte ×(1+v) de la culture PROPRE de l'époux (un mari porteur multiplie SA part — une épouse non porteuse conçoit ×1,1 avec lui ; un couple porteur des deux côtés ×1,21), et la part de la mère porte ×(1+v) de SA culture propre. La fécondité AFFICHÉE de l'épouse (`computeFecondite`) ne porte PLUS le dogme du mari : « une femme n'a pas à gagner en fécondité si son mari est d'une culture féconde ». Amendement documenté du docblock du retour 2026-10-15 (affichage = proba réelle) : le champ affiché est désormais la proba SANS la part de dogme de l'époux. Description du référentiel amendée.
- **Onglet « 🕯 Dogmes »** (`DogmesView.tsx`, NOUVEAU) : section de premier niveau de la nav (entre Pays et Population), barre J1..J8 affichée — vue TOUTES CULTURES PRÉSENTES : carte par culture (Tourisme moteur `tourismeCulture`, paliers franchis, dominant, dogmes pris avec descriptions du référentiel, paliers en attente et CHOIX INTERACTIF quand le joueur sélectionné est le dominant — mutateur `choisirDogmeJoueur` généralisé à toute culture, `choisirDogme` valide/journalise comme toujours) + table du référentiel (12 dogmes, effets moteur, colonne « Pris par »). `App.tsx` : Section 'dogmes', label, joueursBars, rendu. La carte « Culture du pays » (page Pays) reste inchangée.
- **Tests** : `dogmes.test.ts` — test Famille RÉÉCRIT (total 20 inchangé) : rng ENREGISTREUR sur `conceptionEtNaissances` (chance → false : aucune grossesse, aucune autre consommation d'aléa) capture la proba de conception de chaque femme éligible — 7 personnages : femme porteuse célibataire ×1,1 (jet et affichage), mari porteur ×1,1 (affichage), épouse NON porteuse d'un porteur : affichage INCHANGÉ (5e retour) mais jet ×1,1 (la part de LUI), épouse porteuse d'un non-porteur ×1,1 (jet et affichage), couple porteur ×1,21 (jet, chaque époux multiplie sa part) et ×1,1 seul à l'affichage. NOUVEAU `DogmesView.test.ts` (13e fichier de rendu) : page sans crash, carte par culture présente avec le Tourisme du VRAI MOTEUR et le compte de paliers, table des 12 dogmes du référentiel.
- **Validation** : **277/277 natifs** (total inchangé), **22/22 rendus** (13 fichiers, +1), `tsc --noEmit` OK (zéro erreur hors stub supabase local), diag BYTE-IDENTIQUE. Diff vs base : 4 fichiers modifiés (App.tsx, naissances.ts, defaultConfig.ts, dogmes.test.ts) + 2 nouveaux (DogmesView.tsx, DogmesView.test.ts), chaque suppression relue au diff.

## Dogmes — correctif table vide + « pontife » (6e retour arbitre Thibaut du 30/10, base 1c6ee5c4)

- **Retour Thibaut** (2 points) : « je n'arrive pas à choisir de dogme, soit-disant la table de référentiel est vide » ; « remplace dominant par pontife ».
- **Incident (table vide)** : DIAGNOSTIC au code + repro scriptée — les configs sauvegardées AVANT le retrait du 24/10 portent la table `dogmes` à l'ANCIEN format (affichage, sans champ `culture`) ; la purge de cfgOf (introduite avec le retour des dogmes, 3e séance) filtrait la table FUSIONNÉE `{...DEFAULT_CONFIG, ...c}` : la vieille table écrasait les 12 dogmes du défaut par la fusion, puis était purgée → `[]` — convergée et RE-SAUVEGARDÉE (convergerConfig aux points d'entrée : chargement, nouvelle partie…), le `[]` masquait les défauts à CHAQUE relecture (fusion : le `[]` de la config gagne). Repro : config ancien format → convergence → 0 dogme ; relecture → 0 pour toujours. C'est le scénario réel : la config MONDIALE du navigateur de Thibaut est antérieure au 24/10.
- **Correctif (`defaultConfig.ts`, cfgOf)** : la table SAUVEGARDÉE (c.dogmes, pas la fusionnée) ne masque les défauts QUE si elle contient des entrées du NOUVEAU format (table personnalisée) ; absente, VIDE (`[]`), ou tout ANCIEN format (config d'avant le 30/10) → on retombe sur les DÉFAUTS (les 12) — les vieilles sauvegardes récupèrent le référentiel d'elles-mêmes, y compris les configs DÉJÀ estampillées `[]` par le code du 5e retour. Amendement documenté (docblock) : la propriété « une table explicitement vidée par l'arbitre reste vide » est RETIRÉE — pour vider le référentiel, on retire les entrées du défaut. Les entrées anciennes supprimées ne reviennent jamais (règle (x)).
- **« Pontife »** : le rôle « joueur dominant de la culture » (le plus de Tourisme, arbitrage n°3 du 30/10) est rebaptisé PONTIFE — arbitrage Thibaut. Renommé PARTOUT, identifiants compris : `joueurPontifeCulture` (ex-joueurDominantCulture), champ `PalierDogmeEnAttente.pontife`, variables, libellés UI (« Pontife : », « le pontife », « pontife de la culture »), docblocks (amendés avec la mention du 6e retour), tests. La logique est inchangée ; le terme « dominant » subsiste uniquement dans les CITATIONS des arbitrages historiques et ce journal (append-only). NB : « Pontife » était déjà le vocabulaire de l'ancien système de dogmes retiré le 24/10 (bonus « Pontife/Fidèles ») — cohérent.
- **Tests** : `dogmes.test.ts` garde-fou RÉÉCRIT (table vide `[]` → 12 défauts, ancien format → 12 défauts sans retour des entrées anciennes, nouveau format conservé, clé absente → défaut — l'assertion « table vidée par l'arbitre reste vide » est retirée avec la propriété) ; NOUVEAU test dans `state/config.test.ts` (incident de bout en bout : config mondiale d'avant le 24/10 → convergence → 12, relecture → 12, idempotent) — **278/278 natifs** (+1), **22/22 rendus** (13 fichiers), tsc OK (zéro erreur hors stub supabase local), diag BYTE-IDENTIQUE. Diff vs base relu au complet : 10 fichiers src exactement (defaultConfig.ts, dogmes.ts, dogmes.test.ts, types.ts, config.test.ts, DogmesView.tsx, CulturePays.tsx, PlayerView.tsx, OngletsCultures.tsx, App.tsx) + AGENTS.md (compteurs 277→278) + docs.

## Dogmes — les dogmes dans chaque culture, en grille (7e retour arbitre Thibaut du 31/10, base b89d7159)

- **Retour Thibaut** : « il faudrait que les dogmes à choisir soient dans l'onglet Dogmes et plusieurs dogmes par ligne. En fait, il faudrait qu'il y ait les dogmes dans chaque culture de la page Dogmes ».
- **Rendu (`DogmesView.tsx`, SEUL fichier src touché avec son test)** : la carte de chaque culture liste TOUS les dogmes du référentiel pour elle (`culture === '*' || culture === culture`), TOUJOURS visibles — plus de bloc conditionnel « pris listés + choix seulement si pontife sélectionné ». Grille `grid-3` (plusieurs par ligne), tuiles `mini` : nom (`mini-title`), description, état PRIS (badge palier + choisi par qui + jamais remplaçable) ou DISPONIBLE ; le bouton « Choisir » n'apparaît que pour le pontife avec palier en attente (`jeChoisis`), les tuiles restent visibles sans bouton pour les autres joueurs — on voit les dogmes de CHAQUE culture sans changer de sélection. Cas de bord : un dogme PRIS retiré du référentiel entre-temps reste affiché (tuile « plus au référentiel. Jamais remplaçable ») — un dogme pris ne disparaît jamais. Le hint « palier franchi — à toi / à choisir par X » est conservé, déplacé au-dessus de la grille. Intro de la carte mécanisme amendée. `dogmesDisponiblesCulture` n'est plus importé par la vue (le filtre référentiel se fait en place, l'« orphelin » couvre le reste) ; moteur et mutateurs INCHANGÉS — `choisirDogme` revalide toujours côté mutateur.
- **Tests** : `DogmesView.test.ts` étendu (même test, total 22 inchangé) : grille `grid-3` présente, nombre de tuiles ≥ Σ (cultures × dogmes référentiels de chaque culture) recalculé contre la config (R3, pas codé en dur), chaque nom de dogme apparaît ≥ nb cultures + 1 fois (une tuile par carte culture + la table), statut « Disponible » rendu. **278/278 natifs** (inchangé), **22/22 rendus** (13 fichiers, inchangé), `tsc --noEmit` OK (zéro erreur hors stub supabase local), diag BYTE-IDENTIQUE. Diff vs base : 2 fichiers src exactement (DogmesView.tsx, DogmesView.test.ts), relu au complet avant push.
