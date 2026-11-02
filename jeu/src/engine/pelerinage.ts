// ══════════════════════════════════════════════════════════════════════
//  PÈLERINAGE — DÎME DU PONTIFE (bonus du pontife, arbitrage Thibaut
//  du 2026-11-01 : « j'aime bien l'idée des pèlerinages, les
//  habitations de la culture renvoie 5% de leur production au
//  pontife, comme pour les taxes »)
//
//  ARBITRAGES (2026-11-01) :
//   1. QUI PAIE : toutes les habitations de la culture, chez TOUS
//      les joueurs, Y COMPRIS celles du pontife (net nul chez lui,
//      mais comptées — l'homogénéité prime sur l'exonération).
//   2. COMBIEN : pelerinageTaux (défaut 5 %, paramètre « Culture »)
//      de TOUTE la production de chaque habitation — Or, Nourriture,
//      Science (« comme pour les taxes »). Lecture moteur :
//      productionVille(ville).total — la production réellement
//      créditée au tour (bâtiments + aménagements + été + autres +
//      villageois). Une ressource DÉFICITAIRE pour la ville (total
//      ≤ 0) n'est pas dimée : la dîme ne rembourse jamais.
//   3. PRÉLÈVEMENT RÉEL : les 5 % SORTENT du stock du propriétaire
//      et ENTRENT au stock du pontife, ressource par ressource —
//      pattern tribut de vassalité (engine/vassalite.ts), PAS de
//      création d'Or (motif « différence créée » de la Mère Patrie
//      rejeté pour ce flux). Les stocks peuvent passer négatifs
//      (aucune contrainte bloquante, cf. params.ts).
//   4. QUI REÇOIT : le PONTIFE de la culture (le plus de Tourisme
//      dans la culture — engine/dogmes.ts joueurPontifeCulture),
//      ÉVALUÉ AU MOMENT DU PRÉLÈVEMENT : le flux suit le siège,
//      pas la personne — un changement de pontife entre deux tours
//      déroute la dîme dès le tour suivant.
//   5. QUAND : chaque fin de tour, APRÈS le calcul des productions
//      (étape 3quindecies de FinDeTour — engine/tour.ts), AVANT le
//      moteur de population. Activation UNIQUEMENT après le 1er
//      dogme pris par la culture : pas de culte établi, pas de dîme.
//   6. C'EST UNE DÎME, PAS UNE TAXE : le bonus Grand Chambellan
//      « +10 % de taxes reçues » NE S'Y APPLIQUE PAS (recommandation
//      arbitre acceptée le 2026-11-01) ; le dogme Mère Patrie
//      (tributVassal) ne touche que les TRIBUTS VASSAUX, jamais ce
//      flux. Verrouillé par les tests de pelerinage.test.ts.
//   7. Une culture qui a un dogme mais PLUS de Tourisme (pontife
//      undefined — cas théorique : le Tourisme peut retomber à 0
//      après avoir ouvert des paliers) n'a pas de destinataire :
//      pas de dîme ce tour-là.
//
//  Découpage SOLID du moteur : un module = une responsabilité de
//  domaine. La VUE (canal « Pèlerinage » du récap de production)
//  vit dans pelerinageJoueur — même lecture, SANS mutation.
// ══════════════════════════════════════════════════════════════════════

import type { GameState, Player } from './types'
import type { Cfg } from './gameData'
import { productionVille } from './production'
import { dogmesCulture, joueurPontifeCulture } from './dogmes'

/** Ressources dimées par le pèlerinage (arbitrage n°2 : « toute la
 *  production… Or, Nourriture, Science — comme pour les taxes »). */
export const RESSOURCES_PELERINAGE = ['Or', 'Nourriture', 'Science'] as const

/** Un versement : ce qu'un payeur donne au pontife d'une culture,
 *  ressource par ressource (montants strictement positifs — la dîme
 *  ne rembourse jamais, arbitrage n°2). */
export interface VersementPelerinage {
  payeur: Player
  montants: Record<string, number>
}

/** La dîme d'UNE culture pour un tour : le pontife destinataire et
 *  la liste des versements (un par payeur possédant au moins une
 *  habitation de la culture, pontife compris — arbitrage n°1). */
export interface DimePelerinage {
  culture: string
  pontife: Player
  versements: VersementPelerinage[]
}

/** Cultures « dimières » : celles ayant AU MOINS un dogme pris
 *  (arbitrage n°5 : pas de culte établi, pas de dîme). */
export function culturesDimieres(state: GameState): string[] {
  const out = new Set<string>()
  for (const d of state.dogmes ?? []) out.add(d.culture)
  return [...out]
}

