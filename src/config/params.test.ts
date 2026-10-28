// ═══════════════════════════════════════════════════════════════════════════
//  TESTS PARAMÈTRES — renommages v3 + Gompertz + conversion config v2
//  (rework habitants, 2026-10-20)
//
//   · mergeParams traduit les ANCIENNES clés titreXxx → metierXxx sans
//     jamais écraser une clé nouvelle déjà fournie ;
//   · les défauts Gompertz (0.0025 / 0.08 / 0.9) et les caps Chasseur
//     (Ville 50 / Château 25) sont verrouillés, ageMax est rayé ;
//   · cfgOf convertit une config v2 (titres/titresEffets — l'effet de
//     tech prodParTitre a été retiré avec le système de progrès)
//     une seule fois et tamponne schemaVersion = 3 ; une config déjà
//     convergée (schemaVersion 3) ignore les vieux champs.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PARAMS, mergeParams } from './params'
import { cfgOf, cloneDefaultConfig, SCHEMA_VERSION_CONFIG } from './defaultConfig'

test('mergeParams : les anciennes clés titreXxx sont traduites en metierXxx', () => {
  const p = mergeParams({
    titreChasseur: 'Veneur',
    titreGouverneur: 'Intendant',
    mariageBonusTitre: 1.5,
  })
  assert.equal(p.metierChasseur, 'Veneur', 'titreChasseur → metierChasseur')
  assert.equal(p.metierGouverneur, 'Intendant', 'titreGouverneur → metierGouverneur')
  assert.equal(p.mariageBonusMetier, 1.5, 'mariageBonusTitre → mariageBonusMetier')
  assert.ok(!('titreChasseur' in p), 'la clé ancienne disparaît du résultat')
  assert.ok(!('titreGouverneur' in p))
})

test('mergeParams : la clé NOUVELLE prime sur l ancienne, quel que soit l ordre', () => {
  const a = mergeParams({ metierChasseur: 'Pisteur', titreChasseur: 'Veneur' })
  assert.equal(a.metierChasseur, 'Pisteur', 'nouvelle clé d abord : elle prime')
  const b = mergeParams({ titreChasseur: 'Veneur', metierChasseur: 'Pisteur' })
  assert.equal(b.metierChasseur, 'Pisteur', 'ancienne clé d abord : elle est écrasée par la nouvelle')
})

test('défauts v3 : Gompertz 0.0025/0.08/0.9, caps Chasseur supprimées (vague 3b), ageMax rayé', () => {
  assert.equal(DEFAULT_PARAMS.maladieBase, 0.0025)
  assert.equal(DEFAULT_PARAMS.maladiePente, 0.08)
  // (RETRAIT 2026-10-25 : maladieCap et modMaladieEnceinte supprimés)
  assert.ok(!('maladieCap' in DEFAULT_PARAMS), 'maladieCap retiré (2026-10-25)')
  assert.ok(!('modMaladieEnceinte' in DEFAULT_PARAMS), 'modMaladieEnceinte retiré (2026-10-25)')
  assert.ok(!('capMetierChasseurVille' in DEFAULT_PARAMS), 'capMetierChasseurVille supprimé (vague 3b : cap = base du rang + emplacements)')
  assert.ok(!('capMetierChasseurChateau' in DEFAULT_PARAMS), 'capMetierChasseurChateau supprimé (vague 3b)')
  assert.ok(!('ageMaxBase' in DEFAULT_PARAMS), 'ageMaxBase disparaît (mortalité Gompertz seule)')
  assert.ok(!('ageMaxAla' in DEFAULT_PARAMS))
})

