"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ETIQUETAS_METODO,
  leerVentaParaPago,
  listarPagos,
  listarVentasPendientesDePago,
  registrarPago,
  type PagoLista,
} from "@/lib/pagos";
import { FormularioTarjeta } from "@/components/pagos/FormularioTarjeta";
import {
  esMetodoPago,
  type MetodoPago,
  type VentaDetalle,
  type VentaLista,
} from "@/lib/ventas";

function dinero(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

function etiquetaMetodo(metodo: string) {
  return ETIQUETAS_METODO[metodo as MetodoPago] ?? metodo;
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
  const [puedeOperar, setPuedeOperar] = useState(false);
  const [pagos, setPagos] = useState<PagoLista[]>([]);
  const [ventas, setVentas] = useState<VentaLista[]>([]);
  const [ventaId, setVentaId] = useState("");
  const [venta, setVenta] = useState<VentaDetalle | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    const [historial, pendientes] = await Promise.all([
      listarPagos(),
      listarVentasPendientesDePago(),
    ]);
    const error = historial.error ?? pendientes.error;
    setAviso(error);
    setPuedeOperar(!error);
    setPagos(historial.pagos);
    setVentas(pendientes.ventas);
    setCargando(false);
  }, []);

  useEffect(() => {
    let activo = true;
    void (async () => {
      const [historial, pendientes] = await Promise.all([
        listarPagos(),
        listarVentasPendientesDePago(),
      ]);
      if (!activo) return;
      const error = historial.error ?? pendientes.error;
      setAviso(error);
      setPuedeOperar(!error);
      setPagos(historial.pagos);
      setVentas(pendientes.ventas);
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  async function onSeleccionarVenta(id: string) {
    setVentaId(id);
    setMensaje(null);
    if (!id) {
      setVenta(null);
      return;
    }
    const { error, venta: detalle } = await leerVentaParaPago(id);
    if (error) {
      setMensaje(error);
      setVenta(null);
      return;
    }
    setVenta(detalle);
  }

  async function pagar() {
    if (!ventaId || !venta) {
      setMensaje("Elige una venta pendiente.");
      return;
    }
    if (metodo === "tarjeta") {
      setMensaje("Usa el formulario de tarjeta para cobrar.");
      return;
    }
    setEnviando(true);
    setMensaje(null);
    const { error } = await registrarPago({ ventaId, metodo });
    setEnviando(false);
    if (error) {
      setMensaje(error);
      return;
    }
    setMensaje("Pago registrado. La venta quedó cobrada.");
    setVentaId("");
    setVenta(null);
    await recargar();
  }

  if (cargando) {
    return (
      <p className="text-sm text-muted" role="status">
        Cargando pagos…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {aviso ? (
        <p
          role="status"
          className="rounded-2xl border border-warn/30 bg-warn-soft px-5 py-4 text-sm text-warn"
        >
          {aviso}
        </p>
      ) : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-lg font-semibold">Cobrar venta abierta</h2>
        <p className="text-sm text-muted">
          Elige folio, tipo de pago (efectivo, tarjeta o transferencia) y
          confirma. La venta pasa a cobrada y deja de aparecer aquí.
        </p>
        {ventas.length === 0 ? (
          <p className="text-sm text-muted">
            No hay ventas abiertas con líneas. Crea una en Ventas.
          </p>
        ) : (
          <div className="flex max-w-lg flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Venta
              <select
                value={ventaId}
                onChange={(e) => void onSeleccionarVenta(e.target.value)}
                className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
              >
                <option value="">Selecciona folio</option>
                {ventas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.folio ?? v.id.slice(0, 8)} · {dinero(v.total)}
                  </option>
                ))}
              </select>
            </label>

            {venta ? (
              <ul className="flex flex-col gap-1 text-sm text-muted">
                {venta.lineasDetalle.map((l) => (
                  <li key={l.id}>
                    {l.cantidad} × {l.producto} — {dinero(l.subtotal)}
                  </li>
                ))}
                <li className="pt-1 font-semibold text-foreground">
                  Total {dinero(venta.total)}
                </li>
              </ul>
            ) : null}

            <label className="flex flex-col gap-1 text-sm font-medium">
              Tipo de pago
              <select
                value={metodo}
                onChange={(e) => {
                  const v = e.target.value;
                  if (esMetodoPago(v)) setMetodo(v);
                }}
                className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal"
              >
                {(Object.keys(ETIQUETAS_METODO) as MetodoPago[]).map((m) => (
                  <option key={m} value={m}>
                    {ETIQUETAS_METODO[m]}
                  </option>
                ))}
              </select>
            </label>

            {metodo === "tarjeta" && venta ? (
              <FormularioTarjeta
                key={venta.id}
                ventaId={venta.id}
                disabled={!puedeOperar || enviando}
                onCobrado={(aviso) => {
                  setMensaje(aviso);
                  setVentaId("");
                  setVenta(null);
                  void recargar();
                }}
              />
            ) : null}

            {mensaje ? (
              <p
                role="status"
                className={`rounded-xl border px-4 py-3 text-sm ${
                  mensaje.includes("registrado")
                    ? "border-accent/30 bg-accent-soft text-accent"
                    : "border-danger/30 bg-danger-soft text-danger"
                }`}
              >
                {mensaje}
              </p>
            ) : null}

            {metodo === "tarjeta" ? null : (
              <button
                type="button"
                disabled={!puedeOperar || enviando || !venta}
                onClick={() => void pagar()}
                className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {enviando ? "Procesando…" : "Registrar pago"}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-lg font-semibold">Historial de cobros</h2>
        {pagos.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay pagos registrados.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pagos.map((pago) => (
              <li
                key={pago.id}
                className="flex items-baseline justify-between gap-3 rounded-xl border border-line bg-background px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">
                    {pago.folio ?? pago.id.slice(0, 8)}
                  </span>
                  <span className="text-muted">
                    {" "}
                    · {etiquetaMetodo(pago.metodo)} ·{" "}
                    {fechaLegible(pago.cuando)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {dinero(pago.monto)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}