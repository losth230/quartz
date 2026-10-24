// ═══════════════════════════════════════════════════════════════════════════
//  SIMULATION BONHEUR — 5 facteurs (design domiciles/bonheur 2026-10-24)
//
//  AVANT code de production : ce script branche les formules candidates
//  sur le VRAI moteur (createGame + états réels) et imprime la courbe
//  de chaque facteur sur une plage de situations, pour arbitrer les
//  formes et les seuils. Il ne modifie RIEN du moteur.
//
//  ARBITRAGES Thibaut FINAUX (2026-10-24, v3) :
//   · EMPLOI, LOGEMENT, SÉCURITÉ : formule OPTIMUM symétrique —
//       100 seulement si l'offre ÉGALE exactement la demande
//       (manque ET excès pénalisent IDENTIQUEMENT : ±25 % → 75,
//       ×2 → 0) ;
//   · LOGEMENT : PAR HABITANT (1 logement = 1 habitant logé) ;
//   · SÉCURITÉ : cible = 100 × rang d'habitation (0 si nulle,
//       0 aussi à 2× la cible — optimum symétrique) ;
//   · SANTÉ : 100 − pourcentage de malades (linéaire) ;
//   · TOURISME : tourisme du joueur / tourisme MONDIAL (part relative,
//       plafonnée à 100) ;
//   · BONHEUR : moyenne simple des 5 facteurs.
//
//  Lancement : npx tsx scripts/sim-bonheur.ts
// ═══════════════════════════════════════════════════════════════════════════

import { createGame, defaultSetups } from '../src/engine/setup'
import { cfgOf, type Cfg } from '../src/engine/gameData'
import { garnisonHabitationVille } from '../src/engine/garnisons'
import { capMetierVille } from '../src/engine/metiers'
import { metiersDisponiblesRang, rangsDefsType } from '../src/engine/habitations'
import { rangNiveau } from '../src/engine/rangs'
import { productionTourismeBatiment } from '../src/engine/batiments'
import { tourismeCourant } from '../src/engine/regimes'
import type { City, GameState, Player } from '../src/engine/types'

// ── Formules ─────────────────────────────────────────────────────────

/** OPTIMUM SYMÉTRIQUE (arbitrage v2) : 100 si offre = demande EXACTEMENT.
 *  Manque et excès pénalisent PAREIL : écart relatif × 100 de malus.
 *  borne [0, 100]. */
export function scoreOptimum(offre: number, demande: number): number {
  if (demande <= 0) return offre <= 0 ? 100 : 0
  if (offre <= 0) return 0
  const ratio = offre / demande
  const malus = Math.abs(1 - ratio)
  return Math.max(0, Math.min(100, Math.round(100 * (1 - malus))))
}

/** SANTÉ : 100 − pourcentage de malades (linéaire, arbitrage v2). */
export function scoreSante(malades: number, habitants: number): number {
  if (habitants <= 0) return 100
  return Math.max(0, Math.min(100, Math.round(100 - (100 * malades) / habitants)))
}

/** TOURISME : part relative du joueur dans le tourisme MONDIAL
 *  (arbitrage v2) — plafonnée à 100. Un joueur seul au monde avec du
 *  tourisme = 100 ; 8 joueurs à égalité = 12,5 chacun. */
export function scoreTourisme(tourismeJoueur: number, tourismeMondial: number): number {
  if (tourismeMondial <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((100 * tourismeJoueur) / tourismeMondial)))
}

/** Bonheur de la ville : MOYENNE SIMPLE des 5 facteurs (arbitrage v2). */
export interface ScoresVille { emploi: number; logement: number; securite: number; tourisme: number; sante: number }
export function bonheurVille(s: ScoresVille): number {
  const v = [s.emploi, s.logement, s.securite, s.tourisme, s.sante]
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length)
}

// ── Extraction des données réelles d'une ville ──────────────────────

export interface DonneesVille {
  travailleurs: number       // adultes vivants
  emploisOfferts: number    // places de métiers plafonnées
  postesPourvus: number     // travailleurs avec un métier
  foyers: number            // familles
  logements: number         // domiciles disponibles
  // (arbitrage 2026-10-24 v3 : le logement se mesure PAR HABITANT —
  //  1 logement = 1 habitant logé ; 100 si chacun a le sien, 0 si
  //  personne n'en a ou s'il y a 2× plus de logements que d'habitants)
  garnison: number          // garnison effective
  rang: number              // rang d'habitation (1-3)
  tourismeJoueur: number     // production Tourisme du joueur
  tourismeMondial: number    // production Tourisme de tous les joueurs
  malades: number
  habitants: number
}

