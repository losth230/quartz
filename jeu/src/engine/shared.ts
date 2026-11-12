// ══════════════════════════════════════════════════════════════════════
//  OUTILS TRANSVERSAUX DU MOTEUR
//  Identifiants, noms, dynasties nobles, récapitulatifs.
//  Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { Character, CiteLibre, GameState, MouvementsVille, Player, PlayerRecap } from './types'
import type { Rng } from './rng'
import { cfgOf, type Cfg } from './gameData'

// ── Utilitaires ─────────────────────────────────────────────────────────
let idCounter = 0
/** Id unique de personnage. ⚠ NON déterministe : Date.now() + compteur
 *  module (les tirages rng restent seuls reproductibles par graine —
 *  cf. rng.ts). Les ids ne servent qu'à l'IDENTITÉ (M1 : mariages,
 *  filiation), jamais au calcul : un rejeu de la même graine produit
 *  les mêmes événements avec des ids différents. */
export function newId(rng: Rng): string {
  return `c${Date.now().toString(36)}${(idCounter++).toString(36)}${rng.int(100, 999)}`
}

export function isNobleDyn(dyn: string, C: Cfg = cfgOf()): boolean {
  const d = dyn.trim()
  return d !== '' && d !== C.p.dynastieRoturier
}

/** Arbitrage Thibaut (vague 3a, 2026-10-21) : un habitant qui CHANGE
 *  d'habitation (déménagement vers une autre ville, don à un autre
 *  porteur, mariage chez le conjoint, cour ré-ancrée, ville perdue)
 *  PERD son métier ET son domicile — les postes à emplacements sont
 *  créés par les aménagements de la ville qu'il quitte, le domicile
 *  est un bâtiment de cette ville. Il redevient Sans-emploi (rôle
 *  neutre, impôt nul) jusqu'à la réaffectation de fin de tour. Ne
 *  s'applique PAS aux renommages de ville (même ville, nouveau nom)
 *  ni aux transferts de PROPRIÉTÉ d'une ville (les habitants ne
 *  bougent pas). Arbitrage complémentaire (2026-10-21) : un DIRIGEANT
 *  ou un HÉRITIER ne déménage jamais — il garde son métier-titre et
 *  son domicile même lors d'un ré-ancrage de cour (sa ville est
 *  perdue, il DOIT suivre, mais son titre ne se perd pas). */
export function neDemenageJamais(c: Character, C: Cfg): boolean {
  return c.metier === C.p.metierDirigeant || c.metier === C.p.metierHeritierStr
}

export function perteDemenagement(c: Character, C: Cfg): void {
  if (neDemenageJamais(c, C)) return
  c.metier = null
  c.domicile = null
}

export function fullName(c: Character): string {
  return `${c.prenom} ${c.nom}`
}

// ══════════════════════════════════════════════════════════════════════
//  DÉTENTEURS DE POPULATION (retour Thibaut 2026-10-14) : un JOUEUR ou
//  une CITÉ LIBRE. La population des cités libres est gérée « comme si
//  c'étaient des joueurs » (onglet 👥 Population) : dons, mariages et
//  veuvage parcourent TOUTES les populations du monde, joueurs et
//  cités libres confondues.
// ══════════════════════════════════════════════════════════════════════

/** Porteur d'une population : un joueur ou une cité libre. */
export type Detenteur =
  | { kind: 'joueur'; p: Player }
  | { kind: 'cite'; cite: CiteLibre }

/** Tous les détenteurs de population de la partie (joueurs puis cités
 *  libres, dans l'ordre). */
export function detenteursDe(state: GameState): Detenteur[] {
  return [
    ...state.players.map((p): Detenteur => ({ kind: 'joueur', p })),
    ...(state.citesLibres ?? []).map((cite): Detenteur => ({ kind: 'cite', cite })),
  ]
}

/** Population d'un détenteur (le tableau est MUTÉ en place par les
 *  dons — même référence que state.population[n] ou cite.population). */
export function populationDe(state: GameState, d: Detenteur): Character[] {
  if (d.kind === 'joueur') return state.population[d.p.n] ?? []
  return d.cite.population ?? []
}

/** Étiquette d'un détenteur pour les logs (ex. « J1 · Hugues » ou
 *  « la cité libre Avignon »). */
export function nomDe(d: Detenteur): string {
  return d.kind === 'joueur' ? `J${d.p.n} · ${d.p.nom}` : `la cité libre ${d.cite.nom}`
}

/** Détenteur à la population duquel appartient un personnage
 *  (undefined = introuvable — les cités libres sont incluses). */
export function porteurDe(state: GameState, c: Character): Detenteur | undefined {
  for (const d of detenteursDe(state)) {
    if (populationDe(state, d).includes(c)) return d
  }
  return undefined
}

