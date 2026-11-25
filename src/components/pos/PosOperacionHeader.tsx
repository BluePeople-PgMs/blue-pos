"use client";

import type { FiltroCatalogoTab } from "@/lib/ventas/filtrosMenuCliente";

type Caja = { id: string; nombre: string };

type VentaResumen = {
  id: string;
  folio: string | null;
  total: number;
} | null;

type PosOperacionHeaderProps = {
  cajas: Caja[];
  cajaId: string;
  onCajaChange: (id: string) => void;
  venta: VentaResumen;
  procesando: boolean;
  emailUsuario: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  tab: FiltroCatalogoTab;
  onTabChange: (tab: FiltroCatalogoTab) => void;
  onIniciarVenta: () => void;
  formatoMoneda: (monto: number) => string;
  cargando?: boolean;
};

const TABS: { id: FiltroCatalogoTab; label: string }[] = [
  { id: "todos", label: "Todo" },
  { id: "productos", label: "Productos" },
  { id: "combos", label: "Combos" },
  { id: "promo", label: "Promo" },
];

export function PosOperacionHeader({
  cajas,
  cajaId,
  onCajaChange,
  venta,
  procesando,
  emailUsuario,
  query,
  onQueryChange,
  tab,
  onTabChange,
  onIniciarVenta,
  formatoMoneda,
  cargando = false,
}: PosOperacionHeaderProps) {
  return (
    <header className="cine-pos-header rounded-xl px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase">
            Punto de venta
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Menú concesión
          </h1>
          <p className="mt-0.5 truncate text-sm text-white/75">
            {emailUsuario ?? "Operador"}
            <span className="mx-2 text-white/40">·</span>
            {venta ? (
              <span>
                Orden activa{" "}
                <span className="font-semibold text-[#FFC72C]">
                  {venta.folio ?? venta.id.slice(0, 8)}
                </span>{" "}
                · {formatoMoneda(venta.total)}
              </span>
            ) : (
              <span className="text-white/60">Sin venta abierta</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="pos-caja">
            Caja
          </label>
          <select
            id="pos-caja"
            value={cajaId}
            onChange={(e) => onCajaChange(e.target.value)}
            disabled={procesando || Boolean(venta) || cargando}
            className="min-h-11 max-w-[12rem] rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white outline-none focus:border-[#FFC72C]"
          >
            {cajas.map((c) => (
              <option key={c.id} value={c.id} className="text-foreground">
                {c.nombre}
              </option>
            ))}
          </select>
          {!venta ? (
            <button
              type="button"
              onClick={onIniciarVenta}
              disabled={procesando || !cajaId || cargando || cajas.length === 0}
              className="cine-btn-gold min-h-11 px-5 text-sm disabled:opacity-55"
            >
              {procesando ? "Abriendo…" : "Abrir caja"}
            </button>
          ) : (
            <span className="cine-pill cine-pill--gold min-h-9 items-center px-3 text-xs">
              Caja abierta
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label className="sr-only" htmlFor="pos-buscar">
            Buscar artículo
          </label>
          <input
            id="pos-buscar"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar producto o combo…"
            className="min-h-11 w-full rounded-lg border border-white/15 bg-white/95 px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#0055FF]"
          />
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filtros de catálogo"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTabChange(t.id)}
              className={`cine-chip !min-h-10 border-white/20 !py-2 text-white ${
                tab === t.id
                  ? "!border-[#FFC72C] !bg-[#FFC72C] !text-[#0A1931]"
                  : "bg-white/10 hover:!border-white/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}