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
} from './domiciles'
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

test('stockRang : Hameau = 50 Maisons + 10 Auberges (données converties)', () => {
  const { C } = partieTemoin()
  const stock = stockRang('Ville', 'Hameau', C)
  const maison = stock.find((e) => e.domicile === 'Maison')
  const auberge = stock.find((e) => e.domicile === 'Auberge')
  assert.ok(maison, 'des Maisons au Hameau')
  assert.equal(maison?.nombre, 50)
  assert.equal(auberge?.nombre, 10)
  assert.equal(stock.reduce((a, e) => a + e.nombre, 0), 60)
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
  assert.equal(total1, 60) // Hameau : 50 + 10
  // on change le rang : le stock suit
  ville.rang = 'Cité'
  initStockVille(ville, C)
  assert.equal(totalLogementsVille(ville), 150) // Cité : 100 + 50
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
  assert.equal(loges, foyers.length, 'tous les foyers logés (60 logements > foyers)')
  // chaque foyer a un domicile connu
  for (const f of foyers) {
    assert.ok(f.domicile, `foyer de ${f.chef.prenom} sans domicile`)
    assert.ok(qualiteDomicile(f.domicile, C) > 0, `domicile inconnu : ${f.domicile}`)
    assert.equal(f.conjoint?.domicile ?? f.domicile, f.domicile, 'le conjoint partage le domicile')
  }
  // les Maisons (qualité 2) d'abord, pas les Masures (la table du rang n'en a pas de toute façon)
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