test('cfgOf : conversion v2 → courante (titres → metiers, champ interne renommé, purge de la table progres), tampon schemaVersion', () => {
  const cfg = cloneDefaultConfig()
  const asAny = cfg as unknown as Record<string, unknown>
  // referentiel v2 : table `titres` avec champ `titre`
  asAny.titres = [{
    titre: 'Testeur', education: '', valeur1: 1, ressource1: 'Or',
    valeur2: 0, ressource2: '', description: 'Métier de test', nobleSeul: false,
    regleGenre: '', attribution: 'Manuelle',
  }]
  delete asAny.metiers
  // banque v2 : `titresEffets` avec champ `titre`
  asAny.titresEffets = [{ titre: 'Testeur', effet: 'Riche', revocation: 'Aucune' }]
  delete asAny.metiersEffets
  // (RETRAIT 2026-10-24 : l'effet de tech v2 prodParTitre n'est plus
  //  testé — la table `progres` est purgée par cfgOf avec le système
  //  de progrès, l'ancienne config ne porte plus que la clé morte.)
  asAny.progres = [{ nom: 'Arbre v2', age: 1, brancheA: [], brancheB: [], techC: { nom: '', cout: '', description: '' } }]
  asAny.schemaVersion = 2
  const C = cfgOf(cfg)
  assert.equal(SCHEMA_VERSION_CONFIG, 5)
  assert.equal(C.config.schemaVersion, 5, 'tampon posé à la version courante')
  // referentiel converti : table metiers, champ metier — la vague 3a
  //  (migration metiersAmenagements2026) AJOUTE les métiers manquants
  //  du nouveau référentiel derrière la table convertie : 1 Testeur +
  //  24 (le Marchand est retiré du jeu le 2026-10-24 ; le GUÉRISSEUR
  //  est ajouté le 2026-10-25 — arbitre : +2 % guérison, −2 %
  //  contraction, poste d'Herboristerie).
  assert.equal(C.metiers.length, 25)
  assert.equal(C.metiers[0].metier, 'Testeur', 'le champ interne titre devient metier')
  assert.ok(C.metiers.some((m) => m.metier === 'Fermier'), 'vague 3a : les métiers manquants sont ajoutés')
  assert.ok(!C.metiers.some((m) => m.metier === 'Propagandiste'), 'vague 3a : Propagandiste retiré')
  assert.ok(!C.metiers.some((m) => m.metier === 'Marchand'), 'Marchand retiré du jeu (2026-10-24) : purge de cfgOf')
  // banque convertie : champ interne renommé aussi (Testeur + 11 défauts
  //  — l entrée Marchand a disparu du référentiel avec le métier)
  assert.equal(C.config.metiersEffets.length, 12)
  assert.equal(C.config.metiersEffets[0].metier, 'Testeur')
  // (RETRAIT 2026-10-24 : la table `progres` de la config v2 est
  //  purgée par cfgOf — plus rien ne reste du système de progrès.)
  assert.equal((C.config as unknown as { progres?: unknown }).progres, undefined)
  // convergée : un second passage ne casse rien (le tampon tient)
  const C2 = cfgOf(C.config)
  assert.equal(C2.metiers[0].metier, 'Testeur')
})

test('cfgOf : une config DÉJÀ convergée ignore les champs v2 restants', () => {
  const cfg = cloneDefaultConfig()
  const asAny = cfg as unknown as Record<string, unknown>
  // v4 = tampon courant (bumpé par la migration des aménagements,
  //  retour Thibaut 2026-10-22) : les configs tamponnées au numéro
  //  précédent REPASSENT par les migrations — la conversion v2 → v3
  //  rejouerait sur les restes de `titres` ; ce test garantit qu'une
  //  config au tampon COURANT n'est plus re-migrée.
  asAny.schemaVersion = SCHEMA_VERSION_CONFIG
  asAny.titres = [{ titre: 'Fantôme', education: '', valeur1: 0, ressource1: '', valeur2: 0, ressource2: '', description: '', nobleSeul: false, regleGenre: '', attribution: 'Manuelle' }]
  const C = cfgOf(cfg)
  // le référentiel par défaut prime (garde-fous), la table v2 est ignorée
  assert.ok(C.metiers.length > 1, 'le référentiel par défaut est conservé')
  assert.ok(!C.metiers.some((m) => m.metier === 'Fantôme'), 'la table titres n a pas été convertie (déjà convergée)')
})

