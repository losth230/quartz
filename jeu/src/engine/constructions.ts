// ══════════════════════════════════════════════════════════════════════
//  CONSTRUCTIONS — RÉFÉRENTIEL CANONIQUE (données structurées)
//  Source unique : table « constructions » du référentiel (referentiels.json),
//  saisie depuis la feuille « Ville » du classeur 7.19 :
//    · Bâtiments de ville, de château et de capitale,
//    · Aménagements de terrain.
//  (Retour Thibaut 2026-10-27 : le coût n'est plus un TEXTE à analyser —
//  chaque entrée porte ses DONNÉES : `couts` (paires {ressource, valeur}),
//  `requis` (bâtiment prérequis, même ville), `effets` (flux/garnison via
//  la banque), `emplacements` (métiers — canal placesMetier de la banque),
//  `domicilesApportes` (logements, Taudis compris — canal logements de
//  la banque). Les anciens textes cout/production/description sont VIDÉS.)
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import { DEFAULT_CONFIG, type GameConfig, type ConstructionRef, type EffetConstruction } from '../config/defaultConfig'
import { cfgOf } from './gameData'
import type { Cfg } from './gameData'
import { reglePourConstruction } from '../rules/registry'
import type { ContexteEffet } from '../rules/types'
import type { Effet } from '../rules/types'
import { appliquerRegles } from '../rules/effects/banque'

export type { ConstructionRef, EffetConstruction }

// ── Types ───────────────────────────────────────────────────────────────

/** Ligne de la table « constructions » du référentiel (type complet ci-dessus). */

/** Toutes les constructions du référentiel (config de la partie ou défaut). */
export function constructionsRefs(cfg?: GameConfig): ConstructionRef[] {
  const liste = (cfg ?? DEFAULT_CONFIG).constructions
  return Array.isArray(liste) && liste.length > 0 ? liste : DEFAULT_CONFIG.constructions
}

/** Une construction précise (par nom, éventuellement restreinte à un groupe).
 *  M4 (audit 2026-10-19, repli ASSUMÉ et documenté) : si le `groupe`
 *  demandé n'existe pas dans les variantes de ce nom (constructions
 *  doublées Ville/Château), on replie silencieusement sur la première
 *  variante (historiquement « Ville »). Pragmatisme assumé : ce lookup
 *  est appelé sur les chemins chauds d'affichage — pas de log (le
 *  moteur est pur, zéro console) ; le repli est celui-ci, connu. */
export function constructionRef(nom: string, cfg?: GameConfig, groupe?: string): ConstructionRef | undefined {
  const liste = constructionsRefs(cfg).filter((c) => c.nom === nom)
  return (groupe ? liste.find((c) => c.groupe === groupe) : undefined) ?? liste[0]
}

/** Les aménagements de terrain du référentiel. */
export function amenagementsRefs(cfg?: GameConfig): ConstructionRef[] {
  return constructionsRefs(cfg).filter((c) => c.categorie === 'Aménagement')
}

/** Les bâtiments (ville / château / capitale) du référentiel. */
export function batimentsRefs(cfg?: GameConfig): ConstructionRef[] {
  return constructionsRefs(cfg).filter((c) => c.categorie === 'Bâtiment')
}

// ── Coûts structurés ({ressource, valeur}) ─────────────────────────────

/** Normalise un nom de ressource (« Pierres » → « Pierre »). */
function normaliserRessource(res: string): string {
  if (/^pierres?$/i.test(res)) return 'Pierre'
  if (/^bétails?$/i.test(res)) return 'Bétail'
  if (/^nourritures?$/i.test(res)) return 'Nourriture'
  return res
}

/** Agrège des paires {ressource, valeur} (champ `couts` — retour
 *  Thibaut 2026-10-27 « le coût ne doit plus être textuel ») en
 *  quantités par ressource. Format UNIQUE des coûts de constructions
 *  ET de types d'habitation : l'ancien analyseur de TEXTE
 *  (parseCoutTexte) est RETIRÉ — plus aucun coût n'est analysé, tout
 *  est lu des DONNÉES. */
export function agregerCouts(couts: Array<{ ressource: string; valeur: number }> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of couts ?? []) {
    if (!c || !Number.isFinite(Number(c.valeur))) continue
    const res = normaliserRessource(c.ressource)
    out[res] = (out[res] ?? 0) + Number(c.valeur)
  }
  return out
}

