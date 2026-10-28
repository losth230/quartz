// ═══════════════════════════════════════════════════════════════════════════
//  REGISTRE DE RÈGLES — référentiel → banque d'effets (refactor 2026-10-18)
//
//  LA couche à éditer pour changer une règle : chaque entrée du
//  référentiel (bâtiment, aménagement…) est traduite en une
//  règle de banque (id stable + effets structurés). Les textes du
//  référentiel restent de l'AFFICHAGE ; les effets deviennent des
//  DONNÉES interprétées par la banque.
//
//  Migration progressive (strangle pattern) : les CONSTRUCTIONS
//  (bâtiments + aménagements, table constructions — format `effets`
//  marqueur (s) mappé 1:1), puis les MINISTÈRES (source 1/3,
//  2026-10-19) et les RÉGIMES & CULTURES (source 2/3, 2026-10-20 —
//  retour Thibaut « toute production passe par la banque »), puis les
//  FLUX DE PROGRÈS (source 3/3, 2026-10-20 — les technologies dont
//  la production par tour vivait codée en dur dans
//  engine/progresAuto.ts) sont traduits. Les autres sources
//  (factions…) migrent ensuite une par une ; le moteur continue
//  d'utiliser ses fonctions historiques pour tout ce qui n'est pas
//  encore migré.
// ═══════════════════════════════════════════════════════════════════════════

import type { Effet, RegleBanque, SourceRegle } from './types'
import type { Cfg, EffetConstruction } from '../config/defaultConfig'

/** Slug d'identifiant stable depuis un nom affiché (les accents et
 *  espaces deviennent des tirets) : 'Poste de garde' → 'poste-de-garde'.
 *  L'id reste stable même si le nom affiché change (l'id est dérivé une
 *  fois et stocké dans le registre, jamais recalculé depuis l'UI).
 *  CLÉ = (nom, groupe) : 15 constructions existent en DOUBLE (version
 *  Ville ET Château du même bâtiment, effets identiques — ex. Poste de
 *  garde) ; le groupe distingue leurs règles. */
