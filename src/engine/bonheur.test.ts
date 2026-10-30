// ═══════════════════════════════════════════════════════════════════════════
//  TESTS BONHEUR — formules v3 (arbitrages Thibaut 2026-10-24)
//   · optimum symétrique : 100 si offre = demande, malus identique
//     manque/excès (±25 % → 75, ×2 → 0) ;
//   · logement par habitant ; sécurité cible 100×rang ;
//   · santé 100 − % malades ; tourisme part du mondial ;
//   · moyenne simple.
//  Scénarios ville : partie réelle (createGame), variations ciblées
//  — même patron que scripts/sim-bonheur.ts (sorties simulées).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import {
  scoreOptimum, scoreSante, scoreTourisme, bonheurVille,
  scoresVille, bonheurVilleComplete, bonheurJoueur, logementsVille,
} from './bonheur'
import type { GameState, Player, City } from './types'

function partieTemoin(): { state: GameState; p: Player; ville: City; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 424242, 'local')
  const p = state.players[0]
  return { state, p, ville: p.villes[0], C }
}

// ── Formules pures ───────────────────────────────────────────────────

test('optimum : 100 seulement à offre = demande exacte', () => {
  assert.equal(scoreOptimum(100, 100), 100)
  assert.equal(scoreOptimum(0, 0), 100)        // pas de demande → 100 si pas d'offre
  assert.equal(scoreOptimum(50, 0), 0)         // offre sans demande → 0
})

test('optimum : malus SYMÉTRIQUE manque/excès (arbitrage v3)', () => {
  assert.equal(scoreOptimum(75, 100), 75)      // −25 % → 75
  assert.equal(scoreOptimum(125, 100), 75)     // +25 % → 75 aussi
  assert.equal(scoreOptimum(50, 100), 50)
  assert.equal(scoreOptimum(150, 100), 50)     // ×1,5 → 50 (symétrie avec 2/3)
  assert.equal(scoreOptimum(200, 100), 0)      // ×2 → 0 (arbitrage v3 : « 0 à 2 fois »)
  assert.equal(scoreOptimum(0, 100), 0)
  assert.equal(scoreOptimum(300, 100), 0)      // 3× → 0 (excès massif = gaspillage)
})

test('santé : 100 − pourcentage de malades (linéaire)', () => {
  assert.equal(scoreSante(0, 100), 100)
  assert.equal(scoreSante(5, 100), 95)
  assert.equal(scoreSante(30, 100), 70)
  assert.equal(scoreSante(100, 100), 0)
  assert.equal(scoreSante(0, 0), 100)          // ville vide : pas de malades
})

test('tourisme : part du joueur dans le mondial, plafonnée', () => {
  assert.equal(scoreTourisme(0, 0), 0)         // personne ne produit → 0
  assert.equal(scoreTourisme(80, 80), 100)     // seul au monde
  assert.equal(scoreTourisme(10, 80), 13)      // part relative
  assert.equal(scoreTourisme(160, 80), 100)    // plafonné (cas anormal)
})

test('bonheur : moyenne simple des 5 facteurs', () => {
  assert.equal(bonheurVille({ emploi: 100, logement: 100, securite: 100, tourisme: 100, sante: 100 }), 100)
  assert.equal(bonheurVille({ emploi: 0, logement: 0, securite: 0, tourisme: 0, sante: 0 }), 0)
  assert.equal(bonheurVille({ emploi: 50, logement: 50, securite: 50, tourisme: 50, sante: 50 }), 50)
  // moyenne non arrondie → arrondi au plus proche
  assert.equal(bonheurVille({ emploi: 60, logement: 60, securite: 60, tourisme: 60, sante: 61 }), 60)
})

// ── Ville réelle : données et scores ─────────────────────────────────

test('logementsVille : parse du texte domicilesDisponibles du rang', () => {
  const { ville, C } = partieTemoin()
  const l = logementsVille(ville, C)
  assert.ok(l > 0, `logements attendus pour le rang (trouvé ${l})`)
  // « 50 maisons, 10 Auberge » → 60 (selon le référentiel courant)
  assert.ok([50, 60, 10].some((v) => v <= l), 'au moins des maisons comptées')
})

