"use client";

import type { Caja } from "@/lib/catalogos/tipos";
import { useCajasActivas } from "@/lib/catalogos/useOpcionesCatalogo";
import { selectClassName } from "./selectStyles";

type Props = {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  permitirVacio?: boolean;
  opciones?: Caja[];
  className?: string;
};

export function SelectCaja({
  value,
  onChange,
  disabled,
  permitirVacio,
  opciones,
  className,
}: Props) {
  const remoto = useCajasActivas();
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
      {permitirVacio ? <option value="">— Sin caja —</option> : null}
      {cargando ? <option value="">Cargando…</option> : null}
      {!cargando && items.length === 0 ? (
        <option value="">Sin cajas activas</option>
      ) : null}
      {items.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nombre}
        </option>
      ))}
    </select>
  );
}