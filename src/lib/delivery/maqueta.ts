import type { ArticuloMenuVenta } from "@/lib/ventas/catalogoVentaVisual";
import { PICKUP_TIENDA } from "@/lib/delivery/config";
import type { EstadoDelivery } from "@/lib/delivery/estados";
import type {
  DeliveryOrderDriverDisplay,
  DeliveryOrderItemRow,
  DeliveryOrderRow,
  ItemCrearPedido,
} from "@/lib/delivery/servicio";

const REPARTIDOR_NOMBRE = "Carlos Repartidor";
const MAQUETA_DRIVER_ID = "maqueta-driver-001";
const ID_SEGUIMIENTO_DEMO = "00000000-0000-4000-8000-00000000cafe";

export const MAQUETA_EVENTO = "delivery-maqueta-change";

export function notificarCambioMaqueta() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MAQUETA_EVENTO));
  }
}

export function suscribirMaqueta(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(MAQUETA_EVENTO, handler);
  return () => window.removeEventListener(MAQUETA_EVENTO, handler);
}

export const CATALOGO_MAQUETA: ArticuloMenuVenta[] = [
  {
    id: "mq-palomitas-g",
    nombre: "Palomitas Grandes",
    codigo: "POP-G",
    precioUnitario: 85,
    esCombo: false,
    descuentoPct: 0,
    stockDisponible: 48,
  },
  {
    id: "mq-nachos",
    nombre: "Nachos con queso",
    codigo: "NCH-01",
    precioUnitario: 72,
    esCombo: false,
    descuentoPct: 0,
    stockDisponible: 30,
  },
  {
    id: "mq-refresco",
    nombre: "Refresco 1 L",
    codigo: "REF-L",
    precioUnitario: 45,
    esCombo: false,
    descuentoPct: 0,
    stockDisponible: 60,
  },
  {
    id: "mq-combo-fam",
    nombre: "Combo Familiar Cine",
    codigo: "CBF-01",
    precioUnitario: 189,
    esCombo: true,
    descuentoPct: 10,
    stockDisponible: 12,
  },
  {
    id: "mq-helado",
    nombre: "Helado vainilla",
    codigo: "HEL-V",
    precioUnitario: 55,
    esCombo: false,
    descuentoPct: 15,
    stockDisponible: 20,
  },
];

function ahoraIso(offsetMin = 0) {
  return new Date(Date.now() + offsetMin * 60_000).toISOString();
}

function nombreProducto(productoId: string) {
  return CATALOGO_MAQUETA.find((a) => a.id === productoId)?.nombre ?? "Producto";
}

function folioNuevo() {
  return `D-MQ-${Date.now().toString().slice(-8)}`;
}

type MaquetaState = {
  orders: DeliveryOrderRow[];
  items: DeliveryOrderItemRow[];
  tomados: Map<string, string>;
};

function pedidoBase(
  partial: Partial<DeliveryOrderRow> & Pick<DeliveryOrderRow, "id" | "status">,
): DeliveryOrderRow {
  return {
    customer_id: "maqueta-cliente",
    packer_id: partial.packer_id ?? null,
    driver_id: partial.driver_id ?? null,
    pickup_address: PICKUP_TIENDA.direccion,
    delivery_address: partial.delivery_address ?? "",
    delivery_lat: 21.881,
    delivery_lng: -102.294,
    estimated_delivery_time: partial.estimated_delivery_time ?? null,
    order_rating: partial.order_rating ?? null,
    driver_rating: partial.driver_rating ?? null,
    folio: partial.folio ?? null,
    delivery_notes: partial.delivery_notes ?? null,
    created_at: partial.created_at ?? ahoraIso(-30),
    delivered_at: partial.delivered_at ?? null,
    driver: partial.driver ?? null,
    packer: partial.packer ?? null,
    ...partial,
  };
}

