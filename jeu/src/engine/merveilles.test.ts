// ═══════════════════════════════════════════════════════════════════════════
//  TESTS MERVEILLES MONDIALES — les 11 fiches de Thibaut (2026-11-15)
//
//  Arbitrages actés :
//   · UNIQUES AU MONDE (1 seule, 1er construit gagne) : garde-fou
//     REFUSANT dans le mutateur de construction (components) —
//     verrouillé ici par merveilleConstruiteAilleurs (moteur) ;
//   · les merveilles se construisent dans TOUTE habitation selon le
//     tier de la fiche (rangMinHabitation 1/2/3) ;
//   · Pyramide des Xoltans : production des Bourgeois de LA VILLE ×2,
//     EN PLUS du multiplicateur de rang social (patron Guilde des
//     bourgeois, mais PAR VILLE) ;
//   · Sanctuaire de Salmodiva : Fermiers +2 Nourriture par tour en
//     ÉTÉ (drapeau `ete`, patron champsNourriciers) ;
//   · Laboratoire de Falheim : part de taxe Science des Professeurs
//     de LA VILLE +10 % (additive, cumul Guilde des savants) ;
//   · Tour de Crystal : dogme HORS PALIER au CONSTRUCTEUR à la
//     construction + ancrage des habitants ×1,1 (arbitrage « chances
//     de conversion réduites de 10 % ») ;
//   · Antichambre d'Alexandrie : +1 route commerciale, et les FLUX
//     copiés par les routes ×2 (emplacements au NOMINAL) ;
//   · Antre de la déesse araignée : +5 émissaires ;
//   · Ordre des chevaliers du Notan : l'attaque (garnison −50) est
//     un effet de PLATEAU (effetPlateau, affichage seul — aucun test
//     moteur).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, City, GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { cloneDefaultConfig, cfgOf as cfgOfConfig } from '../config/defaultConfig'
import {
  merveilleConstruiteAilleurs, emissairesConstructionsJoueur,
  multProductionBourgeoisVille, bonusMetierParHabitantVille,
  scienceProfesseurPlusVille, ancrageConversionMultVille,
} from './batiments'
import { detailGainsVille } from './economie'
import { effetsCommerceJoueur, detailCommerceJoueur, maxRoutesJoueur, creerRouteCommerce } from './commerce'
import { applyCultureInfluence } from './culture'
import { emptyRecap } from './shared'
import { constructionRef, resumeConstruction, effetsConstructionRef, effetsEteConstructionRef, coutConstructionRef } from './constructions'
import { capMetierVille } from './metiers'
import { normaliserEtat } from './villes'
import {
  accorderDogmeMerveille, dogmesBonusEnAttente, choisirDogmeMerveille,
  dogmesCulture, paliersDogmesEnAttente,
} from './dogmes'

/** Rng factice configurable (patron tier3.test.ts) — seule la face
 *  `chance` sert à la conversion ; le cast final évite d'implémenter
 *  les 8 faces de l'interface. */
function fakeRng(o: { chance?: (p: number) => boolean }): Rng {
  return { chance: o.chance ?? (() => false) } as unknown as Rng
}

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

function partie(): GameState {
  return createGame(SETUP, 20261115, 'local')
}

/** Ville de test avec les bâtiments donnés (patron tier3.test.ts). */
function villeTest(p: Player, batiments: string[]): City {
  return { ...p.villes[0], type: 'Ville', rang: 'Grande Cité', batiments, amenagements: [] }
}

/** Personnage de test complet (patron tier3.test.ts — tuples de 3
 *  traits pour la CI tsc strict), prestige paramétrable
 *  (150 = bourgeois pour la Culture Nordique, seuil 100). */
function perso(id: string, age: number, o: { metier?: string | null; ville?: string; prestige?: number; culture?: string } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'F', age,
    culture: o.culture ?? 'Culture Nordique', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Fécond', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
    prestige: o.prestige ?? 0,
  }
}

// ── 1. Référentiel : les 11 merveilles, tiers, coûts, textes vidés ────────

