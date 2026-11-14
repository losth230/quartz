// ══════════════════════════════════════════════════════════════════════
//  CULTURE — CONVERSIONS ET VILLES (ApplyCultureInfluence)
//  V2 « Pression/Ancrage » (arbitrage Thibaut 2026-11-14, retour
//  « proposer autre chose pour la conversion culturelle, plus
//  cohérente et plus jouable techniquement ») : FINI le tirage au
//  hasard par habitant (proba 10 % + pickWeighted) — la conversion
//  devient un DUEL DÉTERMINISTE PAR VILLE, lisible et affichable.
//  ⚅ Force d'une culture dans une ville = pression touristique
//     mondiale de la culture (revue 2026-10-16 : tourisme général
//     + tourisme rattaché aux habitations de cette culture)
//     + poids démographique (conversionPoidsLocal × vivants de la
//     culture dans la ville) ; le tout ×(1+évangile).
//  ⚅ Ancrage d'un habitant = poids démographique de ses
//     compatriotes dans la ville (conversionPoidsLocal × vivants
//     de sa culture) + bonus de noblesse (conversionAncrageNoble)
//     : c'est la RÉSISTANCE — un isolé bascule avant une
//     communauté, un roturier avant un noble, et une communauté
//     nombreuse protège ses membres tant que la force dominante ne
//     dépasse pas le poids de ses compatriotes.
//  ⚅ Conversions : la culture dominante D de la ville (Force max,
//     ex æquo : ordre du référentiel) convertit les habitants les
//     MOINS ancrés dont l'ancrage < Force(D) — au plus
//     conversionMax par ville et par tour (défaut 1, PROVISOIRE —
//     équilibrage en second temps, arbitrage Thibaut 2026-11-14).
//     Le Dirigeant est immunisé (comportement conservé) ; les
//     nobles résistent davantage (ancrage +15).
//  ⚅ Plancher minuscule (arbitrage Thibaut 2026-11-14 : une ville
//     homogène n'est PAS immunisée) : une ville 100 % dominante
//     tente rng.chance(conversionPlancher) (défaut 1 %) → 1
//     habitant bascule vers la culture étrangère la plus forte.
//     En ville MIXTE, l'ancrage protège TOTALEMENT : pas de
//     plancher, zéro conversion si tout le monde résiste.
//  Toute la balance est EXPOSÉE via detailConversionVille (bloc
//  « Balance culturelle » de la carte de ville, mêmes nombres que
//  le moteur — le helper est la source unique de vérité).
//  updateCityCultures (majorité des vivants) est inchangé.
// ══════════════════════════════════════════════════════════════════════

import type { Character, City, GameState, Player, PlayerRecap } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { bump, fullName } from './shared'
import { productionTourismeBatiment, conversionLocaleBatimentsVille } from './batiments'
import { detailGainsVille } from './economie'
import { effetsDogmeCulture } from './dogmes'
import { rangDe } from './statutSocial'

// ── Influence culturelle (ApplyCultureInfluence) ─────────────────────────

/** Tourisme rattaché à UNE habitation (revue 2026-10-16) :
 *  constructions statiques de la ville (Chapelle +35, Foire +5…)
 *  + production locale par tour (Artistes et lignes « Autres » de
 *  la ville, taxes comprises). */
function tourismeVilleDe(state: GameState, p: Player, ville: City): number {
  const C = cfgOf(state.config)
  let t = 0
  for (const b of ville.batiments ?? []) t += productionTourismeBatiment(b, C, ville.type)
  for (const a of ville.amenagements ?? []) t += productionTourismeBatiment(a, C, ville.type)
  const d = detailGainsVille(state, p, ville, C)
  t += Math.max(0, (d.taxes['Tourisme'] ?? 0) * C.p.gainsCrediteStock)
  return t
}

