// ═══════════════════════════════════════════════════════════════════════════
//  TESTS ARMÉES — arbitrage Thibaut 2026-10-28 « les armées rejoignent la
//  banque » :
//
//   · PUISSANCES (Soldat 15 / Commandant 45) et ÂGES de recrutement
//     (16-30 ans) vivent sur les LIGNES DE MÉTIER du référentiel
//     (champs puissanceArmee / ageMin / ageMax) — la migration
//     armeesBanque2026 sème les configs sauvegardées depuis les
//     paramètres, et les 4 paramètres historiques restent des REFLIS ;
//   · les RÉDUCTIONS DE LEVÉE (Terrain d'entrainement : 10, Ecole
//     militaire : 25, Guilde des explorateurs : 20, Grande caserne :
//     8) vivent sur les FICHES DE CONSTRUCTION (champ
//     reductionLeveeArmee), passent par le CANAL de banque
//     reductionLeveeArmee et se lisent par reductionLeveeBatiments
//     pour la ville de levée ;
//   · le flag mort prochaineArmeeReduite (−50 Or, ex-tech, sans
//     producteur depuis le 2026-10-24) est RETIRÉ : un champ résiduel
//     d'une vieille sauvegarde est ignoré (arbitrage Thibaut
//     2026-10-28).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, type SetupLine } from './setup'
import type { Character, Army } from './types'
import { cfgOf } from './gameData'
import { makeRng } from './rng'
import {
  puissanceArmeeMetier, agesRecrutementSoldat,
  recruitForArmies, prixArmee,
  infligerPertes, libererSoldats,
} from './armees'
import {
  constructionRef, resumeConstruction,
  reductionLeveeBatiments, contexteLectureSeule,
} from './constructions'
import { reglePourConstruction } from '../rules/registry'
import { appliquerRegles } from '../rules/effects/banque'
import { cloneDefaultConfig } from '../config/defaultConfig'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['Capitale'],
}]

/** Personnage de test complet (même gabarit que taxes.test.ts). */
function perso(id: string, age: number, o: { metier?: string | null; ville?: string } = {}): Character {
  return {
    id, nom: 'Test', prenom: `Pers-${id}`, dynastie: 'Roturier', sexe: 'M', age,
    culture: 'Déisme', ville: o.ville ?? 'Capitale', orientation: 'Hétérosexuel',
    traits: ['Obstiné', 'Stérile', 'Fécond'], statut: 'Sain', mariage: null, mariageId: null,
    mere: null, mereId: null, pere: null, pereId: null,
    pereBio: null, pereBioId: null, enfantBatard: false,
    metier: o.metier ?? null, fecondite: 0, armee: null,
  }
}

function partie() {
  return createGame(SETUP, 20261028, 'local')
}

/** Ligne de métier du référentiel courant (par nom de métier). */
function ligneMetier(C: ReturnType<typeof cfgOf>, nom: string) {
  const ligne = C.config.metiers.find((m) => m.metier === nom)
  assert.ok(ligne, `métier « ${nom} » introuvable dans le référentiel`)
  return ligne
}

test('défauts du référentiel : Soldat 15 pts, Commandant 45 pts, recrutement 16-30 ans', () => {
  const state = partie()
  const C = cfgOf(state.config)
  assert.equal(puissanceArmeeMetier(C.p.metierSoldat, C, 0), 15, 'Soldat : 15 pts d armée')
  assert.equal(puissanceArmeeMetier(C.p.metierCommandant, C, 0), 45, 'Commandant : 45 pts d armée')
  assert.deepEqual(agesRecrutementSoldat(C), { min: 16, max: 30 }, 'bornes d âge portées par la ligne Soldat')
})

// (RETRAIT 2026-10-28, 2e retour arbitre « les pertes baissent encore
//  l'armée à 45 » : recomputeArmy — dérivation « soldats × pts +
//  commandant » — est SUPPRIMÉ du moteur : il écrasait la puissance
//  stockée d'une armée de plateau dont les recrues réelles ne
//  couvraient qu'une fraction des points. La prime de la ligne de
//  métier ÉDITÉE (fiche > paramètre) reste couverte par le test de
//  pertes « ligne de métier ÉDITÉE prime » ci-dessous.)

