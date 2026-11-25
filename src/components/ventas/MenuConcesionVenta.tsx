"use client";

import { CatalogoVentaCinepolis } from "@/components/pos/CatalogoVentaCinepolis";
import type { ArticuloMenuVenta } from "@/lib/ventas/catalogoVentaVisual";

type MenuConcesionVentaProps = {
  articulos: ArticuloMenuVenta[];
  articuloId: string;
  onArticuloIdChange: (id: string) => void;
  cantidad: string;
  onCantidadChange: (value: string) => void;
  onAgregar: () => void;
  formatoMoneda: (monto: number) => string;
  procesando?: boolean;
};

/** Wrapper de compatibilidad → catálogo Cinépolis. */
export function MenuConcesionVenta(props: MenuConcesionVentaProps) {
  return <CatalogoVentaCinepolis {...props} />;
}