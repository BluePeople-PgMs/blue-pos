import { getSupabaseBrowser } from "@/lib/supabase";

export type ProductoVenta = {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  precio: number;
  unidad: string;
  existencia: number;
};

export type LineaVenta = {
  id: string;
  productoId: string | null;
  producto: string;
  codigo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas: string;
};

export type VentaLista = {
  id: string;
  folio: string | null;
  estado: "abierta" | "cobrada" | "cancelada";
  total: number;
  cuando: string;
  lineas: number;
};

export type PagoVenta = {
  metodo: string;
  monto: number;
  cuando: string;
};

export type CancelacionVenta = {
  motivo: string | null;
  cuando: string;
};

export type VentaDetalle = VentaLista & {
  cajaId: string | null;
  lineasDetalle: LineaVenta[];
  pago: PagoVenta | null;
  cancelacion: CancelacionVenta | null;
};

export type CambioExistencia = {
  productoId: string;
  nombre: string;
  anterior: number;
  siguiente: number;
};

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia"] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export function esMetodoPago(valor: string): valor is MetodoPago {
  return (METODOS_PAGO as readonly string[]).includes(valor);
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

export async function leerCatalogoVentas() {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) {
    return {
      error: sesionError,
      productos: [] as ProductoVenta[],
    };
  }
  if (sesionError) {
    return { error: sesionError, productos: [] as ProductoVenta[] };
  }

  const [productosRes, unidadesRes, existenciasRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, codigo, tipo, precio, unidad_id")
      .eq("activo", true)
      .in("tipo", ["preparado", "directo"]),
    supabase.from("unidades").select("id, abreviatura, nombre"),
    supabase.from("existencias").select("producto_id, cantidad"),
  ]);

  const error =
    productosRes.error ?? unidadesRes.error ?? existenciasRes.error;
  if (error) {
    return { error: mensajeLegible(error.message), productos: [] as ProductoVenta[] };
  }

  const unidades = new Map(
    (unidadesRes.data ?? []).map((u) => [u.id, u]),
  );
  const existencias = new Map(
    (existenciasRes.data ?? []).map((e) => [
      e.producto_id,
      Number(e.cantidad),
    ]),
  );

  const productos = (productosRes.data ?? []).map((p) => {
    const unidad = p.unidad_id ? unidades.get(p.unidad_id) : undefined;
    return {
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo ?? "",
      tipo: p.tipo,
      precio: Number(p.precio ?? 0),
      unidad: unidad?.abreviatura ?? unidad?.nombre ?? "",
      existencia: existencias.get(p.id) ?? 0,
    };
  });

  productos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return { error: null, productos };
}

export async function listarVentas() {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) {
    return { error: sesionError, ventas: [] as VentaLista[] };
  }
  if (sesionError) {
    return { error: sesionError, ventas: [] as VentaLista[] };
  }

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, folio, estado, total, created_at, venta_lineas(id)")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return { error: mensajeLegible(error.message), ventas: [] as VentaLista[] };
  }

  const lista: VentaLista[] = (ventas ?? []).map((v) => {
    const lineasRaw = v.venta_lineas as { id: string }[] | null;
    return {
      id: v.id,
      folio: v.folio,
      estado: v.estado as VentaLista["estado"],
      total: Number(v.total),
      cuando: v.created_at,
      lineas: lineasRaw?.length ?? 0,
    };
  });

  return { error: null, ventas: lista };
}

