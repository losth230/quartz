// ══════════════════════════════════════════════════════════════════════
//  BÂTIMENTS — EFFETS AUTOMATIQUES PAR TOUR (étape 3quater de FinDeTour)
//  Les bâtiments des villes produisent et consomment des ressources à
//  chaque fin de tour : +1 Bois pour un Camp de bûcheron, −10 Nourriture
//  pour un Poste de garde, +45 Nourriture / −1 Charbon pour un Moulin à
//  vent…
//  RÉFÉRENTIEL CANONIQUE : chaque bâtiment référence ses COÛTS
//  STRUCTURÉS (champ `couts`, retour Thibaut 2026-10-27) et ses
//  règles (table `constructions`, feuille « Ville » du classeur).
//  TOUTE production passe par la BANQUE D'EFFETS (retour Thibaut
//  2026-10-19) : effetsConstructionRef lit la règle de la construction
//  (rules/registry → rules/effects) ; un bâtiment hors référentiel
//  ne produit RIEN (l'ancien analyseur du texte d'effet et
//  EFFETS_FORCES ont été retirés le 2026-10-19 — les bâtiments
//  santé / écoles portent des effets de moteur, pas des flux).
//  (RETRAIT 2026-10-27, audit + retour Thibaut « supprimer toutes les
//  merveilles pour l'instant » : les 4 merveilles du référentiel, le
//  module merveilles.ts et le doublement de Science du Laboratoire
//  de Falheim disparaissent — les bâtiments inconnus portés par les
//  vieilles sauvegardes ne produisent simplement rien.)
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { City, Player } from './types'
import type { GameConfig } from '../config/defaultConfig'
import type { Cfg } from './gameData'
import {
  constructionRef, coutBatimentRef, effetsConstructionRef, garnisonConstructionRef,
  batimentsRefs, type ConstructionRef,
} from './constructions'

/** Toutes les références de bâtiments du référentiel canonique. */
export function batimentsConstructionsRefs(C?: Cfg): ConstructionRef[] {
  return batimentsRefs(C?.config)
}

// RETRAIT (2026-10-19, retour Thibaut « tout ce qui a rapport à une
//  production passe par la banque ») : l'analyseur local du texte
//  d'effet, EFFETS_FORCES (4 bâtiments « hors référentiel » en fait tous
//  présents dans la table constructions) et le cache associés ont été
//  supprimés — la production d'un bâtiment se lit EXCLUSIVEMENT via la
//  banque d'effets (effetsConstructionRef) ; un bâtiment sans règle ne
//  produit rien.

// (NORMALISATION 2026-11-02, arbitrage Thibaut « rien ne vit dans le
//  code ») : la table REMPLACE hardcodée est RETIRÉE — les
//  remplacements vivent dans le champ `remplaceBatiment` (TABLEAU)
//  du RÉFÉRENTIEL (données paramétrables, éditeur Référentiels), lu
//  par remplaceBatimentRef. Sémantique inchangée : les effets du
//  bâtiment remplacé sont ignorés quand le remplaçant est présent
//  dans la même ville. L'ancien contenu reste dans l'historique git,
//  règle 9.)

/** Bâtiments neutralisés par `remplaceBatiment` de la construction
 *  donnée (lecture du référentiel, groupe optionnel). */
export function remplaceBatimentRef(nom: string, cfg?: GameConfig, groupe?: string): string[] {
  const ref = constructionRef(nom, cfg, groupe)
  return ref?.remplaceBatiment ?? []
}

/** Effets par tour d'un bâtiment : production EXACTE du référentiel,
 *  lue via la BANQUE D'EFFETS (règle de la construction — retour Thibaut
 *  2026-10-19 : toute production passe par la banque). Sans règle :
 *  production nulle.
 *  GROUPE (correctif 2026-10-18) : 4 bâtiments existent en versions
 *  Ville ET Château aux effets/coûts DIFFÉRENTS (Herses, Echoppe,
 *  Herboristerie, Observatoire) — l'appelant passe le type
 *  d'habitation de SA ville, sinon la version Ville écraserait les
 *  effets des châteaux. */
