// ══════════════════════════════════════════════════════════════════════
//  CHASSE & PÊCHE — Référentiels (seed), 2e partie :
//  bâtiments, événements, cartes dynastie.
//  (Blocs « Evènement été/hiver » de la feuille JSON + annexe III du livret)
// ══════════════════════════════════════════════════════════════════════

import type { BuildingDef, EventDef, DynastieDef } from './types'

// ── Bâtiments ───────────────────────────────────────────────────────────
// Santé : modificateurs issus de la documentation du VBA (§3.3) :
//   Herboristerie (−0,01 contraction / +0,05 guérison)
//   Clinique (−0,02 / +0,05), Hôpital (−0,03 / +0,15),
//   Guilde des Médecins (+0,10 guérison partout)
// Éducation : Ecole élémentaire (rang 1), intermédiaire (2), supérieure (3)
export const BUILDINGS: BuildingDef[] = [
  { nom: 'Herboristerie', categorie: 'Santé', ecoleRang: 0, malContraction: -0.01, bonusGuerison: 0.05, bonusGuerisonGlobal: 0, effet: 'Réduit la probabilité de contracter une maladie, augmente la guérison dans la ville.' },
  { nom: 'Clinique', categorie: 'Santé', ecoleRang: 0, malContraction: -0.02, bonusGuerison: 0.05, bonusGuerisonGlobal: 0, effet: 'Soins plus efficaces dans la ville.' },
  { nom: 'Hôpital', categorie: 'Santé', ecoleRang: 0, malContraction: -0.03, bonusGuerison: 0.15, bonusGuerisonGlobal: 0, effet: 'Meilleure protection sanitaire de la ville.' },
  { nom: 'Guilde des Médecins', categorie: 'Santé', ecoleRang: 0, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0.10, effet: 'Bonus de guérison dans TOUT le pays.' },
  { nom: 'École élémentaire', categorie: 'Éducation', ecoleRang: 1, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0, effet: 'Permet 1 Professeur dans la ville ; éducation des mineurs rang 1.' },
  { nom: 'École intermédiaire', categorie: 'Éducation', ecoleRang: 2, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0, effet: 'Permet 2 Professeurs ; éducation rang 2.' },
  { nom: 'École supérieure', categorie: 'Éducation', ecoleRang: 3, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0, effet: 'Permet 3 Professeurs ; éducation rang 3.' },
  { nom: 'Marché', categorie: 'Économie', ecoleRang: 0, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0, effet: '+0,5 Or par tour dans la ville.' },
  { nom: 'Foire', categorie: 'Économie', ecoleRang: 0, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0, effet: '+2 Or et +4 Tourisme par tour dans la ville.' },
  { nom: 'Temple', categorie: 'Culture', ecoleRang: 0, malContraction: 0, bonusGuerison: 0, bonusGuerisonGlobal: 0, effet: '+1 Tourisme par tour ; +1 à la résistance à la conversion culturelle.' },
]

export function buildingDef(nom: string): BuildingDef | undefined {
  return BUILDINGS.find((b) => b.nom === nom)
}

/** Rang d'école le plus élevé d'une ville (0 = aucune école). */
export function schoolRankOf(batiments: string[]): number {
  let rank = 0
  for (const b of batiments) {
    const def = buildingDef(b)
    if (def && def.ecoleRang > rank) rank = def.ecoleRang
  }
  return rank
}