test('merveilles (référentiel) : 11 entrées famille Merveille — tiers 1/2/3, coûts structurés des fiches, textes vidés', () => {
  const C = cfgOf()
  const mers = C.config.constructions.filter((c) => (c.famille ?? '') === 'Merveille')
  assert.equal(mers.length, 11, '11 merveilles mondiales au référentiel')
  // tiers : 4 de tier 1, 2 de tier 2, 5 de tier 3
  const parRang = [1, 2, 3].map((r) => mers.filter((m) => m.rangMinHabitation === r).length)
  assert.deepEqual(parRang, [4, 2, 5],
    `répartition par tier : 4/2/5 attendu (obtenu ${parRang.join('/')})`)
  // toutes Bâtiment groupe Ville, textes VIDÉS (convention du référentiel)
  for (const m of mers) {
    assert.equal(m.categorie, 'Bâtiment', `${m.nom} : catégorie Bâtiment`)
    assert.equal(m.groupe, 'Ville', `${m.nom} : groupe Ville`)
    assert.equal(m.cout, '', `${m.nom} : texte de coût vidé`)
    assert.equal(m.production, '', `${m.nom} : texte de production vidé`)
    assert.equal(m.description, '', `${m.nom} : description vidée`)
    assert.ok((m.couts ?? []).length > 0, `${m.nom} : coûts structurés présents`)
  }
  // coûts de trois fiches, mot pour mot
  const couts = (nom: string) => constructionRef(nom, C.config, 'Ville')!.couts!
    .map((c) => `${c.ressource} ${c.valeur}`).sort().join(' + ')
  assert.equal(couts('Tour de Crystal'), 'Charbon 10 + Or 40', 'fiche : 40 Or + 10 Charbon')
  assert.equal(couts('Antichambre d’Alexandrie'), 'Or 120 + Pierre 50', 'fiche : 120 Or + 50 Pierres')
  assert.equal(couts('Pyramide des Xoltans'), 'Bois 60 + Or 100 + Pierre 30', 'fiche : 100 Or + 60 Bois + 30 Pierres')
  // canaux dédiés des fiches
  assert.equal(constructionRef('Pyramide des Xoltans', C.config, 'Ville')?.multProductionBourgeoisVille, 2,
    'Pyramide : production des Bourgeois de la ville ×2')
  assert.equal(constructionRef('Tour de Crystal', C.config, 'Ville')?.ancrageConversionMult, 1.1,
    'Tour de Crystal : ancrage ×1,1')
  assert.equal(constructionRef('Tour de Crystal', C.config, 'Ville')?.accordeDogme, true,
    'Tour de Crystal : accorde un dogme à la construction')
  assert.equal(constructionRef('Antichambre d’Alexandrie', C.config, 'Ville')?.multAmenagementsRoutes, 2,
    'Antichambre : aménagements des routes ×2')
  assert.equal(constructionRef('Antichambre d’Alexandrie', C.config, 'Ville')?.routesApportees, 1,
    'Antichambre : +1 route commerciale')
  assert.equal(constructionRef('Antre de la déesse araignée', C.config, 'Ville')?.emissairesApportes, 5,
    'Antre : +5 émissaires')
  assert.equal(constructionRef('Laboratoire de Falheim', C.config, 'Ville')?.scienceProfesseurPlusVille, 0.1,
    'Laboratoire : part Science des Professeurs +0,10')
  assert.equal(constructionRef('Ordre des chevaliers du Notan', C.config, 'Ville')?.reductionLeveeArmee, 50,
    'Ordre : levée d armée −50 Or')
  assert.ok(constructionRef('Ordre des chevaliers du Notan', C.config, 'Ville')?.effetPlateau?.includes('garnison de 50'),
    'Ordre : l attaque (garnison −50) vit en effet de PLATEAU (affichage seul)')
})

// ── 2. Convergence : les vieilles configs récupèrent les 11 ───────────────