function slug(nom: string): string {
  return nom
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Traduit les effets STRUCTURÉS d'une construction (marqueur (s),
 *  format { ressource, quantite, ete? }) en effets de la banque.
 *  Règles de traduction (identiques au moteur historique — retour
 *  Thibaut 2026-10-16 : le Tourisme est un FLUX NORMAL) :
 *   · 'Garnison' → garnisonVille (valeur d'état, instantanée) ;
 *   · le reste (Tourisme compris) → fluxVille (production par tour),
 *     canal été si `ete`. */
export function effetsConstructionVersBanque(effets: EffetConstruction[]): Effet[] {
  const out: Effet[] = []
  for (const e of effets) {
    if (e.ressource === 'Garnison') {
      out.push({ type: 'garnisonVille', valeur: e.quantite })
    } else if (e.ete) {
      out.push({ type: 'fluxVille', ressource: e.ressource, valeur: e.quantite, ete: true })
    } else {
      out.push({ type: 'fluxVille', ressource: e.ressource, valeur: e.quantite })
    }
  }
  return out
}

/** Construit les règles de banque de TOUTES les constructions du
 *  référentiel qui portent des effets structurés (bâtiments +
 *  aménagements). Les entrées sans `effets` (texte seul) ne sont PAS
 *  migrées : le moteur historique continue de les analyser. */
export function reglesConstructions(C: Cfg): RegleBanque[] {
  const refs = C.config.constructions ?? []
  const out: RegleBanque[] = []
  for (const ref of refs) {
    // (Retour Thibaut 2026-10-27 : « des valeurs qui passent par la
    //  banque » — les EMPLACEMENTS de métiers et les LOGEMENTS
    //  (taudisApportes / domicilesApportes) sont traduits en EFFETS
    //  de banque comme les flux : une construction porte une règle
    //  dès qu'elle a un effet QUELCONQUE, et le moteur lit tout par
    //  le même canal.)
    const effets: Effet[] = [
      ...effetsConstructionVersBanque(ref.effets ?? []),
      ...(ref.emplacements ?? []).map((e): Effet => ({
        type: 'placesMetier', metier: e.metier, valeur: Number(e.places) || 0,
      })),
      ...(ref.taudisApportes ? [{ type: 'logements', logement: 'Taudis', valeur: ref.taudisApportes } as Effet] : []),
      ...(ref.domicilesApportes ?? []).map((e): Effet => ({
        type: 'logements', logement: e.domicile, valeur: e.nombre,
      })),
      // (Retour Thibaut 2026-10-28 : « les armées, et surtout les
      //  réductions de levée, rejoignent la banque » — le champ
      //  reductionLeveeArmee de la fiche de construction est
      //  traduit en effet de banque, lu par reductionLeveeBatiments
      //  pour le prix d'une levée dans la ville.)
      ...(ref.reductionLeveeArmee
        ? [{ type: 'reductionLeveeArmee', valeur: ref.reductionLeveeArmee } as Effet]
        : []),
    ]
    if (effets.length === 0) continue
    const source: SourceRegle =
      ref.categorie === 'Aménagement' ? 'amenagement' : 'batiment'
    out.push({
      id: `${source}.${slug(ref.nom)}@${slug(ref.groupe)}`,
      source,
      nom: ref.nom,
      // Le groupe est porté par la règle (accès moteur par nom+groupe).
      groupe: ref.groupe,
      effets,
    })
  }
  return out
}

/** Registre complet : toutes les règles migrées. Appelé par le moteur
 *  aux sites d'application (une fois par tour, cacheable). */
export function registreComplet(C: Cfg): RegleBanque[] {
  return [...reglesConstructions(C), ...reglesRegimes(C), ...reglesCultures(C)]
  // (RETRAIT 2026-10-24, retour arbitre : la source 'tech' — règles de
  //  banque des technologies de progrès — est supprimée avec le
  //  système de progrès, plus aucun producteur ni consommateur.)
  // Les sources suivantes migrent une par une (factions…).
}

// ── Régimes & cultures (sources 'regime' / 'culture' — brûlage #3 source 2/3) ──

/** Règles de banque des LOIS DE PRODUCTION des régimes politiques
 *  (retour Thibaut « toute production passe par la banque », source
 *  2/3 du brûlage #3, 2026-10-20) : générées depuis le référentiel,
 *  montants = DONNÉES. Aujourd'hui seule la loi nourrEteChampRiziere
 *  est un FLUX (Socialisme : +N Nourriture d'été par Champ/Rizière)
 *  — l'été est une CONDITION de la règle, plus un if du moteur. La
 *  garnison de l'Autoritarisme (champ RÉFÉRENTIEL garnisonParRang —
 *  pas le type d'effet de banque, retiré le 2026-10-24 purge R4)
 *  reste une VALEUR D'ÉTAT (garnisonHabitationVille), pas une
 *  production : hors banque. */
export function reglesRegimes(C: Cfg): RegleBanque[] {
  const out: RegleBanque[] = []
  for (const regime of C.regimes) {
    const n = regime.nourrEteChampRiziere ?? 0
    if (!n) continue
    out.push({
      id: 'regime.' + slug(regime.nom),
      source: 'regime',
      nom: regime.nom,
      conditions: { regime: regime.nom, saison: 'Été' },
      effets: [{ type: 'fluxParAmenagement', ressource: 'Nourriture', valeur: n, noms: ['Champ', 'Rizière'] }],
    })
  }
  return out
}

/** Règles de banque des RÈGLES DE PAYS des cultures (source 2/3 du
 *  brûlage #3, 2026-10-20) : +N d'une ressource PAR VILLE de cette
 *  culture dans le MONDE (tous joueurs confondus — ex. Lunisme :
 *  +4 Tourisme par ville lunisme). Les cultures sans loi chiffrée
 *  (ex. Déisme : scienceParConstruction est un instantané de
 *  construction) ne génèrent PAS de règle. */
export function reglesCultures(C: Cfg): RegleBanque[] {
  const LOIS: Array<[string, 'capitalNourrParHabMonde' | 'capitalTourismeParHabMonde' | 'capitalOrParHabMonde']> = [
    ['Nourriture', 'capitalNourrParHabMonde'],
    ['Tourisme', 'capitalTourismeParHabMonde'],
    ['Or', 'capitalOrParHabMonde'],
  ]
  const out: RegleBanque[] = []
  for (const cult of C.config.cultures) {
    const effets: Effet[] = []
    for (const [res, champ] of LOIS) {
      const v = cult[champ] ?? 0
      if (v) effets.push({ type: 'fluxParVilleCultureMonde', ressource: res, valeur: v })
    }
    if (effets.length === 0) continue
    out.push({
      id: 'culture.' + slug(cult.nom),
      source: 'culture',
      nom: cult.nom,
      conditions: { culture: cult.nom },
      effets,
    })
  }
  return out
}

/** Cache du registre par référence de config (les règles ne dépendent
 *  que du référentiel — recalculées seulement si la config change). */
let cacheRegles: { config: object; regles: RegleBanque[]; parCle: Map<string, RegleBanque> } | null = null

/** Clé d'accès d'une règle de construction : nom + groupe (les
 *  constructions doublées Ville/Château portent le même nom). */
function cleConstruction(nom: string, groupe?: string): string {
  return `${nom}|${groupe ?? ''}`
}

/** Règle de banque d'une construction PAR (nom, groupe) — accès moteur.
 *  Retourne undefined si la construction n'a pas d'effets structurés
 *  (repli texte du moteur historique). (Restauré le 2026-10-24 : ce
 *  bloc indépendant des techs avait été emporté par la purge de la
 *  source 'tech'.) */
export function reglePourConstruction(ref: { nom: string; groupe?: string }, C: Cfg): RegleBanque | undefined {
  if (!cacheRegles || cacheRegles.config !== C) {
    const regles = reglesConstructions(C)
    cacheRegles = {
      config: C,
      regles,
      parCle: new Map(regles.map((r) => [cleConstruction(r.nom, r.groupe), r])),
    }
  }
  return cacheRegles.parCle.get(cleConstruction(ref.nom, ref.groupe))
}

// ── (RETRAIT 2026-10-24, retour arbitre) ──────────────────────────────
//  Source 'tech' — technologies de progrès : SUPPRIMÉE avec le
//  système (clesTechsParNom, table PROGRES_FLUX et reglesProgres).
//  Historique : les flux par tour des techs débloquées vivaient ici
//  (brûlage #3 source 3/3, 2026-10-20) et étaient interprétés par la
//  banque (fluxSiCapitale, fluxParVille, fluxParVilleProximite,
//  fluxParRangHabitation, fluxParAmenagement, fluxParBatiment,
//  fluxParGarnisonHabitation, fluxParMetier). L'ancien contenu reste
//  dans l'historique git (règle 9).
