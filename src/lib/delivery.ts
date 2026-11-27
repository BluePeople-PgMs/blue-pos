import {
  type EntregaEstado,
  type MetodoPagoDelivery,
  type PedidoDelivery,
  PRODUCTOS,
  type ProductoDelivery,
} from "@/lib/delivery-mock";
import { asegurarSesionDelivery } from "@/lib/delivery-auth";
import type { LineaCarrito } from "@/lib/delivery-mock";
import {
  avanzarPedido,
  confirmarPedidoLocal,
  leerCarrito,
  leerPedidos,
  pedidoPorFolio,
  registrarPedidoLocal,
} from "@/lib/delivery-storage";
import { agregarLinea, cobrarVenta, esMetodoPago } from "@/lib/ventas";
import { getSupabaseBrowser } from "@/lib/supabase";

function mensajeLegible(mensaje: string) {
  return mensaje;
}

function esColumnaDeliveryFaltante(mensaje: string) {
  const bajo = mensaje.toLowerCase();
  return (
    bajo.includes("modalidad") ||
    bajo.includes("entrega_estado") ||
    bajo.includes("cliente_nombre") ||
    bajo.includes("schema cache")
  );
}

export async function leerMenuDelivery(): Promise<{
  error: string | null;
  productos: ProductoDelivery[];
  origen: "supabase" | "local";
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: null, productos: PRODUCTOS, origen: "local" };
  }

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, codigo, precio, tipo, categoria_id")
    .eq("activo", true)
    .in("tipo", ["preparado", "directo", "combo"])
    .order("nombre")
    .limit(40);

  const { data: categorias } = await supabase.from("categorias").select("id, nombre");
  const mapCat = new Map((categorias ?? []).map((c) => [c.id, c.nombre]));

  if (error || !data?.length) {
    return { error: error?.message ?? null, productos: PRODUCTOS, origen: "local" };
  }

  const productos: ProductoDelivery[] = data.map((fila) => {
    const categoriaNombre = fila.categoria_id
      ? (mapCat.get(fila.categoria_id) ?? "Menú")
      : "Menú";
    const categoria = mapearCategoria(categoriaNombre);
    return {
      id: fila.id,
      codigo: fila.codigo ?? "",
      nombre: fila.nombre,
      categoria,
      precio: Number(fila.precio ?? 0),
      descripcion: `${fila.tipo} · ${categoriaNombre}`,
    };
  });

  return { error: null, productos, origen: "supabase" };
}

function mapearCategoria(nombre: string): ProductoDelivery["categoria"] {
  const bajo = nombre.toLowerCase();
  if (bajo.includes("pizza")) return "Pizza";
  if (bajo.includes("pasta") || bajo.includes("plato")) return "Pasta";
  if (bajo.includes("bebida") || bajo.includes("vino") || bajo.includes("acqua"))
    return "Bebidas";
  if (bajo.includes("postre") || bajo.includes("dolci")) return "Postres";
  return "Pasta";
}

export async function confirmarPedidoDelivery(datos: {
  clienteNombre: string;
  clienteTelefono: string;
  direccionEntrega: string;
  notasEntrega: string;
  metodoPago: MetodoPagoDelivery;
  lineas?: LineaCarrito[];
}): Promise<{ pedido: PedidoDelivery | null; error: string | null; origen: "supabase" | "local" }> {
  const lineas = datos.lineas ?? leerCarrito();
  const supabase = getSupabaseBrowser();

  if (!supabase) {
    const r = confirmarPedidoLocal({ ...datos });
    return { ...r, origen: "local" };
  }

  const sesion = await asegurarSesionDelivery();
  if (!sesion.ok) {
    const r = confirmarPedidoLocal({ ...datos });
    return { ...r, origen: "local" };
  }

  if (!esMetodoPago(datos.metodoPago)) {
    return { pedido: null, error: "Método de pago no válido.", origen: "supabase" };
  }

  const folio = `D-${Date.now().toString(36).toUpperCase()}`;
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      folio,
      estado: "abierta",
      total: 0,
      caja_id: null,
      modalidad: "delivery",
      entrega_estado: "recibido",
      cliente_nombre: datos.clienteNombre.trim(),
      cliente_telefono: datos.clienteTelefono.trim() || null,
      direccion_entrega: datos.direccionEntrega.trim(),
      notas_entrega: datos.notasEntrega.trim() || null,
    })
    .select("id, folio, created_at")
    .single();

  if (ventaError) {
    if (esColumnaDeliveryFaltante(ventaError.message)) {
      const r = confirmarPedidoLocal({ ...datos });
      return { ...r, origen: "local" };
    }
    return { pedido: null, error: mensajeLegible(ventaError.message), origen: "supabase" };
  }

  for (const fila of lineas) {
    const { error: lineaError } = await agregarLinea({
      ventaId: venta.id,
      productoId: fila.productoId,
      cantidad: fila.cantidad,
      notas: fila.notas,
    });
    if (lineaError) {
      return { pedido: null, error: lineaError, origen: "supabase" };
    }
  }

  const cobro = await cobrarVenta({ ventaId: venta.id, metodo: datos.metodoPago });
  if (cobro.error) {
    return { pedido: null, error: cobro.error, origen: "supabase" };
  }

  const pedido = await mapearVentaAPedido(venta.folio ?? folio);
  if (pedido) {
    registrarPedidoLocal({ ...pedido, id: venta.id });
  }

  return { pedido, error: pedido ? null : "No se pudo leer el pedido.", origen: "supabase" };
}

