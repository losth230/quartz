// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DU CHEMIN CONFIG (2026-10-19) — les tests qui auraient attrapé
//  les bugs réels de la série :
//
//   BUG 1 « adultAge resté à 16 » : l'adoption de la config mondiale au
//   chargement était ABSENTE du code déployé (commit parti sans l'effet).
//   → testé ici : la mondiale PRIME sur la locale au chargement.
//
//   BUG 2 « rien n'avait changé après reconnexion » : joinGame adoptait
//   la config EMBARQUÉE du salon, plus ancienne qu'une édition faite
//   depuis l'accueil entre deux tours.
//   → testé ici : priorité mondiale > embarquée > locale, + injection
//   dans l'état (l'UI de jeu lit state.config).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adopterConfig, configAuChargement } from './configPriorite'
import { cloneDefaultConfig, cfgOf, validerFormeConfig, type GameConfig } from '../config/defaultConfig'
import { createGame, type SetupLine } from '../engine/setup'
import type { GameState } from '../engine/types'

const SETUP: SetupLine[] = [{
  nom: 'Test', peuple: 'NORLS', culture: 'Culture Nordique', regime: 'Autoritarisme',
  taillePopulation: 20, pourcentageMariages: 40, villes: ['A'],
}]

/** Config factice reconnaissable : un paramètre marqué. */
function configAvec(adultAge: number): GameConfig {
  const c = cloneDefaultConfig()
  c.params = { ...c.params, adultAge }
  return c
}

function partie(): GameState {
  return createGame(SETUP, 42, 'local')
}

// ── Le contrat de priorité (BUG 1 et BUG 2) ─────────────────────────────────

test('config : la MONDIALE prime sur la locale au chargement (bug adultAge 16→18)', () => {
  const locale = configAvec(16)     // l'amorce localStorage de l'utilisateur
  const mondiale = configAvec(18)  // publiée depuis l'accueil par un autre joueur
  const choisie = configAuChargement({ mondiale, locale })
  assert.ok(choisie, 'une config doit être choisie')
  assert.equal(cfgOf(choisie).config.params?.adultAge, 18,
    'la mondiale doit primer — c est le bug : la page rafraîchie doit montrer 18, pas le 16 du localStorage')
})

test('config : sans mondiale (hors-ligne), la locale reste (amorce)', () => {
  const locale = configAvec(16)
  const choisie = configAuChargement({ mondiale: null, locale })
  assert.equal(cfgOf(choisie!).config.params?.adultAge, 16,
    'hors-ligne, l amorçe locale fait foi — pas de retour à zéro')
})

test('config : joinGame — la MONDIALE prime sur l EMBARQUÉE du salon (édition entre deux tours)', () => {
  // Le salon publié à la dernière résolution embarque adultAge 16 ;
  //  le créateur a édité 18 depuis l'accueil APRÈS cette résolution.
  const etat = partie()
  etat.config = configAvec(16)
  const mondiale = configAvec(18)
  const choisie = adopterConfig(etat, { mondiale, locale: configAvec(16) })
  assert.ok(choisie, 'une config doit être adoptée')
  assert.equal(cfgOf(choisie).config.params?.adultAge, 18, 'la mondiale (18) doit gagner sur la locale (16)')
  // et elle est INJECTÉE dans l'état : l'UI de jeu lit state.config
  assert.equal(cfgOf(etat.config!).config.params?.adultAge, 18,
    'la config doit être injectée dans l état — sinon le jeu affiche l ancienne valeur (bug réel)')
})

test('config : sans mondiale, l EMBARQUÉE du salon n est PLUS une source — la LOCALE fait foi', () => {
  // Règle 2026-10-19 : seule la mondiale fait loi ; la config embarquée
  //  d'un état de partie est un cache, jamais une source.
  const etat = partie()
  etat.config = configAvec(17) // cache périmé embarqué
  const choisie = adopterConfig(etat, { mondiale: null, locale: configAvec(16) })
  assert.ok(choisie)
  assert.equal(cfgOf(choisie).config.params?.adultAge, 16,
    'sans mondiale, la locale (16) doit être adoptée, PAS l embarquée (17)')
  assert.equal(cfgOf(etat.config!).config.params?.adultAge, 16,
    'l état doit être réinjecté avec la locale, pas garder son cache périmé')
})

test('config : aucune source → rien ne change (pas d écrasement par null)', () => {
  const etat = partie()
  const avant = etat.config
  const choisie = adopterConfig(etat, { mondiale: null, locale: null })
  assert.equal(choisie, null, 'aucune source → null, l appelant ne change rien')
  assert.equal(etat.config, avant, 'l état ne doit pas être muté sans source')
})

