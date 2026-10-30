// ══════════════════════════════════════════════════════════════════════
//  MOTEUR DE POPULATION (PersonnagesPourJoueur) + MIGRATION
//  Orchestration démographique du tour : appelle les modules metiers, santé, naissances, culture et journal.
//  Portage des macros VBA du classeur Chasse & Pêche 7.19.
//  Découpage SOLID du moteur : un module = une responsabilité de domaine.
// ══════════════════════════════════════════════════════════════════════

import type { Character, GameState, Player } from './types'
import type { Rng } from './rng'
import { cfgOf } from './gameData'
import { emptyRecap } from './shared'
import { maybeAssignProfesseurs, gestionMariages, assignAdultMetier } from './metiers'
import { maladieStep } from './sante'
import { computeFecondite, conceptionEtNaissances } from './naissances'
import { applyCultureInfluence, updateCityCultures } from './culture'
import { writeRecap } from './journal'
import { evaluerFamilles } from './statutSocial'
import { attribuerDomicilesVille } from './domiciles'

// ══════════════════════════════════════════════════════════════════════
//  MOTEUR DE POPULATION (PersonnagesPourJoueur)
// ══════════════════════════════════════════════════════════════════════

export function populationTurn(state: GameState, p: Player, rng: Rng) {
  const C = cfgOf(state.config)
  const pop = state.population[p.n]
  if (!pop) return
  const recap = emptyRecap()
  p.recap = recap

  // 3.1 Professeurs
  maybeAssignProfesseurs(state, p, rng, recap)

  // 3.2 Mariages
  gestionMariages(state, p, rng, recap)

  // 3.3 Boucle principale sur chaque vivant
  const vivants = pop.filter((c) => c.statut !== 'Décédé')
  // Vague scalabilité : partition des vivants par ville UNE fois par
  //  joueur (O(pop)) — assignAdultMetier → premierPosteLibre ne
  //  refiltre plus la population entière PAR habitant venant à l'âge
  //  adulte (~5 500 appels à 16 000 habitants). Le filtre sur le
  //  statut reste joué à l'appel : sémantique identique.
  const vivantsParVille = new Map<string, Character[]>()
  for (const c of vivants) {
    const l = vivantsParVille.get(c.ville)
    if (l) l.push(c)
    else vivantsParVille.set(c.ville, [c])
  }
  for (const c of vivants) {
    // statut vide → Sain
    if (!c.statut) c.statut = 'Sain'
    // vieillissement : +2 ans par tour
    // (rework habitants 2026-10-20 : plus d'âge-plafond, la maladie seule tue)
    c.age += 2
    // fécondité affichée
    c.fecondite = computeFecondite(state, p, c)
    // métier automatique à l'âge adulte
    if (c.age >= C.p.adultAge && !c.metier) assignAdultMetier(state, p, c, recap, vivantsParVille)
    // maladie
    maladieStep(state, p, c, rng, recap)
  }

  // 3.4 Grossesses et naissances
  conceptionEtNaissances(state, p, rng, recap)

  // 3.6 Influence culturelle
  applyCultureInfluence(state, p, rng, recap)
  updateCityCultures(state, p)

  // (RETRAIT 2026-10-28, arbitrage Thibaut : l'étape 3.6bis
  //  « Migration (scolarité) » est supprimée avec migrerPopulation —
  //  plus AUCUNE migration automatique de population ; les seuls
  //  déplacements restants sont volontaires : mariages/cour, transferts.)

  // 3.6ter DOMICILES (vague E, design domiciles 2026-10-24) :
  //  attribution des logements aux habitants APRÈS la démographie
  //  du tour (retour Thibaut 2026-10-26 : 1 logement = 1 habitant —
  //  les nouveau-nés de l'année prennent les places libres) et
  //  AVANT le statut social (le prestige du tour compte le
  //  domicile attribué CE tour).
  for (const v of p.villes) attribuerDomicilesVille(state, p, v, C)

  // 3.7 STATUT SOCIAL (vague D, design domiciles/ascension
  //  2026-10-24) : prestige des familles — calcul du gain du tour,
  //  convergence des couples, héritage des enfants devenus
  //  adultes. Les changements de rang (roturier ↔ bourgeois ↔
  //  noble) sont journalisés ici même (après la démographie du
  //  tour : les naissances/morts/maladies de CE tour comptent).
  const evenementsRang = evaluerFamilles(state, p, C)
  for (const ev of evenementsRang) {
    state.log.push({ turn: state.turn + 1, type: 'Système', joueur: p.n, texte: ev.texte })
  }

  // Récap dans le journal
  writeRecap(state, p, recap)
}

// ══════════════════════════════════════════════════════════════════════
//  MIGRATION DE POPULATION — RETRAIT INTÉGRAL (2026-10-28)
//    Historique (porté du VBA du classeur) :
//    1. SCOLARITÉ — un enfant vivant sans éducation dont la ville
//       n'a pas de Professeur pouvait partir étudier ailleurs :
//         · 10 % : ville avec Professeur du MÊME joueur ;
//         · 2 % : ville avec Professeur d'un autre joueur suzerain
//           (ou suzerain du suzerain) ;
//         · 1 % : ville avec Professeur de n'importe quel joueur.
//       Les « Obstinés » ne migraient jamais (l'éducation ne les
//       tentera jamais — VBA).
//    2. La migration spontanée par attrait touristique avait déjà
//       été retirée le 2026-10-19 (retour arbitre, avec le système
//       d'attrait — à refaire).
//    (RETRAIT 2026-10-28, arbitrage Thibaut « commence par retirer
//     la migration par scolarité » : migrerPopulation, le cache
//     villesAvecProfesseur, l'interface CibleVille et l'étape 3.6bis
//     du tour sont supprimés. Plus AUCUNE migration automatique de
//     population. Les déplacements restants sont TOUS volontaires :
//     mariages et cour (un époux non ancré déménage chez l'autre,
//     cf. cour.ts), transferts de cour, acquisition de cité libre —
//     et le principe survit : un personnage qui change de joueur est
//     physiquement déplacé dans le tableau de population de son
//     nouveau joueur. Les paramètres migrationEcole/Suzerain/Monde
//     restent en REFLIS dans params.ts.)
// ══════════════════════════════════════════════════════════════════════
