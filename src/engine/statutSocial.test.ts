// ═══════════════════════════════════════════════════════════════════════════
//  TESTS STATUT SOCIAL — vague D (arbitrages Thibaut 2026-10-24)
//   · prestige FAMILIAL : convergence des couples, un personnage
//     monte/descend AVEC ses enfants ;
//   · héritage : 50 % du prestige moyen des parents à l'âge adulte,
//     joué UNE fois ;
//   · formule par tour : sans emploi -2, sans domicile -2, malade
//     -2, domicile +0..+4 (qualité - 1), métier +2 bourgeois/+5
//     noble, +1 si bonheur ville > 50 ;
//   · rang dérivé : < 100 roturier, ≥ 100 bourgeois, ≥ 250 noble.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGame, defaultSetups } from './setup'
import { cfgOf, type Cfg } from './gameData'
import { runTurn } from './tour'
import { attribuerDomicilesVille, initStockVille } from './domiciles'
import {
  rangSocial, rangDe, prestigeDe, gainPrestigeTour, evaluerFamilles,
} from './statutSocial'
import { fullName, isNobleDyn } from './shared'
import type { Character, GameState, Player } from './types'

function partieTemoin(): { state: GameState; p: Player; C: Cfg } {
  const C = cfgOf()
  const state = createGame(defaultSetups(), 424242, 'local')
  return { state, p: state.players[0], C }
}

// ── Rang dérivé ───────────────────────────────────────────────────────

test('rangSocial : seuils arbitrés (0-100 roturier, 100-250 bourgeois, 250+ noble)', () => {
  assert.equal(rangSocial(0), 'roturier')
  assert.equal(rangSocial(99), 'roturier')
  assert.equal(rangSocial(100), 'bourgeois')
  assert.equal(rangSocial(249), 'bourgeois')
  assert.equal(rangSocial(250), 'noble')
  assert.equal(rangSocial(400), 'noble')
})

test('rangDe : noble de NAISSANCE dès le départ (dynastie noble — retour Thibaut 2026-10-26 : « il faut des nobles dès le début »)', () => {
  const { C } = partieTemoin()
  // dynastie noble → NOBLE dès la naissance, prestige 0 compris :
  // la colonne Rang correspond à la colonne Dynastie dès le setup
  assert.equal(rangDe(perso({ dynastie: 'Valmont' }), C), 'noble')
  assert.equal(rangDe(perso({ dynastie: 'Valmont', prestige: 300 }), C), 'noble')
  // dynastie roturière → rang dérivé du prestige (100/250)
  assert.equal(rangDe(perso({ dynastie: C.p.dynastieRoturier }), C), 'roturier')
  assert.equal(rangDe(perso({ dynastie: C.p.dynastieRoturier, prestige: 150 }), C), 'bourgeois')
  assert.equal(rangDe(perso({ dynastie: C.p.dynastieRoturier, prestige: 300 }), C), 'noble')
})

// ── Formule du tour ───────────────────────────────────────────────────

function perso(over: Partial<Character> = {}): Character {
  return {
    id: 'x', nom: 'Test', prenom: 'X', dynastie: 'Famille', sexe: 'F',
    age: 30, statut: 'Sain', metier: null, fecondite: 1, armee: null,
    ...over,
  } as Character
}

test('gainPrestigeTour : formule arbitrée exacte', () => {
  const { C } = partieTemoin()
  // sans rien : -2 (emploi) -2 (domicile) = -4
  assert.equal(gainPrestigeTour(perso(), C, 0), -4)
  // malade : -2 de plus
  assert.equal(gainPrestigeTour(perso({ statut: 'Malade' }), C, 0), -6)
  // domicile Maison (qualité 2 → +1) : -2 (emploi) + 1 = -1
  assert.equal(gainPrestigeTour(perso({ domicile: 'Maison' }), C, 0), -1)
  // domicile Palais (qualité 4 → +4)
  assert.equal(gainPrestigeTour(perso({ domicile: 'Palais' }), C, 0), 2)
  // métier bourgeois (Commerçant) + domicile Maison : +2 +1 -0 = +3
  assert.equal(gainPrestigeTour(perso({ metier: 'Commerçant', domicile: 'Maison' }), C, 0), 3)
  // métier noble (Gouverneur) + Palais : +5 +4 = +9
  assert.equal(gainPrestigeTour(perso({ metier: 'Gouverneur', domicile: 'Palais' }), C, 0), 9)
  // bonheur > 50 : +1
  assert.equal(gainPrestigeTour(perso({ metier: 'Commerçant', domicile: 'Maison' }), C, 60), 4)
  // bonheur = 50 pile : PAS de bonus (strictement >)
  assert.equal(gainPrestigeTour(perso({ metier: 'Commerçant', domicile: 'Maison' }), C, 50), 3)
})

