// ══════════════════════════════════════════════════════════════════════
//  Génération de la population initiale
//  (portage de la macro VBA GenererPopulationInitiale / frmInitPop)
// ══════════════════════════════════════════════════════════════════════

import type { Character, GameSetup, GameState, Player } from './types'
import { makeRng, type Rng } from './rng'
import { RESOURCES, ORIENTATIONS, TRAITS, PEUPLES, cultureDef, peupleDef } from './gameData'
import {
  ADULT_AGE, TITRE_DIRIGEANT, TRAIT_BASTARD, computeAgeMax,
  isNobleDyn, computeFecondite,
} from './engine'

export interface SetupLine {
  nom: string
  peuple: string
  culture: string
  regime: string
  taillePopulation: number
  pourcentageMariages: number
  villes: string[]
}

const DEFAULT_VILLES = ['Capitale', 'Bourg']

/** Crée une partie complète à 8 joueurs à partir des paramètres de setup. */
export function createGame(setups: SetupLine[], seed: number, mode?: 'local' | 'supabase'): GameState {
  const rng = makeRng(seed)
  const state: GameState = {
    version: 1,
    seed,
    rngState: rng.state(),
    turn: 1,
    saison: 'Été',
    modDanger: 0,
    players: [],
    population: {},
    log: [
      { turn: 1, type: 'Système', joueur: null, texte: `Partie créée (graine ${seed}, mode ${mode ?? 'local'}). Tour 1 = année 1.` },
    ],
    history: [],
  }
  for (let i = 0; i < 8; i++) {
    const s = setups[i]
    const n = i + 1
    const player = makePlayer(n, s, rng)
    state.players.push(player)
    state.population[n] = makePopulation(player, s, rng)
  }
  state.rngState = rng.state()
  return state
}

export function makePlayer(n: number, s: SetupLine, rng: Rng): Player {
  const resources: Record<string, { stock: number; prod: number }> = {}
  for (const r of RESOURCES) {
    resources[r] = { stock: r === 'Nourriture' ? 50 : r === 'Or' ? 20 : 0, prod: 0 }
  }
  return {
    n,
    nom: s.nom || `Joueur ${n}`,
    peuple: s.peuple || PEUPLES[(n - 1) % PEUPLES.length].nom,
    culture: s.culture,
    regime: s.regime || 'Monarchie de droit divin',
    resources,
    villes: (s.villes && s.villes.length > 0 ? s.villes : DEFAULT_VILLES).map((nom, idx) => ({
      nom,
      culture: s.culture,
      taxes: 'Moyenne',
      batiments: idx === 0 ? ['École élémentaire', 'Herboristerie'] : [],
    })),
    dynastie: null,
    armees: [],
    recap: null,
  }
}

