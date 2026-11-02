// ══════════════════════════════════════════════════════════════════════
//  RÉGIMES POLITIQUES & CULTURES — EFFETS AUTOMATIQUES (page « Royaume »)
//  Les régimes et les cultures sont paramétrables dans les référentiels
//  (onglet « 📚 Référentiels » → « Cultures & régimes », ou « 🎛
//  Paramètres » → Cultures / Régimes) et leurs lois chiffrées sont
//  prises en compte AUTOMATIQUEMENT par le moteur à chaque fin de tour
//  (VOIE BANQUE depuis le 2026-10-20, brûlage #3 source 2/3 — retour
//  Thibaut « toute production passe par la banque » : les montants
//  vivent dans le registre src/rules/registry.ts, ce module ne fait
//  que LIRE la banque) :
//  (RETRAIT 2026-10-29, refonte « 8 lois » des régimes — REMPLACÉ :
//  la VOIE BANQUE est CLOSE pour les régimes, la source 'regime'
//  quitte le registre (reglesRegimes supprimé) — les lois des
//  régimes sont lues par le MOTEUR là où elles agissent, cf. les
//  arbitrages détaillés ci-dessous.)
//    · régime — Autoritarisme : garnison des habitations +15 par rang
//      d'habitation (champ `garnisonParRang`) ;
//    · régime — Socialisme : +5 Nourriture par tour d'été pour les
//      champs et rizières (champ `nourrEteChampRiziere`) ;
//      (REFONTE « 8 LOIS DES RÉGIMES », 2026-10-29 — REMPLACÉ/
//      HISTORISÉ : les deux lois chiffrées ci-dessus sont RETIRÉES
//      du référentiel (champs supprimés, purgés par migrerRegimes).
//      Chaque régime porte DEUX lois lues par le MOTEUR là où
//      elles agissent : Autoritarisme « Conscription » (prix de
//      levée d'armée −10 Or par rang du pays, engine/armees.ts) et
//      « Frontières closes » (départs ×0,8,
//      engine/migrationBonheur.ts) ; Socialisme « Terre d'accueil »
//      (+1 Or par migrant arrivant, engine/migrationBonheur.ts) et
//      « Redistribution » (bourgeois 1 / noble 2 Nourriture,
//      engine/economie.ts) ; Démocratie « Le pouvoir du peuple »
//      (+5 Bonheur par habitation, engine/bonheur.ts — « Élections »,
//      sacre d'avènement gratuit, reste structurelle : engine/sante.ts) ;
//      Monarchie « Vassaux dévoués » (tribut reçu ×1,05,
//      engine/vassalite.ts — « Droit Divin », +1 serment, reste
//      structurelle : engine/tour.ts).)
//    · culture — Communautarisme / Lunisme / Zélotisme : la capitale
//      génère +N d'une ressource par habitation de cette culture dans
//      le monde (champs `capitalNourrParHabMonde`, etc.).
//      (REFONTE « 12 LOIS », 2026-10-29 — REMPLACÉ/HISTORISÉ : les
//      règles de pays « par habitation de cette culture dans le
//      monde » sont RETIRÉES. Chaque culture porte désormais une loi
//      de VILLE (culture majoritaire de la ville — logements,
//      emplacements de Scientifique, fermiers d'été, routes,
//      garnison : lues par engine/domiciles, metiers, economie,
//      commerce, garnisons) et des lois d'HABITANT (culture PROPRE
//      du personnage, où qu'il vive — nobles et gardes :
//      loisHabitants ci-dessous, canal « Lois des cultures » du
//      récap — RENOMMÉ 2026-10-29 avec la refonte « 8 lois » des
//      régimes, ex « Régimes & cultures »).)
//      (REMPLACÉ 2026-10-29, refonte « 8 lois » des régimes : « Seule
//      la loi du RÉGIME reste dans la banque » ne tient plus — la
//      source 'regime' QUITTE la banque avec reglesRegimes, cf. les
//      arbitrages ci-dessus.)
//  Les autres attributs des cultures (hérédité, fécondité,
//  mariages homosexuels) sont appliqués dans setup / naissances /
//  metiers. Les règles restées textuelles (terres de
//  succession, serments supplémentaires, cases de terrain…) restent
//  descriptives tant que ces systèmes ne sont pas modélisés.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { City, GameState, Player } from './types'
import { detailGainsVille } from './economie'
import { cfgOf, cultureDef, type Cfg } from './gameData'
import { garnisonBatiment, productionTourismeBatiment } from './batiments'
import { effetsCommerceJoueur } from './commerce'
// (RETRAIT 2026-10-29, refonte « 8 lois » des régimes : imports de
//  la banque supprimés avec la source 'regime' — plus aucune loi de
//  régime ne vit dans le registre.)