// ── Le contrat d'injection à la résolution (fin de tour) ─────────────────────

test('config : l injection fin de tour conserve la config si la mondiale est absente', async () => {
  const { appliquerConfigMondiale } = await import('../engine/fusion')
  const etat = partie()
  etat.config = configAvec(17)
  appliquerConfigMondiale(etat, null)
  assert.equal(cfgOf(etat.config!).config.params?.adultAge, 17,
    'sans mondiale publiée, l embarquée doit survivre à la résolution')
  appliquerConfigMondiale(etat, configAvec(18))
  assert.equal(cfgOf(etat.config!).config.params?.adultAge, 18,
    'avec une mondiale, la résolution l applique avant runTurn')
})

// ── Migration v4 (retour Thibaut 2026-10-22 « les descriptions des
//    aménagements, c'est du grand n'importe quoi ») ─────────────────────────

test('config : migration v4 — les aménagements pré-vague-3a sont réalignés (descriptions, effets, emplacements)', () => {
  const c = cloneDefaultConfig()
  c.schemaVersion = 3
  // Config d'avant la vague 3a (production → emplacements) et avant la
  //  vague 3c : le Baleinier porte l'ANCIENNE description, les ANCIENS
  //  effets structurés (encore lus par le moteur !) et PAS de champ
  //  emplacements ; le Champ est retiré (la complétion doit le remettre).
  const iB = c.constructions.findIndex((x) => x.nom === 'Baleinier')
  assert.ok(iB >= 0, 'Baleinier dans les défauts')
  c.constructions[iB] = {
    ...c.constructions[iB],
    description: '+2 Or et +10 Nourriture par tour.',
    effets: [{ ressource: 'Or', quantite: 2 }, { ressource: 'Nourriture', quantite: 10 }],
  } as typeof c.constructions[number]
  delete (c.constructions[iB] as { emplacements?: unknown }).emplacements
  c.constructions = c.constructions.filter((x) => x.nom !== 'Champ')
  // un aménagement PERSO doit survivre au réalignement
  c.constructions.push({
    categorie: 'Aménagement', groupe: 'Terrain', famille: '', nom: 'Mon aménagement perso',
    cout: '', production: '', description: 'perso', effets: [],
  })
  const C = cfgOf(c)
  const b = C.config.constructions.find((x) => x.nom === 'Baleinier')!
  assert.equal(b.description, '',
    'description réalignée sur le référentiel (vide depuis le retrait des descriptions, plus d ancien texte de production)')
  assert.deepEqual(
    (b.emplacements ?? []).map((e) => `${e.places} ${e.metier}`),
    ['3 Pêcheur', '2 Commerçant'],
    'emplacements de la vague 3a récupérés (caps conformes)')
  assert.equal((b.effets ?? []).length, 0,
    'les anciens effets de production directe (Or, Nourriture) disparaissent')
  assert.ok(C.config.constructions.some((x) => x.nom === 'Champ'),
    'les entrées manquantes du référentiel sont ajoutées par la complétion')
  // (fiches aménagements 2026-10-25 : les tiers 2/3 D'AMÉNAGEMENTS
  //  sont de retour au référentiel — la simplification du 2026-10-23
  //  ne retire plus que les BÂTIMENTS de rang ≥ 2)
  assert.ok(C.config.constructions.some((x) => x.nom === 'Baleinier (tier 2)'),
    'fiches 2026-10-25 : les tiers 2 d aménagements sont au référentiel')
  // (fiche bâtiments rang 2, 2026-10-26 : les BÂTIMENTS rang 2 sont
  //  de retour au référentiel — la réactivation suit la même voie
  //  que les tiers d'aménagements 2026-10-25)
  assert.ok(C.config.constructions.some((x) => x.categorie === 'Bâtiment' && (x.rangMinHabitation ?? 0) >= 2),
    'fiche bâtiments 2026-10-26 : les bâtiments rang 2 sont au référentiel')
  assert.ok(C.config.constructions.some((x) => x.nom === 'Mon aménagement perso'),
    'un aménagement perso (hors référentiel) est conservé')
  assert.equal(C.config.schemaVersion, 5, 'tampon v5 apposé')
  // idempotence : la config convergée ne repasse PAS par les migrations
  const C2 = cfgOf(C.config)
  assert.ok(C2.config.constructions.some((x) => x.nom === 'Mon aménagement perso'),
    're-lecture : le perso survit (pas de re-migration)')
  assert.equal(
    C2.config.constructions.find((x) => x.nom === 'Baleinier')!.description,
    '', 're-lecture : description toujours vide')
})

