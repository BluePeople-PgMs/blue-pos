import { getSupabaseBrowser } from "@/lib/supabase";

/** Sesión mínima para confirmar pedido delivery (anon si hace falta). */
export async function asegurarSesionDelivery(): Promise<{
  ok: boolean;
  error: string | null;
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { ok: false, error: "Sin cliente Supabase." };
  }

  const { data: sesion } = await supabase.auth.getSession();
  if (sesion.session) {
    return { ok: true, error: null };
  }

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    return {
      ok: false,
      error:
        error.message.includes("Anonymous")
          ? "Activa Anonymous sign-ins en Supabase Auth."
          : error.message,
    };
  }
  return { ok: true, error: null };
}