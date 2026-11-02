// ═════════════════════════════════════════════════════════════════════════
//  TESTS DU REGISTRE DE L'ORDRE DU TOUR (wiki « Ordre du tour », R3)
//  Le wiki des Référentiels affiche ETAPES_TOUR (components/reference/
//  OngletOrdreTour.tsx) : ce test verrouille le CONTENU du registre —
//  toute évolution de la séquence de runTurn (étape ajoutée,
//  retirée, déplacée) DOIT se refléter ici et dans le registre.
//  Les étapes retirées (événements de saison, cartes dynastie,
//  consommation d'habitations, bonus de faction, progrès) n'y
//  figurent plus : l'historique vit dans git et le journal technique.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ETAPES_TOUR } from './tour'

test('ETAPES_TOUR : le registre du wiki « Ordre du tour » suit runTurn pas à pas (numéros + noms exacts)', () => {
  assert.equal(ETAPES_TOUR.length, 20, '20 étapes actives — toute évolution de runTurn DOIT mettre à jour ce registre')
  assert.deepEqual(
    ETAPES_TOUR.map((e) => e.numero),
    ['1', '2bis', '2ter', '3', '3bis', '3ter', '3quater', '3quinquies', '3quinquies-bis',
      '3sexies', '3septies', '3decies', '3quaterdecies', '3terdecies', '3quindecies',
      '4', '4bis', '5', '6', '7'],
    'numéros historiques : les trous sont des étapes retirées (historique dans git)',
  )
  assert.deepEqual(
    ETAPES_TOUR.map((e) => e.nom),
    ['Changement de saison', 'Gouverneurs automatiques', 'Réaffectation des métiers plafonnés',
      'Gains d\u2019habitants + production de base', 'Vassalité — tribut', 'Crédit des gains au stock',
      'Bâtiments', 'Aménagements (hors été)', 'Nourr — été', 'Autres', 'Lois des cultures + Tourisme',
      'Cités libres', 'Proximité des villes', 'Commerce + Tourisme', 'Pèlerinage — dîme du pontife',
      'Moteur de population', 'Migration par bonheur', 'Armées — recrutement',
      'Snapshot + apports du tour', 'Tour suivant'],
    'noms des étapes (affichés tels quels dans le wiki)',
  )
  // chaque étape a une description non vide
  for (const e of ETAPES_TOUR) {
    assert.ok(e.description.length > 40, `description substantive attendue pour l étape ${e.numero} (${e.nom})`)
  }
})

test('ETAPES_TOUR : l étape du pèlerinage (3quindecies) est APRÈS les productions et AVANT le moteur de population', () => {
  const nums = ETAPES_TOUR.map((e) => e.numero)
  const iPel = nums.indexOf('3quindecies')
  const iProd = nums.indexOf('3terdecies') // dernier canal de production (commerce)
  const iPop = nums.indexOf('4')
  assert.ok(iPel > iProd, 'la dîme porte sur la production réellement créditée ce tour (arbitrage 2026-11-01)')
  assert.ok(iPel < iPop, 'le prélèvement précède le moteur de population')
  const pel = ETAPES_TOUR[iPel]!
  assert.ok(pel.nom.includes('Pèlerinage') && pel.nom.includes('pontife'), 'nom explicite dans le wiki')
  assert.ok(pel.description.includes('pelerinageTaux'), 'le paramètre du taux est cité')
})
