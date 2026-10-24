// ═══════════════════════════════════════════════════════════════════════════
//  DOMICILES — STOCK DES VILLES ET ATTRIBUTION AUX FOYERS
//  (vague A+C du design domiciles/ascension, 2026-10-24)
//
//  PRINCIPES (arbitrages Thibaut) :
//   · SIMPLE : un type de domicile porte un nom + une qualité 1-5 ;
//     pas de capacité ni coût — 1 domicile = 1 logement (1 foyer) ;
//     les bâtiments constructibles viendront plus tard ;
//   · le stock d'une ville vit DANS la ville (City.domiciles :
//     [{domicile: 'Maison', nombre: 50}, …]) — initialisé du rang
//     d'habitation à la création/changement de rang (normaliserEtat
//     le complète pour les vieilles sauvegardes) ;
//   · l'attribution est PAR FOYER (le couple + ses enfants mineurs
//     partagent le sort du foyer) : un foyer = un adulte marié OU
//     un adulte seul — les mineurs suivent leurs parents ;
//   · un foyer ne peut pas être attribué AU-DESSUS de sa condition
//     (un roturier n'entre pas dans un Palais) ; en dessous, il
//     peut (c'est le mécanisme de chute — à venir en vague D) ;
//   · l'attribution attribue la MEILLEURE qualité disponible d'abord
//     (les Maisons avant les Masures) — simple et lisible.
//
//  Le champ Character.domicile (posé en vague 2 du rework habitants,
//  « aucun effet en vague 1 ») devient la clé : nom du type de
//  domicile ('Maison', 'Auberge'…), null = sans domicile.
// ═══════════════════════════════════════════════════════════════════════════

import type { Character, City, GameState, Player } from './types'
import { type Cfg } from './gameData'
import { rangsDefsType, nomRang } from './rangs'

// ── Lecture du référentiel ───────────────────────────────────────────

/** Définition d'un type de domicile (table `domiciles` du config). */
export function domicileDef(nom: string | null | undefined, C: Cfg): { domicile: string; qualite: number } | undefined {
  if (!nom) return undefined
  return C.config.domiciles.find((d) => d.domicile.toLowerCase() === nom.toLowerCase())
}

/** Qualité d'un domicile (1-5 ; 0 = inconnu / sans domicile). */
export function qualiteDomicile(nom: string | null | undefined, C: Cfg): number {
  return domicileDef(nom, C)?.qualite ?? 0
}

/** Stock de domiciles d'un rang d'habitation (le format structuré de
 *  la config — anciennement parsé du texte, cf. bonheur.ts). */
export function stockRang(type: string, rang: string, C: Cfg): Array<{ domicile: string; nombre: number }> {
  const def = rangsDefsType(type, C).find(
    (d) => nomRang(d.rang).toLowerCase() === nomRang(rang).toLowerCase(),
  )
  return def?.domicilesRang ? def.domicilesRang.map((e) => ({ ...e })) : []
}

/** Nombre TOTAL de logements d'une ville (somme du stock). */
export function totalLogementsVille(ville: City): number {
  return (ville.domiciles ?? []).reduce((acc, e) => acc + e.nombre, 0)
}

// ── Foyers ────────────────────────────────────────────────────────────

/** Un foyer : un adulte (marié ou seul) + ses enfants mineurs.
 *  Les enfants majeurs non mariés forment leur propre foyer
 *  (design « à la charge du joueur pour l'ajustement » — les
 *  règles de démographie existantes gèrent les âges). */
export interface Foyer {
  chef: Character
  conjoint: Character | null
  enfants: Character[]
  domicile: string | null
}

/** Foyers d'une population de ville : partition des habitants.
 *  ADULTE = age ≥ adultAge ; les enfants (age < adultAge) suivent
 *  leur mère (mariageId), sinon leur père, sinon le premier adulte
 *  de la ville (garde-fou). */
