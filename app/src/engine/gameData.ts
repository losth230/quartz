// ══════════════════════════════════════════════════════════════════════
//  CHASSE & PÊCHE — Référentiels (seed)
//  ⚠️ Le classeur Excel original (1,49 Mo) n'a pas pu être lu ici :
//  ces tables reproduisent les structures (table `Titres`, `traits_genetiques`,
//  `BDD_pop`, `params_culture`, blocs « Evènement été/hiver » de `JSON`)
//  avec des valeurs de départ cohérentes avec le livret de règles et le VBA.
//  Elles sont intégralement modifiables dans l'onglet « Référentiels ».
// ══════════════════════════════════════════════════════════════════════

import type { TitreDef, TraitDef, CultureDef, PeupleDef } from './types'

// ── 12 ressources (feuille _Historique / lignes 18-28 des J{n}) ────────
export const RESOURCES: string[] = [
  'Bétail', 'Bois', 'Charbon', 'Fer', 'Pierre', 'Soie',
  'Or', 'Nourriture', 'Science', 'Habitants', 'Tourisme', 'Garnison',
]

// ── Table `Titres` (feuille Titres) ─────────────────────────────────────
// Titre · Éducation · Valeur1 · Ressource1 · Valeur2 · Ressource2 ·
// Description · NobleSeul · RegleGenre · Attribution
export const TITRES: TitreDef[] = [
  { titre: 'Dirigeant', education: '', valeur1: 1, ressource1: 'Or', valeur2: 1, ressource2: 'Science', description: 'Chef du pays. Unique. Sa mort déclenche la succession.', nobleSeul: true, regleGenre: 'Culture', attribution: 'Manuelle' },
  { titre: 'Héritier', education: '', valeur1: 0.5, ressource1: 'Or', valeur2: 0, ressource2: '', description: 'Succession désignée. Unique, de la dynastie du Dirigeant.', nobleSeul: true, regleGenre: 'Culture', attribution: 'Manuelle' },
  { titre: 'Gouverneur', education: '', valeur1: 1, ressource1: 'Or', valeur2: 0.5, ressource2: 'Nourriture', description: 'Un seul par ville. Gère l\'administration locale.', nobleSeul: true, regleGenre: 'Culture', attribution: 'Manuelle' },
  { titre: 'Professeur', education: '', valeur1: 0.5, ressource1: 'Science', valeur2: 0, ressource2: '', description: 'Enseigne dans les écoles de sa ville. Nombre plafonné au rang de l\'école.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Manuelle' },
  { titre: 'Ministre', education: '', valeur1: 1, ressource1: 'Or', valeur2: 0, ressource2: '', description: 'Ministre de la cour. Rapporte des revenus au pays.', nobleSeul: true, regleGenre: 'Culture', attribution: 'Manuelle' },
  { titre: 'Fermier', education: 'Agricole', valeur1: 1, ressource1: 'Nourriture', valeur2: 0, ressource2: '', description: 'Produit de la nourriture.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Chasseur', education: '', valeur1: 0.5, ressource1: 'Nourriture', valeur2: 0, ressource2: '', description: 'Titre par défaut des adultes sans éducation.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Aléatoire' },
  { titre: 'Pêcheur', education: 'Agricole', valeur1: 0.5, ressource1: 'Nourriture', valeur2: 0, ressource2: '', description: 'Vit de la pêche.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Aléatoire' },
  { titre: 'Érudit', education: 'Scientifique', valeur1: 1, ressource1: 'Science', valeur2: 0, ressource2: '', description: 'Fait avancer la recherche.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Médecin', education: 'Médicale', valeur1: 0.5, ressource1: 'Science', valeur2: 0, ressource2: '', description: 'Soigne la population.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Stratège', education: 'Militaire', valeur1: 0.5, ressource1: 'Garnison', valeur2: 0, ressource2: '', description: 'Organise la défense des villes.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Marchand', education: 'Économique', valeur1: 1, ressource1: 'Or', valeur2: 0.5, ressource2: 'Tourisme', description: 'Fait prospérer le commerce.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Prêtre', education: 'Religieuse', valeur1: 0.5, ressource1: 'Tourisme', valeur2: 0, ressource2: '', description: 'Attire les pèlerins.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Courtisan', education: 'Monarchique', valeur1: 0.5, ressource1: 'Or', valeur2: 0.25, ressource2: 'Tourisme', description: 'Intrigant de la cour.', nobleSeul: true, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Espion', education: 'Renseignements', valeur1: 0.25, ressource1: 'Soie', valeur2: 0, ressource2: '', description: 'Génère des manigances.', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Education' },
  { titre: 'Soldat', education: '', valeur1: 0, ressource1: '', valeur2: 0, ressource2: '', description: 'Engagé dans une armée (15 points de puissance).', nobleSeul: false, regleGenre: 'Aucune', attribution: 'Armée' },
  { titre: 'Commandant', education: 'Militaire', valeur1: 0, ressource1: '', valeur2: 0, ressource2: '', description: 'À la tête d\'une armée (45 points de puissance).', nobleSeul: true, regleGenre: 'Culture', attribution: 'Armée' },
]