function estadoInicial(): MaquetaState {
  const ord1 = pedidoBase({
    id: "mq-ord-pendiente",
    status: "PENDIENTE",
    folio: "D-MQ-PEND-01",
    delivery_address:
      "Av. Universidad 221, Centro Univ., Aguascalientes (UAA)",
    delivery_notes: "Portón verde, timbre 3",
    created_at: ahoraIso(-45),
  });
  const ord2 = pedidoBase({
    id: "mq-ord-empaque",
    status: "EMPACANDO",
    folio: "D-MQ-EMP-02",
    packer_id: "maqueta-mesero",
    delivery_address:
      "Calle San Miguel 118, Barrio de la Estación, Ags.",
    created_at: ahoraIso(-25),
  });
  const ord3 = pedidoBase({
    id: "mq-ord-listo",
    status: "LISTO_PARA_PICKUP",
    folio: "D-MQ-LISTO-03",
    delivery_address: "Blvd. Zacatecas 402, Villas del Sol, Ags.",
    delivery_notes: "Casa blanca esquina",
    created_at: ahoraIso(-15),
  });
  const ord4 = pedidoBase({
    id: ID_SEGUIMIENTO_DEMO,
    status: "EN_CAMINO",
    folio: "D-MQ-CAMINO-04",
    driver_id: MAQUETA_DRIVER_ID,
    delivery_address: "Av. Convención 1914, Fracc. Jardines, Ags.",
    estimated_delivery_time: ahoraIso(18),
    created_at: ahoraIso(-40),
    driver: { nombre: REPARTIDOR_NOMBRE },
  });
  const ord5 = pedidoBase({
    id: "mq-ord-entregado",
    status: "ENTREGADO",
    folio: "D-MQ-OK-05",
    driver_id: MAQUETA_DRIVER_ID,
    delivery_address: "Circuito San Ángel 12, San Marcos, Ags.",
    order_rating: 5,
    driver_rating: 4,
    delivered_at: ahoraIso(-120),
    created_at: ahoraIso(-180),
  });

  const items: DeliveryOrderItemRow[] = [
    {
      id: "mq-it-1a",
      delivery_order_id: ord1.id,
      producto_id: "mq-palomitas-g",
      cantidad: 2,
      precio_unitario: 85,
      es_combo: false,
      is_packed: false,
      notas: null,
      productos: { nombre: nombreProducto("mq-palomitas-g") },
    },
    {
      id: "mq-it-2a",
      delivery_order_id: ord2.id,
      producto_id: "mq-nachos",
      cantidad: 1,
      precio_unitario: 72,
      es_combo: false,
      is_packed: true,
      notas: null,
      productos: { nombre: nombreProducto("mq-nachos") },
    },
    {
      id: "mq-it-2b",
      delivery_order_id: ord2.id,
      producto_id: "mq-refresco",
      cantidad: 2,
      precio_unitario: 45,
      es_combo: false,
      is_packed: false,
      notas: "Sin hielo",
      productos: { nombre: nombreProducto("mq-refresco") },
    },
    {
      id: "mq-it-3a",
      delivery_order_id: ord3.id,
      producto_id: "mq-combo-fam",
      cantidad: 1,
      precio_unitario: 189,
      es_combo: true,
      is_packed: true,
      notas: null,
      productos: { nombre: nombreProducto("mq-combo-fam") },
    },
    {
      id: "mq-it-4a",
      delivery_order_id: ord4.id,
      producto_id: "mq-helado",
      cantidad: 3,
      precio_unitario: 55,
      es_combo: false,
      is_packed: true,
      notas: null,
      productos: { nombre: nombreProducto("mq-helado") },
    },
    {
      id: "mq-it-5a",
      delivery_order_id: ord5.id,
      producto_id: "mq-palomitas-g",
      cantidad: 1,
      precio_unitario: 85,
      es_combo: false,
      is_packed: true,
      notas: null,
      productos: { nombre: nombreProducto("mq-palomitas-g") },
    },
  ];

  return {
    orders: [ord1, ord2, ord3, ord4, ord5],
    items,
    tomados: new Map([[ord4.id, MAQUETA_DRIVER_ID]]),
  };
}

let store: MaquetaState = estadoInicial();

export function maquetaIdSeguimientoDemo() {
  return ID_SEGUIMIENTO_DEMO;
}

export function maquetaCargarCatalogo(): ArticuloMenuVenta[] {
  return [...CATALOGO_MAQUETA];
}

function itemsDePedido(orderId: string) {
  return store.items.filter((i) => i.delivery_order_id === orderId);
}

export function maquetaCrearPedido(
  direccion: string,
  items: ItemCrearPedido[],
  notas?: string | null,
  coords?: { lat: number; lng: number } | null,
): { data: { id: string; folio: string } | null; error: null } {
  const id = `mq-ord-${Date.now()}`;
  const folio = folioNuevo();
  const order = pedidoBase({
    id,
    status: "PENDIENTE",
    folio,
    delivery_address: direccion.trim(),
    delivery_notes: notas?.trim() || null,
    delivery_lat: coords?.lat ?? null,
    delivery_lng: coords?.lng ?? null,
    created_at: ahoraIso(0),
  });
  store.orders.unshift(order);
  let n = 0;
  for (const it of items) {
    n += 1;
    store.items.push({
      id: `mq-it-new-${id}-${n}`,
      delivery_order_id: id,
      producto_id: it.producto_id,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      es_combo: it.es_combo,
      is_packed: false,
      notas: null,
      productos: { nombre: nombreProducto(it.producto_id) },
    });
  }
  notificarCambioMaqueta();
  return { data: { id, folio }, error: null };
}

export function maquetaListarPedidosOps(
  statuses?: EstadoDelivery[],
  ascending = true,
): DeliveryOrderRow[] {
  let list = store.orders;
  if (statuses?.length) {
    list = list.filter((o) => statuses.includes(o.status));
  }
  list = [...list].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return ascending ? ta - tb : tb - ta;
  });
  return list.slice(0, 50);
}

