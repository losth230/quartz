// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DE LA BANQUE D'EFFETS (node:test — `npm test src/rules/`)
//
//  1. Unitaires : chaque type d'effet, chaque condition ;
//  2. VOIE UNIQUE (retour Thibaut 2026-10-19 « tout ce qui a rapport à
//     une production passe par la banque ») : les accès moteur
//     (effetsConstructionRef / effetsEteConstructionRef /
//     instantanesConstructionRef / garnisonConstructionRef) lisent
//     EXCLUSIVEMENT la banque — et une construction SANS règle de
//     banque ne produit RIEN (l'ancien repli d'analyse du texte de
//     production a été retiré : plus de seconde interprétation).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appliquerRegles } from './effects/banque'
import { reglesConstructions } from './registry'
import type { RegleBanque } from './types'
import { cfgOf } from '../engine/gameData'
import { partieMock } from './mocks'
import {
  effetsConstructionRef, effetsEteConstructionRef, instantanesConstructionRef, eteSeulementRef,
  emplacementsConstructionRef, logementsConstructionRef, coutConstructionRef, prerequisConstruction,
  constructionRef, resumeConstruction, reductionCampDeBatisseurs, reductionLeveeConstructionRef,
} from '../engine/constructions'
import { productionTourismeBatiment } from '../engine/batiments'
import { createGame } from '../engine/setup'

// ── 1. Unitaires : types d'effets ───────────────────────────────────────────

test('fluxVille cumule les flux par ressource', () => {
  const ctx = partieMock()
  const regle: RegleBanque = {
    id: 'test.flux', source: 'batiment', nom: 'Test',
    effets: [
      { type: 'fluxVille', ressource: 'Or', valeur: 2 },
      { type: 'fluxVille', ressource: 'Or', valeur: 3 },
      { type: 'fluxVille', ressource: 'Bois', valeur: -1 },
    ],
  }
  const out = appliquerRegles([regle], ctx)
  assert.equal(out.flux['Or'], 5)
  assert.equal(out.flux['Bois'], -1)
})

test('fluxVille ete va dans le canal été, pas dans le flux normal', () => {
  const ctx = partieMock()
  const regle: RegleBanque = {
    id: 'test.ete', source: 'batiment', nom: 'Test',
    effets: [{ type: 'fluxVille', ressource: 'Nourriture', valeur: 12, ete: true }],
  }
  const out = appliquerRegles([regle], ctx)
  assert.equal(out.fluxEte['Nourriture'], 12)
  assert.equal(out.flux['Nourriture'], undefined)
})

test('garnisonVille accumule les valeurs d’état', () => {
  // (RETRAIT 2026-10-24, purge R4 : garnisonParRang — plomberie des
  //  doctrines — n'existe plus au contrat ; le test couvre la
  //  somme des garnisonsVille, seul type de garnison produit.)
  const ctx = partieMock({ villeRang: 'Cité' })
  const regle: RegleBanque = {
    id: 'test.garnison', source: 'batiment', nom: 'Test',
    effets: [
      { type: 'garnisonVille', valeur: 40 },
      { type: 'garnisonVille', valeur: 15 },
    ],
  }
  const out = appliquerRegles([regle], ctx)
  assert.equal(out.garnison, 55)
})

// (Retour Thibaut 2026-10-27 : « des valeurs qui passent par la
//  banque » — les EMPLACEMENTS de métiers et les LOGEMENTS sont des
//  canaux de la contribution, au même titre que les flux.)
test('placesMetier et logements : canaux dédiés de la contribution', () => {
  const ctx = partieMock()
  const regle: RegleBanque = {
    id: 'test.canaux', source: 'batiment', nom: 'Test',
    effets: [
      { type: 'placesMetier', metier: 'Garde', valeur: 4 },
      { type: 'placesMetier', metier: 'Garde', valeur: 2 },
      { type: 'placesMetier', metier: 'Tisseur', valeur: 3 },
      { type: 'logements', logement: 'Taudis', valeur: 5 },
      { type: 'logements', logement: 'Maison', valeur: 20 },
    ],
  }
  const out = appliquerRegles([regle], ctx)
  assert.deepEqual(out.placesMetier, { Garde: 6, Tisseur: 3 })
  assert.deepEqual(out.logements, { Taudis: 5, Maison: 20 })
  // les autres canaux restent intacts
  assert.deepEqual(out.flux, {})
  assert.equal(out.garnison, 0)
})

