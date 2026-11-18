export type Modulo = {
  nombre: string;
  resumen: string;
  tablas: string[];
  estado?: "listo";
  enlaces?: { href: string; etiqueta: string }[];
};

export const modulos: Modulo[] = [
  {
    nombre: "Login",
    resumen: "Inicio de sesión con supabase.auth.signInWithPassword y registro.",
    tablas: ["perfiles"],
    estado: "listo",
  },
  {
    nombre: "Catálogos",
    resumen:
      "Trattoria italiana: comidas preparadas en cocina y productos empacados de mostrador.",
    tablas: ["categorias", "unidades", "productos", "cajas"],
    estado: "listo",
    enlaces: [
      { href: "/catalogos/comidas", etiqueta: "Comidas preparadas" },
      { href: "/catalogos/productos", etiqueta: "Productos terminados" },
    ],
  },
  {
    nombre: "Ventas",
    resumen: "Al cobrar, la venta es la salida de inventario. También se puede cancelar.",
    tablas: ["ventas", "venta_lineas", "pagos", "cancelaciones"],
  },
  {
    nombre: "Inventario",
    resumen: "Captura de entradas. Las salidas llegan desde las ventas.",
    tablas: ["existencias", "movimientos_inventario"],
  },
  {
    nombre: "Combos",
    resumen: "Qué productos incluye un combo.",
    tablas: ["combo_componentes"],
  },
  {
    nombre: "Recetas",
    resumen: "Qué insumos lleva un producto preparado.",
    tablas: ["recetas", "receta_insumos"],
  },
];