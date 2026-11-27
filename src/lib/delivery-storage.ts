import {
  type EntregaEstado,
  type LineaCarrito,
  type MetodoPagoDelivery,
  type PedidoDelivery,
  PRODUCTOS,
  productoPorId,
  totalLineas,
} from "@/lib/delivery-mock";

const CLAVE_CARRITO = "bluepos_delivery_cart";
const CLAVE_PEDIDOS = "bluepos_delivery_pedidos";
const CLAVE_ULTIMO_FOLIO = "bluepos_delivery_ultimo_folio";
export const EVENTO_PEDIDOS = "bluepos_delivery_pedidos_change";

function avisarPedidos() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_PEDIDOS));
}

export function leerCarrito(): LineaCarrito[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = sessionStorage.getItem(CLAVE_CARRITO);
    if (!crudo) return [];
    const parsed = JSON.parse(crudo) as LineaCarrito[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function guardarCarrito(lineas: LineaCarrito[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas));
}

export function vaciarCarrito() {
  guardarCarrito([]);
}

export function agregarAlCarrito(
  productoId: string,
  cantidad: number,
  notas = "",
) {
  const actual = leerCarrito();
  const existente = actual.find((l) => l.productoId === productoId);
  if (existente) {
    existente.cantidad += cantidad;
    if (notas) existente.notas = notas;
  } else {
    actual.push({ productoId, cantidad, notas });
  }
  guardarCarrito(actual);
}

export function pedidoPorFolio(folio: string) {
  return leerPedidos().find((p) => p.folio === folio);
}

export function registrarPedidoLocal(pedido: PedidoDelivery) {
  const pedidos = leerPedidos().filter((p) => p.folio !== pedido.folio);
  pedidos.unshift(pedido);
  guardarPedidos(pedidos);
  if (typeof window !== "undefined") {
    sessionStorage.setItem(CLAVE_ULTIMO_FOLIO, pedido.folio);
  }
  vaciarCarrito();
}

export function leerUltimoFolio(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CLAVE_ULTIMO_FOLIO);
}

export function leerPedidos(): PedidoDelivery[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = localStorage.getItem(CLAVE_PEDIDOS);
    if (!crudo) return [];
    const parsed = JSON.parse(crudo) as PedidoDelivery[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function guardarPedidos(pedidos: PedidoDelivery[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
  avisarPedidos();
}

export function confirmarPedidoLocal(datos: {
  clienteNombre: string;
  clienteTelefono: string;
  direccionEntrega: string;
  notasEntrega: string;
  metodoPago: MetodoPagoDelivery;
}): { pedido: PedidoDelivery | null; error: string | null } {
  const carrito = leerCarrito();
  if (carrito.length === 0) {
    return { pedido: null, error: "El carrito está vacío." };
  }
  if (!datos.clienteNombre.trim() || !datos.direccionEntrega.trim()) {
    return { pedido: null, error: "Nombre y dirección son obligatorios." };
  }

  const lineas = carrito.flatMap((fila) => {
    const producto = productoPorId(fila.productoId);
    if (!producto) return [];
    return [
      {
        productoId: fila.productoId,
        nombre: producto.nombre,
        cantidad: fila.cantidad,
        precioUnitario: producto.precio,
        notas: fila.notas,
      },
    ];
  });

  if (lineas.length === 0) {
    return { pedido: null, error: "No hay productos válidos en el carrito." };
  }

  const folio = `D-${Date.now().toString(36).toUpperCase()}`;
  const pedido: PedidoDelivery = {
    id: crypto.randomUUID(),
    folio,
    lineas,
    clienteNombre: datos.clienteNombre.trim(),
    clienteTelefono: datos.clienteTelefono.trim(),
    direccionEntrega: datos.direccionEntrega.trim(),
    notasEntrega: datos.notasEntrega.trim(),
    metodoPago: datos.metodoPago,
    total: totalLineas(lineas),
    entregaEstado: "recibido",
    creadoEn: new Date().toISOString(),
  };

  const pedidos = leerPedidos();
  pedidos.unshift(pedido);
  guardarPedidos(pedidos);
  vaciarCarrito();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(CLAVE_ULTIMO_FOLIO, pedido.folio);
  }
  return { pedido, error: null };
}

export function avanzarPedido(folio: string, nuevo: EntregaEstado) {
  const pedidos = leerPedidos();
  const indice = pedidos.findIndex((p) => p.folio === folio);
  if (indice === -1) return;
  pedidos[indice] = { ...pedidos[indice], entregaEstado: nuevo };
  guardarPedidos(pedidos);
}

export function pedidosActivos() {
  return leerPedidos().filter((p) => p.entregaEstado !== "entregado");
}

export function resumenCarrito() {
  const carrito = leerCarrito();
  let items = 0;
  let total = 0;
  for (const fila of carrito) {
    const p = productoPorId(fila.productoId) ?? PRODUCTOS[0];
    items += fila.cantidad;
    total += p.precio * fila.cantidad;
  }
  return { items, total, lineas: carrito.length };
}