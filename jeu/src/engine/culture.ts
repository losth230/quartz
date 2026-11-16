// ══════════════════════════════════════════════════════════════════════
//  CULTURE — CONVERSIONS ET VILLES (ApplyCultureInfluence)
//  TIRAGE PAR HABITANT (retour Thibaut 2026-11-16 « je préférais
//  l'ancien ») : FINI le duel déterministe V2 « Pression/Ancrage » du
//  2026-11-14 — chaque habitant vivant (hors Dirigeant, immunisé) a
//  CONVERSIONPROBA (défaut 5 %) de chances PAR TOUR de se convertir ;
//  la culture d'arrivée est tirée au hasard PONDÉRÉ par le tourisme
//  de CHAQUE culture du monde (pression touristique, revue
//  2026-10-16 : tourisme général des joueurs de la culture +
//  tourisme rattaché aux habitations de cette culture — SANS le
//  poids démographique des compatriotes, arbitrage Thibaut
//  2026-11-16 « ancien sans le poids des compatriotes »).
//  La culture ACTUELLE de l'habitant est candidate du tirage
//  (arbitrage Thibaut 2026-11-16) : tirée = pas de conversion.
//  Modificateurs du tirage (tous dans le POIDS, jamais de jet
//  séparé — retours arbitre 30/10 et 03/11 conservés) :
//  ⚅ Dogme de l'Évangile (pressionCulture) : le poids de la
//     culture porteuse est ×(1+v), défaut ×1,1.
//  ⚅ Guilde des évangélistes (conversionLocalePlus, arbitrée
//     2026-11-16 « poids dans la conversion ×1,1 comme
//     l'évangélisme ») : le poids de la culture de la ville
//     d'accueil est ×(1+v) pour les habitants de cette ville
//     (lecture sur les bâtiments ACTIFS, cumul multiplicatif).
//  ⚅ Dogme du Nationalisme (conversionLocale) : les habitants
//     d'une AUTRE culture vivant dans une ville de la culture
//     gagnent +v × le poids TOTAL des autres cultures — vers la
//     culture d'accueil uniquement (défaut +0,15).
//  ⚅ Tour de Crystal (ancrageConversionMult) : « chances de
//     conversion des habitants de cette habitation réduites de
//     10 % » → la proba du jet est ÷N (×N sur la résistance),
//     pour les habitants de la ville qui l'abrite.
//  L'ORDRE DU TOUR est inchangé : la conversion se joue AVANT le
//  flux de migration, sur la population d'avant le flux (arbitrage
//  Thibaut 2026-11-14, incident salon L2 — un arrivant garde sa
//  culture le tour de son arrivée, éligible au tour suivant).
//  updateCityCultures (majorité des vivants) est inchangé.
// ══════════════════════════════════════════════════════════════════════

import type { City, GameState, Player, PlayerRecap } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { bump, fullName } from './shared'
import { conversionLocaleBatimentsVille, ancrageConversionMultVille } from './batiments'
import { productionTourismeBatiment } from './batiments'
import { detailGainsVille } from './economie'
import { effetsDogmeCulture } from './dogmes'

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
 *  ville). Un joueur qui a une capitale culturelle puissante pousse
 *  sa culture partout. (Retour 2026-11-16 : c'est la SEULE base de
 *  pondération du tirage de conversion — plus de poids
 *  démographique local.) */
