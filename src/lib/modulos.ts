export type Modulo = {
  nombre: string;
  resumen: string;
  tablas: string[];
  ruta?: string;
  listo?: boolean;
};

export const modulos: Modulo[] = [
  {
    nombre: "Login",
    resumen: "Primera tarea del equipo: iniciar sesión con Supabase Auth.",
    tablas: ["perfiles"],
    ruta: "/login",
    listo: true,
  },
  {
    nombre: "Catálogos",
    resumen:
      "Lista de productos compartida; combos e inventario leen esta tabla.",
    tablas: ["categorias", "unidades", "productos", "cajas"],
    ruta: "/catalogos",
    listo: true,
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
  },
];