export function foyersDeVille(state: GameState, nJoueur: number, ville: City, C: Cfg): Foyer[] {
  const pop = (state.population[nJoueur] ?? []).filter(
    (c) => c.statut !== 'Décédé' && c.ville === ville.nom,
  )
  const adultes = pop.filter((c) => c.age >= C.p.adultAge)
  const enfants = pop.filter((c) => c.age < C.p.adultAge)
  const parId = new Map(pop.map((c) => [c.id, c] as const))
  const foyers: Foyer[] = []
  const pris = new Set<string>()

  // 1. couples : chaque adulte marié une seule fois (mariageId partagé)
  for (const a of adultes) {
    if (pris.has(a.id)) continue
    const conj = a.mariageId ? parId.get(a.mariageId) : undefined
    if (conj && !pris.has(conj.id) && conj.statut !== 'Décédé') {
      pris.add(a.id); pris.add(conj.id)
      foyers.push({ chef: a, conjoint: conj, enfants: [], domicile: a.domicile ?? null })
    }
  }
  // 2. célibataires
  for (const a of adultes) {
    if (pris.has(a.id)) continue
    pris.add(a.id)
    foyers.push({ chef: a, conjoint: null, enfants: [], domicile: a.domicile ?? null })
  }
  // 3. enfants mineurs rattachés
  for (const e of enfants) {
    const parent = parId.get(e.mereId ?? '') ?? parId.get(e.pereId ?? '')
    const foyer = parent
      ? foyers.find((f) => f.chef.id === parent.id || f.conjoint?.id === parent.id)
      : undefined
    ;(foyer ?? foyers[0])?.enfants.push(e)
  }
  return foyers
}

// ── Attribution ──────────────────────────────────────────────────────

/** Attribue les domiciles d'une ville à ses foyers : la MEILLEURE
 *  qualité d'abord, sans dépasser le stock (stock.consume au fur et
 *  mesure). Un foyer garde son domicile s'il est déjà attribué et
 *  existe encore dans le stock. Retourne le nombre de foyers
 *  nouvellement logés (les changements portent le champ
 *  `Character.domicile` du chef ET du conjoint — les enfants mineurs
 *  suivent sans champ propre : le domicile est celui du foyer).
 *
 *  CONDITIONS (vague C) : pas encore de restriction par condition
 *  sociale (roturier/bourgeois) — la vague D (ascension) l'ajoutera
 *  avec les statuts de dynastie. Pour l'instant tout le monde peut
 *  habiter partout (simple, lisible). */
export function attribuerDomicilesVille(state: GameState, p: Player, ville: City, C: Cfg): number {
  const foyers = foyersDeVille(state, p.n, ville, C)
  // stock restant : copie de travail
  const stock = new Map<string, number>()
  for (const e of ville.domiciles ?? []) stock.set(e.domicile, (stock.get(e.domicile) ?? 0) + e.nombre)
  // ordre : meilleure qualité d'abord (les foyers déjà logés gardent
  //  leur logement — on ne déloge personne, on complète)
  const typesTries = [...C.config.domiciles].sort((a, b) => b.qualite - a.qualite)
  let loges = 0
  for (const f of foyers) {
    if (f.domicile && (stock.get(f.domicile) ?? 0) > 0) {
      // déjà logé dans un type existant au stock : consomme sa place
      stock.set(f.domicile, (stock.get(f.domicile) ?? 0) - 1)
      loges++
      continue
    }
    // à loger : meilleure qualité disponible
    for (const t of typesTries) {
      const restant = stock.get(t.domicile) ?? 0
      if (restant > 0) {
        stock.set(t.domicile, restant - 1)
        f.chef.domicile = t.domicile
        if (f.conjoint) f.conjoint.domicile = t.domicile
        f.domicile = t.domicile
        loges++
        break
      }
    }
    // rien de libre : foyer sans domicile — chef et conjoint à null
    if (!f.domicile) {
      f.chef.domicile = null
      if (f.conjoint) f.conjoint.domicile = null
    }
  }
  return loges
}

/** Initialise le stock de domiciles d'une ville depuis son rang
 *  (appelé à la création de ville et au changement de rang — cf.
 *  debiterCoutHabitation). Écrase le stock existant : le rang
 *  DÉFINIT l'offre (arbitrage : pas de stock accumulé pour
 *  l'instant, les bâtissements constructibles viendront). */
export function initStockVille(ville: City, C: Cfg): void {
  ville.domiciles = stockRang(ville.type ?? 'Ville', ville.rang ?? 'Hameau', C)
}
