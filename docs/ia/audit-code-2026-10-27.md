# Audit du code — 2026-10-27 (couche multijoueur v2 + store React, F1-F6)

Deuxième audit complet du code du jeu « Chasse & Pêche » (dépôt `losth230/quartz`,
branche `chasse-et-peche-web`), réalisé le 27/10/2026 sur la tête `fed35f5e` (12:06).
Il complète l'audit du 2026-10-19 (celui-ci reste la référence pour les problèmes
de l'époque) et se concentre sur ce qui a changé depuis : le protocole multijoueur
v2 (sections append-only, barrière, Edge Function `resoudre-tour`), le store React
et la boucle de fin de tour côté client.

**Périmètre** : store (`src/state/store.tsx`), multijoueur v2 (fusion, upsert
`pousserSectionV2`, barrière), Edge Function, schéma SQL Supabase, UI de fin de
tour et d'import de config, génération de code de salon.
**Méthode** : revue statique + **test en conditions réelles** sur un salon jetable
(`audit-test-jet`, nettoyé après) contre le projet Supabase de production. Aucune
écriture sur la partie en ligne (salon `chasse-peche`), aucune écriture dans la
config mondiale `__config__`.

**Décision Thibaut après remise du rapport** : « applique F2 à F6 et verse le
rapport ». C'est fait — chaque constat ci-dessous porte son statut. F1 exige une
action manuelle de Thibaut (SQL ci-dessous).

## Statut des constats

| Réf | Problème | Statut |
|-----|----------|--------|
| F1 | `cp_events` : pas de policy UPDATE → l'upsert de `pousserSectionV2` échoue (42501) en production | 🟠 **confirmé en test réel** ; correctif versé dans `schema-v2.sql` §7 — **SQL à coller par Thibaut** (voir ci-dessous) |
| F2 | Le code de salon est le seul secret (RLS `anon` ouverte, pas d'auth) ; codes courts devinables | ✅ appliqué — générateur de code (16 car. sans ambigus) + bouton 🎲 + aide + README + test |
| F3 | `pendingMutators` : file morte jamais rejouée + effets de bord (`persist`, `pousserSectionV2`) DANS le updater `setState` (StrictMode) | ✅ appliqué — file retirée, `update()` réécrit hors du updater, clone sélectif `clonerEtat` |
| F4 | `runTurn` local : 1,7-3,2 s à 16k habitants, UI gelée sans signal | ✅ appliqué — état `calculTour` + bandeau « ⏳ Calcul du tour en cours… » + bouton verrouillé |
| F5 | Commentaire mensonger dans `gardeFous` (« suppressions persiste » alors que le code ré-ajoute les constructions du référentiel) | ✅ appliqué — commentaire corrigé (comportement inchangé, verrouillé par tests) |
| F6 | Import JSON de config non validé en forme (`JSON.parse as GameConfig`) → crash UI possible après un import « réussi » | ✅ appliqué — `validerFormeConfig()` + rejet « Import refusé — … » + test |
| m1 | `resoudreTourServeur` : `fetch` sans timeout | 📝 documenté, non traité (décision à prendre) |
| m2 | `fusionnerSections` accepte des sections de joueurs inconnus | 📝 documenté, non traité (décision à prendre) |

## F1 — `cp_events` : pas de policy UPDATE, l'upsert échoue en production 🟠

**Confirmé en conditions réelles** (pas seulement en lecture de code) : sur le
salon jetable `audit-test-jet`, l'upsert `INSERT … ON CONFLICT (salon, joueur,
tour) DO UPDATE` de `pousserSectionV2` reçoit systématiquement

```
{ code: '42501', message: 'new row violates row-level security policy for table "cp_events"' }
```

Cause : `schema-v2.sql` ne crée que des policies `INSERT`/`SELECT`/`DELETE` sur
`cp_events` — pas de policy `UPDATE`. Or l'option `DO UPDATE` d'un upsert exige
le privilège UPDATE sur la ligne en conflit. Conséquence de bord : le repli
`delete` + `insert` du client joue donc à CHAQUE édition de section déjà posée —
la voie rapide n'a jamais fonctionné en production. La barrière et la publication
de tour ne sont pas touchées (elles utilisent la table `cp_tours`).

**Correctif** (versé dans `schema-v2.sql`, §7, avec la note d'installation) :

```sql
drop policy if exists "cp_events maj" on public.cp_events;
create policy "cp_events maj" on public.cp_events for update to anon
  using (true) with check (true);
