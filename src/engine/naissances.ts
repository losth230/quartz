// ══════════════════════════════════════════════════════════════════════
//  FÉCONDITÉ, CONCEPTIONS ET NAISSANCES
//  Facteurs de fertilité, conception, accouchement, noms, dynastie du bébé et héritage des traits.
//  Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { Character, GameState, Player, PlayerRecap } from './types'
import type { Rng } from './rng'
import { cfgOf, traitDef, cultureDef, peupleDef, type Cfg } from './gameData'
import { bump, fullName, isNobleDyn, newId } from './shared'
import { taxBirthFactor } from './economie'
import { killCharacter } from './sante'
import { PRESTIGE_NOBLE_NAISSANCE } from './statutSocial'
import { indexPopulationMonde, ajouterALIndexPopulation } from './indexPopulation'
import { effetsDogmeCulture } from './dogmes'


// Index de population (vague 2) : module bas dédié indexPopulation.ts.

export function computeFecondite(state: GameState, p: Player, c: Character): number {
  // Retour Thibaut (revue 2026-10-15) : le champ affiché doit refléter
  //  la proba de conception RÉELLE du tour (conceptionEtNaissances) —
  //  facteurs d'âge, traits des époux (fert_add), culture, orientation
  //  et taxes de la ville.
  const C = cfgOf(state.config)
  if (c.statut === 'Décédé' || c.age < C.p.adultAge) return 0
  // (Dogme de la Famille, CORRECTIF arbitre Thibaut du 30/10 — 4e
  //  retour : « le multiplicateur est côté homme ET femme » — le
  //  facteur du personnage ET celui de son époux portent chacun le
  //  dogme de LEUR culture propre. Cf. le bloc mari ci-dessous.)
  if (c.sexe !== 'F') {
    return maleAgeFactor(c.age) * orientationFertFactor(c.orientation)
      * (1 + effetsDogmeCulture(state, c.culture, 'fecondite', C))
  }
  const ville = p.villes.find((v) => v.nom === c.ville)
  const mari = c.mariageId ? indexPopulationMonde(state).get(c.mariageId) : undefined
  if (mari && mari.sexe !== 'M') return 0
  // (Dogme de la Famille, côté ÉPOUX : un MARI de la culture
  //  porteuse multiplie SA part du facteur de conception — une
  //  femme d'une autre culture mariée à un porteur conçoit
  //  elle aussi ×(1+v). Culture PROPRE de l'époux, où qu'il vive.)
  const factorMari = mari
    ? maleAgeFactor(mari.age) * orientationFertFactor(mari.orientation)
      * (1 + effetsDogmeCulture(state, mari.culture, 'fecondite', C))
    : C.p.fertSingleFactor
  let proba = C.p.fertBaseRate
  proba *= femaleAgeFactor(c.age)
  proba *= factorMari
  proba *= traitsFertFactor(c, mari ?? null, C)
  proba *= cultureFertFactor(p.culture, C)
  // (Dogme de la Famille, 2026-10-30 : +v de fécondité pour les
  //  personnages de la culture porteuse (effet fecondite, défaut
  //  +0,1), où qu'ils vivent — culture PROPRE du personnage
  //  (c.culture), additif au facteur : ×(1+v). Côté FEMME ici,
  //  côté homme dans le return masculin ci-dessus et dans le
  //  facteur de l'époux. Cumulé au facteur de culture du PORTEUR
  //  ci-dessus et aux traits.)
  proba *= 1 + effetsDogmeCulture(state, c.culture, 'fecondite', C)
  proba *= orientationFertFactor(c.orientation)
  proba *= taxBirthFactor(ville, C)
  return proba
}

function femaleAgeFactor(age: number): number {
  if (age < 16) return 0
  if (age <= 25) return 1.0
  if (age <= 30) return 0.9
  if (age <= 35) return 0.8
  if (age <= 40) return 0.7
  if (age <= 44) return 0.4
  if (age <= 49) return 0.1
  if (age <= 99) return 0.02
  return 0
}

