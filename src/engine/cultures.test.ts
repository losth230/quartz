// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DES 12 LOIS DES CULTURES (refonte du 2026-10-29)
//
//  Chaque culture porte une LOI DE VILLE (culture majoritaire de la
//  cité — parc de logements, emplacements de Scientifique, fermiers
//  d'été, routes, garnison) et une LOI D'HABITANT (culture PROPRE du
//  personnage, où qu'il vive — nobles et gardes). Ces tests
//  verrouillent les DÉFAUTS du référentiel (les 12 lois) et le
//  comportement moteur de chacune. L'ANCIEN système (règles de pays
//  « +N par habitation de cette culture dans le monde », banque
//  source 'culture') est RETIRÉ — testé pour absence dans
//  rules/registre.test.ts et rules/regimes-cultures.test.ts.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cfgOf, cultureDef } from './gameData'
import { partieMock } from '../rules/mocks'
import { migrerCultures, type CultureDef } from '../config/defaultConfig'
import { domicilesCultureVille } from './domiciles'
import { logementsVille } from './bonheur'
import { capMetierVille } from './metiers'
import { detailGainsVille, multProdRang, consoNourrHabitant } from './economie'
import { maxRoutesJoueur } from './commerce'
import { rangDe, seuilBourgeoisCulture, rangSocial } from './statutSocial'
import { maladieStep, probaContracterMaladie } from './sante'
import type { Rng } from './rng'
import { garnisonHabitationVille, malusFerveurMartiale } from './garnisons'
import { rangNiveau } from './rangs'
import { loisHabitants, detailLoisHabitants } from './regimes'
import type { Player, PlayerRecap } from './types'

// ── référentiel : les 12 lois et leurs défauts, verrouillés ────────────────

test('référentiel : les 12 lois des cultures (défauts verrouillés)', () => {
  const C = cfgOf(undefined)
  const com = cultureDef('Communautarisme', C.config)!
  const dei = cultureDef('Déisme', C.config)!
  const lun = cultureDef('Lunisme', C.config)!
  const nat = cultureDef('Naturalisme', C.config)!
  const set = cultureDef('Sethisme', C.config)!
  const zel = cultureDef('Zélotisme', C.config)!
  // Communautarisme : Logements élargis + Bourgeoisie facile
  assert.equal(com.taudisParHabitation, 5)
  assert.equal(com.prestigeSeuilBourgeois, 80)
  // Déisme : Monuments pieux + Lavages de main
  assert.equal(dei.scientifiqueParBatiment, 1)
  assert.equal(dei.maladieContractMod, -0.02)
  // Lunisme : Villes Saintes + Foi supérieure
  assert.equal(lun.palaisParHabitation, 2)
  assert.equal(lun.tourismeParNoble, 1)
  // Naturalisme : Champs nourriciers + Walpurgis
  assert.equal(nat.nourrEteParFermier, 1)
  assert.equal(nat.fertFactor, 1.1, 'Walpurgis : fertFactor 1,1 (+10 % de naissances)')
  // Sethisme : Caravanes + Conseil des Sages
  assert.equal(set.caravanesSeuilAmenagements, 3)
  assert.equal(set.caravanesRoutesBonus, 1)
  assert.equal(set.scienceParNoble, 0.1)
  // Zélotisme : Ferveur martiale + Corps de fer
  assert.equal(zel.garnisonHorsCultureParRang, 20)
  assert.equal(zel.garnisonParGardeCulture, 10)
  assert.equal(zel.orParGarde, 0.2)
  // anciens champs morts : PLUS AUCUN dans le référentiel
  for (const c of [com, dei, lun, nat, set, zel] as unknown as Record<string, unknown>[]) {
    assert.equal(c.reglePays, undefined, 'reglePays supprimé du référentiel')
    assert.equal(c.reglePerso, undefined, 'reglePerso supprimé du référentiel')
    assert.equal(c.capitalNourrParHabMonde, undefined, 'capital* supprimé du référentiel')
    assert.equal(c.scienceParConstruction, undefined, 'scienceParConstruction supprimé')
  }
})

