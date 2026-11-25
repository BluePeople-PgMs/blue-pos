"use client";

import { urlPortadaVentaApi } from "@/lib/ventas/portadaIlustracion";

type ArticuloPresentacionVisualProps = {
  nombre: string;
  esCombo: boolean;
  descuentoPct?: number;
  className?: string;
  compacto?: boolean;
};

/** Portada generada por nombre (combo o ingrediente — mismo estilo visual). */
export function ArticuloPresentacionVisual({
  nombre,
  esCombo,
  descuentoPct = 0,
  className = "",
  compacto: _compacto = false,
}: ArticuloPresentacionVisualProps) {
  const src = urlPortadaVentaApi(nombre, esCombo, descuentoPct);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-slate-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={nombre}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      {esCombo ? (
        <span className="cine-pill cine-pill--gold absolute top-2 right-2">COMBO</span>
      ) : null}
      {descuentoPct > 0 ? (
        <span className="cine-pill cine-pill--gold absolute top-2 left-2">
          −{descuentoPct}%
        </span>
      ) : null}
    </div>
  );
}