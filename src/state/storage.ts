// ══════════════════════════════════════════════════════════════════════
//  Persistance locale (localStorage) — mode solo/hotseat
//  + configuration COMMUNE à toutes les parties (clé dédiée).
// ══════════════════════════════════════════════════════════════════════

import type { GameState } from '../engine/types'
import { cloneDefaultConfig, type GameConfig } from '../config/defaultConfig'

const KEY = 'chasse-et-peche:save'
const CONFIG_KEY = 'chasse-et-peche:config'

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
    // migration : les parties sans config reçoivent la config par défaut
    if (!state.config) state.config = cloneDefaultConfig()
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

// ── Configuration commune (indépendante des parties) ──────────────────

export function saveGlobalConfig(config: GameConfig): boolean {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export function loadGlobalConfig(): GameConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    const config = JSON.parse(raw) as GameConfig
    if (!config || !Array.isArray(config.titres) || !config.params) return null
    return config
  } catch {
    return null
  }
}

export function exportJson(state: GameState): string {
  return JSON.stringify(state, null, 2)
}

export function importJson(text: string): GameState | null {
  try {
    const state = JSON.parse(text) as GameState
    if (!state || !Array.isArray(state.players) || state.players.length === 0) return null
    if (!state.config) state.config = cloneDefaultConfig()
    return state
  } catch {
    return null
  }
}
