"use client";

import { PICKUP_TIENDA } from "@/lib/delivery/config";
import {
  CENTRO_MAPA_ENTREGA,
  formatoCoordenadas,
  latLngAPorcentaje,
  puntoDesdeClickEnMapa,
  porcentajeTiendaPickup,
  type PuntoEntrega,
} from "@/lib/delivery/mapaEntrega";
import { useCallback, useRef, useState } from "react";

const PRESETS: { id: string; label: string; punto: PuntoEntrega }[] = [
  {
    id: "uaa",
    label: "UAA Centro Univ.",
    punto: { lat: 21.8815, lng: -102.2938 },
  },
  {
    id: "jardines",
    label: "Fracc. Jardines",
    punto: { lat: 21.887, lng: -102.278 },
  },
  {
    id: "villas",
    label: "Villas del Sol",
    punto: { lat: 21.869, lng: -102.301 },
  },
];

export function SelectorPuntoMapa({
  value,
  onChange,
}: {
  value: PuntoEntrega | null;
  onChange: (p: PuntoEntrega) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const pin = value ?? CENTRO_MAPA_ENTREGA;
  const pos = latLngAPorcentaje(pin);
  const tienda = porcentajeTiendaPickup();
  const confirmado = value != null;

  const colocarEnMapa = useCallback(
    (clientX: number, clientY: number) => {
      const el = mapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      onChange(puntoDesdeClickEnMapa(rect, clientX, clientY));
    },
    [onChange],
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    setArrastrando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    colocarEnMapa(e.clientX, e.clientY);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastrando) return;
    colocarEnMapa(e.clientX, e.clientY);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setArrastrando(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ya liberado */
    }
  }

  return (
    <div className="delivery-mapa-picker">
      <p className="text-sm font-medium">Punto en el mapa</p>
      <p className="mt-0.5 text-xs text-muted">
        Toca o arrastra en el mapa. El repartidor usa estas coordenadas en Maps y
        Waze.
      </p>

      <div
        ref={mapRef}
        className="delivery-mapa-picker__canvas repartidor-mapa-wrap delivery-mapa-picker__canvas--hit"
        role="application"
        aria-label="Mapa de entrega. Toca para marcar el punto."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div className="repartidor-mapa delivery-mapa-picker__tiles" aria-hidden>
          <span className="delivery-mapa-picker__grid" />
        </div>
        <span
          className="repartidor-mapa__origen delivery-mapa-picker__etiqueta-tienda"
          style={{ left: `${tienda.left}%`, top: `${tienda.top}%` }}
        >
          {PICKUP_TIENDA.nombre}
        </span>
        <span
          className="repartidor-mapa__pin"
          style={{ left: `${tienda.left}%`, top: `${tienda.top}%` }}
          title="Tienda"
        >
          W
        </span>
        <span
          className="repartidor-mapa__pin repartidor-mapa__pin--activo delivery-mapa-picker__pin-cliente"
          style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          title="Tu entrega"
        >
          ★
        </span>
      </div>

      <p className="mt-2 font-mono text-xs text-muted">
        {formatoCoordenadas(pin)}
        {!confirmado ? (
          <span className="text-warn"> · Toca el mapa para confirmar el punto</span>
        ) : null}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((pr) => (
          <button
            key={pr.id}
            type="button"
            className="rounded-full border border-line bg-card px-2.5 py-1 text-xs font-medium"
            onClick={() => onChange(pr.punto)}
          >
            {pr.label}
          </button>
        ))}
      </div>
    </div>
  );
}