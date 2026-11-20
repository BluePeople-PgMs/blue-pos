import { getSupabaseBrowser } from "@/lib/supabase";

export type InsumoOpcion = {
  id: string;
  nombre: string;
  codigo: string;
  unidad: string;
};

export type PreparadoOpcion = {
  id: string;
  nombre: string;
  codigo: string;
};

export type LineaInsumo = {
  id: string;
  insumoId: string;
  insumoNombre: string;
  insumoCodigo: string;
  cantidad: number;
  unidad: string;
};

export type RecetaDetalle = {
  id: string;
  nombre: string;
  productoId: string | null;
  productoNombre: string;
  rendimiento: number;
  lineas: LineaInsumo[];
};

function mensajeLegible(mensaje: string) {
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "La base no respondió. Revisa la conexión.";
  }
  return mensaje;
}

export async function leerRecetas() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error: "Faltan las variables de Supabase.",
      recetas: [] as RecetaDetalle[],
      preparados: [] as PreparadoOpcion[],
      insumos: [] as InsumoOpcion[],
    };
  }

  const [recetasRes, lineasRes, productosRes, unidadesRes] = await Promise.all([
    supabase.from("recetas").select("id, producto_id, nombre, rendimiento"),
    supabase.from("receta_insumos").select("id, receta_id, insumo_id, cantidad"),
    supabase
      .from("productos")
      .select("id, nombre, codigo, tipo, unidad_id")
      .eq("activo", true),
    supabase.from("unidades").select("id, nombre, abreviatura"),
  ]);

  const error =
    recetasRes.error ??
    lineasRes.error ??
    productosRes.error ??
    unidadesRes.error;
  if (error) {
    return {
      error: mensajeLegible(error.message),
      recetas: [] as RecetaDetalle[],
      preparados: [] as PreparadoOpcion[],
      insumos: [] as InsumoOpcion[],
    };
  }

  const unidades = new Map(
    (unidadesRes.data ?? []).map((unidad) => [unidad.id, unidad]),
  );
  const productos = productosRes.data ?? [];

  const preparados: PreparadoOpcion[] = productos
    .filter((producto) => producto.tipo === "preparado")
    .map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo ?? "",
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const insumos: InsumoOpcion[] = productos
    .filter((producto) => producto.tipo === "insumo")
    .map((producto) => {
      const unidad = producto.unidad_id
        ? unidades.get(producto.unidad_id)
        : undefined;
      return {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo ?? "",
        unidad: unidad?.abreviatura ?? unidad?.nombre ?? "",
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const nombres = new Map(
    productos.map((producto) => [
      producto.id,
      {
        nombre: producto.nombre,
        codigo: producto.codigo ?? "",
        unidad: producto.unidad_id
          ? (unidades.get(producto.unidad_id)?.abreviatura ??
            unidades.get(producto.unidad_id)?.nombre ??
            "")
          : "",
      },
    ]),
  );

  const lineasPorReceta = new Map<string, LineaInsumo[]>();
  for (const fila of lineasRes.data ?? []) {
    if (!fila.receta_id) continue;
    const insumo = nombres.get(fila.insumo_id);
    const lista = lineasPorReceta.get(fila.receta_id) ?? [];
    lista.push({
      id: fila.id,
      insumoId: fila.insumo_id,
      insumoNombre: insumo?.nombre ?? "Insumo",
      insumoCodigo: insumo?.codigo ?? "",
      cantidad: Number(fila.cantidad),
      unidad: insumo?.unidad ?? "",
    });
    lineasPorReceta.set(fila.receta_id, lista);
  }

  const recetas: RecetaDetalle[] = (recetasRes.data ?? [])
    .map((receta) => {
      const producto = receta.producto_id
        ? nombres.get(receta.producto_id)
        : undefined;
      const lineas = lineasPorReceta.get(receta.id) ?? [];
      lineas.sort((a, b) =>
        a.insumoNombre.localeCompare(b.insumoNombre, "es"),
      );
      return {
        id: receta.id,
        nombre: receta.nombre,
        productoId: receta.producto_id,
        productoNombre: producto?.nombre ?? "Sin comida ligada",
        rendimiento: Number(receta.rendimiento),
        lineas,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return { error: null, recetas, preparados, insumos };
}

export async function crearReceta(datos: {
  productoId: string;
  nombre: string;
  rendimiento: number;
}) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase.", id: null as string | null };
  }

  const nombre = datos.nombre.trim();
  if (!datos.productoId) {
    return { error: "Elige la comida preparada.", id: null };
  }
  if (!nombre) {
    return { error: "Escribe un nombre para la receta.", id: null };
  }
  if (!(datos.rendimiento > 0)) {
    return { error: "El rendimiento tiene que ser mayor a cero.", id: null };
  }

  const { data, error } = await supabase
    .from("recetas")
    .insert({
      producto_id: datos.productoId,
      nombre,
      rendimiento: datos.rendimiento,
    })
    .select("id")
    .single();

  if (error) {
    return { error: mensajeLegible(error.message), id: null };
  }
  return { error: null, id: data.id as string };
}

export async function agregarInsumoReceta(datos: {
  recetaId: string;
  insumoId: string;
  cantidad: number;
}) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase." };
  }

  if (!datos.recetaId || !datos.insumoId) {
    return { error: "Elige receta e insumo." };
  }
  if (!(datos.cantidad > 0)) {
    return { error: "La cantidad tiene que ser mayor a cero." };
  }

  const { error } = await supabase.from("receta_insumos").insert({
    receta_id: datos.recetaId,
    insumo_id: datos.insumoId,
    cantidad: datos.cantidad,
  });

  if (error) {
    return { error: mensajeLegible(error.message) };
  }
  return { error: null };
}

export async function quitarInsumoReceta(lineaId: string) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { error: "Faltan las variables de Supabase." };
  }

  const { error } = await supabase
    .from("receta_insumos")
    .delete()
    .eq("id", lineaId);

  if (error) {
    return { error: mensajeLegible(error.message) };
  }
  return { error: null };
}