test('repli param : ligne de métier SANS champ → paramètre historique', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const soldat = ligneMetier(C, C.p.metierSoldat)
  delete soldat.puissanceArmee
  // Le repli est le paramètre historique (refli de compat) — la
  //  migration armeesBanque2026 complète les configs sauvegardées, une
  //  ligne éditée à la main sans le champ retombe dessus.
  assert.equal(puissanceArmeeMetier(C.p.metierSoldat, C, C.p.puissanceSoldat), C.p.puissanceSoldat)
  assert.equal(C.p.puissanceSoldat, 15, 'paramètre de repli : 15')
  delete soldat.ageMin
  delete soldat.ageMax
  assert.deepEqual(agesRecrutementSoldat(C), { min: C.p.soldatAgeMin, max: C.p.soldatAgeMax })
  assert.deepEqual({ min: C.p.soldatAgeMin, max: C.p.soldatAgeMax }, { min: 16, max: 30 })
})

test('recruitForArmies : bornes d âge de la ligne Soldat (31 ans exclu par défaut, recruté si ageMax édité)', () => {
  const state = partie()
  const p = state.players[0]
  const C = cfgOf(state.config)
  state.population[p.n] = [perso('jeune', 20), perso('vieux', 31)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 30, puissance: 0,
    commandant: null, soldats: [],
  }
  p.armees = [armee]
  recruitForArmies(state, p, makeRng(20261028))
  // Par défaut la ligne Soldat porte ageMax 30 : le candidat de 31 ans
  //  n'est PAS recruté, celui de 20 l'est.
  assert.deepEqual(armee.soldats, ['jeune'], 'seul le candidat de 20 ans rejoint l armée')
  assert.equal(armee.puissance, 15)
  const jeune = state.population[p.n].find((c) => c.id === 'jeune')!
  assert.equal(jeune.metier, C.p.metierSoldat, 'la recrue devient Soldat')
  assert.equal(jeune.armee, 'Légion')
  // ageMax édité à 40 sur la ligne : le candidat de 31 ans est recruté
  ligneMetier(C, C.p.metierSoldat).ageMax = 40
  recruitForArmies(state, p, makeRng(20261028))
  assert.ok(armee.soldats.includes('vieux'), 'borne d âge éditée : le candidat de 31 ans passe')
  assert.equal(armee.puissance, 30, '2 soldats × 15 = 30 (puissance cible atteinte)')
})

// (CORRECTIF audit a2 du 2026-10-30 : le dernier recrutement ne
//  franchit plus la puissance cible — la recrue n'est engagée que
//  si ses points TIENNENT dans la cible.)
test('recruitForArmies : le dernier recrutement ne FRANCHIT plus la cible (audit a2)', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [perso('s1', 20), perso('s2', 21), perso('s3', 22)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 50, puissance: 40,
    commandant: null, soldats: [],
  }
  p.armees = [armee]
  // stockée 40, cible 50 : une recrue (15 pts) porterait à 55 > 50
  // → AUCUNE recrue engagée, la stockée ne franchit pas la cible
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 40, 'la stockée reste à 40 : une recrue l aurait portée à 55, au-delà de la cible 50')
  assert.equal(armee.soldats.length, 0, 'aucune recrue : elle ne tiendrait pas dans la cible')
  assert.ok(state.population[p.n].every((c) => c.armee === null), 'aucun habitant enrôlé')
  // cible 70 (écart 30 = 2 × 15, aligné) : comportement inchangé
  armee.puissanceCible = 70
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 70, 'écart aligné (2 × 15) : la cible est atteinte comme avant')
  assert.equal(armee.soldats.length, 2)
  // cible 75 depuis 70 : l'écart restant (5) < Soldat (15) → rien
  armee.puissanceCible = 75
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 70, 'l armée reste juste SOUS la cible : le Soldat est indivisible')
  assert.equal(armee.soldats.length, 2)
})