// ── Migration v5 (retour Thibaut 2026-10-27 « tu as récupéré les
//    anciennes règles des bâtiments, par exemple le bûcheron qui
//    donne du bois plutôt que des emplacements de bûcheron ») ──────

test('config : migration v5 — les BÂTIMENTS pré-rework sont réalignés (plus de double comptage Bois + Bûcheron), les merveilles purgées', () => {
  const c = cloneDefaultConfig()
  c.schemaVersion = 4 // config sauvegardée avant le bump v5
  // Camp de bûcheron au VIEUX format (avant le rework « production →
  //  emplacements ») : effet de flux +1 Bois, PAS d'emplacements,
  //  textes hérités. C'est le bug constaté : l'effet de flux SURVIVAIT
  //  à migrerConstructions (champ sauvegardé prioritaire) alors que
  //  les emplacements étaient complétés par le défaut — le bâtiment
  //  produisait le Bois de l'ancienne règle ET les emplacements de la
  //  nouvelle (double comptage).
  const iB = c.constructions.findIndex((x) => x.nom === 'Camp de bûcheron')
  assert.ok(iB >= 0, 'Camp de bûcheron dans les défauts')
  c.constructions[iB] = {
    ...c.constructions[iB],
    production: '+1 Bois par tour.',
    cout: '5 Or + 1 Bétail',
    description: 'Un camp de bûcherons.',
    effets: [{ ressource: 'Bois', quantite: 1 }],
  } as typeof c.constructions[number]
  delete (c.constructions[iB] as { emplacements?: unknown }).emplacements
  // les 4 MERVEILLES supprimées du référentiel (audit 2026-10-27)
  //  traînent encore dans la config sauvegardée (le « (52) » constaté
  //  dans l'onglet Paramètres) — purge à l'ouverture, arbitrage du jour.
  const merveillesVieilles = ([
    'Sanctuaire de Salmodiva', 'Jardins d\u2019Alexandrie',
    'Mont Caracole', 'Grands bains',
  ].map((nom) => ({
    categorie: 'Bâtiment', groupe: 'Capitale', famille: 'Merveille',
    nom, cout: '', production: '', description: '',
    effets: [], rangMinHabitation: 1,
  })) as typeof c.constructions)
  c.constructions.push(...merveillesVieilles)
  // un bâtiment PERSO doit survivre au réalignement
  c.constructions.push({
    categorie: 'Bâtiment', groupe: 'Ville', famille: '',
    nom: 'Mon bâtiment perso', cout: '1 Or', production: '',
    description: 'perso', effets: [],
  } as typeof c.constructions[number])
  const C = cfgOf(c)
  const b = C.config.constructions.find((x) => x.nom === 'Camp de bûcheron')!
  assert.deepEqual(b.effets, [],
    'l ancien effet de flux (+1 Bois) disparaît — le bois ne vient QUE du métier Bûcheron')
  assert.deepEqual(
    (b.emplacements ?? []).map((e) => `${e.places} ${e.metier}`),
    ['2 Bûcheron'], 'emplacements du RÉFÉRENTIEL (pas complétés par-dessus le flux)')
  assert.equal(b.production, '', 'texte de production réaligné (vide)')
  assert.equal(b.cout, '', 'texte de coût réaligné (vide)')
  assert.deepEqual(b.couts, [
    { ressource: 'Or', valeur: 5 }, { ressource: 'Bétail', valeur: 1 },
  ], 'coût en données du référentiel')
  assert.equal(
    C.config.constructions.filter((x) => (x.famille ?? '') === 'Merveille').length,
    0, 'les 4 merveilles sont purgées à l ouverture')
  assert.equal(
    C.config.constructions.filter((x) => x.categorie === 'Bâtiment').length,
    49, '48 bâtiments du référentiel + le perso, ni perdus ni doublés')
  assert.ok(C.config.constructions.some((x) => x.nom === 'Mon bâtiment perso'),
    'un bâtiment perso (hors référentiel) est conservé')
  assert.equal(C.config.schemaVersion, 5, 'tampon v5 apposé')
  // idempotence : la re-lecture d une config convergée est stable
  const C2 = cfgOf(C.config)
  assert.equal(C2.config.constructions.length, C.config.constructions.length,
    're-lecture : le réalignement/purge est idempotent')
  assert.ok(C2.config.constructions.some((x) => x.nom === 'Mon bâtiment perso'),
    're-lecture : le perso survit (pas de re-migration)')
})

