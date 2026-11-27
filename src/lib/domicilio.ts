import { getSupabaseBrowser } from "@/lib/supabase";

const SIN_SESION =
  "Inicia sesión para leer y guardar pedidos a domicilio.";

export type EstadoPedido =
  | "recibido"
  | "en_preparacion"
  | "listo"
  | "en_camino"
  | "entregado";

export const ORDEN_ESTADOS: EstadoPedido[] = [
  "recibido",
  "en_preparacion",
  "listo",
  "en_camino",
  "entregado",
];

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  recibido: "Recibido",
  en_preparacion: "En preparación",
  listo: "Listo para recoger",
  en_camino: "En camino",
  entregado: "Entregado",
};

export type PasoSiguiente = {
  estado: EstadoPedido;
  boton: string;
  quien: string;
  pideRepartidor: boolean;
};

const PASO_SIGUIENTE: Record<EstadoPedido, PasoSiguiente | null> = {
  recibido: {
    estado: "en_preparacion",
    boton: "Empezar a preparar",
    quien: "Cocina",
    pideRepartidor: false,
  },
  en_preparacion: {
    estado: "listo",
    boton: "Listo para recoger",
    quien: "Cocina",
    pideRepartidor: false,
  },
  listo: {
    estado: "en_camino",
    boton: "Entregar al repartidor",
    quien: "Caja",
    pideRepartidor: true,
  },
  en_camino: {
    estado: "entregado",
    boton: "Llegó al domicilio",
    quien: "Reparto",
    pideRepartidor: false,
  },
  entregado: null,
};

export function pasoSiguiente(estado: EstadoPedido) {
  return PASO_SIGUIENTE[estado];
}

export function numeroPaso(estado: EstadoPedido) {
  return ORDEN_ESTADOS.indexOf(estado) + 1;
}

