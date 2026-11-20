import {
  listarInsumosCatalogo,
  listarPreparadosCatalogo,
  mensajeErrorCatalogo,
  TIPO_PRODUCTO_INSUMO,
  TIPO_PRODUCTO_PREPARADO,
  type CatalogoError,
  type ProductoCatalogoResumen,
} from "@/lib/catalogo/productos";
import { getSupabaseBrowser } from "@/lib/supabase";

export type ProductoResumen = ProductoCatalogoResumen;

export type Receta = {
  id: string;
  producto_id: string;
  nombre: string;
  rendimiento: number;
};

export type RecetaInsumo = {
  id: string;
  insumo_id: string;
  cantidad: number;
  productos: (Pick<ProductoResumen, "nombre" | "codigo" | "tipo">) | null;
};

export type RecetasError = CatalogoError | { kind: "validation"; message: string };

function requiereCliente() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { supabase: null, error: { kind: "config" } as const };
  }
  return { supabase, error: null };
}

function validarCantidad(cantidad: number): string | null {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return "La cantidad debe ser mayor a cero.";
  }
  return null;
}

function validarRendimiento(rendimiento: number): string | null {
  if (!Number.isFinite(rendimiento) || rendimiento <= 0) {
    return "El rendimiento debe ser mayor a cero.";
  }
  return null;
}

export async function listarProductosPreparado(): Promise<{
  data: ProductoResumen[] | null;
  error: RecetasError | null;
}> {
  return listarPreparadosCatalogo();
}

export async function listarInsumosDisponibles(recetaId: string): Promise<{
  data: ProductoResumen[] | null;
  error: RecetasError | null;
}> {
  const { data: insumos, error: catError } = await listarInsumosCatalogo();
  if (catError) return { data: null, error: catError };
  const lista = insumos ?? [];

  if (!recetaId) {
    return { data: lista, error: null };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { data: null, error: configError };

  const { data: filas, error } = await supabase
    .from("receta_insumos")
    .select("insumo_id")
    .eq("receta_id", recetaId);

  if (error) {
    return { data: null, error: { kind: "supabase", message: error.message } };
  }

  const idsEnReceta = new Set((filas ?? []).map((f) => f.insumo_id));
  return {
    data: lista.filter((p) => !idsEnReceta.has(p.id)),
    error: null,
  };
}

export async function obtenerRecetaPorProducto(productoId: string): Promise<{
  data: Receta | null;
  error: RecetasError | null;
}> {
  const { supabase, error: configError } = requiereCliente();
  if (configError) return { data: null, error: configError };

  const { data, error } = await supabase
    .from("recetas")
    .select("id, producto_id, nombre, rendimiento")
    .eq("producto_id", productoId)
    .maybeSingle();

  if (error) {
    return { data: null, error: { kind: "supabase", message: error.message } };
  }
  if (!data) {
    return { data: null, error: null };
  }

  return {
    data: {
      id: data.id,
      producto_id: data.producto_id,
      nombre: data.nombre,
      rendimiento: Number(data.rendimiento),
    },
    error: null,
  };
}

export async function crearReceta(input: {
  productoId: string;
  nombre: string;
  rendimiento: number;
}): Promise<{ data: Receta | null; error: RecetasError | null }> {
  const nombre = input.nombre.trim();
  if (!nombre) {
    return {
      data: null,
      error: { kind: "validation", message: "El nombre de la receta es obligatorio." },
    };
  }

  const rendimientoError = validarRendimiento(input.rendimiento);
  if (rendimientoError) {
    return { data: null, error: { kind: "validation", message: rendimientoError } };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { data: null, error: configError };

  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .select("id, tipo, activo")
    .eq("id", input.productoId)
    .maybeSingle();

  if (productoError) {
    return { data: null, error: { kind: "supabase", message: productoError.message } };
  }
  if (!producto?.activo || producto.tipo !== TIPO_PRODUCTO_PREPARADO) {
    return {
      data: null,
      error: {
        kind: "validation",
        message: "Solo un producto activo tipo preparado puede tener receta.",
      },
    };
  }

  const { data, error } = await supabase
    .from("recetas")
    .insert({
      producto_id: input.productoId,
      nombre,
      rendimiento: input.rendimiento,
    })
    .select("id, producto_id, nombre, rendimiento")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: {
          kind: "validation",
          message: "Este preparado ya tiene una receta.",
        },
      };
    }
    return { data: null, error: { kind: "supabase", message: error.message } };
  }

  return {
    data: {
      id: data.id,
      producto_id: data.producto_id,
      nombre: data.nombre,
      rendimiento: Number(data.rendimiento),
    },
    error: null,
  };
}