test('config : une édition POST-convergence (tampon v5) n est PAS écrasée par le réalignement', () => {
  // Le réalignement ne joue qu UNE fois, à la migration : une
  //  personnalisation saisie APRÈS la convergence (config tamponnée
  //  à la version courante) survit aux re-lectures.
  const c = cloneDefaultConfig()
  c.schemaVersion = 5
  const iP = c.constructions.findIndex((x) => x.nom === 'Camp de bûcheron')
  c.constructions[iP].description = 'note perso saisie après convergence'
  const C = cfgOf(c)
  assert.equal(
    C.config.constructions.find((x) => x.nom === 'Camp de bûcheron')!.description,
    'note perso saisie après convergence',
    're-lecture : l édition post-convergence survit (pas de re-migration)')
})

// ── Retrait des descriptions d'aménagements (retour Thibaut
//    2026-10-22 « retire carrément les descriptions ») ─────────────────────

test('config : descriptions des aménagements vidées une bonne fois pour toutes, même sur une config déjà convergée (tampon courant)', () => {
  // Config déjà tamponnée à la version COURANTE (aucune migration de
  //  complétion ne rejouera) : la migration ciblée doit pourtant vider
  //  les descriptions d'aménagements et poser son marqueur. (Depuis
  //  la v5, un simple tampon v4 re-passerait AUSSI par le bloc complet
  //  de migrations — réalignement compris.)
  const c = cloneDefaultConfig()
  c.schemaVersion = 5
  const iB = c.constructions.findIndex((x) => x.nom === 'Baleinier')
  const iC = c.constructions.findIndex((x) => x.nom === 'Champ')
  assert.ok(iB >= 0 && iC >= 0, 'Baleinier et Champ dans les défauts')
  c.constructions[iB].description = 'texte hérité obsolète'
  c.constructions[iC].description = 'Aménagement de contrôle : 3 emplacements de Fermier…'
  const iM = c.constructions.findIndex((x) => x.nom === 'Ponton')
  assert.ok(iM >= 0 && c.constructions[iM].categorie !== 'Aménagement',
    'un bâtiment de contrôle existe (Ponton)')
  c.constructions[iM].description = 'Bâtiment : description conservée.'
  delete (c as { descriptionsAmenagementsVides?: boolean }).descriptionsAmenagementsVides
  const C = cfgOf(c)
  assert.equal(C.config.constructions.find((x) => x.nom === 'Baleinier')!.description, '',
    'tier 1 : description vidée sur config déjà v4')
  assert.equal(C.config.constructions.find((x) => x.nom === 'Champ')!.description, '',
    'Champ : description vidée sur config déjà v4')
  assert.equal(C.config.constructions.find((x) => x.nom === 'Ponton')!.description,
    'Bâtiment : description conservée.',
    'les descriptions de BÂTIMENTS ne sont pas touchées')
  assert.ok(C.config.descriptionsAmenagementsVides,
    'marqueur posé (one-shot : une description perso saisie ensuite est préservée)')
  // one-shot : une description personnalisée saisie APRÈS survit aux re-lectures
  const c2 = C.config
  const iB2 = c2.constructions.findIndex((x) => x.nom === 'Baleinier')
  c2.constructions[iB2].description = 'note perso'
  assert.equal(cfgOf(c2).config.constructions.find((x) => x.nom === 'Baleinier')!.description,
    'note perso', 're-lecture : la description perso posée après la migration survit')
})

// ── Nettoyage du code mort (retour Thibaut 2026-10-22, points 5 et 6
//    de la revue critique des habitations) ─────────────────────────


test('config : rangsHabitation (table dupliquée, morte) absente des défauts et supprimée des configs sauvegardées', () => {
  const c = cloneDefaultConfig()
  assert.ok(!('rangsHabitation' in c),
    'les défauts ne portent plus la table rangsHabitation (doublon de typesHabitation)')
  // une config sauvegardée qui la porte encore (clé orpheline) :
  ;(c as { rangsHabitation?: unknown }).rangsHabitation = [{ rang: 'Ville' }]
  const C = cfgOf(c)
  assert.ok(!('rangsHabitation' in C.config),
    'rangsHabitation est supprimée par cfgOf (clé orpheline non persistée)')
  // re-lecture : toujours absente
  assert.ok(!('rangsHabitation' in cfgOf(C.config).config),
    're-lecture : toujours absente')
})