/** Deux détenteurs désignent-ils le même porteur (joueur ou cité) ? */
export function memeDetenteur(a: Detenteur, b: Detenteur): boolean {
  if (a.kind !== b.kind) return false
  return a.kind === 'joueur'
    ? a.p.n === (b as { kind: 'joueur'; p: Player }).p.n
    : a.cite === (b as { kind: 'cite'; cite: CiteLibre }).cite
}

/** TOUTES les populations du monde, joueurs ET cités libres — pour le
 *  veuvage au décès (sante.ts), la recherche du mari pour les
 *  naissances (naissances.ts) et les mariages manuels (cour.ts). */
export function toutesLesPopulations(state: GameState): Character[] {
  return detenteursDe(state).flatMap((d) => populationDe(state, d))
}

/** Donne un personnage à un détenteur (joueur ou cité libre) : il
 *  quitte sa population actuelle (où qu'elle soit — joueur ou cité
 *  libre) et rejoint celle de la cible ; sa ville est ré-ancrée (1re
 *  ville du joueur cible si la sienne n'y existe pas / nom de la cité
 *  cible). Retourne null si tout s'est bien passé, sinon une erreur. */
export function deplacerPersonnage(
  state: GameState, c: Character, dst: Detenteur,
): string | null {
  const src = porteurDe(state, c)
  if (!src) return 'Personnage introuvable dans les populations de la partie.'
  // Arbitrage complémentaire (2026-10-21) : un Dirigeant ou un Héritier
  //  ne déménage jamais — don refusé AVANT toute mutation.
  if (neDemenageJamais(c, cfgOf(state.config))) {
    return 'Un Dirigeant ou un Héritier ne déménage jamais (don refusé).'
  }
  if (src.kind === dst.kind && (src.kind === 'joueur'
    ? src.p.n === (dst as { kind: 'joueur'; p: Player }).p.n
    : src.cite === (dst as { kind: 'cite'; cite: CiteLibre }).cite)) {
    return 'Ce personnage appartient déjà à ce porteur.'
  }
  const popSrc = populationDe(state, src)
  const i = popSrc.indexOf(c)
  if (i >= 0) popSrc.splice(i, 1)
  if (dst.kind === 'joueur') {
    if (!dst.p.villes.some((v) => v.nom === c.ville)) {
      c.ville = dst.p.villes[0]?.nom ?? c.ville
    }
    const arr = state.population[dst.p.n] ?? (state.population[dst.p.n] = [])
    arr.push(c)
  } else {
    c.ville = dst.cite.nom
    const arr = dst.cite.population ?? (dst.cite.population = [])
    arr.push(c)
  }
  // Vague 3a (arbitrage 2026-10-21) : le personnage CHANGE de porteur
  //  donc d'habitation — il perd son métier et son domicile (Sans-
  //  emploi jusqu'à la réaffectation ; un éventuel Gouverneur sera
  //  re-désigné automatiquement à la fin du tour).
  perteDemenagement(c, cfgOf(state.config))
  state.log.push({
    turn: state.turn, type: 'Système',
    joueur: src.kind === 'joueur' ? src.p.n : null,
    texte: `🤝 ${fullName(c)} (${c.dynastie}) passe de ${nomDe(src)} à ${nomDe(dst)} — il quitte son poste (déménagement).`,
  })
  return null
}

// ── Dons de personnages en multijoueur (retour Thibaut 2026-11-12) ────
//  BUG réel : le don (onglet Population, « Donner à… ») est une
//  mutation INTER-JOUEURS faite EN LOCAL chez le donneur — comme la
//  fusion remplace la population de chaque joueur par SA section
//  (fusionnerSections), la fiche donnée n'était ni dans la section du
//  donneur (il ne l'a plus) ni dans celle du receveur (il ne l'a
//  JAMAIS vue localement) : le personnage DISPARAISSAIT à la
//  résolution du tour. Même famille que le bug 2026-10-17 (transfert
//  de ville) : le don part désormais en ÉVÉNEMENT PARTAGÉ
//  'transfert_pop' (cp_events) et est REJOUÉ après la fusion.

/** Clé SÉRIALISABLE d'un détenteur (payload réseau des événements
 *  partagés 'transfert_pop') : joueur par NUMÉRO, cité libre par NOM
 *  (l'identité stable des cités à la fusion — cf. fusionnerSections,
 *  qui les fusionne par nom ; l'index « c<i> » des options de don ne
 *  survit pas au tour). */
export type CleDetenteur =
  | { kind: 'joueur'; n: number }
  | { kind: 'cite'; nom: string }

/** Clé sérialisable d'un détenteur vivant (pour construire un payload). */
export function cleDe(d: Detenteur): CleDetenteur {
  return d.kind === 'joueur'
    ? { kind: 'joueur', n: d.p.n }
    : { kind: 'cite', nom: d.cite.nom }
}

/** Détenteur vivant depuis une clé sérialisable (undefined = porteur
 *  disparu de l'état fusionné — cité renommée, joueur retiré…). */
