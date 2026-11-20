"use client";

import {
  rutaPortadaArticulo,
  temaComboDesdeNombre,
  tituloPortadaLineas,
} from "@/lib/ventas/comboPresentacion";
import { useEffect, useState } from "react";

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
  compacto = false,
}: ArticuloPresentacionVisualProps) {
  const [usaSvgEstatico, setUsaSvgEstatico] = useState(true);
  const ruta = rutaPortadaArticulo(nombre, esCombo);
  const tema = temaComboDesdeNombre(nombre);
  const lineas = tituloPortadaLineas(nombre);

  useEffect(() => {
    let activo = true;
    void fetch(ruta, { method: "HEAD" }).then((res) => {
      if (activo) {
        setUsaSvgEstatico(res.ok);
      }
    });
    return () => {
      activo = false;
    };
  }, [ruta]);

  if (usaSvgEstatico) {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ruta}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setUsaSvgEstatico(false)}
        />
        {descuentoPct > 0 ? (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            −{descuentoPct}%
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-end overflow-hidden ${compacto ? "px-3 py-3" : "px-4 py-4"} ${className}`}
      style={{
        background: `linear-gradient(145deg, ${tema.fondoDesde} 0%, ${tema.fondoHasta} 100%)`,
      }}
    >
      {descuentoPct > 0 ? (
        <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow">
          −{descuentoPct}%
        </span>
      ) : null}
      {lineas.map((linea) => (
        <p
          key={linea}
          className={`relative z-10 text-center font-bold leading-tight text-white drop-shadow ${
            compacto ? "text-sm" : "text-lg"
          }`}
        >
          {linea}
        </p>
      ))}
    </div>
  );
}