"use client";

import { useEffect, useState } from "react";
import { listarPagos, type PagoLista } from "@/lib/pagos";

function dinero(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

function etiquetaMetodo(metodo: string) {
  if (metodo === "efectivo") return "Efectivo";
  if (metodo === "tarjeta") return "Tarjeta";
  if (metodo === "transferencia") return "Transferencia";
  return metodo;
}

function fechaLegible(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function PagosVista() {
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pagos, setPagos] = useState<PagoLista[]>([]);

  useEffect(() => {
    let activo = true;
    listarPagos().then((datos) => {
      if (!activo) return;
      setAviso(datos.error);
      setPagos(datos.pagos);
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
        Cargando pagos…
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
        Consulta de cobros registrados. El cobro operativo sigue en Ventas.
      </p>
      {pagos.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted">
          Todavía no hay pagos.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pagos.map((pago) => (
            <li
              key={pago.id}
              className="flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm"
            >
              <span>
                <span className="font-medium">
                  {pago.folio ?? pago.id.slice(0, 8)}
                </span>
                <span className="text-muted">
                  {" "}
                  · {etiquetaMetodo(pago.metodo)} · {fechaLegible(pago.cuando)}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{dinero(pago.monto)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}