function maleAgeFactor(age: number): number {
  if (age < 16) return 0
  return Math.max(0, 1 - (0.5 * (age - 16)) / 42)
}

function orientationFertFactor(orientation: string): number {
  const o = orientation.toLowerCase()
  return o.includes('homo') || o.includes('asex') ? 0.7 : 1
}

function cultureFertFactor(culture: string, C: Cfg = cfgOf()): number {
  const c = cultureDef(culture, C.config)
  return c ? c.fertFactor : 1
}

function traitsFertFactor(a: Character, b: Character | null, C: Cfg = cfgOf()): number {
  let sum = 0
  for (const t of (a.traits ?? [])) {
    const td = t ? traitDef(t, C.config) : undefined
    if (td) sum += td.fert_add
  }
  if (b) {
    for (const t of (b.traits ?? [])) {
      const td = t ? traitDef(t, C.config) : undefined
      if (td) sum += td.fert_add
    }
  }
  return Math.min(C.p.fertTraitFactorMax, Math.max(C.p.fertTraitFactorMin, 1 + sum))
}

// ── Conception et naissances ─────────────────────────────────────────────

export function conceptionEtNaissances(state: GameState, p: Player, rng: Rng, recap: PlayerRecap) {
  const C = cfgOf(state.config)
  const pop = state.population[p.n] ?? []

  // 1. Naissances des femmes enceintes depuis le tour précédent
  for (const mere of pop) {
    if (mere.statut !== 'Enceinte') continue
    const pere = mere.pereBioId ? pop.find((x) => x.id === mere.pereBioId) : undefined
    accoucher(state, p, mere, pere, rng, recap)
    mere.statut = 'Sain'
    mere.pereBio = null
    mere.pereBioId = null
    // Règle simplifiée : une femme tombée malade pendant sa grossesse
    // accouche, puis meurt de la maladie.
    if (mere.enceinteMalade) {
      mere.enceinteMalade = false
      killCharacter(state, p, mere, 'maladie', recap)
    }
  }

  // 2. Tentatives de conception (femmes adultes saines — ou malades :
  //    une femme malade qui tombe enceinte est guérie, bug assumé)
  //    Le mari peut vivre chez un AUTRE porteur depuis les mariages
  //    manuels entre cours (engine/cour.ts, 2026-10-14) : on cherche
  //    donc le conjoint dans TOUTES les populations du monde, joueurs
  //    ET cités libres (retour Thibaut 2026-10-14).
  const indexMonde = indexPopulationMonde(state)
  const villesParNom = new Map(p.villes.map((v) => [v.nom, v]))
  for (const mere of pop) {
    if (mere.sexe !== 'F' || (mere.statut !== 'Sain' && mere.statut !== 'Malade')) continue
    if (mere.age < C.p.adultAge) continue
    const ville = villesParNom.get(mere.ville)
    const mari = mere.mariageId ? indexMonde.get(mere.mariageId) : undefined
    // Mariage homosexuel (culture l'autorisant — mariages dans metiers.ts) :
    // pas de conception entre épouses de même sexe.
    if (mari && mari.sexe !== 'M') continue
    const factorMari = mari ? maleAgeFactor(mari.age) * orientationFertFactor(mari.orientation) : C.p.fertSingleFactor
    let proba = C.p.fertBaseRate
    proba *= femaleAgeFactor(mere.age)
    proba *= factorMari
    proba *= traitsFertFactor(mere, mari ?? null, C)
    proba *= cultureFertFactor(p.culture, C)
    proba *= orientationFertFactor(mere.orientation)
    proba *= taxBirthFactor(ville, C)
    if (rng.chance(proba)) {
      let pereBio: Character | undefined
      let batard = false
      if (mari) {
        if (rng.chance(C.p.adulteryRate)) {
          // adultère : amant aléatoire
          const amants = pop.filter(
            (x) => x.sexe === 'M' && (x.statut === 'Sain' || x.statut === 'Malade') && x.age >= C.p.adultAge && x.id !== mari.id,
          )
          pereBio = amants.length > 0 ? rng.pick(amants) : undefined
          batard = true
        } else {
          pereBio = mari
        }
      } else {
        // célibataire : amant aléatoire, enfant bâtard
        const amants = pop.filter(
          (x) => x.sexe === 'M' && (x.statut === 'Sain' || x.statut === 'Malade') && x.age >= C.p.adultAge,
        )
        pereBio = amants.length > 0 ? rng.pick(amants) : undefined
        batard = true
      }
      // une femme malade qui tombe enceinte est guérie (bug assumé)
      const etaitMalade = mere.statut === 'Malade'
      mere.statut = 'Enceinte'
      mere.pereBio = pereBio ? fullName(pereBio) : null
      mere.pereBioId = pereBio ? pereBio.id : null
      mere.enfantBatard = batard
      bump(recap.conceptions, mere.dynastie)
      state.log.push({
        turn: state.turn + 1, type: 'Naissance', joueur: p.n,
        texte: `${fullName(mere)} attend un enfant${batard ? ' (bâtard)' : ''}${etaitMalade ? ' — sa maladie disparaît (bug assumé)' : ''}.`,
      })
    }
  }
}

