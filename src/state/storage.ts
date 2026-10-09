// ══════════════════════════════════════════════════════════════════════
//  Persistance locale (localStorage) — mode solo/hotseat
// ══════════════════════════════════════════════════════════════════════

import type { GameState } from '../engine/types'

const KEY = 'chasse-et-peche:save'

export function saveLocal(state: GameState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function loadLocal(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const state = JSON.parse(raw) as GameState
    if (!state || !Array.isArray(state.players) || state.players.length === 0) return null
    return state
  } catch {
    return null
  }
}

export function clearLocal() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function exportJson(state: GameState): string {
  return JSON.stringify(state, null, 2)
}

export function importJson(text: string): GameState | null {
  try {
    const state = JSON.parse(text) as GameState
    if (!state || !Array.isArray(state.players) || state.players.length === 0) return null
    return state
  } catch {
    return null
  }
}