async function mapearVentaAPedido(
  folio: string,
): Promise<PedidoDelivery | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return pedidoPorFolio(folio) ?? null;

  const { data: venta, error } = await supabase
    .from("ventas")
    .select(
      "id, folio, total, created_at, entrega_estado, cliente_nombre, cliente_telefono, direccion_entrega, notas_entrega",
    )
    .eq("folio", folio)
    .eq("modalidad", "delivery")
    .maybeSingle();

  if (error || !venta) return pedidoPorFolio(folio) ?? null;

  const { data: lineas } = await supabase
    .from("venta_lineas")
    .select("producto_id, cantidad, precio_unitario, notas, productos(nombre)")
    .eq("venta_id", venta.id);

  const { data: pagoRow } = await supabase
    .from("pagos")
    .select("metodo")
    .eq("venta_id", venta.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const metodo = (pagoRow?.metodo ?? "efectivo") as MetodoPagoDelivery;

  return {
    id: venta.id,
    folio: venta.folio ?? folio,
    lineas: (lineas ?? []).map((l) => {
      const prod = l.productos as { nombre: string } | { nombre: string }[] | null;
      const nombre = Array.isArray(prod) ? prod[0]?.nombre : prod?.nombre;
      return {
        productoId: l.producto_id ?? "",
        nombre: nombre ?? "Producto",
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precio_unitario),
        notas: l.notas ?? "",
      };
    }),
    clienteNombre: venta.cliente_nombre ?? "",
    clienteTelefono: venta.cliente_telefono ?? "",
    direccionEntrega: venta.direccion_entrega ?? "",
    notasEntrega: venta.notas_entrega ?? "",
    metodoPago: metodo,
    total: Number(venta.total),
    entregaEstado: (venta.entrega_estado ?? "recibido") as EntregaEstado,
    creadoEn: venta.created_at,
  };
}

export async function leerPedidoDelivery(
  folio: string,
): Promise<PedidoDelivery | null> {
  const local = pedidoPorFolio(folio);
  const remoto = await mapearVentaAPedido(folio);
  if (remoto && remoto.id.length > 10) return remoto;
  return local ?? remoto;
}

export async function listarPedidosDeliveryActivos(): Promise<{
  error: string | null;
  pedidos: PedidoDelivery[];
  origen: "supabase" | "local";
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error: null,
      pedidos: leerPedidos().filter((p) => p.entregaEstado !== "entregado"),
      origen: "local",
    };
  }

  const { data, error } = await supabase
    .from("ventas")
    .select(
      "id, folio, total, created_at, entrega_estado, cliente_nombre, cliente_telefono, direccion_entrega, notas_entrega",
    )
    .eq("modalidad", "delivery")
    .neq("estado", "cancelada")
    .not("entrega_estado", "eq", "entregado")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    if (esColumnaDeliveryFaltante(error.message)) {
      return {
        error: null,
        pedidos: leerPedidos().filter((p) => p.entregaEstado !== "entregado"),
        origen: "local",
      };
    }
    return { error: error.message, pedidos: [], origen: "supabase" };
  }

  const pedidos: PedidoDelivery[] = [];
  for (const venta of data ?? []) {
    const p = await mapearVentaAPedido(venta.folio ?? "");
    if (p) pedidos.push(p);
  }

  if (pedidos.length === 0) {
    return {
      error: null,
      pedidos: leerPedidos().filter((p) => p.entregaEstado !== "entregado"),
      origen: "local",
    };
  }

  return { error: null, pedidos, origen: "supabase" };
}

export async function avanzarEntregaDelivery(
  folio: string,
  nuevoEstado: EntregaEstado,
): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowser();
  const local = pedidoPorFolio(folio);

  if (supabase) {
    const { error } = await supabase
      .from("ventas")
      .update({ entrega_estado: nuevoEstado })
      .eq("folio", folio)
      .eq("modalidad", "delivery");

    if (!error) {
      if (local) avanzarPedido(folio, nuevoEstado);
      return { error: null };
    }
    if (!esColumnaDeliveryFaltante(error.message)) {
      return { error: error.message };
    }
  }

  if (!local) return { error: "Pedido no encontrado." };
  avanzarPedido(folio, nuevoEstado);
  return { error: null };
}