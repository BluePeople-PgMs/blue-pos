import { getSupabaseBrowser } from "@/lib/supabase";
import {
  aplicarSalidasInventarioVenta,
  calcularSalidasInventarioPorLineas,
  validarExistenciasParaSalidas,
} from "@/lib/salida-inventario-venta";
import {
  esMetodoPago,
  leerCatalogoVentas,
  type MetodoPago,
  type ProductoVenta,
} from "@/lib/ventas";

export type EstadoEntrega =
  | "recibido"
  | "en_preparacion"
  | "listo_para_recoger"
  | "en_camino"
  | "entregado";

export const ETIQUETAS_ESTADO: Record<EstadoEntrega, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  listo_para_recoger: "Listo para recoger",
  en_camino: "En camino",
  entregado: "Entregado",
};

export const ORDEN_ESTADOS: EstadoEntrega[] = [
  "recibido",
  "en_preparacion",
  "listo_para_recoger",
  "en_camino",
  "entregado",
];

export const SIGUIENTE_ESTADO: Partial<Record<EstadoEntrega, EstadoEntrega>> = {
  recibido: "en_preparacion",
  en_preparacion: "listo_para_recoger",
  listo_para_recoger: "en_camino",
  en_camino: "entregado",
};

export const ACCION_SIGUIENTE: Partial<Record<EstadoEntrega, string>> = {
  recibido: "Pasar a preparación",
  en_preparacion: "Marcar listo",
  listo_para_recoger: "Asignar repartidor y salir",
  en_camino: "Confirmar entregado",
};

export type EntregaLista = {
  id: string;
  folio: string | null;
  estado: EstadoEntrega;
  clienteNombre: string;
  direccion: string;
  telefono: string | null;
  repartidor: string | null;
  total: number;
  cuando: string;
  lineas: number;
};

export type LineaEntrega = {
  id: string;
  productoId: string | null;
  producto: string;
  codigo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type EntregaDetalle = EntregaLista & {
  ventaId: string | null;
  notas: string | null;
  lineasDetalle: LineaEntrega[];
};

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

function mensajeLegible(mensaje: string) {
  if (
    mensaje.toLowerCase().includes("permission") ||
    mensaje.toLowerCase().includes("jwt") ||
    mensaje.toLowerCase().includes("row-level")
  ) {
    return SIN_SESION;
  }
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudo completar la operación. La base no respondió.";
  }
  return mensaje;
}

async function exigirSesion() {
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

export async function productosParaEntrega(): Promise<{
  error: string | null;
  productos: ProductoVenta[];
}> {
  return leerCatalogoVentas();
}

export async function listarEntregas() {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) {
    return { error: sesionError, entregas: [] as EntregaLista[] };
  }
  if (sesionError) {
    return { error: sesionError, entregas: [] as EntregaLista[] };
  }

  const { data, error } = await supabase
    .from("entregas")
    .select("id, folio, estado, cliente_nombre, direccion, telefono, repartidor, total, created_at, entrega_lineas(id)")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return { error: mensajeLegible(error.message), entregas: [] as EntregaLista[] };
  }

  const entregas: EntregaLista[] = (data ?? []).map((fila) => {
    const lineasRaw = fila.entrega_lineas as { id: string }[] | null;
    return {
      id: fila.id,
      folio: fila.folio,
      estado: fila.estado as EstadoEntrega,
      clienteNombre: fila.cliente_nombre,
      direccion: fila.direccion,
      telefono: fila.telefono,
      repartidor: fila.repartidor,
      total: Number(fila.total),
      cuando: fila.created_at,
      lineas: lineasRaw?.length ?? 0,
    };
  });

  return { error: null, entregas };
}