test('merveilles (convergence) : une vieille config (v4) purge les 4 ANCIENNES merveilles et récupère les 11 nouvelles — idempotent', () => {
  const c = cloneDefaultConfig()
  c.schemaVersion = 4 // config sauvegardée avant le retour des merveilles
  // les 4 merveilles supprimées le 2026-10-27 traînent dans la
  //  sauvegarde (deux homonymes des nouvelles !)
  const merveillesVieilles = [
    'Sanctuaire de Salmodiva', 'Jardins d’Alexandrie', 'Mont Caracole', 'Grands bains',
  ].map((nom) => ({
    categorie: 'Bâtiment', groupe: 'Capitale', famille: 'Merveille',
    nom, cout: 'vieux', production: 'vieux', description: 'vieux',
    effets: [], rangMinHabitation: 1,
  })) as typeof c.constructions
  c.constructions.push(...merveillesVieilles)
  const C = cfgOfConfig(c)
  const mers = C.config.constructions.filter((x) => (x.famille ?? '') === 'Merveille')
  assert.equal(mers.length, 11, 'les 4 vieilles sont purgées, les 11 nouvelles sont là')
  assert.ok(!mers.some((m) => m.nom === 'Mont Caracole' || m.nom === 'Grands bains'),
    'les deux anciennes sans homonyme neuf ont disparu')
  assert.equal(mers.filter((m) => m.nom === 'Sanctuaire de Salmodiva').length, 1,
    'l homonyme neuf (Sanctuaire de Salmodiva) est là en UN exemplaire (groupe Ville)')
  assert.equal(mers.filter((m) => m.nom === 'Jardins d’Alexandrie').length, 1,
    'l homonyme neuf (Jardins d’Alexandrie) est là en UN exemplaire')
  for (const m of mers) {
    assert.equal(m.groupe, 'Ville', `${m.nom} : le neuf vient du référentiel (groupe Ville, pas Capitale)`)
    assert.equal(m.cout, '', `${m.nom} : textes du RÉFÉRENTIEL (le « vieux » a été purgé)`)
  }
  // idempotence : la re-lecture d une config convergée est stable
  const C2 = cfgOfConfig(C.config)
  assert.equal(C2.config.constructions.filter((x) => (x.famille ?? '') === 'Merveille').length, 11,
    're-lecture : toujours 11, pas de doublon')
})

// ── 3. Unicité mondiale : merveilleConstruiteAilleurs ──────────────────────

test('merveilleConstruiteAilleurs : null si nulle part ; trouvée chez un AUTRE joueur, une AUTRE ville du même joueur ; la ville de construction elle-même est exclue ; un non-merveille n est jamais signalé', () => {
  const setups: SetupLine[] = [
    { nom: 'Alpha', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
      taillePopulation: 10, pourcentageMariages: 40, villes: ['Ville A'] },
    { nom: 'Bêta', peuple: 'Sylvains', culture: 'Déisme', regime: 'Démocratie',
      taillePopulation: 10, pourcentageMariages: 40, villes: ['Ville B'] },
  ]
  const state = createGame(setups, 20261115, 'local')
  normaliserEtat(state)
  const alpha = state.players[0]!
  const beta = state.players[1]!

  // nulle part : null
  assert.equal(merveilleConstruiteAilleurs(state, 'Musée d’Archéologie'), null,
    'aucune merveille construite : null')

  // chez l AUTRE joueur : trouvée (joueur + ville)
  beta.villes[0] = { ...beta.villes[0]!, batiments: ['Musée d’Archéologie'], amenagements: [] }
  const ailleurs = merveilleConstruiteAilleurs(state, 'Musée d’Archéologie')
  assert.ok(ailleurs, 'construite chez Bêta : trouvée')
  assert.equal(ailleurs!.joueur, beta.n, 'le joueur propriétaire est identifié')
  assert.equal(ailleurs!.villeNom, 'Ville B', 'la ville propriétaire est identifiée')

  // la ville de construction elle-même est EXCLUE (le garde-fou du
  //  mutateur passe saufJoueur/saufVille — reconstruire au même
  //  endroit ne doit pas être refusé par CE garde-fou)
  assert.equal(
    merveilleConstruiteAilleurs(state, 'Musée d’Archéologie', beta.n, 'Ville B'),
    null, 'saufJoueur/saufVille : la ville de construction est exclue')

  // une AUTRE ville du MÊME joueur : trouvée quand même (unique AU
  //  MONDE, pas unique par joueur)
  alpha.villes.push({ ...alpha.villes[0]!, nom: 'Ville A2', batiments: ['Musée d’Archéologie'], amenagements: [] })
  assert.ok(merveilleConstruiteAilleurs(state, 'Musée d’Archéologie', alpha.n, 'Ville A'),
    'une deuxième ville du même joueur : trouvée (unique au monde)')

  // un bâtiment NON-merveille construit ailleurs n est jamais signalé
  beta.villes[0] = { ...beta.villes[0]!, batiments: ['Chapelle'], amenagements: [] }
  assert.equal(merveilleConstruiteAilleurs(state, 'Chapelle'), null,
    'Chapelle (famille vide) : null — seul un homonyme de famille Merveille compte')
})

