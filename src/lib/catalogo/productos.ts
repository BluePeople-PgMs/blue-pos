import { getSupabaseBrowser } from "@/lib/supabase";

/** Misma convención que el comentario del cascarón en `productos.tipo`. */
export const TIPO_PRODUCTO_COMBO = "combo";
export const TIPO_PRODUCTO_PREPARADO = "preparado";
export const TIPO_PRODUCTO_INSUMO = "insumo";

export type ProductoCatalogo = {
  id: string;
  nombre: string;
  codigo: string | null;
  tipo: string;
  precio: number | null;
  activo: boolean;
  categoria_id: string | null;
  unidad_id: string | null;
};

export type ProductoCatalogoResumen = Pick<
  ProductoCatalogo,
  "id" | "nombre" | "codigo" | "tipo" | "precio"
>;

export type CatalogoError =
  | { kind: "config" }
  | { kind: "supabase"; message: string };

const COLUMNAS_LISTADO =
  "id, nombre, codigo, tipo, precio, activo, categoria_id, unidad_id" as const;

function cliente() {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { supabase: null, error: { kind: "config" } as const };
  }
  return { supabase, error: null };
}

export function productoRelacionado<T extends Record<string, unknown>>(
  productos: T | T[] | null,
): T | null {
  if (!productos) {
    return null;
  }
  return Array.isArray(productos) ? (productos[0] ?? null) : productos;
}

function aProducto(fila: {
  id: string;
  nombre: string;
  codigo: string | null;
  tipo: string;
  precio: number | string | null;
  activo: boolean;
  categoria_id: string | null;
  unidad_id: string | null;
}): ProductoCatalogo {
  return {
    ...fila,
    precio: fila.precio == null ? null : Number(fila.precio),
  };
}

function aResumen(producto: ProductoCatalogo): ProductoCatalogoResumen {
  return {
    id: producto.id,
    nombre: producto.nombre,
    codigo: producto.codigo,
    tipo: producto.tipo,
    precio: producto.precio,
  };
}

export type FiltroProductosCatalogo = {
  soloActivos?: boolean;
  tipo?: string;
  excluirTipos?: string[];
  excluirId?: string;
};

export async function listarProductosCatalogo(
  filtro: FiltroProductosCatalogo = {},
): Promise<{
  data: ProductoCatalogo[] | null;
  error: CatalogoError | null;
}> {
  const { supabase, error: configError } = cliente();
  if (configError) return { data: null, error: configError };

  const soloActivos = filtro.soloActivos ?? true;
  let query = supabase.from("productos").select(COLUMNAS_LISTADO).order("nombre");

  if (soloActivos) {
    query = query.eq("activo", true);
  }
  if (filtro.tipo) {
    query = query.eq("tipo", filtro.tipo);
  }
  if (filtro.excluirId) {
    query = query.neq("id", filtro.excluirId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: { kind: "supabase", message: error.message } };
  }

  let lista = (data ?? []).map(aProducto);
  if (filtro.excluirTipos?.length) {
    lista = lista.filter((p) => !filtro.excluirTipos!.includes(p.tipo));
  }

  return { data: lista, error: null };
}

export async function listarProductosCatalogoResumen(
  filtro: FiltroProductosCatalogo = {},
): Promise<{
  data: ProductoCatalogoResumen[] | null;
  error: CatalogoError | null;
}> {
  const { data, error } = await listarProductosCatalogo(filtro);
  if (error) return { data: null, error };
  return { data: (data ?? []).map(aResumen), error: null };
}

export async function listarCombosCatalogo(): Promise<{
  data: ProductoCatalogoResumen[] | null;
  error: CatalogoError | null;
}> {
  return listarProductosCatalogoResumen({
    tipo: TIPO_PRODUCTO_COMBO,
    soloActivos: true,
  });
}

export async function listarPreparadosCatalogo(): Promise<{
  data: ProductoCatalogoResumen[] | null;
  error: CatalogoError | null;
}> {
  return listarProductosCatalogoResumen({
    tipo: TIPO_PRODUCTO_PREPARADO,
    soloActivos: true,
  });
}

export async function listarInsumosCatalogo(): Promise<{
  data: ProductoCatalogoResumen[] | null;
  error: CatalogoError | null;
}> {
  return listarProductosCatalogoResumen({
    tipo: TIPO_PRODUCTO_INSUMO,
    soloActivos: true,
  });
}

/** Productos del catálogo usables como componentes de un combo. */
export async function listarComponentesDisponiblesCatalogo(comboId: string): Promise<{
  data: ProductoCatalogoResumen[] | null;
  error: CatalogoError | null;
}> {
  return listarProductosCatalogoResumen({
    excluirId: comboId,
    excluirTipos: [TIPO_PRODUCTO_COMBO],
    soloActivos: true,
  });
}

export function etiquetaTipoProducto(tipo: string): string {
  const mapa: Record<string, string> = {
    combo: "Combo",
    directo: "Directo",
    preparado: "Preparado",
    insumo: "Insumo",
  };
  return mapa[tipo] ?? tipo;
}

export function mensajeErrorCatalogo(error: CatalogoError): string {
  if (error.kind === "config") {
    return "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local.";
  }
  return error.message;
}