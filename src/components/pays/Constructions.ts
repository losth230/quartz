// ══════════════════════════════════════════════════════════════════════
//  Page « Pays » — LOGIQUE DE CONSTRUCTION (extrait du monolithe
//  PlayerView.tsx, un fichier par UI) :
//   · faireConstruire : le mutateur « construire » (bâtiment /
//     aménagement) — garde-fous des règles (faction, capitale, type
//     Ville/Château, limites par famille, rang minimum, prérequis),
//     réductions (Basiléens, Sylvains), coût débité, règle de
//     culture, recalcule du Tourisme, déclenchement du Surintendant ;
//   · vague 3c : les aménagements de tier 2/3 (rangMinHabitation +
//     remplaceAmenagement) REMPLACENT une instance du tier inférieur
//     (amélioration, pas construction en plus) ;
//   · faireBatParFamille : les catégories du sélecteur « + Construire »
//     d'une ville (familles × rangs, alertes rouges des limites —
//     marqueur (y)). (RETRAIT 2026-10-27, audit : plus de Merveilles.)
//  Fonctions pures de fabrique : PlayerView/VilleCarte fournit l'état,
//  ces fabriques referment les closures.
// ══════════════════════════════════════════════════════════════════════

import type { City, GameState, Player } from '../../engine/types'
import { coutBatiment, batimentsConstructionsRefs } from '../../engine/batiments'
import { coutAmenagement } from '../../engine/amenagements'
import { constructionRef, prerequisConstruction, coutConstructionRef, resumeConstruction } from '../../engine/constructions'
import { rangNiveau } from '../../engine/regimes'
import { batimentsCapitale, capitaleDe } from '../../engine/factions'
import { type Cfg } from '../../engine/gameData'
import { villeCotiere } from '../../engine/villes'
import { resynchroniserTourisme } from '../../engine/regimes'
import { fmt } from '../ui'
import type { PickerCategorie } from '../Picker'
import { FAM_BADGES, fmtCout } from './pays-utils'