// ── Événements (annexe III du livret, table 1d100 par saison) ──────────
// Dangerosité = 1d6 + modDanger (Accueil!R1) → ≤5 faible, 6-8 moyenne,
// 9-10 forte, 11+ extrême (macro `Evenement` du VBA)
export const EVENTS: EventDef[] = [
  { nom: 'Terres fertiles', saison: 'Été', poids: 5, faible: 'Tous les joueurs produisent 10 Nourritures en plus pour ce tour.', moyenne: 'Tous les joueurs produisent 20 Nourritures en plus pour ce tour.', forte: 'Tous les joueurs produisent 30 Nourritures en plus pour ce tour.', extreme: 'Tous les joueurs produisent 50 Nourritures en plus pour ce tour.' },
  { nom: 'Explosion volcanique', saison: 'Été', poids: 10, faible: 'Fumées inquiétantes, quelques récoltes perdues (−5 Nourriture à tous).', moyenne: 'Un volcan entre en éruption : −10 Nourriture et −2 Bois à tous.', forte: 'Éruption majeure : −20 Nourriture, −5 Bois, aménagements endommagés.', extreme: 'Hiver volcanique : −30 Nourriture, −10 Bois, −10% naissances ce tour.' },
  { nom: 'Sécheresse', saison: 'Été', poids: 12, faible: 'Les récoltes souffrent légèrement (−5 Nourriture à tous).', moyenne: 'Les puits sont à sec : −10 Nourriture à tous.', forte: 'Grande sécheresse : −20 Nourriture, −2 Or à tous.', extreme: 'Cataclysme : −40 Nourriture, épidémie probable dans chaque pays.' },
  { nom: 'Épidémie', saison: 'Été', poids: 8, faible: 'Quelques fièvres : 1 personnage malade par joueur.', moyenne: 'Fièvre estivale : 2 personnages malades par joueur.', forte: 'Épidémie : chaque personnage vivant a 10% de risque de maladie.', extreme: 'Peste : chaque personnage vivant a 25% de risque de maladie.' },
  { nom: 'Fête du soleil', saison: 'Été', poids: 10, faible: 'Bonne humeur : +5 Tourisme à tous.', moyenne: 'Grandes fêtes : +10 Tourisme, +5 Or à tous.', forte: 'Fêtes somptueuses : +20 Tourisme, +10 Or à tous.', extreme: 'Fêtes légendaires : +40 Tourisme, +20 Or à tous.' },
  { nom: 'Bonne pêche', saison: 'Été', poids: 12, faible: 'Les filets sont pleins : +5 Nourriture à tous.', moyenne: 'Bancs exceptionnels : +15 Nourriture à tous.', forte: 'Pêche miraculeuse : +30 Nourriture et +2 Bétail à tous.', extreme: 'Millions de poissons : +50 Nourriture et +5 Bétail à tous.' },
  { nom: 'Récoltes abondantes', saison: 'Été', poids: 15, faible: 'Bonnes moissons : +10 Nourriture à tous.', moyenne: 'Moissons dorées : +25 Nourriture à tous.', forte: 'Récoltes record : +40 Nourriture, +5 Or à tous.', extreme: 'Abondance historique : +60 Nourriture, +10 Or à tous.' },
  { nom: 'Razzia de brigands', saison: 'Été', poids: 8, faible: 'Des brigands rôdent : −2 Or à tous.', moyenne: 'Une caravane est pillée : −5 Or au joueur le plus riche.', forte: 'Camp de brigands : −10 Or et 1 décès par joueur.', extreme: 'Grande razzia : −20 Or, 2 décès par joueur, greniers brûlés (−10 Nourriture).' },
  { nom: 'Tempête de neige', saison: 'Hiver', poids: 12, faible: 'Froid mordant : −5 Nourriture à tous.', moyenne: 'Neiges abondantes : −10 Nourriture à tous.', forte: 'Blizzard : −20 Nourriture, −1 Bois à tous.', extreme: 'Grand hiver : −40 Nourriture, 5% des personnages les plus âgés meurent.' },
  { nom: 'Épidémie d\'hiver', saison: 'Hiver', poids: 10, faible: 'Toux et grippes : 1 personnage malade par joueur.', moyenne: 'Fièvre hivernale : 2 personnages malades par joueur.', forte: 'Épidémie : chaque personnage vivant a 10% de risque de maladie.', extreme: 'Peste noire : chaque personnage vivant a 25% de risque de maladie.' },
  { nom: 'Fête du solstice', saison: 'Hiver', poids: 10, faible: 'Feux de joie : +5 Tourisme à tous.', moyenne: 'Solstice faste : +10 Tourisme, +5 Or à tous.', forte: 'Nuit des lanternes : +20 Tourisme, +10 Or à tous.', extreme: 'Solstice légendaire : +40 Tourisme, +20 Or à tous.' },
  { nom: 'Chasse d\'hiver', saison: 'Hiver', poids: 12, faible: 'Bon gibier : +5 Nourriture à tous.', moyenne: 'Grande chasse : +15 Nourriture, +2 Bétail à tous.', forte: 'Traque aux loups : +30 Nourriture, +5 Bétail à tous.', extreme: 'Chasse royale : +50 Nourriture, +10 Bétail à tous.' },
  { nom: 'Gel des récoltes', saison: 'Hiver', poids: 15, faible: 'Gelées : −5 Nourriture à tous.', moyenne: 'Gelées tardives : −15 Nourriture à tous.', forte: 'Famine en vue : −30 Nourriture, −5 Or à tous.', extreme: 'Grande famine : −50 Nourriture, −10 Or, 5% des habitants meurent.' },
  { nom: 'Ambassade lointaine', saison: 'Hiver', poids: 8, faible: 'Voyageurs : +2 Tourisme à tous.', moyenne: 'Ambassade : +1 Science et +5 Tourisme à tous.', forte: 'Savants étrangers : +3 Science et +10 Tourisme à tous.', extreme: 'Concours des nations : +6 Science, +20 Tourisme, +10 Or à tous.' },
  { nom: 'Loups en maraude', saison: 'Hiver', poids: 8, faible: 'Hurlements : −2 Bétail à tous.', moyenne: 'Meute affamée : −5 Bétail, 1 décès par joueur.', forte: 'Hiver des loups : −10 Bétail, 2 décès par joueur.', extreme: 'Invasion lupine : −15 Bétail, 3 décès par joueur, −10 Nourriture.' },
]

