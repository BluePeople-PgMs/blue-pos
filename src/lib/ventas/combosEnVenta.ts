import {
  descuentoComboPorNumProductos,
  precioComboConDescuento,
  type ComponenteConPrecio,
} from "@/lib/comboDescuento";
import { TIPO_PRODUCTO_COMBO } from "@/lib/catalogo/productos";

export type ComboComponenteInventario = {
  producto_id: string;
  cantidad: number;
};

export type ComboParaVenta = {
  id: string;
  nombre: string;
  codigo: string | null;
  numProductos: number;
  descuentoPct: number;
  precioUnitario: number | null;
  componentes: ComboComponenteInventario[];
  combosDisponibles: number;
};

export type ProductoVentaResumen = {
  id: string;
  nombre: string;
  codigo: string | null;
  tipo: string;
  precio: number | null;
};

export function esProductoCombo(tipo: string | undefined): boolean {
  return tipo === TIPO_PRODUCTO_COMBO;
}

export function calcularPrecioComboVenta(
  componentes: ComboComponenteInventario[],
  precios: Map<string, number | null>,
): { descuentoPct: number; precioUnitario: number | null } {
  const numProductos = componentes.length;
  const descuentoPct = descuentoComboPorNumProductos(numProductos);
  if (componentes.length === 0) {
    return { descuentoPct, precioUnitario: null };
  }

  const filas: ComponenteConPrecio[] = [];
  for (const c of componentes) {
    const precio = precios.get(c.producto_id);
    if (precio == null || !Number.isFinite(precio)) {
      return { descuentoPct, precioUnitario: null };
    }
    filas.push({ cantidad: c.cantidad, precioUnitario: precio });
  }

  const calc = precioComboConDescuento(numProductos, filas);
  if (!calc) {
    return { descuentoPct, precioUnitario: null };
  }

  return {
    descuentoPct: calc.descuentoPct,
    precioUnitario: Math.round(calc.total * 100) / 100,
  };
}

export function maxCombosPorExistencias(
  componentes: ComboComponenteInventario[],
  existencias: Map<string, number>,
): number {
  if (componentes.length === 0) {
    return 0;
  }

  let max = Number.POSITIVE_INFINITY;
  for (const c of componentes) {
    if (c.cantidad <= 0) {
      return 0;
    }
    const stock = existencias.get(c.producto_id) ?? 0;
    max = Math.min(max, Math.floor(stock / c.cantidad));
  }

  return Number.isFinite(max) ? max : 0;
}

export function armarCombosParaVenta(
  productos: ProductoVentaResumen[],
  filasComponentes: {
    combo_id: string;
    producto_id: string;
    cantidad: number | string;
  }[],
  existencias: Map<string, number>,
): {
  combos: ComboParaVenta[];
  componentesPorComboId: Map<string, ComboComponenteInventario[]>;
} {
  const precios = new Map(productos.map((p) => [p.id, p.precio]));
  const componentesPorComboId = new Map<string, ComboComponenteInventario[]>();

  for (const fila of filasComponentes) {
    const lista = componentesPorComboId.get(fila.combo_id) ?? [];
    lista.push({
      producto_id: fila.producto_id,
      cantidad: Number(fila.cantidad),
    });
    componentesPorComboId.set(fila.combo_id, lista);
  }

  const combos: ComboParaVenta[] = [];
  for (const p of productos) {
    if (p.tipo !== TIPO_PRODUCTO_COMBO) {
      continue;
    }
    const componentes = componentesPorComboId.get(p.id) ?? [];
    const { descuentoPct, precioUnitario } = calcularPrecioComboVenta(
      componentes,
      precios,
    );
    const combosDisponibles = maxCombosPorExistencias(componentes, existencias);
    combos.push({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      numProductos: componentes.length,
      descuentoPct,
      precioUnitario,
      componentes,
      combosDisponibles,
    });
  }

  combos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return { combos, componentesPorComboId };
}

export function salidasInventarioPorLinea(
  linea: { producto_id: string; cantidad: number },
  esCombo: boolean,
  componentes: ComboComponenteInventario[] | undefined,
): { producto_id: string; cantidad: number }[] {
  if (!esCombo || !componentes?.length) {
    return [{ producto_id: linea.producto_id, cantidad: linea.cantidad }];
  }

  return componentes.map((c) => ({
    producto_id: c.producto_id,
    cantidad: linea.cantidad * c.cantidad,
  }));
}

export function requerimientosInventario(
  lineas: { producto_id: string | null; cantidad: number }[],
  tiposPorId: Map<string, string>,
  componentesPorComboId: Map<string, ComboComponenteInventario[]>,
): Map<string, number> {
  const req = new Map<string, number>();

  for (const linea of lineas) {
    if (!linea.producto_id) {
      continue;
    }
    const esCombo = esProductoCombo(tiposPorId.get(linea.producto_id));
    const salidas = salidasInventarioPorLinea(
      { producto_id: linea.producto_id, cantidad: linea.cantidad },
      esCombo,
      componentesPorComboId.get(linea.producto_id),
    );
    for (const s of salidas) {
      req.set(s.producto_id, (req.get(s.producto_id) ?? 0) + s.cantidad);
    }
  }

  return req;
}

export function notaLineaCombo(descuentoPct: number, numProductos: number): string {
  return `combo · ${numProductos} producto(s) · −${descuentoPct}%`;
}