"use client";

import type { Categoria } from "@/lib/catalogos/tipos";
import { useCategorias } from "@/lib/catalogos/useOpcionesCatalogo";
import { selectClassName } from "./selectStyles";

type Props = {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  permitirVacio?: boolean;
  opciones?: Categoria[];
  className?: string;
};

export function SelectCategoria({
  value,
  onChange,
  disabled,
  permitirVacio,
  opciones,
  className,
}: Props) {
  const remoto = useCategorias();
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
      disabled={disabled || cargando}
      className={className ?? selectClassName}
    >
      {permitirVacio ? <option value="">— Sin categoría —</option> : null}
      {cargando ? <option value="">Cargando…</option> : null}
      {items.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nombre}
        </option>
      ))}
    </select>
  );
}