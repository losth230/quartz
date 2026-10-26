// ═══════════════════════════════════════════════════════════════════════════
//  TESTS DOMICILES — vagues A+C (design domiciles/ascension 2026-10-24)
//   · table domiciles (qualité 0-4 : Taudis 0 → Palais 4) + domicilesRang structuré du rang ;
//   · qualite des métiers (roturier/bourgeois/noble) ;
//   · stock de la ville (City.domiciles) complété par normaliserEtat ;
//   · foyers (couples + enfants mineurs) et attribution (meilleure
//     qualité d'abord, sans dépasser le stock).
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import { migrerEtat } from './migrations'
import {
  domicileDef, qualiteDomicile, stockRang, totalLogementsVille,
  foyersDeVille, attribuerDomicilesVille, initStockVille,
  taudisApportesVille, domicilesApportesVille,
} from './domiciles'
import { constructionRef, resumeConstruction, prerequisConstruction } from './constructions'
import type { GameState, Player, City } from './types'

function partieTemoin(): { state: GameState; p: Player; ville: City; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 424242, 'local')
  return { state, p: state.players[0], ville: state.players[0].villes[0], C }
}

// ── Vague A : référentiel ─────────────────────────────────────────────

test('table domiciles : 5 types, qualités 0-4 distinctes', () => {
  const { C } = partieTemoin()
  const ds = C.config.domiciles
  assert.ok(ds.length >= 5, `au moins 5 types (trouvé ${ds.length})`)
  const qualites = ds.map((d) => d.qualite)
  // échelle 0-4 (arbitrage Thibaut : la qualité EST le gain de
  //  prestige — Masure 0 … Palais 4)
  assert.deepEqual([...qualites].sort(), [0, 1, 2, 3, 4], 'échelle complète 0-4')
})

test('domicileDef / qualiteDomicile : lookup nom-insensible à la casse', () => {
  const { C } = partieTemoin()
  assert.equal(qualiteDomicile('Palais', C), 4)
  assert.equal(qualiteDomicile('palais', C), 4)
  assert.equal(qualiteDomicile('Maison', C), 1)
  assert.equal(qualiteDomicile('Masure', C), 0)
  assert.equal(qualiteDomicile(null, C), 0)
  assert.equal(qualiteDomicile('Inconnu', C), 0)
  assert.ok(domicileDef('Auberge', C))
})

test('stockRang : Hameau = 50 Taudis + 1 Maison de notable (fiche habitations 2026-10-26)', () => {
  const { C } = partieTemoin()
  const stock = stockRang('Ville', 'Hameau', C)
  const taudis = stock.find((e) => e.domicile === 'Taudis')
  const notable = stock.find((e) => e.domicile === 'Maison de notable')
  assert.ok(taudis, 'des Taudis au Hameau')
  assert.equal(taudis?.nombre, 50)
  assert.equal(notable?.nombre, 1, '1 Maison de notable au Hameau')
  assert.equal(stock.reduce((a, e) => a + e.nombre, 0), 51)
})

test('qualite des métiers : catégories arbitrees (aménagement→roturier, bâtiment→bourgeois, cour→noble)', () => {
  const { C } = partieTemoin()
  const q = (m: string) => C.metiers.find((t) => t.metier === m)?.qualite
  assert.equal(q('Chasseur'), 'roturier')
  assert.equal(q('Fermier'), 'roturier')
  assert.equal(q('Commerçant'), 'bourgeois')
  assert.equal(q('Banquier'), 'bourgeois')
  assert.equal(q('Gouverneur'), 'noble')
  assert.equal(q('Dirigeant'), 'noble')
  // défaut : roturier
  assert.equal(q('Soldat'), 'roturier')
})

// ── Vague C : stock et foyers ──────────────────────────────────────────

test('normaliserEtat / migrerEtat : le stock de la ville est complété (vieille sauvegarde)', () => {
  const { state, ville } = partieTemoin()
  // simuler une vieille sauvegarde : pas de champ domiciles, tampon
  //  schema absent → migrerEtat rejoue TOUTES les migrations (v1
  //  normaliserEtat complète le stock).
  delete (ville as { domiciles?: unknown }).domiciles
  delete (state as { schema?: unknown }).schema
  migrerEtat(state)
  assert.ok(Array.isArray(ville.domiciles), 'stock complété par migrerEtat')
  assert.ok(totalLogementsVille(ville) >= 50, `au moins les maisons du rang (${totalLogementsVille(ville)})`)
})

test('initStockVille : le rang DÉFINIT l\'offre (écrase le stock)', () => {
  const { ville, C } = partieTemoin()
  initStockVille(ville, C)
  const total1 = totalLogementsVille(ville)
  assert.equal(total1, 51) // Hameau : 50 Taudis + 1 Maison de notable
  // on change le rang : le stock suit
  ville.rang = 'Cité'
  initStockVille(ville, C)
  assert.equal(totalLogementsVille(ville), 121) // Cité : 100 + 20 + 1
})

