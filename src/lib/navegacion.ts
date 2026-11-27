import type { RolSistema } from "@/lib/roles";

export type ItemMenu = {
  nombre: string;
  href: string;
  resumen: string;
  tablas: string[];
  /** Inventario, ventas, pagos y cancelaciones exigen sesión. */
  requiereSesion: boolean;
  /** Sin lista = visible para todos los roles con sesión. */
  roles?: RolSistema[];
};

export const menuModulos: ItemMenu[] = [
  {
    nombre: "Catálogos",
    href: "/catalogos",
    resumen:
      "Comidas preparadas y productos empacados de la trattoria.",
    tablas: ["categorias", "unidades", "productos", "cajas"],
    requiereSesion: true,
    roles: ["cajero", "administrador"],
  },
  {
    nombre: "Combos",
    href: "/combos",
    resumen:
      "Combos con entrada, bebida y plato fuerte desde los catálogos.",
    tablas: ["productos", "combo_componentes"],
    requiereSesion: false,
    roles: ["administrador"],
  },
  {
    nombre: "Recetas",
    href: "/recetas",
    resumen: "Qué insumos lleva un producto preparado.",
    tablas: ["recetas", "receta_insumos"],
    requiereSesion: true,
    roles: ["administrador"],
  },
  {
    nombre: "Inventario",
    href: "/inventario",
    resumen: "Captura de entradas. Las salidas llegan desde las ventas.",
    tablas: ["existencias", "movimientos_inventario"],
    requiereSesion: true,
    roles: ["administrador"],
  },
  {
    nombre: "Ventas",
    href: "/ventas",
    resumen: "Abrir ventas, agregar productos y cobrar.",
    tablas: ["ventas", "venta_lineas"],
    requiereSesion: true,
    roles: ["cajero", "administrador"],
  },
  {
    nombre: "Delivery (cocina)",
    href: "/delivery/cocina",
    resumen:
      "Cola de pedidos a domicilio (modo local sin Supabase hasta conectar BD).",
    tablas: ["ventas"],
    requiereSesion: true,
    roles: ["cajero", "administrador"],
  },
  {
    nombre: "Pagos",
    href: "/pagos",
    resumen: "Cobra ventas abiertas y consulta historial de pagos.",
    tablas: ["pagos"],
    requiereSesion: true,
    roles: ["administrador"],
  },
  {
    nombre: "Cancelaciones",
    href: "/cancelaciones",
    resumen: "Cancelar ventas y devolver existencia.",
    tablas: ["cancelaciones"],
    requiereSesion: true,
    roles: ["administrador"],
  },
  {
    nombre: "Reportes",
    href: "/reportes",
    resumen: "Ventas, inventario, cancelaciones, combos y recetas por fechas.",
    tablas: [
      "ventas",
      "movimientos_inventario",
      "cancelaciones",
      "venta_lineas",
    ],
    requiereSesion: true,
  },
];