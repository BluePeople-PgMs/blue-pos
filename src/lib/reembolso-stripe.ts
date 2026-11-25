import { getSupabaseBrowser } from "@/lib/supabase";

async function tokenDeSesion() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export async function confirmarSesionStripe(sessionId: string) {
  const token = await tokenDeSesion();
  const respuesta = await fetch("/api/stripe/confirmar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId }),
  });
  const cuerpo = (await respuesta.json().catch(() => null)) as {
    error?: string;
    ventaId?: string | null;
    facturaUrl?: string | null;
  } | null;
  if (!respuesta.ok) {
    return {
      error: cuerpo?.error ?? "No se pudo confirmar el pago de Stripe.",
      ventaId: null as string | null,
      facturaUrl: null as string | null,
    };
  }
  return {
    error: null as string | null,
    ventaId: cuerpo?.ventaId ?? null,
    facturaUrl: cuerpo?.facturaUrl ?? null,
  };
}

export async function reembolsarTarjeta(datos: {
  ventaId: string;
  paymentIntentId: string;
}) {
  const token = await tokenDeSesion();
  if (!token) return { error: "Faltan las variables de Supabase o la sesión." };
  const respuesta = await fetch("/api/stripe/reembolso", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });
  const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null;
  if (!respuesta.ok) {
    return { error: cuerpo?.error ?? "Stripe no pudo reembolsar la tarjeta." };
  }
  return { error: null };
}
