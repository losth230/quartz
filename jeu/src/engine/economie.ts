// ══════════════════════════════════════════════════════════════════════
//  ÉCONOMIE — GAINS DE POPULATION (CalculerGainsPopulation)
//  Revenus par ville (metiers, taxes, consommation) et facteur de taxes sur
//  les naissances. Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  RÈGLE DES TAXES : le niveau de taxes module la production en TOUTE
//  ressource générée par les habitants (Or, Science, Nourriture, Tourisme…),
//  pas seulement l'Or. La consommation de Nourriture n'est pas taxée.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { Character, City, GameState, Player } from './types'
import { cfgOf, cultureDef, metierDef, regimeDef, type Cfg } from './gameData'
import { gouverneurDeVille } from './metiers'
import { rangDe } from './statutSocial'
import { effetsDogmeCulture } from './dogmes'
import { modificateursPaysJoueur, multProductionBourgeoisVille, bonusMetierParHabitantVille, scienceProfesseurPlusVille, partsIngenieurJoueur } from './batiments'
import { talentsActifs } from './talentsPeuple'

// ══════════════════════════════════════════════════════════════════════
//  GAINS DE POPULATION PAR VILLE (CalculerGainsPopulation)
//  Metiers → Ressource1/Valeur1 + Ressource2/Valeur2, modulés par le niveau
//  de taxes de la ville (sur TOUTES les ressources), puis consommation de
//  Nourriture (non taxée).
//  (Arbitrage Thibaut 2026-10-26, RANG SOCIAL — la réponse à « est-ce
//  qu'il y a une différence réelle entre roturier et bourgeois ? ») :
//  la consommation et la production dépendent désormais du RANG SOCIAL
//  dérivé du prestige (roturier < 100 ≤ bourgeois < 250 ≤ noble) :
//    · roturier : conso consoNourrParHab (base 1), production ×1 ;
//    · bourgeois : conso consoNourrBourgeois (2), production ×1,5 ;
//    · noble : conso consoNourrNoble (4), production ×1 (CORRECTION
//      du jour même 2026-10-26 : le ×1,5 est retiré des nobles).
//  Le rang lu est celui du PRESTIGE (pas la qualité du métier) ; les
//  mineurs, sans prestige propre, restent à la consommation de base.
//  (RÉSOLU 2026-10-26, retour Thibaut : « un noble de naissance doit
//  avoir 300 prestige de base » — PRESTIGE_NOBLE_NAISSANCE, posé à
//  la création) : le rang MÉCANIQUE reste fondé sur le prestige seul
//  MAIS un noble de naissance part de 300 ≥ 250 → il est noble AUSSI
//  par le prestige dès le tour 1 : consoNourrNoble (4), prodMultNoble,
//  hébergement et score de mariage le traitent en noble sans règle
//  spéciale. L'incohérence « affiché noble, traité roturier » est
//  close ; seule une CHUTE du prestige sous 250 y rouvrirait l'écart
//  (affichage rangDe : noble, mécanique : selon le prestige).
// ══════════════════════════════════════════════════════════════════════

/** Multiplicateur de production d'un habitant selon son rang social
 *  (arbitrage Thibaut 2026-10-26, corrigé du jour même) : bourgeois
 *  ×prodMultBourgeois (1,5), noble ×prodMultNoble (1 — ×1,5 retiré),
 *  roturier ×1. S'applique à TOUTE la production
 *  de métier du villageois (ressources 1/2 et bonus Ponton), AVANT le
 *  calcul des taxes (le gain amplifié est taxé comme les autres). */
export function multProdRang(c: Character, C: Cfg): number {
  // (refonte 12 lois, 2026-10-29 : rangDe — le seuil bourgeois peut
  //  être abaissé par « Bourgeoisie facile » (Communautarisme, 80))
  const r = rangDe(c, C)
  return r === 'noble' ? C.p.prodMultNoble : r === 'bourgeois' ? C.p.prodMultBourgeois : 1
}