export { nomRang } from './rangs'
export { rangNiveau } from './rangs'
export { garnisonHabitationVille, malusFerveurMartiale } from './garnisons'
import { garnisonHabitationVille, malusFerveurMartiale } from './garnisons'
import { rangDe } from './statutSocial'
// (RETRAIT 2026-10-24, purge R4 : l'import morte `capitaleDe` (factions)
//  part avec les PORTS du contexte — plus aucun effet conservé ne
//  consomme de service moteur.)

/** Détail de la garnison d'une ville, ligne par ligne (même calibre
 *  que garnisonHabitationVille — l'interface affiche exactement ce
 *  que le moteur calcule). Les lignes à 0 sont omises. */
export interface LigneDetailGarnison {
  label: string
  valeur: number
  /** catégorie affichable : bâtiment /
   *  ministre / métier (Garde) / culture (Ferveur martiale —
   *  refonte 12 lois 2026-10-29) — (RETRAIT 2026-10-29, refonte
   *  « 8 lois » : 'régime' supprimé avec la loi de garnison du
   *  régime) — (RETRAIT 2026-10-24 :
   *  « technologie », supprimée avec le système de progrès, reste
   *  lue dans les vieilles sauvegardes sans être produite) */
  origine: 'bâtiment' | 'technologie' | 'métier' | 'culture'
}

export function detailGarnisonVille(
  p: Player, ville: City, C: Cfg, state?: GameState,
): LigneDetailGarnison[] {
  const out: LigneDetailGarnison[] = []
  const push = (origine: LigneDetailGarnison['origine'], label: string, valeur: number) => {
    if (valeur !== 0) out.push({ origine, label, valeur })
  }
  // 1. Bâtiments de la ville (Poste de garde +40, Caserne +40…)
  for (const b of ville.batiments) push('bâtiment', b, garnisonBatiment(b, C, ville.type))
  // 2. (RETRAIT 2026-10-24 : technologies — lignes de garnison des
  //  techs supprimées avec le système de progrès.)
  // 3. (RETRAIT 2026-10-29, refonte « 8 lois » des régimes : la loi
  //    de garnison du régime — Autoritarisme « Conscription »,
  //    +N par rang d'habitation (garnisonParRang) — est REMPLACÉE
  //    par la réduction du prix de levée d'armée (leveeOrParRangPays,
  //    engine/armees.ts) : plus aucune ligne de garnison du régime.
  // 4. Gardes en poste (vague 3a) : +garnisonParGarde Garnison
  //    STATIQUE par Garde vivant en poste dans la ville.
  if (state) {
    const pop = state.population[p.n] ?? []
    const gardes = pop.filter(
      (c) => c.statut !== 'Décédé' && c.ville === ville.nom && c.metier === C.p.metierGarde,
    )
    if (gardes.length > 0) {
      push('métier', `${gardes.length} ${C.p.metierGarde}(s) en poste (statique)`, gardes.length * C.p.garnisonParGarde)
    }
    // 4bis. (Refonte 12 lois, 2026-10-29, Zélotisme « Corps de
    //    fer ») : +N Garnison STATIQUE par Garde de culture
    //    porteuse de la loi (garnisonParGardeCulture) — SE CUMULE
    //    au défaut garnisonParGarde.
    const fer = gardes.reduce(
      (n, c) => n + (cultureDef(c.culture, C.config)?.garnisonParGardeCulture ?? 0), 0,
    )
    if (fer > 0) push('métier', 'Corps de fer : garde(s) de culture zélote (statique)', fer)
    // 5. (Refonte 12 lois, 2026-10-29, Zélotisme « Ferveur
    //    martiale ») : malus MONDIAL — habitations hors culture
    //    zélote : −N × rang de l'habitation (ligne AVANT clamp ;
    //    garnisonHabitationVille plafonne le total à 0).
    const malus = malusFerveurMartiale(state, ville, C)
    if (malus > 0) push('culture', 'Ferveur martiale : habitations hors culture zélote', -malus)
  }
  return out
}