// ── Évaluation des familles ───────────────────────────────────────────

test('evaluerFamilles : un foyer bien loti accumule du prestige tour après tour', () => {
  const { state, p, C } = partieTemoin()
  initStockVille(p.villes[0], C)
  attribuerDomicilesVille(state, p, p.villes[0], C)
  // tour 1 : les roturiers partent de 0, tous ont domicile+metier
  evaluerFamilles(state, p, C)
  const vivants = (state.population[p.n] ?? []).filter((c) => c.statut !== 'Décédé')
  // (300 de base pour les nobles de naissance, retour Thibaut
  //  2026-10-26) : côté ROTURIERS personne n'est encore bourgeois
  //  (prestige d'un tour ≈ +2-5 max)
  const roturiers = vivants.filter((c) => !isNobleDyn(c.dynastie, C))
  assert.ok(roturiers.length > 0, 'des roturiers dans la partie témoin')
  assert.ok(roturiers.every((c) => prestigeDe(c) < 100), 'pas de bourgeois par le prestige après 1 tour')
  assert.ok(roturiers.some((c) => prestigeDe(c) > 0), 'du prestige accumulé chez les roturiers')
  // et les nobles de naissance tournent autour de leur base 300
  const nobles = vivants.filter((c) => isNobleDyn(c.dynastie, C))
  assert.ok(nobles.length >= 2, 'la famille dirigeante au setup (couple royal au minimum)')
  assert.ok(
    nobles.every((c) => prestigeDe(c) >= 280),
    `les nobles de naissance restent sur leur base 300 (trouvé ${nobles.map((c) => prestigeDe(c)).join(', ')})`,
  )
})

test('evaluerFamilles : convergence des couples (prestige familial partagé)', () => {
  const { state, p, C } = partieTemoin()
  const pop = state.population[p.n] ?? []
  // trouver un couple marié
  const marie = pop.find((c) => c.mariageId && c.statut !== 'Décédé' && c.age >= C.p.adultAge)
  const conj = marie ? pop.find((c) => c.id === marie.mariageId) : undefined
  if (!marie || !conj) return // pas de couple dans la partie témoin — skip silencieux
  // prestiges très différents : 200 vs 0 → la moyenne les rapproche
  marie.prestige = 200
  conj.prestige = 0
  evaluerFamilles(state, p, C)
  // après convergence, les deux prestiges sont égaux (moyenne + gain commun)
  assert.equal(prestigeDe(marie), prestigeDe(conj), 'les conjoints partagent le prestige')
  // et autour de 100 (la moyenne)
  assert.ok(Math.abs(prestigeDe(marie) - 100) <= 10, `convergence vers ~100 (trouvé ${prestigeDe(marie)})`)
})

test('evaluerFamilles : un noble de NAISSANCE ne journalise pas de changement de rang (retour Thibaut 2026-10-26)', () => {
  const { state, p, C } = partieTemoin()
  const pop = state.population[p.n] ?? []
  // un membre de dynastie noble vivant (la famille dirigeante du setup)
  const noble = pop.find((c) => isNobleDyn(c.dynastie, C) && c.statut !== 'Décédé' && c.age >= C.p.adultAge)
  if (!noble) return // pas de dynastie noble dans la partie témoin — skip silencieux
  assert.equal(rangDe(noble, C), 'noble', 'dynastie noble = noble de naissance (prestige 0 au setup)')
  const evts = evaluerFamilles(state, p, C)
  // son prestige a évolué mais son rang de NAISSANCE n'a pas changé :
  // pas d'événement « accède/retombe » pour lui
  assert.ok(
    !evts.some((e) => e.nom === fullName(noble)),
    `aucun événement de rang pour un noble de naissance (trouvé : ${evts.filter((e) => e.nom === fullName(noble)).map((e) => e.texte).join(' / ')})`,
  )
  assert.equal(rangDe(noble, C), 'noble')
})