/** Consommation de Nourriture d'un habitant vivant par tour (arbitrage
 *  Thibaut 2026-10-26) : roturier consoNourrParHab (base), bourgeois
 *  consoNourrBourgeois, noble consoNourrNoble. Le rang dérivé du
 *  PRESTIGE — les mineurs (prestige 0) restent à la base.
 *  (Dogme de l'Égalité, 2026-10-30 : les BOURGEOIS d'une culture
 *  ayant pris le dogme consomment la VALEUR du référentiel
 *  (effet consoNourrBourgeois, défaut 1) — le dogme FIXE la
 *  consommation : il l'emporte sur le régime et le défaut moteur.
 *  Le `state` est OPTIONNEL : sans lui (cités libres, tests) le
 *  dogme n'est pas consulté — les habitants des cités libres sont
 *  de toute façon tous roturiers (prestige non calculé).) */
export function consoNourrHabitant(c: Character, C: Cfg, regime?: string, state?: GameState): number {
  // (refonte 12 lois, 2026-10-29 : rangDe — le seuil bourgeois peut
  //  être abaissé par « Bourgeoisie facile » (Communautarisme, 80))
  const r = rangDe(c, C)
  // (Dogme de l'Égalité, 2026-10-30 : la culture PROPRE du
  //  personnage, où qu'il vive — même lecture que la loi
  //  d'habitant « Lavages de main » du Déisme.)
  if (state && r === 'bourgeois') {
    const dogme = effetsDogmeCulture(state, c.culture, 'consoNourrBourgeois', C)
    if (dogme > 0) return dogme
  }
  // (Refonte « 8 lois » des régimes, 2026-10-29, Socialisme
  //  « Redistribution ») : le régime du joueur PORTEUR remplace le
  //  défaut moteur pour les bourgeois (1) et les nobles (2) —
  //  arbitrage Thibaut 2026-10-29.
  const reg = regimeDef(regime ?? '', C.config)
  return r === 'noble' ? (reg?.consoNourrNobleRegime ?? C.p.consoNourrNoble)
    : r === 'bourgeois' ? (reg?.consoNourrBourgeoisRegime ?? C.p.consoNourrBourgeois)
    : C.p.consoNourrParHab
}

/** Multiplicateur de taxes d'une ville pour la production des
 *  habitants, PAR RESSOURCE (arbitrage Thibaut 2026-10-28 « changement
 *  des taxes ») : la Nourriture part du côté des naissances — Faible :
 *  Nourriture ×taxNourrFaibles, toutes les AUTRES ressources
 *  ×taxOrFaibles ; Forte : l'inverse ; Moyenne : ×1. Le nom « taxOr* »
 *  est historique (avant l'arbitrage 2026-10-28 ces clés couvraient
 *  toutes les ressources) : elles ne portent plus que les ressources
 *  hors Nourriture. */
export function facteurTaxes(ville: City, C: Cfg, ressource: string): number {
  if (ville.taxes === 'Faible') return ressource === 'Nourriture' ? C.p.taxNourrFaibles : C.p.taxOrFaibles
  if (ville.taxes === 'Forte') return ressource === 'Nourriture' ? C.p.taxNourrHautes : C.p.taxOrHautes
  return 1
}

export function calculerGainsPopulation(state: GameState, p: Player): Record<string, number> {
  return gainsPopulationJoueur(state, p, cfgOf(state.config))
}

/** Gains nets de population d'un joueur, toutes villes (métiers × taxes −
 *  consommation). Partagé entre le moteur de fin de tour et les impôts
 *  manuels (génération hors fin de tour). */
function gainsPopulationJoueur(state: GameState, p: Player, C: Cfg): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const ville of p.villes) {
    for (const [res, v] of Object.entries(gainsVilleBruts(state, p, ville, C))) {
      totals[res] = (totals[res] ?? 0) + v
    }
  }
  return totals
}

/** Gains bruts d'une ville (métiers × taxes, moins la consommation),
 *  cœur de calcul partagé entre le moteur et le détail affiché. */
function gainsVilleBruts(state: GameState, p: Player, ville: City, C: Cfg): Record<string, number> {
  const detail = detailGainsVille(state, p, ville, C)
  const out: Record<string, number> = {}
  for (const [res, v] of Object.entries(detail.net)) {
    if (v !== 0) out[res] = v
  }
  return out
}

