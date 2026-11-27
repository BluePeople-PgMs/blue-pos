export const ESTADOS_DELIVERY = [
  "PENDIENTE",
  "EMPACANDO",
  "LISTO_PARA_PICKUP",
  "EN_CAMINO",
  "ENTREGADO",
] as const;

export type EstadoDelivery = (typeof ESTADOS_DELIVERY)[number];

export const ETIQUETA_ESTADO: Record<EstadoDelivery, string> = {
  PENDIENTE: "Pendiente",
  EMPACANDO: "Empacando",
  LISTO_PARA_PICKUP: "Listo para pickup",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
};

export const ORDEN_PROGRESO: EstadoDelivery[] = [
  "PENDIENTE",
  "EMPACANDO",
  "LISTO_PARA_PICKUP",
  "EN_CAMINO",
  "ENTREGADO",
];