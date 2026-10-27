// ═══════════════════════════════════════════════════════════════════════════
//  BANQUE D'EFFETS — IMPLÉMENTATION (refactor 2026-10-18)
//
//  Chaque type d'effet est implémenté UNE fois ici. Les règles
//  (bâtiments, factions…) combinent ces effets par DONNÉES ;
//  changer une règle = changer ses données, jamais ce fichier.
//
//  CONTRAT D'IMMUABILITÉ : un effet ne mute JAMAIS l'état. Il renvoie
//  sa contribution (flux, garnison…) via une ContributionEffets ;
//  le moteur décide où et quand l'appliquer. C'est ce qui rend la
//  banque testable en isolation.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  ContexteEffet, ContributionEffets, ConditionRegle, Effet, RegleBanque,
} from '../types'

// ── Conditions ─────────────────────────────────────────────────────────────

/** Vérifie les conditions d'une règle pour un contexte donné.
 *  Toutes les conditions présentes sont combinées en ET.
 *  (RETRAIT 2026-10-24, purge R4 : les conditions SANS PRODUCTEUR —
 *  peuple, vassal, suzerainDeCite (plus les notes documentaires
 *  ageMin/pontificatMin « suivi manuel au plateau ») — sont
 *  supprimées avec leurs champs de ConditionRegle ; seules restent
 *  saison, regime et culture, les seules produites par le registre.
 *  L'ancien contenu reste dans l'historique git, règle 9.) */
export function conditionsRemplies(cond: ConditionRegle | undefined, ctx: ContexteEffet): boolean {
  if (!cond) return true
  const { joueur } = ctx
  if (cond.saison && ctx.saison !== cond.saison) return false
  // (RETRAIT 2026-10-24 : les conditions `tech` / `techNom` — tech
  //  débloquée requise — sont supprimées avec le système de
  //  progrès, retour arbitre.)
  if (cond.regime && joueur.regime !== cond.regime) return false
  if (cond.culture && joueur.culture !== cond.culture) return false
  return true
}

// ── Application d'un effet ──────────────────────────────────────────────────

/** Applique UN effet à une contribution (accumulate). */
function appliquerEffet(e: Effet, ctx: ContexteEffet, out: ContributionEffets): void {
  switch (e.type) {
    case 'fluxVille': {
      if (e.ete) {
        out.fluxEte[e.ressource] = (out.fluxEte[e.ressource] ?? 0) + e.valeur
      } else {
        out.flux[e.ressource] = (out.flux[e.ressource] ?? 0) + e.valeur
      }
      break
    }

    case 'fluxParAmenagement': {
      // Production CUMULABLE : valeur × nombre d'aménagements portant
      //  l'un des noms listés dans TOUTES les villes du joueur (ex.
      //  Socialisme : +5 Nourriture d'été par Champ/Rizière — la
      //  saison est une CONDITION de la règle, pas un if ici).
      let nb = 0
      for (const v of ctx.joueur.villes) {
        for (const a of v.amenagements ?? []) {
          if (e.noms.includes(a)) nb++
        }
      }
      if (nb > 0) out.flux[e.ressource] = (out.flux[e.ressource] ?? 0) + e.valeur * nb
      break
    }
    case 'fluxParVilleCultureMonde': {
      // Production par VILLE de la culture du joueur dans le MONDE
      //  entier, tous joueurs confondus (ex. Lunisme : +4 Tourisme
      //  par ville de culture Lunisme).
      let nb = 0
      for (const q of ctx.state.players) {
        for (const v of q.villes) {
          if (v.culture === ctx.joueur.culture) nb++
        }
      }
      if (nb > 0) out.flux[e.ressource] = (out.flux[e.ressource] ?? 0) + e.valeur * nb
      break
    }
    // (RETRAIT 2026-10-24, retour arbitre : les types d'effets des
    //  TECHS — fluxSiCapitale, fluxParVille, fluxParVilleProximite,
    //  fluxParRangHabitation, fluxParBatiment,
    //  fluxParGarnisonHabitation, fluxParMetier — sont supprimés
    //  avec le système de progrès. L'ancien contenu reste dans
    //  l'historique git, règle 9.)
    // (RETRAIT 2026-10-24, purge R4 « complète » : les types restants
    //  SANS PRODUCTEUR — fluxJoueur, fluxCapitale, garnisonParRang,
    //  tourismeInstantane, habitantsVille, conversionPoids,
    //  migrationPoids, reductionCout, reductionLeveeArmee,
    //  emissaires, scienceInstantanee, ressourcesInstantanees,
    //  demographieVille (et les canaux instantanes/conversion/
    //  migration/reductions de la contribution) — sont supprimés :
    //  le référentiel ne produit que fluxVille, garnisonVille,
    //  fluxParAmenagement et fluxParVilleCultureMonde, et le moteur
    //  ne lit que flux/fluxEte/garnison. L'ancien contenu reste dans
    //  l'historique git, règle 9.)
    case 'garnisonVille': {
      out.garnison += e.valeur
      break
    }

    // (Retour Thibaut 2026-10-27 : « des valeurs qui passent par la
    //  banque » — les emplacements de métiers et les logements sont
    //  des canaux de la contribution AU MÊME TITRE que les flux.)
    case 'placesMetier': {
      out.placesMetier[e.metier] = (out.placesMetier[e.metier] ?? 0) + e.valeur
      break
    }
    case 'logements': {
      out.logements[e.logement] = (out.logements[e.logement] ?? 0) + e.valeur
      break
    }
  }
}

// ── Application de la banque ───────────────────────────────────────────────

export function contributionVide(): ContributionEffets {
  return { flux: {}, fluxEte: {}, garnison: 0, placesMetier: {}, logements: {} }
}

/** Applique un ensemble de règles de la banque à un contexte et renvoie
 *  la contribution agrégée. Ne mute ni l'état ni les règles. */
export function appliquerRegles(regles: RegleBanque[], ctx: ContexteEffet): ContributionEffets {
  const out = contributionVide()
  for (const r of regles) {
    if (!conditionsRemplies(r.conditions, ctx)) continue
    for (const e of r.effets) appliquerEffet(e, ctx, out)
  }
  return out
}
