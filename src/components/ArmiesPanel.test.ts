// ═════════════════════════════════════════════════════════════════════════
//  TEST DE RENDU — page « Armées » (ArmiesPanel) : levée d'armée,
//  réserves d'émissaires.
//  R3 (audit résiduels 2026-10-24) : l'état des armées (vide après 2
//  tours sans levée) et le PRIX DE LEVÉE calculé par le VRAI moteur
//  (prixArmee) sont vérifiés dans le rendu.
// ═════════════════════════════════════════════════════════════════════════

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareRendu, partieRendu, esc, aplatir } from './testRendu'

prepareRendu()

test('rendu ArmiesPanel : la page Armées s’affiche sans crash', async () => {
  const etat = await partieRendu()
  const React = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { GameProvider } = await import('../state/store')
  const { ArmiesPanel } = await import('./ArmiesPanel')
  const { cfgOf } = await import('../engine/gameData')
  const { prixArmee } = await import('../engine/armees')
  const { isNobleDyn } = await import('../engine/shared')
  const { fmt } = await import('./ui')

  const html = renderToString(
    React.createElement(GameProvider, null, React.createElement(ArmiesPanel, { joueur: 1 })),
  )

  assert.ok(html.length > 1000, `page trop courte pour être complète : ${html.length} caractères`)
  assert.ok(html.includes('Lever une armée'), 'carte « Lever une armée » absente')
  assert.ok(html.includes('Armées de Joueur 1'), 'carte « Armées de … » absente')

  // ── R3 : données réelles dérivées de l'état du joueur 1 ──
  // aplatir() retire les marqueurs de commentaires de renderToString
  // pour comparer le texte VU à l'écran.
  const h = aplatir(html)
  const p1 = etat.players.find((p) => p.n === 1)
  assert.ok(p1, 'joueur 1 introuvable dans l’état')
  const C = cfgOf(etat.config)
  // Compteur d'armées : LE nombre de l'état (0 après 2 tours sans
  // levée) + le texte « Aucune armée en lice » correspondant.
  assert.ok(
    h.includes(`Armées : ${String(p1.armees.length)}`),
    `compteur « Armées : ${p1.armees.length} » non rendu`,
  )
  if (p1.armees.length === 0) {
    assert.ok(h.includes('Aucune armée en lice'), 'texte « Aucune armée en lice » absent')
  }
  // Le prix de levée affiché est celui du VRAI MOTEUR pour la
  // puissance par défaut (90) — pas une constante d'affichage.
  const prix = prixArmee(90, C)
  assert.ok(
    h.includes(`${fmt(prix)} Or`),
    `prix de levée moteur (${fmt(prix)} Or) non rendu`,
  )
  // Le menu des commandants propose les nobles adultes libres de
  // l'état (même filtre que la vue : adulte, noble, pas déjà en armée).
  const vivants = (etat.population[1] ?? []).filter((c) => c.statut !== 'Décédé')
  const commandantsDispo = vivants.filter(
    (c) => c.age >= C.p.adultAge && isNobleDyn(c.dynastie, C) && !c.armee,
  )
  assert.ok(commandantsDispo.length > 0, 'aucun commandant disponible dans l’état (graine changée ?)')
  const premier = commandantsDispo[0]
  assert.ok(
    h.includes(esc(`${premier.prenom} ${premier.nom} (${premier.dynastie})`)),
    'commandant disponible de l’état absent des options',
  )
})