export function donneesVille(state: GameState, p: Player, ville: City, C: Cfg): DonneesVille {
  const pop = (state.population[p.n] ?? []).filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom)
  const vivants = pop.length
  const adultes = pop.filter((c) => c.age >= C.p.adultAge)
  const enPoste = pop.filter((c) => c.metier).length
  // offres : toutes les places plafonnées de la ville
  let offres = 0
  const ctx = { state, joueur: p } as never
  for (const m of metiersListeVille(ville, C)) {
    offres += Math.floor(capMetierVille(m, ville, C, ctx))
  }
  const tj = tourismeCourant(state, p, C)
  const tMondial = state.players.reduce((acc, q) => acc + tourismeCourant(state, q, C), 0)
  return {
    travailleurs: adultes.length,
    emploisOfferts: offres,
    postesPourvus: enPoste,
    foyers: Math.max(1, Math.round(vivants / 4)),   // ≈ 4/foyer (simulation — vague A : vrais foyers)
    logements: logementsRang(ville, C),              // domiciles du rang (vague A : table structurée)
    garnison: garnisonHabitationVille(p, ville, C, state),
    rang: rangNiveau(ville, C),
    tourismeJoueur: tj,
    tourismeMondial: tMondial,
    malades: pop.filter((c) => c.malade).length,
    habitants: vivants,
  }
}

/** Métiers plafonnés d'une ville (base du rang + bâtiments) — pour
 *  sommer les offres sans dépendre d'un contexte d'affectation. */
function metiersListeVille(ville: City, C: Cfg): string[] {
  const base = Object.keys(metiersDisponiblesRang(ville, C))
  return base
}

/** Logements du rang (SIMULATION : parsé du texte domicilesDisponibles —
 *  « 50 maisons, 10 Auberge » → 60 ; la vague A remplacera par la
 *  table structurée domiciles[]. */
function logementsRang(ville: City, C: Cfg): number {
  const def = rangsDefsType(ville.type ?? 'Ville', C)
    .find((d) => d.rang.toLowerCase() === (ville.rang ?? 'Hameau').toLowerCase())
  const txt = def?.domicilesDisponibles ?? ''
  let total = 0
  for (const part of txt.split(',')) {
    const m = part.trim().match(/^(\d+)\s/)
    if (m) total += Number(m[1])
  }
  return total
}

// ── Scores par facteur (formules arbitrées v2) ──────────────────────

export function scoresVille(d: DonneesVille): ScoresVille {
  // EMPLOI (v2) : offre = emplois offerts, demande = travailleurs —
  //  100 UNIQUEMENT si offres == travailleurs ET tout est pourvu.
  //  Deux écarts possibles : offres≠travailleurs (structure) et
  //  postes non pourvus. On prend le pire des deux ratios : un poste
  //  vacant compte comme un excès d'offre.
  const ratioStructure = d.emploisOfferts / Math.max(1, d.travailleurs)
  const ratioPourvu = d.postesPourvus / Math.max(1, Math.min(d.emploisOfferts, d.travailleurs))
  const emploi = Math.round((scoreOptimum(d.emploisOfferts, d.travailleurs) + scoreOptimum(ratioStructure * ratioPourvu * d.travailleurs, d.travailleurs)) / 2)
  // LOGEMENT (v3, arbitrage Thibaut : 1 logement par HABITANT) —
  //  offre = logements de la ville, demande = habitants. 100 si
  //  chacun a le sien ; 0 si personne n'en a ; 0 aussi à 2× (excès
  //  symétrique — formule optimum standard).
  const logement = scoreOptimum(d.logements, d.habitants)
  // SÉCURITÉ (v2) : cible = 100 × rang d'habitation.
  const securite = scoreOptimum(d.garnison, 100 * d.rang)
  // TOURISME (v2) : part du joueur dans le mondial.
  const tourisme = scoreTourisme(d.tourismeJoueur, d.tourismeMondial)
  // SANTÉ (v2) : 100 − % malades.
  const sante = scoreSante(d.malades, d.habitants)
  return { emploi, logement, securite, tourisme, sante }
}

// ── Simulation ───────────────────────────────────────────────────────

function barre(score: number): string {
  const n = Math.round(score / 5)
  return '█'.repeat(n) + '░'.repeat(20 - n)
}

