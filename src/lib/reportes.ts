import { getSupabaseBrowser } from "@/lib/supabase";

export type TipoReporte =
  | "ventas"
  | "inventario"
  | "cancelaciones"
  | "combos"
  | "recetas";

export type FilaConteo = {
  nombre: string;
  cantidad: number;
  detalle?: string;
};

export type ReporteVentas = {
  tickets: number;
  abiertas: number;
  cobradas: number;
  canceladas: number;
  totalCobrado: number;
};

export type ReporteInventario = {
  entradas: number;
  salidasVenta: number;
  cancelaciones: number;
  productosConMasSalida: FilaConteo[];
};

export type ReporteCancelaciones = {
  total: number;
  filas: { folio: string | null; motivo: string | null; cuando: string }[];
};

export type ReporteConsumo = {
  filas: FilaConteo[];
};

export type ResultadoReporte =
  | { tipo: "ventas"; datos: ReporteVentas }
  | { tipo: "inventario"; datos: ReporteInventario }
  | { tipo: "cancelaciones"; datos: ReporteCancelaciones }
  | { tipo: "combos" | "recetas"; datos: ReporteConsumo };

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

function rangoFechas(desde: string, hasta: string) {
  return {
    inicio: `${desde}T00:00:00.000Z`,
    fin: `${hasta}T23:59:59.999Z`,
  };
}

function mensajeLegible(mensaje: string) {
  if (
    mensaje.toLowerCase().includes("permission") ||
    mensaje.toLowerCase().includes("jwt") ||
    mensaje.toLowerCase().includes("row-level")
  ) {
    return SIN_SESION;
  }
  return mensaje;
}

async function exigirCliente() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { supabase: null as null, error: "Faltan las variables de Supabase." };
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return { supabase, error: SIN_SESION };
  }
  return { supabase, error: null };
}

export async function generarReporte(
  tipo: TipoReporte,
  desde: string,
  hasta: string,
): Promise<{ error: string | null; resultado: ResultadoReporte | null }> {
  if (!desde || !hasta) {
    return { error: "Elige fecha desde y hasta.", resultado: null };
  }
  if (desde > hasta) {
    return { error: "La fecha inicial no puede ser posterior a la final.", resultado: null };
  }

  const { supabase, error: sesionError } = await exigirCliente();
  if (!supabase) return { error: sesionError, resultado: null };
  if (sesionError) return { error: sesionError, resultado: null };

  const { inicio, fin } = rangoFechas(desde, hasta);

  switch (tipo) {
    case "ventas":
      return reporteVentas(supabase, inicio, fin);
    case "inventario":
      return reporteInventario(supabase, inicio, fin);
    case "cancelaciones":
      return reporteCancelaciones(supabase, inicio, fin);
    case "combos":
      return reporteConsumoPorTipo(supabase, inicio, fin, "combo");
    case "recetas":
      return reporteConsumoPorTipo(supabase, inicio, fin, "preparado");
  }
}

async function reporteVentas(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowser>>,
  inicio: string,
  fin: string,
) {
  const { data, error } = await supabase
    .from("ventas")
    .select("estado, total")
    .gte("created_at", inicio)
    .lte("created_at", fin);

  if (error) return { error: mensajeLegible(error.message), resultado: null };

  let abiertas = 0;
  let cobradas = 0;
  let canceladas = 0;
  let totalCobrado = 0;
  for (const v of data ?? []) {
    if (v.estado === "abierta") abiertas++;
    else if (v.estado === "cobrada") {
      cobradas++;
      totalCobrado += Number(v.total);
    } else if (v.estado === "cancelada") canceladas++;
  }

  return {
    error: null,
    resultado: {
      tipo: "ventas" as const,
      datos: {
        tickets: (data ?? []).length,
        abiertas,
        cobradas,
        canceladas,
        totalCobrado,
      },
    },
  };
}

