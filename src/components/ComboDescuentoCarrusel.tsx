"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const slides = [
  {
    src: "/combos/carrusel-resumen.svg",
    titulo: "Guía de descuentos",
    subtitulo: "Productos en el combo × porcentaje de ahorro",
  },
  {
    src: "/combos/carrusel-1-producto.svg",
    titulo: "1 producto",
    subtitulo: "0% — agrega al menos 2 productos para 10%",
  },
  {
    src: "/combos/carrusel-2-productos.svg",
    titulo: "2 productos",
    subtitulo: "10% de descuento",
  },
  {
    src: "/combos/carrusel-3-4-productos.svg",
    titulo: "3–4 productos",
    subtitulo: "20% de descuento",
  },
  {
    src: "/combos/carrusel-5-productos.svg",
    titulo: "5 o más productos",
    subtitulo: "30% de descuento",
  },
] as const;

const INTERVAL_MS = 6000;

export function ComboDescuentoCarrusel() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  const ir = useCallback((next: number) => {
    setIndice((next + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (pausado) return;
    const id = window.setInterval(() => {
      setIndice((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [pausado]);

  const actual = slides[indice];

  return (
    <section
      className="flex flex-col gap-4"
      aria-roledescription="carrusel"
      aria-label="Descuentos por cantidad de productos en el combo"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
        <div className="relative aspect-[2/1] w-full bg-background">
          {slides.map((slide, i) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === indice ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={i !== indice}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                className="object-cover"
                priority={i === 0}
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          ))}
        </div>
        <div className="border-t border-line bg-card px-5 py-4">
          <p className="text-lg font-semibold text-foreground">{actual.titulo}</p>
          <p className="text-sm text-muted">{actual.subtitulo}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => ir(indice - 1)}
          className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
          aria-label="Diapositiva anterior"
        >
          Anterior
        </button>
        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Diapositivas">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === indice}
              aria-label={slide.titulo}
              onClick={() => setIndice(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === indice ? "bg-accent" : "bg-line hover:bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => ir(indice + 1)}
          className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
          aria-label="Diapositiva siguiente"
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}