// ── Effets (marqueur (s)) : la BANQUE D'EFFETS est la voie UNIQUE ──────
// Retour Thibaut 2026-10-16, renforcé le 2026-10-19 (« tout ce qui a
// rapport à une production passe par la banque ») : chaque construction
// porte ses effets en tableau structuré `effets` (paramétrable dans
// l'onglet 🎛 Paramètres), traduit en RÈGLE par le registre
// (rules/registry.ts) et interprété UNE fois par la banque
// (rules/effects/banque.ts). Sémantique :
//   · le Tourisme est un FLUX NORMAL (comme le Bois) — affiché dans les
//     récaps de ville et de tour ; seule différence : son stock est
//     RECALCULÉ en fin de tour pour égaler la production courante
//     (stock = production), jamais cumulé (resynchroniserTourisme) ;
//   · la Garnison est une valeur D'ÉTAT (défense tant que la construction
//     tient) — canal dédié, jamais un flux ;
//   · les effets marqués « été » (Champ, Rizière) produisent uniquement
//     pendant l'Été (canal « Nourr - été »).
// L'ancien repli d'analyse du TEXTE de production (parseProductionTexte)
// a été RETIRÉ le 2026-10-19 : une construction sans règle de banque ne
// produit RIEN — il n'existe plus de seconde interprétation des effets.

/** Config convergée du DÉFAUT pour le registre des règles de
 *  constructions (vague 2) : une seule instance, cachée par référence
 *  dans reglePourConstruction. */
const C_LECTURE = cfgOf(undefined)

/** Contexte LECTURE SEULE pour évaluer les effets d'une construction
 *  hors partie (récapitulatifs, coûts, UI) — DÉMÉNAGÉ de
 *  rules/registry (vague 2, arbitrage Thibaut 2026-10-23 « tout dans
 *  la vague 2 »). (RETRAIT 2026-10-24, purge R4 : les PORTS moteur
 *  injectés ici (C, capitaleDe, rangNiveau, garnisonVille) sont
 *  supprimés — plus AUCUN type d'effet conservé ne consomme de
 *  service moteur, le contexte se réduit à ses champs factices.
 *  L'ancien contenu reste dans l'historique git, règle 9.) Les
 *  effets des constructions sont inconditionnels : aucune condition
 *  (saison…) ne s'applique à cette source — le contexte factice ne
 *  fausse donc rien. Les types sont relâchés (never) car la
 *  production d'une construction ne dépend d'aucun champ du
 *  contexte. */
export function contexteLectureSeule(): ContexteEffet {
  return {
    state: {} as never,
    joueur: {} as never,
    saison: '',
  } as ContexteEffet
}

/** Contribution de la banque pour une construction (règle identifiée par
 *  (nom, groupe)). Le paramètre `cfg` optionnel (retour Thibaut
 *  2026-10-27) sélectionne la config dont les règles sont lues — les
 *  éditions de Paramètres s'appliquent ; par défaut : la config du
 *  référentiel. Retourne undefined si la construction n'a pas de
 *  règle — production nulle, par convention ci-dessus. */
function contributionBanque(ref: ConstructionRef, cfg?: GameConfig): ReturnType<typeof appliquerRegles> | undefined {
  const regle = reglePourConstruction(ref, cfg ? cfgOf(cfg) : C_LECTURE)
  if (!regle) return undefined
  return appliquerRegles([regle], contexteLectureSeule())
}

// ── Accès moteur : coûts et effets ─────────────────────────────────────

/** Coût de construction d'une entrée du référentiel — DONNÉES
 *  STRUCTURÉES (retour Thibaut 2026-10-27 : le coût n'est plus un
 *  texte à analyser, le champ `couts` porte des paires
 *  {ressource, valeur}, agrégées par agregerCouts — partage avec le
 *  coût des types d'habitation depuis le retour du 2026-10-27
 *  « idem habitations »). */
export function coutConstructionRef(ref: ConstructionRef): Record<string, number> {
  return agregerCouts(ref.couts)
}

/** Coût de construction d'un bâtiment du référentiel (par nom, groupe optionnel). */
export function coutBatimentRef(nom: string, cfg?: GameConfig, groupe?: string): Record<string, number> {
  const ref = constructionRef(nom, cfg, groupe)
  return ref ? coutConstructionRef(ref) : {}
}

