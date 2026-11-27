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
  created_at: string;
  delivered_at: string | null;
};

export type DeliveryOrderItemRow = {
  id: string;
  delivery_order_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  es_combo: boolean;
  is_packed: boolean;
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
) {
  return client.rpc("delivery_crear_pedido", {
    p_direccion: direccion,
    p_items: items,
  });
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
  return client.from("delivery_orders").select("*").eq("id", orderId).maybeSingle();
}

export async function listarItemsPedido(client: SupabaseClient, orderId: string) {
  return client
    .from("delivery_order_items")
    .select("*, productos(nombre)")
    .eq("delivery_order_id", orderId);
}

export async function listarPedidosOps(
  client: SupabaseClient,
  statuses?: EstadoDelivery[],
) {
  let q = client.from("delivery_orders").select("*").order("created_at", {
    ascending: false,
  });
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