/** Dîme d'une culture pour le tour courant — CALCUL PUR (aucune
 *  mutation) : part de chaque habitation de la culture = taux ×
 *  production de la ville (productionVille total, ressources Or /
 *  Nourriture / Science, part positive seulement). Retourne
 *  undefined si la culture n'a pas de dogme (arbitrage n°5) ou plus
 *  de pontife (arbitrage n°7). */
export function dimeCulture(
  state: GameState, culture: string, C: Cfg,
): DimePelerinage | undefined {
  if (dogmesCulture(state, culture).length === 0) return undefined
  const pontife = joueurPontifeCulture(state, culture, C)
  if (!pontife) return undefined
  const taux = C.p.pelerinageTaux
  const versements: VersementPelerinage[] = []
  for (const q of state.players) {
    let montants: Record<string, number> | undefined
    for (const ville of q.villes ?? []) {
      if (ville.culture !== culture) continue
      const prod = productionVille(state, q, ville, C).total
      for (const res of RESSOURCES_PELERINAGE) {
        const part = Math.max(0, prod[res] ?? 0) * taux
        if (part <= 0) continue
        montants ?? (montants = {})
        montants[res] = (montants[res] ?? 0) + part
      }
    }
    // Le pontife paie aussi (arbitrage n°1) : son versement figure
    //  dans la liste comme n'importe quel payeur.
    if (montants) versements.push({ payeur: q, montants })
  }
  return { culture, pontife: pontife.joueur, versements }
}

const fmt1 = (v: number) => Math.round(v * 10) / 10

/** PÈLERINAGE — étape 3quindecies de FinDeTour (MUTATEUR) : prélève
 *  la dîme de chaque culture dimière, RÉELLEMENT (stocks du payeur −,
 *  stock du pontife +, ressource par ressource — arbitrage n°3), et
 *  journalise UN LOG PAR VERSEMENT (arbitrage de visibilité). Retourne
 *  les dîmes prélevées pour le canal « Pèlerinage » du récap (tour.ts).
 *  Les états dégradés (ressource absente d'un joueur) sont ignorés
 *  silencieusement, comme le reste du moteur. */
export function preleverPelerinage(state: GameState, C: Cfg): DimePelerinage[] {
  const out: DimePelerinage[] = []
  for (const culture of culturesDimieres(state)) {
    const dime = dimeCulture(state, culture, C)
    if (!dime || dime.versements.length === 0) continue
    let total: Record<string, number> | undefined
    for (const v of dime.versements) {
      for (const [res, montant] of Object.entries(v.montants)) {
        const rs = v.payeur.resources?.[res]
        if (rs) rs.stock -= montant
        total ?? (total = {})
        total[res] = (total[res] ?? 0) + montant
      }
      const or = fmt1(v.montants['Or'] ?? 0)
      const nourr = fmt1(v.montants['Nourriture'] ?? 0)
      const science = fmt1(v.montants['Science'] ?? 0)
      state.log.push({
        turn: state.turn + 1,
        type: 'Culture',
        joueur: v.payeur.n,
        texte: `🕯 Pèlerinage — ${v.payeur.nom} verse ${or} Or, ${nourr} Nourr., ${science} Science à ${dime.pontife.nom} (dîme de la culture ${culture}).`,
      })
    }
    if (total) {
      for (const [res, montant] of Object.entries(total)) {
        const rs = dime.pontife.resources?.[res]
        if (rs) rs.stock += montant
      }
    }
    out.push(dime)
  }
  return out
}

/** Canal « Pèlerinage » du récap de production du joueur p (VUE
 *  PURE, sans mutation — utilisée par productionDetaillee et le
 *  wiki) : SOLDE NET par ressource, négatif = dîme payée (ses
 *  habitations des cultures dimières, la sienne comprise s'il est
 *  pontife), positif = dîme reçue en tant que pontife. Le pontife
 *  d'une culture où il possède lui-même des habitations porte les
 *  DEUX (net = reçu − payé, arbitrage n°1). */
export function pelerinageJoueur(
  state: GameState, p: Player, C: Cfg,
): Record<string, number> {
  const out: Record<string, number> = {}
  const add = (res: string, v: number) => {
    if (v === 0) return
    out[res] = (out[res] ?? 0) + v
  }
  for (const culture of culturesDimieres(state)) {
    const dime = dimeCulture(state, culture, C)
    if (!dime) continue
    for (const v of dime.versements) {
      if (v.payeur.n === p.n) {
        for (const [res, montant] of Object.entries(v.montants)) add(res, -montant)
      }
      if (dime.pontife.n === p.n) {
        for (const [res, montant] of Object.entries(v.montants)) add(res, montant)
      }
    }
  }
  return out
}
