// ══════════════════════════════════════════════════════════════════════
//  AMÉNAGEMENTS DE TERRAIN — EFFETS AUTOMATIQUES PAR TOUR
//  Les villes peuvent accueillir des aménagements en plus des bâtiments :
//  ils exploitent une case de terrain (Baleine, Plaine, Forêt…) et
//  rapportent des ressources à chaque fin de tour.
//  RÉFÉRENTIEL CANONIQUE (retour Thibaut 2026-10-27 : données
//  structurées) : chaque aménagement porte son coût en paires
//  {ressource, valeur} (champ `couts`), ses effets en flux de banque et
//  ses emplacements de métiers. Le Camp de bâtisseurs réduit le coût de
//  construction (champ `reduction`, repli 5 Or / 1 Bois).
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { City, Player, Saison } from './types'
import type { GameConfig } from '../config/defaultConfig'
import {
  constructionRef, coutConstructionRef, effetsConstructionRef,
  effetsEteConstructionRef, eteSeulementRef, reductionCampDeBatisseurs,
} from './constructions'

// ── Définitions exposées à l'interface ─────────────────────────────────

// (RETRAIT 2026-10-27, retour Thibaut « le coût ne doit plus être
//  textuel » : COUT_AMENAGEMENT_TEXTE — constante du coût affichable du
//  Baleinier, lue dans son TEXTE de coût — est supprimée ; les coûts se
//  lisent en DONNÉES via coutConstructionRef. L'ancien contenu reste
//  dans l'historique git, règle 9.)
// (RETRAIT 2026-10-27, AUDIT : AmenagementDef / amenagementsDefs /
//  AMENAGEMENTS / amenagementDef — vues normalisées lisant les textes
//  « effet / description » du classeur — sont du CODE MORT (le champ
//  `effet` est vide depuis le passage aux coûts structurés, plus
//  AUCUN lecteur). L'interface passe par amenagementRef +
//  effetsTourAmenagement. Historique git.)

/** Référence brute du référentiel : coût (`couts`) et règle de banque. */
export function amenagementRef(nom: string, cfg?: GameConfig) {
  return constructionRef(nom, cfg)
}

/** Le joueur possède-t-il un Camp de bâtisseurs (coût des aménagements réduit) ? */
export function aCampDeBatisseurs(p: Player): boolean {
  return p.villes.some((v) => v.batiments.includes('Camp de bâtisseurs'))
}

/** Coût de construction d'un aménagement pour ce joueur : coût du
 *  référentiel pour l'aménagement demandé, en DONNÉES STRUCTURÉES
 *  (champ `couts`, retour Thibaut 2026-10-27 — AUDIT : plus de repli
 *  « Baleinier » ni coût forcé, un aménagement hors référentiel n'a
 *  pas de coût), réduction du Camp de bâtisseurs déduite (champ
 * `reduction`, repli 5 Or / 1 Bois — plancher à 0). */
export function coutAmenagement(p: Player, cfg: GameConfig, nom: string): Record<string, number> {
  const ref = amenagementRef(nom, cfg)
  const base = ref ? coutConstructionRef(ref) : {}
  if (!aCampDeBatisseurs(p)) return { ...base }
  const reduc = reductionCampDeBatisseurs(cfg)
  const out: Record<string, number> = {}
  for (const [res, v] of Object.entries(base)) {
    out[res] = Math.max(0, v - (reduc[res] ?? 0))
  }
  return out
}

/** Effets par tour d'un aménagement pour la saison donnée
 *  (Champ et Rizière ne produisent qu'en été — production exacte du
 *  référentiel). (AUDIT 2026-10-27 : dé-exporté, usage interne
 *  uniquement — detailsAmenagementsJoueur.) */
function effetsTourAmenagement(nom: string, saison: Saison, cfg?: GameConfig): Record<string, number> {
  const ref = amenagementRef(nom, cfg)
  if (!ref) return {}
  if (eteSeulementRef(ref, cfg) && saison !== 'Été') return {}
  // Effets structurés (marqueur (s)) : flux hors été + production d'été
  // du canal « Nourr - été » quand c'est la saison d'Été.
  const out = { ...effetsConstructionRef(ref, cfg) }
  if (saison === 'Été') {
    for (const [res, v] of Object.entries(effetsEteConstructionRef(ref, cfg))) {
      out[res] = (out[res] ?? 0) + v
    }
  }
  return out
}

