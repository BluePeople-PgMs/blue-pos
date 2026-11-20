import { getSupabaseBrowser } from "@/lib/supabase";

export type RolCombo = "entrada" | "bebida" | "plato_fuerte";

export type ComponenteCombo = {
  rol: RolCombo;
  productoId: string;
  nombre: string;
  codigo: string;
  precio: number;
  tipo: string;
  categoria: string;
};

export type ComboVista = {
  id: string;
  nombre: string;
  codigo: string;
  precio: number;
  componentes: ComponenteCombo[];
};

const ENTRADAS = new Set(["Entradas"]);
const BEBIDAS = new Set(["Bebidas de la casa", "Bebidas empacadas"]);
const PLATOS_FUERTES = new Set([
  "Platos fuertes",
  "Pastas",
  "Pizzas",
  "Risottos",
]);

const ETIQUETA_ROL: Record<RolCombo, string> = {
  entrada: "Entrada",
  bebida: "Bebida",
  plato_fuerte: "Plato fuerte",
};

export function etiquetaRol(rol: RolCombo): string {
  return ETIQUETA_ROL[rol];
}

export function rolComboPorCategoria(categoria: string): RolCombo | null {
  if (ENTRADAS.has(categoria)) return "entrada";
  if (BEBIDAS.has(categoria)) return "bebida";
  if (PLATOS_FUERTES.has(categoria)) return "plato_fuerte";
  return null;
}

type ProductoBase = {
  id: string;
  nombre: string;
  codigo: string;
  precio: number;
  tipo: string;
  categoria: string;
};

async function cargarProductosBase(): Promise<{
  error: string | null;
  productos: ProductoBase[];
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase.", productos: [] };
  }

  const [productosRes, categoriasRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, codigo, precio, tipo, categoria_id")
      .eq("activo", true)
      .in("tipo", ["preparado", "directo"]),
    supabase.from("categorias").select("id, nombre"),
  ]);

  const error = productosRes.error ?? categoriasRes.error;
  if (error) {
    return { error: mensajeLegible(error.message), productos: [] };
  }

  const categorias = new Map(
    (categoriasRes.data ?? []).map((fila) => [fila.id, fila.nombre]),
  );

  const productos = (productosRes.data ?? [])
    .map((fila) => {
      const categoria = fila.categoria_id
        ? (categorias.get(fila.categoria_id) ?? "")
        : "";
      const precio = Number(fila.precio ?? 0);
      return {
        id: fila.id,
        nombre: fila.nombre,
        codigo: fila.codigo ?? "",
        precio: Number.isFinite(precio) ? precio : 0,
        tipo: fila.tipo,
        categoria,
      };
    })
    .filter((p) => rolComboPorCategoria(p.categoria) !== null);

  return { error: null, productos };
}

export async function listarCombos(): Promise<{
  error: string | null;
  combos: ComboVista[];
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase.", combos: [] };
  }

  const [combosRes, componentesRes, productosRes, categoriasRes] =
    await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, codigo, precio")
        .eq("tipo", "combo")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("combo_componentes")
        .select("id, combo_id, producto_id, cantidad"),
      supabase.from("productos").select("id, nombre, codigo, precio, tipo, categoria_id"),
      supabase.from("categorias").select("id, nombre"),
    ]);

  const error =
    combosRes.error ??
    componentesRes.error ??
    productosRes.error ??
    categoriasRes.error;
  if (error) {
    return { error: mensajeLegible(error.message), combos: [] };
  }

  const categorias = new Map(
    (categoriasRes.data ?? []).map((fila) => [fila.id, fila.nombre]),
  );
  const productosPorId = new Map(
    (productosRes.data ?? []).map((fila) => {
      const categoria = fila.categoria_id
        ? (categorias.get(fila.categoria_id) ?? "")
        : "";
      return [
        fila.id,
        {
          id: fila.id,
          nombre: fila.nombre,
          codigo: fila.codigo ?? "",
          precio: Number(fila.precio ?? 0),
          tipo: fila.tipo,
          categoria,
        },
      ];
    }),
  );

  const porCombo = new Map<string, ComponenteCombo[]>();
  for (const fila of componentesRes.data ?? []) {
    if (!fila.combo_id || !fila.producto_id) continue;
    const producto = productosPorId.get(fila.producto_id);
    if (!producto) continue;
    const rolGuardado =
      "rol" in fila && typeof fila.rol === "string"
        ? (fila.rol as RolCombo)
        : null;
    const rol =
      rolGuardado ?? rolComboPorCategoria(producto.categoria) ?? "entrada";
    const lista = porCombo.get(fila.combo_id) ?? [];
    lista.push({
      rol,
      productoId: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      precio: producto.precio,
      tipo: producto.tipo,
      categoria: producto.categoria,
    });
    porCombo.set(fila.combo_id, lista);
  }

  const ordenRol: Record<RolCombo, number> = {
    entrada: 1,
    bebida: 2,
    plato_fuerte: 3,
  };

  const combos: ComboVista[] = (combosRes.data ?? []).map((combo) => {
    const componentes = (porCombo.get(combo.id) ?? []).sort(
      (a, b) => ordenRol[a.rol] - ordenRol[b.rol],
    );
    return {
      id: combo.id,
      nombre: combo.nombre,
      codigo: combo.codigo ?? "",
      precio: Number(combo.precio ?? 0),
      componentes,
    };
  });

  return { error: null, combos };
}