test('prixArmee : 1 Or / 2 pts ; réductions de levée des bâtiments de la ville (banque), plancher 0', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const ville4 = {
    batiments: ["Terrain d'entrainement", 'Ecole militaire', 'Guilde des explorateurs', 'Grande caserne'],
  }
  // Sans ville : prix de base du paramètre (armeePrixOr / armeePriXPuissance)
  assert.equal(prixArmee(90, C), 45, '90 pts = 45 Or sans bâtiment')
  assert.equal(prixArmee(0, C), 0, 'puissance nulle = gratuit')
  // Les 4 fiches de réduction (10 + 25 + 20 + 8 = 63 Or) passent par
  //  le canal de banque de la ville de levée.
  assert.equal(reductionLeveeBatiments(ville4, C), 63, 'somme des 4 fiches = 63 Or')
  assert.equal(prixArmee(90, C, ville4), 0, '45 − 63 → plancher 0 Or')
  assert.equal(prixArmee(200, C, ville4), 37, '100 − 63 = 37 Or')
  // Une fiche ÉDITÉE dans Référentiels prime (config nouvelle → règles
  //  de banque reconstruites à la lecture).
  const C2 = cfgOf(cloneDefaultConfig())
  const ecole = C2.config.constructions.find((c) => c.nom === 'Ecole militaire')!
  ecole.reductionLeveeArmee = 5
  assert.equal(reductionLeveeBatiments(ville4, C2), 10 + 5 + 20 + 8, 'Ecole militaire éditée : réduction 43 Or')
  assert.equal(prixArmee(200, C2, ville4), 57, '100 − 43 = 57 Or')
})

test('registre & banque : le Terrain d entrainement porte l effet reductionLeveeArmee 10, canal de contribution', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const ref = constructionRef("Terrain d'entrainement", C.config)
  assert.ok(ref, 'fiche Terrain d entrainement introuvable')
  const regle = reglePourConstruction(ref!, C)
  assert.ok(regle, 'le Terrain d entrainement porte une règle de banque')
  assert.deepEqual(
    regle!.effets.find((e) => e.type === 'reductionLeveeArmee'),
    { type: 'reductionLeveeArmee', valeur: 10 },
    'l effet reductionLeveeArmee vaut 10',
  )
  // Le canal de contribution agrège l'effet comme un flux.
  const out = appliquerRegles([regle!], contexteLectureSeule())
  assert.equal(out.reductionLeveeArmee, 10, 'canal reductionLeveeArmee de la contribution')
  // Et la lecture « ville » d'un seul bâtiment rend la même valeur.
  assert.equal(reductionLeveeBatiments({ batiments: ["Terrain d'entrainement"] }, C), 10)
})

test('resumeConstruction : la réduction de levée figure dans le résumé (« levée d armée −10 Or »)', () => {
  const state = partie()
  const C = cfgOf(state.config)
  const resume = resumeConstruction(constructionRef("Terrain d'entrainement", C.config), C.config)
  assert.ok(resume.includes('levée d\u2019armée −10 Or') || resume.includes("levée d'armée −10 Or"), `résumé : « ${resume} »`)
})

test('flag mort prochaineArmeeReduite : un champ résiduel d une vieille sauvegarde est ignoré', () => {
  const state = partie()
  const C = cfgOf(state.config)
  // (RETRAIT 2026-10-28, arbitrage Thibaut : le flag est supprimé du
  //  type ; une vieille sauvegarde peut encore porter la clé — le
  //  prix de levée ne doit PAS en tenir compte.)
  ;(state.players[0] as unknown as { prochaineArmeeReduite?: boolean }).prochaineArmeeReduite = true
  assert.equal(prixArmee(90, C), 45, 'aucune réduction fantôme de 50 Or')
})

