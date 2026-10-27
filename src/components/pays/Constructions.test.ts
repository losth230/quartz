// ═══════════════════════════════════════════════════════════════════════════
//  TESTS CONSTRUCTIONS — AMÉLIORATIONS D'AMÉNAGEMENTS tiers 2/3
//  (vague 3c, arbitrage Thibaut 2026-10-22) :
//   · un aménagement de tier 2 (coût uniforme « 15 Or + 3 Pierre »)
//     REMPLACE une instance du tier 1 dans ville.amenagements ; le
//     tier 3 (« 35 Or + 3 Fer ») remplace le tier 2 — l'amélioration
//     n'est PAS une construction en plus ;
//   · rang d'habitation minimum : tier 2 → rang 2 (Cité/Donjon),
//     tier 3 → rang 3 (Grande Cité/Forteresse) — garde-fou NON
//     BLOQUANT (⚠ dans le log, même calibre que les rangs des
//     bâtiments : « la vue filtre, ce garde-fou couvre les états
//     importés/rebasés ») ;
//   · tier inférieur ABSENT de la ville → ⚠ + amélioration quand
//     même enregistrée (poussée) — le moteur n'est jamais bloquant.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from '../../engine/setup'
import { cfgOf } from '../../engine/gameData'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

function partie() {
  return createGame(SETUP, 20261022, 'local')
}

/** Fabrique construire branchée sur l'état (comme le fait VilleCarte
 *  via useGame().update). */
async function construireDe(state: ReturnType<typeof partie>) {
  const { faireConstruire } = await import('./Constructions')
  const C = cfgOf(state.config)
  C.config.constructions.push(...TIERS_23)
  const p = state.players[0]
  return faireConstruire({
    update: (m) => m(state),
    joueur: p.n,
    C,
  })
}

/** Simplification (retour Thibaut 2026-10-23) : les aménagements de
 *  rang 2+ (tiers 2/3) sont retirés du RÉFÉRENTIEL et cfgOf FILTRE
 *  désormais les constructions rang ≥ 2 des configs convergées
 *  (retrait des « Moulin à vent » des configs monde sauvegardées) —
 *  mais la mécanique d'amélioration (remplaceAmenagement) reste en
 *  place, prête à les recevoir à leur retour. Les defs tier sont
 *  réinjectées APRÈS convergence (dans C.config, une fois cfgOf
 *  passé — forme exacte de l'ancien référentiel). */
const TIERS_23 = [
  // (retour Thibaut 2026-10-27 : les coûts sont des DONNÉES structurées
  //  `couts` — paires {ressource, valeur} — plus de texte à analyser)
  { categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Baleinier (tier 2)',
    terrain: 'Baleine', couts: [{ ressource: 'Or', valeur: 15 }, { ressource: 'Pierre', valeur: 3 }],
    effets: [], rangMinHabitation: 2, remplaceAmenagement: 'Baleinier',
    emplacements: [{ metier: 'Pêcheur', places: 5 }, { metier: 'Commerçant', places: 5 }] },
  { categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Baleinier (tier 3)',
    terrain: 'Baleine', couts: [{ ressource: 'Or', valeur: 35 }, { ressource: 'Fer', valeur: 3 }],
    effets: [], rangMinHabitation: 3, remplaceAmenagement: 'Baleinier (tier 2)',
    emplacements: [{ metier: 'Pêcheur', places: 7 }, { metier: 'Commerçant', places: 10 }] },
]

test('vague 3c : « Baleinier (tier 2) » REMPLACE le Baleinier de la ville et débite 15 Or + 3 Pierre', async () => {
  const state = partie()
  const p = state.players[0]
  const ville = p.villes[0]
  ville.type = 'Ville'
  ville.rang = 'Cité' // rang 2 : pas de ⚠ de rang d'habitation
  ville.amenagements = ['Baleinier', 'Champ']
  p.resources['Or'].stock = 100
  p.resources['Pierre'].stock = 10
  const construire = await construireDe(state)
  construire(0, 'Baleinier (tier 2)', 'amenagement')
  assert.deepEqual(ville.amenagements, ['Baleinier (tier 2)', 'Champ'],
    'le tier 1 est remplacé EN PLACE (pas ajouté à la fin)')
  assert.equal(100 - p.resources['Or'].stock, 15, 'coût du tier 2 : 15 Or débités')
  assert.equal(10 - p.resources['Pierre'].stock, 3, 'coût du tier 2 : 3 Pierre débitées')
  assert.ok(state.log.some((l) => l.texte.includes('Baleinier amélioré(e) en Baleinier (tier 2)')),
    'log : « 🏗 Baleinier amélioré(e) en Baleinier (tier 2) »')
  assert.ok(!state.log.some((l) => l.texte.startsWith('⚠') && l.texte.includes('rang 2 minimum')),
    'rang 2 atteint (Cité) : pas de ⚠ de rang')
})

test('vague 3c : « Baleinier (tier 3) » remplace le tier 2 et débite 35 Or + 3 Fer', async () => {
  const state = partie()
  const p = state.players[0]
  const ville = p.villes[0]
  ville.type = 'Ville'
  ville.rang = 'Grande Cité' // rang 3
  ville.amenagements = ['Baleinier (tier 2)', 'Scierie']
  p.resources['Or'].stock = 100
  p.resources['Fer'].stock = 10
  const construire = await construireDe(state)
  construire(0, 'Baleinier (tier 3)', 'amenagement')
  assert.deepEqual(ville.amenagements, ['Baleinier (tier 3)', 'Scierie'],
    'le tier 2 est remplacé en place')
  assert.equal(100 - p.resources['Or'].stock, 35, 'coût du tier 3 : 35 Or débités')
  assert.equal(10 - p.resources['Fer'].stock, 3, 'coût du tier 3 : 3 Fer débités')
})

