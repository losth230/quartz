// ═══════════════════════════════════════════════════════════════════════════
//  STATUT SOCIAL — PRESTIGE DES FAMILLES ET ASCENSION
//  (vague D du design domiciles/ascension, arbitrages Thibaut 2026-10-24)
//
//  LE PRESTIGE EST ATTRIBUÉ À LA FAMILLE (pas au personnage isolé) :
//  un personnage devient bourgeois ou noble AVEC ses enfants — le
//  foyer partage le sort familial.
//
//  HÉRITAGE : à l'âge adulte, un enfant hérite de 50 % du prestige
//  MOYEN de ses deux parents (un seul parent connu → la moitié de
//  ce parent). Les mineurs n'ont pas de prestige propre — le rang
//  du foyer est celui de leurs parents.
//
//  CALCUL PAR TOUR (arbitrage exact, ± chaque fin de tour) :
//    · sans emploi        −2
//    · sans domicile      −2
//    · malade             −2
//    · domicile           +0 à +4 selon le type (Masure 0, Maison 1,
//                        Auberge 2, Maison de notable 3, Palais 4 —
//                        i.e. la qualité 1-5 moins un)
//    · métier             +2 si bourgeois, +5 si noble (roturier : 0)
//    · +1 si bonheur de la ville > 50
//
//  RANG DÉRIVÉ (fonction pure) :
//    · prestige < 100    → roturier
//    · 100 ≤ prestige    → bourgeois
//    · prestige ≥ 250    → noble
//  (un enfant héritant de 50 % de deux parents nobles à 250+
//   naît bourgeois — il devra faire ses preuves pour la noblesse.)
//
//  Les changements de rang (montée comme chute) sont journalisés
//  par le module du tour — ce module expose evaluerFamilles qui
//  retourne les événements à consigner.
// ═══════════════════════════════════════════════════════════════════════════

import type { Character, GameState, Player } from './types'
import { type Cfg } from './gameData'
import { qualiteDomicile } from './domiciles'
import { bonheurVilleComplete } from './bonheur'
import { fullName } from './shared'

// ── Rang dérivé ───────────────────────────────────────────────────────

export type RangSocial = 'roturier' | 'bourgeois' | 'noble'

/** Rang social dérivé du prestige (arbitrage 2026-10-24 :
 *  0-100 roturier, 100-250 bourgeois, 250+ noble). */
export function rangSocial(prestige: number): RangSocial {
  if (prestige >= 250) return 'noble'
  if (prestige >= 100) return 'bourgeois'
  return 'roturier'
}

/** Prestige d'un personnage (0 par défaut — vieilles sauvegardes). */
export function prestigeDe(c: Character): number {
  return c.prestige ?? 0
}

// ── Calcul du prestige d'un tour ─────────────────────────────────────

/** Gain de prestige d'un personnage pour CE tour (formule arbitrée,
 *  pure — aucun état muté). `bonheurVille` est passé par l'appelant
 *  (calculé une fois par ville). */
export function gainPrestigeTour(
  c: Character, C: Cfg, bonheurVille: number,
): number {
  let g = 0
  // sans emploi
  if (!c.metier) g -= 2
  // sans domicile
  if (!c.domicile) g -= 2
  // malade
  if (c.statut === 'Malade') g -= 2
  // domicile : +0 à +4 selon la qualité (1-5 → 0-4)
  if (c.domicile) g += Math.max(0, qualiteDomicile(c.domicile, C) - 1)
  // métier : +2 bourgeois, +5 noble
  const q = C.metiers.find((m) => m.metier === c.metier)?.qualite
  if (q === 'bourgeois') g += 2
  else if (q === 'noble') g += 5
  // ambiance : +1 si bonheur de la ville > 50
  if (bonheurVille > 50) g += 1
  return g
}

/** Prestige CIBLE d'un foyer = la MOYENNE des deux parents (le
 *  prestige est FAMILIAL : le couple converge vers la même
 *  valeur). Un célibataire : sa propre valeur. */
export function prestigeFoyer(chef: Character, conjoint: Character | null): number {
  if (!conjoint) return prestigeDe(chef)
  return (prestigeDe(chef) + prestigeDe(conjoint)) / 2
}

// ── Évaluation des familles (fin de tour) ─────────────────────────────

/** Un changement de rang social journalisable. */
export interface EvenementRang {
  joueur: number
  nom: string
  texte: string
}

/** Évalue le prestige de toutes les familles d'un joueur : calcule
 *  le gain du tour pour chaque foyer, fait CONVERGER les deux
 *  parents (le prestige est familial — moyenne appliquée aux
 *  deux), gère l'HÉRITAGE des enfants atteignant l'âge adulte ce
 *  tour, et retourne les changements de rang à journaliser.
 *  Les enfants mineurs partagent le rang du foyer (pas de
 *  prestige propre avant l'âge adulte). */