test('cfgOf : suppression de la martialité (arbitrage 2026-10-21) — regleGenre « Martialité » → vide, clé martialite dépouillée, même sur config convergée', () => {
  const cfg = cloneDefaultConfig()
  cfg.schemaVersion = 3 // déjà convergée : la migration ciblée (z) doit jouer quand même
  cfg.metiers[0].regleGenre = 'Martialité'
  ;(cfg.cultures[0] as unknown as { martialite: string }).martialite = 'Masculine'
  const C = cfgOf(cfg)
  assert.ok(C.metiers.every((m) => m.regleGenre !== 'Martialité'), 'plus aucun métier régi par la martialité')
  assert.equal(C.metiers[0].regleGenre, '', 'regleGenre Martialité devient vide')
  assert.ok(C.cultures.every((c) => !('martialite' in c)), 'la clé martialite disparaît des cultures')
  assert.equal(C.config.martialiteSupprimee, true)
  // idempotente : un second passage ne casse rien (le marqueur tient)
  const C2 = cfgOf(C.config)
  assert.ok(C2.metiers.every((m) => m.regleGenre !== 'Martialité'))
})

test('params : les paramètres d éducation (chanceEduc*, profBonusEduc) sont supprimés — professeurBaseChance reste (Professeurs conservés)', () => {
  assert.ok(!('chanceEducRoturier' in DEFAULT_PARAMS), 'chanceEducRoturier supprimé (mécanique d éducation retirée)')
  assert.ok(!('chanceEducNoble' in DEFAULT_PARAMS), 'chanceEducNoble supprimé')
  assert.ok(!('profBonusEduc' in DEFAULT_PARAMS), 'profBonusEduc supprimé')
  assert.ok('professeurBaseChance' in DEFAULT_PARAMS, 'professeurBaseChance reste (les Professeurs restent)')
})

test('défauts taxes 2026-10-28 : Nourriture ×1,25/×0,75 du côté des naissances, autres ressources ×0,75/×1,25 à l\'envers', () => {
  // Arbitrage Thibaut 2026-10-28 « changement des taxes » : les clés
  //  taxNourr* sont NOUVELLES ; les clés taxOr* changent de SENS (elles
  //  ne portent plus que les ressources hors Nourriture — valeurs
  //  inchangées) ; les naissances (taxNaiss*) ne bougent pas.
  assert.equal(DEFAULT_PARAMS.taxNourrFaibles, 1.25, 'Faible : Nourriture ×1,25')
  assert.equal(DEFAULT_PARAMS.taxNourrHautes, 0.75, 'Forte : Nourriture ×0,75')
  assert.equal(DEFAULT_PARAMS.taxOrFaibles, 0.75, 'Faible : autres ressources ×0,75')
  assert.equal(DEFAULT_PARAMS.taxOrHautes, 1.25, 'Forte : autres ressources ×1,25')
  assert.equal(DEFAULT_PARAMS.taxNaissFaibles, 1.25, 'naissances ×1,25 en Faible (inchangé)')
  assert.equal(DEFAULT_PARAMS.taxNaissHautes, 0.75, 'naissances ×0,75 en Forte (inchangé)')
  // Une config SAUVEGARDÉE (avant l'arbitrage) reçoit les défauts des
  //  clés nouvelles sans perdre ses personnalisations.
  const p = mergeParams({ taxOrFaibles: 0.8 })
  assert.equal(p.taxNourrFaibles, 1.25, 'clé nouvelle absente de la config → défaut posé par le merge')
  assert.equal(p.taxNourrHautes, 0.75)
  assert.equal(p.taxOrFaibles, 0.8, 'personnalisation existante conservée')
})