```

⚠ **INSTALLATION EXISTANTE** : le schéma de la base en ligne date d'avant ce §7 ;
Thibaut doit coller ce bloc une fois dans l'éditeur SQL de Supabase (le dépôt ne
peut pas l'appliquer à la place). Sans cette action, le repli `delete+insert`
continue de fonctionner (le bug n'est pas bloquant, il dégrade seulement la voie
rapide). Je ne peux pas écrire dans la base en ligne moi-même.

## F2 — Le code de salon est le seul secret ✅ (appliqué)

Constat : la RLS est volontairement ouverte à `anon` (modèle « amis de confiance »
arbitré à l'audit du 19/10, toujours assumé) et il n'y a pas de compte joueur.
Conséquence : **quiconque connaît l'URL publique et le code du salon peut**
rejoindre la partie, pousser une section au nom de n'importe quel n° de joueur,
publier dans la config mondiale `__config__`, ou forcer la résolution du tour à
distance. Le code du salon est donc le seul secret — et les codes courts ou
devinables (« chasse-peche », prénoms…) se forcent à la main.

Appliqué (mitigation, sans changer le modèle assumé) :

- `SetupPanel.tsx` : `genererCodeSalon()` — 16 caractères tirés dans un alphabet
  sans ambigus (I, O, l, 0, 1 exclus) ; bouton « 🎲 Générer un code » à côté du
  champ (nouvelle campagne) ; texte d'aide étendu : le code est le seul secret de
  la partie, préférez un code généré.
- `README.md` : même recommandation au § multijoueur.
- `SetupPanel.test.ts` : test pur (50 tirages : longueur 16, alphabet sans
  ambigus, quasi-unicité).
- **Volontairement conservé** : le remplissage par défaut `'chasse-peche'` du
  champ (salon live de Thibaut — c'est un rabattage de saisie, pas une
  recommandation de sécurité).

Non couvert (assumé, hors périmètre du jour) : un attaquant qui CONNAÎT déjà le
code garde tous ses pouvoirs — seule la génération de codes longs rend le
devinement impraticable. L'authentification resterait le vrai verrou si le cercle
des joueurs s'élargit.

## F3 — `pendingMutators` : file morte + effets de bord dans le updater ✅ (appliqué)

Deux défauts dans `store.tsx` :

1. `pendingMutators` était une file de mutators accumulée pendant la résolution
   multijoueur **sans être rejouée nulle part** — du code mort avec une
   apparence de fonctionnalité.
2. `update()` exécutait `persist()` et `pousserSectionV2()` **dans** le updater
   passé à `setState` : effets de bord dans une fonction de rendu, double appel
   garanti en `StrictMode` (upsert réseau ×2), pattern React interdit.

Appliqué :

- File `pendingMutators` supprimée (déclaration + les 3 boucles qui la
  remplissaient) — commentaire « RETRAIT 2026-10-27 audit F3 » in situ.
- Helper module `clonerEtat(prev)` : clone sélectif de l'historique (tours,
  sous-tours, journaux) — pas de `structuredClone` global sur des états lourds.
- `update()` réécrit HORS du updater : base = `stateRef.current`, `setState(draft)`
  puis `persist(draft)` et `pousserSectionV2(draft)` APRÈS — plus d'effet de bord
  dans le rendu, StrictMode devient inoffensif.

## F4 — `runTurn` local : 1,7-3,2 s à 16k habitants ✅ (appliqué)

Rejoué le jour même : `scripts/bench-scalabilite.ts` mesure 1,7 s à 16k
habitants et ~3,2 s avec les traits/cultures actifs sur de grosses villes.
C'est un temps d'UI gelée SANS signal pendant le tour local (`nextTurn`,
`resoudreSeul`, `resoudreBarriereLocaleV2`).

Appliqué : nouvel état `calculTour` dans le `GameContextValue` ; bandeau
« ⏳ Calcul du tour en cours… » dans `TurnBar` ; bouton « Tour suivant »
désactivé + libellé « ⏳ Calcul… » pendant le calcul ; `setCalculTour(true)`
suivi d'un yield (30 ms) AVANT `runTurn` pour laisser le navigateur peindre le
bandeau ; `try/finally` partout (le drapeau retombe même en erreur).

## F5 — Commentaire mensonger dans `gardeFous` ✅ (appliqué)

Le commentaire de `gardeFous` (defaultConfig.ts) affirmait que les
« suppressions [de constructions] persiste[nt] » — or le code ré-ajoute les
constructions du référentiel manquantes. C'est le comportement VOULU (le
référentiel est la donnée de référence, seules les éditions/perso persistent),
verrouillé par tests. Seul le commentaire était faux → corrigé. Aucun
changement de comportement.

## F6 — Import JSON de config non validé ✅ (appliqué)

L'onglet Paramètres importait `JSON.parse(text) as GameConfig` sans vérifier la
forme : `{"constructions": 42}` passait l'import et cassait l'UI au premier
rendu (`.map` sur un nombre). Appliqué :

- `defaultConfig.ts` : `export function validerFormeConfig(c: unknown): string[]`
  — les tables connues (`constructions`, `traits`, `cultures`, `regimes`,
  `typesHabitation`, `paysRangs`, `victoires`, `peuplesLibres`, `peuplesAutres`,
  `metiers`) doivent être des tableaux SI présentes ; `params` doit être un
  objet ; un non-objet est refusé d'office. Message par champ fautif.
- `ParamsPanel.tsx` : rejet avant `setCfg` — « Import refusé — … ».
- `state/config.test.ts` : test (config saine acceptée, `constructions: 42` et
  `params` string refusés, pas de faux positif sur les tables valides).

## Micro-constats (documentés, non traités — décision à prendre)

- **m1** : `resoudreTourServeur` fait un `fetch` sans timeout ; une Edge Function
  lente laisse le client indéfiniment en attente. Un `AbortSignal.timeout(…)`
  réglerait ça proprement.
- **m2** : `fusionnerSections` accepte des sections pour des n° de joueurs
  inconnus du setup (aucune validation du numéro). Impact faible en jeu entre
  amis ; à coupler avec une future validation plus stricte si le modèle
  « amis de confiance » évolue.

## ✅ Points forts (à préserver)

- Le repli `delete+insert` de `pousserSectionV2` a fait son office pendant des
  semaines alors que la voie rapide (upsert) était cassée en production —
  l'architecture défensive paie (même constat que l'audit du 19/10).
- Moteur pur déterministe (`runTurn` sans React) : le bench et le diag se
  rejouent à l'identique, le diag de ce jour n'a pas bougé d'une ligne malgré
  les refontes du store (190 tests natifs verts, diag IDENTIQUE).
- Docblocks-mémoire : chaque arbitrage du 19/10 retrouvé in situ pendant la
  revue — ils ont directement guidé les correctifs F2 (modèle « amis de
  confiance » assumé) et F5.
- Le CAS sur `tour_publie` (Edge Function) et la barrière v2 n'ont aucun défaut
  de concurrence identifié malgré reprise ligne à ligne.

## 📋 Plan d'action

| # | Action | Qui | Statut |
|---|--------|-----|--------|
| 1 | F2-F6 appliqués + rapport versé + journal | IA | ✅ ce jour |
| 2 | Coller le bloc SQL du §7 (policy UPDATE `cp_events`) dans l'éditeur SQL Supabase | **Thibaut** | ⏳ en attente |
| 3 | m1 : timeout sur `resoudreTourServeur` | à arbitrer | 📝 |
| 4 | m2 : sections de joueurs inconnus dans `fusionnerSections` | à arbitrer | 📝 |

## Validation

- 190/190 tests natifs verts (189 + 1 nouveau test F6) — harnais local
  `node --experimental-strip-types`, identique à la CI.
- +1 test de rendu F2 (`SetupPanel.test.ts` : 21 attendus en CI, tests de
  rendu couverts par `npm test`).
- `scripts/diag.ts` rejoué : **IDENTIQUE** à `diag-out.txt` (aucune modification
  du moteur, comme attendu — F2-F6 ne touchent que store/UI/config).
- Balance JSX vérifiée sur les 4 fichiers .tsx modifiés (harnais dédié) ;
  ParamsPanel/SetupPanel portent deux artefacts préexistants du harnais,
  identiques base ↔ modifiés.