test('scoresVille : partie témoin tour 1 — tous les scores dans [0, 100]', () => {
  const { state, p, ville, C } = partieTemoin()
  const s = scoresVille(state, p, ville, C)
  for (const [k, v] of Object.entries(s)) {
    assert.ok(v >= 0 && v <= 100, `${k} = ${v} hors bornes`)
  }
  // valeurs simulées v3 (sortie sim-bonheur) : témoin ≈ 54/87/15/0/100
  //  — on vérifie les ordres de grandeur stables, pas l'égalité stricte
  //  (le référentiel peut évoluer).
  assert.ok(s.sante === 100, 'aucun malade au tour 1')
  assert.ok(s.tourisme === 0, 'tourisme nul au tour 1 (4 mondial, part < 1 %)')
})

test('scoresVille : variations ciblées reprennent les scénarios simulés', () => {
  const { state, p, ville, C } = partieTemoin()
  const pop = (state.population[p.n] ?? []).filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom)
  // ÉPIDÉMIE 30 % : santé 70 (statut 'Malade', cf. types.ts Statut)
  const maladesChoisis = pop.filter((c) => c.statut === 'Sain').slice(0, Math.round(pop.length * 0.3))
  const anciensStatuts = new Map(maladesChoisis.map((c) => [c, c.statut] as const))
  for (const c of maladesChoisis) c.statut = 'Malade'
  const s = scoresVille(state, p, ville, C)
  assert.equal(s.sante, 70, '30 % malades → santé 70')
  for (const c of maladesChoisis) c.statut = anciensStatuts.get(c)!
  // après reset : santé 100
  const s2 = scoresVille(state, p, ville, C)
  assert.equal(s2.sante, 100, 'plus de malades → santé 100')
})

test('scoresVille : les ENFANTS ne comptent pas dans le facteur Emploi (retour Thibaut 2026-10-28)', () => {
  const { state, p, ville, C } = partieTemoin()
  const pop = (state.population[p.n] ?? []).filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom)
  const enfants = pop.filter((c) => c.age < C.p.adultAge)
  const adultes = pop.filter((c) => c.age >= C.p.adultAge)
  assert.ok(adultes.length > 0, 'fixture : des adultes dans la ville témoin')
  // Tous les ADULTES en poste → facteur « pourvu » à son optimum.
  for (const c of adultes) c.metier = c.metier ?? C.p.metierChasseur
  // Scénario A : enfants SANS métier — déjà hors du comptage (ni
  //  demande, ni pourvus).
  for (const c of enfants) c.metier = null
  const sA = scoresVille(state, p, ville, C)
  // Scénario B : les MÊMES enfants porteurs d'un métier (affectation
  //  manuelle, edge case) — un enfant n'est NI un chômeur NI un
  //  poste pourvu : l'Emploi ne doit pas bouger (l'ancienne formule
  //  gonflait enPoste → malus d'excès).
  for (const c of enfants) c.metier = C.p.metierChasseur
  const sB = scoresVille(state, p, ville, C)
  assert.equal(sB.emploi, sA.emploi, 'des enfants porteurs d\'un métier ne changent pas le facteur Emploi')
  assert.ok(sA.emploi > 0, 'tous les adultes en poste → Emploi non nul')
})

test('bonheurVilleComplete + bonheurJoueur : moyennes cohérentes sur partie réelle', () => {
  const { state, p, C } = partieTemoin()
  const b1 = bonheurVilleComplete(state, p, p.villes[0], C)
  const bj = bonheurJoueur(state, p, C)
  assert.ok(b1 >= 0 && b1 <= 100, 'bonheur ville borné')
  assert.ok(bj >= 0 && bj <= 100, 'bonheur joueur borné')
  // joueur avec N villes : bonheur joueur = moyenne des villes
  if (p.villes.length > 1) {
    const villes = p.villes.map((v) => bonheurVilleComplete(state, p, v, C))
    const attendu = Math.round(villes.reduce((a, b) => a + b, 0) / villes.length)
    assert.equal(bj, attendu, 'bonheur joueur = moyenne de ses villes')
  }
})

test('déterminisme : deux appels successifs → mêmes scores (fonction pure)', () => {
  const { state, p, ville, C } = partieTemoin()
  const a = scoresVille(state, p, ville, C)
  const b = scoresVille(state, p, ville, C)
  assert.deepEqual(a, b, 'scoresVille ne doit pas muter l\'état')
})
