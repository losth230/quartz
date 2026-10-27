// ═══════════════════════════════════════════════════════════════════════════
//  DOMICILES — STOCK DES VILLES ET ATTRIBUTION AUX HABITANTS
//  (vague A+C du design domiciles/ascension, 2026-10-24)
//
//  PRINCIPES (arbitrages Thibaut) :
//   · SIMPLE : un type de domicile porte un nom + une qualité 0-4 ;
//     pas de capacité ni coût — les bâtiments constructibles
//     viendront plus tard ;
//   · UNITÉ (retour Thibaut 2026-10-26 : « je ne veux pas que les
//     logements soient associés à des familles, je veux 1 logement
//     = 1 habitant ») : un logement sert UNE personne — adulte OU
//     enfant mineur. L'ancienne attribution par FOYER (une maison
//     par famille, les mineurs suivaient leurs parents) est
//     RETIRÉE. L'unité de l'attribution et l'unité de mesure du
//     bonheur (l'axe Logement compare le stock aux habitants)
//     sont désormais LA MÊME échelle ;
//   · PRIORITÉ (retour Thibaut 2026-10-26 : « les bâtiments les
//     plus qualitatifs soient priorisés pour les personnages de
//     haut rang ») : l'ordre de service est le PRESTIGE
//     décroissant — nobles avant bourgeois avant roturiers, les
//     mineurs (sans prestige propre) servis en dernier. Dans cet
//     ordre, chacun prend la MEILLEURE qualité restante : les
//     Maisons de notable partent aux personnages de haut rang,
//     les Taudis aux derniers servis ;
//   · le stock d'une ville vit DANS la ville (City.domiciles :
//     [{domicile: 'Maison', nombre: 50}, …]) — initialisé du rang
//     d'habitation à la création/changement de rang (normaliserEtat
//     le complète pour les vieilles sauvegardes) ;
//   · on ne déloge personne : un habitant garde son domicile
//     s'il existe encore au stock (l'ordre de prestige ne sert
//     qu'à répartir les places LIBRES) ;
//   · pas encore de restriction par condition sociale au sens
//     strict (un roturier PEUT finir en Maison de notable s'il
//     est servi avant les nobles — mais l'ordre de prestige fait
//     en pratique le tri).
//
//  Le champ Character.domicile est la clé : nom du type de
//  domicile ('Maison', 'Auberge'…), null = sans domicile.
// ═══════════════════════════════════════════════════════════════════════════

import type { Character, City, GameState, Player } from './types'
import { type Cfg } from './gameData'
import { rangsDefsType, nomRang } from './rangs'
import { logementsConstructionRef } from './constructions'

// ── Lecture du référentiel ───────────────────────────────────────────

/** Définition d'un type de domicile (table `domiciles` du config). */
export function domicileDef(nom: string | null | undefined, C: Cfg): { domicile: string; qualite: number } | undefined {
  if (!nom) return undefined
  // (renommage Masure → Taudis, fiches 2026-10-25 : les états
  //  sauvegardés portent l'ancien nom — alias à la lecture)
  const n = nom.toLowerCase() === 'masure' ? 'Taudis' : nom
  return C.config.domiciles.find((d) => d.domicile.toLowerCase() === n.toLowerCase())
}

/** Qualité d'un domicile (échelle 0-4 : Taudis 0 → Palais 4 —
 *  correctif échelle du 2026-10-25 ; 0 est une valeur LÉGALE, pas
 *  seulement « inconnu » ; 0 aussi sans domicile). */
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

/** Domiciles apportés au parc de logements d'une ville par ses
 *  CONSTRUCTIONS (AMÉNAGEMENTS et BÂTIMENTS — fiche bâtiments rang 2,
 *  2026-10-26) : Taudis et autres types, lus VIA LA BANQUE (retour
 *  Thibaut 2026-10-27 : les taudisApportes / domicilesApportes du
 *  référentiel sont traduits en effets `logements` — ce canal est la
 *  voie moteur unique, comme les flux). Agrégat par type ; les noms
 *  des vieilles sauvegardes peuvent porter le suffixe « (tier N) » —
 *  la lecture est par nom de construction dans le référentiel. */
