"use client";

import { ArticuloPresentacionVisual } from "@/components/ventas/ArticuloPresentacionVisual";
import type { ArticuloMenuVenta } from "@/lib/ventas/catalogoVentaVisual";
import { useMemo, useRef, useEffect } from "react";

type MenuConcesionVentaProps = {
  articulos: ArticuloMenuVenta[];
  articuloId: string;
  onArticuloIdChange: (id: string) => void;
  cantidad: string;
  onCantidadChange: (value: string) => void;
  onAgregar: () => void;
  formatoMoneda: (monto: number) => string;
  procesando?: boolean;
};

/**
 * Menú visual tipo concesión: mismo carril de imágenes para
 * ingredientes sueltos y platillos (combos), sin modos separados.
 */
export function MenuConcesionVenta({
  articulos,
  articuloId,
  onArticuloIdChange,
  cantidad,
  onCantidadChange,
  onAgregar,
  formatoMoneda,
  procesando = false,
}: MenuConcesionVentaProps) {
  const seleccionado = useMemo(
    () => articulos.find((a) => a.id === articuloId) ?? articulos[0],
    [articuloId, articulos],
  );
  const carrilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!articuloId && articulos[0]) {
      onArticuloIdChange(articulos[0].id);
    }
  }, [articuloId, articulos, onArticuloIdChange]);

  useEffect(() => {
    const el = carrilRef.current?.querySelector<HTMLElement>(
      `[data-articulo-id="${articuloId}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [articuloId]);

  if (articulos.length === 0) {
    return (
      <p className="concesion-panel rounded-2xl px-5 py-8 text-center text-sm text-white/80">
        No hay artículos con stock y precio. Revisa inventario y catálogo.
      </p>
    );
  }

  const qty = Number.parseFloat(cantidad.replace(",", "."));

  return (
    <div className="concesion-panel overflow-hidden rounded-2xl shadow-xl">
      <header className="concesion-header px-5 py-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
          Menú del super
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
          ¿Qué agregamos a tu pedido?
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Ingredientes y platillos listos — elige con las fotos, igual que en el
          mostrador.
        </p>
      </header>

      <div
        ref={carrilRef}
        className="concesion-scroll flex gap-4 overflow-x-auto px-5 py-5"
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
              data-articulo-id={item.id}
              disabled={procesando}
              onClick={() => onArticuloIdChange(item.id)}
              className={`concesion-card flex w-[11.5rem] shrink-0 snap-center flex-col overflow-hidden rounded-xl text-left transition ${
                activo
                  ? "concesion-card--activo ring-2 ring-[#f5c451] ring-offset-2 ring-offset-[#121820]"
                  : "opacity-90 hover:opacity-100"
              }`}
            >
              <div className="relative aspect-[4/5] w-full bg-black/40">
                <ArticuloPresentacionVisual
                  nombre={item.nombre}
                  esCombo={item.esCombo}
                  descuentoPct={item.descuentoPct}
                  compacto
                />
              </div>
              <div className="concesion-card-pie flex flex-1 flex-col gap-1 px-3 py-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                  {item.nombre}
                </p>
                <p className="font-mono text-base font-bold text-[#f5c451]">
                  {formatoMoneda(item.precioUnitario)}
                </p>
                <p className="text-[11px] text-white/55">
                  Disponible: {item.stockDisponible}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {seleccionado ? (
        <footer className="flex flex-col gap-4 border-t border-white/10 bg-black/25 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-white">
              {seleccionado.nombre}
            </p>
            <p className="text-sm text-white/70">
              {formatoMoneda(seleccionado.precioUnitario)} · en carrito quedan{" "}
              {seleccionado.stockDisponible} unidad(es) posibles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-white/20 bg-black/30">
              <button
                type="button"
                disabled={procesando || qty <= 1}
                onClick={() =>
                  onCantidadChange(String(Math.max(1, (qty || 1) - 1)))
                }
                className="px-4 py-2 text-lg text-white disabled:opacity-40"
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
                className="w-14 border-x border-white/20 bg-transparent py-2 text-center font-mono text-sm text-white outline-none"
              />
              <button
                type="button"
                disabled={procesando}
                onClick={() => onCantidadChange(String((qty || 1) + 1))}
                className="px-4 py-2 text-lg text-white"
                aria-label="Más cantidad"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={procesando}
              onClick={onAgregar}
              className="concesion-btn-agregar rounded-full px-6 py-3 text-sm font-bold tracking-wide text-[#1a1510] uppercase"
            >
              Agregar al pedido
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}