/** Détail des gains d'une ville, canal par canal (affiché en bas de la
 *  carte de la ville : « ce que les taxes rapportent »).
 *    metiers  : production brute des metiers des habitants vivants,
 *    taxeMult: multiplicateur de taxes de la ville PAR RESSOURCE
 *              (arbitrage Thibaut 2026-10-28 : Nourriture ×taxNourr*,
 *              toutes les autres ressources ×taxOr*),
 *    taxes   : production taxée (= metiers × taxeMult),
 *    conso   : consommation de Nourriture (non taxée, par rang),
 *    net     : taxes − conso (ce qui est crédité au stock). */
export interface GainsVilleDetail {
  habitants: number
  metiers: Record<string, number>
  /** (Retour Thibaut 2026-11-15 « productions réelles des métiers
   *  des joueurs dans la page population ») : décomposition PAR
   *  MÉTIER du canal metiers — production brute RÉELLE de chaque
   *  métier de la ville, saison courante et multiplicateurs
   *  APPLIQUÉS (fiche × multiplicateur de rang social × guildes
   *  tier 3 / merveilles mondiales / champs nourriciers), AVANT
   *  taxes ; clé « Sans-emploi » pour la production du dogme du
   *  Travail (travailNourriture). Un métier absent du canal = ne
   *  produit rien dans les conditions actuelles (ex. Fermier hors
   *  été). Somme des ressources d'un métier = sa contribution
   *  exacte au canal metiers commun. */
  parMetier: Record<string, Record<string, number>>
  taxeMult: Record<string, number>
  /** Bonus de taxe ADDITIF par ressource (vague 3a, rework métiers
   *  & emplacements 2026-10-21) : Gouverneur +10 % sur toutes les
   *  ressources, Professeur +10 % Science, Banquier +10 % Or,
   *  Troubadour +10 % Tourisme — les bonus se CUMULENT de façon
   *  additive (ex. Gouverneur + Professeur = +20 % sur la Science). */
  bonusTaxes: Record<string, number>
  taxes: Record<string, number>
  conso: Record<string, number>
  net: Record<string, number>
}

