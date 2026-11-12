// ══════════════════════════════════════════════════════════════════════
//  CHASSE & PÊCHE — ORCHESTRATION DU TOUR (module tour.ts)
//  Portage TypeScript des macros VBA :
//    · FinDeTour (ressources, saisons)
//      (événements de saison et cartes dynastie RETIRÉS le 2026-10-24,
//      retour arbitre Thibaut — historique dans git et le journal)
//    · PersonnagesPourJoueur (moteur de population)
//    · CalculerGainsPopulation (gains par ville : metiers, taxes, conso)
//    · RecruitForArmies (armées)
//  Un tour = 2 ans de jeu.
//
//  ARCHITECTURE (découpage SOLID — une responsabilité par module) :
//    shared.ts      outils transversaux (ids, noms, noblesse, récap)
//    saisons.ts     saisons (Été/Hiver alternés) — les événements et
//                  cartes dynastie qui y vivaient ont été retirés le
//                  2026-10-24 (retour arbitre Thibaut)
//    economie.ts    gains de population par ville, taxes (toutes ressources)
//    batiments.ts   bâtiments — production exacte du référentiel
//    amenagements.ts aménagements de terrain — production exacte du référentiel
//    autres.ts      lignes « Autres » des villes (production additionnelle)
//    vassalite.ts   tribut des vassaux vers leur suzerain
//    pelerinage.ts dîme du pontife — bonus des dogmes (2026-11-01)
//    population.ts  orchestration démographique du tour, migration
//    metiers.ts      professeurs, mariages, éducation, metiers
//    sante.ts       maladie, décès, succession du Dirigeant
//    naissances.ts  fécondité, conceptions, accouchement, traits
//    culture.ts    conversions culturelles, culture des villes
//    armees.ts     recrutement et puissance des armées
//    journal.ts    snapshot des stocks, récapitulatif
//  Ce module contient la SÉQUENCE FinDeTour (runTurn) et la
//  condition de sacre (sermentsPossedes). Vague 2 SOLID
//  (2026-10-24) : la façade engine.ts (30 blocs de ré-exports
//  importés par toute l'UI) est SUPPRIMÉE — les consommateurs
//  importent désormais les modules sources directement ; le
//  bundle Edge Function a son point d'entrée dédié (edge.ts).
// ══════════════════════════════════════════════════════════════════════

import type { ApportsTour, GameState, Player } from './types'
import { makeRng } from './rng'
import { cfgOf } from './gameData'
import { saisonForTurn } from './saisons'
import { calculerGainsPopulation } from './economie'
import { designerGouverneurs, purgerMetiersSurnombre, attribuerPlacesLibres } from './metiers'
import { appliquerEffetsBatiments } from './batiments'
import { appliquerEffetsAmenagements, effetsNourrEteAmenagementsVille } from './amenagements'
import { appliquerEffetsAutres, effetsNourrEteAutresVille } from './autres'
import { appliquerEffetsRegimesCultures, resynchroniserTourisme } from './regimes'
import { nbVassaux } from './factions'
import { appliquerEffetsCommerce, nettoyerRoutesCommerce } from './commerce'
import { appliquerTaxesCitesLibres, citesSuzerainesDe } from './citesLibres'
import { transfererTributVassal } from './vassalite'
import { preleverPelerinage } from './pelerinage'
import { appliquerBonusProximite } from './villes'
import { populationTourA, populationTourB } from './population'
import { migrationBonheur } from './migrationBonheur'
import { recruitForArmies } from './armees'
import { snapshotRessources } from './journal'

// ══════════════════════════════════════════════════════════════════════
//  RANGS DE PAYS — condition de sacre (serments possédés)
// ══════════════════════════════════════════════════════════════════════

/** Serments possédés par un joueur : ses vassaux + les cités libres dont
 *  il est le suzerain (une cité libre compte comme un serment, cf. règle
 *  des cités libres). C'est la condition de montée de rang (colonne
 *  « serments » de la table paysRangs, échelle féodale unique). */
