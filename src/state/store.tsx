// ══════════════════════════════════════════════════════════════════════
//  Store React — état de jeu, persistance (local ou Supabase), realtime
//  Mode 'local' : localStorage · Mode 'supabase' : table `parties`
//  Verrou optimiste : chaque mutation sauvegarde ; si une mise à jour
//  distante arrive pendant une édition locale, bandeau de conflit + recharge.
// ══════════════════════════════════════════════════════════════════════

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import type { GameState } from '../engine/types'
import { runTurn } from '../engine/engine'
import type { SetupLine } from '../engine/setup'
import { createGame } from '../engine/setup'
import * as storage from './storage'
import * as remote from '../supabase/client'

export type Mode = 'local' | 'supabase'

interface GameContextValue {
  state: GameState | null
  mode: Mode
  salon: string
  saving: boolean
  conflit: boolean
  lastSavedAt: number | null
  newGame: (setups: SetupLine[], seed: number, mode: Mode, salon?: string) => void
  joinGame: (salon: string) => Promise<boolean>
  nextTurn: () => void
  update: (mutator: (s: GameState) => void) => void
  replaceState: (s: GameState) => void
  saveNow: () => void
  reset: () => void
  importState: (json: string) => boolean
  exportState: () => string
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState | null>(() => storage.loadLocal())
  const [mode, setMode] = useState<Mode>('local')
  const [salon, setSalon] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [conflit, setConflit] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const lastLocalEdit = useRef(0)

  const persist = useCallback(async (s: GameState, m: Mode, salonId: string) => {
    setSaving(true)
    try {
      if (m === 'supabase' && salonId) {
        const ok = await remote.saveRemote(salonId, s)
        if (!ok) storage.saveLocal(s)
      } else {
        storage.saveLocal(s)
      }
      setLastSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }, [])

  const update = useCallback((mutator: (s: GameState) => void) => {
    setState((prev) => {
      if (!prev) return prev
      const draft: GameState = JSON.parse(JSON.stringify(prev))
      mutator(draft)
      lastLocalEdit.current = Date.now()
      void persist(draft, mode, salon)
      return draft
    })
  }, [mode, salon, persist])

  const nextTurn = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev
      const draft: GameState = JSON.parse(JSON.stringify(prev))
      runTurn(draft)
      lastLocalEdit.current = Date.now()
      void persist(draft, mode, salon)
      return draft
    })
  }, [mode, salon, persist])

  const newGame = useCallback((setups: SetupLine[], seed: number, m: Mode, salonId?: string) => {
    const s = createGame(setups, seed, m)
    setMode(m)
    setSalon(salonId ?? '')
    setConflit(false)
    setState(s)
    void persist(s, m, salonId ?? '')
  }, [persist])

  /** Rejoint une partie multijoueur existante (chargée depuis Supabase). */
  const joinGame = useCallback(async (salonId: string): Promise<boolean> => {
    const s = await remote.loadRemote(salonId)
    if (!s) return false
    setMode('supabase')
    setSalon(salonId)
    setConflit(false)
    lastLocalEdit.current = 0
    setState(s)
    return true
  }, [])

  const replaceState = useCallback((s: GameState) => {
    setState(s)
    lastLocalEdit.current = Date.now()
    void persist(s, mode, salon)
  }, [mode, salon, persist])

  const saveNow = useCallback(() => {
    if (state) void persist(state, mode, salon)
  }, [state, mode, salon, persist])

  const reset = useCallback(() => {
    storage.clearLocal()
    setState(null)
    setConflit(false)
  }, [])

  const importState = useCallback((json: string) => {
    const s = storage.importJson(json)
    if (s) {
      setState(s)
      lastLocalEdit.current = Date.now()
      void persist(s, mode, salon)
      return true
    }
    return false
  }, [mode, salon, persist])

  const exportState = useCallback(() => (state ? storage.exportJson(state) : ''), [state])

  // Abonnement realtime (mode supabase)
  useEffect(() => {
    if (mode !== 'supabase' || !salon) return
    const unsub = remote.subscribeRemote(salon, (remoteState) => {
      const localDirty = Date.now() - lastLocalEdit.current < 1500
      if (localDirty) setConflit(true)
      setState(remoteState)
    })
    return unsub
  }, [mode, salon])

  const value = useMemo<GameContextValue>(() => ({
    state, mode, salon, saving, conflit, lastSavedAt,
    newGame, joinGame, nextTurn, update, replaceState, saveNow, reset, importState, exportState,
  }), [state, mode, salon, saving, conflit, lastSavedAt,
    newGame, joinGame, nextTurn, update, replaceState, saveNow, reset, importState, exportState])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>')
  return ctx
}