// ═════════════════════════════════════════════════════════════════════════
//  LA PUISSANCE STOCKÉE FAIT FOI (arbitrage Thibaut 2026-10-28, 2e
//  retour « les pertes baissent ENCORE l'armée à 45 ») :
//
//   · PLUS AUCUNE DÉRIVATION (recomputeArmy RETIRÉ) : la puissance
//     stockée — valeur de plateau — n'est JAMAIS recalculée depuis
//     les soldats, l'armée en suive ou non ;
//   · pertes et fin de service : SOUSTRACTIVES sur la puissance ET
//     la puissance CIBLE (nb × points du soldat, + points du
//     commandant s'il tombe) — pas de remplissage automatique au
//     tour suivant (retour arbitre explicite) ;
//   · les soldats réellement suivis meurent (pertes) ou
//     redeviennent Chasseurs (fin de service), jusqu'à nb ;
//   · L'ARMÉE EST LIÉE À LA POPULATION (3e retour 2026-10-28) :
//     au-delà des soldats suivis, le complément est pris parmi
//     les candidats RECRUTABLES (vivants, âges du Soldat, sans
//     armée, métier libre ou Chasseur) — tués (pertes) ou
//     re-titrés Chasseurs (fin de service) ; le pool épuisé,
//     les points seuls baissent ;
//   · le RENFORT (levée au sein de l'armée) relève la cible, le
//     recrutement comble l'écart — les recrues AUGMENTENT la
//     stockée de leurs points, sans jamais la re-dériver.
// ═════════════════════════════════════════════════════════════════════════

test('pertes armée SUIVIE : soldats réels tués, −30 sur la puissance ET la cible', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [
    perso('s1', 20), perso('s2', 25), perso('s3', 28),
    perso('c1', 40), // commandant vivant
  ]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 90, puissance: 90,
    commandant: 'c1', soldats: ['s1', 's2', 's3'],
  }
  p.armees = [armee]
  const tombes = infligerPertes(state, p, 0, 2)
  assert.equal(armee.puissance, 60, '90 − 2 × 15 = 60 (pas de dérivation)')
  assert.equal(armee.puissanceCible, 60, 'la cible suit : pas de remplissage au tour suivant')
  assert.equal(tombes.length, 2, '2 soldats réels tués dans l ordre d engagement')
  assert.equal(armee.soldats.length, 1, 'il reste un soldat')
  // 1 perte + commandant coché : −15 −45 → plancher 0 sur les DEUX
  infligerPertes(state, p, 0, 1, true)
  assert.equal(armee.puissance, 0, '60 − 15 − 45 = 0')
  assert.equal(armee.puissanceCible, 0, 'la cible suit jusqu au plancher')
  assert.equal(armee.commandant, null)
  assert.equal(state.population[p.n].find((c) => c.id === 's3')!.statut, 'Sain', 'le dernier soldat survit : nb est consommé par le commandant')
})

test('BUG DU SOIR (régression) : armée de plateau 200 + 2 recrues de renfort → pertes 2 → 200, PAS 45', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [perso('c1', 40), perso('s1', 20), perso('s2', 21)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 230, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  // renfort de +30 : le recrutement comble par 2 recrues réelles
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 230, 'stockée 200 + 2 × 15 = 230')
  assert.equal(armee.soldats.length, 2, 'l armée suit ses 2 recrues')
  // les pertes tuent les 2 recrues : la stockée, PAS une dérivation,
  //  donne la puissance restante (l ancienne dérivation donnait 45)
  const tombes = infligerPertes(state, p, 0, 2)
  assert.equal(tombes.length, 2)
  assert.equal(armee.puissance, 200, '230 − 2 × 15 = 200, PAS 45')
  assert.equal(armee.puissanceCible, 200, 'la cible suit les pertes')
  // et PAS de remplissage automatique au tour suivant
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 200, 'cible atteinte : aucune recrue')
  assert.deepEqual(armee.soldats, [], 'l armée ne se re-remplit pas')
})