export function sermentsPossedes(state: GameState, p: Player): number {
  // Monarchie (retour Thibaut 2026-10-15 : loi non prise en compte) :
  //  « Droit Divin : vous possédez 1 serment supplémentaire » —
  //  appliqué automatiquement à la condition de sacre.
  const bonusMonarchie = p.regime === 'Monarchie' ? 1 : 0
  return nbVassaux(state, p) + citesSuzerainesDe(state, p).length + bonusMonarchie
}

// ══════════════════════════════════════════════════════════════════════
//  ORDRE DES EFFETS DE FIN DE TOUR — REGISTRE PUBLIC (R3)
//  Source du wiki « Ordre du tour » (onglet Référentiels —
//  components/reference/OngletOrdreTour.tsx) : la table affichée
//  est LUE ICI, pas recopiée. CONTRAT : ce registre suit runTurn
//  PAS À PAS — toute évolution de la séquence (étape ajoutée,
//  retirée, déplacée) DOIT se refléter ici, et le contenu est
//  VERROUILLÉ par engine/tour.test.ts (numéros + noms exacts).
//  Les étapes RETIRÉES (événements de saison et cartes dynastie le
//  2026-10-24, consommation d'habitations le 2026-10-22, bonus de
//  faction le 2026-10-19, progrès le 2026-10-24) n'apparaissent
//  plus : l'historique vit dans git, le journal technique et les
//  docblocks.
// ══════════════════════════════════════════════════════════════════════

export interface EtapeTour {
  /** numéro historique de l'étape (1, 2bis, 3, 3bis… — les trous sont
   *  des étapes retirées, l'historique vit dans git) */
  numero: string
  /** nom court de l'étape */
  nom: string
  /** ce qui se calcule, pour qui, dans quel ordre */
  description: string
}

