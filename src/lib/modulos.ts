export type Modulo = {
  nombre: string;
  resumen: string;
  tablas: string[];
};

export const modulos: Modulo[] = [
  {
    nombre: "Login",
    resumen: "Primera tarea del equipo: iniciar sesión con Supabase Auth.",
    tablas: ["perfiles"],
  },
  {
    nombre: "Catálogos",
    resumen: "Categorías, unidades, productos y cajas.",
    tablas: ["categorias", "unidades", "productos", "cajas"],
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