test('migrerCultures : vieilles configs → nouveaux champs, clés mortes supprimées', () => {
  const C = cfgOf(undefined)
  const vieille = C.config.cultures.map((c) => ({
    nom: c.nom, heredite: c.heredite, homoAutorisee: c.homoAutorisee,
    fertFactor: 1,
    reglePays: 'ANCIENNE', reglePerso: 'ANCIENNE',
    capitalNourrParHabMonde: 3, scienceParConstruction: 4,
  })) as unknown as CultureDef[]
  const migrees = migrerCultures(vieille)
  const nat = migrees.find((c) => c.nom === 'Naturalisme')!
  // fertFactor 1 = ancien défaut non édité → nouveau défaut (Walpurgis 1,1)
  assert.equal(nat.fertFactor, 1.1, 'patron taxes25 : ancien défaut 1 ne bloque pas Walpurgis')
  // textes des lois : les NOUVEAUX défauts (les anciens textes décrivent des lois retirées)
  assert.equal(nat.regleVille, cultureDef('Naturalisme', C.config)?.regleVille)
  // champ de loi complété depuis le défaut
  assert.equal(nat.nourrEteParFermier, 1)
  // clés mortes supprimées (construction explicite)
  const rec = nat as unknown as Record<string, unknown>
  assert.equal(rec.reglePays, undefined, 'clé morte reglePays supprimée')
  assert.equal(rec.reglePerso, undefined, 'clé morte reglePerso supprimée')
  assert.equal(rec.capitalNourrParHabMonde, undefined, 'clé morte capital* supprimée')
  assert.equal(rec.scienceParConstruction, undefined, 'clé morte scienceParConstruction supprimée')
  // valeur ÉDITÉE par l'utilisateur : prime
  const editee = vieille.map((c) => ({ ...c, fertFactor: 0.9 }))
  const m2 = migrerCultures(editee)
  assert.equal(m2.find((c) => c.nom === 'Naturalisme')!.fertFactor, 0.9,
    'une fécondité éditée (≠ ancien défaut) est conservée')
})

// ── Communautarisme « Logements élargis » / Lunisme « Villes Saintes » ────