export async function leerVenta(ventaId: string) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) {
    return { error: sesionError, venta: null as VentaDetalle | null };
  }
  if (sesionError) {
    return { error: sesionError, venta: null };
  }

  const { data: venta, error } = await supabase
    .from("ventas")
    .select("id, folio, estado, total, created_at, caja_id")
    .eq("id", ventaId)
    .maybeSingle();

  if (error || !venta) {
    return {
      error: error ? mensajeLegible(error.message) : "Venta no encontrada.",
      venta: null,
    };
  }

  const { data: lineas, error: lineasError } = await supabase
    .from("venta_lineas")
    .select("id, producto_id, cantidad, precio_unitario, notas")
    .eq("venta_id", ventaId);

  if (lineasError) {
    return { error: mensajeLegible(lineasError.message), venta: null };
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

  const lineasDetalle: LineaVenta[] = (lineas ?? []).map((l) => {
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
      notas: l.notas ?? "",
    };
  });

  let pago: PagoVenta | null = null;
  let cancelacion: CancelacionVenta | null = null;
  const estado = venta.estado as VentaDetalle["estado"];

  if (estado === "cobrada" || estado === "cancelada") {
    const { data: pagoRow } = await supabase
      .from("pagos")
      .select("metodo, monto, created_at")
      .eq("venta_id", ventaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pagoRow) {
      pago = {
        metodo: pagoRow.metodo,
        monto: Number(pagoRow.monto),
        cuando: pagoRow.created_at,
      };
    }
  }

  if (estado === "cancelada") {
    const { data: cancelRow } = await supabase
      .from("cancelaciones")
      .select("motivo, created_at")
      .eq("venta_id", ventaId)
      .maybeSingle();
    if (cancelRow) {
      cancelacion = {
        motivo: cancelRow.motivo,
        cuando: cancelRow.created_at,
      };
    }
  }

  return {
    error: null,
    venta: {
      id: venta.id,
      folio: venta.folio,
      estado,
      total: Number(venta.total),
      cuando: venta.created_at,
      lineas: lineasDetalle.length,
      cajaId: venta.caja_id,
      lineasDetalle,
      pago,
      cancelacion,
    },
  };
}

