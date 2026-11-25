"use client";

import type { FormEvent } from "react";

export type LineaTicket = {
  id: string;
  producto_id: string | null;
  cantidad: number;
  precio_unitario: number;
  notas: string | null;
  etiqueta: string;
};

type TicketResumenVivoProps = {
  folio: string | null;
  ventaId: string;
  lineas: LineaTicket[];
  total: number;
  metodoPago: string;
  onMetodoPagoChange: (value: string) => void;
  onCobrar: (event: FormEvent) => void;
  onDecrementarLinea: (linea: LineaTicket) => void;
  onAgregarUnidad: (linea: LineaTicket) => void;
  procesando: boolean;
  formatoMoneda: (monto: number) => string;
  ventaAbierta: boolean;
};

export function TicketResumenVivo({
  folio,
  ventaId,
  lineas,
  total,
  metodoPago,
  onMetodoPagoChange,
  onCobrar,
  onDecrementarLinea,
  onAgregarUnidad,
  procesando,
  formatoMoneda,
  ventaAbierta,
}: TicketResumenVivoProps) {
  if (!ventaAbierta) {
    return (
      <div className="cine-panel flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-muted uppercase">
          Resumen
        </p>
        <p className="mt-2 text-base font-semibold text-foreground">Sin orden activa</p>
        <p className="mt-1 text-sm text-muted">
          Abre caja arriba para armar el pedido y cobrar.
        </p>
      </div>
    );
  }

  return (
    <div className="cine-panel cine-ticket-sticky flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden">
      <header className="border-b border-line px-4 py-3">
        <p className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
          Tu pedido
        </p>
        <h2 className="text-lg font-bold text-foreground">
          {folio ?? ventaId.slice(0, 8)}
        </h2>
        <p className="text-xs text-muted">Reserva activa · listo para cobrar</p>
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {lineas.length === 0 ? (
          <li className="px-2 py-6 text-center text-sm text-muted">
            El carrito está vacío. Agrega desde el catálogo.
          </li>
        ) : (
          lineas.map((linea) => {
            const importe = linea.cantidad * linea.precio_unitario;
            return (
              <li
                key={linea.id}
                className="flex gap-2 border-b border-line/80 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {linea.etiqueta}
                  </p>
                  {linea.notas ? (
                    <p className="mt-0.5 text-xs text-muted">{linea.notas}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-sm font-bold text-[#0055FF] tabular-nums">
                    {formatoMoneda(importe)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="flex min-h-9 items-center rounded-lg border border-line bg-background">
                    <button
                      type="button"
                      disabled={procesando}
                      onClick={() => onDecrementarLinea(linea)}
                      className="min-h-9 min-w-9 text-sm font-medium disabled:opacity-50"
                      aria-label="Quitar unidad"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center font-mono text-sm font-semibold tabular-nums">
                      {linea.cantidad}
                    </span>
                    <button
                      type="button"
                      disabled={procesando}
                      onClick={() => onAgregarUnidad(linea)}
                      className="min-h-9 min-w-9 text-sm font-medium disabled:opacity-50"
                      aria-label="Agregar unidad"
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <footer className="mt-auto border-t border-line bg-[#F8FAFC] px-4 py-4">
        <TotalesResumen lineas={lineas.length} total={total} formatoMoneda={formatoMoneda} />
        <form onSubmit={onCobrar} className="mt-3 flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Método de pago
            <select
              value={metodoPago}
              onChange={(e) => onMetodoPagoChange(e.target.value)}
              disabled={procesando || lineas.length === 0}
              className="min-h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={procesando || lineas.length === 0}
            className="cine-btn-primary min-h-12 w-full text-base"
          >
            {procesando ? "Procesando…" : "Pagar"}
          </button>
        </form>
      </footer>
    </div>
  );
}

function TotalesResumen({
  lineas,
  total,
  formatoMoneda,
}: {
  lineas: number;
  total: number;
  formatoMoneda: (monto: number) => string;
}) {
  return (
    <div className="flex items-end justify-between gap-2">
      <p className="text-sm text-muted">
        {lineas} {lineas === 1 ? "artículo" : "artículos"}
      </p>
      <p className="text-right">
        <span className="block text-xs text-muted">Total</span>
        <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
          {formatoMoneda(total)}
        </span>
      </p>
    </div>
  );
}