export function domicilesApportesVille(ville: City, C: Cfg): Array<{ domicile: string; nombre: number }> {
  const total = new Map<string, number>()
  for (const nom of [...(ville.amenagements ?? []), ...(ville.batiments ?? [])]) {
    const ref = C.config.constructions.find((c) => c.nom === nom)
    if (!ref) continue
    for (const [domicile, nombre] of Object.entries(logementsConstructionRef(ref, C.config))) {
      if (nombre > 0) total.set(domicile, (total.get(domicile) ?? 0) + nombre)
    }
  }
  return [...total.entries()].map(([domicile, nombre]) => ({ domicile, nombre }))
}

/** TAUDIS apportés par les constructions de la ville (canal Taudis
 *  de domicilesApportesVille — fiches aménagements 2026-10-25 : tier
 *  1 = 5, tier 2 = 8, tier 3 = 10, sauf Baleinier et Bâteau de
 *  pêche ; fiche bâtiments 2026-10-26 : Poste de garde/Caserne +10,
 *  Bas quartier +20). */
export function taudisApportesVille(ville: City, C: Cfg): number {
  return domicilesApportesVille(ville, C).find((e) => e.domicile === 'Taudis')?.nombre ?? 0
}

// ── Attribution ──────────────────────────────────────────────────────

/** Habitants VIVANTS d'une ville — l'unité d'attribution (retour
 *  Thibaut 2026-10-26 : 1 logement = 1 habitant, plus de foyers). */
export function vivantsVille(state: GameState, nJoueur: number, ville: City): Character[] {
  return (state.population[nJoueur] ?? []).filter(
    (c) => c.statut !== 'Décédé' && c.ville === ville.nom,
  )
}

/** Attribue les domiciles d'une ville à ses HABITANTS, une place par
 *  personne (retour Thibaut 2026-10-26 : « je ne veux pas que les
 *  logements soient associés à des familles, je veux 1 logement = 1
 *  habitant. Et je veux également que les bâtiments les plus
 *  qualitatifs soient priorisés pour les personnages de haut rang »).
 *  Ordre de service : PRESTIGE DÉCROISSANT (nobles d'abord — les
 *  mineurs, sans prestige propre, sont servis en dernier, à
 *  prestation égale l'ordre de recensement fait foi) ; dans cet
 *  ordre chacun GARDE son domicile s'il existe encore au stock
 *  (on ne déloge personne — l'ordre de priorité ne sert qu'à
 *  répartir les places libres), sinon prend la MEILLEURE qualité
 *  restante. Stock épuisé : `Character.domicile = null` (sans
 *  logement). Retourne le nombre d'habitants LOGÉS. */
export function attribuerDomicilesVille(state: GameState, p: Player, ville: City, C: Cfg): number {
  // DÉFENSE EN PROFONDEUR (audit de merge 2026-10-24) : une partie
  //  existante dont les villes n'ont pas de stock (sauvegardées avant
  //  la vague, tampon schema déjà à jour → migrerEtat ne rejouera
  //  pas la v1) se voit initialiser le stock au rang courant.
  if (!Array.isArray(ville.domiciles)) initStockVille(ville, C)
  const pop = vivantsVille(state, p.n, ville)
  // stock restant : copie de travail
  const stock = new Map<string, number>()
  for (const e of ville.domiciles ?? []) stock.set(e.domicile, (stock.get(e.domicile) ?? 0) + e.nombre)
  // ordre de service : prestige décroissant (haut rang d'abord),
  //  tri STABLE — les ex æquo gardent l'ordre du recensement
  const servs = [...pop].sort((a, b) => (b.prestige ?? 0) - (a.prestige ?? 0))
  // types par qualité décroissante : les bâtiments les plus
  //  qualitatifs partent aux premiers servis (haut rang)
  const typesTries = [...C.config.domiciles].sort((a, b) => b.qualite - a.qualite)
  let loges = 0
  for (const c of servs) {
    // déjà logé dans un type existant au stock : garde sa place
    if (c.domicile && (stock.get(c.domicile) ?? 0) > 0) {
      stock.set(c.domicile, (stock.get(c.domicile) ?? 0) - 1)
      loges++
      continue
    }
    // à loger : meilleure qualité restante
    let place: string | null = null
    for (const t of typesTries) {
      const restant = stock.get(t.domicile) ?? 0
      if (restant > 0) {
        stock.set(t.domicile, restant - 1)
        place = t.domicile
        break
      }
    }
    // rien de libre : sans domicile
    c.domicile = place
    if (place) loges++
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
