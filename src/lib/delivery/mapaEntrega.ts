import { PICKUP_TIENDA } from "@/lib/delivery/config";

/** Área demo Aguascalientes (cliente marca punto; repartidor usa las mismas coordenadas). */
export const BOUNDS_ENTREGA_AGS = {
  minLat: 21.855,
  maxLat: 21.905,
  minLng: -102.325,
  maxLng: -102.265,
} as const;

export const CENTRO_MAPA_ENTREGA = {
  lat: 21.8812,
  lng: -102.2935,
} as const;

export type PuntoEntrega = {
  lat: number;
  lng: number;
};

export function clampPuntoEntrega(p: PuntoEntrega): PuntoEntrega {
  const { minLat, maxLat, minLng, maxLng } = BOUNDS_ENTREGA_AGS;
  return {
    lat: Math.min(maxLat, Math.max(minLat, p.lat)),
    lng: Math.min(maxLng, Math.max(minLng, p.lng)),
  };
}

/** Posición del pin en % dentro del contenedor del mapa (origen arriba-izquierda). */
export function latLngAPorcentaje(p: PuntoEntrega): { left: number; top: number } {
  const { minLat, maxLat, minLng, maxLng } = BOUNDS_ENTREGA_AGS;
  const left = ((p.lng - minLng) / (maxLng - minLng)) * 100;
  const top = ((maxLat - p.lat) / (maxLat - minLat)) * 100;
  return {
    left: Math.min(96, Math.max(4, left)),
    top: Math.min(92, Math.max(8, top)),
  };
}

export function porcentajeALatLng(
  leftPct: number,
  topPct: number,
): PuntoEntrega {
  const { minLat, maxLat, minLng, maxLng } = BOUNDS_ENTREGA_AGS;
  const lng = minLng + (leftPct / 100) * (maxLng - minLng);
  const lat = maxLat - (topPct / 100) * (maxLat - minLat);
  return clampPuntoEntrega({ lat, lng });
}

export function puntoDesdeClickEnMapa(
  rect: DOMRect,
  clientX: number,
  clientY: number,
): PuntoEntrega {
  const leftPct = ((clientX - rect.left) / rect.width) * 100;
  const topPct = ((clientY - rect.top) / rect.height) * 100;
  return porcentajeALatLng(leftPct, topPct);
}

export function formatoCoordenadas(p: PuntoEntrega) {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

export function porcentajeTiendaPickup() {
  return latLngAPorcentaje({
    lat: PICKUP_TIENDA.lat,
    lng: PICKUP_TIENDA.lng,
  });
}