export async function generarCombos(): Promise<{
  error: string | null;
  creados: number;
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase.", creados: 0 };
  }

  const { error: baseError, productos } = await cargarProductosBase();
  if (baseError) {
    return { error: baseError, creados: 0 };
  }

  const entradas = productos.filter((p) => p.categoria === "Entradas");
  const bebidas = productos.filter((p) => BEBIDAS.has(p.categoria));
  const platos = productos.filter((p) => PLATOS_FUERTES.has(p.categoria));

  if (entradas.length === 0 || bebidas.length === 0 || platos.length === 0) {
    return {
      error:
        "No hay suficientes productos en Entradas, bebidas o platos fuertes. Revisa los catálogos de comidas y productos terminados.",
      creados: 0,
    };
  }

  const [existentesRes, unidadesRes, categoriasRes] = await Promise.all([
    supabase.from("productos").select("id, codigo").eq("tipo", "combo"),
    supabase.from("unidades").select("id, abreviatura").limit(1),
    supabase.from("categorias").select("id, nombre"),
  ]);

  if (existentesRes.error || unidadesRes.error || categoriasRes.error) {
    const mensaje =
      existentesRes.error?.message ??
      unidadesRes.error?.message ??
      categoriasRes.error?.message ??
      "No se pudo preparar la generación.";
    return { error: mensajeLegible(mensaje), creados: 0 };
  }

  const idsCombo = (existentesRes.data ?? []).map((fila) => fila.id);
  if (idsCombo.length > 0) {
    await supabase.from("combo_componentes").delete().in("combo_id", idsCombo);
    await supabase.from("productos").delete().in("id", idsCombo);
  }

  const unidadId = unidadesRes.data?.[0]?.id ?? null;
  const categoriaCombo =
    (categoriasRes.data ?? []).find((fila) => fila.nombre === "Combos")?.id ??
    null;

  const maxCombos = Math.min(entradas.length, 12);
  let creados = 0;

  for (let indice = 0; indice < maxCombos; indice += 1) {
    const entrada = entradas[indice];
    const bebida = bebidas[indice % bebidas.length];
    const plato = platos[indice % platos.length];
    const piezas = [
      { rol: "entrada" as const, producto: entrada },
      { rol: "bebida" as const, producto: bebida },
      { rol: "plato_fuerte" as const, producto: plato },
    ];

    const suma = piezas.reduce((total, pieza) => total + pieza.producto.precio, 0);
    const precioCombo = Math.round(suma * 0.9);
    const codigo = `CMB-${String(indice + 1).padStart(3, "0")}`;
    const nombre = `Combo trattoria ${indice + 1}`;

    const { data: comboFila, error: comboError } = await supabase
      .from("productos")
      .insert({
        nombre,
        tipo: "combo",
        codigo,
        precio: precioCombo,
        activo: true,
        unidad_id: unidadId,
        categoria_id: categoriaCombo,
      })
      .select("id")
      .single();

    if (comboError || !comboFila) {
      return {
        error: mensajeLegible(comboError?.message ?? "No se guardó el combo."),
        creados,
      };
    }

    const filasComponentes = piezas.map((pieza) => ({
      combo_id: comboFila.id,
      producto_id: pieza.producto.id,
      cantidad: 1,
    }));
    const filasConRol = piezas.map((pieza) => ({
      combo_id: comboFila.id,
      producto_id: pieza.producto.id,
      cantidad: 1,
      rol: pieza.rol,
    }));

    let componentesError = (
      await supabase.from("combo_componentes").insert(filasConRol)
    ).error;
    if (
      componentesError &&
      componentesError.message.toLowerCase().includes("rol")
    ) {
      componentesError = (
        await supabase.from("combo_componentes").insert(filasComponentes)
      ).error;
    }

    if (componentesError) {
      return {
        error: mensajeLegible(componentesError.message),
        creados,
      };
    }

    creados += 1;
  }

  return { error: null, creados };
}

function mensajeLegible(mensaje: string) {
  if (mensaje.includes("rol") && mensaje.includes("column")) {
    return "Falta la columna rol en combo_componentes. En Supabase → SQL Editor ejecuta las migraciones 20261120120000_combo_rol.sql y 20261120195000_categoria_combos.sql del proyecto.";
  }
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudo completar la operación. La base no respondió.";
  }
  return mensaje;
}