// ── Dette legacy & formats unifiés (retour Thibaut 2026-10-23,
//    revue structure/SOLID) ──────────────────────────────────────

test('config : migration one-shot — le TEXTE « metiersDisponibles » devient le tableau metiersBase (métiers au singulier), les tables legacy disparaissent', () => {
  const c = cloneDefaultConfig()
  c.schemaVersion = 5 // config déjà convergée : la migration ciblée joue quand même
  const h = c.typesHabitation.find((t) => t.type === 'Ville' && t.rang === 'Hameau')!
  ;(h as unknown as { metiersDisponibles: string }).metiersDisponibles =
    '50 Chasseurs, 2 Gardes, 1 Commerçants, 3 InconnuDuReferentiel'
  delete (h as unknown as { metiersBase?: unknown }).metiersBase
  ;(c as unknown as Record<string, unknown>).batimentsVille = [{ nom: 'X' }]
  ;(c as unknown as Record<string, unknown>).amenagements = [{ amenagement: 'Y' }]
  const C = cfgOf(c)
  const h2 = C.config.typesHabitation.find((t) => t.type === 'Ville' && t.rang === 'Hameau')!
  assert.deepEqual(h2.metiersBase, [
    { metier: 'Chasseur', places: 50 },
    { metier: 'Garde', places: 2 },
    { metier: 'Commerçant', places: 1 },
  ], 'texte converti en tableau : pluriels au singulier, entrée inconnue ignorée')
  assert.ok(!('metiersDisponibles' in h2), 'la clé TEXTE disparaît après conversion')
  assert.ok(!('batimentsVille' in C.config) && !('amenagements' in C.config),
    'les tables legacy ne sont plus persistées')
  // idempotence : la re-lecture d une config déjà convertie est stable
  const C2 = cfgOf(C.config)
  const h3 = C2.config.typesHabitation.find((t) => t.type === 'Ville' && t.rang === 'Hameau')!
  assert.equal(h3.metiersBase.length, 3, 're-lecture : le tableau converti survit tel quel')
})

test('config : les effets moteur (écoles / santé) vivent en DONNÉES dans la table canonique constructions — vue batiments dérivée', () => {
  const c = cloneDefaultConfig()
  const herbo = c.constructions.find((x) => x.nom === 'Herboristerie')!
  assert.equal(herbo.malContraction, 0.05, 'malContraction en donnée dans constructions')
  assert.equal(herbo.bonusGuerison, 0.05, 'bonusGuerison en donnée dans constructions')
  const ecole = c.constructions.find((x) => x.nom === 'Ecole élémentaire')!
  assert.equal(ecole.ecoleRang, 1, 'ecoleRang en donnée dans constructions')
  assert.ok(c.batiments.some((b) => b.nom === 'Guilde des médecins' && b.bonusGuerisonGlobal === 0.10),
    'la vue batiments garde la Guilde des médecins (livret, non constructible — arbitrage ouvert)')
  assert.ok(c.batiments.some((b) => b.nom === 'Ecole élémentaire' && b.ecoleRang === 1),
    'la vue batiments dérive les écoles de la table canonique')
  assert.ok(!('batimentsVille' in c) && !('batimentsChateau' in c)
    && !('batimentsCouts' in c) && !('amenagements' in c),
    'les défauts ne portent plus les tables legacy')
})

// ── Simplification (retour Thibaut 2026-10-23) : la mécanique
//    d'ÉDUCATION est retirée ────────────────────────────────────

test('config : la mécanique d éducation est retirée — table educations absente, champ education des métiers dépouillé (idempotent)', () => {
  const c = cloneDefaultConfig()
  assert.ok(!('educations' in c),
    'les défauts ne portent plus la table educations (mécanique supprimée)')
  assert.ok(c.metiers.every((m) => !('education' in m)),
    'les métiers n ont plus de champ education')
  // une config sauvegardée qui les porte encore (clés orphelines) :
  ;(c as unknown as Record<string, unknown>).educations = ['Agricole']
  ;(c.metiers[0] as unknown as Record<string, unknown>).education = 'Agricole'
  const C = cfgOf(c)
  assert.ok(!('educations' in C.config),
    'educations est supprimée par cfgOf (clé orpheline non persistée)')
  assert.ok(C.config.metiers.every((m) => !('education' in m)),
    'le champ education est dépouillé des métiers')
  // idempotence : la re-lecture d une config déjà nettoyée est stable
  const C2 = cfgOf(C.config)
  assert.ok(!('educations' in C2.config) && C2.config.metiers.every((m) => !('education' in m)),
    're-lecture : toujours absentes')
})