function accoucher(state: GameState, p: Player, mere: Character, pere: Character | undefined, rng: Rng, recap: PlayerRecap) {
  const C = cfgOf(state.config)
  const pop = state.population[p.n] ?? []
  // nombre d'enfants
  const r = rng.next()
  const nb = r < C.p.fertTripletsRate ? 3 : r < C.p.fertTripletsRate + C.p.fertTwinsRate ? 2 : 1
  const batard = mere.enfantBatard
  const consanguin = isConsanguineous(mere, pere)
  for (let i = 0; i < nb; i++) {
    // (retour Thibaut 2026-10-26 : un noble de NAISSANCE a 300
    //  prestige de base — posé dès la naissance quand la dynastie
    //  du bébé est noble ; à l'âge adulte l'héritage ne peut pas
    //  le faire descendre sous ce plancher)
    const dyn = computeBabyDynasty(state, p, mere, pere, batard, rng)
    const enfant: Character = {
      id: newId(rng),
      nom: mere.nom,
      prenom: pickName(state, p, rng, undefined),
      dynastie: dyn,
      // (clé posée seulement pour les bébés nobles — le format
      //  compact de sauvegarde omet prestige sinon)
      ...(isNobleDyn(dyn, C) ? { prestige: PRESTIGE_NOBLE_NAISSANCE } : {}),
      sexe: rng.pickWeighted(C.genres, (g) => g.poids).nom === 'Masculin' ? 'M' : 'F',
      age: 0,
      culture: mere.culture,
      ville: mere.ville,
      orientation: rng.pickWeighted(C.orientations, (o) => o.poids).nom as Character['orientation'],
      traits: ['', '', ''],
      statut: 'Sain',
      mariage: null,
      mariageId: null,
      mere: fullName(mere),
      mereId: mere.id,
      pere: pere ? fullName(pere) : null,
      pereId: pere ? pere.id : null,
      pereBio: null,
      pereBioId: null,
      enfantBatard: batard,
      metier: null,
      fecondite: 0,
      armee: null,
    }
    // traits
    inheritTraits(enfant, mere, pere, rng, C)
    if (batard) ensureTraitPresent(enfant, C.p.traitBatard)
    if (consanguin) ensureTraitPresent(enfant, C.p.traitConsanguin)
    pop.push(enfant)
    // Vague scalabilité : ajout CHIRURGICAL du nouveau-né (O(1)) —
    //  plus d'invalidation suivie d'une reconstruction O(N) par
    //  naissance (fratries comprises).
    ajouterALIndexPopulation(state, enfant)
    bump(recap.naissances, enfant.dynastie)
    state.log.push({
      turn: state.turn + 1, type: 'Naissance', joueur: p.n,
      texte: `Naissance : ${fullName(enfant)} (${enfant.sexe}, ${enfant.dynastie})${nb > 1 ? ` — fratrie de ${nb}` : ''}.`,
    })
  }
  mere.enfantBatard = false
}