function main() {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 424242, 'local')
  const p = state.players[0]
  const ville = p.villes[0]
  const d0 = donneesVille(state, p, ville, C)
  console.log('════ SIMULATION BONHEUR v2 — partie réelle (8 joueurs, tour 1) ════')
  console.log(`ville témoin : ${ville.nom} (${ville.rang}, rang ${d0.rang}) — ${d0.habitants} habitants`)
  console.log(`travailleurs: ${d0.travailleurs} · offres: ${d0.emploisOfferts} · pourvus: ${d0.postesPourvus}`)
  console.log(`foyers: ${d0.foyers} · logements: ${d0.logements} · garnison: ${d0.garnison} (cible ${100 * d0.rang})`)
  console.log(`tourisme joueur: ${d0.tourismeJoueur} / mondial: ${d0.tourismeMondial} · malades: ${d0.malades}`)
  console.log()

  console.log('── Courbe OPTIMUM symétrique (emploi / logement / sécurité) ──')
  console.log('offre/demande  score   courbe')
  for (const r of [0, 0.2, 0.4, 0.6, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2, 3]) {
    const s = scoreOptimum(r, 1)
    console.log(`${r.toFixed(2).padStart(9)}  ${String(s).padStart(3)}   ${barre(s)}`)
  }
  console.log()
  console.log('── SANTÉ : 100 − % malades ──')
  for (const pct of [0, 5, 10, 20, 30, 50]) {
    const s = scoreSante(pct, 100)
    console.log(`${(String(pct) + ' % malades').padEnd(14)} ${String(s).padStart(3)}   ${barre(s)}`)
  }
  console.log()
  console.log('── TOURISME : part du joueur dans le mondial ──')
  for (const [tj, tm] of [[0, 0], [10, 80], [20, 80], [80, 80], [100, 80], [160, 80]] as const) {
    const s = scoreTourisme(tj, tm)
    console.log(`${`${tj}/${tm}`.padEnd(10)} ${String(s).padStart(3)}   ${barre(s)}`)
  }
  console.log()

  console.log('── Scénarios (données réelles de la ville témoin, variations) ──')
  const scenarios: Array<[string, Partial<DonneesVille>]> = [
    ['ville témoin (tour 1)', {}],
    ['parfait : offres = travailleurs, 1 logt/hab, garnison cible', { emploisOfferts: d0.travailleurs, postesPourvus: d0.travailleurs, logements: d0.habitants, garnison: 100 * d0.rang, tourismeJoueur: d0.tourismeMondial, malades: 0 }],
    ['chômage 1/2 (postes pourvus / 2)', { postesPourvus: Math.floor(d0.postesPourvus / 2) }],
    ['excès d offres 2× travailleurs', { emploisOfferts: d0.travailleurs * 2, postesPourvus: d0.travailleurs }],
    ['excès léger d offres (+30 %)', { emploisOfferts: Math.round(d0.travailleurs * 1.3), postesPourvus: d0.travailleurs }],
    ['manque d offres (la moitié)', { emploisOfferts: Math.floor(d0.travailleurs / 2), postesPourvus: Math.floor(d0.travailleurs / 2) }],
    ['logements = habitants (100 %)', { logements: d0.habitants }],
    ['logements = 80 habitants (excès ~1/3)', { logements: Math.round(d0.habitants * 0.8) }],
    ['logements × 2 habitants (excès → 0)', { logements: d0.habitants * 2 }],
    ['logements / 2 (moitié logée)', { logements: Math.floor(d0.habitants / 2) }],
    ['aucun logement', { logements: 0 }],
    ['garnison = cible exacte', { garnison: 100 * d0.rang }],
    ['garnison 2× cible', { garnison: 200 * d0.rang }],
    ['garnison nulle', { garnison: 0 }],
    ['tourisme seul au monde', { tourismeJoueur: d0.tourismeMondial }],
    ['tourisme partagé (1/8)', { tourismeJoueur: Math.round(d0.tourismeMondial / 8) }],
    ['épidémie 30 %', { malades: Math.round(d0.habitants * 0.3) }],
    ['crise combinée', { postesPourvus: Math.floor(d0.postesPourvus * 0.3), logements: Math.floor(d0.logements / 2), garnison: 0, malades: Math.round(d0.habitants * 0.3) }],
  ]
  console.log('scénario                              emploi logt sécu tour santé | bonheur')
  for (const [nom, mod] of scenarios) {
    const d = { ...d0, ...mod } as DonneesVille
    const s = scoresVille(d)
    const b = bonheurVille(s)
    console.log(
      `${nom.padEnd(36)} ${String(s.emploi).padStart(4)} ${String(s.logement).padStart(4)} ${String(s.securite).padStart(4)} ${String(s.tourisme).padStart(3)} ${String(s.sante).padStart(4)} | ${String(b).padStart(3)} ${barre(b)}`,
    )
  }
  console.log()
  console.log('NB (simulation) : logements parsés du texte domicilesDisponibles')
  console.log('    du rang — la vague A (table domiciles) remplacera. Foyers ≈ hab/4')
  console.log('    restent affichés pour référence, le logement est par habitant (v3).')
}

main()
