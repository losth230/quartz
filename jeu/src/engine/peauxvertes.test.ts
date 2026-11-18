// ═══════════════════════════════════════════════════════════════════════════
//  TESTS FICHE « PEAUX VERTES » (arbitrage Thibaut 2026-11-18)
//
//  Base effetsPeuple :
//   · Taillés pour la guerre (EFFET HABITANTS) : métier Commandant,
//     Soldat ou Garde → 0 consommation de nourriture ;
//   · Union du Klan (EFFET JOUEUR) : fonder une habitation coûte
//     3 Bois et 5 Or de moins (premier rang du type uniquement,
//     les AMÉLIORATIONS de rang ne sont pas réduites).
//  Talents (talentsPeuple) :
//   · Démographique I « Crocs et pièges » : Chasseurs +1
//     Nourriture/tour, +5 emplacements de Chasseur par rang de
//     l'habitation ; III « Autels hurlants » : +10 Bonheur par Autel ;
//   · Militaire I « Jambes de raid » : +1 PM + 1 armée supplémentaire
//     (règle de PLATEAU, aucun canal moteur) ; III « Klan en
//     marche » : levée −10 Or par armée possédée ;
//   · Diplomatique I « Serments de sang » : tribut vassal +2 % par
//     Autel ; III « La peur du klan » : levée des vassaux +10 Or par
//     rang de pays du suzerain, +2 emplacements de Garde par Autel.
//    (Noms de talents inventés par l'IA, renommables par l'arbitre.)
//  Constructions de faction :
//   · Autel Eud Guer (Ville ET Château, 6 Bois + 12 Or,
//     batimentDeFaction, réservé PEAUX VERTES) : −15 Or de levée dans
//     l'habitation, +15 Taudis ;
//   · Grand Autel Noirecendre (famille Merveille → unique au monde,
//     80 Or + 60 Bois + 20 Pierre) : tant qu'il tient, chaque Autel
//     Eud Guer du joueur prend +15 levée, +1 émissaire, +15 Taudis.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Army, Character, City, GameState, Player } from './types'
import { cfgOf, peupleEffetDef } from './gameData'
import { talentsPeupleDef, talentsActifs } from './talentsPeuple'
import { consoNourrHabitant, detailGainsVille, impotsVassaux } from './economie'

import { prixArmee, reductionLeveeArmeeVille } from './armees'
import { capMetierVille } from './metiers'
import { debiterCoutHabitation } from './habitations'
import { bonheurVilleComplete, logementsVille } from './bonheur'
import { emissairesConstructionsJoueur, merveilleConstruiteAilleurs, refBuffBatimentJoueur } from './batiments'
import { constructionRef, coutConstructionRef } from './constructions'