/** Fabrique le mutateur « construire » d'un joueur. */
export function faireConstruire(o: {
  update: (m: (s: GameState) => void) => void
  joueur: number
  C: Cfg
}) {
  const { update, joueur, C } = o
  const construire = (idx: number, nom: string, type: 'batiment' | 'amenagement', groupe?: string) =>
    update((s) => {
      const t = s.players.find((x) => x.n === joueur)
      const ville = t?.villes[idx]
      if (!t || !ville) return
      // Marqueur (a) : garde-fou — une ancienne sauvegarde peut avoir
      //  une ville sans tableau batiments/aménagements.
      if (!ville.batiments) ville.batiments = []
      if (!ville.amenagements) ville.amenagements = []
      // ── Restrictions des catégories de bâtiments ────────────────────
      // · bâtiment de faction : uniquement ceux du peuple du joueur ;
      // · bâtiment de capitale (groupe « Capitale ») : capitale uniquement.
      // Vague 3c : la ref est résolue pour les DEUX types — les
      //  aménagements de tier 2/3 portent rangMinHabitation et
      //  remplaceAmenagement (les garde-fous « groupe/famille »
      //  ci-dessous restent sans effet sur eux : groupe « Terrain »,
      //  famille vide).
      const ref = constructionRef(nom, C.config)
      const estCapitale = capitaleDe(t)?.nom === ville.nom
      if (ref && ref.groupe === 'Capitale' && !estCapitale) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur: t.n,
          texte: `⚠ ${nom} se construit normalement dans la capitale (${capitaleDe(t)?.nom ?? '—'}) — ici il est hors zone (construction quand même enregistrée).`,
        })
      }

      // Retour Thibaut 2026-10-15 : un bâtiment du groupe Ville ne se
      //  construit que dans une VILLE, du groupe Château que dans un
      //  CHÂTEAU (la vue filtre, ce garde-fou couvre les états
      //  importés/rebasés).
      if (ref && (ref.groupe === 'Ville' || ref.groupe === 'Château') && (ref.famille ?? '') !== 'Merveille') {
        const typeVilleActuel = (ville.type ?? 'Ville').toLowerCase()
        if (ref.groupe.toLowerCase() !== typeVilleActuel) {
          s.log.push({
            turn: s.turn, type: 'Système', joueur: t.n,
            texte: `⚠ ${nom} est un bâtiment de ${ref.groupe} — il se construit normalement dans ce type d'habitation, pas dans ${ville.nom} (${ville.type ?? 'Ville'}). Construction quand même enregistrée.`,
          })
        }
      }

      // ── Limites de construction par FAMILLE (règles du classeur,
      //  retour Thibaut 2026-10-15) :
      //  · Militaire : aucune limite ;
      //  · Économique : 1 par RANG de la ville ;
      //  · Guilde : 1 par ville ;
      //  · Capitale : uniquement dans la capitale (géré ci-dessus) ;
      //  · MERVEILLE : rang d'habitation minimum requis + UNE seule
      //    par ville.
      const fam = ref?.famille ?? ''
      if (fam === 'Economique') {
        // (RETRAIT 2026-10-24 : le bonus « Urbanisme » — +1 slot
        //  économique de la capitale — est supprimé avec le système de
        //  progrès, retour arbitre.)
        //  (RETRAIT 2026-10-19 : bonus Elfes d'Or « Cité d'Or » /
        //  « Palais des Dieux » retirés avec les factions.)
        const maxEco = rangNiveau(ville, C)
        const nbEco = ville.batiments.filter((b) => (constructionRef(b, C.config)?.famille ?? '') === 'Economique').length
        if (nbEco >= maxEco) {
          s.log.push({
            turn: s.turn, type: 'Système', joueur: t.n,
            texte: `⚠ ${nom} : ${ville.nom} dépasse la limite d'un bâtiment Économique par rang (${nbEco}/${maxEco}). Construction quand même enregistrée.`,
          })
        }
      }
      if (fam === 'Guilde') {
        // Retrait ministères (retour Thibaut 2026-10-23) : sans Maître
        //  des guildes, une seule Guilde par ville (même en capitale).
        const maxGuildes = 1
        const nbGui = ville.batiments.filter((b) => (constructionRef(b, C.config)?.famille ?? '') === 'Guilde').length
        if (nbGui >= maxGuildes) {
          s.log.push({
            turn: s.turn, type: 'Système', joueur: t.n,
            texte: `⚠ ${nom} : ${ville.nom} dépasse la limite de ${maxGuildes} Guilde(s)${maxGuildes > 1 ? ' (Maître des guildes)' : ''}. Construction quand même enregistrée.`,
          })
        }
      }
      // Rang d'habitation requis (retour Thibaut 2026-10-15) : un
      //  bâtiment du rang N ne se construit pas dans une habitation de
      //  rang inférieur (vérifie Militaire, Économique, Guilde — plus
      //  de Merveilles depuis l'audit 2026-10-27 ; la vue filtre déjà,
      //  ce garde-fou couvre les états importés/rebasés).
      if (ref && ref.rangMinHabitation && rangNiveau(ville, C) < ref.rangMinHabitation) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur: t.n,
          texte: `⚠ ${nom} exige normalement une habitation de rang ${ref.rangMinHabitation} minimum (${ville.nom} est de rang ${rangNiveau(ville, C)}). Construction quand même enregistrée.`,
        })
      }
      // Ponton (vague 3b, arbitrage Thibaut 2026-10-22) : bâtiment
      //  CÔTIER — proximité Rivière ou Mer requise (garde-fou non
      //  bloquant, même calibre que le rang d'habitation : le moteur
      //  ignore de toute façon ses effets hors proximité).
      if (nom === 'Ponton' && !villeCotiere(ville)) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur: t.n,
          texte: `⚠ Ponton exige normalement une ville côtière (proximité Rivière ou Mer — ${ville.nom} est en Plaine). Construction quand même enregistrée, mais le bâtiment n'y a aucun effet.`,
        })
      }
      // Prérequis de construction (revue 2026-10-16) : « X requis » dans
      //  le coût du référentiel (Caserne ← Poste de garde, Etable ←
      //  Grange…) — le prérequis doit être présent dans la MÊME ville.
      if (type === 'batiment') {
        const pre = prerequisConstruction(ref)
        if (pre && !ville.batiments.includes(pre)) {
          s.log.push({
            turn: s.turn, type: 'Système', joueur: t.n,
            texte: `⚠ ${nom} exige normalement d'abord « ${pre} » dans ${ville.nom} (prérequis). Construction quand même enregistrée.`,
          })
        }
      }
      const cout = type === 'batiment'
        ? coutBatiment(nom, C, groupe)
        : coutAmenagement(t, C.config, nom)
      // (RETRAIT 2026-10-24, retour arbitre : les réductions de coût des
      //  TECHNOLOGIES — Développement durable/économe, Viser le ciel —
      //  et les réductions des merveilles par les techs « Progrès du
      //  Tourisme » (Trésor public, Matériaux de prestige, Exposition
      //  universelle) sont supprimées avec le système de progrès.)
      const cible = type === 'batiment'
        ? ville.batiments
        : (ville.amenagements ?? (ville.amenagements = []))
      // Un même BÂTIMENT ne se construit pas deux fois dans une ville ;
      //  en revanche un AMÉNAGEMENT peut être présent PLUSIEURS FOIS
      //  (plusieurs cases du même terrain, ex. 2 Champs) — chaque
      //  exemplaire produit ses effets (retour Thibaut 2026-10-14).
      // Revue 2026-10-16 : plus JAMAIS de blocage silencieux — le
      //  doublon s'annonce (le joueur peut vouloir dépasser les
      //  limites du référentiel en connaissance de cause).
      if (type === 'batiment' && cible.includes(nom)) {
        s.log.push({
          turn: s.turn, type: 'Système', joueur: t.n,
          texte: `⚠ ${nom} figure déjà à ${ville.nom} (le référentiel prévoit un seul exemplaire par ville). Construction quand même enregistrée.`,
        })
      }
      // (RETRAIT 2026-10-19 : le remplacement des bâtiments de faction —
      //  Église → Grande Cathédrale → Palais du Palatinat — a été retiré
      //  avec le système de faction.)
      // ── Améliorations d'aménagements (vague 3c, arbitrage Thibaut
      //  2026-10-22) : « Baleinier (tier 2) » / « (tier 3) » REMPLACENT
      //  une instance du tier inférieur dans la ville (le tier inférieur
      //  est un prérequis ; un même terrain peut être aménagé PLUSIEURS
      //  FOIS, chaque action n'améliore qu'UN exemplaire). Garde-fou non
      //  bloquant, même calibre que le rang d'habitation : tier inférieur
      //  absent → ⚠ + amélioration quand même enregistrée (poussée).
      let amelioreDe = ''
      if (type === 'amenagement' && ref?.remplaceAmenagement) {
        const base = ref.remplaceAmenagement
        const iBase = cible.indexOf(base)
        if (iBase >= 0) {
          cible[iBase] = nom
          amelioreDe = base
        } else {
          s.log.push({
            turn: s.turn, type: 'Système', joueur: t.n,
            texte: `⚠ ${nom} améliore normalement d'abord un « ${base} » — aucun exemplaire à ${ville.nom}. Amélioration quand même enregistrée.`,
          })
        }
      }
      if (!amelioreDe) cible.push(nom)
      const parts: string[] = []
      for (const [res, v] of Object.entries(cout)) {
        const rs = t.resources[res]
        if (rs) rs.stock -= v
        if (v > 0) parts.push(`${fmt(v)} ${res}`)
      }
      // (RETRAIT 2026-10-29, refonte « 12 lois » : le crédit de
      //  +N Science par bâtiment construit (ancienne loi Déisme,
      //  champ scienceParConstruction) est supprimé — les
      //  « bâtiments de faction » n'existent plus comme donnée
      //  depuis le 2026-10-19 ; la nouvelle loi Déisme « Monuments
      //  pieux » est un EMPLACEMENT de Scientifique par bâtiment,
      //  lu par emplacementsMetierVille. Historique git, règle 9.)
      // Tourisme (retour Thibaut 2026-10-16) : la construction monte
      //  la production Tourisme ; le stock est RECALCULÉ =
      //  production courante (jamais cumulé).
      resynchroniserTourisme(s, t, `${nom} construit(e) à ${ville.nom}`)
      s.log.push({
        turn: s.turn, type: 'Système', joueur: t.n,
        texte: `🏗 ${amelioreDe ? `${amelioreDe} amélioré(e) en ${nom}` : `${nom} construit(e)`} à ${ville.nom} — coût déduit du stock : ${parts.length ? parts.join(' + ') : 'gratuit'}${sci > 0 ? ` — règle de culture : +${fmt(sci)} Science` : ''}.`,
      })
    })
  return construire
}