export function maquetaListarPedidosRepartidor(): DeliveryOrderRow[] {
  return store.orders
    .filter(
      (o) =>
        o.status === "LISTO_PARA_PICKUP" ||
        (o.status === "EN_CAMINO" && o.driver_id === MAQUETA_DRIVER_ID),
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
}

export function maquetaHistoricoRepartidor(): Pick<
  DeliveryOrderRow,
  "id" | "folio" | "delivery_address" | "delivered_at" | "created_at"
>[] {
  return store.orders
    .filter(
      (o) => o.status === "ENTREGADO" && o.driver_id === MAQUETA_DRIVER_ID,
    )
    .map((o) => ({
      id: o.id,
      folio: o.folio,
      delivery_address: o.delivery_address,
      delivered_at: o.delivered_at,
      created_at: o.created_at,
    }))
    .sort(
      (a, b) =>
        new Date(b.delivered_at ?? b.created_at).getTime() -
        new Date(a.delivered_at ?? a.created_at).getTime(),
    )
    .slice(0, 30);
}

export function maquetaObtenerPedido(
  orderId: string,
): DeliveryOrderRow | null {
  return store.orders.find((o) => o.id === orderId) ?? null;
}

export function maquetaListarItems(orderId: string): DeliveryOrderItemRow[] {
  return itemsDePedido(orderId);
}

export function maquetaRepartidorEnCamino(
  orderId: string,
): DeliveryOrderDriverDisplay | null {
  const o = maquetaObtenerPedido(orderId);
  if (!o || o.status !== "EN_CAMINO") return null;
  return {
    order_id: o.id,
    folio: o.folio,
    status: o.status,
    customer_id: o.customer_id,
    driver_id: o.driver_id,
    driver_nombre: o.driver?.nombre ?? REPARTIDOR_NOMBRE,
  };
}

export function maquetaIniciarEmpaque(
  orderId: string,
): { error: { message: string } | null } {
  const o = maquetaObtenerPedido(orderId);
  if (!o || o.status !== "PENDIENTE") {
    return { error: { message: "El pedido no está pendiente." } };
  }
  o.status = "EMPACANDO";
  o.packer_id = "maqueta-mesero";
  notificarCambioMaqueta();
  return { error: null };
}

export function maquetaTogglePacked(
  itemId: string,
  isPacked: boolean,
): { error: { message: string } | null } {
  const it = store.items.find((i) => i.id === itemId);
  if (!it) return { error: { message: "Ítem no encontrado." } };
  it.is_packed = isPacked;
  notificarCambioMaqueta();
  return { error: null };
}

export function maquetaCerrarEmpaque(
  orderId: string,
): { error: { message: string } | null } {
  const o = maquetaObtenerPedido(orderId);
  if (!o || o.status !== "EMPACANDO") {
    return { error: { message: "El pedido no está en empaque." } };
  }
  const its = itemsDePedido(orderId);
  if (!its.length || !its.every((i) => i.is_packed)) {
    return { error: { message: "Marca todos los ítems antes de cerrar." } };
  }
  o.status = "LISTO_PARA_PICKUP";
  notificarCambioMaqueta();
  return { error: null };
}

export function maquetaIniciarEntrega(
  orderId: string,
): { error: { message: string } | null } {
  const o = maquetaObtenerPedido(orderId);
  if (!o || o.status !== "LISTO_PARA_PICKUP") {
    if (o?.status === "EN_CAMINO" && o.driver_id !== MAQUETA_DRIVER_ID) {
      return {
        error: {
          message:
            "Pedido no disponible para tomar: otro repartidor ya inició la entrega.",
        },
      };
    }
    return { error: { message: "Pedido no disponible para tomar." } };
  }
  const prev = store.tomados.get(orderId);
  if (prev && prev !== MAQUETA_DRIVER_ID) {
    return {
      error: {
        message:
          "Pedido no disponible para tomar: otro repartidor ya inició la entrega.",
      },
    };
  }
  o.status = "EN_CAMINO";
  o.driver_id = MAQUETA_DRIVER_ID;
  o.driver = { nombre: REPARTIDOR_NOMBRE };
  o.estimated_delivery_time = ahoraIso(25);
  store.tomados.set(orderId, MAQUETA_DRIVER_ID);
  notificarCambioMaqueta();
  return { error: null };
}

export function maquetaFinalizar(
  orderId: string,
): { error: { message: string } | null } {
  const o = maquetaObtenerPedido(orderId);
  if (!o || o.status !== "EN_CAMINO" || o.driver_id !== MAQUETA_DRIVER_ID) {
    return { error: { message: "No se puede finalizar este pedido." } };
  }
  o.status = "ENTREGADO";
  o.delivered_at = ahoraIso(0);
  notificarCambioMaqueta();
  return { error: null };
}

export function maquetaCalificar(
  orderId: string,
  orderRating?: number | null,
  driverRating?: number | null,
): { error: { message: string } | null } {
  const o = maquetaObtenerPedido(orderId);
  if (!o || o.status !== "ENTREGADO") {
    return { error: { message: "Solo pedidos entregados se califican." } };
  }
  if (o.order_rating != null || o.driver_rating != null) {
    return { error: { message: "Este pedido ya fue calificado." } };
  }
  o.order_rating = orderRating ?? null;
  o.driver_rating = driverRating ?? null;
  notificarCambioMaqueta();
  return { error: null };
}

/** Reinicia datos demo (útil en capacitación). */
export function maquetaReiniciarDemo() {
  store = estadoInicial();
  notificarCambioMaqueta();
}