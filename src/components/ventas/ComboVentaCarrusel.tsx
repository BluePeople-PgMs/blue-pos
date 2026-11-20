"use client";

import { ComboPresentacionVisual } from "@/components/ventas/ComboPresentacionVisual";
import { rutaImagenDescuento } from "@/lib/ventas/comboPresentacion";
import type { ComboParaVenta } from "@/lib/ventas/combosEnVenta";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type ComboVentaCarruselProps = {
  combos: ComboParaVenta[];
  comboId: string;
  onComboIdChange: (id: string) => void;
  formatoMoneda: (monto: number) => string;
  disabled?: boolean;
};

const INTERVAL_MS = 7000;

export function ComboVentaCarrusel({
  combos,
  comboId,
  onComboIdChange,
  formatoMoneda,
  disabled = false,
}: ComboVentaCarruselProps) {
  const indicePorId = useMemo(
    () => new Map(combos.map((c, i) => [c.id, i])),
    [combos],
  );
  const indice = indicePorId.get(comboId) ?? 0;
  const [pausado, setPausado] = useState(false);

  const ir = useCallback(
    (next: number) => {
      const normalizado = (next + combos.length) % combos.length;
      const combo = combos[normalizado];
      if (combo) {
        onComboIdChange(combo.id);
      }
    },
    [combos, onComboIdChange],
  );

  useEffect(() => {
    if (pausado || disabled || combos.length <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      const actualIdx = indicePorId.get(comboId) ?? 0;
      const siguiente = (actualIdx + 1) % combos.length;
      const combo = combos[siguiente];
      if (combo) {
        onComboIdChange(combo.id);
      }
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [comboId, combos, disabled, indicePorId, onComboIdChange, pausado]);

  if (combos.length === 0) {
    return null;
  }

  const actual = combos[indice] ?? combos[0]!;
  const imgDescuento = rutaImagenDescuento(actual.descuentoPct);

  return (
    <section
      className="flex flex-col gap-3"
      aria-roledescription="carrusel"
      aria-label="Presentación de combos para venta"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
        <div className="relative aspect-[16/10] w-full bg-background">
          {combos.map((combo, i) => (
            <div
              key={combo.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === indice ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={i !== indice}
            >
              <ComboPresentacionVisual
                nombre={combo.nombre}
                descuentoPct={combo.descuentoPct}
                codigo={combo.codigo}
                className="min-h-full"
              />
            </div>
          ))}
          {imgDescuento ? (
            <div className="pointer-events-none absolute bottom-3 left-3 h-16 w-16 opacity-95 sm:h-20 sm:w-20">
              <Image
                src={imgDescuento}
                alt=""
                fill
                className="object-contain drop-shadow-md"
                sizes="80px"
              />
            </div>
          ) : null}
        </div>
        <div className="border-t border-line bg-card px-5 py-4">
          <p className="text-lg font-semibold text-foreground">{actual.nombre}</p>
          <p className="mt-1 text-sm text-muted">
            {actual.numProductos} producto{actual.numProductos === 1 ? "" : "s"} ·
            descuento{" "}
            <span className="font-semibold text-accent">−{actual.descuentoPct}%</span>
            {actual.precioUnitario != null ? (
              <>
                {" · "}
                <span className="font-mono font-medium text-foreground">
                  {formatoMoneda(actual.precioUnitario)}
                </span>
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted">
            Hasta{" "}
            <strong className="text-foreground">{actual.combosDisponibles}</strong>{" "}
            unidad(es) con inventario actual
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={disabled || combos.length <= 1}
          onClick={() => ir(indice - 1)}
          className="rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
          aria-label="Combo anterior"
        >
          Anterior
        </button>
        <div
          className="flex flex-wrap justify-center gap-2"
          role="tablist"
          aria-label="Combos"
        >
          {combos.map((combo, i) => (
            <button
              key={combo.id}
              type="button"
              role="tab"
              aria-selected={i === indice}
              aria-label={combo.nombre}
              disabled={disabled}
              onClick={() => ir(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors disabled:opacity-50 ${
                i === indice ? "bg-accent" : "bg-line hover:bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={disabled || combos.length <= 1}
          onClick={() => ir(indice + 1)}
          className="rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-background disabled:opacity-50"
          aria-label="Combo siguiente"
        >
          Siguiente
        </button>
      </div>

      <p className="text-center text-xs text-muted">
        El combo mostrado es el que se agregará al carrito. Navega el carrusel para
        elegir otro.
      </p>
    </section>
  );
}