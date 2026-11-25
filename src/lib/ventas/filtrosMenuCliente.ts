import type { ArticuloMenuVenta } from "@/lib/ventas/catalogoVentaVisual";

export type FiltroCatalogoTab = "todos" | "productos" | "combos" | "promo";

export function filtrarArticulosMenu(
  articulos: ArticuloMenuVenta[],
  options: { query: string; tab: FiltroCatalogoTab },
): ArticuloMenuVenta[] {
  const q = options.query.trim().toLowerCase();
  return articulos.filter((a) => {
    if (options.tab === "productos" && a.esCombo) return false;
    if (options.tab === "combos" && !a.esCombo) return false;
    if (options.tab === "promo" && a.descuentoPct <= 0) return false;
    if (!q) return true;
    const blob = `${a.nombre} ${a.codigo ?? ""}`.toLowerCase();
    return blob.includes(q);
  });
}