function pickName(state: GameState, p: Player, rng: Rng, sexe: 'M' | 'F' | undefined): string {
  const C = cfgOf(state.config)
  const peup = peupleDef(p.peuple, C.config) ?? peupleDef(C.peuples[0], C.config)
  if (!peup) return 'Anonyme'
  if (sexe === 'F') return rng.pick(peup.prenomsF)
  if (sexe === 'M') return rng.pick(peup.prenomsM)
  return rng.pick([...peup.prenomsM, ...peup.prenomsF])
}

/** Consanguinité simple (1 degré) : la mère et le père biologique partagent un parent.
 *  M1 (2026-10-19) : comparaison par IDS (mère du père = grand-mère) —
 *  les noms complets ne sont plus une identité fiable. */
export function isConsanguineous(mere: Character, pere: Character | undefined): boolean {
  if (!pere) return false
  if (mere.mereId && mere.mereId === pere.mereId) return true
  if (mere.pereId && mere.pereId === pere.pereId) return true
  return false
}

/** Dynastie du bébé selon l'Hérédité de la culture (Masculine/Féminine/Parité). */
function computeBabyDynasty(
  state: GameState, p: Player, mere: Character, pere: Character | undefined,
  batard: boolean, rng: Rng,
): string {
  const C = cfgOf(state.config)
  if (batard) {
    // dynastie noble du parent noble s'il existe, sinon Roturier
    if (pere && isNobleDyn(pere.dynastie, C)) return pere.dynastie
    if (isNobleDyn(mere.dynastie, C)) return mere.dynastie
    return C.p.dynastieRoturier
  }
  const cult = cultureDef(p.culture, C.config)
  const hered = cult ? cult.heredite : 'Masculine'
  if (hered === 'Masculine') return pere ? pere.dynastie : mere.dynastie
  if (hered === 'Féminine') return mere.dynastie
  // Parité
  return rng.chance(0.5) ? (pere ? pere.dynastie : mere.dynastie) : mere.dynastie
}

/** Héritage des traits : 40% par trait parental héritable (3 essais mère + 3 essais père),
 *  puis 30% de tirage pondéré par slot libre. */
function inheritTraits(enfant: Character, mere: Character, pere: Character | undefined, rng: Rng, C: Cfg = cfgOf()) {
  const parents = [mere, ...(pere ? [pere] : [])]
  const nbEssais = Math.max(0, Math.round(C.p.traitHeriteEssais))
  for (const parent of parents) {
    for (const t of (parent.traits ?? [])) {
      if (!t) continue
      const td = traitDef(t, C.config)
      if (!td || !td.heritable) continue
      for (let essai = 0; essai < nbEssais; essai++) {
        if (rng.chance(C.p.traitHeriteParEssai)) {
          if (addTraitIfFree(enfant, t)) break
        }
      }
    }
  }
  // VBA : tirage pondéré par slot libre, hors traits déjà présents.
  const pris = (enfant.traits ?? []).filter(Boolean) as string[]
  const pool = C.traits.filter((td) => td.weight > 0 && !pris.includes(td.name))
  for (let slot = 0; slot < 3 && pool.length > 0; slot++) {
    if ((enfant.traits ?? [])[slot]) continue
    if (rng.chance(C.p.traitTirageSlot)) {
      const t = rng.pickWeighted(pool, (td) => td.weight)
      addTraitIfFree(enfant, t.name)
    }
  }
}

function addTraitIfFree(c: Character, trait: string): boolean {
  if (!Array.isArray(c.traits)) c.traits = ['', '', '']
  if (c.traits.includes(trait)) return false
  const idx = c.traits.findIndex((t) => !t)
  if (idx < 0) return false
  c.traits[idx] = trait
  return true
}

function ensureTraitPresent(c: Character, trait: string) {
  if (!Array.isArray(c.traits)) c.traits = ['', '', '']
  if (!c.traits.includes(trait)) {
    const idx = c.traits.findIndex((t) => !t)
    if (idx >= 0) c.traits[idx] = trait
    else c.traits[2] = trait // écrase le 3e slot si plein (comportement VBA SetTraitCell)
  }
}
