export type ItemMenu = {
  nombre: string;
  href: string;
  resumen: string;
  tablas: string[];
  /** Inventario, ventas, pagos y cancelaciones exigen sesión. */
  requiereSesion: boolean;
};

export const menuModulos: ItemMenu[] = [
  {
    nombre: "Catálogos",
    href: "/catalogos",
    resumen:
      "Comidas preparadas y productos empacados de la trattoria.",
    tablas: ["categorias", "unidades", "productos", "cajas"],
    requiereSesion: true,
  },
  {
    nombre: "Combos",
    href: "/combos",
    resumen:
      "Combos con entrada, bebida y plato fuerte desde los catálogos.",
    tablas: ["productos", "combo_componentes"],
    requiereSesion: false,
  },
  {
    nombre: "Recetas",
    href: "/recetas",
    resumen: "Qué insumos lleva un producto preparado.",
    tablas: ["recetas", "receta_insumos"],
    requiereSesion: true,
  },
  {
    nombre: "Inventario",
    href: "/inventario",
    resumen: "Captura de entradas. Las salidas llegan desde las ventas.",
    tablas: ["existencias", "movimientos_inventario"],
    requiereSesion: true,
  },
  {
    nombre: "Ventas",
    href: "/ventas",
    resumen: "Cobro de ventas y líneas de ticket.",
    tablas: ["ventas", "venta_lineas"],
    requiereSesion: true,
  },
  {
    nombre: "Pagos",
    href: "/pagos",
    resumen: "Pagos ligados a ventas cobradas.",
    tablas: ["pagos"],
    requiereSesion: true,
  },
  {
    nombre: "Cancelaciones",
    href: "/cancelaciones",
    resumen: "Cancelar ventas y devolver existencia.",
    tablas: ["cancelaciones"],
    requiereSesion: true,
  },
];