test('conditions saison (ET logique)', () => {
  // (RETRAIT 2026-10-24, purge R4 : les conditions peuple/vassal/
  //  suzerainDeCite n'existent plus au contrat — leurs producteurs
  //  (factions/dogmes) sont supprimés.)
  // (RETRAIT 2026-10-29, refontes « 12 lois » puis « 8 lois » des
  //  régimes : les conditions regime/culture n'existent plus au
  //  contrat avec les sources 'regime'/'culture' de la banque —
  //  il ne reste que la condition saison, la seule encore posée
  //  par le registre. Le mock de base est Été.)
  const regle: RegleBanque = {
    id: 'test.cond', source: 'batiment', nom: 'Test',
    conditions: { saison: 'Hiver' },
    effets: [{ type: 'fluxVille', ressource: 'Or', valeur: 10 }],
  }
  // pas la saison → rien
  const base = partieMock()
  assert.equal(appliquerRegles([regle], base).flux['Or'], undefined)
  // saison OK → effet
  const hiver = partieMock({ saison: 'Hiver' })
  assert.equal(appliquerRegles([regle], hiver).flux['Or'], 10)
})

// ── 2. Voie unique : le moteur ne lit QUE la banque ───────────────────────

test('VOIE UNIQUE : les accès moteur rendent exactement la contribution de la règle de banque', () => {
  const C = cfgOf(undefined)
  const refs = C.config.constructions ?? []
  assert.ok(refs.length > 30,
    'référentiel constructions attendu (94 entrées après la fiche bâtiments rang 2, 2026-10-26)')
  // (Retour Thibaut 2026-10-27 : une construction porte une règle dès
  //  qu'elle a un effet QUELCONQUE — flux, emplacements de métiers ou
  //  logements. Arbitrage Thibaut 2026-10-28 : « les armées, et
  //  surtout les réductions de levée, rejoignent la banque » — la
  //  réduction de levée d'armée (champ reductionLeveeArmee) est un
  //  effet de banque AU MÊME TITRE, canal reductionLeveeArmee.)
  const aEffet = (r: typeof refs[number]) =>
    !!(r.effets?.length || r.emplacements?.length || r.taudisApportes || r.domicilesApportes?.length || r.reductionLeveeArmee)
  const regles = reglesConstructions(C)
  assert.equal(regles.length, refs.filter(aEffet).length)
  const parCle = new Map(regles.map((r) => [`${r.nom}|${r.groupe}`, r]))

  for (const ref of refs) {
    if (!aEffet(ref)) continue
    const regle = parCle.get(`${ref.nom}|${ref.groupe}`)
    assert.ok(regle, `règle banque manquante pour ${ref.nom} (${ref.groupe})`)
    const ctx = partieMock()
    const out = appliquerRegles([regle], ctx)

    // flux par tour (hors été, hors garnison)
    const attenduFlux = effetsConstructionRef(ref)
    assert.deepEqual(
      Object.fromEntries(Object.entries(out.flux).filter(([, v]) => v !== 0)),
      Object.fromEntries(Object.entries(attenduFlux).filter(([, v]) => v !== 0)),
      `flux différents pour ${ref.nom} : banque=${JSON.stringify(out.flux)} moteur=${JSON.stringify(attenduFlux)}`,
    )
    // flux d'été
    const attenduEte = effetsEteConstructionRef(ref)
    assert.deepEqual(
      Object.fromEntries(Object.entries(out.fluxEte).filter(([, v]) => v !== 0)),
      Object.fromEntries(Object.entries(attenduEte).filter(([, v]) => v !== 0)),
      `flux été différents pour ${ref.nom}`,
    )
    // garnison (valeur d'état)
    const attenduInst = instantanesConstructionRef(ref)
    assert.equal(out.garnison, attenduInst['Garnison'] ?? 0, `garnison différente pour ${ref.nom}`)
    // (2026-10-27) emplacements de métiers : le moteur lit le canal
    //  placesMetier de la banque — aucune seconde interprétation.
    const attenduEmp = Object.fromEntries(emplacementsConstructionRef(ref).map((e) => [e.metier, e.places]))
    assert.deepEqual(
      out.placesMetier,
      attenduEmp,
      `emplacements différents pour ${ref.nom} : banque=${JSON.stringify(out.placesMetier)} moteur=${JSON.stringify(attenduEmp)}`,
    )
    // (2026-10-27) logements : le moteur lit le canal logements — les
    //  Taudis (taudisApportes) et les autres domiciles y passent PAREIL.
    const attenduLog: Record<string, number> = { ...(ref.taudisApportes ? { Taudis: ref.taudisApportes } : {}) }
    for (const e of ref.domicilesApportes ?? []) attenduLog[e.domicile] = (attenduLog[e.domicile] ?? 0) + e.nombre
    assert.deepEqual(out.logements, attenduLog, `logements différents pour ${ref.nom}`)
    assert.deepEqual(logementsConstructionRef(ref), attenduLog, `canal moteur logements différent pour ${ref.nom}`)
    // (2026-10-28, arbitrage Thibaut « les réductions de levée
    //  rejoignent la banque ») réduction de levée : le moteur lit le
    //  canal reductionLeveeArmee — aucune seconde interprétation.
    assert.equal(out.reductionLeveeArmee, reductionLeveeConstructionRef(ref),
      `réduction de levée différente pour ${ref.nom}`)
  }
})