export async function actualizarReceta(
  id: string,
  input: { nombre: string; rendimiento: number },
): Promise<{ error: RecetasError | null }> {
  const nombre = input.nombre.trim();
  if (!nombre) {
    return {
      error: { kind: "validation", message: "El nombre de la receta es obligatorio." },
    };
  }

  const rendimientoError = validarRendimiento(input.rendimiento);
  if (rendimientoError) {
    return { error: { kind: "validation", message: rendimientoError } };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { error } = await supabase
    .from("recetas")
    .update({ nombre, rendimiento: input.rendimiento })
    .eq("id", id);

  if (error) {
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export async function listarInsumos(recetaId: string): Promise<{
  data: RecetaInsumo[] | null;
  error: RecetasError | null;
}> {
  const { supabase, error: configError } = requiereCliente();
  if (configError) return { data: null, error: configError };

  const { data, error } = await supabase
    .from("receta_insumos")
    .select("id, insumo_id, cantidad")
    .eq("receta_id", recetaId)
    .order("id");

  if (error) {
    return { data: null, error: { kind: "supabase", message: error.message } };
  }

  const ids = [...new Set((data ?? []).map((row) => row.insumo_id).filter(Boolean))];
  const productos = new Map<
    string,
    { nombre: string; codigo: string | null; tipo: string }
  >();

  if (ids.length > 0) {
    const { data: catalogo, error: catalogoError } = await supabase
      .from("productos")
      .select("id, nombre, codigo, tipo")
      .in("id", ids);

    if (catalogoError) {
      return { data: null, error: { kind: "supabase", message: catalogoError.message } };
    }

    for (const producto of catalogo ?? []) {
      productos.set(producto.id, {
        nombre: producto.nombre,
        codigo: producto.codigo,
        tipo: producto.tipo,
      });
    }
  }

  const filas: RecetaInsumo[] = (data ?? []).map((row) => ({
    id: row.id,
    insumo_id: row.insumo_id,
    cantidad: Number(row.cantidad),
    productos: productos.get(row.insumo_id) ?? null,
  }));

  return { data: filas, error: null };
}

export async function agregarInsumo(input: {
  recetaId: string;
  insumoId: string;
  cantidad: number;
}): Promise<{ error: RecetasError | null }> {
  const cantidadError = validarCantidad(input.cantidad);
  if (cantidadError) {
    return { error: { kind: "validation", message: cantidadError } };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .select("id, tipo, activo")
    .eq("id", input.insumoId)
    .maybeSingle();

  if (productoError) {
    return { error: { kind: "supabase", message: productoError.message } };
  }
  if (!producto?.activo || producto.tipo !== TIPO_PRODUCTO_INSUMO) {
    return {
      error: {
        kind: "validation",
        message: "Solo productos activos tipo insumo pueden agregarse a la receta.",
      },
    };
  }

  const { error } = await supabase.from("receta_insumos").insert({
    receta_id: input.recetaId,
    insumo_id: input.insumoId,
    cantidad: input.cantidad,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: {
          kind: "validation",
          message: "Ese insumo ya está en la receta.",
        },
      };
    }
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export async function actualizarCantidadInsumo(
  id: string,
  cantidad: number,
): Promise<{ error: RecetasError | null }> {
  const cantidadError = validarCantidad(cantidad);
  if (cantidadError) {
    return { error: { kind: "validation", message: cantidadError } };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { error } = await supabase
    .from("receta_insumos")
    .update({ cantidad })
    .eq("id", id);

  if (error) {
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export async function quitarInsumo(id: string): Promise<{ error: RecetasError | null }> {
  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { error } = await supabase.from("receta_insumos").delete().eq("id", id);

  if (error) {
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export function mensajeError(error: RecetasError): string {
  if (error.kind === "validation") {
    return error.message;
  }
  return mensajeErrorCatalogo(error);
}