/** Total du Tourisme rattaché aux habitations d'un joueur. */
function tourismeVillesDe(state: GameState, p: Player): number {
  let t = 0
  for (const v of p.villes) t += tourismeVilleDe(state, p, v)
  return t
}

/** Pression touristique (revue 2026-10-16, retour Thibaut) : pour
 *  CHAQUE culture, pression = tourisme GÉNÉRAL des joueurs qui la
 *  pratiquent (lois de culture, régimes… — tout ce qui n'est pas
 *  rattachable à une habitation ; RETRAIT 2026-10-24 : les
 *  technologies ne produisent plus de tourisme, système de
 *  progrès supprimé) + le tourisme de CHAQUE HABITATION de cette
 *  culture (bâtiments, aménagements et production locale de la
 *  ville). Un joueur qui a une capitale culturelle puissante
 *  pousse sa culture partout, et une ville d'accueil convertit ses
 *  habitants à la culture qu'elle pratique. (V2 2026-11-14 : le
 *  calcul de pression est CONSERVÉ tel quel — seule la MÉCANIQUE
 *  DE CONVERSION qui le consomme change.) */
function calculPression(state: GameState, C: ReturnType<typeof cfgOf>): Record<string, number> {
  const pression: Record<string, number> = {}
  for (const cult of C.cultures) pression[cult.nom] = 0.001
  // tourisme GÉNÉRAL par culture : total des joueurs de cette culture
  // moins la part rattachée à leurs villes (habitations).
  const generalParCulture: Record<string, number> = {}
  for (const other of state.players) {
    const tourTotal = other.resources['Tourisme']?.stock ?? 0
    const tourVilles = tourismeVillesDe(state, other)
    generalParCulture[other.culture] = (generalParCulture[other.culture] ?? 0) + tourTotal - tourVilles
  }
  // tourisme de chaque HABITATION, crédité à SA culture (ville.culture)
  for (const other of state.players) {
    for (const v of other.villes) {
      const tv = tourismeVilleDe(state, other, v)
      if (tv > 0) pression[v.culture ?? other.culture] = (pression[v.culture ?? other.culture] ?? 0) + tv
    }
  }
  for (const [cult, v] of Object.entries(generalParCulture)) {
    pression[cult] = (pression[cult] ?? 0) + Math.max(0, v)
  }
  return pression
}

// ── V2 « Pression/Ancrage » : détail par ville (source unique) ───────────

/** Ligne « Balance culturelle » d'une culture dans une ville. */
export interface DetailForceCulture {
  /** pression touristique mondiale de la culture (hors présence locale). */
  pression: number
  /** présence démographique : conversionPoidsLocal × vivants de la culture dans la ville. */
  presence: number
  /** force finale : (pression + présence) ×(1+évangile) + bonus d'accueil. */
  force: number
}

/** Conversion prévue ce tour pour un habitant. */
export interface DetailConversion {
  id: string
  nom: string
  /** culture ACTUELLE de l'habitant. */
  culture: string
  /** culture d'arrivée (la dominante). */
  vers: string
  /** ancrage : force de sa culture + noblesse. */
  ancrage: number
}

/** Balance culturelle complète d'une ville — exactement ce que le
 *  moteur appliquera au prochain fin de tour (hors plancher 1 %,
 *  aléatoire). Rendu par le bloc « Balance culturelle » de la
 *  carte de ville. */
export interface DetailConversionVille {
  /** vivants de la ville. */
  vivants: number
  /** force par culture, ordre du référentiel. */
  forces: Record<string, DetailForceCulture>
  /** culture dominante (force max, ex æquo : ordre du référentiel). */
  dominant: string
  /** conversions prévues ce tour, plus faible ancrage d'abord,
   *  plafonnées à conversionMax. Vide = personne ne bascule. */
  convertibles: DetailConversion[]
  /** vrai si la ville est 100 % dominante : plancher résiduel 1 %. */
  plancher: boolean
  /** culture cible du plancher (étrangère la plus forte), si plancher. */
  plancherVers: string | null
}