test('foyersDeVille : couples + enfants mineurs (partition sans doublon)', () => {
  const { state, p, ville, C } = partieTemoin()
  const foyers = foyersDeVille(state, p.n, ville, C)
  const pop = (state.population[p.n] ?? []).filter(
    (c) => c.statut !== 'Décédé' && c.ville === ville.nom,
  )
  // chaque adulte apparaît une seule fois (chef ou conjoint)
  const chefsEtConjoints = foyers.flatMap((f) => [f.chef, ...(f.conjoint ? [f.conjoint] : [])])
  const ids = chefsEtConjoints.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length, 'aucun adulte en double')
  // tous les mineurs sont rattachés
  const mineurs = pop.filter((c) => c.age < C.p.adultAge)
  const rattaches = foyers.flatMap((f) => f.enfants)
  assert.equal(rattaches.length, mineurs.length, 'tous les mineurs rattachés')
  // couverture : adultes + mineurs = population
  assert.equal(chefsEtConjoints.length + rattaches.length, pop.length)
})

test('attribuerDomicilesVille : loge tout le monde si stock suffisant (meilleure qualité d\'abord)', () => {
  const { state, p, ville, C } = partieTemoin()
  initStockVille(ville, C)
  const loges = attribuerDomicilesVille(state, p, ville, C)
  const foyers = foyersDeVille(state, p.n, ville, C)
  assert.equal(loges, foyers.length, 'tous les foyers logés (51 logements > foyers)')
  // chaque foyer a un domicile connu
  for (const f of foyers) {
    assert.ok(f.domicile, `foyer de ${f.chef.prenom} sans domicile`)
    assert.ok(domicileDef(f.domicile, C), `domicile inconnu : ${f.domicile}`)
    assert.equal(f.conjoint?.domicile ?? f.domicile, f.domicile, 'le conjoint partage le domicile')
  }
  // (fiche habitations 2026-10-26 : le stock du Hameau est 50 Taudis
  //  + 1 Maison de notable — l'attribution donne la MEILLEURE
  //  qualité d'abord (la Maison de notable part la première), les
  //  foyers suivants sont logés en Taudis : qualité 0 LÉGALE, plus
  //  l'ancien « > 0 » qui la rejetait.)
})

test('attribuerDomicilesVille : stock insuffisant → foyers sans domicile, pas de surbooking', () => {
  const { state, p, ville, C } = partieTemoin()
  // stock ridicule : 2 logements
  ville.domiciles = [{ domicile: 'Maison', nombre: 2 }]
  const loges = attribuerDomicilesVille(state, p, ville, C)
  assert.equal(loges, 2, 'seuls 2 foyers logés')
  // RELIRE les foyers APRÈS attribution (les objets capturés avant
  //  portent l'état périmé — le champ Character.domicile a bougé).
  const foyers = foyersDeVille(state, p.n, ville, C)
  const avecDomicile = foyers.filter((f) => f.domicile).length
  assert.equal(avecDomicile, 2)
  // les autres sans domicile — champ null, pas d'inconnu
  for (const f of foyers.filter((f) => !f.domicile)) {
    assert.equal(f.chef.domicile, null)
    assert.equal(f.conjoint?.domicile ?? null, null)
  }
})

test('attribuerDomicilesVille : idempotent — un foyer logé garde son domicile', () => {
  const { state, p, ville, C } = partieTemoin()
  initStockVille(ville, C)
  attribuerDomicilesVille(state, p, ville, C)
  const foyers1 = foyersDeVille(state, p.n, ville, C)
  const domiciles1 = foyers1.map((f) => f.domicile)
  attribuerDomicilesVille(state, p, ville, C)
  const foyers2 = foyersDeVille(state, p.n, ville, C)
  assert.deepEqual(foyers2.map((f) => f.domicile), domiciles1, 'attribution stable')
})

test('normaliserEtat + attribuer : les vieilles parties gagnent leurs domiciles sans mutation d\'état parasites', () => {
  const { state, p, ville, C } = partieTemoin()
  delete (ville as { domiciles?: unknown }).domiciles
  delete (state as { schema?: unknown }).schema
  migrerEtat(state) // compléter le stock (rejoue v1)
  const avant = state.turn
  attribuerDomicilesVille(state, p, ville, C)
  assert.equal(state.turn, avant, 'pas de mutation du tour')
  assert.ok(foyersDeVille(state, p.n, ville, C).every((f) => f.domicile), 'tout le monde logé')
})


// ── Régression audit de merge (2026-10-24) ────────────────────────────