/** Garnison totale des habitations d'un pays (toutes villes). */
export function garnisonHabitationsPays(p: Player, C: Cfg, state?: GameState): number {
  let g = 0
  for (const v of p.villes) g += garnisonHabitationVille(p, v, C, state)
  return g
}

// (RETRAIT 2026-10-29, refonte « 8 lois » des régimes : effetsRegime
//  est supprimé avec la source 'regime' de la banque — plus aucune
//  production de régime ne passe par le registre (dernière règle
//  vivante : Socialisme « Pour le peuple », REMPLACÉE par « Terre
//  d'accueil » et « Redistribution »). Les lois des régimes vivent
//  désormais dans le moteur : armees (Conscription),
//  migrationBonheur (Frontières closes, Terre d'accueil), economie
//  (Redistribution), bonheur (Pouvoir du peuple), vassalite
//  (Vassaux dévoués) ; Élections (sacre gratuit) et Droit Divin
//  (+1 serment) restent structurelles : sante.ts / tour.ts.
//  Historique git.)

/** Détail d'une loi d'HABITANT (refonte « 12 lois » des cultures,
 *  2026-10-29) — une ligne par loi chiffrée appliquée à la
 *  population VIVANTE du joueur : Lunisme « Foi supérieure » +N
 *  Tourisme par noble, Sethisme « Conseil des Sages » +N Science
 *  par noble, Zélotisme « Corps de fer » +N Or par Garde. La loi
 *  suit la culture PROPRE de chaque habitant, où qu'il vive
 *  (arbitrage « bonus partout où il vit » — contrairement aux lois
 *  de VILLE, qui suivent la culture majoritaire de la cité). */
export interface DetailLoiHabitant {
  /** ressource créditée */
  res: string
  /** loi (texte court, ex. « Foi supérieure ») */
  loi: string
  /** culture porteuse de la loi */
  culture: string
  /** montant par habitant concerné (champ du référentiel) */
  parHab: number
  /** habitants concernés (nobles / gardes de cette culture) */
  nb: number
  /** gain total par tour (parHab × nb) */
  total: number
}

/** Détail des lois d'habitant de TOUTES les cultures présentes dans
 *  la population vivante du joueur (une entrée par loi active — UI
 *  « Pays » et moteur partagent le même calcul via loisHabitants). */
