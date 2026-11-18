"use client";

import { etiquetaProducto } from "@/lib/catalogos/etiquetas";
import type { ProductoOpcion } from "@/lib/catalogos/tipos";
import { useProductosActivos } from "@/lib/catalogos/useOpcionesCatalogo";
import { selectClassName } from "./selectStyles";

type Props = {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  permitirVacio?: boolean;
  incluirInactivos?: boolean;
  opciones?: ProductoOpcion[];
  className?: string;
};

export function SelectProducto({
  value,
  onChange,
  disabled,
  permitirVacio,
  incluirInactivos,
  opciones,
  className,
}: Props) {
  const remoto = useProductosActivos({ incluirInactivos });
  const items = opciones ?? remoto.items;
  const cargando = opciones ? false : remoto.cargando;
  const error = opciones ? null : remoto.error;

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || cargando || (items.length === 0 && !permitirVacio)}
      className={className ?? selectClassName}
    >
      {permitirVacio ? <option value="">— Sin elegir —</option> : null}
      {cargando ? <option value="">Cargando productos…</option> : null}
      {!cargando && items.length === 0 ? (
        <option value="">Sin productos</option>
      ) : null}
      {items.map((p) => (
        <option key={p.id} value={p.id}>
          {etiquetaProducto(p.nombre, p.codigo)}
        </option>
      ))}
    </select>
  );
}