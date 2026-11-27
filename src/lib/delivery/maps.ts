import { PICKUP_TIENDA } from "@/lib/delivery/config";

export function urlGoogleMapsRuta(destino: {
  direccion: string;
  lat?: number | null;
  lng?: number | null;
}): string {
  const origin = encodeURIComponent(PICKUP_TIENDA.direccion);
  const destination =
    destino.lat != null && destino.lng != null
      ? `${destino.lat},${destino.lng}`
      : encodeURIComponent(destino.direccion);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}