/** Duel « Pression/Ancrage » d'UNE ville (V2 2026-11-14). Pur :
 *  ne mute RIEN — applyCultureInfluence et la vue consomment le
 *  même résultat. */
function conversionDetailVille(
  state: GameState,
  p: Player,
  ville: City,
  pression: Record<string, number>,
  C: ReturnType<typeof cfgOf>,
): DetailConversionVille {
  const pop = state.population[p.n] ?? []
  const vivants = pop.filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom)
  // vivants par culture dans la ville (le Dirigeant COMPTE dans la
  // présence démographique — il pèse sur sa culture — mais reste
  // immunisé contre la conversion).
  const nb: Record<string, number> = {}
  for (const c of vivants) nb[c.culture] = (nb[c.culture] ?? 0) + 1
  // Forces : pression + présence, ×(1+évangile), puis bonus
  // d'accueil (dogme du Nationalisme conversionLocale + Guilde des
  // évangélistes conversionLocalePlus — remap V2 du correctif
  // arbitre Thibaut 30/10 et de la vague tier 3 : « pas un jet
  // séparé, pris en compte dans le test de conversion » → la
  // culture d'accueil de la ville gagne +v × la force TOTALE des
  // autres cultures, les chances en plus ne mènent QUE vers la
  // culture d'accueil).
  const forces: Record<string, DetailForceCulture> = {}
  const ordre: string[] = []
  for (const cult of C.cultures) ordre.push(cult.nom)
  for (const cult of Object.keys(pression)) if (!ordre.includes(cult)) ordre.push(cult)
  for (const cult of ordre) {
    const pr = pression[cult] ?? 0
    const presence = C.p.conversionPoidsLocal * (nb[cult] ?? 0)
    const base = (pr + presence) * (1 + effetsDogmeCulture(state, cult, 'pressionCulture', C))
    forces[cult] = { pression: pr, presence, force: base }
  }
  const accueil = ville.culture ?? p.culture
  const nationalisme = effetsDogmeCulture(state, accueil, 'conversionLocale', C)
  const guilde = conversionLocaleBatimentsVille(ville, C)
  if ((nationalisme > 0 || guilde > 0) && forces[accueil] !== undefined) {
    const autres = ordre.filter((cult) => cult !== accueil)
      .reduce((acc, cult) => acc + forces[cult]!.force, 0)
    forces[accueil]!.force += (nationalisme + guilde) * autres
  }
  // Culture dominante D : force max, ex æquo → ordre du référentiel.
  let dominant = ordre[0] ?? accueil
  for (const cult of ordre) {
    if ((forces[cult]?.force ?? 0) > (forces[dominant]?.force ?? 0)) dominant = cult
  }
  // Ancrage d'un habitant = force de SA culture dans la ville +
  // noblesse. Éligibles à la conversion : vivants de culture ≠ D,
  // hors Dirigeant (immunisé, comportement conservé).
  // Ancrage d'un habitant (forme arbitrée 2026-11-14) : poids ×
  //  compatriotes de SA culture dans la ville + noblesse. C'est la
  //  RÉSISTANCE (défense) ; la pression touristique de sa culture
  //  ne joue que dans la FORCE (offense). Un isolé bascule avant
  //  une communauté, un roturier avant un noble ; une communauté
  //  nombreuse protège ses membres tant que la force dominante ne
  //  dépasse pas le poids de ses compatriotes (+ noblesse).
  const ancrage = (c: Character): number =>
    C.p.conversionPoidsLocal * (nb[c.culture] ?? 0)
    + (rangDe(c, C) === 'noble' ? C.p.conversionAncrageNoble : 0)
  const forceDominante = forces[dominant]?.force ?? 0
  // conversions prévues : éligibles dont l'ancrage < Force(D), ancrage
  // croissant (ex æquo → ordre de recensement : sort V8 est stable),
  // plafonnées à conversionMax (défaut 1, PROVISOIRE).
  const convertibles = vivants
    .map((c) => ({ c, a: ancrage(c) }))
    .filter(({ c, a }) => c.culture !== dominant && c.metier !== C.p.metierDirigeant && a < forceDominante)
    .sort((x, y) => x.a - y.a)
    .slice(0, Math.max(1, C.p.conversionMax))
    .map(({ c, a }) => ({ id: c.id, nom: fullName(c), culture: c.culture, vers: dominant, ancrage: a }))
  // Plancher minuscule : uniquement si la ville est 100 % dominante
  // (aucun vivant d'une autre culture, Dirigeant compris — une
  // minorité réduite au seul Dirigeant immunisé ne déclenche rien).
  const pure = vivants.every((c) => c.culture === dominant)
  let plancherVers: string | null = null
  if (pure) {
    let meilleure: string | null = null
    for (const cult of ordre) {
      if (cult === dominant) continue
      if (meilleure === null || (forces[cult]?.force ?? 0) > (forces[meilleure]?.force ?? 0)) {
        meilleure = cult
      }
    }
    plancherVers = meilleure
  }
  return {
    vivants: vivants.length,
    forces,
    dominant,
    convertibles,
    plancher: pure && plancherVers !== null,
    plancherVers,
  }
}

