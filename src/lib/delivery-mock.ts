/** Catálogo y tipos para delivery sin Supabase (desarrollo local). */

export type CategoriaDelivery = "Pizza" | "Pasta" | "Bebidas" | "Postres";

export type ProductoDelivery = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: CategoriaDelivery;
  precio: number;
  descripcion: string;
};

export type LineaCarrito = {
  productoId: string;
  cantidad: number;
  notas: string;
};

export type EntregaEstado =
  | "recibido"
  | "preparando"
  | "en_camino"
  | "entregado";

export const ENTREGA_ESTADOS: EntregaEstado[] = [
  "recibido",
  "preparando",
  "en_camino",
  "entregado",
];

export const ETIQUETA_ENTREGA: Record<EntregaEstado, string> = {
  recibido: "Recibido",
  preparando: "Preparando",
  en_camino: "En camino",
  entregado: "Entregado",
};

export type MetodoPagoDelivery = "efectivo" | "tarjeta" | "transferencia";

export type PedidoDelivery = {
  id: string;
  folio: string;
  lineas: {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    notas: string;
  }[];
  clienteNombre: string;
  clienteTelefono: string;
  direccionEntrega: string;
  notasEntrega: string;
  metodoPago: MetodoPagoDelivery;
  total: number;
  entregaEstado: EntregaEstado;
  creadoEn: string;
};

export const CATEGORIAS: CategoriaDelivery[] = [
  "Pizza",
  "Pasta",
  "Bebidas",
  "Postres",
];

export const PRODUCTOS: ProductoDelivery[] = [
  {
    id: "p1",
    codigo: "DEL-001",
    nombre: "Pizza Margherita",
    categoria: "Pizza",
    precio: 189,
    descripcion: "Salsa de tomate, mozzarella y albahaca fresca al horno de piedra.",
  },
  {
    id: "p2",
    codigo: "DEL-002",
    nombre: "Pizza Diavola",
    categoria: "Pizza",
    precio: 215,
    descripcion: "Salame picante, mozzarella y aceite de chile.",
  },
  {
    id: "p3",
    codigo: "DEL-003",
    nombre: "Spaghetti al pomodoro",
    categoria: "Pasta",
    precio: 145,
    descripcion: "Pasta n.5 con salsa de tomate San Marzano y parmesano.",
  },
  {
    id: "p4",
    codigo: "DEL-004",
    nombre: "Lasagna della casa",
    categoria: "Pasta",
    precio: 198,
    descripcion: "Capas de pasta, ragù y bechamel gratinada.",
  },
  {
    id: "p5",
    codigo: "DEL-005",
    nombre: "Acqua naturale 1 L",
    categoria: "Bebidas",
    precio: 28,
    descripcion: "Agua mineral natural, botella de un litro.",
  },
  {
    id: "p6",
    codigo: "DEL-006",
    nombre: "Limonata",
    categoria: "Bebidas",
    precio: 45,
    descripcion: "Limonada italiana con menta.",
  },
  {
    id: "p7",
    codigo: "DEL-007",
    nombre: "Tiramisù",
    categoria: "Postres",
    precio: 85,
    descripcion: "Mascarpone, espresso y cacao en capas.",
  },
  {
    id: "p8",
    codigo: "DEL-008",
    nombre: "Cannoli siciliano",
    categoria: "Postres",
    precio: 72,
    descripcion: "Masa crujiente rellena de ricotta y pistacho.",
  },
];

export function productoPorId(id: string) {
  return PRODUCTOS.find((p) => p.id === id);
}

export function siguienteEntregaEstado(
  actual: EntregaEstado,
): EntregaEstado | null {
  const indice = ENTREGA_ESTADOS.indexOf(actual);
  if (indice < 0 || indice >= ENTREGA_ESTADOS.length - 1) return null;
  return ENTREGA_ESTADOS[indice + 1] ?? null;
}

export function totalLineas(
  lineas: { cantidad: number; precioUnitario: number }[],
) {
  return lineas.reduce(
    (acc, l) => acc + l.cantidad * l.precioUnitario,
    0,
  );
}