// ═══════════════════════════════════════════════════════════════════════════
//  MERVEILLES NATURELLES (fiches arbitre 2026-10-25)
//  Tier SPÉCIAL des aménagements : aménageables comme un aménagement
//  de base (coût uniforme 12 Or + 5 Bois), JAMAIS améliorables.
//
//  Les 10 merveilles et leurs effets :
//   · Caverne de la tisseuse : +1 Soie PAR RANG d'habitation (effetsParRang)
//   · Jardins Flamboyants : +10 Bonheur (bonheurApporte)
//   · Pic Ascendant : +1 Science/tour (flux) + siège −30 (effetPlateau)
//   · Ruines de Seth : +2 Or, +10 Tourisme (flux)
//   · Sépulcre du Rayonnant : +20 Garnison (état) + 10 Taudis (logements)
//   · Trésor du roi sorcier : +1 route commerciale (routesApportees)
//   · Coeur Ancestral : +1 émissaire (emissairesApportes — plateau)
//   · Echine du dragon : +1 Charbon, +1 Fer (flux)
//   · Pilliers Célestes : armées +1 PM (effetPlateau)
//   · Antre de Magmadon : levée d'armée −15 Or (reductionLeveeArmee)
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import type { City, GameState, Player } from './types'
import { coutConstructionRef, resumeConstruction } from './constructions'
import { effetsAmenagementsVille } from './amenagements'
import { garnisonHabitationVille } from './garnisons'
import { bonheurApportesVille } from './bonheur'
import { maxRoutesJoueur } from './commerce'
import { reductionLeveeBatiments } from './constructions'
import { emissairesConstructionsJoueur } from './batiments'

function partieTemoin(): { state: GameState; p: Player; ville: City; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 20261025, 'local')
  return { state, p: state.players[0], ville: state.players[0].villes[0], C }
}

const MN = [
  'Caverne de la tisseuse', 'Jardins Flamboyants', 'Pic Ascendant',
  'Ruines de Seth', 'Sépulcre du Rayonnant', 'Trésor du roi sorcier',
  'Coeur Ancestral', 'Echine du dragon', 'Pilliers Célestes', 'Antre de Magmadon',
]

test('merveilles naturelles : les 10 existent, catégorie Aménagement, coût uniforme, jamais améliorables', () => {
  const { C } = partieTemoin()
  const refs = C.config.constructions.filter((c) => c.merveilleNaturelle)
  assert.equal(refs.length, 10, 'exactement 10 merveilles naturelles')
  assert.deepEqual(refs.map((r) => r.nom).sort(), [...MN].sort())
  for (const r of refs) {
    assert.equal(r.categorie, 'Aménagement', 'aménageables comme un aménagement de base')
    assert.equal(r.groupe, 'Merveille naturelle')
    assert.ok(!r.remplaceAmenagement, 'JAMAIS améliorables')
    assert.equal(r.rangMinHabitation, undefined, 'constructibles dès le rang 1')
    assert.deepEqual(coutConstructionRef(r), { Or: 12, Bois: 5 }, 'coût uniforme 12 Or + 5 Bois')
  }
})

test('Caverne de la tisseuse : +1 Soie PAR RANG (Hameau 1, Cité 2, Grande Cité 3)', () => {
  const { ville, C } = partieTemoin()
  ville.amenagements = ['Caverne de la tisseuse']
  const hameau = effetsAmenagementsVille(ville, C.config)
  assert.equal(hameau['Soie'] ?? 0, 1, 'rang 1 (Hameau) : +1 Soie')
  ville.rang = 'Cité'
  const cite = effetsAmenagementsVille(ville, C.config)
  assert.equal(cite['Soie'] ?? 0, 2, 'rang 2 (Cité) : +2 Soie')
  ville.rang = 'Grande Cité'
  const grande = effetsAmenagementsVille(ville, C.config)
  assert.equal(grande['Soie'] ?? 0, 3, 'rang 3 (Grande Cité) : +3 Soie')
})

test('Jardins Flamboyants : +10 Bonheur dans l\u2019habitation', () => {
  const { ville, C } = partieTemoin()
  assert.equal(bonheurApportesVille(ville, C), 0, 'sans merveille : aucun bonus')
  ville.amenagements = ['Jardins Flamboyants']
  assert.equal(bonheurApportesVille(ville, C), 10, '+10 avec les Jardins')
})