export function detailGainsVille(state: GameState, p: Player, ville: City, C: Cfg): GainsVilleDetail {
  const pop = state.population[p.n] ?? []
  const vivants = pop.filter((c) => c.statut !== 'Décédé' && c.ville === ville.nom)
  // Production brute des metiers des habitants vivants de la ville.
  // Vague 3a : les métiers marqués `ete` (Fermier) ne produisent
  //  qu'en saison d'Été ; Sans-emploi (metier null) ne produit rien.
  const metiers: Record<string, number> = {}
  // (RETRAIT 2026-11-15, arbitrage Thibaut « le pêcheur produit 6
  //  Nourriture toute l'année, mais pas de bétail » : l'ancien bonus
  //  « +0,5 Bétail par Pêcheur dans une ville côtière avec bâtiment
  //  côtier (Ponton) » disparaît — le champ `cotier` du référentiel
  //  ne régit plus que les EMPLACEMENTS de métiers (capMetierVille),
  //  les gains des Pêcheurs viennent uniquement de leur fiche.)
  // (Refonte 12 lois, 2026-10-29, Naturalisme « Champs
  //  nourriciers » : si la VILLE est de culture Naturalisme, chaque
  //  FERMIER produit +1 Nourriture par tour d'ÉTÉ — le Fermier est
  //  déjà un métier `ete` du référentiel (sa production de base ne
  //  vient que l'été) ; le bonus suit la même saison, ×
  //  multiplicateur de rang, AVANT les taxes, comme le bonus Ponton.)
  const champsNourriciers = cultureDef(ville.culture, C.config)?.nourrEteParFermier ?? 0
  // (Vague tier 3, arbitrage Thibaut 2026-11-03 : les modificateurs de
  //  PAYS des guildes tier 3 — Guilde des bourgeois ×1,5 sur la
  //  production des Bourgeois, Guilde des marins +0,5 Or par
  //  Commerçant — se lisent UNE FOIS par joueur et s'appliquent
  //  VILLE PAR VILLE dans la boucle, AVANT les taxes, × multiplicateur
  //  de rang, comme les bonus Ponton / Champs nourriciers. Bâtiments
  //  REMPLACÉS exclus par modificateursPaysJoueur.)
  const modsTier3 = modificateursPaysJoueur(p, C)
  // (Talents de peuple LAURIERS, arbitrage Thibaut 2026-11-16 —
  //  talent actif dès le Laurier de sa voie (talentsActifs, DÉRIVÉ
  //  de p.lauriers, aucun état) : flux PAR HABITANT porteur d'un
  //  des métiers listés, avant taxes, × multiplicateur de rang —
  //  MÊME PATRON que la Guilde des marins (Guilde des savants,
  //  arbitrage : le talent est porté par le JOUEUR, il profite à
  //  tous ses habitants, peuple d'origine compris).
  //  ex. Khazhags Nains « Savoir des profondeurs » : +0,1 Science
  //  par Mineur/Forgeron/Charbonnier dès le Laurier I Scientifique ;
  //  « Or du commerce nain » : +0,5 Or par Commerçant dès le
  //  Laurier III Économique (cumulés par entrées).)
  const talentsFluxMetier = talentsActifs(p, C).flatMap((t) => t.fluxParMetier ?? [])
  // (Retour Thibaut 2026-11-15 « productions réelles des métiers
  //  des joueurs dans la page population ») : décomposition du
  //  canal metiers PAR MÉTIER — chaque crédit passe par le helper
  //  `credit` qui alimente l'agrégat (metiers) ET le détail
  //  (parMetier), garantissant que la somme par métier égale
  //  exactement le canal commun. Clé 'Sans-emploi' pour le dogme
  //  du Travail (production sans métier).)
  const parMetier: Record<string, Record<string, number>> = {}
  const credit = (metier: string, res: string, v: number) => {
    metiers[res] = (metiers[res] ?? 0) + v
    const parRes = parMetier[metier] ?? (parMetier[metier] = {})
    parRes[res] = (parRes[res] ?? 0) + v
  }
  for (const c of vivants) {
    // (Dogme du Travail, 2026-10-30 : les SANS-EMPLOIS d'une culture
    //  ayant pris le dogme produisent +v Nourriture par tour —
    //  culture PROPRE du personnage, où qu'il vive (loi d'habitant)
    //  ; production AVANT les taxes comme les métiers, SANS
    //  multiplicateur de rang (« +1 » littéral). Passé par le même
    //  canal `metiers` : la production apparaît au tableau de la
    //  ville et alimente impôts/vassalité comme les autres gains.)
    if (!c.metier) {
      const trav = effetsDogmeCulture(state, c.culture, 'travailNourriture', C)
      if (trav > 0) credit('Sans-emploi', 'Nourriture', trav)
      continue
    }
    const td = metierDef(c.metier, C.config)
    if (!td) continue
    if (td.ete && state.saison !== 'Été') continue
    // (Arbitrage Thibaut 2026-10-26 : la production du villageois est
    //  multipliée par le multiplicateur de son RANG SOCIAL — bourgeois
    //  ×1,5, noble ×1,5, AVANT les taxes — le gain amplifié est taxé
    //  comme les autres.)
    // (Vague tier 3 : `let` — la Guilde des bourgeois multiplie la
    //  production des Bourgeois du pays ×1,5 EN PLUS du multiplicateur
    //  de rang — une instance : ×2,25 pour un bourgeois, deux : ×3,375
    //  — cumul MULTIPLICATIF par bâtiment présent, toutes villes.)
    let mult = multProdRang(c, C)
    if (modsTier3.multProductionBourgeois > 1 && rangDe(c, C) === 'bourgeois') {
      mult *= modsTier3.multProductionBourgeois
    }
    // (Merveilles mondiales 2026-11-15 : la Pyramide des Xoltans —
    //  « les bourgeois dans cette ville ont une production doublée »
    //  — ×2 EN PLUS du multiplicateur de rang social, même
    //  sémantique que la Guilde des bourgeois mais PAR VILLE, cumul
    //  multiplicatif avec elle.)
    const multBourgeoisVille = multProductionBourgeoisVille(ville, C)
    if (multBourgeoisVille > 1 && rangDe(c, C) === 'bourgeois') {
      mult *= multBourgeoisVille
    }
    // (Vague tier 3 : bonus PAR HABITANT de la Guilde des marins —
    //  +0,5 Or par Commerçant du pays, avant taxes, × mult de rang.)
    for (const bm of modsTier3.bonusMetierParHabitant) {
      if (c.metier === bm.metier) {
        credit(c.metier, bm.ressource, bm.valeur * mult)
      }
    }
    // (Talents de peuple : même patron — flux AVANT taxes, × mult de
    //  rang, passé par le même helper `credit` (canal metiers ET
    //  détail parMetier, aucun double comptage possible).)
    for (const tf of talentsFluxMetier) {
      if (tf.metiers.includes(c.metier)) {
        credit(c.metier, tf.ressource, tf.valeur * mult)
      }
    }
    // (Merveilles mondiales 2026-11-15 : bonus PAR HABITANT de la
    //  ville — Sanctuaire de Salmodiva « les fermiers produisent +2
    //  Nourriture par tour en été », drapeau `ete` crédité
    //  uniquement en été, × mult de rang comme la Guilde des
    //  marins et champsNourriciers.)
    for (const bm of bonusMetierParHabitantVille(ville, C)) {
      if (c.metier === bm.metier && (!bm.ete || state.saison === 'Été')) {
        credit(c.metier, bm.ressource, bm.valeur * mult)
      }
    }
    // (RETRAIT 2026-11-15 : plus de bonus Bétail des Pêcheurs — cf.
    //  l'arbitrage documenté en tête de boucle.)
    if (champsNourriciers && state.saison === 'Été' && c.metier === 'Fermier') {
      credit('Fermier', 'Nourriture', champsNourriciers * mult)
    }
    if (td.ressource1 && td.valeur1 !== 0) {
      credit(c.metier, td.ressource1, td.valeur1 * mult)
    }
    if (td.ressource2 && td.valeur2 !== 0) {
      credit(c.metier, td.ressource2, td.valeur2 * mult)
    }
  }
  // Taxes : le niveau module la production PAR RESSOURCE (arbitrage
  //  Thibaut 2026-10-28 : la Nourriture part du côté des naissances,
  //  toutes les autres ressources à l'envers).
  // Grand Chambellan (ministère, refonte 2026-10-14) : +10 % sur toutes
  // les taxes reçues — multiplicateur appliqué ici (cumulables).
  // Vague 3a (rework métiers, arbitrage 2026-10-21) : les bonus de taxe
  //  sont ADDITIFS par ressource — Gouverneur +10 % (toutes ressources),
  //  Professeur +10 % Science, Banquier +10 % Or, Troubadour +10 %
  //  Tourisme (présence d'au moins un titulaire vivant dans la ville ;
  //  ex. Gouverneur + Professeur = +20 % sur la Science).
  const taxeMult: Record<string, number> = {}
  for (const res of Object.keys(metiers)) taxeMult[res] = facteurTaxes(ville, C, res)
  const bonusTaxes: Record<string, number> = {}
  const ajouteBonus = (res: string, part: number) => {
    bonusTaxes[res] = (bonusTaxes[res] ?? 0) + part
  }
  if (gouverneurDeVille(state, p, ville.nom, C)) {
    for (const res of Object.keys(metiers)) ajouteBonus(res, 0.1)
  }
  // Vague 3a (cohérence) : les bonus ne portent que les ressources
  //  EFFECTIVEMENT produites dans la ville (comme le Gouverneur) —
  //  un Troubadour sans production de Tourisme n'ouvre aucune clé.
  if (C.p.metierBanquier && vivants.some((c) => c.metier === C.p.metierBanquier) && metiers['Or'] !== undefined) ajouteBonus('Or', 0.1)
  if (C.p.metierProfesseur && vivants.some((c) => c.metier === C.p.metierProfesseur) && metiers['Science'] !== undefined) {
    // (Vague tier 3 : la Guilde des savants monte la part du
    //  Professeur +5 % — 0,10 → 0,15, additive sur la part.)
    // (Merveilles mondiales 2026-11-15 : le Laboratoire de Falheim —
    //  « tous les professeurs de la ville augmentent la production
    //  de science de 10 % supplémentaires » — +0,10 PAR VILLE,
    //  additive : guilde + laboratoire = 0,25 de part. Arbitrage :
    //  « chercheurs » = métier Scientifique, renommé Professeur le
    //  2026-10-21.)
    ajouteBonus('Science', 0.1 + modsTier3.scienceProfesseurPlus + scienceProfesseurPlusVille(ville, C))
  }
  if (C.p.metierTroubadour && vivants.some((c) => c.metier === C.p.metierTroubadour) && metiers['Tourisme'] !== undefined) ajouteBonus('Tourisme', 0.1)
  // (Fiche Khazhags Nains, arbitrage Thibaut 2026-11-17 : le métier
  //  Ingénieur — dédié à la faction, roturier — porte les DEUX bonus
  //  à la fois, « l'équivalent de banquier + professeur » : +10 %
  //  taxe d'Or ET +10 % taxe de Science (additifs aux autres
  //  titulaires, comme le Gouverneur). Le GRAND ATELIER DES
  //  INGÉNIEURS — merveille mondiale unique, famille Guilde — monte
  //  les parts de tout le PAYS à +20 % Or / +50 % Science AU LIEU DE
  //  10/10 (parts lues par partsIngenieurJoueur, niveau joueur).)
  if (C.p.metierIngenieur && vivants.some((c) => c.metier === C.p.metierIngenieur)) {
    const partsIng = partsIngenieurJoueur(p, C)
    if (metiers['Or'] !== undefined) ajouteBonus('Or', partsIng.or)
    if (metiers['Science'] !== undefined) ajouteBonus('Science', partsIng.science)
  }
  const taxes: Record<string, number> = {}
  for (const [res, v] of Object.entries(metiers)) {
    const tv = v * taxeMult[res] * (1 + (bonusTaxes[res] ?? 0))
    if (tv !== 0) taxes[res] = tv
  }
  // Consommation (non taxée, appliquée après) — PAR RANG SOCIAL
  //  (arbitrage Thibaut 2026-10-26) : roturier base, bourgeois 2,
  //  noble 4 Nourriture par vivant et par tour.
  const conso: Record<string, number> = {}
  const consoNourr = vivants.reduce((n, c) => n + consoNourrHabitant(c, C, p.regime, state), 0)
  if (consoNourr !== 0) conso['Nourriture'] = -consoNourr
  // Net = taxes − conso
  const net: Record<string, number> = {}
  for (const [res, v] of Object.entries(taxes)) net[res] = (net[res] ?? 0) + v
  for (const [res, v] of Object.entries(conso)) net[res] = (net[res] ?? 0) + v
  for (const k of Object.keys(net)) if (net[k] === 0) delete net[k]
  return { habitants: vivants.length, metiers, parMetier, taxeMult, bonusTaxes, taxes, conso, net }
}