export function detailLoisHabitants(state: GameState, p: Player, C: Cfg): DetailLoiHabitant[] {
  const out: DetailLoiHabitant[] = []
  const vivants = (state.population[p.n] ?? []).filter((c) => c.statut !== 'Décédé')
  for (const cult of C.config.cultures) {
    const membres = vivants.filter((c) => c.culture === cult.nom)
    if (membres.length === 0) continue
    const nobles = membres.filter((c) => rangDe(c, C) === 'noble')
    if (cult.tourismeParNoble && nobles.length > 0) {
      out.push({ res: 'Tourisme', loi: 'Foi supérieure', culture: cult.nom,
        parHab: cult.tourismeParNoble, nb: nobles.length, total: cult.tourismeParNoble * nobles.length })
    }
    if (cult.scienceParNoble && nobles.length > 0) {
      out.push({ res: 'Science', loi: 'Conseil des Sages', culture: cult.nom,
        parHab: cult.scienceParNoble, nb: nobles.length, total: cult.scienceParNoble * nobles.length })
    }
    const gardes = membres.filter((c) => C.p.metierGarde && c.metier === C.p.metierGarde)
    if (cult.orParGarde && gardes.length > 0) {
      out.push({ res: 'Or', loi: 'Corps de fer', culture: cult.nom,
        parHab: cult.orParGarde, nb: gardes.length, total: cult.orParGarde * gardes.length })
    }
  }
  return out
}

/** Effets par tour des lois d'HABITANT des cultures (refonte 12
 *  lois, 2026-10-29) : agrégat par ressource de detailLoisHabitants —
 *  nobles (Lunisme « Foi supérieure », Sethisme « Conseil des
 *  Sages ») et Gardes (Zélotisme « Corps de fer ») de la culture
 *  concernée, où qu'ils vivent. REMPLACE les anciens
 *  effetsCulturePays (« +N par habitation de cette culture dans le
 *  monde », retirés avec la refonte — plus aucune production de
 *  culture ne passe par la banque : reglesCultures supprimé). */
export function loisHabitants(state: GameState, p: Player, C: Cfg): Record<string, number> {
  const out: Record<string, number> = {}
  for (const d of detailLoisHabitants(state, p, C)) {
    out[d.res] = (out[d.res] ?? 0) + d.total
  }
  return out
}

/**
 * RESSYNCHRONISATION DU TOURISME (revue 2026-10-16, retour Thibaut) :
 * le Tourisme est traité comme une ressource normale (Bois, Or…)
 * partout — production affichée dans les récaps de ville et de tour,
 * imposable, imputée dans les tableaux — à UNE exception près : le
 * stock n'est JAMAIS cumulé. À chaque fin de tour (et à chaque
 * changement de culture), le stock est RECALCULÉ pour égaler la
 * production courante : stock = prod. Construire une Chapelle monte
 * la production (et le stock) ; perdre le bâtiment le fait
 * redescendre ; les bonus d'état (ministres, vassalité) sont
 * simplement des lignes de production.
 *
 * `tourismeCourant` calcule la production Tourisme d'un joueur à
 * partir des mêmes canaux que le récap (bâtiments & aménagements
 * statiques + gains d'habitants + lois de culture (RETRAIT 2026-10-24 :
 * les flux Tourisme des techs sont supprimés avec le système de progrès)

 * + ministres de fin de saison + COMMERCE (arbitrage Thibaut 2026-10-19 : le

 * Tourisme copié par une route commerciale est une production comme les

 * autres — il compte dans « stock = production »), et `resynchroniserTourisme` écrase
 * le stock avec cette valeur.
 */