/** Effets par tour FLUX d'une construction : production régulière de la
 *  règle de banque (le Tourisme est un flux NORMAL ; la Garnison, valeur
 *  d'état, passe par son canal dédié ; l'Été par le canal été). Sans
 *  règle : production nulle. Le paramètre `cfg` optionnel (retour
 *  Thibaut 2026-10-27) lit les règles de CETTE config — les éditions
 *  de Paramètres s'appliquent. */
export function effetsConstructionRef(ref: ConstructionRef, cfg?: GameConfig): Record<string, number> {
  const c = contributionBanque(ref, cfg)
  return c ? c.flux : {}
}

/** Production d'ÉTÉ d'une construction (canal « Nourr - été » : Champ,
 *  Rizière) — effets marqués « été » dans la banque. */
export function effetsEteConstructionRef(ref: ConstructionRef, cfg?: GameConfig): Record<string, number> {
  const c = contributionBanque(ref, cfg)
  return c ? c.fluxEte : {}
}

/** ROUTES commerciales apportées par une construction au cap conseillé
 *  du joueur (retour Thibaut 2026-10-27 : l'apport vivait codé en dur
 *  par NOM dans maxRoutesJoueur — il devient une DONNÉE du référentiel
 *  (champ routesApportees, ex. Echoppe : 1), lisible par le moteur et
 *  par le résumé affiché. Champ optionnel : 0. */
export function routesApporteesConstructionRef(ref: ConstructionRef | undefined): number {
  return ref?.routesApportees ?? 0
}

/** ÉMISSAIRES accordés par une construction (valeur d'état « tant
 *  que construit », arbitrage Thibaut 2026-11-03 : Délégation +1,
 *  Chancellerie +2, Ambassade +4 — cf. emissairesConstructionsJoueur
 *  pour le comptage par joueur). Patron routesApporteesConstructionRef. */
export function emissairesApportesConstructionRef(ref: ConstructionRef | undefined): number {
  return ref?.emissairesApportes ?? 0
}

// ── Lecteurs des modificateurs de PAYS tier 3 (arbitrage Thibaut
//  2026-11-03) — patrons emissairesApportesConstructionRef ; le
//  comptage par joueur vit dans modificateursPaysJoueur (batiments.ts).

/** Production des Bourgeois du pays ×N (Guilde des bourgeois, tier 3). */
export function multProductionBourgeoisRef(ref: ConstructionRef | undefined): number {
  return ref?.multProductionBourgeois ?? 1
}

/** Bonus PAR HABITANT d'un métier (Guilde des marins, tier 3 :
 *  +0,5 Or par Commerçant). */
export function bonusMetierParHabitantRef(ref: ConstructionRef | undefined): Array<{ metier: string; ressource: string; valeur: number }> {
  return ref?.bonusMetierParHabitant ?? []
}

/** Revenus du commerce ×N (Guilde des marchands, tier 3). */
export function multRevenusCommerceRef(ref: ConstructionRef | undefined): number {
  return ref?.multRevenusCommerce ?? 1
}

/** Tribut vassal +v en part additive (Guilde des diplomates, tier 3). */
export function tributVassalPlusRef(ref: ConstructionRef | undefined): number {
  return ref?.tributVassalPlus ?? 0
}

/** Conversion locale vers la culture de la ville +v (Guilde des
 *  évangélistes, tier 3 — pattern Nationalisme conversionLocale). */
export function conversionLocalePlusRef(ref: ConstructionRef | undefined): number {
  return ref?.conversionLocalePlus ?? 0
}

/** Part de taxe Science du Professeur +v (Guilde des savants, tier 3). */
export function scienceProfesseurPlusRef(ref: ConstructionRef | undefined): number {
  return ref?.scienceProfesseurPlus ?? 0
}

/** Valeur d'ÉTAT d'une construction : la Garnison (défense tant que la
 *  construction tient). Le Tourisme n'y figure PLUS : flux normal depuis
 *  le retour Thibaut 2026-10-16 (voir la sémantique en tête de section). */