/** Facteur de taxes sur la conception (Faible ×taxNaissFaibles / Moyenne ×1 / Forte ×taxNaissHautes — ±25 %, marqueur (z) ; valeurs reconfirmées par l'arbitrage taxes 2026-10-28 : les naissances partent du côté de la Nourriture). */
export function taxBirthFactor(ville: City | undefined, C: Cfg = cfgOf()): number {
  if (!ville) return 1
  return ville.taxes === 'Faible' ? C.p.taxNaissFaibles : ville.taxes === 'Forte' ? C.p.taxNaissHautes : 1
}

// ══════════════════════════════════════════════════════════════════════
//  IMPÔTS MANUELS — GÉNÉRATION HORS FIN DE TOUR (retour Thibaut 2026-10-14)
//  Boutons « Générer l'impôt » : créditer AUSSI SOUVENT QUE VOULU l'impôt
//  que la population (ou les vassaux) produit sur UN tour, sans attendre
//  la fin de tour. Mêmes formules que le moteur (canal « Habitants » du
//  récap : métiers × taxes − consommation ; tribut de vassalité sur l'Or).
// ══════════════════════════════════════════════════════════════════════


/**
 * (RETRAIT 2026-11-14, arbitrage Thibaut « le bétail ne produit pas de
 * nourriture, ça n’a jamais été demandé » : l’ancien bonus « chaque
 * unité de Bétail en stock rapporte 4 Nourriture par tour » est
 * supprimé du moteur — la fonction nourritureBetail n’existe plus.)
 */