// ── Table `traits_genetiques` ───────────────────────────────────────────
export const TRAITS: TraitDef[] = [
  { name: 'Robuste', weight: 10, description: 'Santé de fer : vie allongée.', life_delta: 10, resurrection_min_roll: 0, fert_add: 0, heritable: true, marriage_mod: 0.05 },
  { name: 'Fragile', weight: 10, description: 'Organisme affaibli : vie raccourcie.', life_delta: -10, resurrection_min_roll: 0, fert_add: 0, heritable: true, marriage_mod: -0.05 },
  { name: 'Fertile', weight: 8, description: 'Descendance nombreuse.', life_delta: 0, resurrection_min_roll: 0, fert_add: 0.3, heritable: true, marriage_mod: 0.1 },
  { name: 'Stérile', weight: 4, description: 'Impossible de procréer.', life_delta: 0, resurrection_min_roll: 0, fert_add: -2, heritable: false, marriage_mod: -0.15 },
  { name: 'Zélé', weight: 6, description: 'Foi inébranlable, béni par les dieux : peut survivre à la mort.', life_delta: 0, resurrection_min_roll: 6, fert_add: 0, heritable: true, marriage_mod: 0 },
  { name: 'Sage', weight: 6, description: 'Conseiller écouté.', life_delta: 5, resurrection_min_roll: 0, fert_add: 0, heritable: true, marriage_mod: 0.05 },
  { name: 'Objectionnable', weight: 6, description: 'Réputation exécrable.', life_delta: 0, resurrection_min_roll: 0, fert_add: 0, heritable: true, marriage_mod: -0.1 },
  { name: 'Guérisseur', weight: 4, description: 'Touche curative : vie très allongée.', life_delta: 15, resurrection_min_roll: 5, fert_add: 0, heritable: true, marriage_mod: 0.05 },
  { name: 'Béni par les esprits', weight: 3, description: 'Le monde des esprits le retient ici-bas.', life_delta: 5, resurrection_min_roll: 4, fert_add: 0, heritable: true, marriage_mod: 0 },
  { name: 'Maudit', weight: 3, description: 'Sombre destin.', life_delta: -15, resurrection_min_roll: 0, fert_add: 0, heritable: true, marriage_mod: -0.1 },
  { name: 'Bâtard', weight: 0, description: 'Né hors mariage. (Attribué automatiquement, hors tirage pondéré.)', life_delta: 0, resurrection_min_roll: 0, fert_add: 0, heritable: false, marriage_mod: 0 },
  { name: 'Consanguin', weight: 0, description: 'Né de parents apparentés. Maladie héréditaire.', life_delta: -8, resurrection_min_roll: 0, fert_add: -0.2, heritable: true, marriage_mod: -0.1 },
]

// ── Table `Orientation` (feuille JSON, pondérée) ────────────────────────
// Livret §V.i : 1d20 → 1-16 hétéro, 17-18 homo, 19 bi, 20 asexuel
export const ORIENTATIONS: { nom: string; poids: number }[] = [
  { nom: 'Hétérosexuel', poids: 80 },
  { nom: 'Homosexuel', poids: 10 },
  { nom: 'Bisexuel', poids: 5 },
  { nom: 'Asexuel', poids: 5 },
]

// ── Table `params_culture` (feuille _Params) ────────────────────────────
// Livret §IV.i : 9 cultures, hérédité / martialité / homosexualité
export const CULTURES: CultureDef[] = [
  { nom: 'Chamanisme', heredite: 'Parité', martialite: 'Masculine', homoAutorisee: false, fertFactor: 1.0 },
  { nom: 'Communautarisme', heredite: 'Masculine', martialite: 'Masculine', homoAutorisee: false, fertFactor: 1.1 },
  { nom: 'Déisme', heredite: 'Masculine', martialite: 'Masculine', homoAutorisee: false, fertFactor: 1.0 },
  { nom: 'Lunisme', heredite: 'Masculine', martialite: 'Masculine', homoAutorisee: false, fertFactor: 1.0 },
  { nom: 'Naturalisme', heredite: 'Féminine', martialite: 'Masculine', homoAutorisee: false, fertFactor: 1.15 },
  { nom: 'Occultisme', heredite: 'Masculine', martialite: 'Les deux', homoAutorisee: true, fertFactor: 0.9 },
  { nom: 'Sethisme', heredite: 'Féminine', martialite: 'Les deux', homoAutorisee: true, fertFactor: 1.0 },
  { nom: 'Zélotisme', heredite: 'Féminine', martialite: 'Les deux', homoAutorisee: true, fertFactor: 1.0 },
]

