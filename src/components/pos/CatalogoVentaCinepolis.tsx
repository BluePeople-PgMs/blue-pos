"use client";

import { ArticuloPresentacionVisual } from "@/components/ventas/ArticuloPresentacionVisual";
import type { ArticuloMenuVenta } from "@/lib/ventas/catalogoVentaVisual";
import { useEffect, useMemo } from "react";

type CatalogoVentaCinepolisProps = {
  articulos: ArticuloMenuVenta[];
  articuloId: string;
  onArticuloIdChange: (id: string) => void;
  cantidad: string;
  onCantidadChange: (value: string) => void;
  onAgregar: () => void;
  formatoMoneda: (monto: number) => string;
  procesando?: boolean;
  tituloCatalogo?: string;
  subtituloCatalogo?: string;
  etiquetaAgregar?: string;
};

export function CatalogoVentaCinepolis({
  articulos,
  articuloId,
  onArticuloIdChange,
  cantidad,
  onCantidadChange,
  onAgregar,
  formatoMoneda,
  procesando = false,
  tituloCatalogo = "Selecciona tu pedido",
  subtituloCatalogo = "Toca una tarjeta y confirma cantidad — listo para caja rápida.",
  etiquetaAgregar = "Agregar",
}: CatalogoVentaCinepolisProps) {
  const seleccionado = useMemo(
    () => articulos.find((a) => a.id === articuloId) ?? articulos[0],
    [articuloId, articulos],
  );

  useEffect(() => {
    if (!articuloId && articulos[0]) {
      onArticuloIdChange(articulos[0].id);
    }
  }, [articuloId, articulos, onArticuloIdChange]);

  if (articulos.length === 0) {
    return (
      <div className="cine-panel px-5 py-10 text-center text-sm text-muted">
        No hay artículos que coincidan con el filtro o sin stock. Revisa inventario y
        catálogo.
      </div>
    );
  }

  const qty = Number.parseFloat(cantidad.replace(",", "."));

  return (
    <div className="cine-catalogo-panel shadow-sm">
      <header className="cine-catalogo-header px-5 py-4">
        <h2 className="text-lg font-bold text-white">{tituloCatalogo}</h2>
        <p className="text-sm text-white/75">{subtituloCatalogo}</p>
      </header>

      <div
        className="cine-catalogo-grid"
        role="listbox"
        aria-label="Artículos en venta"
      >
        {articulos.map((item) => {
          const activo = item.id === (seleccionado?.id ?? "");
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={activo}
              disabled={procesando}
              onClick={() => onArticuloIdChange(item.id)}
              className={`cine-catalogo-card flex flex-col overflow-hidden text-left ${
                activo ? "cine-catalogo-card--activo" : ""
              }`}
            >
              <div className="relative aspect-[4/5] w-full bg-slate-100">
                <ArticuloPresentacionVisual
                  nombre={item.nombre}
                  esCombo={item.esCombo}
                  descuentoPct={item.descuentoPct}
                  compacto
                />
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {item.esCombo ? (
                    <span className="cine-pill cine-pill--gold">COMBO</span>
                  ) : (
                    <span className="cine-pill cine-pill--cta">ITEM</span>
                  )}
                  {item.descuentoPct > 0 ? (
                    <span className="cine-pill cine-pill--gold">−{item.descuentoPct}%</span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1 px-2.5 py-2.5">
                <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
                  {item.nombre}
                </p>
                <p className="font-mono text-base font-bold text-[#0055FF] tabular-nums">
                  {formatoMoneda(item.precioUnitario)}
                </p>
                <span
                  className={`cine-pill w-fit ${
                    item.stockDisponible > 0 ? "cine-pill--ok" : "cine-pill--busy"
                  }`}
                >
                  {item.stockDisponible > 0
                    ? `Disp. ${item.stockDisponible}`
                    : "Agotado"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {seleccionado ? (
        <footer className="flex flex-col gap-3 border-t border-line bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">
              {seleccionado.nombre}
            </p>
            <p className="text-sm text-muted">
              {formatoMoneda(seleccionado.precioUnitario)} · máx.{" "}
              {seleccionado.stockDisponible} en stock
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-h-11 items-center rounded-lg border border-line bg-background">
              <button
                type="button"
                disabled={procesando || qty <= 1}
                onClick={() =>
                  onCantidadChange(String(Math.max(1, (qty || 1) - 1)))
                }
                className="min-h-11 min-w-11 text-xl font-medium text-foreground disabled:opacity-40"
                aria-label="Menos cantidad"
              >
                −
              </button>
              <input
                type="number"
                min="0.001"
                step="any"
                aria-label="Cantidad"
                value={cantidad}
                disabled={procesando}
                onChange={(e) => onCantidadChange(e.target.value)}
                className="w-14 border-x border-line bg-transparent py-2 text-center font-mono text-sm outline-none"
              />
              <button
                type="button"
                disabled={procesando}
                onClick={() => onCantidadChange(String((qty || 1) + 1))}
                className="min-h-11 min-w-11 text-xl font-medium"
                aria-label="Más cantidad"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={procesando}
              onClick={onAgregar}
              className="cine-btn-primary min-h-11 px-6 text-sm"
            >
              {etiquetaAgregar}
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}