export function calculPression(state: GameState, C: ReturnType<typeof cfgOf>): Record<string, number> {
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

/** Poids de conversion d'une culture pour un habitant donné :
 *  pression touristique ×(1+évangile) ; la culture de la ville
 *  d'accueil est ×(1+guilde des évangélistes). Pur — consommé par
 *  applyCultureInfluence (et exposé à la vue, source unique).
 *  NB : le bonus du dogme Nationalisme (+v × poids des autres vers
 *  la culture d'accueil) n'est PAS dans ce poids — il ne joue que
 *  pour les habitants d'une AUTRE culture que celle d'accueil, le
 *  moteur l'ajoute au moment du tirage. */
export function poidsConversion(
  state: GameState,
  C: ReturnType<typeof cfgOf>,
  pression: Record<string, number>,
  villeAccueil: City | undefined,
): Record<string, number> {
  const poids: Record<string, number> = {}
  for (const [cult, w] of Object.entries(pression)) {
    poids[cult] = w * (1 + effetsDogmeCulture(state, cult, 'pressionCulture', C))
  }
  // Guilde des évangélistes (arbitrage 2026-11-16 « comme
  //  l'évangélisme ») : poids de la culture de la VILLE d'accueil
  //  ×(1+v par guilde active) pour les habitants de cette ville.
  if (villeAccueil) {
    const accueil = villeAccueil.culture
    const guilde = conversionLocaleBatimentsVille(villeAccueil, C)
    if (guilde > 0 && accueil && poids[accueil] !== undefined) {
      poids[accueil] *= 1 + guilde
    }
  }
  // (Sécurité : une culture sans poids positif est injouable au
  //  pickWeighted — le référentiel garantit 0,001 partout, on
  //  replanche à 0,001 si un poids finissait à 0.)
  for (const cult of Object.keys(poids)) {
    if (poids[cult]! < 0) poids[cult] = 0.001
  }
  return poids
}

/** Fin de tour : pour CHAQUE habitant vivant du joueur (hors
 *  Dirigeant), jet à conversionProba (÷ Tour de Crystal de sa
 *  ville), puis tirage pondéré par le tourisme des cultures du
 *  monde. La culture actuelle est candidate : tirée = pas de
 *  conversion. */
export function applyCultureInfluence(state: GameState, p: Player, rng: Rng, recap: PlayerRecap) {
  const C = cfgOf(state.config)
  const pression = calculPression(state, C)
  const pop = state.population[p.n] ?? []
  for (const c of pop) {
    if (c.statut === 'Décédé' || c.metier === C.p.metierDirigeant) continue
    const villeAccueil = p.villes.find((v) => v.nom === c.ville)
    const culteAccueil = villeAccueil?.culture
    // (Merveilles mondiales 2026-11-15, Tour de Crystal : « chances
    //  de conversion des habitants de cette habitation réduites de
    //  10 % » — retour au tirage 2026-11-16 : la résistance ×N se
    //  lit DIRECTEMENT sur la proba du jet, ÷N.)
    const proba = C.p.conversionProba / (villeAccueil ? ancrageConversionMultVille(villeAccueil, C) : 1)
    if (!rng.chance(proba)) continue
    const poids = poidsConversion(state, C, pression, villeAccueil)
    // (Dogme du Nationalisme, correctif arbitre Thibaut du 30/10 :
    //  « pas un jet séparé, pris en compte dans le test de
    //  conversion déjà présent ». La culture de la ville d'ACCUEIL
    //  du personnage — si elle porte le dogme et que le personnage
    //  est d'une AUTRE culture — gagne +v × le poids TOTAL des
    //  autres cultures dans le tirage : les chances en plus ne
    //  mènent QUE vers la culture d'accueil.)
    const nationalisme = culteAccueil && culteAccueil !== c.culture
      ? effetsDogmeCulture(state, culteAccueil, 'conversionLocale', C)
      : 0
    if (nationalisme > 0 && culteAccueil && poids[culteAccueil] !== undefined) {
      const poidsAutres = Object.entries(poids)
        .filter(([cult]) => cult !== culteAccueil)
        .reduce((acc, [, w]) => acc + w, 0)
      poids[culteAccueil] += nationalisme * poidsAutres
    }
    const nouvelle = rng.pickWeighted(Object.entries(poids), (e) => e[1])[0]
    if (nouvelle !== c.culture) {
      c.culture = nouvelle
      bump(recap.conversions, nouvelle)
      state.log.push({
        turn: state.turn + 1, type: 'Culture', joueur: p.n,
        texte: `${fullName(c)} se convertit à la culture ${nouvelle}.`,
      })
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