/** Effets par tour des aménagements d'une ville, HORS production d'été :
 *  la « nourriture d'été » (Champ, Rizière — production exacte du
 *  référentiel, texte « … par tour en été ») est une production
 *  SÉPARÉE, créditée uniquement en été (fonction
 *  effetsNourrEteAmenagementsVille ci-dessous) — jamais doublée ni
 *  mélangée avec la nourriture générale. */
export function effetsAmenagementsVille(ville: City, cfg?: GameConfig): Record<string, number> {
  const out: Record<string, number> = {}
  for (const nom of ville.amenagements ?? []) {
    const ref = amenagementRef(nom, cfg)
    if (!ref || eteSeulementRef(ref, cfg)) continue // production d'été → canal « Nourr - été »
    for (const [res, v] of Object.entries(effetsConstructionRef(ref, cfg))) {
      out[res] = (out[res] ?? 0) + v
    }
  }
  return out
}

/** Production d'ÉTÉ d'une ville (ligne « Nourr - été » du classeur) :
 *  effets des aménagements qui ne produisent qu'en été (Champ, Rizière).
 *  Le moteur ne crédite cette production au stock de Nourriture QUE
 *  pendant l'été (macro FinDeTour : prodSummer = ligne « Nourr - été »). */
export function effetsNourrEteAmenagementsVille(ville: City, cfg?: GameConfig): Record<string, number> {
  const out: Record<string, number> = {}
  for (const nom of ville.amenagements ?? []) {
    const ref = amenagementRef(nom, cfg)
    if (!ref) continue
    for (const [res, v] of Object.entries(effetsEteConstructionRef(ref, cfg))) {
      out[res] = (out[res] ?? 0) + v
    }
  }
  return out
}

/** Crédite au stock les effets par tour de TOUS les aménagements du joueur
 *  (étape moteur, après les bâtiments) et renvoie les effets appliqués. */
export function appliquerEffetsAmenagements(p: Player, cfg?: GameConfig): Record<string, number> {
  const out: Record<string, number> = {}
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(effetsAmenagementsVille(ville, cfg))) {
      out[res] = (out[res] ?? 0) + v
    }
  }
  for (const [res, v] of Object.entries(out)) {
    if (!v) continue
    const rs = p.resources[res]
    if (rs) rs.stock += v
  }
  return out
}

// ── Vue détaillée pour l'interface (tableau des aménagements) ───────────

export interface LigneAmenagement {
  nom: string
  terrain: string
  villes: string[]               // villes qui le possèdent
  effets: Record<string, number>  // flux par tour cumulés (0 si hors saison)
  horsSaison: boolean             // true = ne produit pas à la saison actuelle
  /** aménagement à production d'été seule (Champ, Rizière) → canal
   *  « Nourr - été », crédité uniquement en été */
  eteSeulement?: boolean
}

/** Détail des aménagements d'un joueur, agrégé par aménagement (pour PlayerView). */
export function detailsAmenagementsJoueur(p: Player, saison: Saison, cfg?: GameConfig): LigneAmenagement[] {
  const lignes = new Map<string, LigneAmenagement>()
  for (const ville of p.villes) {
    for (const nom of ville.amenagements ?? []) {
      let l = lignes.get(nom)
      if (!l) {
        const ref = amenagementRef(nom, cfg)
        l = {
          nom, terrain: ref?.terrain ?? '—', villes: [], effets: {},
          horsSaison: !!ref && eteSeulementRef(ref, cfg) && saison !== 'Été',
          eteSeulement: !!ref && eteSeulementRef(ref, cfg),
        }
        lignes.set(nom, l)
      }
      l.villes.push(ville.nom)
      for (const [res, v] of Object.entries(effetsTourAmenagement(nom, saison, cfg))) {
        l.effets[res] = (l.effets[res] ?? 0) + v
      }
    }
  }
  return [...lignes.values()].sort((a, b) => a.nom.localeCompare(b.nom))
}
// (RETRAIT 2026-10-27 : le ré-export de parseCoutTexte disparaît avec
//  l'analyseur — plus AUCUN coût textuel dans le jeu, les coûts
//  d'habitation sont passés aux DONNÉES `couts` comme les
//  constructions, retour Thibaut « idem bâtiments/aménagements ».)