test('SANS règle de banque : production NULLE sur tous les canaux (repli texte retiré)', () => {
  const C = cfgOf(undefined)
  const refs = C.config.constructions ?? []
  // (2026-10-27 : sans règle = sans flux, sans emplacements ET sans
  //  logements — les trois familles d'effets passent par la banque.
  //  Arbitrage Thibaut 2026-10-28 : la réduction de levée est la
  //  QUATRIÈME famille — une construction qui la porte a une règle.)
  const aEffet = (r: typeof refs[number]) =>
    !!(r.effets?.length || r.emplacements?.length || r.taudisApportes || r.domicilesApportes?.length || r.reductionLeveeArmee)
  const sansEffets = refs.filter((r) => !aEffet(r))
  assert.ok(sansEffets.length > 0, 'des constructions sans effets structurés existent')
  for (const ref of sansEffets) {
    // ces entrées n'ont PAS de règle dans la banque…
    const regles = reglesConstructions(C).filter((r) => r.nom === ref.nom)
    assert.equal(regles.length, 0, `${ref.nom} ne doit pas être dans la banque sans effet structuré`)
    // …et le moteur ne produit RIEN pour elles : plus AUCUN repli texte
    //  (l'ancien parseProductionTexte a été retiré le 2026-10-19).
    assert.deepEqual(effetsConstructionRef(ref), {}, `${ref.nom} : flux attendu nul`)
    assert.deepEqual(effetsEteConstructionRef(ref), {}, `${ref.nom} : flux été attendu nul`)
    assert.deepEqual(instantanesConstructionRef(ref), {}, `${ref.nom} : aucune valeur d'état attendue`)
    assert.deepEqual(emplacementsConstructionRef(ref), [], `${ref.nom} : aucun emplacement attendu`)
    assert.deepEqual(logementsConstructionRef(ref), {}, `${ref.nom} : aucun logement attendu`)
    assert.equal(reductionLeveeConstructionRef(ref), 0, `${ref.nom} : aucune réduction de levée attendue`)
  }
})

