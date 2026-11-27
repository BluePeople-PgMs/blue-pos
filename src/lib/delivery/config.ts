/**
 * Maqueta sin BD: datos en memoria (capacitación).
 * Pon `NEXT_PUBLIC_DELIVERY_MAQUETA=0` para usar Supabase de verdad.
 */
export function deliverySoloMaqueta(): boolean {
  return process.env.NEXT_PUBLIC_DELIVERY_MAQUETA !== "0";
}

/** Punto de recogida (tienda) — mismo origen que usará el RPC y los enlaces de mapas. */
export const PICKUP_TIENDA = {
  nombre: "Walmart",
  direccion: "Walmart Av. de los Maestros, Aguascalientes, Ags.",
  lat: 21.8853,
  lng: -102.2916,
} as const;