// ══════════════════════════════════════════════════════════════════════
//  BENCH SCALABILITÉ — 16 000 habitants (répartis entre les joueurs) :
//  temps de fin de tour, coût d'un appel cfgOf, reaffecterMetiers seul.
//  Vague scalabilité (arbitrage Thibaut 2026-10-23 : bench 16k avant/après).
//  Usage bac : node --experimental-strip-types --import ./register.mjs scripts/bench-scalabilite.ts
// ══════════════════════════════════════════════════════════════════════
import { createGame, type SetupLine } from '../src/engine/setup'
import { runTurn } from '../src/engine/tour'
import { cfgOf } from '../src/config/defaultConfig'
import { reaffecterMetiers } from '../src/engine/metiers'

const C0 = cfgOf(undefined)
const peuples = C0.config.peuplesLibres.map((p) => p.nom)
const cultures = C0.config.cultures.map((c) => c.nom)
const regimes = C0.regimes.map((r) => r.nom)

const SETUP: SetupLine[] = peuples.slice(0, 8).map((peuple, i) => ({
  nom: `J${i + 1}`, peuple, culture: cultures[i % cultures.length],
  regime: regimes[i % regimes.length],
  taillePopulation: 25, pourcentageMariages: 40,
  villes: ['Capitale', 'Bourg', 'Port'],
}))

let state = createGame(SETUP, 20261024, 'local')

// ── Gonflage à ≈16 000 habitants (16k répartis entre les joueurs, adultes) ──
const PAR_JOUEUR = Math.ceil(16000 / state.players.length)
for (const p of state.players) {
  const pop = state.population[p.n] ?? (state.population[p.n] = [])
  if (pop.length === 0) throw new Error(`joueur ${p.n} sans population de base`)
  const base = [...pop]
  let n = 0
  while (pop.length < PAR_JOUEUR) {
    const m = base[n % base.length]
    const idxVille = n % p.villes.length
    pop.push({
      ...m,
      id: `b-${p.n}-${n}`, prenom: `B${n}`,
      ville: p.villes[idxVille].nom,
      age: 18 + ((n * 7) % 55),
      metier: n % 3 === 0 ? null : m.metier,
      mariage: null, mariageId: null, fecondite: 0, armee: null,
    })
    n++
  }
}
console.log(`habitants: ${Object.values(state.population).reduce((s, l) => s + l.length, 0)}`)

// ── 1. temps de fin de tour (3 tours) ──
for (let t = 0; t < 3; t++) {
  const t0 = performance.now()
  state = runTurn(state) ?? state
  const t1 = performance.now()
  console.log(`tour ${state.turn} : ${(t1 - t0).toFixed(1)} ms`)
}

// ── 2. coût d'un appel cfgOf (MÊME référence de config, 100 appels) ──
{
  const N = 100
  const t0 = performance.now()
  for (let i = 0; i < N; i++) cfgOf(state.config)
  const t1 = performance.now()
  console.log(`cfgOf(state.config) × ${N} : ${((t1 - t0) / N).toFixed(2)} ms/appel`)
}

// ── 3. reaffecterMetiers seul ──
{
  const t0 = performance.now()
  reaffecterMetiers(state)
  const t1 = performance.now()
  console.log(`reaffecterMetiers : ${(t1 - t0).toFixed(1)} ms`)
}
