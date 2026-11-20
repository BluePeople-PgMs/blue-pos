"use client";

import {
  rutaPortadaCombo,
  temaComboDesdeNombre,
  tituloPortadaLineas,
} from "@/lib/ventas/comboPresentacion";
import { useEffect, useState } from "react";

type ComboPresentacionVisualProps = {
  nombre: string;
  descuentoPct: number;
  codigo?: string | null;
  className?: string;
};

export function ComboPresentacionVisual({
  nombre,
  descuentoPct,
  codigo,
  className = "",
}: ComboPresentacionVisualProps) {
  const [usaSvgEstatico, setUsaSvgEstatico] = useState(true);
  const ruta = rutaPortadaCombo(nombre);
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
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-end overflow-hidden px-6 py-5 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${tema.fondoDesde} 0%, ${tema.fondoHasta} 100%)`,
      }}
    >
      <MotivoDecorativo motivo={tema.motivo} acento={tema.acento} />
      {descuentoPct > 0 ? (
        <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-sm font-bold text-white shadow">
          −{descuentoPct}%
        </span>
      ) : null}
      <div className="relative z-10">
        {lineas.map((linea) => (
          <p
            key={linea}
            className="text-center text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-sm"
          >
            {linea}
          </p>
        ))}
        {codigo ? (
          <p className="mt-2 text-center text-xs font-medium tracking-widest text-white/70 uppercase">
            {codigo}
          </p>
        ) : null}
        <p className="mt-3 text-center text-[11px] tracking-[0.14em] text-white/60 uppercase">
          Blue POS · Combo
        </p>
      </div>
    </div>
  );
}

function MotivoDecorativo({
  motivo,
  acento,
}: {
  motivo: ReturnType<typeof temaComboDesdeNombre>["motivo"];
  acento: string;
}) {
  const base =
    "pointer-events-none absolute opacity-40";

  if (motivo === "pasta") {
    return (
      <div
        className={`${base} bottom-8 left-6 h-16 w-24 rounded-full`}
        style={{ backgroundColor: acento }}
      />
    );
  }
  if (motivo === "cafe") {
    return (
      <div
        className={`${base} bottom-10 left-8 h-14 w-12 rounded-lg`}
        style={{ backgroundColor: acento }}
      />
    );
  }
  if (motivo === "ensalada") {
    return (
      <div
        className={`${base} bottom-6 left-4 h-20 w-20 rounded-full border-4 border-white/30`}
      />
    );
  }
  return (
    <div
      className={`${base} bottom-12 left-10 h-12 w-12 rounded-full`}
      style={{ backgroundColor: acento }}
    />
  );
}