/** Impôt que la population de p produit sur UN tour (canal « Habitants » :
 *  taxes − consommation, × gainsCrediteStock comme au fin de tour). */
export function impotPopulation(state: GameState, p: Player, C: Cfg): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [res, v] of Object.entries(gainsPopulationJoueur(state, p, C))) {
    const cv = v * C.p.gainsCrediteStock
    if (cv !== 0) out[res] = cv
  }
  return out
}

/** Impôt que chaque vassal de p lui reverse sur UN tour (part
 *  vassalPrelevement de l'Or gagné par les habitants du vassal). */
export interface ImpotVassal {
  vassal: string
  montant: number
}

export function impotsVassaux(state: GameState, p: Player, C: Cfg): ImpotVassal[] {
  const out: ImpotVassal[] = []
  // (Dogme de la Mère Patrie, 2026-10-30 : le tribut reçu par un
  //  suzerain de la culture porteuse est ×(1+v) (effet tributVassal,
  //  défaut +5 %) — le vassal paie SA part, la différence est CRÉÉE
  //  pour le suzerain (même arbitrage que la loi « Vassaux
  //  dévoués », appliqué sur la culture du SUZERAIN cette fois).
  //  Symétrique du branchement de transfererTributVassal (fin de
  //  tour) : les deux chemins du tribut portent le dogme.)
  // (Vague tier 3, arbitrage Thibaut 2026-11-03 : la Guilde des
  //  diplomates — « vous gagnez 5 % de taxes supplémentaires en
  //  provenance de vos vassaux » — part ADDITIVE ×(1+v) sur l'impôt
  //  manuel, cumulée au dogme (Mère Patrie) et au régime (Vassaux
  //  dévoués). Symétrique du branchement de transfererTributVassal
  //  (fin de tour) : les deux chemins du tribut portent la guilde.)
  const multGuilde = 1 + modificateursPaysJoueur(p, C).tributVassalPlus
  const multDogme = 1 + effetsDogmeCulture(state, p.culture, 'tributVassal', C)
  for (const v of state.players) {
    if (v.vassalDe !== p.n || p.vassalDe === v.n) continue // serment croisé ignoré
    const gains = gainsPopulationJoueur(state, v, C)
    const part = (gains['Or'] ?? 0) * C.p.vassalPrelevement * multDogme * multGuilde
    if (part !== 0) out.push({ vassal: v.nom, montant: part })
  }
  return out
}

