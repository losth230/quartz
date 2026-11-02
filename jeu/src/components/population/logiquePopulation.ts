// ══════════════════════════════════════════════════════════════════════
//  POPULATION — LOGIQUE PURE DE LA VUE (vague qualité 2026-10-24) :
//  filtres/tri, récap textuel, options de don et d'éligibilité au
//  mariage. Extraits de PopulationTable.tsx, SÉMANTIQUE IDENTIQUE —
//  un seul site d'usage par fonction. Les docblocks d'arbitrage
//  voyagent avec leur code (règle 9 du journal).
// ══════════════════════════════════════════════════════════════════════

import type { Character, CiteLibre, GameState } from '../../engine/types'
import type { Detenteur } from '../../engine/shared'
import { rangDe } from '../../engine/statutSocial'
import type { Cfg } from '../../config/defaultConfig'

export type SortKey = 'nom' | 'age' | 'dynastie' | 'ville' | 'metier' | 'statut'

export const STATUTS: Character['statut'][] = ['Sain', 'Malade', 'Décédé']

/** Filtres de la table de population (communs à la cour et à la
 *  population classique — retour Thibaut : « les filtres s'appliquent
 *  aux deux tableaux »). */
export interface FiltresPopulation {
  statut: string
  ville: string
  metier: string
  dynastie: string
}

/** Filtre + trie une liste de personnages (cour ou population
 *  classique) : statut, ville, métier, dynastie (sous-chaîne, sans
 *  casse), puis tri par clé. Extrait VERBATIM du useMemo de
 *  PopulationTable. */
export function filtrerEtTrier(liste: Character[], f: FiltresPopulation, tri: SortKey): Character[] {
  let list = [...liste]
  if (f.statut === 'Vivants') list = list.filter((c) => c.statut !== 'Décédé')
  else if (f.statut === 'Décédés') list = list.filter((c) => c.statut === 'Décédé')
  else if (f.statut === 'Enfants') list = list.filter((c) => c.statut !== 'Décédé' && c.age < 16)
  if (f.dynastie) list = list.filter((c) => c.dynastie.toLowerCase().includes(f.dynastie.toLowerCase()))
  if (f.ville) list = list.filter((c) => c.ville === f.ville)
  if (f.metier) list = list.filter((c) => (c.metier ?? '') === f.metier)
  const cmp: Record<SortKey, (a: Character, b: Character) => number> = {
    nom: (a, b) => (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr'),
    age: (a, b) => b.age - a.age,
    dynastie: (a, b) => a.dynastie.localeCompare(b.dynastie, 'fr'),
    ville: (a, b) => a.ville.localeCompare(b.ville, 'fr'),
    metier: (a, b) => (a.metier ?? '').localeCompare(b.metier ?? '', 'fr'),
    statut: (a, b) => a.statut.localeCompare(b.statut, 'fr'),
  }
  list.sort(cmp[tri])
  return list
}

/** « clé : n » trié par valeur décroissante — carte « Récap du
 *  dernier tour », déplacée de la page Pays vers l'onglet Population
 *  (retour Thibaut 2026-10-14). */
export function dictToString(dict: Record<string, number>): string {
  const entries = Object.entries(dict).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return '—'
  return entries.map(([k, v]) => `${k} : ${v}`).join(', ')
}

// ── Don de personnage et mariage manuel (retour Thibaut) ─────────────
//  Dons et mariages couvrent JOUEURS et CITÉS LIBRES (retour
//  2026-10-14 : la population des cités libres est « semblable en
//  tout point » à celle des joueurs).

/** Valeur d'option → détenteur (« j<n> » = joueur, « c<i> » = cité). */
export function detenteurDeCle(s: GameState, v: string): Detenteur | undefined {
  if (v.startsWith('j')) {
    const q = s.players.find((x) => x.n === parseInt(v.slice(1), 10))
    return q ? { kind: 'joueur', p: q } : undefined
  }
  const cc = (s.citesLibres ?? [])[parseInt(v.slice(1), 10)]
  return cc ? { kind: 'cite', cite: cc } : undefined
}

/** Options « Donner à… » : les autres joueurs ET les cités libres. */
export function optionsDon(state: GameState, joueur: number, cite: CiteLibre | undefined) {
  return [
    ...state.players
      .filter((q) => (cite ? true : q.n !== joueur))
      .map((q) => ({ value: `j${q.n}`, label: `${q.nom} (J${q.n})` })),
    ...(state.citesLibres ?? [])
      .map((cc, i) => (cite === cc
        ? null
        : { value: `c${i}`, label: `🗼 ${cc.nom} (cité libre)` }))
      .filter((x): x is { value: string; label: string } => x !== null),
  ]
}

/** Nobles vivants, majeurs et célibataires (validité au moteur) —
 *  noble au sens du RANG (arbitrage Thibaut 2026-10-27 : dynastie
 *  noble de naissance OU anobli à 250+ de prestige — un bourgeois
 *  devenu noble est mariable manuellement). */
export function eligibleMariage(x: Character, c: Character, C: Cfg): boolean {
  return x.id !== c.id && x.statut !== 'Décédé' && !x.mariageId
    && x.age >= C.p.adultAge && rangDe(x, C) === 'noble'
}
