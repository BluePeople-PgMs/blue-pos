export type Modulo = {
  nombre: string;
  resumen: string;
  tablas: string[];
  ruta?: string;
  listo?: boolean;
};

export const modulos: Modulo[] = [
  {
    nombre: "Catálogos",
    resumen:
      "CRUD de categorías, unidades, productos y cajas; lista compartida para combos e inventario.",
    tablas: ["categorias", "unidades", "productos", "cajas"],
    ruta: "/catalogos",
    listo: true,
  },
  {
    nombre: "Ventas",
    resumen: "Al cobrar, la venta es la salida de inventario. También se puede cancelar.",
    tablas: ["ventas", "venta_lineas", "pagos", "cancelaciones"],
    ruta: "/ventas",
    listo: true,
  },
  {
    nombre: "Inventario",
    resumen: "Captura de entradas. Las salidas llegan desde las ventas.",
    tablas: ["existencias", "movimientos_inventario"],
    ruta: "/inventario",
    listo: true,
  },
  {
    nombre: "Combos",
    resumen:
      "Componentes del combo y descuento: 2 → 10%, 3–4 → 20%, 5+ → 30%.",
    tablas: ["combo_componentes"],
    ruta: "/combos",
    listo: true,
  },
  {
    nombre: "Recetas",
    resumen: "Qué insumos lleva un producto preparado.",
    tablas: ["recetas", "receta_insumos"],
    ruta: "/recetas",
    listo: true,
  },
];