export function evaluerFamilles(state: GameState, p: Player, C: Cfg): EvenementRang[] {
  const evenements: EvenementRang[] = []
  const pop = state.population[p.n] ?? []
  const parId = new Map(pop.map((c) => [c.id, c] as const))

  // Bonheur par ville, calculé une fois
  const bonheurParVille = new Map<string, number>()
  for (const v of p.villes) bonheurParVille.set(v.nom, bonheurVilleComplete(state, p, v, C))

  // Foyers via les couples (mariageId partagé) — l'adulte marié
  //  convergent ; les célibataires vivent seuls. On itère sur les
  //  ADULTES (les mineurs n'ont pas de prestige propre).
  const adultes = pop.filter((c) => c.statut !== 'Décédé' && c.age >= C.p.adultAge)
  const traites = new Set<string>()

  const appliquer = (c: Character, gain: number, conjointPrestige: number | null) => {
    // convergence familiale : si marié, les deux tendent vers la
    //  moyenne des deux gains (le foyer avance ensemble)
    const ancien = rangSocial(prestigeDe(c))
    let nouveauPrestige: number
    if (conjointPrestige !== null) {
      // moyenne des deux prestiges actuels + moyenne des gains
      const actuel = prestigeDe(c)
      nouveauPrestige = (actuel + conjointPrestige) / 2 + gain
    } else {
      nouveauPrestige = prestigeDe(c) + gain
    }
    c.prestige = Math.max(0, Math.round(nouveauPrestige))
    const nouveau = rangSocial(c.prestige)
    if (nouveau !== ancien) {
      evenements.push({
        joueur: p.n,
        nom: fullName(c),
        texte: nouveau === 'bourgeois'
          ? `📈 ${fullName(c)} accède à la bourgeoisie (prestige ${c.prestige}).`
          : nouveau === 'noble'
            ? `👑 ${fullName(c)} accède à la noblesse (prestige ${c.prestige}).`
            : ancien === 'noble'
              ? `📉 ${fullName(c)} retombe bourgeois (prestige ${c.prestige}).`
              : `📉 ${fullName(c)} retombe roturier (prestige ${c.prestige}).`,
      })
    }
  }

  // 1. couples
  for (const a of adultes) {
    if (traites.has(a.id)) continue
    const conj = a.mariageId ? parId.get(a.mariageId) : undefined
    if (conj && conj.statut !== 'Décédé' && !traites.has(conj.id)) {
      traites.add(a.id); traites.add(conj.id)
      const gainA = gainPrestigeTour(a, C, bonheurParVille.get(a.ville) ?? 0)
      const gainB = gainPrestigeTour(conj, C, bonheurParVille.get(conj.ville) ?? 0)
      const pA = prestigeDe(a), pB = prestigeDe(conj)
      // chaque conjoint converge vers la moyenne, avec le gain
      //  moyen du couple (le foyer avance ensemble)
      const moyenneActuelle = (pA + pB) / 2
      const gainMoyen = (gainA + gainB) / 2
      a.prestige = Math.max(0, Math.round(moyenneActuelle + gainMoyen))
      conj.prestige = Math.max(0, Math.round(moyenneActuelle + gainMoyen))
      const ancienA = rangSocial(pA), ancienB = rangSocial(pB)
      for (const [perso, ancien] of [[a, ancienA], [conj, ancienB]] as const) {
        if (rangSocial(perso.prestige ?? 0) !== ancien) {
          const nv = rangSocial(perso.prestige ?? 0)
          evenements.push({
            joueur: p.n,
            nom: fullName(perso),
            texte: nv === 'bourgeois'
              ? `📈 ${fullName(perso)} accède à la bourgeoisie (prestige ${perso.prestige}).`
              : nv === 'noble'
                ? `👑 ${fullName(perso)} accède à la noblesse (prestige ${perso.prestige}).`
                : ancien === 'noble'
                  ? `📉 ${fullName(perso)} retombe bourgeois (prestige ${perso.prestige}).`
                  : `📉 ${fullName(perso)} retombe roturier (prestige ${perso.prestige}).`,
          })
        }
      }
      continue
    }
    // célibataire
    traites.add(a.id)
    appliquer(a, gainPrestigeTour(a, C, bonheurParVille.get(a.ville) ?? 0), null)
  }

  // 2. HÉRITAGE : enfants atteignant l'âge adulte CE tour —
  //  50 % du prestige MOYEN des parents (arbitrage 2026-10-24).
  //  CORRECTIF ordre (bug attrapé par les tests) : l'héritage ne
  //  concerne que les personnages NÉS DANS LA PARTIE (parents
  //  connus par mereId/pereId) qui atteignent l'âge adulte — la
  //  GÉNÉRATION FONDATRICE (adultes sans parents, configs de
  //  départ) ne reçoit AUCUN héritage : elle part de 0 et fait
  //  ses preuves. Sans cette garde, l'héritage écrasait le
  //  prestige calculé ci-dessus pour toute la population initiale.
  for (const c of pop) {
    if (c.statut === 'Décédé' || c.age < C.p.adultAge) continue
    if (c.prestigeHerite !== undefined) continue
    // seulement les enfants NÉS dans la partie : au moins un
    //  parent connu ET vivant dans la population
    const mere = c.mereId ? parId.get(c.mereId) : undefined
    const pere = c.pereId ? parId.get(c.pereId) : undefined
    if (!mere && !pere) continue // génération fondatrice : pas d'héritage
    let heritage: number
    if (mere && pere) {
      heritage = Math.round((prestigeDe(mere) + prestigeDe(pere)) / 2 * 0.5)
    } else {
      heritage = Math.round(prestigeDe((mere ?? pere)!) * 0.5)
    }
    c.prestige = heritage
    c.prestigeHerite = heritage
  }

  return evenements
}
