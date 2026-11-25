"use client";

import { useState } from "react";

export type VentaCobradaResumen = {
  id: string;
  folio: string | null;
  total: number;
  created_at: string;
  etiquetaFecha: string;
};

type VentasRecientesPanelProps = {
  ventas: VentaCobradaResumen[];
  cargando: boolean;
  procesando: boolean;
  onCancelar: (venta: VentaCobradaResumen) => void;
  formatoMoneda: (monto: number) => string;
};

export function VentasRecientesPanel({
  ventas,
  cargando,
  procesando,
  onCancelar,
  formatoMoneda,
}: VentasRecientesPanelProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <section className="cine-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left font-semibold text-foreground"
        aria-expanded={abierto}
      >
        Ventas cobradas recientes
        <span className="text-sm text-muted">{abierto ? "▲" : "▼"}</span>
      </button>
      {abierto ? (
        <div className="border-t border-line px-4 py-3">
          <p className="text-xs text-muted">
            Cancelación con movimiento <code className="font-mono">cancelacion</code> y
            devolución de stock.
          </p>
          {ventas.length === 0 && !cargando ? (
            <p className="mt-3 text-sm text-muted">No hay ventas cobradas.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {ventas.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-col gap-2 rounded-lg border border-line bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">
                      {v.folio ?? v.id.slice(0, 8)}{" "}
                      <span className="font-normal text-muted">· {v.etiquetaFecha}</span>
                    </p>
                    <p className="font-mono font-bold text-[#0055FF]">
                      {formatoMoneda(v.total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCancelar(v)}
                    disabled={procesando}
                    className="min-h-11 rounded-lg border border-danger/35 px-3 text-sm font-semibold text-danger disabled:opacity-55"
                  >
                    Cancelar venta
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}