// ── Fiche bâtiments rang 2 (retour Thibaut 2026-10-26) : les
//    bâtiments rang ≥ 2 sont DE RETOUR — les configs monde
//    sauvegardées avant sont RESYNCÉES sur le référentiel ──────

test('config : les BÂTIMENTS rang 2 sont réactivés, les configs resyncées sur le référentiel (fiche bâtiments 2026-10-26)', () => {
  const c = cloneDefaultConfig()
  // fiche bâtiments 2026-10-26 : les 23 bâtiments rang 2 (Caserne,
  //  Réseau de routes, Tour de sorcier, quartiers, ports, guildes…)
  //  sont au référentiel — répartis Ville et Château.
  const rang2defs = c.constructions.filter((x) => x.categorie === 'Bâtiment' && (x.rangMinHabitation ?? 0) >= 2)
  assert.equal(rang2defs.length, 23, `23 bâtiments rang 2 attendus au référentiel (trouvé ${rang2defs.length})`)
  // une config monde SAUVEGARDÉE AVANT (vieux « Moulin à vent » rang 2
  //  aux effets/coûts obsolètes) est RESYNCÉE : purge de TOUS les
  //  bâtiments rang ≥ 2, réinjection des valeurs du RÉFÉRENTIEL
  //  courant — jamais de doublon.
  c.schemaVersion = 5 // déjà convergée : la purge joue quand même
  c.constructions.push({
    categorie: 'Bâtiment', groupe: 'Ville', famille: 'Economique',
    nom: 'Moulin à vent', cout: '40 Bois',
    production: 'Consomme 1 Charbon par tour. +60 Nourriture par tour.',
    description: 'Moulin actionné par le vent.',
    effets: [{ ressource: 'Charbon', quantite: -1 }, { ressource: 'Nourriture', quantite: 60 }],
    rangMinHabitation: 2,
  })
  const C = cfgOf(c)
  const moulins = C.config.constructions.filter((x) => x.nom === 'Moulin à vent' && x.categorie === 'Bâtiment')
  assert.equal(moulins.length, 1,
    'le Moulin à vent revient en UN seul exemplaire (le vieux est purgé, le référentiel réinjecté)')
  assert.deepEqual(moulins[0].effets, [{ ressource: 'Charbon', quantite: -1 }],
    'les effets sont ceux du RÉFÉRENTIEL (resync), pas ceux de la vieille config')
  // (2026-10-27, retour Thibaut : coût en DONNÉES `couts` + champ
  //  `requis` dédié — plus de texte « Silo à grain requis, 15 Or… ».)
  assert.equal(moulins[0].cout, '', 'le texte de coût est vidé')
  assert.equal(moulins[0].requis, 'Silo à grain', 'prérequis de la fiche (champ dédié)')
  assert.deepEqual(moulins[0].couts, [
    { ressource: 'Or', valeur: 15 }, { ressource: 'Bois', valeur: 4 }, { ressource: 'Bétail', valeur: 4 },
  ], 'coût de la fiche (paires ressource/valeur)')
  // tous les bâtiments rang 2 du référentiel passent la convergence
  const rang2C = C.config.constructions.filter((x) => x.categorie === 'Bâtiment' && (x.rangMinHabitation ?? 0) >= 2)
  assert.equal(rang2C.length, rang2defs.length, 'ni perdus, ni doublés par la convergence')
  // idempotence : la re-lecture d une config déjà resyncée est stable
  const C2 = cfgOf(C.config)
  assert.equal(C2.config.constructions.length, C.config.constructions.length,
    're-lecture : la purge/réinjection est idempotente')
})

// ── (Retour Thibaut 2026-10-27 « idem bâtiments/aménagements ») : le
//    coût des TYPES D'HABITATION passe aux DONNÉES `couts` ──────────

