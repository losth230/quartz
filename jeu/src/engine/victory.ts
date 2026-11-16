// ══════════════════════════════════════════════════════════════════════
//  VOIES DE VICTOIRE — LAURIERS I à V (refonte 2026-10-14, V ajouté le
//  2026-11-16 — arbitrage Thibaut : le Laurier IV devient COMMUN à
//  toutes les voies « habitation de rang 3 », l'ancien triomphe de
//  chaque voie passe en LAURIER V)
// ══════════════════════════════════════════════════════════════════════
//  Refonte arbitrée par Thibaut : les niveaux d'une voie s'appellent
//  LAURIERS (plus de « Rang I-IV » — déjà pris par les rangs de pays et
//  d'habitation). Validation MANUELLE au radar de l'accueil (les
//  joueurs cochent — arbitre de confiance), en ORDRE STRICT : un
//  Laurier ne se valide que si le précédent est acquis. Crise à tirer
//  au plateau aux LAURIERS I et III uniquement (arbitrage Thibaut
//  2026-11-16, avant : chaque Laurier I-III) ; les bonus one-shot ne
//  s'appliquent que si le Laurier est complété pendant l'âge de même
//  numéro (I pendant l'Âge I, II pendant l'Âge II) ; le Laurier V =
//  VICTOIRE. L'ancienne auto-détection « domination » (checkVictory,
//  part de l'Or mondial, voie Dynastique fantôme) a été supprimée :
//  les conditions du classeur (captures, routes…) ne sont pas
//  toutes suivies par le moteur, la validation reste humaine.
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from './types'
import { cfgOf } from './gameData'

const ROMAINS = ['I', 'II', 'III', 'IV', 'V']

/** Lauriers qui déclenchent une CRISE à tirer au plateau
 *  (arbitrage Thibaut 2026-11-16 : I et III uniquement). */
export const LAURIERS_CRISE = [1, 3]

/** Nombre de Lauriers validés par un joueur sur une voie (0-5). */
export function nbLauriers(p: Player, voie: string): number {
  return p.lauriers?.[voie] ?? 0
}

/** Coche (ou décoche) un Laurier d'une voie — ORDRE STRICT garanti :
 *  - cocher le Laurier `niveau` (1-5) n'est possible que si c'est le
 *    suivant du dernier validé (ni saut, ni retour en arrière) ;
 *  - `niveau` = 0 décoche le dernier Laurier validé (erreur de saisie
 *    à la table — aucun journal).
 *  Journalise chaque validation : rappel de la crise à tirer (Lauriers
 *  I et III seulement) et du bonus, proclamation de VICTOIRE au
 *  Laurier V. Retourne le niveau atteint, ou -1 si l'ordre strict
 *  l'interdit. `p` doit être le joueur DANS l'état (mutation). */
export function cocherLaurier(state: GameState, p: Player, voie: string, niveau: number): number {
  const actuel = nbLauriers(p, voie)
  if (niveau === 0 && actuel > 0) {
    p.lauriers = { ...(p.lauriers ?? {}), [voie]: actuel - 1 }
    return actuel - 1
  }
  if (niveau < 1 || niveau > 5 || niveau !== actuel + 1) return -1
  p.lauriers = { ...(p.lauriers ?? {}), [voie]: niveau }
  const def = cfgOf(state.config).config.victoires.find((v) => v.voie === voie)
  const bonus = def?.lauriers[niveau - 1]?.bonus ?? ''
  if (niveau === 5) {
    state.log.push({
      turn: state.turn, type: 'Système', joueur: p.n,
      texte: `👑 VICTOIRE ! ${p.nom} vient de valider le Laurier V de la voie ${voie} — la partie s'achève sur son triomphe !`,
    })
  } else {
    const crise = LAURIERS_CRISE.includes(niveau) ? ' — une crise doit être tirée.' : '.'
    state.log.push({
      turn: state.turn, type: 'Système', joueur: p.n,
      texte: `🏆 Laurier ${ROMAINS[niveau - 1]} de la voie ${voie} validé pour ${p.nom}${crise}${bonus ? ` ${bonus}` : ''}`,
    })
  }
  return niveau
}

/** Joueurs ayant atteint le Laurier V d'une voie (= victoire). */
export function victoireAtteinte(state: GameState): { joueur: number; nom: string; voie: string }[] {
  const out: { joueur: number; nom: string; voie: string }[] = []
  for (const p of state.players) {
    for (const [voie, n] of Object.entries(p.lauriers ?? {})) {
      if (n >= 5) out.push({ joueur: p.n, nom: p.nom, voie })
    }
  }
  return out
}

// ── Progression chiffrée vers chaque Laurier V (radar de l'accueil) ────

export interface VictoryProgress {
  joueur: number
  nom: string
  /** ratio 0..1 par voie — 1 = Laurier V validé (victoire). */
  valeurs: Record<string, number>
  /** détail du calcul, affiché au survol du sommet correspondant du radar. */
  details: Record<string, string>
}

/** Clé d'axe du radar : nom de la voie normalisé (minuscule sans
 *  accents) — « Économique » → « economique », « Diplomatique » →
 *  « diplomatique ». */
function cleVoie(voie: string): string {
  return voie.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Axes du radar : une par voie de victoire du référentiel (6 par
 *  défaut — l'ancien axe « Dynastique » fantôme disparaît). */
export function victoryLabels(state?: GameState): { key: string; label: string }[] {
  const victoires = state ? cfgOf(state.config).config.victoires : cfgOf(undefined).config.victoires
  return victoires.map((v) => ({ key: cleVoie(v.voie), label: v.voie }))
}

/** Progression (0..1) de chaque joueur vers chaque Laurier V : ratio
 *  = Lauriers validés / 5, détail au survol = « X/5 Lauriers » et
 *  condition du prochain Laurier à accomplir. */
export function victoryProgress(state: GameState): VictoryProgress[] {
  const victoires = cfgOf(state.config).config.victoires
  return state.players.map((p) => {
    const valeurs: Record<string, number> = {}
    const details: Record<string, string> = {}
    for (const v of victoires) {
      const n = nbLauriers(p, v.voie)
      valeurs[cleVoie(v.voie)] = n / 5
      // (RETRAIT 2026-10-24 : les textes de conditions sont supprimés
      //  du référentiel (Lauriers vides, retour arbitre) — repli « … »
      //  au survol du radar. (Textes RESTAURÉS le 2026-11-16 : le
      //  repli ne sert plus que pour la voie Scientifique, vide.))
      details[cleVoie(v.voie)] =
        n >= 5
          ? `${n}/5 Lauriers — voie ${v.voie} TERMINÉE 👑`
          : `${n}/5 Lauriers — prochain : ${v.lauriers[n]?.condition || '…'}`
    }
    return { joueur: p.n, nom: p.nom, valeurs, details }
  })
}
