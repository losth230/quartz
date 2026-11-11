// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DU CORRECTIF MULTIJOUROUR (2026-11-11) — « le multijoueur ne
//  fonctionne plus »
//
//  INCIDENT RÉEL (constaté en prod, salon chasse-peche5) : depuis le
//  retrait du protocole v1 (audit R5, 2026-10-19 — qui upsertait
//  l'état à chaque mutation et créait donc la ligne du salon au
//  premier save), PLUS AUCUN chemin de code ne créait la ligne
//  parties_chasse_peche d'un nouveau salon :
//   · le créateur lançait la partie (localStorage seul) ;
//   · les joueurs poussaient leurs sections dans cp_events ;
//   · l'Edge Function répondait « salon introuvable » (404) ;
//   · le repli local publiait via un UPDATE sur une ligne
//     inexistante — 0 ligne affectée, AUCUNE erreur → silence ;
//   · le tour n'avançait jamais pour personne (les sections
//     s'accumulent, le joueur 1 de chasse-peche5 a poussé 2 fois).
//
//  LE CORRECTIF : newGame (mode supabase) crée la ligne par un
//  INSERT idempotent — ON CONFLICT (id) DO NOTHING (jamais
//  d'écrasement d'une ligne existante, tour_publie 0 compatible
//  trigger anti-rollback). Contrat verrouillé ici.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ligneCreationSalon } from './client'
import { createGame, defaultSetups } from '../engine/setup'
import { etatReseau } from '../engine/fusion'

function partieTemoin() {
  return createGame(defaultSetups(), 20261111, 'supabase')
}

test('création de salon : la ligne porte le bon id et l\u2019état RÉSEAU (sans cache config)', () => {
  const s = partieTemoin()
  // l'état mémoire PORTE sa config (cache) — la ligne publiée ne
  //  doit PAS la transporter (contrat egress)
  assert.ok(s.config, 'config présente dans l\u2019état mémoire')
  const ligne = ligneCreationSalon('test-salon', s, 'client-x', '2026-11-11T00:00:00Z')
  assert.equal(ligne.id, 'test-salon')
  // l'état publié passe par etatReseau : le cache config n'est
  //  JAMAIS dans le payload réseau (contrat egress 2026-10-20)
  assert.equal((ligne.state as { config?: unknown }).config, undefined,
    'le payload de création n\u2019embarque PAS le cache config')
  assert.deepEqual(ligne.state, etatReseau(s))
})

test('création de salon : tour_publie 0 (trigger anti-rollback compatible), sections vides', () => {
  const s = partieTemoin()
  const ligne = ligneCreationSalon('test-salon', s, 'client-x', '2026-11-11T00:00:00Z')
  assert.equal(ligne.tour_publie, 0, 'le salon naît à tour_publie 0 — l\u2019insert ne déclenche pas la garde anti-rollback')
  assert.deepEqual(ligne.sections, {}, 'sections vides à la création')
  assert.equal(ligne.turn_done, s.turn)
  assert.equal(ligne.updated_by, 'client-x')
  assert.equal(ligne.updated_at, '2026-11-11T00:00:00Z')
})

test('création de salon : la ligne EST un état joignable (loadRemote la relira)', () => {
  // le contrat de bout en bout : ce qui est publié à la création
  //  doit être relisible par un joueur qui REJOINT — l'état réseau
  //  conserve les sections de fusion (players, population…)
  const s = partieTemoin()
  const ligne = ligneCreationSalon('test-salon', s, 'client-x', '2026-11-11T00:00:00Z')
  const publie = ligne.state as unknown as Record<string, unknown>
  assert.ok(Array.isArray(publie.players), 'players présents dans le payload')
  assert.ok(publie.population, 'population présente dans le payload')
  assert.equal(publie.turn, s.turn, 'le tour initial est publié')
})