test('config : le coût des types d habitation vit en DONNÉES `couts` (paires ressource/valeur), le texte est vidé', () => {
  // Verrou global sur le RÉFÉRENTIEL : chaque rang porte des paires
  //  {ressource, valeur} et un TEXTE de coût vide — plus rien à
  //  analyser (l analyseur de texte est retiré du moteur).
  const defs = cfgOf(undefined).config.typesHabitation
  assert.equal(defs.length, 6, '6 rangs d habitation attendus (Ville + Château)')
  for (const d of defs) {
    assert.ok(Array.isArray(d.couts) && d.couts.length > 0,
      `${d.type}/${d.rang} : champ couts attendu (données structurées)`)
    assert.ok(!d.cout, `${d.type}/${d.rang} : le texte de coût doit être vidé`)
  }
  // Fidélité : Hameau = 20 Or + 10 Bois + 6 Bétail (l ancienne
  //  chaîne « 20 Or + 10 Bois + 6 Bétail »), Forteresse = 120 Or +
  //  10 Pierre + 12 Fer (l ancien « 12 Fer » au singulier du stock).
  const hameau = defs.find((d) => d.type === 'Ville' && d.rang === 'Hameau')
  assert.deepEqual(hameau?.couts, [
    { ressource: 'Or', valeur: 20 }, { ressource: 'Bois', valeur: 10 }, { ressource: 'Bétail', valeur: 6 },
  ], 'coût du Hameau (paires ressource/valeur)')
  const forteresse = defs.find((d) => d.type === 'Château' && d.rang === 'Forteresse')
  assert.deepEqual(forteresse?.couts, [
    { ressource: 'Or', valeur: 120 }, { ressource: 'Pierre', valeur: 10 }, { ressource: 'Fer', valeur: 12 },
  ], 'coût de la Forteresse (paires ressource/valeur)')
})

test('config : une config sauvegardée AVANT la migration reçoit les `couts` du défaut de même (type, rang) — champ sauvegardé prioritaire', () => {
  // Une config d avant le 2026-10-27 ne porte PAS `couts` (seul le
  //  TEXTE existait) : migrerTypesHabitation complète les paires
  //  depuis la ligne du défaut de même (type, rang), idempotent.
  const c = cloneDefaultConfig()
  for (const d of c.typesHabitation) delete d.couts
  const C = cfgOf(c)
  const hameau = C.config.typesHabitation.find((d) => d.type === 'Ville' && d.rang === 'Hameau')
  assert.deepEqual(hameau?.couts, [
    { ressource: 'Or', valeur: 20 }, { ressource: 'Bois', valeur: 10 }, { ressource: 'Bétail', valeur: 6 },
  ], 'les paires sont complétées depuis le défaut')
  // idempotence : la re-lecture d une config déjà complétée est stable
  const C2 = cfgOf(C.config)
  assert.deepEqual(C2.config.typesHabitation.find((d) => d.type === 'Ville' && d.rang === 'Hameau')?.couts,
    hameau?.couts, 're-lecture : les paires survivent')
  // un rang PERSONNALISÉ (absent du défaut) reçoit un coût vide
  //  (gratuit), pas de crash.
  const c3 = cloneDefaultConfig()
  c3.typesHabitation[0] = { ...c3.typesHabitation[0], rang: 'Bourgade' }
  delete (c3.typesHabitation[0] as { couts?: unknown }).couts
  const C3 = cfgOf(c3)
  const bourgade = C3.config.typesHabitation.find((d) => d.rang === 'Bourgade')
  assert.deepEqual(bourgade?.couts, [], 'rang personnalisé : coût vide (gratuit)')
})

// ── Retrait intégral des règles de factions + textes « Ministre »
//    vidés (retour arbitre Thibaut 2026-10-24) ─────────────────────

