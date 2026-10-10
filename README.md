# 🐗 Chasse & Pêche — Légendes (version web)

Portage **React + TypeScript + Supabase** du jeu de grande stratégie **Chasse & Pêche**
(classeur Excel « Chasse ^LLL0 Peche Legendes 7.19 » + macros VBA + livret de règles).
8 joueurs, un tour = 2 ans de temps de jeu, comme dans le classeur d'origine.

> 📌 Ce dossier est publié sur la branche **`chasse-et-peche-web`** du repo
> `losth230/quartz` (la branche `v4` du générateur de site Quartz n'est pas touchée),
> et également sur `losth230/Chasse-et-Peche` (main).

---

## 1. Lancer le jeu

```bash
npm install
npm run dev        # http://localhost:5173
```

Autres commandes :

```bash
npm run build      # build de production (tsc + vite)
npm run preview    # sert le build
npm run docx       # régénère docs/Chasse-et-Peche-Livret-numerique.docx (Python 3, sans dépendance)
```

### Mode multijoueur (Supabase)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Exécutez `supabase/schema.sql` dans le **SQL Editor** (table `parties` + RLS ouverte + realtime).
3. Copiez `.env.example` en `.env` et renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
4. Relancez `npm run dev`, choisissez « Multijoueur Supabase » dans **⚙ Nouvelle partie**
   et entrez un code de salon partagé entre les 8 joueurs.

Sans clés Supabase, l'application tourne **entièrement en local** (localStorage, export/import JSON) :
idéal pour jouer à 8 sur le même écran (hotseat). Il n'y a **pas d'authentification** :
tous les joueurs accèdent à la même partie par le code du salon (RLS anon ouverte).

---

## 2. Ce qui est porté du classeur

| Classeur Excel / VBA | Portage TypeScript |
|---|---|
| Macro `FinDeTour` (ressources, saisons, événements, cartes dynastie) | `src/engine/engine.ts` → `runTurn()` |
| Macro `PersonnagesPourJoueur` (population complète) | `src/engine/engine.ts` → `populationTurn()` |
| Mariages (`ComputeMarriageProbability`), toutes les pondérations | `computeMarriageProbability()` — formules identiques |
| Grossesses/naissances (jumeaux 5 %, triplés 0,1 %, adultère 3 %, consanguinité, traits) | `conceptionEtNaissances()`, `inheritTraits()`, `computeBabyDynasty()` |
| Maladies (proba, guérison, bâtiments de santé, grossesse perdue) | `maladieStep()` — constantes VBA exactes |
| Écoles & Professeurs (`MaybeAssignProfesseursInCities`, `TryEducateMinor`) | `maybeAssignProfesseurs()`, `tryEducateMinor()` |
| Succession du Dirigeant (Héritier → noble → crise) | `handleDirigeantSuccession()` |
| Influence culturelle (pression touristique + présence locale) | `applyCultureInfluence()`, `updateCityCultures()` |
| Migration des enfants sans éducation (10 %/tour) | `migrerEnfants()` |
| Taxes par ville (`TAX_OR_FAIBLES`… `TAX_NAISS_HAUTES`) | `calculerGainsPopulation()`, `taxBirthFactor()` |
| `RecruitForArmies`, `LeverArmee`, `RetirerArmee` (Général 45, Soldat 15) | `recruitForArmies()` + onglet Armées |
| `ValidateTitleAssignment` (frmAttribuerTitre) | `src/engine/validation.ts` |
| `GenererPopulationInitiale` (frmInitPop, couple royal) | `src/engine/setup.ts` |
| `SnapshotRessources` (_Historique) + graphiques | `snapshotRessources()` + onglet Historique (SVG) |
| `WriteRecapA3` (J{n}!A35) | `writeRecap()` + récap par joueur |
| **27 feuilles du classeur** (Titres, traits_genetiques, params_culture, BDD_pop, JSON événements, bâtiments, aménagements, maladies, offrandes, dogmes, ministères, crises, victoires…) | **données réelles intégrées** dans `src/config/referentiels.json` (≈126 Ko), normalisées par `src/config/defaultConfig.ts` |
| Constantes et formules VBA (taux, seuils, pondérations) | `src/config/params.ts` (~63 paramètres nommés, valeurs VBA exactes) |
| `Rnd()` (non déterministe) | RNG mulberry32 **déterministe** (graine rejouable) |

---

## 3. Interface

8 sections : **Accueil** (tableau de bord 8 joueurs + conditions de victoire ch. XII),
**Pays** (ressources, villes, taxes, bâtiments, récap), **Population** (filtres, tri,
attribution de titres avec toutes les règles VBA), **Armées** (lever, commandant, cible,
dissolution), **Journal** (tout l'historique des événements), **Historique** (courbes SVG),
**🎛 Paramètres** (éditeur complet du jeu, voir §4), **Référentiels** (16 onglets : fiches
réelles du classeur en consultation), **⚙ Nouvelle partie** (8 joueurs, graine, mode).

---

## 4. Tout est paramétrable — aucune contrainte bloquante

Le cahier des charges : **toutes les variables (constantes et formules) modifiables à
volonté par n'importe qui, chaque joueur peut toucher à ses stocks et productions à tout
moment, aucune contrainte bloquante.**

- **🎛 Onglet « Paramètres »** : 15 onglets d'édition en direct — formules du moteur
  (naissance, mortalité, mariages, maladies, taxes, migration, armées…), titres, traits,
  cultures, régimes, événements et leurs effets chiffrés, cartes dynastie, maladies,
  offrandes, probabilités, peuples & noms, ressources/éducations, plus un onglet
  **JSON export/import/reset** pour sauvegarder, partager ou restaurer une configuration.
- **Aucune validation bloquante** : les contrôles d'attribution de titres
  (`ValidateTitleAssignment`) ne produisent que des **avertissements** — le titre est
  toujours appliqué si vous confirmez. Chaque joueur peut modifier **à tout moment**
  ses stocks, ses productions, ses impôts et ses bâtiments dans l'onglet **Pays**.
- **Chaud** : les modifications prennent effet au tour suivant, sans recharger la partie.
  Les données de référence sont éditables directement dans `src/config/referentiels.json`
  (JSON lisible), les formules dans `src/config/params.ts`, la normalisation dans
  `src/config/defaultConfig.ts`.

---

## 5. VBA de référence & livret

- `vba/Personnages.vba` — module « Personnages » complet (3 604 lignes) : source du portage.
- `vba/FinDeTour-et-gains-population.vba` — `FinDeTour`, `SnapshotRessources`,
  `CalculerGainsPopulation` et les versions retravaillées (traits, taxes, migration).
- `docs/Chasse-et-Peche-Livret-numerique.docx` — livret numérique regénérable via
  `npm run docx` (script `scripts/make_docx.py`, Python 3 standard, aucune dépendance ;
  écrit un DOCX OOXML minimal). Le DOCX n'est pas versionné en binaire ici :
  `make_docx.py` le régénère à l'identique.

---

## 6. Limites connues

1. **Nourriture négative** : fidèle au classeur — la production de départ est nulle et
   chaque habitant vivant consomme 1 Nourriture/tour. Ajoutez des Fermiers, des Chasseurs
   ou de la production dans l'onglet Pays pour équilibrer (les stocks sont modifiables
   à tout moment).
2. `Evenement` : comme dans le VBA, la dangerosité est `1d6 + modDanger`
   (≤5 faible · 6-8 moyenne · 9-10 forte · 11+ extrême).
3. Les points d'attention documentés du VBA (double compteur de tour, `totalProb`,
   code mort de l'éducation à la naissance) sont corrigés par construction dans le portage :
   un seul compteur (`GameState.turn`), tirage pondéré cohérent.
4. Les effets d'événements et de cartes dynastie sont **chiffrés d'après le livret et le
   classeur** ; toute valeur peut être corrigée dans l'onglet 🎛 Paramètres.

---

## 7. Structure

```
src/
  config/     params.ts (formules/constantes VBA), defaultConfig.ts (référentiels normalisés),
              referentiels.json (données réelles des 27 feuilles du classeur)
  engine/     types, rng, gameData/gameData2 (exports dérivés de la config), engine (VBA porté),
              setup, validation, victory
  state/      store React (local/supabase + realtime), storage (localStorage)
  components/ UI : Dashboard, PlayerView, PopulationTable, ArmiesPanel, EventLog,
              HistoryPanel (SVG), SetupPanel, ParamsPanel (éditeur complet), 
              ReferenceDataPanel (consultation), TurnBar, ui
  supabase/   client (table parties, realtime)
supabase/     schema.sql (table, RLS anon, publication realtime)
scripts/      make_docx.py (livret DOCX)
vba/          code VBA original de référence
docs/         livret DOCX (régénérable)
```

---

## 8. Suppression / réinitialisation

Le bouton ✕ de la barre de tour efface la sauvegarde locale. En mode Supabase,
supprimez la ligne du salon dans la table `parties` (ou `TRUNCATE parties`).
L'onglet 🎛 Paramètres contient un bouton de réinitialisation de la configuration
(retour aux valeurs par défaut du classeur).