export function makePopulation(player: Player, s: SetupLine, rng: Rng): Character[] {
  const taille = Math.max(10, s.taillePopulation || 30)
  const pourcentMariages = Math.min(100, Math.max(0, s.pourcentageMariages ?? 40))
  const peup = peupleDef(player.peuple) ?? PEUPLES[0]
  const cult = cultureDef(player.culture)
  const heredite = cult ? cult.heredite : 'Masculine'
  const pop: Character[] = []

  let id = 0
  const nextId = () => `p${player.n}c${++id}`

  function randomOrientation(): Character['orientation'] {
    return rng.pickWeighted(ORIENTATIONS, (o) => o.poids).nom as Character['orientation']
  }

  function randomTraits(): [string, string, string] {
    const traits: [string, string, string] = ['', '', '']
    for (let slot = 0; slot < 3; slot++) {
      if (rng.chance(0.3)) {
        const t = rng.pickWeighted(TRAITS, (td) => td.weight)
        if (t.weight > 0) traits[slot] = t.name
      }
    }
    return traits
  }

  // 1. Population générale : sexes 50/50, âges 0-50
  for (let i = 0; i < taille - 2; i++) {
    const sexe: 'M' | 'F' = rng.chance(0.5) ? 'M' : 'F'
    const c: Character = {
      id: nextId(),
      nom: rng.pick(peup.noms),
      prenom: sexe === 'M' ? rng.pick(peup.prenomsM) : rng.pick(peup.prenomsF),
      dynastie: 'Roturier',
      sexe,
      age: rng.int(0, 50),
      culture: player.culture,
      ville: rng.pick(player.villes).nom,
      orientation: randomOrientation(),
      traits: randomTraits(),
      statut: 'Sain',
      mariage: null,
      mere: null,
      pere: null,
      pereBio: null,
      enfantBatard: false,
      titre: null,
      education: null,
      fecondite: 0,
      ageMax: 0,
      armee: null,
    }
    c.ageMax = computeAgeMax(c, rng)
    pop.push(c)
  }

  // 2. Couple royal : un homme et une femme adultes (âges forcés à 20),
  //    chacun reçoit un nom distinct devenu sa dynastie, mariés.
  const roiName = rng.pick(peup.noms)
  let reineName = rng.pick(peup.noms.filter((x) => x !== roiName))
  if (!reineName) reineName = roiName + 'e'
  const roi: Character = {
    id: nextId(),
    nom: roiName,
    prenom: rng.pick(peup.prenomsM),
    dynastie: roiName,
    sexe: 'M',
    age: 20,
    culture: player.culture,
    ville: player.villes[0].nom,
    orientation: 'Hétérosexuel',
    traits: randomTraits(),
    statut: 'Sain',
    mariage: null,
    mere: null,
    pere: null,
    pereBio: null,
    enfantBatard: false,
    titre: null,
    education: null,
    fecondite: 0,
    ageMax: 0,
    armee: null,
  }
  const reine: Character = {
    id: nextId(),
    nom: reineName,
    prenom: rng.pick(peup.prenomsF),
    dynastie: reineName,
    sexe: 'F',
    age: 20,
    culture: player.culture,
    ville: player.villes[0].nom,
    orientation: 'Hétérosexuel',
    traits: randomTraits(),
    statut: 'Sain',
    mariage: `${roi.prenom} ${roi.nom}`,
    mere: null,
    pere: null,
    pereBio: null,
    enfantBatard: false,
    titre: null,
    education: null,
    fecondite: 0,
    ageMax: 0,
    armee: null,
  }
  roi.mariage = `${reine.prenom} ${reine.nom}`
  roi.ageMax = computeAgeMax(roi, rng)
  reine.ageMax = computeAgeMax(reine, rng)
  // Le Dirigeant est le roi si l'hérédité est masculine ou paritaire, sinon la reine
  if (heredite === 'Féminine') reine.titre = TITRE_DIRIGEANT
  else roi.titre = TITRE_DIRIGEANT
  pop.push(roi, reine)

  // 3. Les enfants sont répartis dans le couple royal
  for (const c of pop) {
    if (c.age >= ADULT_AGE || c === roi || c === reine) continue
    if (rng.chance(0.7)) {
      c.nom = roi.nom
      c.dynastie = heredite === 'Féminine' ? reineName : roi.nom
      c.mere = `${reine.prenom} ${reine.nom}`
      c.pere = `${roi.prenom} ${roi.nom}`
    }
  }

  // 4. Titres aléatoires pour les adultes non-Dirigeant, mariages des roturiers
  const adultes = pop.filter((c) => c.age >= ADULT_AGE && c.titre !== TITRE_DIRIGEANT)
  const titresRoturiers = ['Chasseur', 'Pêcheur', 'Fermier']
  for (const c of adultes) {
    if (!c.titre && rng.chance(0.6)) c.titre = rng.pick(titresRoturiers)
  }
  // ~le % demandé d'adultes roturiers se marient entre eux
  const celibataires = adultes.filter((c) => !c.mariage && !isNobleDyn(c.dynastie))
  const nbMariages = Math.floor((celibataires.length * pourcentMariages) / 100)
  const celibM = rng.shuffle(celibataires.filter((c) => c.sexe === 'M'))
  const celibF = rng.shuffle(celibataires.filter((c) => c.sexe === 'F'))
  for (let i = 0; i < Math.min(nbMariages, celibM.length, celibF.length); i++) {
    const h = celibM[i]
    const f = celibF[i]
    h.mariage = `${f.prenom} ${f.nom}`
    f.mariage = `${h.prenom} ${h.nom}`
  }

  // 5. Fécondités calculées pour les adultes
  for (const c of pop) {
    c.fecondite = computeFecondite({ population: { [player.n]: pop }, players: [player] } as GameState, player, c)
  }

  return pop
}

export function defaultSetups(): SetupLine[] {
  return Array.from({ length: 8 }, (_, i) => ({
    nom: `Joueur ${i + 1}`,
    peuple: PEUPLES[i % PEUPLES.length].nom,
    culture: '',
    regime: 'Monarchie de droit divin',
    taillePopulation: 30,
    pourcentageMariages: 40,
    villes: i === 0 ? ['Capitale', 'Bourg'] : ['Capitale'],
  }))
}
