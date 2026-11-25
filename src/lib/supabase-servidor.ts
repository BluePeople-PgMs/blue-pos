import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function tokenDe(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

/** Cliente de Supabase con el JWT del cajero. No usa la service role. */
export function clienteConToken(accessToken: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || !accessToken) return null;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function exigirUsuario(request: Request) {
  const token = tokenDe(request);
  const supabase = clienteConToken(token);
  if (!supabase) {
    return { supabase: null, error: "Faltan las variables de Supabase o la sesión." };
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return {
      supabase: null,
      error: "La sesión no autoriza la base. Entra de nuevo en /login.",
    };
  }
  return { supabase, error: null };
}