// ── Cartes dynastie (feuille JSON, macro TirerDynastie) ─────────────────
export const DYNASTIES: DynastieDef[] = [
  { nom: 'Oracle', description: 'Tirez trois cartes dynastie, choisissez-en autant que vous souhaitez et appliquez leur effet.' },
  { nom: 'Étoile montante', description: 'Votre famille gagne en influence : +10 Or et 1 personnage obtient une éducation supérieure.' },
  { nom: 'Héritage contesté', description: 'Deux prétendants s\'affrontent : le titre d\'Héritier est remis en jeu.' },
  { nom: 'Union providentielle', description: 'Un mariage avantageux se propose : +20 Or si vous l\'acceptez.' },
  { nom: 'Anoblissement', description: 'Un roturier de votre cour est anobli pour services rendus.' },
  { nom: 'Disgrâce', description: 'Un scandale éclate à votre cour : −15 Or et −10 Tourisme.' },
  { nom: 'Prophétie', description: 'Un devin prédit la mort d\'un de vos personnages âgés… ou sa résurrection.' },
  { nom: 'Trésor oublié', description: 'Un coffre est retrouvé dans les fondations d\'une de vos villes : +25 Or.' },
  { nom: 'Famine dynastique', description: 'Les coffres familiaux s\'épuisent : −10 Nourriture et −5 Or.' },
  { nom: 'Sang neuf', description: 'Des réfugiés rejoignent vos villes : +5 Habitants en stock.' },
  { nom: 'Guerre de succession lointaine', description: 'Un conflit éclate au loin : +5 Garnison par précaution.' },
  { nom: 'Ère de prospérité', description: 'Vos terres s\'enrichissent : +15 Or, +15 Nourriture, +10 Tourisme.' },
]

// ── Conditions de victoire (chapitre XII du livret) ─────────────────────
export const VICTORY_TEXT: { nom: string; texte: string }[] = [
  { nom: 'Militaire', texte: 'Détruire toutes les armées des autres joueurs (toutes les habitations en lvl).' },
  { nom: 'Économique', texte: 'Posséder une citadelle et générer plus de 50% de l\'Or mondial à chaque tour (75% en lvl).' },
  { nom: 'Culturelle', texte: 'Posséder une citadelle et plus de 50% du Tourisme mondial (75% en lvl) ; 50% des habitations mondiales de la culture de votre capitale.' },
  { nom: 'Scientifique', texte: 'Découvrir toutes les technologies.' },
  { nom: 'Démographique', texte: 'Posséder au moins 5 habitations dont 3 citadelles et un excédent de 100 Nourriture par tour.' },
  { nom: 'Dynastique', texte: 'La dynastie de votre dirigeant : 2 Gouverneurs, 4 personnages d\'éducation rang 3, 10 personnages au total, 33% des personnages mondiaux à votre cour.' },
]