// ── Régimes politiques (livret §IV.iii) ─────────────────────────────────
export const REGIMES: { nom: string; crise: string }[] = [
  { nom: 'Autoritarisme', crise: 'Crise de l\'insoumission : les habitations sans fortification protestent (−5 Or/tour/rang).' },
  { nom: 'Confédération', crise: 'Crise d\'unité : une habitation menace de faire sécession.' },
  { nom: 'Monarchie de droit divin', crise: 'Crise du concurrent : un personnage aléatoire devient votre nouvel héritier.' },
  { nom: 'Oligarchie', crise: 'Crise du soulèvement : une habitation opprimée se révolte.' },
  { nom: 'Thalassocratie', crise: 'Crise du blocus : vos routes maritimes sont interrompues (−Tourisme).' },
  { nom: 'Théocratie', crise: 'Crise du schisme : le clergé se divise (−Influence).' },
  { nom: 'Sethisme', crise: 'Crise des rites : les sorciers exigent des offrandes (−Science).' },
]

// ── Table `params_faction` + BDD_pop (noms_<Peuple>) ────────────────────
export const PEUPLES: PeupleDef[] = [
  {
    nom: 'Valdoriens',
    noms: ['Valdoria', 'Orsan', 'Tirande', 'Marest', 'Clervaux', 'Fontenoy', 'Roussac', 'Béliard', 'Chanteraine', 'Vaucluse'],
    prenomsM: ['Aldric', 'Bertrand', 'Cédric', 'Dorian', 'Émeric', 'Fabrice', 'Gauthier', 'Honoré', 'Isembart', 'Jorann', 'Léonce', 'Marius', 'Néric', 'Orso', 'Perceval', 'Reynaud'],
    prenomsF: ['Adèle', 'Béatrice', 'Céline', 'Diane', 'Éloise', 'Fleur', 'Garinne', 'Héloïse', 'Isaure', 'Jeanne', 'Liane', 'Mélisande', 'Nadège', 'Odile', 'Perrine', 'Séverine'],
  },
  {
    nom: 'Hautmarchiens',
    noms: ['Hautmarche', 'Fervaques', 'Sombreciel', 'Aiglebrune', 'Castellan', 'Montverre', 'Pierre-qui-Veut', 'Rocroi', 'Sancerre', 'Viremont'],
    prenomsM: ['Amaury', 'Baudouin', 'Conon', 'Dreux', 'Ermenfroy', 'Foulques', 'Garin', 'Hugues', 'Josselin', 'Lionel', 'Mahaut', 'Névelon', 'Othon', 'Pons', 'Raoul', 'Thibaut'],
    prenomsF: ['Aliénor', 'Bérengère', 'Clemence', 'Douce', 'Ermengarde', 'Félice', 'Gersande', 'Hedwige', 'Ida', 'Jourdaine', 'Lucie', 'Mahaut', 'Nivers', 'Ozanne', 'Philippa', 'Vicie'],
  },
  {
    nom: 'Ostraviens',
    noms: ['Ostravie', 'Brumailes', 'Champsor', 'Glanure', 'Lisandro', 'Merlose', 'Nivose', 'Prairie-Haute', 'Sillans', 'Verdoyant'],
    prenomsM: ['Anselme', 'Barthélemy', 'Cyrille', 'Damien', 'Estève', 'Ferran', 'Gondran', 'Hervé', 'Isarn', 'Jaufré', 'Lothaire', 'Marceau', 'Néandor', 'Oury', 'Palamede', 'Quentin'],
    prenomsF: ['Agnès', 'Brunissende', 'Clarisse', 'Delphine', 'Esclarmonde', 'Fantine', 'Gile', 'Hombrine', 'Imberte', 'Javotte', 'Lombardie', 'Mireille', 'Nicolle', 'Ombeline', 'Pétronille', 'Rosalinde'],
  },
  {
    nom: 'Pyrénéens',
    noms: ['Pyrénat', 'Aranval', 'Cauteret', 'Espelette', 'Gavarnie', 'Ilharre', 'Lourdios', 'Mauléon', 'Ossun', 'Sauveterre'],
    prenomsM: ['Arnaud', 'Bertrand', 'Cassien', 'Dominique', 'Etcheverry', 'Ferréol', 'Guilhem', 'Iban', 'Loth', 'Mancio', 'Nestor', 'Ots', 'Pascal', 'Roger', 'Sanche', 'Xavier'],
    prenomsF: ['Almodis', 'Béatrix', 'Chiara', 'Diane', 'Esther', 'Gallia', 'Hyacinthe', 'Inès', 'Julieta', 'Lore', 'Maxine', 'Nadau', 'Ondine', 'Perlucia', 'Sancha', 'Tiphaine'],
  },
  {
    nom: 'Sélèves',
    noms: ['Sélève', 'Boisjoli', 'Clairval', 'Dampierre', 'Étang-Sauvage', 'Ferté-sous-Jouarre', 'Gelosa', 'Huisne', 'Lacs', 'Rosnoy'],
    prenomsM: ['Aubin', 'Bénézet', 'Colart', 'Didier', 'Évrard', 'Fromond', 'Gilles', 'Hervieu', 'Ithier', 'Jehan', 'Lambert', 'Miles', 'Nesle', 'Oury', 'Ponthus', 'Renaud'],
    prenomsF: ['Ameline', 'Béatrice', 'Cécile', 'Dedée', 'Elvire', 'Florentine', 'Gauberte', 'Hersende', 'Isabelle', 'Josiane', 'Létice', 'Marguerite', 'Nivosse', 'Ozanne', 'Plesse', 'Rigault'],
  },
  {
    nom: 'Tessinois',
    noms: ['Tessin', 'Bellinzone', 'Clarière', 'Echandens', 'Fleurens', 'Grandval', 'Hautrive', 'Lutry', 'Moudon', 'Vevay'],
    prenomsM: ['Alain', 'Briant', 'Childebert', 'Davel', 'Émile', 'Frédéric', 'Gottfried', 'Heinrich', 'Jörg', 'Konrad', 'Ludwig', 'Meinrad', 'Niklaus', 'Otto', 'Peter', 'Rudolf'],
    prenomsF: ['Adelheid', 'Berthe', 'Claudia', 'Dorothée', 'Édith', 'Frida', 'Greta', 'Hedda', 'Ilse', 'Johanna', 'Katrin', 'Liesel', 'Marthe', 'Nina', 'Ortrud', 'Sofia'],
  },
  {
    nom: 'Mistraliens',
    noms: ['Mistralie', 'Aureille', 'Cadenet', 'Entraigues', 'Fareness', 'Gargas', 'Istres', 'Lamanon', 'Nioque', 'Sénas'],
    prenomsM: ['Antonin', 'Bastien', 'César', 'Danton', 'Esprit', 'Félix', 'Gabriel', 'Hilarion', 'Ismaël', 'Jérôme', 'Ludovic', 'Marius', 'Napoléon', 'Olivier', 'Pancrace', 'Virgile'],
    prenomsF: ['Amélie', 'Bibi', 'Chiara', 'Dora', 'Estellon', 'Fanny', 'Gitane', 'Honorine', 'Isaure', 'Justine', 'Lisette', 'Miette', 'Nadine', 'Olympe', 'Régine', 'Violette'],
  },
  {
    nom: 'Brumaires',
    noms: ['Brumaire', 'Ancenis', 'Chouan', 'Dolné', 'Éronce', 'Fayaux', 'Gravelle', 'Houssay', 'Iffendic', 'Janzé'],
    prenomsM: ['Ambroise', 'Bonaventure', 'Corentin', 'Donatien', 'Évariste', 'Fulbert', 'Gweltaz', 'Hervé', 'Idwal', 'Judi', 'Loïc', 'Malo', 'Nergal', 'Olivar', 'Padrig', 'Riwal'],
    prenomsF: ['Azenor', 'Brenn', 'Cloan', 'Divina', 'Enora', 'Frañseza', 'Gwenael', 'Hoel', 'Ifig', 'Katell', 'Lanvern', 'Morwenna', 'Nolwenn', 'Ostaline', 'Rozenn', 'Tangwenn'],
  },
]

// ── Accès rapides ───────────────────────────────────────────────────────
export function titreDef(titre: string): TitreDef | undefined {
  return TITRES.find((t) => t.titre === titre)
}
export function traitDef(name: string): TraitDef | undefined {
  return TRAITS.find((t) => t.name === name)
}
export function cultureDef(nom: string): CultureDef | undefined {
  return CULTURES.find((c) => c.nom === nom)
}
export function peupleDef(nom: string): PeupleDef | undefined {
  return PEUPLES.find((p) => p.nom === nom)
}