test('Pic Ascendant, Ruines de Seth, Echine du dragon : flux par tour', () => {
  const { ville, C } = partieTemoin()
  ville.amenagements = ['Pic Ascendant', 'Ruines de Seth', 'Echine du dragon']
  const f = effetsAmenagementsVille(ville, C.config)
  assert.equal(f['Science'] ?? 0, 1)
  assert.equal(f['Or'] ?? 0, 2)
  assert.equal(f['Tourisme'] ?? 0, 10)
  assert.equal(f['Charbon'] ?? 0, 1)
  assert.equal(f['Fer'] ?? 0, 1)
})

test('Sépulcre du Rayonnant : +20 Garnison (état) et +10 Taudis (logements)', () => {
  const { p, ville, C } = partieTemoin()
  // sans state : les malus de lois culturelles (Ferveur martiale,
  //  Guerres saintes) ne s'appliquent pas — on isole l'apport pur.
  const sans = garnisonHabitationVille(p, ville, C)
  ville.amenagements = ['Sépulcre du Rayonnant']
  const avec = garnisonHabitationVille(p, ville, C)
  assert.equal(avec - sans, 20, 'la Garnison d\u2019état des aménagements compte')
  // +10 Taudis au parc de logements
  const sep = C.config.constructions.find((c) => c.nom === 'Sépulcre du Rayonnant')
  assert.deepEqual(sep?.domicilesApportes, [{ domicile: 'Taudis', nombre: 10 }])
})

test('Trésor du roi sorcier : +1 route commerciale au cap du joueur', () => {
  const { p, ville, C } = partieTemoin()
  const sans = maxRoutesJoueur(p, C)
  ville.amenagements = ['Trésor du roi sorcier']
  const avec = maxRoutesJoueur(p, C)
  assert.equal(avec - sans, 1, 'les routes apportées par les AMÉNAGEMENTS comptent')
})

test('Antre de Magmadon : −15 Or sur la levée DANS cette habitation', () => {
  const { ville, C } = partieTemoin()
  assert.equal(reductionLeveeBatiments(ville, C), 0, 'sans merveille : aucune réduction')
  ville.amenagements = ['Antre de Magmadon']
  assert.equal(reductionLeveeBatiments(ville, C), 15, 'la réduction des aménagements compte')
})

test("Coeur Ancestral : +1 émissaire — champ emissairesApportes ET compté dans la réserve mobilisable (bug 2026-11-12)", () => {
  const { p, ville, C } = partieTemoin()
  const coeur = C.config.constructions.find((c) => c.nom === 'Coeur Ancestral')
  assert.equal(coeur?.emissairesApportes, 1, 'le champ référentiel vaut +1')
  assert.equal(emissairesConstructionsJoueur(p, C), 0, 'sans merveille : bonus 0')
  // BUG 2026-11-12 (retour Thibaut) : le Coeur Ancestral est une
  //  MERVEILLE NATURELLE = AMÉNAGEMENT — il vit dans
  //  ville.amenagements, jamais dans ville.batiments : l'ancien
  //  comptage (bâtiments seuls) ne le voyait pas et le +1 n'était
  //  crédité NULLE PART (référentiel et picker corrects, réserve
  //  mobilisable aveugle).
  ville.amenagements = ['Coeur Ancestral']
  assert.equal(emissairesConstructionsJoueur(p, C), 1,
    "l'aménagement (merveille) est compté dans la réserve mobilisable")
})

test('Pic Ascendant et Pilliers Célestes : effets de PLATEAU en italique (*…*)', () => {
  const { C } = partieTemoin()
  const pic = resumeConstruction(
    C.config.constructions.find((c) => c.nom === 'Pic Ascendant'), C.config)
  assert.ok(pic.includes('*'), `le siège s'affiche enveloppé du marqueur italique (${pic})`)
  const pilliers = resumeConstruction(
    C.config.constructions.find((c) => c.nom === 'Pilliers Célestes'), C.config)
  assert.ok(pilliers.includes('+1 PM'), 'le +1 PM est visible')
  assert.ok(pilliers.includes('*'), 'en italique (effet de plateau)')
})
