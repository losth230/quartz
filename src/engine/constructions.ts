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
//  `taudisApportes` / `domicilesApportes` (logements — canal logements de
//  la banque). Les anciens textes cout/production/description sont VIDÉS.)
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import { DEFAULT_CONFIG, type GameConfig, type ConstructionRef, type EffetConstruction } from '../config/defaultConfig'
import { cfgOf } from './gameData'
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

// ── Analyseurs de texte (coût uniquement) ───────────────────────────────

const NOMBRE = String.raw`\d+(?:[.,]\d+)?`
/** Ressources telles qu'elles apparaissent dans les textes de coût du classeur. */
const RESSOURCES_COUT = 'Or|Bois|Pierres?|Fer|Charbon|Bétails?|Soie|Nourritures?|Science|Tourisme'

/** Normalise un nom de ressource lu dans un texte (« Pierres » → « Pierre »). */
export function normaliserRessource(res: string): string {
  if (/^pierres?$/i.test(res)) return 'Pierre'
  if (/^bétails?$/i.test(res)) return 'Bétail'
  if (/^nourritures?$/i.test(res)) return 'Nourriture'
  return res
}

/** Analyse un texte de coût (« 25 Or + 4 Fer ») en quantités par ressource.
 *  (Depuis le retour Thibaut 2026-10-27, les COÛTS de constructions sont
 *  des DONNÉES (`couts`) — cet analyseur ne sert plus qu'aux textes de
 *  coût des TYPES D'HABITATION, cf. habitations.ts.) */
export function parseCoutTexte(texte: string): Record<string, number> {
  const out: Record<string, number> = {}
  if (!texte) return out
  const re = new RegExp(String.raw`(${NOMBRE})\s*(?:de\s+)?(${RESSOURCES_COUT})\b`, 'gi')
  for (const m of texte.matchAll(re)) {
    const res = normaliserRessource(m[2])
    out[res] = (out[res] ?? 0) + parseFloat(m[1].replace(',', '.'))
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
 *  {ressource, valeur}, agrégées ici par ressource). */
export function coutConstructionRef(ref: ConstructionRef): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of ref.couts ?? []) {
    if (!c || !Number.isFinite(Number(c.valeur))) continue
    const res = normaliserRessource(c.ressource)
    out[res] = (out[res] ?? 0) + Number(c.valeur)
  }
  return out
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
 *  banque — taudisApportes et domicilesApportes sont traduits en
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

/** Résumé affichable des effets d'une construction (badges page Pays et
 *  wiki Référentiels) : « +2 Or / tour · été : +10 Nourriture ·
 *  Garnison +40 ». Le Tourisme apparaît comme flux (« +16 Tourisme /
 *  tour ») conformément à la sémantique stock = production. */
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
  // Fiche bâtiments rang 1 (retour Thibaut 2026-10-26) : l'Herboristerie
  //  n'accueille plus de Guérisseur — ses effets ±5% maladie sont
  //  structurés (malContraction / bonusGuerison) et s'affichent dans le
  //  résumé pour que le picker ne retombe pas sur la description du
  //  classeur (périmée).
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
