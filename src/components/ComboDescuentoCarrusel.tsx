"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const slides = [
  {
    src: "/combos/selecciona-tu-combo.png",
    titulo: "Selecciona tu combo",
    subtitulo: "Elige un platillo y arma los componentes en el editor",
    alt: "Selecciona tu combo",
    contain: true,
  },
  {
    src: "/combos/descuento-10.png",
    titulo: "2 productos",
    subtitulo: "10% de descuento",
    alt: "Promoción: 10% off en combo de 2 productos",
    contain: true,
  },
  {
    src: "/combos/descuento-20.png",
    titulo: "3–4 productos",
    subtitulo: "20% de descuento",
    alt: "Promoción: 20% off en combo de 3 a 4 productos",
    contain: true,
  },
  {
    src: "/combos/descuento-30.png",
    titulo: "5 o más productos",
    subtitulo: "30% de descuento",
    alt: "Promoción: 30% off en combo de 5 o más productos",
    contain: true,
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
                alt={slide.alt}
                fill
                className={
                  slide.contain
                    ? "object-contain p-4"
                    : "object-cover"
                }
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