test('audit merge : createGame initialise le stock (régression — parties neuves logées)', () => {
  // BUG DE L'AUDIT : createGame ne posait pas City.domiciles — le
  //  stock restait indéfini, l'attribution ne logeait PERSONNE et
  //  le facteur logement du bonheur restait à 0 partout. Corrigé :
  //  stock initial au rang de création + défense en profondeur dans
  //  attribuerDomicilesVille.
  const { p } = partieTemoin()
  assert.ok(Array.isArray(p.villes[0].domiciles), 'createGame pose le stock')
  assert.ok(totalLogementsVille(p.villes[0]) >= 50, 'stock du rang initial')
})

test('audit merge : vieille partie tamponnée (v4) sans stock — attribution répare (défense en profondeur)', () => {
  const { state, p, ville, C } = partieTemoin()
  // simuler une sauvegarde d'avant la vague, tampon déjà à jour
  delete (ville as { domiciles?: unknown }).domiciles
  state.schema = 4
  migrerEtat(state) // ne rejoue PAS la v1 (tampon à jour)
  assert.equal(ville.domiciles, undefined, 'migrerEtat ne touche pas (tampon)')
  const loges = attribuerDomicilesVille(state, p, ville, C)
  assert.ok(loges > 0, `l'attribution initialise le stock et loge (${loges})`)
  assert.ok(Array.isArray(ville.domiciles), 'stock posé par défense en profondeur')
})

// ── Fiche aménagements 3 tiers (retour Thibaut 2026-10-26) ────────────

test('fiche aménagements : Taudis apportés — cumul sur les aménagements de la ville', () => {
  const { ville, C } = partieTemoin()
  // Champ = 5 Taudis, Baleinier = aucun (null dans le référentiel)
  ville.amenagements = ['Champ', 'Champ', 'Baleinier']
  assert.equal(taudisApportesVille(ville, C), 10, '5 + 5 + 0')
  // le tier 2 en remplace un de base : 5 + 8
  ville.amenagements = ['Champ', 'Champ (tier 2)']
  assert.equal(taudisApportesVille(ville, C), 13, '5 + 8')
})

test('fiche aménagements : Scierie tier 2 — 2 Tisseurs (correction fiche 2026-10-26)', () => {
  const { C } = partieTemoin()
  const ref = constructionRef('Scierie (tier 2)', C.config)
  assert.ok(ref, 'Scierie tier 2 dans le référentiel')
  assert.equal(ref.taudisApportes, 8)
  const emp = ref.emplacements ?? []
  const tisseur = emp.find((e) => e.metier === 'Tisseur')
  const bucheron = emp.find((e) => e.metier === 'Bûcheron')
  assert.equal(tisseur?.places, 2, '2 emplacements de Tisseur (fiche, ex-1)')
  assert.equal(bucheron?.places, 4, '4 emplacements de Bûcheron')
})

test('fiche aménagements : Mine d\'Or — 1 Marchand = 2 Commerçants (arbitrage Thibaut 2026-10-26)', () => {
  const { C } = partieTemoin()
  // le Marchand étant retiré du jeu, ses emplacements sont remplacés
  //  par le DOUBLE de Commerçants : 3→6, 7→14, 12→24.
  for (const [tier, attendu] of [[1, 6], [2, 14], [3, 24]] as const) {
    const nom = tier === 1 ? "Mine d'Or" : `Mine d'Or (tier ${tier})`
    const ref = constructionRef(nom, C.config)
    assert.ok(ref, `${nom} dans le référentiel`)
    const commercants = (ref.emplacements ?? []).find((e) => e.metier === 'Commerçant')
    assert.equal(commercants?.places, attendu, `${nom} : ${attendu} Commerçants`)
  }
})

test('fiche aménagements : resumeConstruction affiche les Taudis (retour Thibaut 2026-10-26)', () => {
  const { C } = partieTemoin()
  // Le résumé est LA source affichée partout (picker Aménager/Améliorations,
  //  lignes de carte, Constructions) : les Taudis y sont désormais visibles.
  assert.ok(resumeConstruction(constructionRef('Champ', C.config)).includes('+5 Taudis'),
    'Champ : « +5 Taudis » dans le résumé')
  const scierie2 = resumeConstruction(constructionRef('Scierie (tier 2)', C.config))
  assert.ok(scierie2.includes('+8 Taudis'), 'Scierie tier 2 : « +8 Taudis »')
  assert.ok(scierie2.includes('2 tisseur'), 'Scierie tier 2 : 2 tisseurs dans le résumé')
})

// ── Fiche bâtiments rang 1 + 2 (retour Thibaut 2026-10-26) ─────────────