test('Tourisme = FLUX NORMAL via la banque (Hôtel de tourisme +12 : ni instantané, ni stock cumulé)', () => {
  // (la Chapelle, rang 2, est DE RETOUR au référentiel depuis la
  //  fiche bâtiments 2026-10-26 — l'Hôtel de tourisme, rang 1,
  //  reste le témoin du Tourisme-flux.)
  const refs = cfgOf(undefined).config.constructions ?? []
  const hotel = refs.find((r) => r.nom === 'Hôtel de tourisme')
  assert.ok(hotel?.effets?.length, 'l Hôtel de tourisme doit avoir des effets structurés')
  // le Tourisme se lit dans le FLUX de la règle de banque…
  assert.equal(effetsConstructionRef(hotel)['Tourisme'], 12)
  // …et n'est PLUS un instantané « crédité une fois » (sémantique retirée).
  assert.equal(instantanesConstructionRef(hotel)['Tourisme'], undefined)
  // idem productionTourismeBatiment (voie unique du stock = production).
  const C = cfgOf(undefined)
  assert.equal(productionTourismeBatiment('Hôtel de tourisme', C, 'Ville'), 12)
})

test('Champ / Rizière (vague 3a) : plus AUCUN flux direct — la production passe par les emplacements de Fermier (été)', () => {
  const refs = cfgOf(undefined).config.constructions ?? []
  const champ = refs.find((r) => r.nom === 'Champ')
  assert.ok(champ, 'Champ présent dans le référentiel')
  // vague 3a : le Champ ne porte PLUS de flux — ni normal ni d'été
  //  (la production de Nourriture vit dans le métier Fermier, dont
  //  les postes sont créés par les emplacements du Champ).
  assert.equal(eteSeulementRef(champ), false, 'le Champ ne porte plus de flux d été')
  assert.equal(Object.keys(effetsConstructionRef(champ)).length, 0, 'Champ : aucun flux')
  assert.equal(Object.keys(effetsEteConstructionRef(champ)).length, 0, 'Champ : aucun flux d été non plus')
  assert.equal((champ.emplacements ?? []).find((e) => e.metier === 'Fermier')?.places ?? 0, 3,
    'Champ : 3 emplacements de Fermier')
  const riziere = refs.find((r) => r.nom === 'Rizière')
  assert.ok(riziere, 'Rizière présente')
  assert.equal(Object.keys(effetsConstructionRef(riziere!)).length, 0, 'Rizière : aucun flux')
  assert.equal((riziere!.emplacements ?? []).find((e) => e.metier === 'Fermier')?.places ?? 0, 4,
    'Rizière : 4 emplacements de Fermier')
  // le Fermier, lui, produit en ÉTÉ seulement (champ ete du référentiel métiers)
  const fermier = cfgOf(undefined).metiers.find((m) => m.metier === 'Fermier')
  assert.ok(fermier, 'Fermier présent dans le référentiel métiers')
  assert.equal(fermier!.ete, true, 'Fermier : production d été seulement (champ ete)')
  // vague 3b : le Camp de bûcheron ne porte PLUS de flux — il crée
  //  2 emplacements de Bûcheron (bâtiment tier 1).
  const camp = refs.find((r) => r.nom === 'Camp de bûcheron')
  assert.ok(camp, 'Camp de bûcheron présent')
  assert.equal(eteSeulementRef(camp), false)
  assert.equal(Object.keys(effetsConstructionRef(camp)).length, 0, 'Camp de bûcheron : plus aucun flux (vague 3b)')
  assert.equal((camp.emplacements ?? []).find((e) => e.metier === 'Bûcheron')?.places ?? 0, 2,
    'Camp de bûcheron : 2 emplacements de Bûcheron')
})