export function instantanesConstructionRef(ref: ConstructionRef, cfg?: GameConfig): Record<string, number> {
  const c = contributionBanque(ref, cfg)
  if (!c || !c.garnison) return {}
  return { Garnison: c.garnison }
}

/** Une construction ne produit-t-elle qu'en Été ? (Champ, Rizière — lu
 *  sur la RÈGLE de banque : tout flux qu'elle porte est marqué été.) */
export function eteSeulementRef(ref: ConstructionRef, cfg?: GameConfig): boolean {
  const regle = reglePourConstruction(ref, cfg ? cfgOf(cfg) : C_LECTURE)
  const flux = (regle?.effets ?? []).filter(
    (e): e is Extract<Effet, { type: 'fluxVille' }> => e.type === 'fluxVille',
  )
  return flux.length > 0 && flux.every((e) => e.ete)
}

/** Bâtiment (ou aménagement) prérequis d'une construction — CHAMP DÉDIÉ
 *  `requis` (retour Thibaut 2026-10-27 : le prérequis vivait dans le
 *  TEXTE du coût, il devient une DONNÉE du référentiel ; ex. Caserne →
 *  « Poste de garde »). Retourne null si aucun. Le prérequis doit être
 *  présent dans la MÊME ville (règle du classeur). */
export function prerequisConstruction(ref: Pick<ConstructionRef, 'requis'> | undefined): string | null {
  return ref?.requis?.trim() || null
}

/** Emplacements de métiers accordés par une construction — VIA LA
 *  BANQUE (retour Thibaut 2026-10-27 : l'attribution de métiers passe
 *  par la banque — les `emplacements` du référentiel, format
 *  `[{ metier, places }]`, sont traduits en effets `placesMetier` par
 *  le registre ; cette lecture est le canal moteur unique, comme les
 *  flux). */
export function emplacementsConstructionRef(ref: ConstructionRef, cfg?: GameConfig): Array<{ metier: string; places: number }> {
  const c = contributionBanque(ref, cfg)
  return c ? Object.entries(c.placesMetier).map(([metier, places]) => ({ metier, places })) : []
}

/** LOGEMENTS apportés au parc d'une ville par une construction — VIA LA
 *  BANQUE (retour Thibaut 2026-10-27 : les logements passent par la
 *  banque — domicilesApportes (Taudis compris, normalisation 2026-11-02)
 *  sont traduits en
 *  effets `logements` ; les Taudis et les autres types de domicile
 *  passent par le MÊME canal). Clé = type de logement, valeur =
 *  nombre apporté. */
export function logementsConstructionRef(ref: ConstructionRef, cfg?: GameConfig): Record<string, number> {
  const c = contributionBanque(ref, cfg)
  return c ? { ...c.logements } : {}
}

/** Garnison statique accordée par une construction (valeur d'état, pas un
 *  flux) — via la banque d'effets ; sans règle : 0. */
export function garnisonConstructionRef(ref: ConstructionRef, cfg?: GameConfig): number {
  const c = contributionBanque(ref, cfg)
  return c ? c.garnison : 0
}

/** Réduction de levée d'armée portée par une construction (arbitrage
 *  Thibaut 2026-10-28 : « les armées, et surtout les réductions de
 *  levée, rejoignent la banque ») — canal reductionLeveeArmee de sa
 *  règle de banque ; ex. Terrain d'entrainement : 10, Ecole
 *  militaire : 25. Sans règle : aucune réduction. */
export function reductionLeveeConstructionRef(ref: ConstructionRef, cfg?: GameConfig): number {
  const c = contributionBanque(ref, cfg)
  return c ? c.reductionLeveeArmee : 0
}

/** Réduction TOTALE de levée d'armée des BÂTIMENTS D'UNE VILLE — la
 *  levée se passe DANS une habitation (retour Thibaut 2026-10-15 :
 *  le joueur choisit la ville, ses bâtiments s'appliquent) ; les
 *  valeurs vivent désormais sur les fiches du référentiel (champ
 *  reductionLeveeArmee, arbitrage Thibaut 2026-10-28) et se lisent
 *  par (nom, groupe) pour chaque bâtiment présent. Lecture sur la
 *  config C passée — les éditions de Paramètres s'appliquent. */