export async function leerEntrega(entregaId: string) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) {
    return { error: sesionError, entrega: null as EntregaDetalle | null };
  }
  if (sesionError) {
    return { error: sesionError, entrega: null };
  }

  const { data: fila, error } = await supabase
    .from("entregas")
    .select(
      "id, folio, estado, cliente_nombre, direccion, telefono, repartidor, total, venta_id, notas, created_at",
    )
    .eq("id", entregaId)
    .maybeSingle();

  if (error || !fila) {
    return {
      error: error ? mensajeLegible(error.message) : "Entrega no encontrada.",
      entrega: null,
    };
  }

  const { data: lineas, error: lineasError } = await supabase
    .from("entrega_lineas")
    .select("id, producto_id, cantidad, precio_unitario, notas")
    .eq("entrega_id", entregaId);

  if (lineasError) {
    return { error: mensajeLegible(lineasError.message), entrega: null };
  }

  const ids = [
    ...new Set(
      (lineas ?? [])
        .map((l) => l.producto_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let nombres = new Map<string, { nombre: string; codigo: string }>();
  if (ids.length > 0) {
    const { data: productos } = await supabase
      .from("productos")
      .select("id, nombre, codigo")
      .in("id", ids);
    nombres = new Map(
      (productos ?? []).map((p) => [
        p.id,
        { nombre: p.nombre, codigo: p.codigo ?? "" },
      ]),
    );
  }

  const lineasDetalle: LineaEntrega[] = (lineas ?? []).map((l) => {
    const info = l.producto_id ? nombres.get(l.producto_id) : undefined;
    const cantidad = Number(l.cantidad);
    const precioUnitario = Number(l.precio_unitario);
    return {
      id: l.id,
      productoId: l.producto_id,
      producto: info?.nombre ?? "Producto",
      codigo: info?.codigo ?? "",
      cantidad,
      precioUnitario,
      subtotal: cantidad * precioUnitario,
    };
  });

  const entrega: EntregaDetalle = {
    id: fila.id,
    folio: fila.folio,
    estado: fila.estado as EstadoEntrega,
    clienteNombre: fila.cliente_nombre,
    direccion: fila.direccion,
    telefono: fila.telefono,
    repartidor: fila.repartidor,
    total: Number(fila.total),
    cuando: fila.created_at,
    lineas: lineasDetalle.length,
    ventaId: fila.venta_id,
    notas: fila.notas,
    lineasDetalle,
  };

  return { error: null, entrega };
}

function generarFolioEntrega() {
  return `D-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

function generarFolioVenta() {
  return `V-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

export type LineaEntregaNueva = {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  producto?: string;
};

export async function crearEntregaRecibida(datos: {
  clienteNombre: string;
  direccion: string;
  telefono?: string;
  notas?: string;
  metodo: MetodoPago;
  lineas: LineaEntregaNueva[];
}) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError, entregaId: null as string | null };
  if (sesionError) return { error: sesionError, entregaId: null };

  const cliente = datos.clienteNombre.trim();
  const direccion = datos.direccion.trim();
  if (!cliente) return { error: "Escribe el nombre del cliente.", entregaId: null };
  if (!direccion) return { error: "Escribe la dirección de entrega.", entregaId: null };
  if (datos.lineas.length === 0) {
    return { error: "Agrega al menos un producto.", entregaId: null };
  }
  if (!esMetodoPago(datos.metodo)) {
    return { error: "Elige un método de pago válido.", entregaId: null };
  }

  for (const linea of datos.lineas) {
    if (linea.cantidad <= 0) {
      return { error: "Las cantidades deben ser mayores a cero.", entregaId: null };
    }
  }

  const total = datos.lineas.reduce(
    (suma, linea) => suma + linea.cantidad * linea.precioUnitario,
    0,
  );

  const calculo = await calcularSalidasInventarioPorLineas(
    supabase,
    datos.lineas.map((linea) => ({
      productoId: linea.productoId,
      cantidad: linea.cantidad,
      producto: linea.producto,
    })),
  );
  if (calculo.error) return { error: calculo.error, entregaId: null };

  const existencias = await validarExistenciasParaSalidas(
    supabase,
    calculo.salidas,
    calculo.nombrePorId,
  );
  if (existencias.error) return { error: existencias.error, entregaId: null };

  const folioEntrega = generarFolioEntrega();
  const folioVenta = generarFolioVenta();

  const { data: ventaRow, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      folio: folioVenta,
      estado: "cobrada",
      total,
    })
    .select("id")
    .single();

  if (ventaError || !ventaRow) {
    return {
      error: ventaError ? mensajeLegible(ventaError.message) : "No se creó la venta.",
      entregaId: null,
    };
  }

  const ventaId = ventaRow.id;

  const { error: lineasVentaError } = await supabase.from("venta_lineas").insert(
    datos.lineas.map((linea) => ({
      venta_id: ventaId,
      producto_id: linea.productoId,
      cantidad: linea.cantidad,
      precio_unitario: linea.precioUnitario,
    })),
  );

  if (lineasVentaError) {
    await supabase.from("ventas").delete().eq("id", ventaId);
    return { error: mensajeLegible(lineasVentaError.message), entregaId: null };
  }

  const { error: pagoError } = await supabase.from("pagos").insert({
    venta_id: ventaId,
    metodo: datos.metodo,
    monto: total,
  });

  if (pagoError) {
    await supabase.from("venta_lineas").delete().eq("venta_id", ventaId);
    await supabase.from("ventas").delete().eq("id", ventaId);
    return { error: mensajeLegible(pagoError.message), entregaId: null };
  }

  const aplicar = await aplicarSalidasInventarioVenta(supabase, {
    ventaId,
    cajaId: null,
    folio: folioVenta,
    salidas: calculo.salidas,
    nombrePorId: calculo.nombrePorId,
    nota: `Domicilio ${folioEntrega} · venta ${folioVenta}`,
  });

  if (aplicar.error) {
    await supabase.from("pagos").delete().eq("venta_id", ventaId);
    await supabase.from("venta_lineas").delete().eq("venta_id", ventaId);
    await supabase.from("ventas").delete().eq("id", ventaId);
    return { error: aplicar.error, entregaId: null };
  }

  const { data: entregaRow, error: entregaError } = await supabase
    .from("entregas")
    .insert({
      folio: folioEntrega,
      estado: "recibido",
      cliente_nombre: cliente,
      direccion,
      telefono: datos.telefono?.trim() || null,
      notas: datos.notas?.trim() || null,
      total,
      venta_id: ventaId,
    })
    .select("id")
    .single();

  if (entregaError || !entregaRow) {
    await supabase.from("pagos").delete().eq("venta_id", ventaId);
    await supabase.from("venta_lineas").delete().eq("venta_id", ventaId);
    await supabase.from("ventas").delete().eq("id", ventaId);
    return {
      error: entregaError
        ? mensajeLegible(entregaError.message)
        : "No se registró la entrega.",
      entregaId: null,
    };
  }

  const { error: lineasEntregaError } = await supabase.from("entrega_lineas").insert(
    datos.lineas.map((linea) => ({
      entrega_id: entregaRow.id,
      producto_id: linea.productoId,
      cantidad: linea.cantidad,
      precio_unitario: linea.precioUnitario,
    })),
  );

  if (lineasEntregaError) {
    return {
      error: mensajeLegible(lineasEntregaError.message),
      entregaId: entregaRow.id,
    };
  }

  return { error: null, entregaId: entregaRow.id };
}