// ── 4. Pyramide des Xoltans : bourgeois de la ville ×2 (EN PLUS du rang) ───

test('Pyramide des Xoltans : production des Bourgeois de LA VILLE ×2 EN PLUS du rang (chasseur bourgeois 2 → 3 → 6), la Guilde des bourgeois se cumule (×4,5 par bourgeois)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]!
  p.villes[0] = villeTest(p, [])
  state.population[p.n] = [
    perso('C1', 30, { metier: 'Chasseur', prestige: 0 }),
    perso('C2', 30, { metier: 'Chasseur', prestige: 150 }),
  ]

  // lecteurs : 1 sans merveille, 2 avec
  assert.equal(multProductionBourgeoisVille(p.villes[0], C), 1, 'sans merveille : ×1')
  p.villes[0] = villeTest(p, ['Pyramide des Xoltans'])
  assert.equal(multProductionBourgeoisVille(p.villes[0], C), 2, 'Pyramide : ×2')

  // moteur : 2 (roturier) + 3 (bourgeois ×1,5 de rang) = 5 Nourriture
  //  sans merveille ; avec la Pyramide le bourgeois passe ×1,5×2 = 6
  p.villes[0] = villeTest(p, [])
  const sans = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(sans.metiers['Nourriture']! - 5) < 1e-9,
    `2 + 3 = 5 Nourriture sans merveille (obtenu ${sans.metiers['Nourriture']})`)
  p.villes[0] = villeTest(p, ['Pyramide des Xoltans'])
  const avec = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(avec.metiers['Nourriture']! - 8) < 1e-9,
    `2 + 2×3 = 8 Nourriture avec la Pyramide (obtenu ${avec.metiers['Nourriture']})`)

  // PAR VILLE : la Pyramide dans une AUTRE ville ne touche pas celle-ci
  p.villes.push({ ...villeTest(p, ['Pyramide des Xoltans']), nom: 'Autre' })
  const ici = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(ici.metiers['Nourriture']! - 8) < 1e-9,
    'la Pyramide d une autre ville ne change rien à celle-ci (elle y est déjà)')
  p.villes[0] = villeTest(p, [])
  const iciVide = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(iciVide.metiers['Nourriture']! - 5) < 1e-9,
    'la Pyramide est dans l AUTRE ville : celle-ci reste à 5 (effet PAR VILLE, pas par pays)')

  // cumul multiplicatif avec la Guilde des bourgeois : rang ×1,5 ×
  //  guilde ×1,5 × Pyramide ×2 = ×4,5 par bourgeois (2 × 4,5 = 9,
  //  total 2 + 9 = 11)
  p.villes[0] = villeTest(p, ['Pyramide des Xoltans', 'Guilde des bourgeois'])
  const cumul = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(cumul.metiers['Nourriture']! - 11) < 1e-9,
    `Guilde ×1,5 + Pyramide ×2 : bourgeois ×4,5 → 2 + 9 = 11 (obtenu ${cumul.metiers['Nourriture']})`)
})

// ── 5. Sanctuaire de Salmodiva : Fermiers +2 Nourriture en ÉTÉ ────────────