/** Fabrique les catégories du sélecteur « + Construire » d'une ville
 *  (marqueur (y) : un bouton par famille, une catégorie par rang). */
export function faireBatParFamille(o: { state: GameState; p: Player; C: Cfg }): (ville: City) => PickerCategorie[] {
  const { p, C } = o
  const batRefs = batimentsConstructionsRefs(C)
  // Bâtiments de capitale du référentiel (catégorie « Capitale » des
  //  cadres ville). (RETRAIT 2026-10-19, retour arbitre : les bâtiments
  //  de faction ont été retirés avec le système de faction.)
  const refsBatCapitale = batimentsCapitale(C)
  const nomCapitale = capitaleDe(p)?.nom ?? ''
  /** Catégories de construction d'UNE ville par TYPE de bâtiment
   *  (marqueur (y), retour Thibaut : « peut-être même un bouton par
   *  type de bâtiment ») — arbitrage : les 4 FAMILLES du référentiel
   *  (Militaire, Economique, Guilde, Capitale). Contenu :
   *  bâtiments de ville / château hors faction, bâtiments de FACTION
   *  du peuple du joueur (ceux de capitale uniquement dans la
   *  capitale), bâtiments de CAPITALE pour la capitale uniquement.
   *  Chaque carte montre le coût ET le RÉSUMÉ STRUCTURÉ des effets
   *  (resumeConstruction — dérivé du moteur, toujours à jour ;
   *  retour Thibaut 2026-10-26 : la DESCRIPTION DU CLASSEUR,
   *  périmée, n'est plus affichée — même rendu que le panneau des
   *  aménagements : résumé + prérequis éventuel). */
  /** Bâtiments constructibles pour UNE ville (retour Thibaut
   *  2026-10-15) : seuls les bâtiments du TYPE de la ville (Ville ou
   *  Château) s'affichent, et les MERVEILLES sont filtrées par le rang
   *  d'habitation disponible — avec une catégorie SÉPARÉE par rang
   *  (séparation visuelle nette). */
  const batParFamillePour = (ville: City): PickerCategorie[] => {
    const type = (ville.type ?? 'Ville').toLowerCase()
    const estCapitale = ville.nom === nomCapitale
    const rang = rangNiveau(ville, C)
    // Alerte rouge d'une construction (revue 2026-10-16 : les limites
    //  s'INDIQUENT en rouge dans le picker, elles ne bloquent jamais).
    const alertePour = (b: { nom: string; famille?: string; requis?: string }): string => {
      const warns: string[] = []
      if (ville.batiments.includes(b.nom)) warns.push('Déjà construit dans cette ville (le référentiel prévoit un seul exemplaire).')
      const pre = prerequisConstruction(b)
      if (pre && !ville.batiments.includes(pre)) warns.push(`Prérequis manquant : ${pre}.`)
      const fam = b.famille ?? ''
      if (fam === 'Economique') {
        const nbEco = ville.batiments.filter((x) => (constructionRef(x, C.config)?.famille ?? '') === 'Economique').length
        // (RETRAIT 2026-10-24 : bonus « Urbanisme » supprimé avec le
        //  système de progrès.)
        const maxEco = rang
        if (nbEco >= maxEco) warns.push(`Limite Économique atteinte (${nbEco}/${maxEco} — un par rang).`)
      }
      if (fam === 'Guilde') {
        const nbGui = ville.batiments.filter((x) => (constructionRef(x, C.config)?.famille ?? '') === 'Guilde').length
        const maxGui = 1
        if (nbGui >= maxGui) warns.push(`Limite Guilde atteinte (${nbGui}/${maxGui} par ville).`)
      }
      return warns.join(' ')
    }
    // Les bâtiments de CAPITALE sont ajoutés explicitement plus bas (une
    //  seule fois) — okGroupe les EXCLUT pour éviter le doublon.
    const okGroupe = (b: { groupe: string; famille?: string }) =>
      b.groupe === 'Capitale' ? false
      : b.groupe.toLowerCase() === type
    const eligibles = [
      ...batRefs.filter((b) => okGroupe(b)).map((b) => ({ b, groupe: b.groupe })),
      ...(estCapitale ? refsBatCapitale.map((b) => ({ b, groupe: 'Capitale' })) : []),
    ]
    // Retour Thibaut 2026-10-15 : séparation par RANG D'HABITATION pour
    //  Militaire / Économique / Guilde — une catégorie par famille et
    //  par rang DISPONIBLE (les bâtiments de rang supérieur au rang de
    //  la ville sont masqués). Capitale reste par famille.
    const out: PickerCategorie[] = []
    const famillesRangees: Array<[string, string]> = [
      ['Militaire', 'Militaire'],
      ['Economique', 'Économique'],
      ['Guilde', 'Guilde'],
    ]
    for (const [fam, label] of famillesRangees) {
      // regrouper les bâtiments de la famille par rang
      const parRang = new Map<number, typeof eligibles>()
      for (const item of eligibles) {
        if ((item.b.famille ?? '') !== fam) continue
        const r = item.b.rangMinHabitation ?? 1
        if (r > rang) continue // rang non disponible → masqué
        if (!parRang.has(r)) parRang.set(r, [])
        parRang.get(r)!.push(item)
      }
      for (const [r, items] of [...parRang.entries()].sort((a, z) => a[0] - z[0])) {
        out.push({
          label: `${label} · rang ${r}${r > 1 ? '+' : ''}`,
          options: items.map(({ b, groupe }) => ({
            value: `${groupe}|${b.nom}`,
            metier: b.nom,
            droite: fmtCout(coutConstructionRef(b)),
            alerte: alertePour(b) || undefined,
            description: [
              prerequisConstruction(b) ? `Prérequis : ${prerequisConstruction(b)} dans cette ville.` : '',
              resumeConstruction(b, C.config),
            ].filter(Boolean).join('\n'),
            badge: FAM_BADGES[fam] ?? 'badge-info',
          })),
        })
      }
    }
    // Capitale : une catégorie par famille (sans rang)
    for (const [fam, label] of [['Capitale', 'Capitale']] as const) {
      const options = eligibles
        .filter(({ b }) => (b.famille ?? '') === fam)
        .map(({ b, groupe }) => ({
          value: `${groupe}|${b.nom}`,
          metier: b.nom,
          droite: fmtCout(coutConstructionRef(b)),
          alerte: alertePour(b) || undefined,
          description: [
            prerequisConstruction(b) ? `Prérequis : ${prerequisConstruction(b)} dans cette ville.` : '',
            resumeConstruction(b, C.config),
          ].filter(Boolean).join('\n'),
          badge: FAM_BADGES[fam] ?? 'badge-info',
        }))
      if (options.length > 0) out.push({ label, options })
    }
    return out
  }
  return batParFamillePour
}