export function effetsTourBatiment(nom: string, C: Cfg, groupe?: string): Record<string, number> {
  const ref = constructionRef(nom, C.config, groupe)
  return ref ? effetsConstructionRef(ref, C.config) : {}
}

/** Garnison statique accordée par un bâtiment (valeur d'état, pas un
 *  flux) — via la banque ; sans règle : 0. Groupe : cf. effetsTourBatiment
 *  (doublons Ville/Château). */
export function garnisonBatiment(nom: string, C: Cfg, groupe?: string): number {
  const ref = constructionRef(nom, C.config, groupe)
  return ref ? garnisonConstructionRef(ref, C.config) : 0
}

/** Production Tourisme par tour d'un bâtiment ou aménagement — lu sur
 *  la règle de BANQUE (voie unique depuis 2026-10-19 ; l'ancienne
 *  double voie « tourisme statique au texte + flux banque » est
 *  unifiée). Le Tourisme est un FLUX NORMAL (retour Thibaut
 *  2026-10-16) : la valeur alimente tourismeCourant (stock = production,
 *  recalculé en fin de tour) et la conversion culturelle. */
export function productionTourismeBatiment(nom: string, C: Cfg, groupe?: string): number {
  const ref = constructionRef(nom, C.config, groupe)
  return ref ? (effetsConstructionRef(ref, C.config)['Tourisme'] ?? 0) : 0
}

// ── Coût de construction (référentiel canonique) ────────────────────────

/** Coût de construction d'un bâtiment : texte de coût EXACT du
 *  référentiel canonique (groupe optionnel : Ville / Château /
 *  Capitale). Plus de repli sur les anciennes tables batimentsVille /
 *  batimentsChateau (retour Thibaut 2026-10-23, dette legacy
 *  retirée) : une construction hors référentiel n'a pas de coût. */
export function coutBatiment(nom: string, C: Cfg, groupe?: string): Record<string, number> {
  return coutBatimentRef(nom, C.config, groupe)
}

/** Bâtiments d'une ville neutralisés par un remplaçant présent
 *  (lecture du champ remplaceBatiment du RÉFÉRENTIEL, avec le groupe
 *  de la ville — les remplacements doublés Ville/Château se lisent
 *  dans la bonne version). */
function batimentsRemplaces(ville: City, C: Cfg): Set<string> {
  const presents = new Set(ville.batiments)
  const ignores = new Set<string>()
  for (const nom of presents) {
    for (const remplace of remplaceBatimentRef(nom, C.config, ville.type)) {
      if (presents.has(remplace)) ignores.add(remplace)
    }
  }
  return ignores
}

/** Effets par tour cumulés des bâtiments d'une ville (remplacements gérés).
 *  Le GROUPE est le type d'habitation de la ville (Ville / Château) :
 *  les bâtiments doublés du référentiel rendent leurs effets de la
 *  bonne version (cf. effetsTourBatiment). */
export function effetsBatimentsVille(ville: City, C: Cfg): Record<string, number> {
  const ignores = batimentsRemplaces(ville, C)
  const groupe = ville.type
  const out: Record<string, number> = {}
  for (const nom of ville.batiments) {
    if (ignores.has(nom)) continue
    for (const [res, v] of Object.entries(effetsTourBatiment(nom, C, groupe))) {
      out[res] = (out[res] ?? 0) + v
    }
  }
  return out
}

/** Crédite au stock les effets par tour de TOUS les bâtiments du joueur,
 *  et renvoie les effets appliqués (pour le récap ressources). */