async function reporteInventario(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowser>>,
  inicio: string,
  fin: string,
) {
  const { data, error } = await supabase
    .from("movimientos_inventario")
    .select("tipo, cantidad, producto_id")
    .gte("created_at", inicio)
    .lte("created_at", fin);

  if (error) return { error: mensajeLegible(error.message), resultado: null };

  let entradas = 0;
  let salidasVenta = 0;
  let cancelaciones = 0;
  const porProducto = new Map<string, number>();

  for (const mov of data ?? []) {
    const cantidad = Number(mov.cantidad);
    if (mov.tipo === "entrada") entradas += cantidad;
    else if (mov.tipo === "salida_venta") {
      salidasVenta += cantidad;
      if (mov.producto_id) {
        porProducto.set(
          mov.producto_id,
          (porProducto.get(mov.producto_id) ?? 0) + cantidad,
        );
      }
    } else if (mov.tipo === "cancelacion") cancelaciones += cantidad;
  }

  const ids = [...porProducto.keys()];
  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data: productos } = await supabase
      .from("productos")
      .select("id, nombre")
      .in("id", ids);
    for (const p of productos ?? []) {
      nombres.set(p.id, p.nombre);
    }
  }

  const productosConMasSalida: FilaConteo[] = [...porProducto.entries()]
    .map(([id, cantidad]) => ({
      nombre: nombres.get(id) ?? id.slice(0, 8),
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  return {
    error: null,
    resultado: {
      tipo: "inventario" as const,
      datos: {
        entradas,
        salidasVenta,
        cancelaciones,
        productosConMasSalida,
      },
    },
  };
}

async function reporteCancelaciones(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowser>>,
  inicio: string,
  fin: string,
) {
  const { data, error } = await supabase
    .from("cancelaciones")
    .select("venta_id, motivo, created_at")
    .gte("created_at", inicio)
    .lte("created_at", fin)
    .order("created_at", { ascending: false });

  if (error) return { error: mensajeLegible(error.message), resultado: null };

  const ventaIds = [...new Set((data ?? []).map((c) => c.venta_id))];
  const folios = new Map<string, string | null>();
  if (ventaIds.length > 0) {
    const { data: ventas } = await supabase
      .from("ventas")
      .select("id, folio")
      .in("id", ventaIds);
    for (const v of ventas ?? []) {
      folios.set(v.id, v.folio);
    }
  }

  const filas = (data ?? []).map((c) => ({
    folio: folios.get(c.venta_id) ?? null,
    motivo: c.motivo,
    cuando: c.created_at,
  }));

  return {
    error: null,
    resultado: {
      tipo: "cancelaciones" as const,
      datos: { total: filas.length, filas },
    },
  };
}

async function reporteConsumoPorTipo(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowser>>,
  inicio: string,
  fin: string,
  tipoProducto: "combo" | "preparado",
) {
  const { data: ventas, error: ventasError } = await supabase
    .from("ventas")
    .select("id")
    .eq("estado", "cobrada")
    .gte("created_at", inicio)
    .lte("created_at", fin);

  if (ventasError) {
    return { error: mensajeLegible(ventasError.message), resultado: null };
  }

  const ventaIds = (ventas ?? []).map((v) => v.id);
  if (ventaIds.length === 0) {
    return {
      error: null,
      resultado: {
        tipo: tipoProducto === "combo" ? ("combos" as const) : ("recetas" as const),
        datos: { filas: [] as FilaConteo[] },
      },
    };
  }

  const { data: lineas, error: lineasError } = await supabase
    .from("venta_lineas")
    .select("producto_id, cantidad")
    .in("venta_id", ventaIds);

  if (lineasError) {
    return { error: mensajeLegible(lineasError.message), resultado: null };
  }

  const productoIds = [
    ...new Set(
      (lineas ?? [])
        .map((l) => l.producto_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (productoIds.length === 0) {
    return {
      error: null,
      resultado: {
        tipo: tipoProducto === "combo" ? ("combos" as const) : ("recetas" as const),
        datos: { filas: [] as FilaConteo[] },
      },
    };
  }

  const { data: productos, error: prodError } = await supabase
    .from("productos")
    .select("id, nombre, tipo, codigo")
    .in("id", productoIds)
    .eq("tipo", tipoProducto);

  if (prodError) {
    return { error: mensajeLegible(prodError.message), resultado: null };
  }

  const idsValidos = new Set((productos ?? []).map((p) => p.id));
  const nombres = new Map(
    (productos ?? []).map((p) => [p.id, p.nombre] as const),
  );
  const codigos = new Map(
    (productos ?? []).map((p) => [p.id, p.codigo] as const),
  );

  const acumulado = new Map<string, number>();
  for (const linea of lineas ?? []) {
    if (!linea.producto_id || !idsValidos.has(linea.producto_id)) continue;
    const prev = acumulado.get(linea.producto_id) ?? 0;
    acumulado.set(linea.producto_id, prev + Number(linea.cantidad));
  }

  const filas: FilaConteo[] = [...acumulado.entries()]
    .map(([id, cantidad]) => ({
      nombre: nombres.get(id) ?? id.slice(0, 8),
      cantidad,
      detalle: codigos.get(id) ?? undefined,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return {
    error: null,
    resultado: {
      tipo: tipoProducto === "combo" ? ("combos" as const) : ("recetas" as const),
      datos: { filas },
    },
  };
}