export async function existenciasDeLineas(lineas: LineaVenta[]) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase || sesionError) {
    return { error: sesionError ?? "Sin sesión.", cantidades: new Map<string, number>() };
  }

  const ids = [
    ...new Set(
      lineas
        .map((l) => l.productoId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (ids.length === 0) {
    return { error: null, cantidades: new Map<string, number>() };
  }

  const { data, error } = await supabase
    .from("existencias")
    .select("producto_id, cantidad")
    .in("producto_id", ids);

  if (error) {
    return { error: mensajeLegible(error.message), cantidades: new Map<string, number>() };
  }

  const cantidades = new Map(
    (data ?? []).map((fila) => [fila.producto_id, Number(fila.cantidad)]),
  );
  return { error: null, cantidades };
}

export function resumenCambiosExistencia(
  lineas: LineaVenta[],
  antes: Map<string, number>,
  despues: Map<string, number>,
): CambioExistencia[] {
  const cambios: CambioExistencia[] = [];
  for (const linea of lineas) {
    if (!linea.productoId) continue;
    const anterior = antes.get(linea.productoId) ?? 0;
    const siguiente = despues.get(linea.productoId) ?? 0;
    if (anterior !== siguiente) {
      cambios.push({
        productoId: linea.productoId,
        nombre: linea.producto,
        anterior,
        siguiente,
      });
    }
  }
  return cambios;
}

export async function crearVentaAbierta(cajaId: string | null) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError, ventaId: null as string | null };
  if (sesionError) return { error: sesionError, ventaId: null };

  const folio = `V-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const { data, error } = await supabase
    .from("ventas")
    .insert({
      folio,
      estado: "abierta",
      total: 0,
      caja_id: cajaId,
    })
    .select("id")
    .single();

  if (error) {
    return { error: mensajeLegible(error.message), ventaId: null };
  }
  return { error: null, ventaId: data.id };
}

export async function agregarLinea(datos: {
  ventaId: string;
  productoId: string;
  cantidad: number;
  notas: string;
}) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError };
  if (sesionError) return { error: sesionError };

  const detalle = await leerVenta(datos.ventaId);
  if (detalle.error || !detalle.venta) return { error: detalle.error ?? "Venta no encontrada." };
  if (detalle.venta.estado !== "abierta") {
    return { error: "Solo puedes editar una venta abierta." };
  }
  if (!(datos.cantidad > 0)) {
    return { error: "La cantidad tiene que ser mayor a cero." };
  }

  const { data: producto, error: prodError } = await supabase
    .from("productos")
    .select("id, precio")
    .eq("id", datos.productoId)
    .maybeSingle();

  if (prodError || !producto) {
    return { error: prodError ? mensajeLegible(prodError.message) : "Producto no encontrado." };
  }

  const precio = Number(producto.precio ?? 0);
  const { error: lineaError } = await supabase.from("venta_lineas").insert({
    venta_id: datos.ventaId,
    producto_id: datos.productoId,
    cantidad: datos.cantidad,
    precio_unitario: precio,
    notas: datos.notas.trim() || null,
  });

  if (lineaError) {
    return { error: mensajeLegible(lineaError.message) };
  }

  const nuevoTotal =
    detalle.venta.lineasDetalle.reduce((suma, l) => suma + l.subtotal, 0) +
    datos.cantidad * precio;

  const { error: totalError } = await supabase
    .from("ventas")
    .update({ total: nuevoTotal })
    .eq("id", datos.ventaId);

  if (totalError) {
    return { error: mensajeLegible(totalError.message) };
  }

  return { error: null };
}

export async function cobrarVenta(datos: {
  ventaId: string;
  metodo: MetodoPago;
}) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError };
  if (sesionError) return { error: sesionError };

  const detalle = await leerVenta(datos.ventaId);
  if (detalle.error || !detalle.venta) {
    return { error: detalle.error ?? "Venta no encontrada." };
  }
  if (detalle.venta.estado !== "abierta") {
    return { error: "Solo puedes cobrar una venta abierta." };
  }
  if (detalle.venta.lineasDetalle.length === 0) {
    return { error: "Agrega al menos una línea antes de cobrar." };
  }

  for (const linea of detalle.venta.lineasDetalle) {
    if (!linea.productoId) continue;
    const { data: existencia, error } = await supabase
      .from("existencias")
      .select("id, cantidad")
      .eq("producto_id", linea.productoId)
      .maybeSingle();
    if (error) return { error: mensajeLegible(error.message) };
    const stock = Number(existencia?.cantidad ?? 0);
    if (stock < linea.cantidad) {
      return {
        error: `No alcanza la existencia de ${linea.producto}. Hay ${stock}, pides ${linea.cantidad}.`,
      };
    }
  }

  const total = detalle.venta.total;
  const { error: pagoError } = await supabase.from("pagos").insert({
    venta_id: datos.ventaId,
    metodo: datos.metodo,
    monto: total,
  });
  if (pagoError) return { error: mensajeLegible(pagoError.message) };

  const { error: estadoError } = await supabase
    .from("ventas")
    .update({ estado: "cobrada" })
    .eq("id", datos.ventaId);
  if (estadoError) return { error: mensajeLegible(estadoError.message) };

  for (const linea of detalle.venta.lineasDetalle) {
    if (!linea.productoId) continue;

    const { data: existencia, error: leerError } = await supabase
      .from("existencias")
      .select("id, cantidad")
      .eq("producto_id", linea.productoId)
      .maybeSingle();
    if (leerError) return { error: mensajeLegible(leerError.message) };

    const anterior = Number(existencia?.cantidad ?? 0);
    const siguiente = anterior - linea.cantidad;
    if (siguiente < 0) {
      return { error: `Existencia insuficiente para ${linea.producto}.` };
    }

    if (existencia) {
      const { error } = await supabase
        .from("existencias")
        .update({ cantidad: siguiente })
        .eq("id", existencia.id);
      if (error) return { error: mensajeLegible(error.message) };
    } else {
      return { error: `No hay fila de existencia para ${linea.producto}.` };
    }

    const { error: movError } = await supabase
      .from("movimientos_inventario")
      .insert({
        producto_id: linea.productoId,
        caja_id: detalle.venta.cajaId,
        venta_id: datos.ventaId,
        tipo: "salida_venta",
        cantidad: linea.cantidad,
        nota: `Cobro folio ${detalle.venta.folio ?? datos.ventaId}`,
      });
    if (movError) return { error: mensajeLegible(movError.message) };
  }

  return { error: null };
}

export async function cancelarVentaAbierta(ventaId: string) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError };
  if (sesionError) return { error: sesionError };

  const detalle = await leerVenta(ventaId);
  if (detalle.error || !detalle.venta) {
    return { error: detalle.error ?? "Venta no encontrada." };
  }
  if (detalle.venta.estado !== "abierta") {
    return { error: "Esta venta ya no está abierta." };
  }

  const { error } = await supabase
    .from("ventas")
    .update({ estado: "cancelada" })
    .eq("id", ventaId);

  if (error) return { error: mensajeLegible(error.message) };
  return { error: null };
}

export async function cancelarVentaCobrada(datos: {
  ventaId: string;
  motivo: string;
}) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError };
  if (sesionError) return { error: sesionError };

  const detalle = await leerVenta(datos.ventaId);
  if (detalle.error || !detalle.venta) {
    return { error: detalle.error ?? "Venta no encontrada." };
  }
  if (detalle.venta.estado !== "cobrada") {
    return { error: "Solo puedes cancelar una venta cobrada." };
  }

  const { data: yaCancelada } = await supabase
    .from("cancelaciones")
    .select("id")
    .eq("venta_id", datos.ventaId)
    .maybeSingle();
  if (yaCancelada) {
    return { error: "Esta venta ya fue cancelada." };
  }

  const motivo = datos.motivo.trim() || null;
  const { error: cancelError } = await supabase.from("cancelaciones").insert({
    venta_id: datos.ventaId,
    motivo,
  });
  if (cancelError) return { error: mensajeLegible(cancelError.message) };

  const { data: salidas, error: salidasError } = await supabase
    .from("movimientos_inventario")
    .select("producto_id, cantidad")
    .eq("venta_id", datos.ventaId)
    .eq("tipo", "salida_venta");
  if (salidasError) return { error: mensajeLegible(salidasError.message) };

  for (const salida of salidas ?? []) {
    const cantidad = Number(salida.cantidad);
    const { data: existencia, error: leerError } = await supabase
      .from("existencias")
      .select("id, cantidad")
      .eq("producto_id", salida.producto_id)
      .maybeSingle();
    if (leerError) return { error: mensajeLegible(leerError.message) };

    const siguiente = Number(existencia?.cantidad ?? 0) + cantidad;
    if (existencia) {
      const { error } = await supabase
        .from("existencias")
        .update({ cantidad: siguiente })
        .eq("id", existencia.id);
      if (error) return { error: mensajeLegible(error.message) };
    } else {
      const { error } = await supabase.from("existencias").insert({
        producto_id: salida.producto_id,
        cantidad: siguiente,
      });
      if (error) return { error: mensajeLegible(error.message) };
    }

    const { error: movError } = await supabase
      .from("movimientos_inventario")
      .insert({
        producto_id: salida.producto_id,
        caja_id: detalle.venta.cajaId,
        venta_id: datos.ventaId,
        tipo: "cancelacion",
        cantidad,
        nota: motivo ?? "Cancelación de venta",
      });
    if (movError) return { error: mensajeLegible(movError.message) };
  }

  const { error: estadoError } = await supabase
    .from("ventas")
    .update({ estado: "cancelada" })
    .eq("id", datos.ventaId);
  if (estadoError) return { error: mensajeLegible(estadoError.message) };

  return { error: null };
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
    return "No se pudo completar la venta. La base no respondió.";
  }
  return mensaje;
}