test('evaluerFamilles : un roturier qui franchit 100 journalise toujours son accès à la bourgeoisie', () => {
  const { state, p, C } = partieTemoin()
  const pop = state.population[p.n] ?? []
  // un roturier de dynastie, célibataire (chemin « appliquer »)
  const rot = pop.find((c) => !isNobleDyn(c.dynastie, C) && c.statut !== 'Décédé' && c.age >= C.p.adultAge && !c.mariageId)
  if (!rot) return // skip silencieux
  // (refonte 12 lois, 2026-10-29 : culture à seuil bourgeois 100 —
  //  la loi « Bourgeoisie facile » du Communautarisme abaisse le
  //  seuil à 80 et un communautariste serait déjà bourgeois à 99)
  rot.culture = 'Lunisme'
  rot.prestige = 99
  rot.metier = C.p.metierChasseur
  rot.domicile = 'Maison'
  const evts = evaluerFamilles(state, p, C)
  const ev = evts.find((e) => e.nom === fullName(rot))
  assert.ok(ev && ev.texte.includes('accède à la bourgeoisie'), `événement d'accès attendu (trouvé : ${ev?.texte ?? 'aucun'})`)
  assert.equal(rangDe(rot, C), 'bourgeois')
})

test('setup : tout noble de NAISSANCE reçoit 300 prestige de base (retour Thibaut 2026-10-26)', () => {
  const { state, C } = partieTemoin()
  let nobles = 0
  for (const [, pop] of Object.entries(state.population)) {
    for (const c of pop) {
      if (isNobleDyn(c.dynastie, C)) {
        nobles++
        assert.equal(prestigeDe(c), 300, `${fullName(c)} : noble de naissance → 300 de base (trouvé ${prestigeDe(c)})`)
      }
    }
  }
  assert.ok(nobles >= 16, `des nobles de naissance au setup des 8 joueurs (trouvé ${nobles})`)
})

test('evaluerFamilles : héritage 50 % du prestige moyen des parents, une seule fois (roturier de dynastie)', () => {
  const { state, p, C } = partieTemoin()
  const pop = state.population[p.n] ?? []
  // parents DÉCÉDÉS (l'héritage est posthume et les défunts ne
  //  convergent pas ni ne gagnent de prestige) et ROTURIERS
  const mere = perso({ id: 'm2', dynastie: C.p.dynastieRoturier, prestige: 200, statut: 'Décédé' })
  const pere = perso({ id: 'p2', dynastie: C.p.dynastieRoturier, prestige: 100, statut: 'Décédé' })
  const enfant = perso({
    id: 'e2', dynastie: C.p.dynastieRoturier, age: C.p.adultAge,
    mereId: 'm2', pereId: 'p2',
    metier: C.p.metierChasseur, domicile: 'Maison',
  })
  pop.push(mere, pere, enfant)
  evaluerFamilles(state, p, C)
  // héritage : 50 % de la moyenne (200+100)/2 = 75
  assert.equal(enfant.prestige, 75, `héritage 50 % de la moyenne (trouvé ${enfant.prestige})`)
  assert.equal(enfant.prestigeHerite, 75, 'marqueur prestigeHerite posé')
  // rejouer : pas de double héritage (marqueur prestigeHerite)
  const avant = enfant.prestige
  evaluerFamilles(state, p, C)
  assert.ok(enfant.prestige >= avant, 'pas de perte à la relecture')
})