export function appliquerEffetsBatiments(p: Player, C: Cfg): Record<string, number> {
  const out: Record<string, number> = {}
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(effetsBatimentsVille(ville, C))) {
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

// ── Émissaires « tant que le bâtiment est construit » (2026-11-03) ────────

/** ÉMISSAIRES accordés par les CONSTRUCTIONS présentes du joueur :
 *  BÂTIMENTS (valeur d'état, pas un flux — arbitrage Thibaut
 *  2026-11-03 : Délégation tier 1 château +1, Chancellerie tier 2
 *  +2, Ambassade tier 3 +4, Guilde des diplomates +7) ET
 *  AMÉNAGEMENTS — dont les MERVEILLES NATURELLES (Coeur Ancestral
 *  +1, fiche arbitre 2026-10-25). BUG 2026-11-12 (retour Thibaut «
 *  aucun émissaire n'est crédité pour le Coeur Ancestral ») : les
 *  merveilles sont des AMÉNAGEMENTS — elles vivent dans
 *  ville.amenagements, jamais dans ville.batiments, et le +1 du
 *  Coeur Ancestral n'était compté NULLE PART (référentiel et picker
 *  corrects, réserve mobilisable AVEUGLE). Même champ
 *  emissairesApportes, même sémantique « tant que la construction
 *  tient » : les deux listes sont sommées. Renommée depuis
 *  emissairesBatimentsJoueur (le nom historique mentait sur le
 *  périmètre).
 *  Pour les BÂTIMENTS, contrairement au comptage des ROUTES
 *  (maxRoutesJoueur, commerce.ts), les REMPLACÉS sont EXCLUS :
 *  c'est le cœur du design en tiers — la Chancellerie neutralise le
 *  +1 de la Délégation qu'elle remplace, l'Ambassade le +2 de la
 *  Chancellerie (patron batimentsRemplaces). Les AMÉNAGEMENTS n'ont
 *  PAS de neutralisation à faire : l'amélioration REMPLACE
 *  l'exemplaire EN PLACE dans la liste (Constructions.ts,
 *  cible[iBase] = nom) qui ne porte donc que des aménagements
 *  actifs, et les merveilles naturelles ne sont JAMAIS améliorables.
 *  Le total s'ajoute à la réserve MANUELLE (p.emissaires, saisie au
 *  plateau) pour donner la réserve MOBILISABLE — cf. CitesLibresView
 *  et la carte « Réserves d'émissaires ». */
export function emissairesConstructionsJoueur(p: Player, C: Cfg): number {
  let total = 0
  for (const ville of p.villes) {
    const ignores = batimentsRemplaces(ville, C)
    for (const nom of ville.batiments) {
      if (ignores.has(nom)) continue
      const ref = constructionRef(nom, C.config, ville.type)
      total += (ref?.emissairesApportes ?? 0)
    }
    for (const nom of ville.amenagements ?? []) {
      const ref = constructionRef(nom, C.config)
      total += (ref?.emissairesApportes ?? 0)
    }
  }
  return total
}

// ── Règle « le remplacé ne compte plus » — généralisée (vague tier 3,
//  2026-11-03) ─────────────────────────────────────────────────────────

/** Bâtiments d'une ville qui COMPTENT encore : ceux qui ne sont
 *  neutralisés par aucun remplaçant présent (batimentsRemplaces).
 *  Avant la vague tier 3, seuls les FLUX (effetsBatimentsVille)
 *  excluaient les remplacés ; avec les chaînes tier 3 (Complexe →
 *  Guilde des marins, Plateforme → Guilde des marchands, Ecole
 *  intermédiaire → Ecole supérieure…) la règle s'étend aux
 *  EMPLACEMENTS (metiers.ts), aux ROUTES apportées (commerce.ts,
 *  maxRoutesJoueur) et aux DOMICILES (domiciles.ts) — sans elle, un
 *  Complexe ET sa Guilde des marins compteraient 24 + 40 = 64
 *  emplacements au lieu de 40. Les AMÉNAGEMENTS restent hors du
 *  périmètre du remplacement (remplaceAmenagement se règle ailleurs). */
export function batimentsActifsVille(ville: City, C: Cfg): string[] {
  const ignores = batimentsRemplaces(ville, C)
  return (ville.batiments ?? []).filter((nom) => !ignores.has(nom))
}

// ── Modificateurs de PAYS tier 3 (arbitrage Thibaut 2026-11-03) ────────

/** Modificateurs de pays lus sur les bâtiments ACTIFS du joueur
 *  (vague tier 3 — guildes) : multiplicateurs cumulés
 *  MULTIPLICATIVEMENT, parts additives ADDITIVEMENT. Bâtiments
 *  REMPLACÉS exclus (batimentsRemplaces) : la règle « le remplacé
 *  ne compte plus » vaut pour toute lecture de valeur d'état. */
export interface ModificateursPays {
  multProductionBourgeois: number   // ×1 par défaut, ×1,5 par Guilde des bourgeois
  bonusMetierParHabitant: Array<{ metier: string; ressource: string; valeur: number }>
  multRevenusCommerce: number        // ×1 par défaut, ×1,5 par Guilde des marchands
  tributVassalPlus: number           // +0 par défaut, +0,05 par Guilde des diplomates
  conversionLocalePlus: number       // +0 par défaut, +0,10 par Guilde des évangélistes
  scienceProfesseurPlus: number      // +0 par défaut, +0,05 par Guilde des savants
}

/** Agrégat des modificateurs de pays portés par les bâtiments ACTIFS
 *  de TOUTES les villes du joueur (valeurs d'état « tant que ce
 *  bâtiment est construit », patron emissairesBatimentsJoueur). */
export function modificateursPaysJoueur(p: Player, C: Cfg): ModificateursPays {
  const out: ModificateursPays = {
    multProductionBourgeois: 1,
    bonusMetierParHabitant: [],
    multRevenusCommerce: 1,
    tributVassalPlus: 0,
    conversionLocalePlus: 0,
    scienceProfesseurPlus: 0,
  }
  for (const ville of p.villes) {
    const ignores = batimentsRemplaces(ville, C)
    for (const nom of ville.batiments) {
      if (ignores.has(nom)) continue
      const ref = constructionRef(nom, C.config, ville.type)
      if (!ref) continue
      out.multProductionBourgeois *= (ref.multProductionBourgeois ?? 1)
      out.multRevenusCommerce *= (ref.multRevenusCommerce ?? 1)
      out.tributVassalPlus += (ref.tributVassalPlus ?? 0)
      out.conversionLocalePlus += (ref.conversionLocalePlus ?? 0)
      out.scienceProfesseurPlus += (ref.scienceProfesseurPlus ?? 0)
      for (const bm of ref.bonusMetierParHabitant ?? []) out.bonusMetierParHabitant.push(bm)
    }
  }
  return out
}

/** Conversion locale vers la culture de la VILLE d'accueil portée par
 *  ses bâtiments ACTIFS (Guilde des évangélistes, tier 3 — cumulée au
 *  dogme Nationalisme conversionLocale, lu PAR VILLE d'accueil dans
 *  culture.ts). */
export function conversionLocaleBatimentsVille(ville: City, C: Cfg): number {
  let total = 0
  for (const nom of batimentsActifsVille(ville, C)) {
    total += (constructionRef(nom, C.config, ville.type)?.conversionLocalePlus ?? 0)
  }
  return total
}

// ── Vue détaillée pour l'interface (tableau des bâtiments) ─────────────

interface LigneBatiment {
  nom: string
  villes: string[]               // villes qui le possèdent
  effets: Record<string, number>  // flux par tour cumulés (0 si remplacé partout)
  remplacePar: string[]           // remplaçants présents dans les mêmes villes
  garnison: number               // garnison statique
}

/** Détail des bâtiments d'un joueur, agrégé par bâtiment (pour PlayerView). */
export function detailsBatimentsJoueur(p: Player, C: Cfg): LigneBatiment[] {
  const lignes = new Map<string, LigneBatiment>()
  for (const ville of p.villes) {
    const ignores = batimentsRemplaces(ville, C)
    for (const nom of ville.batiments) {
      let l = lignes.get(nom)
      if (!l) {
        l = { nom, villes: [], effets: {}, remplacePar: [], garnison: garnisonBatiment(nom, C) }
        lignes.set(nom, l)
      }
      l.villes.push(ville.nom)
      if (ignores.has(nom)) {
        for (const autre of ville.batiments) {
          if (remplaceBatimentRef(autre, C.config, ville.type).includes(nom) && !l.remplacePar.includes(autre)) {
            l.remplacePar.push(autre)
          }
        }
      } else {
        for (const [res, v] of Object.entries(effetsTourBatiment(nom, C))) {
          l.effets[res] = (l.effets[res] ?? 0) + v
        }
      }
    }
  }
  return [...lignes.values()].sort((a, b) => a.nom.localeCompare(b.nom))
}