test('pertes armée NON SUIVIE : l armée est LIÉE à la population — les pertes tuent de VRAIS habitants (3e retour)', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [
    perso('c1', 40), // commandant, 40 ans : PAS candidat
    perso('d1', 22, { metier: 'Dirigeant' }), // métier tenu : PAS candidat
    perso('j1', 18), perso('j2', 22), // recrutables (métier libre)
    perso('o1', 35), // 35 ans : hors des âges du Soldat
    perso('j3', 25, { metier: 'Chasseur' }), // Chasseur : candidat
  ]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 200, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  const tombes = infligerPertes(state, p, 0, 2)
  assert.equal(armee.puissance, 170, '2 pertes = −2 × 15 → 170, PAS 45')
  assert.equal(armee.puissanceCible, 170, 'la cible suit')
  assert.deepEqual(tombes, ['Pers-j1 Test', 'Pers-j2 Test'], '2 VRAIS habitants tués, ordre du recensement')
  const byId = (id: string) => state.population[p.n].find((c) => c.id === id)!
  assert.equal(byId('j1').statut, 'Décédé')
  assert.equal(byId('j2').statut, 'Décédé')
  assert.equal(byId('j3').statut, 'Sain', 'le Chasseur survit : seules 2 pertes')
  assert.equal(byId('d1').statut, 'Sain', 'le Dirigeant ne meurt pas au front')
  assert.equal(byId('o1').statut, 'Sain', 'hors des âges du Soldat')
  assert.equal(byId('c1').statut, 'Sain', 'le commandant est intact')
  // le pool s épuise : j3 tombe, puis les points SEULS baissent
  const tombes2 = infligerPertes(state, p, 0, 3)
  assert.equal(armee.puissance, 125, '170 − 3 × 15 = 125')
  assert.equal(armee.puissanceCible, 125, 'la cible suit')
  assert.deepEqual(tombes2, ['Pers-j3 Test'], 'le dernier candidat tombe')
  const tombes3 = infligerPertes(state, p, 0, 2)
  assert.equal(armee.puissance, 95, 'pool épuisé : 125 − 2 × 15 = 95, points seuls')
  assert.deepEqual(tombes3, [], 'plus personne de tué')
  // commandant tué EN PLUS : ses points s ajoutent aux pertes
  const tombes4 = infligerPertes(state, p, 0, 1, true)
  assert.equal(armee.puissance, 35, '95 − 15 − 45 = 35')
  assert.equal(armee.puissanceCible, 35, 'la cible suit, commandant compris')
  assert.equal(armee.commandant, null)
  assert.equal(byId('c1').statut, 'Décédé', 'le commandant, lui, est un personnage réel')
  assert.deepEqual(tombes4, ['Pers-c1 Test'])
})

test('pertes armée SUIVIE au-delà des soldats suivis : le complément vient de la population (3e retour)', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [
    perso('s1', 20), // soldat suivi
    perso('j1', 18), perso('j2', 22), // candidats
    perso('d1', 25, { metier: 'Dirigeant' }), // PAS candidat
    perso('c1', 40), // commandant
  ]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 90, puissance: 90,
    commandant: 'c1', soldats: ['s1'],
  }
  p.armees = [armee]
  const tombes = infligerPertes(state, p, 0, 3)
  assert.equal(armee.puissance, 45, '90 − 3 × 15 = 45')
  assert.equal(armee.puissanceCible, 45, 'la cible suit')
  assert.deepEqual(tombes, ['Pers-s1 Test', 'Pers-j1 Test', 'Pers-j2 Test'], 'soldat suivi d abord, puis candidats recrutables')
  assert.deepEqual(armee.soldats, [], 'le tué est retiré des suivis')
  const byId = (id: string) => state.population[p.n].find((c) => c.id === id)!
  assert.equal(byId('j1').statut, 'Décédé')
  assert.equal(byId('j2').statut, 'Décédé')
  assert.equal(byId('d1').statut, 'Sain', 'le Dirigeant ne meurt pas au front')
  assert.equal(byId('c1').statut, 'Sain', 'le commandant survit')
})

