"use client";

import { ArticuloPresentacionVisual } from "@/components/ventas/ArticuloPresentacionVisual";
import { formatoMoneda } from "@/lib/comboDescuento";

type ComboTarjetaCineProps = {
  id: string;
  nombre: string;
  codigo: string | null;
  precio: number | null;
  seleccionado: boolean;
  disabled?: boolean;
  onSeleccionar: (id: string) => void;
};

export function ComboTarjetaCine({
  id,
  nombre,
  codigo,
  precio,
  seleccionado,
  disabled,
  onSeleccionar,
}: ComboTarjetaCineProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSeleccionar(id)}
      className={`concesion-card flex w-[11.5rem] shrink-0 snap-center flex-col overflow-hidden rounded-xl text-left transition ${
        seleccionado
          ? "concesion-card--activo ring-2 ring-[#f5c451] ring-offset-2 ring-offset-[#121820]"
          : "opacity-90 hover:opacity-100"
      }`}
    >
      <div className="relative aspect-[4/5] w-full">
        <ArticuloPresentacionVisual nombre={nombre} esCombo compacto />
      </div>
      <div className="concesion-card-pie flex flex-col gap-1 px-3 py-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {nombre}
        </p>
        {codigo ? (
          <p className="font-mono text-[10px] text-white/50">{codigo}</p>
        ) : null}
        {precio != null ? (
          <p className="font-mono text-sm font-bold text-[#f5c451]">
            {formatoMoneda(precio)}
          </p>
        ) : (
          <p className="text-xs text-white/50">Sin precio en catálogo</p>
        )}
      </div>
    </button>
  );
}