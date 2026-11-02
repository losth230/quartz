// ============================================================
//  Client Supabase partagé — C&P / Khazhags
//  À placer dans : quartz/static/cp-supabase.js
//
//  Un SEUL client pour toute l'application : les modules
//  (cp-stats, cp-army-lists, cp-bug-tracker, cp-bug-report)
//  importent `sb` depuis ce fichier au lieu de créer chacun
//  le leur. Grâce au cache des modules ES, le client n'est
//  instancié qu'une fois (plus de warning "Multiple GoTrueClient").
//
//  C'est le SEUL endroit où l'URL et la clé sont définies.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⬇️⬇️ REMPLACE CES DEUX VALEURS ⬇️⬇️
const SUPABASE_URL = "https://kucgmmefluwmlobujanc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YB_VCzZgD2vi4xeFvFT6ZA_BA9Pwn7R";
// ⬆️⬆️ ----------------------------- ⬆️⬆️

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportés aussi pour construire les URL des Edge Functions
// (ex. `${SUPABASE_URL}/functions/v1/ma-fonction`) sans redéfinir la ref ailleurs.
export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_ANON_KEY;
