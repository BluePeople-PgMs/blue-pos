"use client";

import { useEffect, useState } from "react";
import { listarCancelaciones, type CancelacionLista } from "@/lib/cancelaciones";

function fechaLegible(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function CancelacionesVista() {
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cancelaciones, setCancelaciones] = useState<CancelacionLista[]>([]);

  useEffect(() => {
    let activo = true;
    listarCancelaciones().then((datos) => {
      if (!activo) return;
      setAviso(datos.error);
      setCancelaciones(datos.cancelaciones);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Cargando cancelaciones…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {aviso ? (
        <p
          role="status"
          className="rounded-2xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-warn"
        >
          {aviso}
        </p>
      ) : null}
      <p className="text-sm text-muted">
        Historial de ventas cobradas canceladas. La operación sigue en Ventas.
      </p>
      {cancelaciones.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted">
          Todavía no hay cancelaciones.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cancelaciones.map((fila) => (
            <li
              key={fila.id}
              className="flex flex-col gap-1 rounded-2xl border border-line bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">
                Folio {fila.folio ?? fila.id.slice(0, 8)}
                <span className="font-normal text-muted">
                  {" "}
                  · {fechaLegible(fila.cuando)}
                </span>
              </span>
              <span className="text-muted">
                {fila.motivo?.trim() ? fila.motivo : "Sin motivo capturado"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}