import { TIPO_PRODUCTO_COMBO } from "@/lib/catalogo/productos";
import {
  armarMenuVentaVisual,
  type ArticuloMenuVenta,
} from "@/lib/ventas/catalogoVentaVisual";
import {
  armarCombosParaVenta,
  type ComboParaVenta,
  type ProductoVentaResumen,
} from "@/lib/ventas/combosEnVenta";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogoDeliveryCargado = {
  articulos: ArticuloMenuVenta[];
  productos: ProductoVentaResumen[];
  combos: ComboParaVenta[];
  existencias: Map<string, number>;
};

export type CatalogoDeliveryError = { error: string };

export async function cargarCatalogoDelivery(
  client: SupabaseClient,
): Promise<CatalogoDeliveryCargado | CatalogoDeliveryError> {
  const [productosRes, comboCompRes, existenciasRes] = await Promise.all([
    client
      .from("productos")
      .select("id, nombre, codigo, tipo, precio")
      .eq("activo", true)
      .order("nombre"),
    client.from("combo_componentes").select("combo_id, producto_id, cantidad"),
    client.from("existencias").select("producto_id, cantidad"),
  ]);

  if (productosRes.error) {
    return { error: productosRes.error.message };
  }
  if (comboCompRes.error) {
    return { error: comboCompRes.error.message };
  }
  if (existenciasRes.error) {
    return { error: existenciasRes.error.message };
  }

  const listaProductos = (productosRes.data ?? []) as ProductoVentaResumen[];
  const mapExistencias = new Map(
    (existenciasRes.data ?? []).map((f) => [
      f.producto_id,
      Number(f.cantidad),
    ]),
  );

  const productosVenta = listaProductos.filter(
    (p) =>
      p.tipo !== TIPO_PRODUCTO_COMBO &&
      p.precio != null &&
      p.precio >= 0,
  );

  const { combos } = armarCombosParaVenta(
    listaProductos,
    comboCompRes.data ?? [],
    mapExistencias,
  );
  const combosVenta = combos.filter(
    (c) => c.componentes.length > 0 && c.precioUnitario != null,
  );

  const articulos = armarMenuVentaVisual(
    productosVenta,
    combosVenta,
    mapExistencias,
  );

  return {
    articulos,
    productos: listaProductos,
    combos: combosVenta,
    existencias: mapExistencias,
  };
}