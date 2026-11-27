/** Datos de demostración hasta existir `delivery_orders` + RPC. */
export type EstadoPedidoRepartidor = "LISTO_PARA_PICKUP" | "EN_CAMINO";

export type PedidoRepartidorDemo = {
  id: string;
  folio: string;
  clienteNombre: string;
  direccion: string;
  lat: number;
  lng: number;
  ventana: string;
  estado: EstadoPedidoRepartidor;
  itemsResumen: string;
  total: number;
};

export function pedidosDemoRepartidor(): PedidoRepartidorDemo[] {
  return [
    {
      id: "demo-1",
      folio: "D-20261127001",
      clienteNombre: "Alicia M.",
      direccion: "Av. Universidad 1234, Col. Bosques, Aguascalientes",
      lat: 21.892,
      lng: -102.278,
      ventana: "12:30 – 13:15",
      estado: "LISTO_PARA_PICKUP",
      itemsResumen: "Combo Almuerzo Express, Agua 1L",
      total: 191.6,
    },
    {
      id: "demo-2",
      folio: "D-20261127002",
      clienteNombre: "Bar Moya",
      direccion: "Calle Madero 210, Centro, Aguascalientes",
      lat: 21.881,
      lng: -102.293,
      ventana: "12:45 – 13:30",
      estado: "LISTO_PARA_PICKUP",
      itemsResumen: "Palomitas, 2× Espresso",
      total: 196.4,
    },
    {
      id: "demo-3",
      folio: "D-20261127003",
      clienteNombre: "Carlos T.",
      direccion: "Priv. La Luna 45, Villasunción, Aguascalientes",
      lat: 21.87,
      lng: -102.31,
      ventana: "En curso",
      estado: "EN_CAMINO",
      itemsResumen: "Pizza Margherita, Tiramisú",
      total: 204.0,
    },
  ];
}