export type LineaPedido = {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type PedidoDomicilio = {
  id: string;
  folio: string | null;
  cliente: string;
  domicilio: string;
  estado: EstadoPedido;
  total: number;
  repartidor: string | null;
  creadoEn: string;
  lineas: LineaPedido[];
};

export type LineaNueva = {
  productoId: string;
  cantidad: number;
};

export function dinero(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

export function textoCantidad(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 3,
  }).format(valor);
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

function esEstado(valor: string): valor is EstadoPedido {
  return (ORDEN_ESTADOS as string[]).includes(valor);
}

export async function listarPedidos() {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) {
    return { error: sesionError, pedidos: [] as PedidoDomicilio[] };
  }
  if (sesionError) {
    return { error: sesionError, pedidos: [] as PedidoDomicilio[] };
  }

  const { data, error } = await supabase
    .from("pedidos_domicilio")
    .select(
      "id, folio, cliente_nombre, domicilio, estado, total, repartidor_nombre, created_at, pedido_lineas(id, nombre, cantidad, precio_unitario)",
    )
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return { error: mensajeLegible(error.message), pedidos: [] as PedidoDomicilio[] };
  }

  const pedidos: PedidoDomicilio[] = [];
  for (const fila of data ?? []) {
    if (!esEstado(fila.estado)) continue;
    const lineas = (fila.pedido_lineas ?? [])
      .map((linea) => ({
        id: linea.id,
        nombre: linea.nombre,
        cantidad: Number(linea.cantidad),
        precioUnitario: Number(linea.precio_unitario),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    pedidos.push({
      id: fila.id,
      folio: fila.folio,
      cliente: fila.cliente_nombre,
      domicilio: fila.domicilio,
      estado: fila.estado,
      total: Number(fila.total),
      repartidor: fila.repartidor_nombre,
      creadoEn: fila.created_at,
      lineas,
    });
  }

  return { error: null, pedidos };
}

export async function crearPedidoDomicilio(datos: {
  cliente: string;
  domicilio: string;
  lineas: LineaNueva[];
}) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError, id: null as string | null };
  if (sesionError) return { error: sesionError, id: null };

  const cliente = datos.cliente.trim();
  const domicilio = datos.domicilio.trim();
  if (!cliente) return { error: "Escribe el nombre del cliente.", id: null };
  if (!domicilio) return { error: "Escribe el domicilio.", id: null };
  if (datos.lineas.length === 0) {
    return { error: "Agrega al menos un producto.", id: null };
  }
  if (datos.lineas.some((linea) => !(linea.cantidad > 0))) {
    return { error: "La cantidad tiene que ser mayor a cero.", id: null };
  }

  const ids = [...new Set(datos.lineas.map((linea) => linea.productoId))];
  const { data: productos, error: prodError } = await supabase
    .from("productos")
    .select("id, nombre, precio, activo")
    .in("id", ids);

  if (prodError) return { error: mensajeLegible(prodError.message), id: null };

  const porId = new Map((productos ?? []).map((producto) => [producto.id, producto]));
  if (ids.some((id) => !porId.get(id)?.activo)) {
    return { error: "Un producto del pedido ya no está en el catálogo.", id: null };
  }

  const filas = datos.lineas.map((linea) => {
    const producto = porId.get(linea.productoId);
    return {
      productoId: linea.productoId,
      nombre: producto?.nombre ?? "Producto",
      cantidad: linea.cantidad,
      precio: Number(producto?.precio ?? 0),
    };
  });
  const total = filas.reduce(
    (suma, fila) => suma + fila.cantidad * fila.precio,
    0,
  );
  const folio = `D-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  const { data: pedido, error } = await supabase
    .from("pedidos_domicilio")
    .insert({
      folio,
      cliente_nombre: cliente,
      domicilio,
      estado: "recibido",
      total,
    })
    .select("id")
    .single();

  if (error || !pedido) {
    return {
      error: error ? mensajeLegible(error.message) : "No se pudo guardar el pedido.",
      id: null,
    };
  }

  const { error: lineasError } = await supabase.from("pedido_lineas").insert(
    filas.map((fila) => ({
      pedido_id: pedido.id,
      producto_id: fila.productoId,
      nombre: fila.nombre,
      cantidad: fila.cantidad,
      precio_unitario: fila.precio,
    })),
  );

  if (lineasError) {
    await supabase.from("pedidos_domicilio").delete().eq("id", pedido.id);
    return { error: mensajeLegible(lineasError.message), id: null };
  }

  return { error: null, id: pedido.id };
}

export async function avanzarPedido(datos: {
  id: string;
  repartidor?: string;
}) {
  const { supabase, error: sesionError } = await exigirSesion();
  if (!supabase) return { error: sesionError };
  if (sesionError) return { error: sesionError };

  const { data, error } = await supabase
    .from("pedidos_domicilio")
    .select("estado")
    .eq("id", datos.id)
    .maybeSingle();

  if (error) return { error: mensajeLegible(error.message) };
  if (!data || !esEstado(data.estado)) {
    return { error: "Pedido no encontrado." };
  }

  const paso = pasoSiguiente(data.estado);
  if (!paso) return { error: "Este pedido ya está entregado." };

  const cambios: { estado: EstadoPedido; repartidor_nombre?: string } = {
    estado: paso.estado,
  };
  if (paso.pideRepartidor) {
    const nombre = (datos.repartidor ?? "").trim();
    if (!nombre) return { error: "Escribe quién recoge el pedido." };
    cambios.repartidor_nombre = nombre;
  }

  const { data: actualizado, error: updateError } = await supabase
    .from("pedidos_domicilio")
    .update(cambios)
    .eq("id", datos.id)
    .eq("estado", data.estado)
    .select("id");

  if (updateError) return { error: mensajeLegible(updateError.message) };
  if (!actualizado?.length) {
    return { error: "El pedido cambió. Vuelve a cargar la lista." };
  }
  return { error: null };
}

function mensajeLegible(mensaje: string) {
  const texto = mensaje.toLowerCase();
  if (
    texto.includes("permission") ||
    texto.includes("jwt") ||
    texto.includes("row-level")
  ) {
    return SIN_SESION;
  }
  if (
    texto.includes("pedidos_domicilio") ||
    texto.includes("pedido_lineas") ||
    texto.includes("schema cache")
  ) {
    return "La base todavía no tiene las tablas de domicilio. Hay que aplicar la migración nueva.";
  }
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudo completar el pedido. La base no respondió.";
  }
  return mensaje;
}