test('runTurn fonctionne après création d’une partie (sanity moteur)', () => {
  const s = createGame(
    [{ nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme', taillePopulation: 50, pourcentageMariages: 40, villes: ['Bergen'] }],
    42, 'local',
  )
  assert.ok(s.players.length >= 1)
  assert.equal(typeof s.turn, 'number')
})

// ── 3. (Retour Thibaut 2026-10-27) coûts, prérequis, métiers, logements :
//     des DONNÉES, plus de texte à analyser ─────────────────────────────

test('2026-10-27 : le COÛT se lit des données structurées `couts` (paires ressource/valeur)', () => {
  const refs = cfgOf(undefined).config.constructions ?? []
  // Poste de garde : 25 Or + 4 Fer — agrégation des paires.
  const poste = refs.find((r) => r.nom === 'Poste de garde')
  assert.ok(poste, 'Poste de garde présent')
  assert.deepEqual(coutConstructionRef(poste), { Or: 25, Fer: 4 },
    'coût du Poste de garde lu des paires {ressource, valeur}')
  // Verrou global : TOUTE entrée du référentiel porte ses coûts en
  //  données — plus aucun texte de coût à analyser.
  for (const ref of refs) {
    assert.ok(Array.isArray(ref.couts), `${ref.nom} : champ couts attendu (données structurées)`)
    assert.ok(!ref.cout, `${ref.nom} : le texte de coût doit être vidé`)
  }
})

test('2026-10-27 : le PRÉREQUIS se lit du champ dédié `requis` (plus de regex sur le texte)', () => {
  const refs = cfgOf(undefined).config.constructions ?? []
  const caserne = refs.find((r) => r.nom === 'Caserne')
  assert.ok(caserne, 'Caserne présente')
  assert.equal(prerequisConstruction(caserne), 'Poste de garde',
    'prérequis de la Caserne : champ requis, même ville')
  assert.equal(prerequisConstruction(refs.find((r) => r.nom === 'Ecole militaire')), "Terrain d'entrainement")
  assert.equal(prerequisConstruction(refs.find((r) => r.nom === 'Poste de garde')), null,
    'Poste de garde : aucun prérequis')
})

test('2026-10-27 : MÉTIERS et LOGEMENTS passent par la banque (canaux placesMetier / logements)', () => {
  const C = cfgOf(undefined)
  // Poste de garde : 4 Garde — lu du canal placesMetier de la banque.
  const poste = constructionRef('Poste de garde', C.config)!
  assert.deepEqual(emplacementsConstructionRef(poste, C.config), [{ metier: 'Garde', places: 4 }],
    'emplacements du Poste de garde : canal placesMetier de la banque')
  // Champ : +5 Taudis ; Quartier intermédiaire : +20 Maisons — canal
  //  logements (Taudis et autres domiciles par le MÊME canal).
  const champ = constructionRef('Champ', C.config)!
  assert.deepEqual(logementsConstructionRef(champ, C.config), { Taudis: 5 },
    'logements du Champ : canal logements de la banque')
  const quart = constructionRef('Quartier intermédiaire', C.config)!
  assert.deepEqual(logementsConstructionRef(quart, C.config), { Maison: 20 },
    'logements du Quartier intermédiaire : canal logements de la banque')
  // Le résumé affichable rend ces canaux (« +5 Taudis », « +20 Maisons »).
  assert.ok(resumeConstruction(champ, C.config).includes('+5 Taudis'))
  assert.ok(resumeConstruction(quart, C.config).includes('+20 Maisons'))
})

test('2026-10-27 : Camp de bâtisseurs — réduction en données (repli 5 Or / 1 Bois tant que absent du référentiel)', () => {
  // Le Camp de bâtisseurs n'est PAS au référentiel (mécanisme dormant) :
  //  repli structuré {Or: 5, Bois: 1} — plus d'analyse de description.
  assert.deepEqual(reductionCampDeBatisseurs(), { Or: 5, Bois: 1 })
})
