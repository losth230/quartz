# Audit du code — 2026-10-30 (armées-banque, taxes par ressource, migrations par bonheur, refontes 12 lois + 8 lois)

Troisième audit complet du code du jeu « Chasse & Pêche » (dépôt `losth230/quartz`,
branche `chasse-et-peche-web`), réalisé le 30/10/2026 sur la tête `849d64c2`
(2026-10-29 11:33). Il complète les audits du 2026-10-19 (référence pour
l'époque pré-multijoueur-v2) et du 2026-10-27 (couche multijoueur, F1-F6) et se
concentre sur ce qui a changé depuis la base `fed35f5e` (2026-10-27 12:06) :
**69 fichiers modifiés + 9 nouveaux** dans `src/`, plus `supabase/schema-v2.sql`.

**Périmètre** : armées par la banque (puissances de métier, réductions de levée,
pertes/renfort « la puissance stockée fait foi », liaison armée-population),
taxes PAR RESSOURCE, retrait de la migration scolaire, flux de
**migration par bonheur** (nouveau `engine/migrationBonheur.ts`), refonte
« 12 lois » des cultures, refonte « 8 lois » des régimes, lits des lois
attribuables, Monuments pieux, m1 (reprise réseau) et m2 (sections de joueurs
inconnus) appliqués le 2026-10-28.
**Méthode** : revue statique du diff intégral + rejeu local du harnais
(`node --experimental-strip-types`, identique à la CI pour le moteur) + diag
rejoué + bench de scalabilité + **reproductions réelles** des constats (A1
reproduit ci-dessous). La session a également commencé par la **sync v4 de
rattrapage** (le miroir avait 123 commits de retard, dernier sync 2026-10-25) :
93 fichiers poussés en 9 lots + 2 suppressions, arbres `src/` + `supabase/`
**byte-identiques** aux deux branches (158/158 fichiers), déploiement Pages
SUCCESS sur la tête v4 (`e03a6deb`, run #1585).

## Statut des constats

| Réf | Problème | Statut |
|-----|----------|--------|
| A0 | CI « jeu » ROUGE à la tête depuis `2f253c09` (29/10, refonte 8 lois) : le test de rendu `ArmiesPanel` calculait `prixArmee` SANS le joueur alors que le panneau le passe (loi Conscription du régime Autoritarisme du joueur 1) → 45 Or attendus vs 35 Or rendus | 🔴→✅ **découvert à l'audit, corrigé le jour même** (`a1523107`) |
| A1 | `normaliserEtat` ne complète pas `p.armees` → crash fin de tour sur un état ingéré dont un joueur manque le champ (sauvegardes antérieures aux armées, 2026-10-17) | 🔵 **arbitré par Thibaut (30/10) : PAS de correctif** — les vieilles sauvegardes locales antérieures aux armées sont obsolètes, il les supprime ; aucun état créé par `createGame` n'est concerné |
| A2 | Perf : fin de tour à 16 000 habitants = 3,2-4,3 s (1,7-3,2 s à l'audit du 27/10) ; le nouveau flux migrationBonheur y compte ≈ 0,21 s | 🟡 surveillance — mitigé par le bandeau F4, partie live très en dessous de 16k |
| a1 | `malusFerveurMartiale` n'applique que la PREMIÈRE culture martiale présente (ordre du référentiel) | ✅ **corrigé** (`2dc36c6e`) : toutes les lois présentes s'appliquent, une fois par habitation ET par culture — inchangé à une seule culture |
| a2 | `recruitForArmies` peut faire dépasser la puissance CIBLE d'un dernier recrutement (soldat indivisible, pas de clamp) | ✅ **corrigé** (`d59383f9`) : la recrue n'est engagée que si ses points tiennent dans la cible — l'armée peut rester juste sous la cible (Soldat indivisible) |
| a3 | `AGENTS.md` : compteurs de tests périmés (157 natifs / 15 de rendu annoncés ; réalité 254 / 21) | ✅ corrigé dans le même commit docs que le présent rapport |

## A0 — CI « jeu » rouge à la tête depuis `2f253c09` : découvert à l'audit, corrigé le jour même 🔴→✅

Le check « jeu » était en ÉCHEC sur la tête `849d64c2` (depuis le commit
`2f253c09` du 29/10, refonte « 8 lois » — le « fix CI » `849d64c2` n'a pas
suffi) ; les commits docs de l'audit en héritaient. **Le live n'a jamais été
impacté** : le workflow `deploy.yaml` tourne indépendamment de la CI jeu
(déployé SUCCESS, site et jeu répondent 200).

**Cause** : le test de rendu `ArmiesPanel.test.ts` vérifiait le prix de levée
avec `prixArmee(90, C)` — SANS le joueur — alors que la refonte 8 lois a fait
passer le JOUEUR au panneau (`prixArmee(90, C, villeLeveeObj, p)`). Le joueur 1
de la fixture est Autoritarisme : sa loi « Conscription » réduit le prix de
10 Or × rang du pays → le panneau rend **35 Or** quand le test attendait
**45 Or**. Le test de rendu n'étant joué qu'en CI (React indisponible en
local jusqu'ici), le faux échec est resté invisible hors CI.

**Reproduction locale** (nouvel outillage — voir journal du 30/10) : harnais
de rendu reconstruit SANS npm (bloqué) par tarballs `curl` de npmjs —
react 18.3.1 + react-dom + scheduler 0.23.2, stub `@supabase/supabase-js`,
binaire esbuild 0.23.1 ; les 12 fichiers de tests de rendu sont bundlés puis
joués par `node --test`. Avant correctif : 20 pass / 1 fail
(ArmiesPanel uniquement).

**Correctif** (`a1523107`, poussé le jour même — réparation d'urgence, la
convention interdit de laisser la CI rouge) : le test calcule le prix
COMME LE PANNEAU — `prixArmee(90, C, undefined, p1)`, sans ville de levée
sélectionnée (valeur effective `''` du Select en cascade → `villeLeveeObj`
undefined), avec le joueur. Après correctif : **21/21 rendus verts** en
local + 254/254 natifs, diag identique.

**Bénéfice collatéral** : les tests de rendu sont désormais jouables EN
LOCAL (le harnais est réutilisable — cf. `.tmp-rendu/` et journal), fin du
« rouge invisible hors CI ».

## A1 — `normaliserEtat` oublie `p.armees` : crash fin de tour sur vieilles sauvegardes 🟠

`normaliserEtat` (engine/villes.ts) complète les tableaux manquants de chaque
ville (`batiments`, `amenagements`, `autres`, `domiciles`) et de l'état
(`history`, `log`, `routesCommerce`, `citesLibres`, `population`) — c'est son
contrat depuis le marqueur (a) : « tableaux manquants = crash moteur ET
rendu ». Mais `p.armees` (ajouté au type `Player` avec les armées,
2026-10-17) n'y figure pas : un état ingéré dont un joueur ne porte pas
`armees` crashe à la première fin de tour.

**Reproduit le jour même** (harnais local) : état créé puis champ `armees`
supprimé (simulant une sauvegarde antérieure au 2026-10-17), `normaliserEtat`
appelé, `runTurn` →

```
TypeError: p.armees is not iterable   (recruitForArmies, for (const armee of p.armees))
```

Aucune autre conséquence : `ArmiesPanel` garde déjà ses accès (`x.armees[idx]`),
`infligerPertes`/`libererSoldats` lisent `p.armees?.[idxArmee]` — seul
`recruitForArmies` (étape armée du tour) itère sans garde. Les états issus de
`createGame` sont intacts (`armees: []` posé par le setup) et les sections
distantes n'écrasent jamais le champ (Object.assign des clés présentes) : le
risque est réel uniquement pour les VIEILLES sauvegardes LOCALES — exactement
la classe de bug que `normaliserEtat` a été écrit pour prévenir.

**Correctif proposé** (une ligne, dans la boucle `for (const p of
state.players ?? [])` de `normaliserEtat`) :

```ts
if (!Array.isArray(p.armees)) p.armees = []
```

+ un test de non-régression dans `engine/armees.test.ts` (état sans `armees`
→ `runTurn` ne crashe pas, armées = []). **ARBITRAGE Thibaut (30/10) : PAS de
correctif** — les vieilles sauvegardes locales antérieures aux armées
(2026-10-17) sont considérées OBSOLÈTES et seront supprimées localement
(localStorage navigateur) ; les états issus de `createGame` ne sont pas
concernés. Le constat et la reproduction restent documentés ici pour mémoire.

## A2 — Fin de tour à 16k habitants : 3,2-4,3 s (surveillance) 🟡

Rejoué avec `scripts/bench-scalabilite.ts` (16 000 habitants, 8 joueurs, même
graine que le bench de l'audit du 27/10) : tour 2 = 3 167 ms, tour 3 = 4 285 ms,
tour 4 = 4 087 ms — contre 1,7-3,2 s mesurés le 27/10. Le nouveau flux
`migrationBonheur` (étape 4bis : tirage par habitant vivant, poids par ville
candidate) compte pour ≈ **209 ms** isolés (3 appels, moyenne) — le reste de la
croissance vient des lois ajoutées sur les chemins chauds (domiciles/bonheur,
lois d'habitant par culture, détails de gains par ressource).

Pas d'action proposée : le bandeau « ⏳ Calcul du tour… » (F4) tient le
signalement utilisateur, la partie en ligne est très loin de 16k habitants, et
la CI du moteur reste verte. À re-bencher à la prochaine grosse vague moteur ; si le
temps double encore, un profilage des `detailGainsVille`/`attribuerDomicilesVille`
sera le premier réflexe.

## Micro-constats

- **a1** — `malusFerveurMartiale` (engine/garnisons.ts) fait `return` à la
  PREMIÈRE culture du référentiel portant `garnisonHorsCultureParRang` et
  présente dans le monde : deux cultures martiales distinctes ne cumuleraient
  pas, seule la première (ordre du référentiel) s'appliquerait. Conforme à
  l'arbitrage du 27/10 (une seule culture concernée : Zélotisme, « appliqué
  UNE fois par habitation, sans cumul si plusieurs villes zélotistes ») ;
  le docblock le documente déjà. **CORRIGÉ le 30/10 (`2dc36c6e`, arbitrage
  Thibaut « corrige les mineurs a1 et a2 »)** : chaque culture martiale
  présente applique SA loi — une fois par habitation ET par culture ; une
  habitation d'une culture martiale est protégée de SA loi mais subit
  celle des autres cultures martiales présentes ; à une seule culture
  (Zélotisme, l'état actuel du jeu) le comportement est INCHANGÉ (test
  avec une 2e culture martiale injectée au référentiel).
- **a2** — `recruitForArmies` recrute « tant que puissance < cible » : le
  dernier soldat fait franchir la cible (ex. 40 → 55 pour une cible à 50,
  Soldat = 15 pts). Le soldat étant indivisible, c'est cohérent avec le
  modèle « la puissance stockée fait foi » ; aucun clamp `min(cible)` posé.
  Const sans action. **CORRIGÉ le 30/10 (`d59383f9`, arbitrage Thibaut)** :
  la recrue n'est engagée que si ses points TIENNENT dans la cible
  (`while puissance + ptsSoldat <= cible`) — plus de dépassement ; le Soldat
  étant indivisible, une armée peut rester juste SOUS la cible si l'écart
  restant est inférieur aux points du Soldat ; à écart multiple des points
  du Soldat (levée, renfort, pertes — alignés par construction), le
  comportement est inchangé.
- **a3** — `AGENTS.md` annonçait « tests natifs (157) + tests de rendu
  (12 fichiers, 15 tests) » : la réalité de la tête est **254 natifs**
  (vérifiés au rejeu : engine + rules + config + state + supabase) et
  **12 fichiers / 21 tests de rendu**. Compteurs corrigés dans le même commit
  docs que ce rapport (la dérive avait déjà été notée au journal le
  2026-10-25 — c'est la 2e fois ; les compteurs dans AGENTS.md devraient
  suivre chaque vague de tests).

## ✅ Points forts (à préserver)

- **La refonte « 8 lois » est exemplaire d'architecture** : chaque loi vit
  dans le MOTEUR là où elle agit (prixArmee, consoNourrHabitant, bonusBonheur,
  multDepart, tribut, bonheur), la voie banque est fermée proprement (source
  `regime` retirée du registre, 84 → 83 règles, canal renommé « Lois des
  cultures » avec repli `loisCultures ?? regimesCultures ?? {}` pour les vieux
  historiques) — aucun double comptage possible entre banque et moteur.
- **La mémoire des arbitrages est intacte** : chaque REMPLACÉ/RETRAIT daté
  in situ (recomputeArmy, prochaineArmeeReduite, merveilles, migration
  scolaire, lois d'habitant), y compris les abandons de modèle du matin au
  profit des retours du soir (dérivation armée → stockée fait foi ;
  pondération multiplicative → additive v3). Relire les docblocks a suffi
  à re-vérifier chaque arbitrage sans ouvrir l'historique git.
- **Multijoueur durci comme arbitré** : m1 (`avecReprise` pur, 2 essais,
  `dejaPublie` = verdict définitif, `AbortSignal.timeout(60_000)`) et m2
  (joueur inconnu ignoré AVANT toute application, journal visible) sont
  appliqués, testés, et le garde m2 vit dans le module partagé client +
  Edge Function.
- **Le harnais local suit** : les 9 nouveaux fichiers de tests depuis la
  base (armees, cultures, habitations, migrationBonheur, population, regimes,
  taxes, reprise + reprise.test) couvrent précisément les nouveaux arbitrages,
  et le diag est resté stable (14 lignes [ÉCHEC] informatives identiques,
  seuls les changements légitimes RNG/registre documentés au journal).
- **Migrations de config à drapeaux ciblés** (`armeesBanque2026`, patron
  `taxes25`) sans bump de `SCHEMA_VERSION_CONFIG` : les configs convergées
  de Thibaut ne rejouent pas les migrations, les valeurs personnalisées sont
  conservées — pattern constant et sûr.

## 📋 Plan d'action

| # | Action | Qui | Statut |
|---|--------|-----|--------|
| 0 | A0 : corriger le test de rendu ArmiesPanel (prix calculé comme le panneau) | IA | ✅ corrigé ce jour (`a1523107`) — urgence CI |
| 1 | A1 : compléter `p.armees` dans `normaliserEtat` + test de non-régression | IA | 🔵 arbitré Thibaut 30/10 : refusé — vieilles sauvegardes obsolètes, supprimées localement |
| 2 | a3 : compteurs AGENTS.md (254 natifs / 21 rendu) | IA | ✅ corrigé ce jour |
| 3 | A2 : re-bench 16k à la prochaine grosse vague moteur | IA | ⏳ surveillance |
| 4 | a1 : rediscuter le malus si une 2e culture martiale arrive | IA/Thibaut | ✅ corrigé ce jour (`2dc36c6e`) — toutes les cultures martiales s'appliquent |
| 5 | a2 : le dernier recrutement ne franchit plus la cible | IA | ✅ corrigé ce jour (`d59383f9`) — recrue engagée seulement si elle tient dans la cible |

## Validation

- **254/254 tests natifs** rejoués en local (moteur, règles, config, état,
  supabase — harnais `node --experimental-strip-types` + loader du dépôt,
  identique à la CI pour le bundle moteur). Les tests de rendu UI
  (12 fichiers / 21 tests, nécessitent React) : la CI de la tête `849d64c2`
  était ROUGE sur ce lot (constat A0 ci-dessus) ; ils sont désormais rejoués
  **EN LOCAL** grâce au harnais de rendu reconstruit (cf. A0) — **21/21
  verts** après correctif, avec le correctif poussé (`a1523107`) la CI jeu
  est revenue au vert sur la tête corrigée.
- `scripts/diag.ts` rejoué : **IDENTIQUE** à `diag-out.txt` de la tête
  (14 lignes [ÉCHEC] informatives attendues, aucune dérive).
- Bench scalabilité 16k : cf. A2. Repro A1 : cf. section A1.
- Sync v4 du jour vérifiée par tarball + `diff -rq` : `src/` et `supabase/`
  **byte-identiques** entre les deux branches (158/158), déploiement Pages
  v4 SUCCESS (run #1585, `e03a6deb`), site et jeu live répondent 200.
