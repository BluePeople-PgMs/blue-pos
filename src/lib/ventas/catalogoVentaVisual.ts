import { TIPO_PRODUCTO_COMBO } from "@/lib/catalogo/productos";
import type { ComboParaVenta, ProductoVentaResumen } from "@/lib/ventas/combosEnVenta";

export type ArticuloMenuVenta = {
  id: string;
  nombre: string;
  codigo: string | null;
  precioUnitario: number;
  esCombo: boolean;
  descuentoPct: number;
  stockDisponible: number;
};

export function armarMenuVentaVisual(
  productosVendibles: ProductoVentaResumen[],
  combosVendibles: ComboParaVenta[],
  existencias: Map<string, number>,
): ArticuloMenuVenta[] {
  const items: ArticuloMenuVenta[] = [];

  for (const p of productosVendibles) {
    if (p.precio == null || p.precio < 0) {
      continue;
    }
    items.push({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      precioUnitario: p.precio,
      esCombo: false,
      descuentoPct: 0,
      stockDisponible: existencias.get(p.id) ?? 0,
    });
  }

  for (const c of combosVendibles) {
    if (c.precioUnitario == null) {
      continue;
    }
    items.push({
      id: c.id,
      nombre: c.nombre,
      codigo: c.codigo,
      precioUnitario: c.precioUnitario,
      esCombo: true,
      descuentoPct: c.descuentoPct,
      stockDisponible: c.combosDisponibles,
    });
  }

  return items.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function esIdComboEnCatalogo(
  id: string,
  catalogo: ProductoVentaResumen[],
): boolean {
  return catalogo.find((p) => p.id === id)?.tipo === TIPO_PRODUCTO_COMBO;
}