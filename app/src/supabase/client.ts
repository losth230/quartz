// ══════════════════════════════════════════════════════════════════════
//  Client Supabase — mode multijoueur temps réel (8 joueurs simultanés)
//  Pas d'authentification : la table `parties` est accessible en anonyme
//  (RLS ouverte, cf. supabase/schema.sql) et suivie en realtime.
// ══════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { GameState } from '../engine/types'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 5 } },
  })
  return client
}

export function supabaseAvailable(): boolean {
  return getSupabase() !== null
}

const TABLE = 'parties'

/** Charge une partie depuis Supabase (id = code de salon). */
export async function loadRemote(id: string): Promise<GameState | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from(TABLE).select('state').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data.state as GameState
}

/** Sauvegarde une partie (création ou mise à jour) — upsert. */
export async function saveRemote(id: string, state: GameState): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  const { error } = await sb.from(TABLE).upsert({
    id,
    state,
    updated_at: new Date().toISOString(),
  })
  return !error
}

/** S'abonne aux changements du salon. Retourne la fonction de désabonnement. */
export function subscribeRemote(
  id: string,
  onChange: (state: GameState) => void,
): () => void {
  const sb = getSupabase()
  if (!sb) return () => {}
  const channel = sb
    .channel(`parties:${id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: TABLE,
      filter: `id=eq.${id}`,
    }, (payload: { new: { state: GameState } }) => {
      if (payload.new?.state) onChange(payload.new.state)
    })
    .subscribe()
  return () => {
    sb.removeChannel(channel)
  }
}