test('config : fiches de peuples vidées (règles de factions retirées intégralement), même d une config déjà convergée', () => {
  const c = cloneDefaultConfig()
  // les défauts ne portent plus que les noms (description + lignes vides)
  assert.ok(c.peuplesLibres.every((p) => p.description === '' && (p.lignes ?? []).length === 0),
    'défauts peuplesLibres : descriptions et lignes vides, noms conservés')
  assert.ok(c.peuplesAutres.every((p) => p.description === '' && (p.lignes ?? []).length === 0),
    'défauts peuplesAutres : descriptions et lignes vides')
  // une config SAUVEGARDÉE AVANT garde ses fiches pleines + les
  //  reliquats structurés (reglesBase/ageII/ageIII d'avant le
  //  2026-10-19, encore rendus par l'onglet Peuples)
  c.schemaVersion = 5 // déjà convergée : le garde-fou joue quand même
  c.peuplesLibres = [{
    nom: 'Basiléens', description: 'Fiche ancienne',
    lignes: [{ label: 'Âge III — Suzeraineté', texte: 'Vous pouvez posséder 1 Ministre supplémentaire.' }],
    reglesBase: [{ nom: 'Vieille règle', texte: 'reliquat' }],
    ageII: [{ nom: 'Savoir ancestral', texte: 'reliquat' }],
  } as GameConfig['peuplesLibres'][number]]
  const C = cfgOf(c)
  const bas = C.config.peuplesLibres.find((p) => p.nom === 'Basiléens')
  assert.ok(bas, 'la fiche Basiléens reste (nom conservé)')
  assert.equal(bas!.description, '', 'description vidée par le garde-fou')
  assert.equal((bas!.lignes ?? []).length, 0, 'lignes de règles vidées')
  assert.ok(bas && !('reglesBase' in bas), 'reliquats structurés (reglesBase/ageII) retirés')
  assert.ok(C.config.peuplesLibres.every((p) => p.description === '' && (p.lignes ?? []).length === 0),
    'aucune fiche peuplesLibres ne garde de règles')
  assert.ok(C.config.peuplesAutres.every((p) => p.description === '' && (p.lignes ?? []).length === 0),
    'aucune fiche peuplesAutres ne garde de règles')
  // idempotence : la re-lecture d une config déjà vidée est stable
  const C2 = cfgOf(C.config)
  assert.equal(C2.config.peuplesLibres.length, C.config.peuplesLibres.length,
    're-lecture : le garde-fou ne retire rien de plus (idempotent)')
})

test('config : la ligne titre « Ministre » reste, ses textes sont vidés (retour arbitre 2026-10-24)', () => {
  const c = cloneDefaultConfig()
  const min = c.metiers.find((t) => t.metier === 'Ministre')
  assert.ok(min, 'la ligne titre « Ministre » reste dans la table métiers')
  assert.equal(min!.description, '', 'description vide dans les défauts')
  // une config SAUVEGARDÉE AVANT garde les anciens textes morts
  c.schemaVersion = 5 // déjà convergée : le garde-fou joue quand même
  min!.description = 'Plusieurs autorisés'
  const eff = c.metiersEffets.find((t) => t.metier === 'Ministre')!
  eff.effet = 'Octroie un ministre qui appartient à un ministère, maximum 1.'
  eff.revocation = '30 Or\n+ 6  Soie'
  const C = cfgOf(c)
  const mMin = C.metiers.find((t) => t.metier === 'Ministre')!
  assert.equal(mMin.description, '', 'description vidée par le garde-fou')
  assert.equal(mMin.attribution, 'Manuelle', 'la ligne titre reste attribuable (inerte)')
  const eMin = C.config.metiersEffets.find((t) => t.metier === 'Ministre')!
  assert.equal(eMin.effet, '', 'effet vidé')
  assert.equal(eMin.revocation, '', 'coût de révocation vidé')
  assert.ok(C.metiers.some((t) => t.metier === 'Ministre'), 'la ligne titre reste dans la table convergée')
  // idempotence : la re-lecture d une config déjà vidée est stable
  const C2 = cfgOf(C.config)
  assert.equal(C2.metiers.find((t) => t.metier === 'Ministre')!.description, '',
    're-lecture : le garde-fou ne change rien de plus (idempotent)')
})

// ── F6 (audit 2026-10-27) : validation de forme d'une config importée ──
test('F6 : validerFormeConfig accepte une config saine et refuse les champs au mauvais type', () => {
  // config saine : aucun problème
  const saine = cloneDefaultConfig()
  assert.equal(validerFormeConfig(saine).length, 0, 'une config par défaut est de forme acceptable')
  assert.equal(validerFormeConfig({}).length, 0, 'un objet vide (clés absentes) est acceptable')
  // champs au mauvais type : refus, un problème par table fautive
  const mauvaise = { ...cloneDefaultConfig(), constructions: 42, params: ' Oops' }
  const problemes = validerFormeConfig(mauvaise)
  assert.ok(problemes.includes('« constructions » doit être un tableau'), `problème constructions manquant : ${problemes.join(' ; ')}`)
  assert.ok(problemes.includes('« params » doit être un objet'), `problème params manquant : ${problemes.join(' ; ')}`)
  // non-objet : refus explicite
  assert.equal(validerFormeConfig('config').length, 1, 'une string est refusée')
  assert.equal(validerFormeConfig([1, 2]).length, 1, 'un tableau est refusé')
  // les tables valides ne lèvent PAS de faux positif
  const bonne = { ...cloneDefaultConfig(), metiers: [] }
  assert.equal(validerFormeConfig(bonne).length, 0, 'un tableau vide (même vide → garde-fous) reste de forme valide')
})
