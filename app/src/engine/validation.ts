// ══════════════════════════════════════════════════════════════════════
//  Validation de l'attribution manuelle des titres
//  (portage de la macro VBA ValidateTitleAssignment + frmAttribuerTitre)
// ══════════════════════════════════════════════════════════════════════

import type { Character, Player, GameState } from './types'
import { TITRES, titreDef, cultureDef } from './gameData'
import { schoolRankOf } from './gameData2'
import {
  ADULT_AGE, TITRE_DIRIGEANT, TITRE_GOUVERNEUR, TITRE_HERITIER,
  TITRE_PROFESSEUR, isNobleDyn,
} from './engine'

export interface TitleIssue {
  ok: boolean
  message: string
}

/**
 * Valide l'attribution d'un titre à un personnage.
 * Règles (cf. documentation §7) :
 *  · personnage vivant et adulte (16+)
 *  · noblesse si NobleSeul ; règles de genre (RegleGenre + culture)
 *  · éducation requise le cas échéant
 *  · titres « Armée » refusés (passent par l'engagement militaire)
 *  · unicité : Dirigeant (1), Héritier (1, même dynastie), Gouverneur (1/ville),
 *    Professeurs ≤ rang de l'école de la ville
 */
export function validateTitleAssignment(
  state: GameState,
  player: Player,
  char: Character,
  titre: string,
): TitleIssue {
  const td = titreDef(titre)
  if (!td) return { ok: false, message: `Titre inconnu : ${titre}` }
  if (char.statut === 'Décédé') return { ok: false, message: 'Ce personnage est décédé.' }
  if (char.age < ADULT_AGE) return { ok: false, message: `Ce personnage est mineur (${char.age} ans).` }
  if (td.attribution === 'Armée') {
    return { ok: false, message: `Le titre « ${titre} » s'obtient uniquement par l'engagement militaire (lever une armée).` }
  }
  if (td.nobleSeul && !isNobleDyn(char.dynastie)) {
    return { ok: false, message: `Le titre « ${titre} » est réservé aux nobles (${char.dynastie}).` }
  }
  // règles de genre
  const cult = cultureDef(player.culture)
  const cultureGender: 'Masculine' | 'Féminine' | 'Les deux' | undefined = cult
    ? cult.heredite === 'Masculine' ? 'Masculine' : cult.heredite === 'Féminine' ? 'Féminine' : undefined
    : undefined
  if (td.regleGenre === 'Masculine' && char.sexe !== 'M') {
    return { ok: false, message: 'Ce titre est réservé aux hommes.' }
  }
  if (td.regleGenre === 'Féminine' && char.sexe !== 'F') {
    return { ok: false, message: 'Ce titre est réservé aux femmes.' }
  }
  if (td.regleGenre === 'Culture' && cultureGender) {
    if (cultureGender === 'Masculine' && char.sexe !== 'M') {
      return { ok: false, message: `La culture ${player.culture} (hérédité masculine) interdit ce poste aux femmes.` }
    }
    if (cultureGender === 'Féminine' && char.sexe !== 'F') {
      return { ok: false, message: `La culture ${player.culture} (hérédité féminine) interdit ce poste aux hommes.` }
    }
    if (!cult?.homoAutorisee && (char.orientation === 'Homosexuel' || char.orientation === 'Bisexuel')) {
      return { ok: false, message: `La culture ${player.culture} ne tolère pas l'homosexualité pour ce poste.` }
    }
  }
  // éducation requise
  if (td.education && char.education !== td.education) {
    return { ok: false, message: `Éducation requise : ${td.education} (ce personnage a : ${char.education ?? 'aucune'}).` }
  }
  // règles d'unicité
  const pop = (state.population[player.n] ?? []).filter((c) => c.statut !== 'Décédé')
  if (titre === TITRE_DIRIGEANT && pop.some((c) => c.id !== char.id && c.titre === TITRE_DIRIGEANT)) {
    return { ok: false, message: 'Il y a déjà un Dirigeant.' }
  }
  if (titre === TITRE_HERITIER) {
    const dirigeant = pop.find((c) => c.titre === TITRE_DIRIGEANT)
    if (pop.some((c) => c.id !== char.id && c.titre === TITRE_HERITIER)) {
      return { ok: false, message: 'Il y a déjà un Héritier.' }
    }
    if (dirigeant && char.dynastie !== dirigeant.dynastie) {
      return { ok: false, message: `L'Héritier doit être de la dynastie du Dirigeant (${dirigeant.dynastie}).` }
    }
  }
  if (titre === TITRE_GOUVERNEUR) {
    const autres = pop.filter((c) => c.id !== char.id && c.titre === TITRE_GOUVERNEUR && c.ville === char.ville)
    if (autres.length > 0) {
      return { ok: false, message: `${char.ville} a déjà un Gouverneur.` }
    }
    const ville = player.villes.find((v) => v.nom === char.ville)
    if (!ville) return { ok: false, message: `La ville « ${char.ville} » n'existe pas chez ce joueur.` }
  }
  if (titre === TITRE_PROFESSEUR) {
    const ville = player.villes.find((v) => v.nom === char.ville)
    const rank = ville ? schoolRankOf(ville.batiments) : 0
    const nbProfs = pop.filter((c) => c.titre === TITRE_PROFESSEUR && c.ville === char.ville).length
    if (rank === 0) return { ok: false, message: `${char.ville} ne possède pas d'école.` }
    if (nbProfs >= rank) {
      return { ok: false, message: `${char.ville} a déjà ${nbProfs} Professeur(s) pour une école de rang ${rank}.` }
    }
  }
  return { ok: true, message: `« ${titre} » attribué à ${char.prenom} ${char.nom}.` }
}

/** Liste des titres attribuables à un personnage, avec motif de refus. */
export function titleCandidatesFor(state: GameState, player: Player, char: Character) {
  return TITRES.map((t) => {
    const issue = validateTitleAssignment(state, player, char, t.titre)
    return { titre: t.titre, ok: issue.ok, motif: issue.ok ? '' : issue.message }
  })
}

/** Erreurs bloquantes pour un personnage donné (utilisé par la table de population). */
export function findTitleIssues(state: GameState, player: Player, char: Character): string[] {
  const out: string[] = []
  if (!char.titre) return out
  const td = titreDef(char.titre)
  if (!td) return out
  if (char.statut !== 'Décédé') {
    const issue = validateTitleAssignment(state, player, char, char.titre)
    if (!issue.ok) out.push(issue.message)
  }
  return out
}
