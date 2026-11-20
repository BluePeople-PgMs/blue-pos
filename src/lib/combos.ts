import {
  listarCombosCatalogo,
  listarComponentesDisponiblesCatalogo,
  mensajeErrorCatalogo,
  type CatalogoError,
  type ProductoCatalogoResumen,
} from "@/lib/catalogo/productos";
import { getSupabaseBrowser } from "@/lib/supabase";

export type ProductoResumen = ProductoCatalogoResumen;

export type ComboComponente = {
  id: string;
  producto_id: string;
  cantidad: number;
  productos: (Pick<ProductoResumen, "nombre" | "codigo" | "precio" | "tipo">) | null;
};

export type CombosError = CatalogoError | { kind: "validation"; message: string };

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

export async function listarProductosCombo(): Promise<{
  data: ProductoResumen[] | null;
  error: CombosError | null;
}> {
  return listarCombosCatalogo();
}

export async function listarProductosParaComponente(
  comboId: string,
): Promise<{
  data: ProductoResumen[] | null;
  error: CombosError | null;
}> {
  return listarComponentesDisponiblesCatalogo(comboId);
}

export async function listarComponentes(comboId: string): Promise<{
  data: ComboComponente[] | null;
  error: CombosError | null;
}> {
  const { supabase, error: configError } = requiereCliente();
  if (configError) return { data: null, error: configError };

  const { data, error } = await supabase
    .from("combo_componentes")
    .select("id, producto_id, cantidad")
    .eq("combo_id", comboId)
    .order("id");

  if (error) {
    return { data: null, error: { kind: "supabase", message: error.message } };
  }

  const ids = [...new Set((data ?? []).map((row) => row.producto_id).filter(Boolean))];
  const productos = new Map<
    string,
    { nombre: string; codigo: string | null; precio: number | null; tipo: string }
  >();

  if (ids.length > 0) {
    const { data: catalogo, error: catalogoError } = await supabase
      .from("productos")
      .select("id, nombre, codigo, precio, tipo")
      .in("id", ids);

    if (catalogoError) {
      return { data: null, error: { kind: "supabase", message: catalogoError.message } };
    }

    for (const producto of catalogo ?? []) {
      productos.set(producto.id, {
        nombre: producto.nombre,
        codigo: producto.codigo,
        precio: producto.precio == null ? null : Number(producto.precio),
        tipo: producto.tipo,
      });
    }
  }

  const filas: ComboComponente[] = (data ?? []).map((row) => ({
    id: row.id,
    producto_id: row.producto_id,
    cantidad: Number(row.cantidad),
    productos: productos.get(row.producto_id) ?? null,
  }));

  return { data: filas, error: null };
}

export async function agregarComponente(input: {
  comboId: string;
  productoId: string;
  cantidad: number;
}): Promise<{ error: CombosError | null }> {
  if (input.productoId === input.comboId) {
    return {
      error: {
        kind: "validation",
        message: "El combo no puede incluirse como su propio componente.",
      },
    };
  }

  const cantidadError = validarCantidad(input.cantidad);
  if (cantidadError) {
    return { error: { kind: "validation", message: cantidadError } };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .select("id, tipo, activo")
    .eq("id", input.productoId)
    .maybeSingle();

  if (productoError) {
    return { error: { kind: "supabase", message: productoError.message } };
  }
  if (!producto?.activo) {
    return {
      error: {
        kind: "validation",
        message: "Ese producto no está en el catálogo o está inactivo.",
      },
    };
  }
  if (producto.tipo === "combo") {
    return {
      error: {
        kind: "validation",
        message: "Un combo no puede ser componente de otro combo.",
      },
    };
  }

  const { error } = await supabase.from("combo_componentes").insert({
    combo_id: input.comboId,
    producto_id: input.productoId,
    cantidad: input.cantidad,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: {
          kind: "validation",
          message: "Ese producto ya está en el combo.",
        },
      };
    }
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export async function actualizarCantidad(
  id: string,
  cantidad: number,
): Promise<{ error: CombosError | null }> {
  const cantidadError = validarCantidad(cantidad);
  if (cantidadError) {
    return { error: { kind: "validation", message: cantidadError } };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { error } = await supabase
    .from("combo_componentes")
    .update({ cantidad })
    .eq("id", id);

  if (error) {
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export async function quitarComponente(
  id: string,
): Promise<{ error: CombosError | null }> {
  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { error } = await supabase.from("combo_componentes").delete().eq("id", id);

  if (error) {
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export async function actualizarPrecioCombo(
  comboId: string,
  precio: number,
): Promise<{ error: CombosError | null }> {
  if (!Number.isFinite(precio) || precio < 0) {
    return {
      error: { kind: "validation", message: "El precio debe ser un número válido." },
    };
  }

  const { supabase, error: configError } = requiereCliente();
  if (configError) return { error: configError };

  const { error } = await supabase
    .from("productos")
    .update({ precio })
    .eq("id", comboId);

  if (error) {
    return { error: { kind: "supabase", message: error.message } };
  }
  return { error: null };
}

export async function obtenerPrecioCombo(
  comboId: string,
): Promise<{ precio: number | null; error: CombosError | null }> {
  const { supabase, error: configError } = requiereCliente();
  if (configError) return { precio: null, error: configError };

  const { data, error } = await supabase
    .from("productos")
    .select("precio")
    .eq("id", comboId)
    .maybeSingle();

  if (error) {
    return { precio: null, error: { kind: "supabase", message: error.message } };
  }
  const precio = data?.precio == null ? null : Number(data.precio);
  return { precio, error: null };
}

export function mensajeError(error: CombosError): string {
  if (error.kind === "validation") {
    return error.message;
  }
  return mensajeErrorCatalogo(error);
}