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

/** Etiqueta de cierre en bandeja histórico (mesero/admin). */
export const ETIQUETA_HISTORICO_ENTREGADO = "Finalizado y Entregado";

export function etiquetaEstadoOps(
  status: EstadoDelivery,
  historico: boolean,
): string {
  if (historico && status === "ENTREGADO") {
    return ETIQUETA_HISTORICO_ENTREGADO;
  }
  return ETIQUETA_ESTADO[status];
}

export function textoCalificacion(valor: number | null | undefined): string {
  if (valor == null) return "No calificado";
  return `${valor}★`;
}

export const ORDEN_PROGRESO: EstadoDelivery[] = [
  "PENDIENTE",
  "EMPACANDO",
  "LISTO_PARA_PICKUP",
  "EN_CAMINO",
  "ENTREGADO",
];