test('Sanctuaire de Salmodiva : les Fermiers de la ville produisent +2 Nourriture par tour EN ÉTÉ seulement (20 + 2 = 22), rien hors été', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]!
  p.villes[0] = villeTest(p, ['Sanctuaire de Salmodiva'])
  state.population[p.n] = [perso('F1', 30, { metier: 'Fermier' })]

  // lecteur : le bonus porte le drapeau été
  const bms = bonusMetierParHabitantVille(p.villes[0], C)
  assert.equal(bms.length, 1, 'un bonus par habitant (Sanctuaire)')
  assert.equal(bms[0]?.metier, 'Fermier')
  assert.equal(bms[0]?.ressource, 'Nourriture')
  assert.equal(bms[0]?.valeur, 2)
  assert.equal(bms[0]?.ete, true, 'le bonus est marqué ÉTÉ')

  // moteur : en été le Fermier produit 20 + 2 = 22 Nourriture
  //  (arbitrage 2026-11-15 : le Fermier produit 20 Nourriture en été)
  state.saison = 'Été'
  const ete = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs(ete.metiers['Nourriture']! - 22) < 1e-9,
    `été : 20 (métier) + 2 (Sanctuaire) = 22 (obtenu ${ete.metiers['Nourriture']})`)
  // hors été : le Fermier ne produit rien (métier été) et le bonus
  //  ne joue pas non plus — AUCUNE clé Nourriture
  state.saison = 'Hiver'
  const hiver = detailGainsVille(state, p, p.villes[0], C)
  assert.equal(hiver.metiers['Nourriture'], undefined,
    'hiver : ni le métier ni le bonus ne créditent la Nourriture')
})

// ── 5bis. Sanctuaire de Salmodiva (arbitrage 2026-11-15) : les 5 Soies
//    sont un COÛT de construction, PAS une production ───────────────────

test('Sanctuaire de Salmodiva (arbitrage 2026-11-15) : ne PRODUIT PAS de Soie par tour — les 5 Soies sont un COÛT de construction (20 Or + 20 Bois + 5 Soie)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const ref = constructionRef('Sanctuaire de Salmodiva', C.config, 'Ville')
  assert.ok(ref, 'Sanctuaire au référentiel')
  // AUCUN flux par tour (l ancienne production +5 Soie/tour disparaît)
  assert.deepEqual(effetsConstructionRef(ref, C.config), {}, 'aucun flux par tour (plus de +5 Soie)')
  assert.deepEqual(effetsEteConstructionRef(ref, C.config), {}, 'aucun flux d été non plus')
  // les 5 Soies migrent vers le COÛT de construction
  assert.deepEqual(coutConstructionRef(ref), { Or: 20, Bois: 20, Soie: 5 },
    'coût : 20 Or + 20 Bois + 5 Soie (arbitrage « coûte 5 soies à produire »)')
  // le résumé du picker ne promet plus de Soie par tour
  const lib = resumeConstruction(ref, C.config)
  assert.ok(!lib.includes('Soie'), `libellé sans production de Soie : ${lib}`)
  assert.ok(lib.includes('fermier +2 Nourriture / habitant en été'), `le bonus Fermier reste : ${lib}`)
})

// ── 6. Laboratoire de Falheim : part Science des Professeurs +10 % ────────

