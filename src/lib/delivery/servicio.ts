import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstadoDelivery } from "@/lib/delivery/estados";

export type DeliveryOrderRow = {
  id: string;
  customer_id: string;
  packer_id: string | null;
  driver_id: string | null;
  status: EstadoDelivery;
  pickup_address: string;
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  estimated_delivery_time: string | null;
  order_rating: number | null;
  driver_rating: number | null;
  folio: string | null;
  delivery_notes: string | null;
  created_at: string;
  delivered_at: string | null;
  driver?: { nombre: string | null } | null;
  packer?: { nombre: string | null } | null;
};

export type DeliveryOrderDriverDisplay = {
  order_id: string;
  folio: string | null;
  status: EstadoDelivery;
  customer_id: string;
  driver_id: string | null;
  driver_nombre: string | null;
};

export type DeliveryOrderItemRow = {
  id: string;
  delivery_order_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  es_combo: boolean;
  is_packed: boolean;
  notas: string | null;
  productos?: { nombre: string } | null;
};

export type ItemCrearPedido = {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  es_combo: boolean;
};

export async function deliveryCrearPedido(
  client: SupabaseClient,
  direccion: string,
  items: ItemCrearPedido[],
  notas?: string | null,
  coords?: { lat: number; lng: number } | null,
) {
  const params: {
    p_direccion: string;
    p_items: ItemCrearPedido[];
    p_notas?: string;
    p_lat?: number;
    p_lng?: number;
  } = {
    p_direccion: direccion,
    p_items: items,
  };
  const notasLimpias = notas?.trim();
  if (notasLimpias) {
    params.p_notas = notasLimpias;
  }
  if (coords?.lat != null && coords?.lng != null) {
    params.p_lat = coords.lat;
    params.p_lng = coords.lng;
  }
  return client.rpc("delivery_crear_pedido", params);
}

export async function deliveryIniciarEmpaque(
  client: SupabaseClient,
  orderId: string,
) {
  return client.rpc("delivery_iniciar_empaque", { p_order_id: orderId });
}

export async function deliveryToggleItemPacked(
  client: SupabaseClient,
  itemId: string,
  isPacked: boolean,
) {
  return client.rpc("delivery_toggle_item_packed", {
    p_item_id: itemId,
    p_is_packed: isPacked,
  });
}

export async function deliveryCerrarEmpaque(
  client: SupabaseClient,
  orderId: string,
) {
  return client.rpc("delivery_cerrar_empaque", { p_order_id: orderId });
}

export async function deliveryIniciarEntrega(
  client: SupabaseClient,
  orderId: string,
) {
  return client.rpc("delivery_iniciar_entrega", { p_order_id: orderId });
}

export async function deliveryFinalizar(
  client: SupabaseClient,
  orderId: string,
) {
  return client.rpc("delivery_finalizar", { p_order_id: orderId });
}

export async function deliveryCalificar(
  client: SupabaseClient,
  orderId: string,
  orderRating?: number | null,
  driverRating?: number | null,
) {
  return client.rpc("delivery_calificar", {
    p_order_id: orderId,
    p_order_rating: orderRating ?? null,
    p_driver_rating: driverRating ?? null,
  });
}

export async function listarPedidosCliente(client: SupabaseClient) {
  return client
    .from("delivery_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
}

export async function obtenerPedido(
  client: SupabaseClient,
  orderId: string,
) {
  return client
    .from("delivery_orders")
    .select(
      "*, driver:perfiles!delivery_orders_driver_id_fkey(nombre), packer:perfiles!delivery_orders_packer_id_fkey(nombre)",
    )
    .eq("id", orderId)
    .maybeSingle();
}

export async function listarItemsPedido(client: SupabaseClient, orderId: string) {
  return client
    .from("delivery_order_items")
    .select("*, productos(nombre)")
    .eq("delivery_order_id", orderId);
}

export type ListarPedidosOpsOpts = {
  /** Activos: más antiguos primero (FIFO). Histórico: false = más recientes primero. */
  ascending?: boolean;
};

export async function listarPedidosOps(
  client: SupabaseClient,
  statuses?: EstadoDelivery[],
  opts?: ListarPedidosOpsOpts,
) {
  const ascending = opts?.ascending ?? false;
  let q = client
    .from("delivery_orders")
    .select("*")
    .order("created_at", { ascending });
  if (statuses?.length) {
    q = q.in("status", statuses);
  }
  return q.limit(50);
}

export async function listarPedidosRepartidor(client: SupabaseClient) {
  return client
    .from("delivery_orders")
    .select("*")
    .in("status", ["LISTO_PARA_PICKUP", "EN_CAMINO"])
    .order("created_at", { ascending: true });
}

/** Repartidor asignado y nombre (solo filas EN_CAMINO en la vista). */
export async function obtenerRepartidorEnCamino(
  client: SupabaseClient,
  orderId: string,
) {
  return client
    .from("delivery_order_driver_display")
    .select("order_id, folio, status, driver_id, driver_nombre")
    .eq("order_id", orderId)
    .maybeSingle();
}

/** Entregas propias (RLS: solo ENTREGADO con driver_id = yo). */
export async function listarHistoricoEntregasRepartidor(client: SupabaseClient) {
  return client
    .from("delivery_orders")
    .select("id, folio, delivery_address, delivered_at, created_at")
    .eq("status", "ENTREGADO")
    .order("delivered_at", { ascending: false })
    .limit(30);
}