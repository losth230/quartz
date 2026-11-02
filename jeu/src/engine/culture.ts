// ══════════════════════════════════════════════════════════════════════
//  CULTURE — CONVERSIONS ET VILLES (ApplyCultureInfluence)
//  Pression touristique, conversions culturelles et culture majoritaire des villes.
//  Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player, PlayerRecap } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { bump, fullName } from './shared'
import { productionTourismeBatiment } from './batiments'
import { detailGainsVille } from './economie'
import { effetsDogmeCulture } from './dogmes'

// ── Influence culturelle (ApplyCultureInfluence) ─────────────────────────

/** Tourisme rattaché à UNE habitation (revue 2026-10-16) :
 *  constructions statiques de la ville (Chapelle +35, Foire +5…)
 *  + production locale par tour (Artistes et lignes « Autres » de
 *  la ville, taxes comprises). */
function tourismeVilleDe(state: GameState, p: Player, ville: import('./types').City): number {
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

export function applyCultureInfluence(state: GameState, p: Player, rng: Rng, recap: PlayerRecap) {
  const C = cfgOf(state.config)
  const pop = state.population[p.n] ?? []
  // Pression touristique (revue 2026-10-16, retour Thibaut) : pour
  //  CHAQUE culture, pression = tourisme GÉNÉRAL des joueurs qui la
  //  pratiquent (lois de culture, régimes… — tout ce qui n'est pas
  //  rattachable à une habitation ; RETRAIT 2026-10-24 : les
  //  technologies ne produisent plus de tourisme, système de
  //  progrès supprimé) + le
  //  tourisme de CHAQUE HABITATION de cette culture (bâtiments,
  //  aménagements et production locale de la ville). Un joueur qui
  //  a une capitale culturelle puissante pousse sa culture partout,
  //  et une ville d'accueil convertit ses habitants à la culture
  //  qu'elle pratique.
  const pression: Record<string, number> = {}
  for (const cult of C.cultures) pression[cult.nom] = 0.001
  // tourisme GÉNÉRAL par culture : total des joueurs de cette culture
  //  moins la part rattachée à leurs villes (habitations).
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
  for (const c of pop) {
    if (c.statut === 'Décédé' || c.metier === C.p.metierDirigeant) continue
    // (Dogme du Nationalisme, CORRECTIF arbitre Thibaut du 30/10 —
    //  4e retour : « ce n'est pas un nouveau jet, mais pris en
    //  compte dans le test de conversion culturelle déjà présent ».
    //  La culture de la ville d'ACCUEIL du personnage, capturée
    //  AVANT toute conversion du tour — si elle porte le dogme et
    //  que le personnage est d'une AUTRE culture, la culture
    //  d'accueil gagne +v × le poids TOTAL des autres cultures
    //  dans le tirage pondéré ci-dessous (effet conversionLocale,
    //  défaut +0,15) : les chances en plus ne mènent QUE vers la
    //  culture d'accueil, jamais vers une tierce culture, et les
    //  personnages déjà de la culture d'accueil ne sont pas
    //  touchés.)
    const culteAccueil = p.villes.find((v) => v.nom === c.ville)?.culture
    const nationalisme = culteAccueil && culteAccueil !== c.culture
      ? effetsDogmeCulture(state, culteAccueil, 'conversionLocale', C)
      : 0
    if (rng.chance(C.p.conversionProba)) {
      const poids: Record<string, number> = {}
      for (const [cult, w] of Object.entries(pression)) {
        let weight = w
        if (cult === c.culture) weight *= C.p.conversionMemeCulture // présence locale
        // (Dogme de l'Évangile, 2026-10-30 : la culture porteuse
        //  est ×(1+v) plus importante dans la conversion
        //  culturelle (effet pressionCulture, défaut ×1,1) — le
        //  poids FINAL de la culture (pression + présence locale)
        //  est multiplié, pas seulement la pression touristique.)
        weight *= 1 + effetsDogmeCulture(state, cult, 'pressionCulture', C)
        const same = pop.filter((x) => x.statut !== 'Décédé' && x.ville === c.ville && x.culture === cult).length
        weight += same * C.p.conversionPoidsLocal
        poids[cult] = weight
      }
      // (Dogme du Nationalisme, suite : intégration AU TIRAGE —
      //  bonus de part pour la culture d'accueil dans le pickWeighted,
      //  pas de jet supplémentaire.)
      if (nationalisme > 0 && culteAccueil) {
        const poidsAutres = Object.entries(poids)
          .filter(([cult]) => cult !== culteAccueil)
          .reduce((acc, [, w]) => acc + w, 0)
        poids[culteAccueil] = (poids[culteAccueil] ?? 0) + nationalisme * poidsAutres
      }
      const entries = Object.entries(poids)
      const nouvelle = rng.pickWeighted(entries, (e) => e[1])[0]
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
