import {
  cobrarVenta,
  leerVenta,
  listarVentas,
  type MetodoPago,
  type VentaDetalle,
  type VentaLista,
} from "@/lib/ventas";
import { getSupabaseBrowser } from "@/lib/supabase";

export type { MetodoPago };

export const ETIQUETAS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

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

/** Ventas abiertas con líneas; pendientes de cobro en este módulo. */
export async function listarVentasPendientesDePago() {
  const { error, ventas } = await listarVentas();
  if (error) {
    return { error, ventas: [] as VentaLista[] };
  }
  const pendientes = ventas.filter(
    (v) => v.estado === "abierta" && v.lineas > 0 && v.total > 0,
  );
  return { error: null, ventas: pendientes };
}

export async function leerVentaParaPago(ventaId: string) {
  const { error, venta } = await leerVenta(ventaId);
  if (error || !venta) {
    return { error: error ?? "Venta no encontrada.", venta: null };
  }
  if (venta.estado !== "abierta") {
    return {
      error: "Esta venta ya no está pendiente de pago.",
      venta: null as VentaDetalle | null,
    };
  }
  if (venta.lineasDetalle.length === 0) {
    return { error: "La venta no tiene líneas.", venta: null };
  }
  return { error: null, venta };
}

export async function registrarPago(datos: {
  ventaId: string;
  metodo: MetodoPago;
}) {
  return cobrarVenta(datos);
}