export function reductionLeveeBatiments(ville: { batiments?: string[]; amenagements?: string[] } | undefined, C: Cfg): number {
  let total = 0
  for (const b of ville?.batiments ?? []) {
    const ref = constructionRef(b, C.config)
    if (ref) total += reductionLeveeConstructionRef(ref, C.config)
  }
  // MERVEILLES NATURELLES (fiches 2026-10-25) : les aménagements
  //  portent aussi des réductions de levée (Antre de Magmadon :
  //  −15 Or dans cette habitation) — même canal que les bâtiments.
  for (const a of ville?.amenagements ?? []) {
    const ref = constructionRef(a, C.config)
    if (ref) total += reductionLeveeConstructionRef(ref, C.config)
  }
  return total
}

/** Résumé affichable des effets d'une construction (badges page Pays et
 *  wiki Référentiels) : « +2 Or / tour · été : +10 Nourriture ·
 *  Garnison +40 ». Le Tourisme apparaît comme flux (« +16 Tourisme /
 *  tour ») conformément à la sémantique stock = production.
 *  (Convention 2026-11-04, retour Thibaut : les effets NON pris en
 *  compte par le moteur — effets de plateau, arbitrés à la main —
 *  s'affichent en ITALIQUE : le texte d'effetPlateau part enveloppé du
 *  marqueur *…*, rendu <i> par TexteAvecItalique dans l'UI.) */
export function resumeConstruction(ref: ConstructionRef | undefined, cfg?: GameConfig): string {
  if (!ref) return ''
  const parts: string[] = []
  const flux = Object.entries(effetsConstructionRef(ref, cfg))
  if (flux.length > 0) {
    parts.push(flux.map(([r, v]) => `${v > 0 ? '+' : ''}${v} ${r}`).join(', ') + ' / tour')
  }
  const ete = Object.entries(effetsEteConstructionRef(ref, cfg))
  if (ete.length > 0) {
    parts.push('été : ' + ete.map(([r, v]) => `${v > 0 ? '+' : ''}${v} ${r}`).join(', '))
  }
  const inst = instantanesConstructionRef(ref, cfg)
  if (inst.Garnison) parts.push(`Garnison +${inst.Garnison}`)
  const emp = emplacementsConstructionRef(ref, cfg)
  if (emp.length > 0) {
    parts.push(emp.map((e) => `${e.places} ${e.metier.toLowerCase()}`).join(', '))
  }
  // (Retour Thibaut 2026-10-28 : « les armées, et surtout les
  //  réductions de levée, rejoignent la banque » — la réduction de
  //  levée d'armée se lit sur le CANAL reductionLeveeArmee et doit
  //  être visible dans le picker « + Construire », les badges de la
  //  carte et le wiki Référentiels.)
  const reducLevee = reductionLeveeConstructionRef(ref, cfg)
  if (reducLevee > 0) parts.push(`levée d'armée −${reducLevee} Or`)
  // Champs santé structurés (2026-10-26) : malContraction /
  //  bonusGuerison s'affichent dans le résumé pour que le picker ne
  //  retombe pas sur la description du classeur (périmée).
  //  (Arbitrage Thibaut 2026-11-13 : l'Herboristerie ne porte PLUS
  //  ces champs — elle accueille 2 Guérisseurs, affichés par la
  //  voie générique des emplacements ci-dessus. Aucune entrée du
  //  référentiel ne porte un flat aujourd'hui ; le rendu reste pour
  //  une future donnée.)
  if (ref.malContraction) parts.push(`+${Math.round(ref.malContraction * 100)}% chances de maladie`)
  if (ref.bonusGuerison) parts.push(`+${Math.round(ref.bonusGuerison * 100)}% guérison`)
  // Retour Thibaut 2026-10-27 : les TAUDIS et les AUTRES domiciles
  //  apportés se lisent sur le CANAL « logements » de la banque —
  //  même rendu qu'avant (« +5 Taudis », « +20 Maisons de notable »,
  //  pluriel sur le premier mot).
  const log = logementsConstructionRef(ref, cfg)
  const taudis = log['Taudis'] ?? 0
  if (taudis > 0) parts.push(`+${taudis} Taudis`)
  // Retour Thibaut 2026-10-27 : les ROUTES commerciales apportées
  //  s'affichent pareil — l'effet vit dans le référentiel
  //  (routesApportees), il doit être visible dans le picker « +
  //  Construire », les badges de la carte et le wiki Référentiels.
  const routes = routesApporteesConstructionRef(ref)
  if (routes > 0) parts.push(`+${routes} route${routes > 1 ? 's' : ''} commerciale${routes > 1 ? 's' : ''}`)
  // Retour Thibaut 2026-11-03 (Délégation / Chancellerie / Ambassade) :
  //  les ÉMISSAIRES accordés « tant que le bâtiment est construit »
  //  s'affichent pareil — l'effet vit dans le référentiel
  //  (emissairesApportes), il doit être visible dans le picker « +
  //  Construire », les badges de la carte et le wiki Référentiels.
  const emissaires = emissairesApportesConstructionRef(ref)
  if (emissaires > 0) parts.push(`+${emissaires} émissaire${emissaires > 1 ? 's' : ''}`)
  // (Vague tier 3, arbitrage Thibaut 2026-11-03 : les modificateurs de
  //  PAYS des guildes tier 3 s'affichent pareil — l'effet vit dans le
  //  référentiel (champs dédiés), il doit être visible dans le picker
  //  « + Construire », les badges de la carte et le wiki Référentiels.)
  const multBourgeois = multProductionBourgeoisRef(ref)
  if (multBourgeois > 1) parts.push(`production des Bourgeois ×${multBourgeois}`)
  for (const bm of bonusMetierParHabitantRef(ref)) {
    parts.push(`${bm.metier.toLowerCase()} +${bm.valeur} ${bm.ressource} / habitant`)
  }
  const multCommerce = multRevenusCommerceRef(ref)
  if (multCommerce > 1) parts.push(`revenus du commerce ×${multCommerce}`)
  const tribut = tributVassalPlusRef(ref)
  if (tribut > 0) parts.push(`+${Math.round(tribut * 100)} % tribut vassal`)
  const convLocale = conversionLocalePlusRef(ref)
  if (convLocale > 0) parts.push(`+${Math.round(convLocale * 100)} % conversion vers la culture de la ville`)
  const sciProf = scienceProfesseurPlusRef(ref)
  if (sciProf > 0) parts.push(`Science des Professeurs +${Math.round(sciProf * 100)} %`)
  // Effets de PLATEAU (Responsable des voies, Guilde des marchands) :
  //  texte du référentiel affiché tel quel — la portée se règle à la
  //  main. (Convention 2026-11-04, retour Thibaut : ce qui n'est PAS
  //  pris en compte par le moteur s'affiche en ITALIQUE — le texte
  //  part enveloppé du marqueur *…*, rendu <i> par TexteAvecItalique.)
  if (ref.effetPlateau) parts.push(`*${ref.effetPlateau}*`)
  for (const [logement, nombre] of Object.entries(log)) {
    if (logement === 'Taudis' || nombre <= 0) continue
    const nom = nombre > 1 ? logement.replace(/^(\S+)/, (m) => `${m}s`) : logement
    parts.push(`+${nombre} ${nom}`)
  }
  return parts.join(' · ')
}