test('Laboratoire de Falheim : part de taxe Science des Professeurs 0,10 → 0,20 dans CETTE ville, cumul additive avec la Guilde des savants (0,25) ; +12 emplacements Scientifiques', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]!
  p.villes[0] = villeTest(p, [])
  state.population[p.n] = [
    perso('P1', 30, { metier: 'Professeur' }),
    perso('S1', 30, { metier: 'Scientifique', prestige: 150 }),
  ]

  // lecteur : 0 sans, 0,1 avec
  assert.equal(scienceProfesseurPlusVille(p.villes[0], C), 0, 'sans Laboratoire : 0')
  p.villes[0] = villeTest(p, ['Laboratoire de Falheim'])
  assert.ok(Math.abs(scienceProfesseurPlusVille(p.villes[0], C) - 0.1) < 1e-9,
    'Laboratoire : +0,10')

  // moteur : part 0,10 → 0,20
  const avec = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs((avec.bonusTaxes['Science'] ?? 0) - 0.2) < 1e-9,
    `part Science du Professeur : 0,20 (obtenu ${avec.bonusTaxes['Science']})`)

  // PAR VILLE : le Laboratoire d une autre ville ne joue pas ici
  p.villes.push({ ...villeTest(p, ['Laboratoire de Falheim']), nom: 'Autre' })
  p.villes[0] = villeTest(p, [])
  const ici = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs((ici.bonusTaxes['Science'] ?? 0) - 0.1) < 1e-9,
    'Laboratoire dans l AUTRE ville : la part reste 0,10 ici (PAR VILLE)')

  // cumul ADDITIF avec la Guilde des savants (pays) : 0,10 + 0,05 + 0,10
  p.villes[1] = { ...villeTest(p, ['Guilde des savants']), nom: 'Autre' }
  p.villes[0] = villeTest(p, ['Laboratoire de Falheim'])
  const cumul = detailGainsVille(state, p, p.villes[0], C)
  assert.ok(Math.abs((cumul.bonusTaxes['Science'] ?? 0) - 0.25) < 1e-9,
    `Guilde des savants + Laboratoire : 0,25 (obtenu ${cumul.bonusTaxes['Science']})`)

  // +12 emplacements de Scientifiques dans la ville du Laboratoire
  p.villes[0] = villeTest(p, [])
  const capSans = capMetierVille('Scientifique', p.villes[0], C)
  p.villes[0] = villeTest(p, ['Laboratoire de Falheim'])
  assert.equal(capMetierVille('Scientifique', p.villes[0], C) - capSans, 12,
    'Laboratoire : +12 emplacements de Scientifiques')
})

// ── 7. Antre / Antichambre : émissaires +5, routes +1, flux ×2 ────────────

test('Antre de la déesse araignée : +5 émissaires ; Antichambre d’Alexandrie : +1 route commerciale et les FLUX copiés des routes ×2 (emplacements au nominal)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]!

  // émissaires : delta +5 (canal emissairesApportes, tant que construite)
  p.villes[0] = villeTest(p, [])
  const eSans = emissairesConstructionsJoueur(p, C)
  p.villes[0] = villeTest(p, ['Antre de la déesse araignée'])
  assert.equal(emissairesConstructionsJoueur(p, C) - eSans, 5,
    'Antre : +5 émissaires (canal emissairesApportes)')

  // routes : delta +1 (canal routesApportees)
  p.villes[0] = villeTest(p, [])
  const rSans = maxRoutesJoueur(p, C)
  p.villes[0] = villeTest(p, ['Antichambre d’Alexandrie'])
  assert.equal(maxRoutesJoueur(p, C) - rSans, 1, 'Antichambre : +1 route commerciale')
})

test('Antichambre d’Alexandrie : les aménagements octroyés par les routes sont DOUBLÉS (flux copiés ×2), le détail par route suit le moteur', () => {
  const setups: SetupLine[] = [
    { nom: 'Copieur', peuple: 'Basiléens', culture: 'Communautarisme', regime: 'Monarchie',
      taillePopulation: 50, pourcentageMariages: 40, villes: ['Capitale A'] },
    { nom: 'Cible', peuple: 'Sylvains', culture: 'Déisme', regime: 'Démocratie',
      taillePopulation: 50, pourcentageMariages: 40, villes: ['Capitale B'] },
  ]
  const state = createGame(setups, 20261115, 'local')
  normaliserEtat(state)
  const copieur = state.players[0]!
  const cible = state.players[1]!
  const C = cfgOf(state.config)

  // route dissociée vers l'Hôtel de tourisme de la cible (patron
  //  tier3.test.ts / commerce.test.ts)
  const villeCible = cible.villes[0]!
  villeCible.amenagements = [...(villeCible.amenagements ?? []), 'Hôtel de tourisme']
  const err = creerRouteCommerce(state, copieur.n, 'Capitale A', cible.n, null, villeCible.nom, 'Hôtel de tourisme')
  assert.equal(err, null, `la route doit s ouvrir (obtenu : ${err})`)
  const sans = effetsCommerceJoueur(state, copieur, state.saison, C)['Tourisme'] ?? 0
  assert.ok(sans > 0, 'pré-condition : le commerce apporte du Tourisme')

  // l'Antichambre dans le pays du copieur : flux copiés ×2
  copieur.villes[0] = { ...copieur.villes[0]!, type: 'Ville', rang: 'Grande Cité',
    batiments: ['Antichambre d’Alexandrie'], amenagements: [] }
  const avec = effetsCommerceJoueur(state, copieur, state.saison, C)['Tourisme'] ?? 0
  assert.ok(Math.abs(avec / sans - 2) < 1e-9,
    `Antichambre : Tourisme du commerce ×2 (${sans} → ${avec})`)

  // le DÉTAIL par route suit le moteur (affichage = source unique)
  const lignes = detailCommerceJoueur(state, copieur, state.saison, C)
  assert.equal(lignes.length, 1, 'une ligne par route')
  const fluxLigne = lignes[0]?.effets['Tourisme'] ?? 0
  assert.ok(Math.abs(fluxLigne - avec) < 1e-9,
    `la ligne de route affiche le flux doublé (${fluxLigne}, moteur ${avec})`)
})

