import { getSupabaseBrowser } from "@/lib/supabase";

export type InsumoReceta = {
  insumoId: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  unidad: string;
};

export type RecetaLista = {
  id: string;
  platoId: string;
  platoCodigo: string;
  nombre: string;
  categoria: string;
  orden: number;
  rendimiento: number;
  insumos: InsumoReceta[];
};

const SIN_SESION =
  "La sesión no autoriza la base. Entra de nuevo en /login con correo y contraseña.";

export async function leerRecetas() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error: "Faltan las variables de Supabase.",
      sesion: false,
      recetas: [] as RecetaLista[],
    };
  }

  const { data: sesionData } = await supabase.auth.getSession();
  const sesion = Boolean(sesionData.session);

  const [recetasRes, lineasRes, productosRes, categoriasRes, unidadesRes] =
    await Promise.all([
      supabase.from("recetas").select("id, producto_id, nombre, rendimiento"),
      supabase
        .from("receta_insumos")
        .select("receta_id, insumo_id, cantidad"),
      supabase
        .from("productos")
        .select("id, nombre, codigo, tipo, categoria_id, unidad_id")
        .eq("activo", true),
      supabase.from("categorias").select("id, nombre, orden"),
      supabase.from("unidades").select("id, nombre, abreviatura"),
    ]);

  const errorConsulta =
    recetasRes.error ??
    lineasRes.error ??
    productosRes.error ??
    categoriasRes.error ??
    unidadesRes.error;

  if (errorConsulta) {
    return {
      error: mensajeLegible(errorConsulta.message),
      sesion,
      recetas: [] as RecetaLista[],
    };
  }

  if (!sesion) {
    return {
      error: SIN_SESION,
      sesion: false,
      recetas: [] as RecetaLista[],
    };
  }

  const categorias = new Map(
    (categoriasRes.data ?? []).map((categoria) => [categoria.id, categoria]),
  );
  const unidades = new Map(
    (unidadesRes.data ?? []).map((unidad) => [unidad.id, unidad]),
  );
  const productos = new Map(
    (productosRes.data ?? []).map((producto) => [producto.id, producto]),
  );

  const lineasPorReceta = new Map<string, typeof lineasRes.data>();
  for (const linea of lineasRes.data ?? []) {
    const lista = lineasPorReceta.get(linea.receta_id) ?? [];
    lista.push(linea);
    lineasPorReceta.set(linea.receta_id, lista);
  }

  const recetas: RecetaLista[] = (recetasRes.data ?? [])
    .map((receta) => {
      const plato = productos.get(receta.producto_id);
      if (!plato || plato.tipo !== "preparado") return null;
      const categoria = plato.categoria_id
        ? categorias.get(plato.categoria_id)
        : undefined;
      const insumos = (lineasPorReceta.get(receta.id) ?? [])
        .map((linea) => {
          const insumo = productos.get(linea.insumo_id);
          if (!insumo) return null;
          const unidad = insumo.unidad_id
            ? unidades.get(insumo.unidad_id)
            : undefined;
          return {
            insumoId: insumo.id,
            nombre: insumo.nombre,
            codigo: insumo.codigo ?? "",
            cantidad: Number(linea.cantidad),
            unidad: unidad?.abreviatura ?? unidad?.nombre ?? "",
          };
        })
        .filter((fila): fila is InsumoReceta => fila !== null)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      return {
        id: receta.id,
        platoId: plato.id,
        platoCodigo: plato.codigo ?? "",
        nombre: receta.nombre || plato.nombre,
        categoria: categoria?.nombre ?? "Sin categoría",
        orden: categoria?.orden ?? 999,
        rendimiento: Number(receta.rendimiento ?? 1),
        insumos,
      };
    })
    .filter((fila): fila is RecetaLista => fila !== null);

  recetas.sort((a, b) => {
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.nombre.localeCompare(b.nombre, "es");
  });

  return {
    error: null as string | null,
    sesion: true,
    recetas,
  };
}

function mensajeLegible(mensaje: string) {
  if (
    mensaje.toLowerCase().includes("permission") ||
    mensaje.toLowerCase().includes("jwt") ||
    mensaje.toLowerCase().includes("row-level")
  ) {
    return SIN_SESION;
  }
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudieron leer las recetas. La base no respondió.";
  }
  return mensaje;
}