export async function avanzarEstadoEntrega(
  entregaId: string,
  datos?: { repartidor?: string },
) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError };
  if (sesionError) return { error: sesionError };

  const { data: fila, error } = await supabase
    .from("entregas")
    .select("id, estado")
    .eq("id", entregaId)
    .maybeSingle();

  if (error || !fila) {
    return { error: error ? mensajeLegible(error.message) : "Entrega no encontrada." };
  }

  const estadoActual = fila.estado as EstadoEntrega;
  const siguiente = SIGUIENTE_ESTADO[estadoActual];
  if (!siguiente) {
    return { error: "Esta entrega ya está cerrada." };
  }

  const actualizacion: {
    estado: EstadoEntrega;
    repartidor?: string;
  } = { estado: siguiente };

  if (estadoActual === "listo_para_recoger") {
    const nombre = datos?.repartidor?.trim() ?? "";
    if (!nombre) {
      return { error: "Escribe el nombre del repartidor." };
    }
    actualizacion.repartidor = nombre;
  }

  const { error: updateError } = await supabase
    .from("entregas")
    .update(actualizacion)
    .eq("id", entregaId)
    .eq("estado", estadoActual);

  if (updateError) {
    return { error: mensajeLegible(updateError.message) };
  }

  return { error: null };
}