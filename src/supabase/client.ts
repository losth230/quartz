// ══════════════════════════════════════════════════════════════════════
//  Client Supabase — mode multijoueur temps réel (8 joueurs simultanés)
//  Pas d'authentification : la table `parties` est accessible en anonyme
//  (RLS ouverte, cf. supabase/schema.sql) et suivie en realtime.
//
//  Les identifiants (URL du projet + clé anon PUBLIQUE) se règlent
//  directement dans l'interface (onglet Nouvelle partie → 🌐) et sont
//  mémorisés dans le navigateur : AUCUNE variable d'environnement ni
//  ligne de commande ne sont nécessaires. Les variables .env restent
//  prises en charge en secours pour le mode développeur.
// ══════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { GameState } from '../engine/types'

const LS_URL = 'cpe.supabase.url'
const LS_KEY = 'cpe.supabase.anon'

let client: SupabaseClient | null = null

function readCreds(): { url: string; key: string } {
  let url = ''
  let key = ''
  try {
    url = window.localStorage.getItem(LS_URL) ?? ''
    key = window.localStorage.getItem(LS_KEY) ?? ''
  } catch { /* localStorage indisponible (mode privé etc.) */ }
  if (!url) url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
  if (!key) key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
  return { url, key }
}

/** Identifiants actuellement configurés (localStorage puis .env). */
export function supabaseCreds(): { url: string; key: string } | null {
  const { url, key } = readCreds()
  return url && key ? { url, key } : null
}

/** Mémorise les identifiants dans le navigateur et réinitialise le client. */
export function setSupabaseCredentials(url: string, key: string): void {
  try {
    window.localStorage.setItem(LS_URL, url.trim())
    window.localStorage.setItem(LS_KEY, key.trim())
  } catch { /* noop */ }
  client = null
}

/** Oublie les identifiants mémorisés et réinitialise le client. */
export function clearSupabaseCredentials(): void {
  try {
    window.localStorage.removeItem(LS_URL)
    window.localStorage.removeItem(LS_KEY)
  } catch { /* noop */ }
  client = null
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const { url, key } = readCreds()
  if (!url || !key) return null
  client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 5 } },
  })
  return client
}

export function supabaseAvailable(): boolean {
  return getSupabase() !== null
}

/** Vérifie que l'URL + la clé fonctionnent et que la table `parties` existe. */
export async function testSupabase(): Promise<{ ok: boolean; message: string }> {
  const sb = getSupabase()
  if (!sb) return { ok: false, message: 'Renseignez l\'URL et la clé anon, puis « Connecter ».' }
  const { error } = await sb.from('parties').select('id').limit(1)
  if (error) {
    return { ok: false, message: `Connexion OK mais table introuvable : ${error.message}. Exécutez supabase/schema.sql dans l'éditeur SQL de votre projet Supabase.` }
  }
  return { ok: true, message: 'Connecté : multijoueur temps réel disponible.' }
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
