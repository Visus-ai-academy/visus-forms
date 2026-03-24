import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "visus-forms";

let _supabaseAdmin: SupabaseClient | null = null;

/** Server-side admin client (service role — bypasses RLS). Lazy-initialized. */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias"
    );
  }

  _supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _supabaseAdmin;
}