/** Balance culturelle d'une ville POUR LA VUE (bloc « Balance
 *  culturelle » de la carte de ville) — recompute de la pression,
 *  puis duel identique au moteur. */
export function detailConversionVille(
  state: GameState,
  p: Player,
  ville: City,
  C: ReturnType<typeof cfgOf>,
): DetailConversionVille {
  return conversionDetailVille(state, p, ville, calculPression(state, C), C)
}

/** Fin de tour (V2 2026-11-14) : pour chaque ville du joueur, la
 *  culture dominante convertit ses habitants les moins ancrés
 *  (détail complet cf. conversionDetailVille). Aucun tirage au
 *  hasard par habitant — le SEUL rng est le plancher 1 % des
 *  villes 100 % dominantes. */
export function applyCultureInfluence(state: GameState, p: Player, rng: Rng, recap: PlayerRecap) {
  const C = cfgOf(state.config)
  const pression = calculPression(state, C)
  const pop = state.population[p.n] ?? []
  for (const ville of p.villes) {
    const d = conversionDetailVille(state, p, ville, pression, C)
    if (d.vivants === 0) continue
    const convertir = (c: Character, vers: string) => {
      c.culture = vers
      bump(recap.conversions, vers)
      state.log.push({
        turn: state.turn + 1, type: 'Culture', joueur: p.n,
        texte: `${fullName(c)} se convertit à la culture ${vers}.`,
      })
    }
    if (d.convertibles.length > 0) {
      for (const cible of d.convertibles) {
        const c = pop.find((x) => x.id === cible.id)
        if (c && c.statut !== 'Décédé' && c.culture !== cible.vers) convertir(c, cible.vers)
      }
    } else if (d.plancher && d.plancherVers && rng.chance(C.p.conversionPlancher)) {
      // plancher : 1 habitant (premier au recensement — ancrage
      // égal en ville pure) bascule vers la culture étrangère la
      // plus forte.
      const c = pop.find(
        (x) => x.statut !== 'Décédé' && x.ville === ville.nom && x.metier !== C.p.metierDirigeant,
      )
      if (c && c.culture !== d.plancherVers) convertir(c, d.plancherVers)
    }
  }
}

export function updateCityCultures(state: GameState, p: Player) {
  const pop = state.population[p.n] ?? []
  for (const ville of p.villes) {
    const vivants = pop.filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom)
    if (vivants.length === 0) continue
    const counts: Record<string, number> = {}
    for (const c of vivants) counts[c.culture] = (counts[c.culture] ?? 0) + 1
    const major = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    ville.culture = major
  }
}
