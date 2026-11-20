"use client";

import { ArticuloPresentacionVisual } from "@/components/ventas/ArticuloPresentacionVisual";
import { formatoMoneda } from "@/lib/comboDescuento";
import { etiquetaTipoProducto } from "@/lib/catalogo/productos";

type ComponenteTarjetaVisualProps = {
  nombre: string;
  codigo: string | null;
  tipo: string | null;
  precio: number | null;
  cantidad: number;
  editando: boolean;
  cantidadEdit: string;
  busy: boolean;
  onEditar: () => void;
  onGuardar: () => void;
  onCancelarEdit: () => void;
  onQuitar: () => void;
  onCantidadEditChange: (v: string) => void;
};

export function ComponenteTarjetaVisual({
  nombre,
  codigo,
  tipo,
  precio,
  cantidad,
  editando,
  cantidadEdit,
  busy,
  onEditar,
  onGuardar,
  onCancelarEdit,
  onQuitar,
  onCantidadEditChange,
}: ComponenteTarjetaVisualProps) {
  return (
    <li className="concesion-card flex w-[10.5rem] shrink-0 snap-center flex-col overflow-hidden rounded-xl">
      <div className="relative aspect-square w-full">
        <ArticuloPresentacionVisual nombre={nombre} esCombo={false} compacto />
      </div>
      <div className="concesion-card-pie flex flex-1 flex-col gap-2 px-3 py-3">
        <p className="line-clamp-2 text-xs font-semibold text-white">{nombre}</p>
        <p className="text-[10px] text-white/55">
          {tipo ? etiquetaTipoProducto(tipo) : null}
          {codigo ? ` · ${codigo}` : null}
        </p>
        {precio != null ? (
          <p className="font-mono text-xs text-[#f5c451]">{formatoMoneda(precio)}</p>
        ) : null}
        <p className="text-xs text-white/80">
          Cant:{" "}
          {editando ? (
            <input
              type="text"
              inputMode="decimal"
              value={cantidadEdit}
              onChange={(e) => onCantidadEditChange(e.target.value)}
              className="ml-1 w-14 rounded border border-white/20 bg-black/30 px-1 py-0.5 font-mono text-white"
              aria-label="Cantidad"
            />
          ) : (
            <span className="font-mono font-semibold">{cantidad}</span>
          )}
        </p>
        <div className="mt-auto flex flex-wrap gap-1">
          {editando ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onGuardar}
                className="concesion-btn-agregar rounded-full px-2 py-1 text-[10px] font-bold"
              >
                OK
              </button>
              <button
                type="button"
                onClick={onCancelarEdit}
                className="rounded-full border border-white/25 px-2 py-1 text-[10px] text-white"
              >
                No
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onEditar}
                className="rounded-full border border-white/25 px-2 py-1 text-[10px] text-white"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onQuitar}
                className="rounded-full border border-danger/50 px-2 py-1 text-[10px] text-danger"
              >
                Quitar
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}