export const ETAPES_TOUR: EtapeTour[] = [
  {
    numero: '1',
    nom: 'Changement de saison',
    description: 'La saison bascule (Été/Hiver, une saison toutes les saisonLongueur tours). À sec : plus de tirage d\u2019événement de saison ni de carte dynastie (retirés le 2026-10-24).',
  },
  {
    numero: '2bis',
    nom: 'Gouverneurs automatiques',
    description: 'Une ville sans gouverneur qui abrite un noble prend pour gouverneur son noble le plus âgé (hors Dirigeant/Héritier) — AVANT le calcul des gains : son bonus +10 % d\u2019impôts s\u2019applique dès ce tour.',
  },
  {
    numero: '2ter',
    nom: 'Réaffectation des métiers plafonnés',
    description: 'Les caps de métiers par ville (Chasseurs…, paramétrables) sont réappliqués — AVANT le calcul des gains : les caps comptent pour les impôts du même tour.',
  },
  {
    numero: '3',
    nom: 'Gains d\u2019habitants + production de base',
    description: 'Gains de population de chaque joueur (métiers × taxes − consommation), puis production de base du pays : chaque stock += sa production. La nourriture générale n\u2019est JAMAIS doublée : la production d\u2019été est un canal séparé (3quinquies-bis).',
  },
  {
    numero: '3bis',
    nom: 'Vassalité — tribut',
    description: 'Chaque vassal reverse vassalPrelevement (défaut 50 %) des gains d\u2019Or de ses habitants à son suzerain. Prélèvement réel, sur les gains AVANT crédit au stock ; les effets du régime et du dogme Mère Patrie du suzerain s\u2019appliquent au montant reçu.',
  },
  {
    numero: '3ter',
    nom: 'Crédit des gains au stock',
    description: 'Les gains d\u2019habitants (nets du tribut) sont crédités au stock × gainsCrediteStock.',
  },
  {
    numero: '3quater',
    nom: 'Bâtiments',
    description: 'Effets automatiques des bâtiments des villes (production exacte du référentiel), crédités au stock. HORS vassalité : le tribut ne prélève que sur les revenus des habitants.',
  },
  {
    numero: '3quinquies',
    nom: 'Aménagements (hors été)',
    description: 'Production des aménagements de terrain (table constructions), HORS production d\u2019été (Champ, Rizière — étape suivante).',
  },
  {
    numero: '3quinquies-bis',
    nom: 'Nourr — été',
    description: 'En ÉTÉ seulement : production de nourriture d\u2019été (aménagements Champ/Rizière + lignes « Autres » « Nourr - été »), créditée au stock de Nourriture EN PLUS de la nourriture générale.',
  },
  {
    numero: '3sexies',
    nom: 'Autres',
    description: 'Lignes « Autres » des villes : ressource × nombre × bonus, créditées au stock.',
  },
  {
    numero: '3septies',
    nom: 'Lois des cultures + Tourisme',
    description: 'Lois d\u2019HABITANT des cultures (canal « Lois des cultures »), puis 1re re-synchronisation du Tourisme : le stock de Tourisme égale toujours sa production (jamais cumulé).',
  },
  {
    numero: '3decies',
    nom: 'Cités libres',
    description: 'Chaque cité libre ayant un suzerain lui verse ses taxes (production nette de ses habitants, Chasseurs ×1,1 Nourriture).',
  },
  {
    numero: '3quaterdecies',
    nom: 'Proximité des villes',
    description: 'Bonus de Nourriture automatique de chaque ville au bord d\u2019une rivière (+12) ou de la mer (+7) — montants paramétrables, canal « Proximité ».',
  },
  {
    numero: '3terdecies',
    nom: 'Commerce + Tourisme',
    description: 'Les routes commerciales copient la production de l\u2019aménagement visé dans la ville d\u2019origine (saisonnier ; plus d\u2019Or passif) ; les routes mortes sont fermées. Puis 2e re-synchronisation du Tourisme (les apports directs ont pu toucher le stock).',
  },
  {
    numero: '3quindecies',
    nom: 'Pèlerinage — dîme du pontife',
    description: 'Chaque culture ayant AU MOINS un dogme prélève pelerinageTaux (défaut 5 %) de la production (Or, Nourriture, Science) de TOUTES ses habitations, tous joueurs confondus — y compris celles du pontife — pour la verser au pontife (le plus de Tourisme de la culture, évalué maintenant). Prélèvement réel sur les stocks, un log par versement, canal « Pèlerinage ». Pas de culte établi (aucun dogme) : pas de dîme.',
  },
  {
    numero: '4',
    nom: 'Moteur de population',
    description: 'Pour chaque joueur : vieillissement, métiers, mariages, santé, fécondité et naissances, conversions culturelles, culture des villes (modules population, metiers, sante, naissances, culture).',
  },
  {
    numero: '4bis',
    nom: 'Migration par bonheur',
    description: 'Chaque habitant vivant peut quitter sa ville (proba croissante à mesure que le bonheur baisse) pour une ville du monde tirée au hasard pondéré (culture, même joueur, emploi, logement, bonheur). APRÈS les moteurs de population : un migrant n\u2019est pas retraité deux fois.',
  },
  {
    numero: '5',
    nom: 'Armées — recrutement',
    description: 'Chaque armée recrute ses soldats (métiers Soldat/Commandant, âges et puissances des lignes de métier du référentiel).',
  },
  {
    numero: '6',
    nom: 'Snapshot + apports du tour',
    description: 'Un snapshot des stocks par joueur entre à l\u2019historique, avec le détail des apports canal par canal (le récap « dernier tour » des pages Pays).',
  },
  {
    numero: '7',
    nom: 'Tour suivant',
    description: 'Le compteur de tour avance, le journal est plafonné à maxLog entrées, l\u2019état du rng est sauvegardé.',
  },
]

// ══════════════════════════════════════════════════════════════════════
//  FIN DE TOUR — point d'entrée principal
// ══════════════════════════════════════════════════════════════════════

