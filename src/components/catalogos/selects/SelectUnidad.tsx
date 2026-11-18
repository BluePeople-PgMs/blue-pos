"use client";

import type { Unidad } from "@/lib/catalogos/tipos";
import { useUnidades } from "@/lib/catalogos/useOpcionesCatalogo";
import { selectClassName } from "./selectStyles";

type Props = {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  permitirVacio?: boolean;
  opciones?: Unidad[];
  className?: string;
};

export function SelectUnidad({
  value,
  onChange,
  disabled,
  permitirVacio,
  opciones,
  className,
}: Props) {
  const remoto = useUnidades();
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
      {permitirVacio ? <option value="">— Sin unidad —</option> : null}
      {cargando ? <option value="">Cargando…</option> : null}
      {items.map((u) => (
        <option key={u.id} value={u.id}>
          {u.nombre} ({u.abreviatura})
        </option>
      ))}
    </select>
  );
}