const SETUP: SetupLine[] = [
  { nom: 'Verte', peuple: 'PEAUX VERTES', culture: 'Communautarisme', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Bourg'] },
  { nom: 'Basile', peuple: 'Basiléens', culture: 'Communautarisme', regime: 'Autoritarisme',
    taillePopulation: 10, pourcentageMariages: 40, villes: ['Ville'] },
]

/** Grille commune de test (deux joueurs, une ville chacun). */
function grille(): { state: GameState; verte: Player; basile: Player; vV: City; vB: City } {
  const state = createGame(SETUP, 20261118, 'local')
  const verte = state.players[0] as Player
  const basile = state.players[1] as Player
  return { state, verte, basile, vV: verte.villes[0] as City, vB: basile.villes[0] as City }
}

/** Habitants d'un joueur vivants dans une ville (du setup). */
function vivantsDe(state: GameState, n: number, villeNom: string): Character[] {
  return (state.population[n] ?? []).filter((c) => c.statut !== 'Décédé' && c.ville === villeNom)
}

/** Ajoute un exemplaire d'un bâtiment à une ville (hors picker). */
function batir(ville: City, nom: string): void {
  ville.batiments.push(nom)
}

function armee(nom: string): Army {
  return { nom, puissanceCible: 10, puissance: 10, commandant: null, soldats: [] }
}

// ── Référentiel ─────────────────────────────────────────────────────────

test('référentiel : fiche effetsPeuple PEAUX VERTES, deux canaux séparés', () => {
  const { state } = grille()
  const cfg = cfgOf(state.config).config
  assert.ok(cfg.peuples.includes('PEAUX VERTES'), 'jouable (peuplesLibres d\'origine)')
  const f = peupleEffetDef('PEAUX VERTES', cfg)
  assert.ok(f, 'fiche présente')
  assert.ok(f!.effetHabitants?.includes('Taillés pour la guerre'), 'canal habitants : Taillés pour la guerre')
  assert.ok(f!.effetJoueur?.includes('Union du Klan'), 'canal joueur : Union du Klan')
  assert.deepEqual(f!.metiersSansConsoNourriture, ['Commandant', 'Soldat', 'Garde'])
  assert.deepEqual(f!.reductionCoutFondation, [
    { ressource: 'Bois', valeur: 3 }, { ressource: 'Or', valeur: 5 }])
  // Pas de canaux isolationnistes (ceux des Khazhags Nains).
  assert.equal(f!.migrationBonheurMod, undefined)
  assert.equal(f!.conversionProbaMod, undefined)
  // La séparation habitants/joueur est effective : champ « effet » global
  // = concaténation texte des deux canaux.
  assert.ok((f!.effet ?? '').length > (f!.effetHabitants ?? '').length)
})

test('référentiel : 6 talents sur 3 voies, canaux moteurs exacts', () => {
  const { state } = grille()
  const cfg = cfgOf(state.config).config
  const ts = talentsPeupleDef('PEAUX VERTES', cfg)
  assert.equal(ts.length, 6, 'Démo I+III, Mil I+III, Dipl I+III')
  const par = (voie: string, min: number) => ts.find((t) => t.voie === voie && t.laurierMin === min)
  const demo1 = par('Démographique', 1)
  const demo3 = par('Démographique', 3)
  const mil1 = par('Militaire', 1)
  const mil3 = par('Militaire', 3)
  const dipl1 = par('Diplomatique', 1)
  const dipl3 = par('Diplomatique', 3)
  assert.ok(demo1 && demo3 && mil1 && mil3 && dipl1 && dipl3, 'tous les paliers présents')
  assert.deepEqual(demo1!.fluxParMetier, [{ metiers: ['Chasseur'], ressource: 'Nourriture', valeur: 1 }])
  assert.deepEqual(demo1!.emplacementsParRangHabitation, [{ metier: 'Chasseur', places: 5 }])
  assert.deepEqual(demo3!.bonheurParBatiment, [{ batiment: 'Autel Eud Guer', bonheur: 10 }])
  assert.deepEqual(dipl1!.tributVassalParBatiment, [{ batiment: 'Autel Eud Guer', part: 0.02 }])
  assert.equal(mil3!.reductionLeveeParArmeePossedee, 10)
  assert.deepEqual(dipl3!.emplacementsParBatiment, [{ batiment: 'Autel Eud Guer', metier: 'Garde', places: 2 }])
  assert.equal(dipl3!.surcoutLeveeVassalParRangPays, 10)
  // Mil I « Jambes de raid » : règle de PLATEAU — AUCUN canal moteur.
  assert.equal(mil1!.fluxParMetier, undefined)
  assert.equal(mil1!.reductionLeveeParArmeePossedee, undefined)
  assert.equal(mil1!.emplacementsParBatiment, undefined)
})

test('référentiel : Autel Eud Guer (Ville ET Château) + Grand Autel Noirecendre', () => {
  const { state } = grille()
  const cfg = cfgOf(state.config).config
  const autelV = constructionRef('Autel Eud Guer', cfg, 'Ville')
  const autelC = constructionRef('Autel Eud Guer', cfg, 'Château')
  const grand = constructionRef('Grand Autel Noirecendre', cfg, 'Ville')
  assert.ok(autelV && autelC, 'Autel Eud Guer en Ville ET Château')
  assert.ok(grand, 'Grand Autel Noirecendre présent')
  for (const a of [autelV!, autelC!]) {
    assert.equal(a.batimentDeFaction, true, 'marqué bâtiment de faction')
    assert.deepEqual(a.peuples, ['PEAUX VERTES'], 'réservé aux PEAUX VERTES')
    assert.deepEqual(coutConstructionRef(a), { Bois: 6, Or: 12 }, 'fiche : 6 Bois + 12 Or')
    assert.equal(a.reductionLeveeArmee, 15, '−15 Or de levée dans l\'habitation')
    assert.deepEqual(a.domicilesApportes, [{ domicile: 'Taudis', nombre: 15 }], '+15 Taudis')
  }
  assert.equal(grand!.famille, 'Merveille', 'famille Merveille → unique au monde')
  assert.deepEqual(grand!.peuples, ['PEAUX VERTES'], 'merveille réservée aux PEAUX VERTES')
  assert.deepEqual(coutConstructionRef(grand!), { Or: 80, Bois: 60, Pierre: 20 },
    'fiche : 80 Or + 60 Bois + 20 Pierres')
  assert.equal(grand!.buffBatiment, 'Autel Eud Guer')
  assert.deepEqual({
    levee: grand!.buffBatimentLeveeArmee, emis: grand!.buffBatimentEmissaires, taudis: grand!.buffBatimentTaudis,
  }, { levee: 15, emis: 1, taudis: 15 }, 'buff de chaque Autel : +15 levée, +1 émissaire, +15 Taudis')
})

// ── Base : Taillés pour la guerre (habitants) ────────────────────────────

test('Taillés pour la guerre : Commandant/Soldat/Garde Peaux-Vertes → 0 nourriture, AVANT le rang', () => {
  const { state } = grille()
  const C = cfgOf(state.config)
  const hab = (peuple: string, metier: string, prestige = 0): Character =>
    ({ peuple, metier, prestige, dynastie: '' } as unknown as Character)
  for (const m of ['Commandant', 'Soldat', 'Garde']) {
    assert.equal(consoNourrHabitant(hab('PEAUX VERTES', m), C, 'Autoritarisme', state), 0,
      `${m} Peaux-Vertes : 0 nourriture`)
    // Portée PEUPLES, pas MÉTIERS : un Basiléen du même métier consomme.
    assert.ok(consoNourrHabitant(hab('Basiléens', m), C) > 0, `${m} Basiléens : conso normale`)
  }
  // Portée HABITANT (peuple hérité de la mère), même hors du territoire natal.
  assert.ok(consoNourrHabitant(hab('PEAUX VERTES', 'Fermier'), C) > 0, 'Fermier : conso normale')
  // Un NOBLE Garde Peaux-Vertes ne consomme RIEN : la règle joue AVANT
  // le rang social (et ses exceptions de dogme/régime).
  assert.equal(consoNourrHabitant(hab('PEAUX VERTES', 'Garde', 300), C, 'Autoritarisme', state), 0,
    'noble Garde : 0 quand même (avant rang/dogme/régime)')
})

// ── Base : Union du Klan (joueur) ───────────────────────────────────────

test('Union du Klan : fondation (rang 1) −3 Bois −5 Or, cliquet : améliorations jamais réduites', () => {
  const { state, verte, basile, vV, vB } = grille()
  const C = cfgOf(state.config)
  const or0V = verte.resources['Or']?.stock ?? 0
  const or0B = basile.resources['Or']?.stock ?? 0
  // rang 1 (Hameau) = FONDATION → réduction chez les Peaux-Vertes.
  const cuV = debiterCoutHabitation(state, verte, vV, C)
  const cuB = debiterCoutHabitation(state, basile, vB, C)
  // Hameau référentiel : 20 Or + 10 Bois + 6 Bétail.
  assert.deepEqual(cuB, { Or: 20, Bois: 10, Bétail: 6 })
  assert.deepEqual(cuV, { Or: 15, Bois: 7, Bétail: 6 }, '3 Bois et 5 Or de moins, les autres ressources intactes')
  // Le stock débité correspond bien au coût réduit (5 Or de moins que
  //  le Basiléen de la même grille, stocks de départ identiques).
  assert.equal(verte.resources['Or']?.stock, or0V - 15)
  assert.equal(basile.resources['Or']?.stock, or0B - 20)
  // rang 2 (Cité) = AMÉLIORATION → PAS de rabais (fonder ≠ améliorer).
  vV.rang = 'Cité'
  vB.rang = 'Cité'
  const upV = debiterCoutHabitation(state, verte, vV, C)
  const upB = debiterCoutHabitation(state, basile, vB, C)
  assert.deepEqual(upV, upB, 'amélioration : mêmes coûts chez Peaux-Vertes et Basiléens')
  assert.deepEqual(upV, { Or: 40, Bétail: 8, Pierre: 6 }, 'coût référentiel du rang Cité, intact')
})

// ── Bâtiment de faction : Autel Eud Guer ─────────────────────────────────

const orBase = 200

test('Autel Eud Guer : −15 Or de levée d\'armée dans l\'habitation, +15 Taudis, cumulatif', () => {
  const { state, verte, vV } = grille()
  const C = cfgOf(state.config)
  const reduc0 = reductionLeveeArmeeVille(vV, verte, C)
  const loge0 = logementsVille(vV, C, state)
  // Référence prixArmee AVANT les autels.
  verte.armees = []
  const prixBase = prixArmee(orBase, C, vV, verte)
  batir(vV, 'Autel Eud Guer')
  assert.equal(reductionLeveeArmeeVille(vV, verte, C) - reduc0, 15, '−15 Or de levée')
  assert.equal(logementsVille(vV, C, state) - loge0, 15, '+15 Taudis')
  batir(vV, 'Autel Eud Guer')
  assert.equal(reductionLeveeArmeeVille(vV, verte, C) - reduc0, 30, 'deux autels : −30 Or')
  assert.equal(logementsVille(vV, C, state) - loge0, 30, 'deux autels : +30 Taudis')
  // Coût de levée réel : la grille détaillée d'ArmiesPanel lit prixArmee
  //  (référence mesurée AVANT les autels → aucune hypothèse sur les
  //  réductions de rang de pays/régime qui l'accompagnent).
  assert.equal(prixArmee(orBase, C, vV, verte), prixBase - 30)
})

// ── Merveille de faction : Grand Autel Noirecendre ───────────────────────

test('Grand Autel Noirecendre : chaque Autel gagne +15 levée, +1 émissaire, +15 Taudis (niveau joueur)', () => {
  const { state, verte, vV } = grille()
  const C = cfgOf(state.config)
  // Deuxième ville du même joueur, avec un Autel déjà posé.
  const v2: City = { ...vV, nom: 'Deux', batiments: [], domiciles: [] }
  verte.villes.push(v2)
  batir(vV, 'Autel Eud Guer')
  assert.equal(refBuffBatimentJoueur(verte, C), undefined, 'pas de Grand Autel : aucun buff')
  const reduc0 = reductionLeveeArmeeVille(vV, verte, C)
  const emis0 = emissairesConstructionsJoueur(verte, C)
  const loge0 = logementsVille(vV, C, state)
  // Le Grand Autel est posé dans l'AUTRE ville : le buff reste JOUEUR.
  batir(v2, 'Grand Autel Noirecendre')
  const ref = refBuffBatimentJoueur(verte, C)
  assert.ok(ref && ref.nom === 'Grand Autel Noirecendre', 'construction BUFF-porteuse détectée')
  assert.equal(reductionLeveeArmeeVille(vV, verte, C) - reduc0, 15, '+15 Or de levée par autel')
  assert.equal(emissairesConstructionsJoueur(verte, C) - emis0, 1, '+1 émissaire par autel')
  assert.equal(logementsVille(vV, C, state) - loge0, 15, '+15 Taudis par autel')
  // Merveille : repérable comme déja construite ailleurs (unique au monde).
  assert.deepEqual(merveilleConstruiteAilleurs(state, 'Grand Autel Noirecendre'),
    { joueur: verte.n, villeNom: 'Deux' })
  // Elle buffe TOUTES les villes du joueur : un 2e autel dans vV
  //  ajoute ses 15 Or STRUCTURELS + ses 15 Or de BUFF (+ le buff
  //  rétroactif du 1er autel déjà compté) → delta 15+15+15 = 45.
  batir(vV, 'Autel Eud Guer')
  assert.equal(reductionLeveeArmeeVille(vV, verte, C) - reduc0, 45, '2e autel : own 15 + buff 15 + rétro 15')
})

// ── Démographique I « Crocs et pièges » ──────────────────────────────────

test('Démo I : +5 Chasseurs par rang d\'habitation et +1 Nourriture par Chasseur', () => {
  const { state, verte, vV } = grille()
  const C = cfgOf(state.config)
  const ctx = { state, joueur: verte.n }
  // Un Chasseur contrôlé, roturier (prestige 0) dans la capitale.
  const cible = vivantsDe(state, verte.n, vV.nom).find((x) => !x.metier) ??
    vivantsDe(state, verte.n, vV.nom)[0]
  cible.metier = 'Chasseur'
  cible.prestige = 0
  const gains0 = detailGainsVille(state, verte, vV, C)
  // Cap SANS talent / AVEC talent au même rang (bascule des lauriers :
  //  la base de Chasseurs du rang change avec le rang, on ne compare
  //  jamais deux rangs différents).
  const capSansAvec = (): { sans: number; avec: number } => {
    verte.lauriers = {}
    const sans = capMetierVille('Chasseur', vV, C, ctx)
    verte.lauriers = { 'Démographique': 1 }
    return { sans, avec: capMetierVille('Chasseur', vV, C, ctx) }
  }
  const rang1 = capSansAvec()
  assert.equal(rang1.avec - rang1.sans, 5, 'Hameau (rang 1) : +5 Chasseurs')
  vV.rang = 'Cité'
  const rang2 = capSansAvec()
  assert.equal(rang2.avec - rang2.sans, 10, 'Cité (rang 2) : +5 par rang → +10')
  // +1 Nourriture PAR CHASSEUR et par tour (canal metiers, avant taxes,
  // × multiplicateur de rang social — roturier : ×1).
  const gains1 = detailGainsVille(state, verte, vV, C)
  const nbChasseurs = vivantsDe(state, verte.n, vV.nom).filter((x) => x.metier === 'Chasseur').length
  assert.ok(nbChasseurs >= 1)
  assert.equal((gains1.parMetier['Chasseur']?.['Nourriture'] ?? 0)
    - (gains0.parMetier['Chasseur']?.['Nourriture'] ?? 0), nbChasseurs * 1,
    'chaque Chasseur produit +1 Nourriture')
  // Le talent est porté par le peuple du JOUEUR : le Basiléen n'y a pas droit.
  const basile = state.players[1] as Player
  const vB = basile.villes[0] as City
  const capB0 = capMetierVille('Chasseur', vB, C, { state, joueur: basile.n })
  basile.lauriers = { 'Démographique': 1 }
  assert.equal(capMetierVille('Chasseur', vB, C, { state, joueur: basile.n }) - capB0, 0,
    'pas d\'effet pour un joueur d\'un autre peuple')
})

// ── Démographique III « Autels hurlants » ────────────────────────────────

test('Démo III : +10 Bonheur par Autel Eud Guer, avant le plafond', () => {
  const { state, verte, vV } = grille()
  const C = cfgOf(state.config)
  batir(vV, 'Autel Eud Guer')
  const joie0 = bonheurVilleComplete(state, verte, vV, C)
  assert.ok(joie0 <= 80, `précaution : bonheur de base ${joie0} jamais proche du plafond 100`)
  verte.lauriers = { 'Démographique': 3 }
  assert.equal(bonheurVilleComplete(state, verte, vV, C) - joie0, 10, '+10 par autel')
  batir(vV, 'Autel Eud Guer')
  assert.equal(bonheurVilleComplete(state, verte, vV, C) - joie0, 20, 'deux autels : +20')
})

// ── Militaire I « Jambes de raid » / III « Klan en marche » ──────────────

test('Mil I (plateau) : aucun canal moteur ; Mil III : −10 Or par armée possédée', () => {
  const { state, verte, vV } = grille()
  const C = cfgOf(state.config)
  verte.armees = []
  const prix0 = prixArmee(90, C, vV, verte)
  verte.lauriers = { 'Militaire': 1 }
  assert.equal(talentsActifs(verte, C).length, 1, 'un seul talent actif au palier I')
  assert.equal(prixArmee(90, C, vV, verte), prix0, '+1 PM/+1 armée : règle de plateau, le prix ne bouge pas')
  verte.lauriers = { 'Militaire': 3 }
  assert.ok(talentsActifs(verte, C).length >= 2, 'L1+L3 cumulés au palier III')
  verte.armees = [armee('A1'), armee('A2')]
  assert.equal(prixArmee(90, C, vV, verte), Math.max(0, prix0 - 20), '2 armées possédées : −20 Or')
  verte.armees = [armee('A1')]
  assert.equal(prixArmee(90, C, vV, verte), Math.max(0, prix0 - 10), '1 armée : −10 Or')
  verte.armees = []
  assert.equal(prixArmee(90, C, vV, verte), prix0, 'aucune armée : prix de base')
  // Plancher 0.
  verte.armees = Array.from({ length: 30 }, (_, i) => armee('A' + i))
  assert.equal(prixArmee(90, C, vV, verte), 0, 'plancher 0')
})

// ── Diplomatique I « Serments de sang » ──────────────────────────────────

test('Dipl I : tribut vassal +2 % par Autel Eud Guer (impôt manuel)', () => {
  const { state, verte, basile, vV, vB } = grille()
  const C = cfgOf(state.config)
  // Vassal avec un revenu d'Or (un Commerçant roturier).
  const commis = vivantsDe(state, basile.n, vB.nom).find((x) => !x.metier) ??
    vivantsDe(state, basile.n, vB.nom)[0]
  commis.metier = 'Commerçant'
  commis.prestige = 0
  basile.vassalDe = verte.n
  const base = impotsVassaux(state, verte, C)[0]?.montant ?? 0
  assert.ok(base > 0, 'le vassal reverse bien quelque chose')
  verte.lauriers = { 'Diplomatique': 1 }
  assert.ok(Math.abs((impotsVassaux(state, verte, C)[0]?.montant ?? 0) - base) < 1e-9,
    'aucun autel : montants inchangés')
  batir(vV, 'Autel Eud Guer')
  assert.ok(Math.abs((impotsVassaux(state, verte, C)[0]?.montant ?? 0) - base * 1.02) < 1e-6,
    'un autel : +2 %')
  batir(vV, 'Autel Eud Guer')
  assert.ok(Math.abs((impotsVassaux(state, verte, C)[0]?.montant ?? 0) - base * 1.04) < 1e-6,
    'deux autels : +4 %')
})

// ── Diplomatique III « La peur du klan » ─────────────────────────────────

test('Dipl III : +2 Gardes par Autel ; levée des vassaux +10 Or par rang de pays du suzerain', () => {
  const { state, verte, basile, vV, vB } = grille()
  const C = cfgOf(state.config)
  const ctx = { state, joueur: verte.n }
  // Emplacements de Garde : +2 par Autel (constructions du suzerain).
  const garde0 = capMetierVille('Garde', vV, C, ctx)
  verte.lauriers = { 'Diplomatique': 3 }
  assert.equal(capMetierVille('Garde', vV, C, ctx), garde0, 'sans autel : rien')
  batir(vV, 'Autel Eud Guer')
  assert.equal(capMetierVille('Garde', vV, C, ctx) - garde0, 2, '+2 Gardes par autel')
  batir(vV, 'Autel Eud Guer')
  assert.equal(capMetierVille('Garde', vV, C, ctx) - garde0, 4, 'deux autels : +4')
  // Surcoût de levée du VASSAL, porté par le rang de pays du SUZERAIN.
  basile.vassalDe = verte.n
  basile.armees = []
  const prixV = prixArmee(90, C, vB, basile)
  // Suzerain Baronnie = rang de pays 1 (+10 Or par le talent Dipl III).
  assert.equal(verte.rang, 'Baronnie')
  assert.equal(prixArmee(90, C, vB, basile, verte), prixV + 10, 'Baronnie (rang de pays 1) : +10 Or')
  verte.rang = 'Comté'
  assert.equal(prixArmee(90, C, vB, basile, verte), prixV + 20, 'Comté (rang 2) : +20 Or')
  // Sans le talent, un suzerain d'un autre peuple ne surcharge pas.
  const neutre = { ...verte, peuple: 'Basiléens', lauriers: {} }
  assert.equal(prixArmee(90, C, vB, basile, neutre), prixV, 'suzerain non Peaux-Vertes : aucun surcoût')
})