test('fin de service : soustractive sur la puissance ET la cible, suivie ou non', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [
    perso('s1', 20), perso('s2', 25), perso('s3', 28),
    perso('c1', 40),
  ]
  // armée suivie : les libérés redeviennent Chasseurs, vivants
  const armee: Army = {
    nom: 'Légion', puissanceCible: 90, puissance: 90,
    commandant: 'c1', soldats: ['s1', 's2', 's3'],
  }
  p.armees = [armee]
  const liberes = libererSoldats(state, p, 0, 2)
  assert.equal(armee.puissance, 60, '90 − 2 × 15 = 60')
  assert.equal(armee.puissanceCible, 60, 'la cible suit')
  assert.equal(liberes.length, 2)
  const s1 = state.population[p.n].find((c) => c.id === 's1')!
  assert.equal(s1.statut, 'Sain', 'libéré vivant')
  assert.equal(s1.metier, 'Chasseur', 're-titré Chasseur (convention Dissoudre)')
  // armée non suivie : seulement les points baissent
  const armee2: Army = {
    nom: 'Garde', puissanceCible: 200, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees.push(armee2)
  const liberes2 = libererSoldats(state, p, 1, 2, true)
  assert.equal(armee2.puissance, 125, '200 − 2 × 15 − 45 (commandant) = 125')
  assert.equal(armee2.puissanceCible, 125, 'la cible suit')
  assert.equal(armee2.commandant, null)
  const c1 = state.population[p.n].find((c) => c.id === 'c1')!
  assert.equal(c1.statut, 'Sain', 'le commandant libéré reste vivant')
  assert.equal(c1.metier, 'Chasseur', 'il redevient Chasseur')
  // (3e retour 2026-10-28 : l'armée est liée à la population — la
  //  2e démobilisation vient du complément recrutable : s1, déjà
  //  Chasseur depuis la libération ci-dessus, quitte la vie civile.)
  assert.deepEqual(liberes2, ['Pers-c1 Test', 'Pers-s1 Test'], 'commandant + 1 candidat recratable')
  const s1b = state.population[p.n].find((c) => c.id === 's1')!
  assert.equal(s1b.statut, 'Sain', 'le candidat libéré reste vivant')
  assert.equal(s1b.metier, 'Chasseur', 're-titré Chasseur')
})

test('ligne de métier ÉDITÉE prime : soldat 20 pts → pertes 2 = −40', () => {
  const state = partie()
  const p = state.players[0]
  const C = cfgOf(state.config)
  ligneMetier(C, C.p.metierSoldat).puissanceArmee = 20
  state.population[p.n] = [perso('c1', 40)]
  const armee: Army = {
    nom: 'Légion', puissanceCible: 100, puissance: 100,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  infligerPertes(state, p, 0, 2)
  assert.equal(armee.puissance, 60, '100 − 2 × 20 = 60 : la fiche édité fait foi')
  assert.equal(armee.puissanceCible, 60)
})

test('commandant mort entre deux tours : détaché, −45 sur la stockée ; le recrutement ne re-dérive RIEN', () => {
  const state = partie()
  const p = state.players[0]
  state.population[p.n] = [perso('c1', 40)]
  state.population[p.n][0].statut = 'Décédé'
  const armee: Army = {
    nom: 'Légion', puissanceCible: 200, puissance: 200,
    commandant: 'c1', soldats: [],
  }
  p.armees = [armee]
  // aucun candidat : la vacance du commandant reste visible
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.commandant, null, 'le commandant mort est détaché')
  assert.equal(armee.puissance, 155, 'stockée − points du commandant : 200 − 45')
  assert.equal(armee.puissanceCible, 200, 'la cible est intacte : la vacance se comble par recrutement')
  // des candidats arrivent : les recrues comblent l écart SANS
  //  jamais re-dériver la stockée
  state.population[p.n].push(perso('s1', 20), perso('s2', 21), perso('s3', 22))
  recruitForArmies(state, p, makeRng(20261028))
  assert.equal(armee.puissance, 200, '155 + 3 × 15 = 200')
  assert.equal(armee.soldats.length, 3, '3 recrues comblent la vacance du commandant')
})