// ── 8. Tour de Crystal : proba de conversion ÷1,1 (tirage par habitant) ───

test('Tour de Crystal : proba du jet de conversion des habitants de la ville ÷1,1 (chances réduites de 10 %)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]!
  const ville = p.villes[0]!
  // un habitant isolé dans la ville (hors Dirigeant)
  state.population[p.n] = [perso('A0', 30, { ville: ville.nom })]
  // SANS la Tour : proba pleine (conversionProba, 5 %)
  const probsSans: number[] = []
  applyCultureInfluence(state, p, fakeRng({ chance: (pr) => { probsSans.push(pr); return false } }), emptyRecap())
  assert.ok(Math.abs(probsSans[0]! - 0.05) < 1e-12, 'sans la Tour : proba pleine (5 %)')
  // lecteur : ×1 sans, ×1,1 avec
  assert.equal(ancrageConversionMultVille(ville, C), 1, 'lecteur : ×1 sans Tour')
  ville.batiments = [...(ville.batiments ?? []), 'Tour de Crystal']
  assert.ok(Math.abs(ancrageConversionMultVille(ville, C) - 1.1) < 1e-9,
    'lecteur : ×1,1 avec la Tour de Crystal')
  // AVEC la Tour : la proba du jet est ÷1,1 (≈ 4,55 % — chances
  //  réduites de 10 %, retour au tirage par habitant 2026-11-16)
  const probsAvec: number[] = []
  applyCultureInfluence(state, p, fakeRng({ chance: (pr) => { probsAvec.push(pr); return false } }), emptyRecap())
  assert.ok(Math.abs(probsAvec[0]! - 0.05 / 1.1) < 1e-12,
    'avec la Tour : proba ÷1,1 (chances réduites de 10 %)')
})


// ── 9. Tour de Crystal : dogme HORS PALIER au constructeur ────────────────