export function detenteurDeCleStable(
  state: GameState, cle: CleDetenteur,
): Detenteur | undefined {
  if (!cle || typeof cle !== 'object') return undefined
  if (cle.kind === 'joueur') {
    const q = state.players.find((x) => x.n === cle.n)
    return q ? { kind: 'joueur', p: q } : undefined
  }
  const cc = (state.citesLibres ?? []).find((c) => c.nom === cle.nom)
  return cc ? { kind: 'cite', cite: cc } : undefined
}

/** Rejoue un DON de personnage à la RÉSOLUTION du tour (événement
 *  partagé 'transfert_pop' — payload { personnage, src, dst }). La
 *  fiche embarquée est celle APRÈS le don local (ville déjà ré-ancrée
 *  chez la cible, perte du métier déjà appliquée par
 *  deplacerPersonnage) : le rejeu fait un déplacement BRUT, il ne
 *  ré-applique PAS la logique du don (pas de double perte de métier).
 *  Idempotent : fiche déjà chez la cible (rejeu double, ou don vers
 *  une CITÉ LIBRE dont la version modifiée a déjà été fusionnée par
 *  diff) → ne rien faire. Retourne true si l'état a bougé ou était
 *  déjà en ordre, false si le rejeu est impossible. */
export function rejouerTransfertPop(
  state: GameState,
  payload: { personnage: Character; src: CleDetenteur; dst: CleDetenteur },
): boolean {
  const c = payload?.personnage
  if (!c || typeof c.id !== 'string') return false
  const dstD = detenteurDeCleStable(state, payload.dst)
  if (!dstD) return false
  const popDst = populationDe(state, dstD)
  // Idempotence : déjà chez la cible.
  if (popDst.some((x) => x.id === c.id)) return true
  // Retirer la fiche par id de TOUTES les populations (défense : la
  //  section du donneur peut être antérieure au don — cas d'un push
  //  de section raté puis rejoué —, ou une cité source encore à sa
  //  version de référence à la fusion).
  let retireDe: Detenteur | undefined
  for (const d of detenteursDe(state)) {
    const arr = populationDe(state, d)
    const i = arr.findIndex((x) => x.id === c.id)
    if (i >= 0) { arr.splice(i, 1); retireDe = d }
  }
  // Insérer la fiche chez la cible — en GARANTISSANT le tableau
  //  (populationDe renvoie un tableau détaché si cite.population est
  //  absent : le push s'y perdrait, cf. deplacerPersonnage).
  const arrDst = dstD.kind === 'joueur'
    ? (state.population[dstD.p.n] ?? (state.population[dstD.p.n] = []))
    : (dstD.cite.population ?? (dstD.cite.population = []))
  arrDst.push(structuredClone(c))
  state.log.push({
    turn: state.turn, type: 'Système',
    joueur: dstD.kind === 'joueur' ? dstD.p.n : null,
    texte: `🤝 ${fullName(c)} (${c.dynastie}) rejoint ${nomDe(dstD)} (don de ${retireDe ? nomDe(retireDe) : 'un autre porteur'} rejoué à la résolution du tour).`,
  })
  return true
}

export function emptyRecap(): PlayerRecap {
  return {
    conceptions: {}, naissances: {}, deces: {}, decesMaladie: 0,
    mariagesNobles: {}, conversions: {}, metiersAttribues: {}, crises: [],
    commandantTombe: null,
    // (Retour Thibaut 2026-11-12) : récap par habitation — les vues
    //  lisent p.recap.mouvementsVille ?? {}.
    mouvementsVille: {},
  }
}

/** (Retour Thibaut 2026-11-12 — récapitulatif des évolutions de
 *  population par habitation) : incrémente un compteur de mouvement
 *  pour UNE ville du récap. Pose paresseusement le dictionnaire et la
 *  fiche ville (compatibilité vieilles sauvegardes sans le champ).
 *  Ville vide ignorée (personnage sans ville — n arrive pas au moteur). */
export function bumpMouvement(
  recap: PlayerRecap, ville: string,
  champ: 'naissances' | 'deces' | 'arrivees' | 'departs',
): void {
  if (!ville) return
  const dict = recap.mouvementsVille ?? (recap.mouvementsVille = {})
  const fiche = dict[ville] ?? (dict[ville] = { naissances: 0, deces: 0, arrivees: 0, departs: 0 })
  fiche[champ]++
}

/** Totaux des mouvements sur toutes les habitations du récap (retour
 *  Thibaut 2026-11-12) — journal, carte Villes et récap Population. */
export function totauxMouvements(recap: PlayerRecap): MouvementsVille {
  const t: MouvementsVille = { naissances: 0, deces: 0, arrivees: 0, departs: 0 }
  for (const f of Object.values(recap.mouvementsVille ?? {})) {
    t.naissances += f.naissances; t.deces += f.deces
    t.arrivees += f.arrivees; t.departs += f.departs
  }
  return t
}

export function bump(dict: Record<string, number>, key: string, n = 1) {
  if (!key) key = '(inconnu)'
  dict[key] = (dict[key] ?? 0) + n
}
