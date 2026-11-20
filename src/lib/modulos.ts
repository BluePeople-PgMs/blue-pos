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
    enlaces: [{ href: "/login", etiqueta: "Iniciar sesión" }],
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
    estado: "listo",
    enlaces: [{ href: "/ventas", etiqueta: "Cobro de ticket" }],
  },
  {
    nombre: "Inventario",
    resumen: "Captura de entradas. Las salidas llegan desde las ventas.",
    tablas: ["existencias", "movimientos_inventario"],
    estado: "listo",
    enlaces: [{ href: "/inventario", etiqueta: "Entradas" }],
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
  {
    nombre: "Pagos",
    resumen: "Consulta de cobros ligados al folio de venta.",
    tablas: ["pagos"],
    estado: "listo",
    enlaces: [{ href: "/pagos", etiqueta: "Historial de pagos" }],
  },
  {
    nombre: "Cancelaciones",
    resumen: "Consulta de ventas cobradas canceladas y motivos.",
    tablas: ["cancelaciones"],
    estado: "listo",
    enlaces: [{ href: "/cancelaciones", etiqueta: "Historial" }],
  },
];