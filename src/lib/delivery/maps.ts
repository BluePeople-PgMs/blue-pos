import { PICKUP_TIENDA } from "@/lib/delivery/config";

export type DestinoEntrega = {
  direccion: string;
  lat?: number | null;
  lng?: number | null;
};

function destinoParam(destino: DestinoEntrega): string {
  if (destino.lat != null && destino.lng != null) {
    return `${destino.lat},${destino.lng}`;
  }
  return encodeURIComponent(destino.direccion);
}

/** Ruta en auto desde la tienda (origen fijo) hasta el cliente. */
export function urlGoogleMapsRuta(destino: DestinoEntrega): string {
  const origin = encodeURIComponent(PICKUP_TIENDA.direccion);
  const destination = destinoParam(destino);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

/** Navegación Waze hacia el cliente (destino). */
export function urlWazeNavegacion(destino: DestinoEntrega): string {
  if (destino.lat != null && destino.lng != null) {
    return `https://waze.com/ul?ll=${destino.lat},${destino.lng}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(destino.direccion)}&navigate=yes`;
}

/** Abrir tienda de recogida en Google Maps. */
export function urlGoogleMapsTienda(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PICKUP_TIENDA.direccion)}`;
}