test('fiche bâtiments : Taudis apportés par les BÂTIMENTS (Poste de garde + Bas quartier)', () => {
  const { ville, C } = partieTemoin()
  ville.batiments = ['Poste de garde', 'Bas quartier']
  assert.equal(taudisApportesVille(ville, C), 30, '10 + 20')
  // rang 2 : la Caserne cumule pareil
  ville.batiments = ['Poste de garde', 'Caserne']
  assert.equal(taudisApportesVille(ville, C), 20, '10 + 10')
})

test('fiche bâtiments : domicilesApportesVille — Maisons et Maisons de notable', () => {
  const { ville, C } = partieTemoin()
  // Quartier intermédiaire +20 Maisons, Haut quartier +20 Maisons de
  //  notable (Château, rang 2) — cumul par type de domicile.
  ville.batiments = ['Quartier intermédiaire', 'Haut quartier']
  assert.deepEqual(domicilesApportesVille(ville, C), [
    { domicile: 'Maison', nombre: 20 },
    { domicile: 'Maison de notable', nombre: 20 },
  ])
  // Tour de sorcier : +1 Maison de notable, +1 Scientifique (lui
  //  aussi lu par la carte, pas ici)
  const tour = constructionRef('Tour de sorcier', C.config)
  assert.deepEqual(tour?.domicilesApportes, [{ domicile: 'Maison de notable', nombre: 1 }])
})

test('fiche bâtiments : resumeConstruction affiche les domiciles apportés (pluriel)', () => {
  const { C } = partieTemoin()
  const quart = resumeConstruction(constructionRef('Quartier intermédiaire', C.config))
  assert.ok(quart.includes('+20 Maisons'), '« +20 Maisons » (pluriel)')
  const haut = resumeConstruction(constructionRef('Haut quartier', C.config))
  assert.ok(haut.includes('+20 Maisons de notable'), '« +20 Maisons de notable »')
  const tour = resumeConstruction(constructionRef('Tour de sorcier', C.config))
  assert.ok(tour.includes('+1 Maison de notable'), '« +1 Maison de notable » (singulier)')
})

test('fiche bâtiments : prérequis rang 2 lus depuis le champ coût (« X requis »)', () => {
  const { C } = partieTemoin()
  assert.equal(prerequisConstruction(constructionRef('Caserne', C.config)), 'Poste de garde')
  assert.equal(prerequisConstruction(constructionRef('Ecole militaire', C.config)), "Terrain d'entrainement")
  assert.equal(prerequisConstruction(constructionRef('Clinique', C.config)), 'Herboristerie')
  // le remplacement n'est PAS un prérequis : Silo à grain remplace la
  //  Grange via le champ dédié (pas de « requis » dans le coût)
  assert.equal(prerequisConstruction(constructionRef('Silo à grain', C.config)), null)
  assert.equal(constructionRef('Silo à grain', C.config)?.remplaceBatiment, 'Grange')
})

test('fiche bâtiments : Caserne rang 2 (Ville ET Château), +4 Garde, +10 Taudis', () => {
  const { C } = partieTemoin()
  for (const g of ['Ville', 'Château']) {
    const ref = C.config.constructions.find((c) => c.nom === 'Caserne' && c.groupe === g)
    assert.ok(ref, `Caserne ${g} dans le référentiel`)
    assert.equal(ref?.rangMinHabitation, 2, `${g} : rang 2`)
    assert.equal(ref?.taudisApportes, 10, `${g} : +10 Taudis`)
    assert.deepEqual((ref?.emplacements ?? []).find((e) => e.metier === 'Garde'), { metier: 'Garde', places: 4 })
  }
})

test('fiche bâtiments : l\'Herboristerie (rang 1) n\'accueille plus de Guérisseur — la Clinique (rang 2) en accueille 5', () => {
  const { C } = partieTemoin()
  const herb = constructionRef('Herboristerie', C.config)
  assert.ok(herb, 'Herboristerie au référentiel')
  assert.equal(herb?.emplacements, undefined, 'plus d\'emplacements : uniquement ±5% maladie')
  assert.equal(herb?.malContraction, 0.05)
  assert.equal(herb?.bonusGuerison, 0.05)
  const clin = constructionRef('Clinique', C.config)
  assert.ok(clin, 'Clinique au référentiel')
  assert.equal(clin?.rangMinHabitation, 2)
  assert.deepEqual((clin?.emplacements ?? []).find((e) => e.metier === 'Guérisseur'), { metier: 'Guérisseur', places: 5 })
  // le résumé de l'Herboristerie reste STRUCTURÉ (effets ±5%) pour que
  //  le picker ne retombe pas sur la description du classeur
  assert.ok(resumeConstruction(herb).includes('+5% guérison'),
    'Herboristerie : « +5% guérison » dans le résumé structuré')
})