test('Tour de Crystal (dogme) : le grant s accorde à la construction, le CONSTRUCTEUR choisit (pas le pontife), validations du mutateur, palier 0', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const p = state.players[0]!
  const culture = p.culture

  // aucun grant : rien en attente, choisir refuse
  assert.equal(dogmesBonusEnAttente(state, culture, p.n), 0, 'aucun grant : 0 en attente')
  const refusSansGrant = choisirDogmeMerveille(state, culture, 'Dogme du Travail', p.n)
  assert.ok(refusSansGrant !== null, 'sans grant : le choix est refusé')

  // la Tour est construite : le grant s ouvre (log Culture)
  accorderDogmeMerveille(state, p.n, culture)
  assert.equal(dogmesBonusEnAttente(state, culture, p.n), 1, 'un grant : 1 choix en attente')
  assert.ok(state.log.some((l) => l.type === 'Culture' && l.texte.includes('Tour de Crystal')),
    'l octroi du grant est journalisé en Culture')

  // validations : dogme inconnu refusé
  assert.ok(choisirDogmeMerveille(state, culture, 'Dogme inexistant', p.n) !== null,
    'dogme hors référentiel : refus')

  // le CONSTRUCTEUR choisit : dogme enregistré au PALIER 0 (hors
  //  palier) à SON nom, consommé
  const err = choisirDogmeMerveille(state, culture, 'Dogme du Travail', p.n)
  assert.equal(err, null, `le choix passe (obtenu : ${err})`)
  const pris = dogmesCulture(state, culture)
  assert.equal(pris.length, 1, 'un dogme pris pour la culture')
  assert.equal(pris[0]?.palier, 0, 'palier 0 : HORS palier de Tourisme')
  assert.equal(pris[0]?.choisiPar, p.n, 'choisi par le CONSTRUCTEUR (pas le pontife)')
  assert.equal(dogmesBonusEnAttente(state, culture, p.n), 0, 'le grant est consommé')

  // le même dogme reste UNIQUE par culture, même via un nouveau grant
  accorderDogmeMerveille(state, p.n, culture)
  assert.ok(choisirDogmeMerveille(state, culture, 'Dogme du Travail', p.n) !== null,
    'dogme déjà pris par la culture : refus (unique par culture)')
  assert.ok(choisirDogmeMerveille(state, culture, 'Dogme de la Famille', p.n) === null,
    'un AUTRE dogme passe avec le grant')

  // le dogme hors palier NE CONSOMME PAS un palier de Tourisme :
  //  80 de Tourisme de ville (Palais des empereurs de Lun) = 1
  //  palier franchi → toujours 1 palier en attente malgré les 2
  //  dogmes (palier 0) pris
  p.villes[0] = { ...p.villes[0]!, batiments: [...(p.villes[0]!.batiments ?? []), 'Palais des empereurs de Lun'] }
  const paliers = paliersDogmesEnAttente(state, C)
  assert.equal(paliers.filter((x) => x.culture === culture).length, 1,
    'les dogmes hors palier ne consomment pas les paliers de Tourisme')
})

// ── 10. Libellés du picker / wiki (resumeConstruction) ─────────────────────

test('resumeConstruction (merveilles) : les canaux des fiches s affichent dans le résumé (picker + wiki)', () => {
  const C = cfgOf()
  const ref = (nom: string) => constructionRef(nom, C.config, 'Ville')

  const pyramide = ref('Pyramide des Xoltans')!
  assert.ok(pyramide, 'Pyramide au référentiel')
  const libPyramide = resumeConstruction(pyramide, C.config)
  assert.ok(libPyramide.includes('production des Bourgeois de la ville ×2'), `libellé : ${libPyramide}`)

  const sanctuaire = ref('Sanctuaire de Salmodiva')!
  const libSanctuaire = resumeConstruction(sanctuaire, C.config)
  assert.ok(libSanctuaire.includes('fermier +2 Nourriture / habitant en été'), `libellé : ${libSanctuaire}`)

  const labo = ref('Laboratoire de Falheim')!
  const libLabo = resumeConstruction(labo, C.config)
  assert.ok(libLabo.includes('Science des Professeurs de la ville +10 %'), `libellé : ${libLabo}`)

  const tour = ref('Tour de Crystal')!
  const libTour = resumeConstruction(tour, C.config)
  assert.ok(libTour.includes('ancrage des habitants ×1.1'), `libellé : ${libTour}`)
  assert.ok(libTour.includes('1 choix de dogme hors palier à la construction'), `libellé : ${libTour}`)

  const antichambre = ref('Antichambre d’Alexandrie')!
  const libAntichambre = resumeConstruction(antichambre, C.config)
  assert.ok(libAntichambre.includes('aménagements des routes ×2'), `libellé : ${libAntichambre}`)
  assert.ok(libAntichambre.includes('+1 route commerciale'), `libellé : ${libAntichambre}`)

  const ordre = ref('Ordre des chevaliers du Notan')!
  const libOrdre = resumeConstruction(ordre, C.config)
  assert.ok(libOrdre.includes('Attaquer une habitation réduit sa garnison de 50'),
    `effet de plateau affiché : ${libOrdre}`)
})