test('lois de ville : +5 Taudis (Communautarisme) / +2 Palais (Lunisme) au parc', () => {
  const ctx = partieMock()
  const { state, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  const base = logementsVille(ville, C)
  ville.culture = 'Communautarisme'
  assert.deepEqual(domicilesCultureVille(ville, C), [{ domicile: 'Taudis', nombre: 5 }])
  assert.equal(logementsVille(ville, C), base + 5, '+5 Taudis comptés dans le parc (bonheur)')
  ville.culture = 'Lunisme'
  assert.deepEqual(domicilesCultureVille(ville, C), [{ domicile: 'Palais', nombre: 2 }])
  assert.equal(logementsVille(ville, C), base + 2, '+2 Palais comptés dans le parc')
  ville.culture = 'Zélotisme'
  assert.deepEqual(domicilesCultureVille(ville, C), [], 'les cultures sans loi de logement ne rapportent rien')
})

// ── Déisme « Monuments pieux » ─────────────────────────────────────────────

test('Déisme « Monuments pieux » : +1 place de Scientifique par BÂTIMENT DE FACTION', () => {
  const ctx = partieMock()
  const { state, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  // (retour arbitre Thibaut 2026-10-29 : « les bâtiments de faction
  //  vont revenir, laisse le Monuments pieux sur eux ») — la loi
  //  compte les seuls bâtiments portant le marqueur. Aucune entrée
  //  du référentiel ne le porte aujourd'hui : on en INJECTE deux
  //  (même patron que les tiers 2/3 de pays/Constructions.test.ts).
  C.config.constructions.push(
    { categorie: 'Bâtiment', groupe: 'Ville', famille: 'Economique', nom: 'Sanctuaire', batimentDeFaction: true },
    { categorie: 'Bâtiment', groupe: 'Ville', famille: 'Militaire', nom: 'Grand autel', batimentDeFaction: true },
  )
  ville.batiments = ['Sanctuaire', 'Poste de garde', 'Grand autel']
  ville.amenagements = []
  ville.culture = 'Déisme'
  const capDeiste = capMetierVille('Scientifique', ville, C)
  ville.culture = 'Lunisme'
  const capAutre = capMetierVille('Scientifique', ville, C)
  assert.equal(capDeiste - capAutre, 2, '+1 par BÂTIMENT DE FACTION (2 sur 3 bâtiments), seulement en ville déiste')
  // bâtiments sans marqueur : la loi DORT (référentiel actuel = 0 partout)
  ville.culture = 'Déisme'
  ville.batiments = ['Poste de garde', 'Caserne']
  const capNormaux = capMetierVille('Scientifique', ville, C)
  ville.culture = 'Lunisme'
  assert.equal(capNormaux - capMetierVille('Scientifique', ville, C), 0, 'sans bâtiment de faction la loi dort à 0')
  // les aménagements ne comptent pas
  ville.culture = 'Déisme'
  ville.batiments = []
  ville.amenagements = ['Champ', 'Rizière', 'Champ']
  const capAmen = capMetierVille('Scientifique', ville, C)
  ville.culture = 'Lunisme'
  assert.equal(capAmen - capMetierVille('Scientifique', ville, C), 0, 'les aménagements sont exclus')
})

// ── Déisme « Lavages de main » ────────────────────────────────────────────

test('Déisme « Lavages de main » : −2 % de contraction (culture propre)', () => {
  const ctx = partieMock()
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  const pop = state.population[joueur.n] ?? []
  // neutraliser les modificateurs partagés (bâtiments, guérisseurs)
  ville.batiments = []
  for (const x of pop) if (x.metier === 'Guérisseur') x.metier = null
  const a = pop.find((c) => c.statut === 'Sain' && c.ville === ville.nom)!
  const b = pop.find((c) => c.statut === 'Sain' && c.ville === ville.nom && c.id !== a.id)!
  a.age = 100
  b.age = 100
  a.culture = 'Déisme'
  b.culture = 'Zélotisme'
  const pPure = probaContracterMaladie(a, C)
  // seuil ENTRE les deux probabilités : pZel = pPure, pDei = pPure − 0,02
  const rng = { chance: (q: number) => q > pPure - 0.01 } as unknown as Rng
  const recap = { evenements: [] } as unknown as PlayerRecap
  maladieStep(state, joueur, a, rng, recap)
  maladieStep(state, joueur, b, rng, recap)
  assert.equal(a.statut, 'Sain', 'le −2 % du Déisme évite la contraction')
  assert.equal(b.statut, 'Malade', 'sans la loi, la probabilité pleine contracte')
})

// ── Naturalisme « Champs nourriciers » ────────────────────────────────────

test('Naturalisme « Champs nourriciers » : +1 Nourriture par fermier en été', () => {
  const ctx = partieMock({ saison: 'Été' })
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  // fabriquer un fermier roturier dans la ville
  const vivants = (state.population[joueur.n] ?? []).filter(
    (c) => c.statut !== 'Décédé' && c.ville === ville.nom,
  )
  const fermier = vivants.find((c) => c.metier !== 'Garde')!
  fermier.metier = 'Fermier'
  fermier.prestige = 0
  ville.culture = 'Naturalisme'
  const avec = detailGainsVille(state, joueur, ville, C).metiers['Nourriture'] ?? 0
  ville.culture = 'Zélotisme'
  const sans = detailGainsVille(state, joueur, ville, C).metiers['Nourriture'] ?? 0
  const fermiers = (state.population[joueur.n] ?? []).filter(
    (c) => c.statut !== 'Décédé' && c.ville === ville.nom && c.metier === 'Fermier',
  )
  const attendu = fermiers.reduce((n, c) => n + multProdRang(c, C), 0)
  assert.equal(avec - sans, attendu, '+1 × multiplicateur de rang par fermier (été)')
  // hiver : le Fermier (métier `ete`) ne produit rien, bonus inclus
  state.saison = 'Hiver'
  ville.culture = 'Naturalisme'
  const hAvec = detailGainsVille(state, joueur, ville, C).metiers['Nourriture'] ?? 0
  ville.culture = 'Zélotisme'
  const hSans = detailGainsVille(state, joueur, ville, C).metiers['Nourriture'] ?? 0
  assert.equal(hAvec, hSans, 'hiver : ni la base ni le bonus des fermiers')
})

// ── Communautarisme « Bourgeoisie facile » ─────────────────────────────────

test('Communautarisme « Bourgeoisie facile » : bourgeois dès 80 de prestige', () => {
  const C = cfgOf(undefined)
  assert.equal(seuilBourgeoisCulture('Communautarisme', C), 80)
  assert.equal(seuilBourgeoisCulture('Lunisme', C), 100, 'défaut 100 pour les autres cultures')
  assert.equal(seuilBourgeoisCulture(undefined, C), 100)
  assert.equal(rangSocial(85), 'roturier', 'appel direct : défaut 100 conservé')
  assert.equal(rangSocial(85, 80), 'bourgeois', 'seuil paramétré : 85 ≥ 80')
  const ctx = partieMock()
  const { state, joueur } = ctx
  const c = (state.population[joueur.n] ?? []).find((x) => x.statut !== 'Décédé')!
  c.dynastie = ''
  c.prestige = 85
  c.culture = 'Communautarisme'
  assert.equal(rangDe(c, C), 'bourgeois', '85 ≥ 80 : bourgeois pour un communautariste')
  assert.equal(consoNourrHabitant(c, C), C.p.consoNourrBourgeois, 'la consommation suit le rang')
  c.culture = 'Lunisme'
  assert.equal(rangDe(c, C), 'roturier', '85 < 100 : roturier pour les autres cultures')
  assert.equal(consoNourrHabitant(c, C), C.p.consoNourrParHab)
})

// ── Sethisme « Caravanes » ────────────────────────────────────────────────

test('Sethisme « Caravanes » : +1 route au cap par ville sethiste à ≥3 aménagements', () => {
  const ctx = partieMock()
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  const base = maxRoutesJoueur(joueur, C)
  ville.culture = 'Sethisme'
  ville.amenagements = []
  assert.equal(maxRoutesJoueur(joueur, C), base, '0 aménagement : pas de bonus')
  ville.amenagements = ['Champ', 'Rizière']
  assert.equal(maxRoutesJoueur(joueur, C), base, '2 aménagements : sous le seuil (3)')
  ville.amenagements = ['Champ', 'Rizière', 'Champ']
  assert.equal(maxRoutesJoueur(joueur, C), base + 1, '3 aménagements : +1 route au cap du joueur')
  ville.culture = 'Lunisme'
  assert.equal(maxRoutesJoueur(joueur, C), base, 'hors culture sethiste : pas de bonus')
})

// ── lois d'habitants : nobles et gardes (Lunisme, Sethisme, Zélotisme) ─────

test('lois d\'habitants : nobles +1 Tourisme (Lunisme), +0,1 Science (Sethisme), gardes +0,2 Or (Zélotisme)', () => {
  const ctx = partieMock()
  const { state, joueur } = ctx
  const C = cfgOf(state.config)
  const vivants = (state.population[joueur.n] ?? []).filter((c) => c.statut !== 'Décédé')
  const a = vivants[0]
  const b = vivants[1]
  const d = vivants[2]
  a.dynastie = ''
  a.prestige = 300
  a.culture = 'Lunisme'
  b.dynastie = ''
  b.prestige = 300
  b.culture = 'Sethisme'
  d.dynastie = ''
  d.prestige = 0
  d.metier = C.p.metierGarde
  d.culture = 'Zélotisme'
  // tous les autres : culture sans loi de production
  for (const x of vivants.slice(3)) x.culture = 'Déisme'
  const out = loisHabitants(state, joueur, C)
  assert.equal(out['Tourisme'], 1, 'Foi supérieure : 1 noble luniste → +1 Tourisme')
  assert.equal(out['Science'], 0.1, 'Conseil des Sages : 1 noble sethiste → +0,1 Science')
  assert.equal(out['Or'], 0.2, 'Corps de fer : 1 garde zélotiste → +0,2 Or')
  const det = detailLoisHabitants(state, joueur, C)
  assert.equal(det.length, 3)
  assert.ok(det.some((l) => l.loi === 'Foi supérieure' && l.nb === 1 && l.total === 1))
  assert.ok(det.some((l) => l.loi === 'Conseil des Sages' && l.nb === 1 && l.total === 0.1))
  assert.ok(det.some((l) => l.loi === 'Corps de fer' && l.nb === 1 && l.total === 0.2))
  // un noble de culture sans loi ne rapporte rien
  a.culture = 'Déisme'
  const out2 = loisHabitants(state, joueur, C)
  assert.equal(out2['Tourisme'], undefined, 'le Tourisme des nobles suit la culture propre')
  // culture inconnue (hors référentiel) : aucune loi
  for (const x of vivants) x.culture = 'Culture Nordique'
  assert.deepEqual(loisHabitants(state, joueur, C), {})
  assert.deepEqual(detailLoisHabitants(state, joueur, C), [])
})

// ── Zélotisme « Corps de fer » (garnison) ──────────────────────────────────

test('Zélotisme « Corps de fer » : garde zélotiste = garnisonParGarde + 10', () => {
  const ctx = partieMock()
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  // un garde unique dans la ville, culture neutre puis zélotiste
  for (const x of state.population[joueur.n] ?? []) {
    if (x.statut !== 'Décédé' && x.ville === ville.nom && x.metier === C.p.metierGarde) {
      x.metier = null
    }
  }
  const garde = (state.population[joueur.n] ?? []).find(
    (c) => c.statut !== 'Décédé' && c.ville === ville.nom,
  )!
  garde.metier = C.p.metierGarde
  garde.culture = 'Lunisme'
  const gAvant = garnisonHabitationVille(joueur, ville, C, state)
  garde.culture = 'Zélotisme'
  const gApres = garnisonHabitationVille(joueur, ville, C, state)
  assert.equal(gApres - gAvant, C.config.cultures.find((c) => c.nom === 'Zélotisme')?.garnisonParGardeCulture,
    'le bonus de culture SE CUMULE au défaut moteur (statique)')
})

// ── Zélotisme « Ferveur martiale » ─────────────────────────────────────────

test('Zélotisme « Ferveur martiale » : −20 × rang hors culture, une fois, plancher 0', () => {
  const ctx = partieMock()
  const { state, joueur, ville } = ctx
  assert.ok(ville, 'le mock fournit toujours une ville (rétrécissement pour tsc strict)')
  const C = cfgOf(state.config)
  const rang = rangNiveau(ville, C)
  // PAS de ville zélotiste dans le monde : aucun malus
  assert.equal(malusFerveurMartiale(state, ville, C), 0)
  const gAvant = garnisonHabitationVille(joueur, ville, C, state)
  // une ville zélotiste apparaît chez un autre joueur
  const zelote: Player = { ...joueur, n: 1, nom: 'Zélote',
    villes: [{ ...ville, nom: 'Zelopolis', culture: 'Zélotisme' }] } as unknown as Player
  state.players.push(zelote)
  assert.equal(malusFerveurMartiale(state, ville, C), 20 * rang, '−20 × rang de l\'habitation')
  assert.equal(garnisonHabitationVille(joueur, ville, C, state), Math.max(0, gAvant - 20 * rang),
    'le malus s\'applique, plancher 0')
  // une deuxième ville zélotiste : PAS de cumul
  state.players.push({ ...zelote, n: 2, nom: 'Zélote 2',
    villes: [{ ...ville, nom: 'Zelo2', culture: 'Zélotisme' }] } as unknown as Player)
  assert.equal(malusFerveurMartiale(state, ville, C), 20 * rang, 'malus UNE fois par habitation')
  // la garnison de la ville zélotiste elle-même : protégée
  assert.equal(malusFerveurMartiale(state, zelote.villes[0], C), 0)
  // les cités libres ne comptent pas : elles n'ont pas de culture zélotiste
  // (les villes des JOUEURS seules — convention actée)
  for (const q of state.players.slice(1)) q.villes = []
  assert.equal(malusFerveurMartiale(state, ville, C), 0, 'plus aucune ville zélotiste : malus levé')
})