test('vague 3c : garde-fous NON BLOQUANTS — rang insuffisant ⚠, tier inférieur absent ⚠ (mais enregistré)', async () => {
  const state = partie()
  const p = state.players[0]
  const ville = p.villes[0]
  ville.type = 'Ville'
  ville.rang = 'Hameau' // rang 1 : le tier 2 exige le rang 2
  ville.amenagements = [] // et aucun Baleinier !
  p.resources['Or'].stock = 100
  p.resources['Pierre'].stock = 10
  const construire = await construireDe(state)
  construire(0, 'Baleinier (tier 2)', 'amenagement')
  assert.deepEqual(ville.amenagements, ['Baleinier (tier 2)'],
    'garde-fous non bloquants : l amélioration est quand même enregistrée (poussée)')
  assert.equal(100 - p.resources['Or'].stock, 15, 'le coût est quand même débité')
  assert.ok(state.log.some((l) => l.texte.includes('habitation de rang 2 minimum')),
    '⚠ rang : le tier 2 exige le rang 2')
  assert.ok(state.log.some((l) => l.texte.includes("améliore normalement d'abord un « Baleinier »")),
    '⚠ prérequis : le tier 1 doit être présent à la ville')
  assert.ok(!state.log.some((l) => l.texte.includes('amélioré(e) en Baleinier (tier 2)')),
    'sans remplacement effectif, le log dit « construit(e) », pas « amélioré(e) »')
})

test('retour Thibaut 2026-10-27 : textes vidés — le picker rend le résumé structuré et le coût calculé des DONNÉES', async () => {
  const state = partie()
  const { faireBatParFamille } = await import('./Constructions')
  const C = cfgOf(state.config)
  const p = state.players[0]
  const cats = faireBatParFamille({ state, p, C })(p.villes[0])
  assert.ok(cats.length > 0, 'aucune catégorie de construction pour la capitale')
  // Les TEXTES cout / production / description du référentiel sont VIDÉS
  //  (le coût vit dans `couts`, le prérequis dans `requis`, la production
  //  dans `effets`) — verrou sur TOUTE la table.
  const refsBatiments = (C.config.constructions ?? []).filter((c) => c.categorie === 'Bâtiment')
  assert.ok(refsBatiments.length > 30, 'référentiel bâtiments attendu')
  for (const ref of refsBatiments) {
    assert.ok(!ref.cout && !ref.production && !ref.description,
      `« ${ref.nom} » : les textes cout/production/description doivent être vidés`)
  }
  // Le résumé structuré reste rendu (ex. Poste de garde → « 4 garde »).
  const poste = cats.flatMap((c) => c.options).find((o) => o.metier === 'Poste de garde')
  assert.ok(poste, 'Poste de garde absent du picker de la capitale')
  assert.ok((poste.description ?? '').includes('4 garde'),
    'le résumé structuré des emplacements du Poste de garde doit rester rendu')
  // Le coût affiché est CALCULÉ depuis les données structurées (couts).
  assert.equal(poste.droite, '25 Or + 4 Fer',
    'coût du Poste de garde : lu des paires {ressource, valeur}, pas du texte')
})

// ── Retour Thibaut 2026-10-27 : « pour les aménagements, met la case
//    requise entre parenthèses dans le titre de l'aménagement » ──────

test('titre des aménagements : la case requise vit entre parenthèses (retour Thibaut 2026-10-27)', async () => {
  const { titreAmenagement } = await import('./pays-utils')
  // le titre affiché = « nom (case requise) », dans le picker « +
  //  Aménager une case… », le badge construit de la carte et le wiki
  assert.equal(titreAmenagement('Baleinier', 'Baleine'), 'Baleinier (Baleine)', 'tier 1')
  assert.equal(titreAmenagement('Champ', 'Plaine'), 'Champ (Plaine)', 'Champ')
  assert.equal(titreAmenagement('Scierie', 'Forêt'), 'Scierie (Forêt)', 'Scierie')
  // tiers 2/3 : les parenthèses viennent APRÈS le nom complet
  //  (« Baleinier (tier 2) (Baleine) », pas « Baleinier (Baleine) (tier 2) »)
  assert.equal(
    titreAmenagement('Baleinier (tier 2)', 'Baleine'),
    'Baleinier (tier 2) (Baleine)', 'tier 2 : parenthèses en fin de titre')
  // un aménagement PERSO sans case requise reste au titre nu
  assert.equal(titreAmenagement('Mon aménagement perso'), 'Mon aménagement perso',
    'sans terrain : titre nu (perso)')
  assert.equal(titreAmenagement('X', ''), 'X', 'terrain vide : titre nu')
  // Verrou référentiel : les aménagements du référentiel portent TOUS
  //  une case requise — le titre affiché a donc toujours ses
  //  parenthèses (les seuls titres nus sont les aménagements perso).
  const state = partie()
  const C = cfgOf(state.config)
  const amenagements = (C.config.constructions ?? []).filter((c) => c.categorie === 'Aménagement')
  assert.ok(amenagements.length > 0, 'référentiel aménagements attendu')
  for (const a of amenagements) {
    assert.ok(a.terrain, `« ${a.nom} » : case requise (terrain) absente du référentiel`)
    assert.ok(titreAmenagement(a.nom, a.terrain).endsWith(`(${a.terrain})`),
      `« ${a.nom} » : le titre doit finir par « (${a.terrain}) »`)
  }
})
