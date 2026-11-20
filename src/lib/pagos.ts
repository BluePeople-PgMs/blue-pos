import { getSupabaseBrowser } from "@/lib/supabase";

export type PagoLista = {
  id: string;
  folio: string | null;
  metodo: string;
  monto: number;
  cuando: string;
};

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

export async function listarPagos() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase.", pagos: [] as PagoLista[] };
  }

  const { data: sesionData } = await supabase.auth.getSession();
  if (!sesionData.session) {
    return { error: SIN_SESION, pagos: [] as PagoLista[] };
  }

  const { data, error } = await supabase
    .from("pagos")
    .select("id, venta_id, metodo, monto, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return { error: mensajeLegible(error.message), pagos: [] as PagoLista[] };
  }

  const ventaIds = [
    ...new Set(
      (data ?? []).map((p) => p.venta_id).filter((id): id is string => Boolean(id)),
    ),
  ];
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

  const pagos: PagoLista[] = (data ?? []).map((pago) => ({
    id: pago.id,
    folio: pago.venta_id ? (folios.get(pago.venta_id) ?? null) : null,
    metodo: pago.metodo,
    monto: Number(pago.monto),
    cuando: pago.created_at,
  }));

  return { error: null, pagos };
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
    return "No se pudieron leer los pagos. La base no respondió.";
  }
  return mensaje;
}