export function runTurn(state: GameState): GameState {
  const C = cfgOf(state.config)
  const rng = makeRng(state.rngState)
  const turnBefore = state.turn
  const newSaison = saisonForTurn(turnBefore + 1, C)

  // (RÉORDONNANCEMENT DES TOURS, arbitrage Thibaut 2026-11-11 —
  //  « ce que je vois en clôturant est ce qui produira » :
  //  · les REVENUS se calculent sur la population telle que le
  //    joueur la voit (gouverneurs et réattributions ne jouent
  //    plus avant) ;
  //  · tout ce qui fait bouger la population (démographie,
  //    migrations, nominations, réattributions) se joue APRÈS le
  //    crédit des revenus — un poste libéré par un décès est repris
  //    DANS LE MÊME TOUR, le nouveau titulaire produit au suivant ;
  //  · la SAISON bascule en FIN de tour : les revenus se calculent
  //    dans la saison affichée pendant que le joueur joue (les
  //    effets de saison — Fermiers, Nourr-été — prennent effet au
  //    tour suivant la bascule).
  //  La saison et les nominations vivaient en tête de tour
  //  (étapes 1/2bis/2ter) ; elles vivent désormais en fin (étapes
  //  10bis/10ter/10quater ci-dessous).)

  // 0. Purge des métiers retirés + surnombre — AVANT le calcul des
  //    gains : un métier en surnombre ne produit JAMAIS (arbitre
  //    2026-11-11 : « les métiers en surnombre ne produisent plus »).
  //    La prise des postes libérés (places libres) se joue en fin
  //    de tour, après la démographie.
  purgerMetiersSurnombre(state, C)

  // 3. Gains de population par joueur (CalculerGainsPopulation), puis
  //    production de base : stock += prod (lignes 18-28 des J{n}).
  //    ATTENTION : la nourriture générale n'est JAMAIS doublée — la
  //    nourriture d'été est une production SÉPARÉE (ligne « Nourr - été »
  //    du classeur), créditée à l'étape 3quinquies-bis, en été seulement.
  //    Les apports sont tracés pour le récap ressources (history.apports).
  const gainsParJoueur: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    gainsParJoueur[p.n] = calculerGainsPopulation(state, p)
  }
  const prodParJoueur: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    const prodTot: Record<string, number> = {}
    for (const r of C.ressources) {
      const rs = p.resources[r]
      if (!rs) continue
      rs.stock += rs.prod
      prodTot[r] = rs.prod
    }
    prodParJoueur[p.n] = prodTot
  }

  // 3bis. Vassalité : chaque vassal reverse une part des revenus de ses
  // habitants à son suzerain (formule dans engine/vassalite.ts).
  // Copie des gains avant tribut : elle isole la part « vassalité » du
  // récap ressources (population = gains propres, vassalité = tribut net).
  const gainsAvantTribut: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    gainsAvantTribut[p.n] = { ...(gainsParJoueur[p.n] ?? {}) }
  }
  transfererTributVassal(state, gainsParJoueur, C)

  // 3ter. Gains de population crédités au stock × gainsCrediteStock (paramètre)
  const coefGains = C.p.gainsCrediteStock
  for (const p of state.players) {
    const gains = gainsParJoueur[p.n] ?? {}
    for (const [res, v] of Object.entries(gains)) {
      const rs = p.resources[res]
      if (rs) rs.stock += v * coefGains
    }
  }

  // 3quater. Bâtiments : effets automatiques par tour (engine/batiments.ts).
  // Appliqués SÉPARÉMENT des gains d'habitants : la vassalité ne prélève
  // que sur les revenus des habitants, pas sur les effets des bâtiments.
  const batimentsParJoueur: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    batimentsParJoueur[p.n] = appliquerEffetsBatiments(p, C)
  }

  // 3quinquies. Aménagements de terrain : production exacte du référentiel
  // (table `constructions`), HORS production d'été (Champ et Rizière ne
  // produisent qu'en été — étape suivante).
  const amenagementsParJoueur: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    amenagementsParJoueur[p.n] = appliquerEffetsAmenagements(p, C.config)
  }

  // 3quinquies-bis. Nourr - été : production de NOURRITURE D'ÉTÉ —
  // aménagements d'été (Champ, Rizière) + lignes « Autres » de ressource
  // « Nourr - été ». Créditée au stock de Nourriture UNIQUEMENT quand la
  // saison est Été (macro FinDeTour du classeur : prodSummer = ligne
  // « Nourr - été », S'AJOUTE à la nourriture générale — jamais un
  // doublage de celle-ci).
  const nourrEteParJoueur: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    const out: Record<string, number> = {}
    if (state.saison === 'Été') {
      for (const ville of p.villes) {
        for (const [res, v] of Object.entries(effetsNourrEteAmenagementsVille(ville, C.config))) {
          out[res] = (out[res] ?? 0) + v
        }
        for (const [res, v] of Object.entries(effetsNourrEteAutresVille(ville))) {
          out[res] = (out[res] ?? 0) + v
        }
      }
      for (const [res, v] of Object.entries(out)) {
        if (!v) continue
        const rs = p.resources[res]
        if (rs) rs.stock += v
      }
    }
    nourrEteParJoueur[p.n] = out
  }

  // 3sexies. Autres : lignes « Autres » des villes (bloc « Autres » du
  // classeur J{n}) — ressource × nombre × bonus, créditées au stock.
  const autresParJoueur: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    autresParJoueur[p.n] = appliquerEffetsAutres(p)
  }

  // 3septies. Lois des cultures : lois d'HABITANT des cultures
  //  (engine/regimes.ts) — paramétrables dans les référentiels,
  //  appliquées automatiquement chaque fin de tour.
  //  (RETRAIT 2026-10-29, refonte « 8 lois » des régimes : les lois
  //  des RÉGIMES ne passent plus par ce canal — plus aucune loi de
  //  régime via la banque ; le canal est RENOMMÉ « Lois des
  //  cultures » et ne porte plus que loisHabitants.)
  const loisCulturesParJoueur: Record<number, Record<string, number>> = {}
  for (const p of state.players) {
    loisCulturesParJoueur[p.n] = appliquerEffetsRegimesCultures(state, p, C)
    // Tourisme (retour Thibaut 2026-10-16) : le stock est RECALCULÉ
    //  pour égaler la production courante — jamais cumulé (stock = prod).
    resynchroniserTourisme(state, p, 'fin de tour')
  }

  // 3octies. (RETRAIT 2026-10-22, nettoyage du code mort : la
  //  consommation par tour des habitations — supprimée par
  //  l'arbitrage vague 3b — n'est plus débitée ni affichée.)

  // 3nonies. (RETRAIT 2026-10-19, retour arbitre : les bonus de faction
  //  ont été retirés — système à refaire.) Tourisme : le stock n'est
  //  JAMAIS cumulé (stock = production) — re-synchronisation de fin
  //  de tour pour chaque joueur.
  for (const p of state.players) {
    resynchroniserTourisme(state, p, 'fin de tour')
  }

  // 3decies. Cités libres : chaque cité libre possédant un suzerain lui
  // verse ses taxes (production nette de ses habitants, Chasseurs ×1,1
  // Nourriture — engine/citesLibres.ts), canal « Cités libres ».
  const citesLibresParJoueur: Record<number, Record<string, number>> =
    appliquerTaxesCitesLibres(state, C)

  // 3quaterdecies. Proximité des villes (marqueur (y), retour Thibaut
  //  2026-10-15) : bonus automatique de Nourriture par tour de chaque
  //  ville « au bord d'une rivière » (+12) ou « au bord de la mer »
  //  (+7) — montants paramétrables (engine/villes.ts), canal
  //  « Proximité » du récap ressources.
  const proximiteParJoueur: Record<number, Record<string, number>> =
    appliquerBonusProximite(state, C)

  // 3terdecies. Commerce (marqueur (t)) : les routes commerciales
  //  dissociées (sous-vague 3b, 2026-10-24, arbitrage Thibaut) ne
  //  rapportent plus d'Or passif — le seul effet du propriétaire est
  //  la copie de l'aménagement choisi dans la ville ciblée, marqueur
  //  (u) (engine/commerce.ts — comme les bâtiments : pas de taxes,
  //  pas de coefficient gainsCrediteStock, pas de tribut) ; les
  //  emplacements de population de l'aménagement copié (à l'origine
  //  seule) sont calculés à la demande par le moteur des métiers
  //  (engine/metiers.ts, ctx routes ; plus d'emplacement de Marchand
  //  — le métier a été retiré du jeu le 2026-10-24, arbitrage
  //  Thibaut). Les routes mortes (origine perdue, cible disparue,
  //  copie disparue) et les vieilles routes du modèle « marchand
  //  titulaire » (marchandId, retiré du modèle le 2026-10-24) sont
  //  fermées ici avec un log dédié.
  nettoyerRoutesCommerce(state)
  const commerceParJoueur: Record<number, Record<string, number>> =
    appliquerEffetsCommerce(state, C)

  // 3undecies-bis. (RETRAIT 2026-10-24, retour arbitre : suppression
  //  du système de progrès — arbres, déblocages et flux par tour des
  //  technologies. Le canal « Progrès » n'est plus calculé ni écrit ;
  //  la clé orpheline `progres` des vieux historiques est ignorée.)
  //  Tourisme : l'invariant « stock = production » doit être
  //  réévalué APRÈS les apports de commerce (3undecies), qui
  //  créditent le stock directement — ce point d'appel, historiquement
  //  porté par le bloc PROGRES, est conservé.
  for (const p of state.players) {
    resynchroniserTourisme(state, p, 'fin de tour')
  }

  // 3quindecies. Pèlerinage (bonus du pontife, arbitrage Thibaut
  //  2026-11-01) : les habitations de chaque culture ayant AU MOINS un
  //  dogme versent pelerinageTaux (défaut 5 %) de leur production
  //  (Or, Nourriture, Science) au PONTIFE de la culture (le plus de
  //  Tourisme — évalué au moment du prélèvement, le flux suit le
  //  siège). PRÉLÈVEMENT RÉEL : les parts sortent des stocks des
  //  payeurs et entrent au stock du pontife, y compris les
  //  habitations du pontife lui-même (net nul chez lui, mais
  //  comptées). APRÈS le calcul des productions (la dîme porte sur la
  //  production réellement créditée ce tour-ci, lecture
  //  productionVille — les stocks peuvent passer négatifs), AVANT le
  //  moteur de population. Un log par versement + canal
  //  « Pèlerinage » du récap. C'est une DÎME, pas une taxe : aucun
  //  multiplicateur de taxes ne s'y applique (cf. docblock
  //  engine/pelerinage.ts).
  const pelerinageDimes = preleverPelerinage(state, C)
  const pelerinageParJoueur: Record<number, Record<string, number>> = {}
  for (const dime of pelerinageDimes) {
    for (const v of dime.versements) {
      const solde = pelerinageParJoueur[v.payeur.n] ?? (pelerinageParJoueur[v.payeur.n] = {})
      for (const [res, montant] of Object.entries(v.montants)) {
        solde[res] = (solde[res] ?? 0) - montant
      }
      const soldePontife = pelerinageParJoueur[dime.pontife.n] ?? (pelerinageParJoueur[dime.pontife.n] = {})
      for (const [res, montant] of Object.entries(v.montants)) {
        soldePontife[res] = (soldePontife[res] ?? 0) + montant
      }
    }
  }

  // 4. Moteur de population — PHASE A (les MORTS d'abord) :
  //    mariages, vieillissement, métier automatique à l'âge adulte,
  //    maladie et décès (arbitrage 2026-11-11 : « les morts et
  //    départs avant les naissances »).
  const recapsPopulation: Record<number, ReturnType<typeof populationTourA>> = {}
  for (const p of state.players) {
    recapsPopulation[p.n] = populationTourA(state, p, rng)
  }

  // 4bis. Migration par bonheur (arbitrage Thibaut 2026-10-28) : plus
  //  le bonheur d'une ville est bas, plus ses habitants ont de chances
  //  de la quitter (linéaire : 0 % à 100 de bonheur, 10 % à 0) pour
  //  une ville du monde tirée au hasard PONDÉRÉ (culture du migrant,
  //  bonheur de la candidate — engine/migrationBonheur.ts). Les
  //  DÉPARTS se jouent entre les morts et les naissances (arbitrage
  //  2026-11-11) : un migrant n'est pas retraité (vieillissement,
  //  maladie) au même tour chez son nouveau porteur — sa phase A
  //  est déjà faite chez son ancien porteur, sa phase B (naissances,
  //  domiciles, prestige) se joue chez le nouveau.
  migrationBonheur(state, rng)

  // 4ter. Moteur de population — PHASE B (les NAISSANCES) :
  //    grossesses/naissances, influence culturelle, domiciles,
  //    statut social.
  for (const p of state.players) {
    populationTourB(state, p, rng, recapsPopulation[p.n])
  }

  // 10ter. Gouverneurs automatiques (marqueur (w)) — APRÈS la
  //    démographie (arbitrage 2026-11-11 : « si un gouverneur meurt,
  //    il est remplacé dans le même tour ») : une ville sans
  //    gouverneur qui abrite un noble prend pour gouverneur son
  //    noble le plus âgé (hors Dirigeant/Héritier). Le bonus +10 %
  //    d'impôts s'applique au tour SUIVANT (les gains de CE tour
  //    sont déjà calculés).
  designerGouverneurs(state, C)

  // 10quater. Réattributions de métiers — places libres (APRÈS la
  //    démographie, arbitrage 2026-11-11) : les postes libérés par
  //    les décès/départs du tour sont repris DANS LE MÊME TOUR ;
  //    les nouveaux titulaires produisent au tour suivant.
  attribuerPlacesLibres(state, C)

  // 5. Armées (RecruitForArmies)
  for (const p of state.players) {
    recruitForArmies(state, p, rng)
  }

  // 6. Snapshot (SnapshotRessources → _Historique) + apports du tour
  //    (production, bâtiments, habitants, vassalité → récap ressources).
  const apportsParJoueur: Record<number, ApportsTour> = {}
  for (const p of state.players) {
    const population: Record<string, number> = {}
    for (const [res, v] of Object.entries(gainsAvantTribut[p.n] ?? {})) {
      if (v !== 0) population[res] = v * coefGains
    }
    const vassalite: Record<string, number> = {}
    for (const [res, v] of Object.entries(gainsParJoueur[p.n] ?? {})) {
      const ecart = v - (gainsAvantTribut[p.n]?.[res] ?? 0)
      if (ecart !== 0) vassalite[res] = ecart * coefGains
    }
    apportsParJoueur[p.n] = {
      production: prodParJoueur[p.n] ?? {},
      batiments: batimentsParJoueur[p.n] ?? {},
      amenagements: amenagementsParJoueur[p.n] ?? {},
      nourrEte: nourrEteParJoueur[p.n] ?? {},
      autres: autresParJoueur[p.n] ?? {},
      loisCultures: loisCulturesParJoueur[p.n] ?? {},
      citesLibres: citesLibresParJoueur[p.n] ?? {},
      commerce: commerceParJoueur[p.n] ?? {},
      proximite: proximiteParJoueur[p.n] ?? {},
      population,
      vassalite,
      // (Pèlerinage, arbitrage 2026-11-01 — étape 3quindecies :
      //  solde net de la dîme du pontife, négatif = payée, positif
      //  = reçue. Le pontife payeur porte les DEUX dans son solde.)
      pelerinage: pelerinageParJoueur[p.n] ?? {},
    }
  }
  snapshotRessources(state, turnBefore + 1, apportsParJoueur)

  // 10bis. Changement de saison — FIN DE TOUR (arbitrage Thibaut
  //    2026-11-11) : les revenus de CE tour se sont calculés dans la
  //    saison affichée pendant le tour ; la saison du tour à venir
  //    bascule ici (le snapshot ci-dessus porte la saison jouée).
  //    RETIRÉ le 2026-10-24 (retour arbitre) : plus de tirage
  //    d'événement de saison ni de carte dynastie — la saison
  //    change à sec.
  if (newSaison !== state.saison) state.saison = newSaison

  // 7. Tour suivant
  state.turn = turnBefore + 1
  if (state.log.length > C.p.maxLog) {
    state.log = state.log.slice(state.log.length - C.p.maxLog)
  }
  state.rngState = rng.state()
  return state
}