test('evaluerFamilles : héritage d’un enfant de dynastie NOBLE — plancher 300 de base (retour Thibaut 2026-10-26)', () => {
  const { state, p, C } = partieTemoin()
  const pop = state.population[p.n] ?? []
  // parents nobles à 200 et 100 (SOUS la base) : l'enfant noble de
  //  naissance ne peut pas hériter sous 300
  const mere = perso({ id: 'm3', dynastie: 'Valmont', prestige: 200, statut: 'Décédé' })
  const pere = perso({ id: 'p3', dynastie: 'Valmont', prestige: 100, statut: 'Décédé' })
  const enfant = perso({
    id: 'e3', dynastie: 'Valmont', age: C.p.adultAge,
    mereId: 'm3', pereId: 'p3',
    metier: C.p.metierChasseur, domicile: 'Maison',
  })
  pop.push(mere, pere, enfant)
  evaluerFamilles(state, p, C)
  assert.equal(enfant.prestige, 300, `plancher du noble de naissance (trouvé ${enfant.prestige})`)
  assert.equal(enfant.prestigeHerite, 300, 'marqueur prestigeHerite posé')
  // et si le parent a fait mieux que la base, l'héritage la dépasse :
  //  50 % d'un seul parent à 700 = 350
  const mere2 = perso({ id: 'm4', dynastie: 'Montclair', prestige: 700, statut: 'Décédé' })
  const enfant2 = perso({
    id: 'e4', dynastie: 'Montclair', age: C.p.adultAge, mereId: 'm4',
    metier: C.p.metierChasseur, domicile: 'Maison',
  })
  pop.push(mere2, enfant2)
  evaluerFamilles(state, p, C)
  assert.equal(enfant2.prestige, 350, `50 % d'un seul parent à 700 (trouvé ${enfant2.prestige})`)
})

test('runTurn complet : le statut social tourne sans crash et journalise les changements', () => {
  const { state } = partieTemoin()
  // 10 tours : le temps que des trajectoires se dessinent
  for (let i = 0; i < 10; i++) {
    runTurn(state)
  }
  // aucun prestige négatif, tous bornés
  for (const [, pop] of Object.entries(state.population)) {
    for (const c of pop) {
      assert.ok(prestigeDe(c) >= 0, `prestige négatif : ${c.prenom} ${prestigeDe(c)}`)
    }
  }
  assert.ok(state.log.length > 0, 'du journal')
})


// ── B6 (audit) : le bonus mariageMemeRang est testé dédiément ──────

test('B6 : mariageMemeRang — bonus de même rang social, libres entre conditions', async () => {
  const { computeMarriageProbability } = await import('./metiers')
  const { C } = partieTemoin()
  // deux personnages IDENTIQUES par ailleurs (même métier, âge,
  //  culture vide, sans traits) — SEUL le prestige (donc le rang)
  //  diffère : l'écart de probabilité est exactement le paramètre.
  // (refonte 12 lois, 2026-10-29 : dynastie ROTURIER obligatoire —
  //  rangDe (le rang du mariage depuis la refonte) traite une
  //  dynastie noble comme noble quel que soit le prestige ; les
  //  personnages fictifs du test doivent rester comparables par le
  //  prestige seul.)
  const a = perso({ dynastie: C.p.dynastieRoturier, metier: 'Chasseur' })
  const roturier = perso({ dynastie: C.p.dynastieRoturier, metier: 'Chasseur' })
  roturier.prestige = 10
  const bourgeois = perso({ dynastie: C.p.dynastieRoturier, metier: 'Chasseur' })
  bourgeois.prestige = 150   // même métier : seule différence = le rang
  a.prestige = 10
  const memeRang = computeMarriageProbability(a, roturier, C)
  const rangsDifferents = computeMarriageProbability(a, bourgeois, C)
  assert.ok(
    memeRang > rangsDifferents,
    `même rang (${memeRang.toFixed(3)}) > rangs différents (${rangsDifferents.toFixed(3)})`,
  )
  const attendu = C.p.mariageMemeRang
  assert.ok(
    Math.abs((memeRang - rangsDifferents) - attendu) < 1e-9,
    `écart = mariageMemeRang (${attendu})`,
  )
})
