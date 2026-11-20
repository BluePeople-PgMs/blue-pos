import { getSupabaseBrowser } from "@/lib/supabase";
import type { TipoCatalogo } from "@/data/catalogo-italiano";

export type ProductoCatalogo = {
  id: string;
  nombre: string;
  codigo: string;
  precio: number | string | null;
  categoria: string;
  orden: number;
  unidad: string;
};

export async function leerCatalogo(tipo: TipoCatalogo) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      error: "Faltan las variables de Supabase.",
      productos: [] as ProductoCatalogo[],
    };
  }

  const [productosRes, categoriasRes, unidadesRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, precio, codigo, categoria_id, unidad_id")
      .eq("tipo", tipo)
      .eq("activo", true),
    supabase.from("categorias").select("id, nombre, orden"),
    supabase.from("unidades").select("id, nombre, abreviatura"),
  ]);

  const error =
    productosRes.error ?? categoriasRes.error ?? unidadesRes.error;
  if (error) {
    return { error: mensajeLegible(error.message), productos: [] as ProductoCatalogo[] };
  }

  const categorias = new Map(
    (categoriasRes.data ?? []).map((categoria) => [categoria.id, categoria]),
  );
  const unidades = new Map(
    (unidadesRes.data ?? []).map((unidad) => [unidad.id, unidad]),
  );

  const productos = (productosRes.data ?? []).map((producto) => {
    const categoria = producto.categoria_id
      ? categorias.get(producto.categoria_id)
      : undefined;
    const unidad = producto.unidad_id
      ? unidades.get(producto.unidad_id)
      : undefined;

    return {
      id: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo ?? "",
      precio: producto.precio,
      categoria: categoria?.nombre ?? "Sin categoría",
      orden: categoria?.orden ?? 999,
      unidad: unidad?.abreviatura ?? unidad?.nombre ?? "",
    };
  });

  productos.sort((a, b) => {
    if (a.orden !== b.orden) return a.orden - b.orden;
    return a.nombre.localeCompare(b.nombre, "es");
  });

  return { error: null, productos };
}

function mensajeLegible(mensaje: string) {
  if (mensaje.includes("<") || mensaje.length > 180) {
    return "No se pudo leer el catálogo. La base no respondió.";
  }
  return mensaje;
}
