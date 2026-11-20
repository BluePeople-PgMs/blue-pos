import { getSupabaseBrowser } from "@/lib/supabase";

export type CancelacionLista = {
  id: string;
  folio: string | null;
  motivo: string | null;
  cuando: string;
};

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

export async function listarCancelaciones() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error: "Faltan las variables de Supabase.",
      cancelaciones: [] as CancelacionLista[],
    };
  }

  const { data: sesionData } = await supabase.auth.getSession();
  if (!sesionData.session) {
    return { error: SIN_SESION, cancelaciones: [] as CancelacionLista[] };
  }

  const { data, error } = await supabase
    .from("cancelaciones")
    .select("id, venta_id, motivo, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return {
      error: mensajeLegible(error.message),
      cancelaciones: [] as CancelacionLista[],
    };
  }

  const ventaIds = (data ?? []).map((c) => c.venta_id);
  const folios = new Map<string, string | null>();
  if (ventaIds.length > 0) {
    const { data: ventas } = await supabase
      .from("ventas")
      .select("id, folio")
      .in("id", ventaIds);
    for (const venta of ventas ?? []) {
      folios.set(venta.id, venta.folio);
    }
  }

  const cancelaciones: CancelacionLista[] = (data ?? []).map((fila) => ({
    id: fila.id,
    folio: folios.get(fila.venta_id) ?? null,
    motivo: fila.motivo,
    cuando: fila.created_at,
  }));

  return { error: null, cancelaciones };
}

function mensajeLegible(mensaje: string) {
  if (
    mensaje.toLowerCase().includes("permission") ||
    mensaje.toLowerCase().includes("jwt") ||
    mensaje.toLowerCase().includes("row-level")
  ) {
    return SIN_SESION;
  }
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudieron leer las cancelaciones. La base no respondió.";
  }
  return mensaje;
}