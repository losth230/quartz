// ══════════════════════════════════════════════════════════════════════
//  AIDE AUX TESTS DE RENDU (retour de revue critique n°3) : amorcer
//  l'environnement Node (pas de DOM) puis charger dans le
//  localStorage une VRAIE partie, pour que GameProvider expose un
//  état non-null au premier rendu (renderToString ne joue PAS les
//  useEffect — la partie doit déjà être en localStorage AVANT le
//  montage du Provider, l'état initial est lu dans useState).
//
//  R3 (audit résiduels 2026-10-24, arbitrage « fait R3 ») : les tests
//  de rendu ne sont plus de simples assertions « fumée » (longueur
//  HTML + titres de cartes) — chacun vérifie des DONNÉES dérivées
//  de l'état de la partie (valeurs, noms, comptes), ce qu'un titre
//  n'attrapait pas (un tableau rendu avec de mauvaises données
//  passait la CI). partieRendu() RETOURNE donc l'état pour que le
//  test calcule les valeurs attendues, et esc() échappe un texte
//  attendu comme renderToString le fait.
//
//  Ce fichier n'est PAS collecté par `tsx --test src/**/*.test.ts`
//  (il ne s'appelle pas *.test.ts) : il n'est qu'un helper d'import.
// ══════════════════════════════════════════════════════════════════════

import type { SetupLine } from '../engine/setup'
import type { GameState } from '../engine/types'

/** Shim minimal de localStorage (le store et le storage y accèdent en
 *  try/catch — sous Node l'identifiant n'existe pas sans ce shim). */
export function prepareRendu(): void {
  const store = new Map<string, string>()
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
    key: (_i: number) => null,
    get length() { return store.size },
  }
  ;(globalThis as unknown as { localStorage: typeof ls }).localStorage = ls
}

/** Échappe un texte attendu comme renderToString échappe les nœuds
 *  texte (vérifié empiriquement sous react-dom/server 18 : & < > " '
 *  sont remplacés — l'apostrophe française devient &#x27;). À passer
 *  TOUTE chaîne dynamique contenant l'un de ces caractères (textes de
 *  journal, noms, libellés avec apostrophe…). */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Aplatit les marqueurs de commentaires que renderToString insère
 *  entre un texte et une expression (« Armées : <!-- -->0 »), pour
 *  qu'une assertion de données porte le texte VU par l'utilisateur
 *  (« Armées : 0 »). À appliquer au html AVANT toute assertion de
 *  contenu. */
export function aplatir(html: string): string {
  return html.replace(/<!--.*?-->/g, '')
}

/** Crée une vraie partie à 8 joueurs (graine fixe → déterministe),
 *  joue 2 tours complets (remplit state.history pour HistoryPanel
 *  et le récap « dernier tour ») puis l'écrit dans le localStorage
 *  shimmé. À appeler APRÈS prepareRendu(), AVANT de rendre le
 *  GameProvider. Les imports sont DYNAMIQUES pour que le shim soit
 *  en place avant tout code applicatif.
 *  R3 : retourne l'état — le test en dérive les valeurs attendues. */
export async function partieRendu(): Promise<GameState> {
  const { createGame } = await import('../engine/setup')
  const { runTurn } = await import('../engine/tour')
  const { saveLocal } = await import('../state/storage')

  const PEUPLES = ['Basiléens', 'PEAUX VERTES', "ELFES D'OR", 'Sylvains', 'NORLS', 'VERMINES DE KAOSS']
  const CULTURES = ['Communautarisme', 'Déisme', 'Lunisme', 'Naturalisme', 'Sethisme', 'Zélotisme']
  const REGIMES = ['Autoritarisme', 'Socialisme', 'Démocratie', 'Monarchie']
  const setups: SetupLine[] = Array.from({ length: 8 }, (_, i) => ({
    nom: `Joueur ${i + 1}`,
    peuple: PEUPLES[i % PEUPLES.length],
    culture: CULTURES[i % CULTURES.length],
    regime: REGIMES[i % REGIMES.length],
    taillePopulation: 50,
    pourcentageMariages: 40,
    villes: [`Capitale ${i + 1}`],
  }))
  const state = runTurn(runTurn(createGame(setups, 20261019, 'local')))
  saveLocal(state)
  return state
}
