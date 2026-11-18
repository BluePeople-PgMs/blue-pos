/**
 * Descuento del combo según cuántos productos distintos incluye
 * (una fila en combo_componentes = un producto).
 */
export function descuentoComboPorNumProductos(numProductos: number): number {
  if (numProductos >= 5) return 30;
  if (numProductos >= 3) return 20;
  if (numProductos === 2) return 10;
  return 0;
}

export function reglasDescuentoCombo(): { productos: string; descuento: string }[] {
  return [
    { productos: "2 productos", descuento: "10%" },
    { productos: "3–4 productos", descuento: "20%" },
    { productos: "5 o más productos", descuento: "30%" },
  ];
}

export type ComponenteConPrecio = {
  cantidad: number;
  precioUnitario: number | null;
};

/** Suma de precio × cantidad por componente antes del descuento. */
export function subtotalComponentes(componentes: ComponenteConPrecio[]): number | null {
  if (componentes.length === 0) return null;
  let subtotal = 0;
  for (const fila of componentes) {
    if (fila.precioUnitario == null || !Number.isFinite(fila.precioUnitario)) {
      return null;
    }
    subtotal += fila.precioUnitario * fila.cantidad;
  }
  return subtotal;
}

export function precioComboConDescuento(
  numProductos: number,
  componentes: ComponenteConPrecio[],
): { subtotal: number; descuentoPct: number; total: number } | null {
  const subtotal = subtotalComponentes(componentes);
  if (subtotal == null) return null;
  const descuentoPct = descuentoComboPorNumProductos(numProductos);
  const total = subtotal * (1 - descuentoPct / 100);
  return { subtotal, descuentoPct, total };
}

export function formatoMoneda(monto: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(monto);
}