export function tourismeCourant(state: GameState, p: Player, C: Cfg): number {
  // canaux déjà rétablis comme flux : cette fonction somme les
  //  composantes Tourisme de la production par tour du joueur.
  let total = 0
  // 1. base réglée manuellement (p.resources.prod)
  total += p.resources['Tourisme']?.prod ?? 0
  // 2. gains d'habitants (Artistes) — même canal que le Bois
  for (const v of p.villes) {
    const d = detailGainsVille(state, p, v, C)
    total += (d.taxes['Tourisme'] ?? 0) * C.p.gainsCrediteStock
  }
  // 3. lois de culture & régime — composante Tourisme seulement
  //  (refonte 12 lois, 2026-10-29 : lois d'HABITANT — le Tourisme
  //  des nobles lunistes « Foi supérieure » doit compter dans
  //  « stock = production » ; REMPLACÉ l'ancien canal
  //  effetsCulturePays)
  total += loisHabitants(state, p, C)['Tourisme'] ?? 0
  // 4. (RETRAIT 2026-10-24 : technologies — flux Tourisme des techs
  //  supprimé avec le système de progrès.)
  // 5. CONSTRUCTIONS (Chapelle +35, Bahamutt +16…) : production Tourisme
  //  des bâtiments/aménagements, lue sur la règle de BANQUE (voie unique
  //  depuis le 2026-10-19 — même valeur que le canal Bâtiments du récap).
  for (const v of p.villes) {
    for (const b of v.batiments) total += productionTourismeBatiment(b, C, v.type)
    for (const a of v.amenagements ?? []) total += productionTourismeBatiment(a, C, v.type)
  }
  // 7. COMMERCE (arbitrage Thibaut 2026-10-19, clôture du B4 de l'audit) :
  // le Tourisme copié par une route commerciale est une production comme
  // les autres — il doit compter dans « stock = production », sinon le
  // récap l'affiche (canal Commerce) mais le stock l'ignore.
  total += effetsCommerceJoueur(state, p, state.saison, C)['Tourisme'] ?? 0
  // VASSALITÉ — CORRECTIF (retour utilisateur 2026-10-17) : le
  //  « +15 Tourisme × rang du suzerain » est une règle de FACTION
  //  (Basiléens « Temps de paix », choix d'âge) : elle est déjà
  //  comptée au canal 5 ci-dessus, et UNIQUEMENT pour un Basiléens
  //  qui a choisi cette règle. L'ancien point 8 la créditait à TOUT
  //  joueur vassal (quelle que soit sa faction) ET la comptait deux
  //  fois pour un Basiléens vassal — supprimé.
  return total
}

/** Écrase le stock de Tourisme avec la production courante (le
 *  Tourisme n'est jamais cumulé — stock = prod). */
export function resynchroniserTourisme(
  state: GameState, p: Player, contexte: string, C: Cfg = cfgOf(state.config),
): void {
  const rs = p.resources['Tourisme']
  if (!rs) return
  const cible = Math.max(0, tourismeCourant(state, p, C))
  if (rs.stock === cible) return
  rs.stock = cible
  state.log.push({
    turn: state.turn, type: 'Système', joueur: p.n,
    texte: `🌉 Tourisme recalculé (${contexte}) : stock = production courante = ${Math.round(cible * 10) / 10}.`,
  })
}

/** Étape moteur : crédite au stock les lois d'HABITANT des cultures
 *  (canal « Lois des cultures » du récap ressources, étape 3septies
 *  du FinDeTour).
 *  (refonte 12 lois, 2026-10-29 : REMPLACÉE la « règle de pays de
 *  la culture » — +N par habitation de cette culture dans le monde
 *  — par les lois d'HABITANT, portées par la culture PROPRE de
 *  chaque personnage.)
 *  (RETRAIT 2026-10-29, refonte « 8 lois » des régimes : plus
 *  aucune loi de régime via la banque — la signature perd
 *  `saison`, le canal ne porte plus que les lois d'habitants.) */
export function appliquerEffetsRegimesCultures(
  state: GameState, p: Player, C: Cfg = cfgOf(state.config),
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [res, v] of Object.entries(loisHabitants(state, p, C))) {
    out[res] = (out[res] ?? 0) + v
  }
  for (const [res, v] of Object.entries(out)) {
    const rs = p.resources[res]
    if (rs) rs.stock += v
  }
  if (Object.keys(out).length > 0) {
    const parts = Object.entries(out).map(([r, v]) => `${v > 0 ? '+' : ''}${v} ${r}`).join(', ')
    state.log.push({
      turn: state.turn + 1, type: 'Système', joueur: p.n,
      texte: `🏛 ${p.nom} — lois d'habitants des cultures : ${parts}.`,
    })
  }
  return out
}
