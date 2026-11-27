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
    enlaces: [{ href: "/ventas", etiqueta: "Cobrar venta" }],
  },
  {
    nombre: "Delivery",
    resumen:
      "Pedidos a domicilio: cliente en /delivery y cola de cocina con estados hasta entrega.",
    tablas: ["ventas", "venta_lineas", "pagos"],
    estado: "listo",
    enlaces: [
      { href: "/delivery", etiqueta: "Pedir a domicilio" },
      { href: "/delivery/cocina", etiqueta: "Cocina delivery" },
    ],
  },
  {
    nombre: "Inventario",
    resumen:
      "Existencias de insumos de cocina y productos empacados. Las salidas de venta aplican a los terminados.",
    tablas: ["existencias", "movimientos_inventario"],
    estado: "listo",
    enlaces: [{ href: "/inventario", etiqueta: "Existencias" }],
  },
  {
    nombre: "Combos",
    resumen:
      "Combos con entrada, bebida y plato fuerte desde comidas y productos terminados.",
    tablas: ["productos", "combo_componentes"],
    estado: "listo",
    enlaces: [{ href: "/combos", etiqueta: "Menú de combos" }],
  },
  {
    nombre: "Recetas",
    resumen: "Insumos por porción de cada comida preparada del menú.",
    tablas: ["recetas", "receta_insumos"],
    estado: "listo",
    enlaces: [{ href: "/recetas", etiqueta: "Ver recetas" }],
  },
  {
    nombre: "Pagos",
    resumen:
      "Cobra ventas abiertas y consulta el historial de pagos por folio.",
    tablas: ["pagos"],
    estado: "listo",
    enlaces: [{ href: "/pagos", etiqueta: "Cobrar y consultar" }],
  },
  {
    nombre: "Cancelaciones",
    resumen: "Consulta de ventas cobradas canceladas y motivos.",
    tablas: ["cancelaciones"],
    estado: "listo",
    enlaces: [{ href: "/cancelaciones", etiqueta: "Historial" }],
  },
  {
    nombre: "Reportes",
    resumen:
      "Por periodo: ventas, inventario, cancelaciones, combos y platillos más vendidos.",
    tablas: ["ventas", "movimientos_inventario", "cancelaciones", "venta_lineas"],
    estado: "listo",
    enlaces: [{ href: "/reportes", etiqueta: "Ver reportes" }],
  },
];