/** Réduction de coût des aménagements accordée par le Camp de
 *  bâtisseurs — champ `reduction` du référentiel, DONNÉES
 *  STRUCTURÉES (retour Thibaut 2026-10-27 : plus d'analyse de
 *  description textuelle). Le Camp n'est pas au référentiel
 *  (mécanisme dormant) : repli {Or: 5, Bois: 1} tant que le champ
 *  est absent. */
export function reductionCampDeBatisseurs(cfg?: GameConfig): Record<string, number> {
  const ref = constructionRef('Camp de bâtisseurs', cfg)
  const paires = ref?.reduction ?? []
  if (paires.length === 0) return { Or: 5, Bois: 1 }
  const out: Record<string, number> = {}
  for (const r of paires) out[r.ressource] = (out[r.ressource] ?? 0) + r.valeur
  return out
}

/** (2026-11-02, paramètre `cotier`, arbitrage Thibaut) : une
 *  construction côtière exige une ville à proximité (Rivière/Mer —
 *  villeCotiere) pour que ses emplacements et effets moteurs
 *  s'appliquent. Donnée du RÉFÉRENTIEL — plus de nom « Ponton »
 *  codé en dur dans le moteur. */
export function estCotiereRef(ref: ConstructionRef | undefined): boolean {
  return ref?.cotier === true
}