const fmtImp = (v: number) => Math.round(v * 10) / 10

/** Crédite l'impôt de la population de p, `fois` fois, au stock + log
 *  Système. Retourne le récap crédité (null si rien à créditer). */
export function genererImpotPopulation(
  state: GameState, p: Player, C: Cfg, fois: number,
): Record<string, number> | null {
  if (fois <= 0) return null
  const impot = impotPopulation(state, p, C)
  if (Object.keys(impot).length === 0) {
    state.log.push({
      turn: state.turn, type: 'Système', joueur: p.n,
      texte: `💰 Impôt de la population : rien à générer (aucun gain d'habitants pour ${p.nom}).`,
    })
    return null
  }
  const credite: Record<string, number> = {}
  for (const [res, v] of Object.entries(impot)) {
    const rs = p.resources[res]
    if (!rs) continue
    const total = v * fois
    rs.stock += total
    credite[res] = total
  }
  state.log.push({
    turn: state.turn, type: 'Système', joueur: p.n,
    texte: `💰 Impôt de la population généré ×${fois} pour ${p.nom} : ` +
      Object.entries(credite).map(([r, v]) => `${fmtImp(v)} ${r}`).join(', ') +
      ` (impôt d'un tour × ${fois}).`,
  })
  return credite
}

/** Crédite l'impôt reçu des vassaux de p, `fois` fois, au stock d'Or +
 *  log Système. Retourne le total crédité (null si aucun vassal ne
 *  reverse d'Or). */
export function genererImpotVassaux(
  state: GameState, p: Player, C: Cfg, fois: number,
): number | null {
  if (fois <= 0) return null
  const parts = impotsVassaux(state, p, C)
  if (parts.length === 0) {
    state.log.push({
      turn: state.turn, type: 'Système', joueur: p.n,
      texte: `🤝 Impôt des vassaux : rien à générer (aucun vassal de ${p.nom} ne reverse d'Or).`,
    })
    return null
  }
  const total = parts.reduce((s2, x) => s2 + x.montant, 0) * fois
  const rs = p.resources['Or']
  if (rs) rs.stock += total
  state.log.push({
    turn: state.turn, type: 'Système', joueur: p.n,
    texte: `🤝 Impôt des vassaux généré ×${fois} pour ${p.nom} : +${fmtImp(total)} Or (` +
      parts.map((x) => `${x.vassal} : ${fmtImp(x.montant)}`).join(', ') +
      ` par tour × ${fois}).`,
  })
  return total
}
