// ═══════════════════════════════════════════════════════════════════════════
//  MOCKS DE TEST pour la banque d'effets (refactor 2026-10-18)
//  Une partie minimale 1 joueur / 1 ville, construite avec le MÊME
//  createGame que le moteur (pas de mock de types : les tests valent
//  ce que vaut le vrai état).
// ═══════════════════════════════════════════════════════════════════════════

import type { ContexteEffet } from './types'
import { createGame } from '../engine/setup'
import type { SetupLine } from '../engine/setup'
import { cfgOf } from '../engine/gameData'
import { capitaleDe } from '../engine/factions'
import { rangNiveau, garnisonHabitationVille } from '../engine/regimes'

const SETUP: SetupLine[] = [{
  nom: 'Joueur Test', peuple: 'NORLS', culture: 'Culture Nordique',
  regime: 'Autoritarisme', taillePopulation: 50, pourcentageMariages: 40,
  villes: ['Bergen'],
}]

/** Partie réelle minimale (1 joueur, graine fixe → déterministe). */
export function partieMock(opts?: { peuple?: string; saison?: string; villeRang?: string }): ContexteEffet {
  const state = createGame(SETUP, 42, 'local')
  const joueur = state.players[0]
  if (opts?.peuple) joueur.peuple = opts.peuple
  if (opts?.saison) state.saison = opts.saison as typeof state.saison
  const ville = joueur.villes[0]
  if (opts?.villeRang) ville.rang = opts.villeRang
  // PORTS (vague 2) : les services RÉELS du moteur — les tests
  //  valent ce que vaut la vraie évaluation.
  const C = cfgOf(state.config)
  return {
    state, joueur, ville, saison: state.saison,
    ports: {
      C,
      capitaleDe: (j) => capitaleDe(j),
      rangNiveau: (v) => rangNiveau(v, C),
      garnisonVille: (v) => garnisonHabitationVille(joueur, v, C, state),
    },
  }
}

/** Contexte sans ville (effets joueur seul). */
export function effetVilleMock(): ContexteEffet {
  const ctx = partieMock()
  return { ...ctx, ville: undefined }
}
