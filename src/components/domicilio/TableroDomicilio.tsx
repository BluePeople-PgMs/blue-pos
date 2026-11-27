"use client";

import { useEffect, useMemo, useState } from "react";
import { DomicilioEncabezado } from "@/components/domicilio/DomicilioEncabezado";
import {
  avanzarPedido,
  dinero,
  ETIQUETA_ESTADO,
  listarPedidos,
  numeroPaso,
  pasoSiguiente,
  textoCantidad,
  type EstadoPedido,
  type PedidoDomicilio,
} from "@/lib/domicilio";

type Filtro = "curso" | "entregados" | "todos";

const ESTILO_ESTADO: Record<EstadoPedido, string> = {
  recibido: "bg-accent-soft text-accent",
  en_preparacion: "bg-warn-soft text-warn",
  listo: "bg-olive-soft text-olive",
  en_camino: "bg-accent text-white",
  entregado: "bg-background text-muted ring-1 ring-line",
};

function hora(valor: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

export function TableroDomicilio() {
  const [pedidos, setPedidos] = useState<PedidoDomicilio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("curso");
  const [repartidor, setRepartidor] = useState<Record<string, string>>({});
  const [avanzandoId, setAvanzandoId] = useState<string | null>(null);

  async function cargar() {
    const datos = await listarPedidos();
    setAviso(datos.error);
    setPedidos(datos.pedidos);
    setCargando(false);
  }

  useEffect(() => {
    let activo = true;
    listarPedidos().then((datos) => {
      if (!activo) return;
      setAviso(datos.error);
      setPedidos(datos.pedidos);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  const visibles = useMemo(() => {
    if (filtro === "entregados") {
      return pedidos.filter((pedido) => pedido.estado === "entregado");
    }
    if (filtro === "curso") {
      return pedidos.filter((pedido) => pedido.estado !== "entregado");
    }
    return pedidos;
  }, [filtro, pedidos]);

  async function avanzar(pedido: PedidoDomicilio) {
    setAviso(null);
    setAvanzandoId(pedido.id);
    const resultado = await avanzarPedido({
      id: pedido.id,
      repartidor: repartidor[pedido.id],
    });
    setAvanzandoId(null);
    if (resultado.error) {
      setAviso(resultado.error);
      return;
    }
    await cargar();
  }

  return (
    <div className="flex flex-col gap-6">
      <DomicilioEncabezado
        titulo="Tablero"
        detalle="Cocina ve qué preparar. Cada pedido solo muestra el botón del siguiente paso."
      />

      <p className="text-sm leading-6 text-muted">
        Recibido → En preparación → Listo para recoger → En camino → Entregado
      </p>

      {aviso ? (
        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {aviso}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos">
        {(
          [
            ["curso", "En curso"],
            ["entregados", "Entregados"],
            ["todos", "Todos"],
          ] as const
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={filtro === valor}
            onClick={() => setFiltro(valor)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
              filtro === valor
                ? "bg-foreground text-background"
                : "bg-card text-muted ring-1 ring-line"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-sm text-muted" role="status">
          Cargando pedidos…
        </p>
      ) : visibles.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-5 text-sm leading-6 text-muted">
          {filtro === "entregados"
            ? "Todavía no hay pedidos entregados."
            : "No hay pedidos en este filtro. Recibe uno en la pantalla 1."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visibles.map((pedido) => {
            const paso = pasoSiguiente(pedido.estado);
            const ocupado = avanzandoId === pedido.id;
            return (
              <li
                key={pedido.id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-4 py-4 sm:px-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                      Paso {numeroPaso(pedido.estado)} de 5
                      {pedido.folio ? ` · ${pedido.folio}` : ""}
                      {" · "}
                      {hora(pedido.creadoEn)}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold leading-tight">
                      {pedido.cliente}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{pedido.domicilio}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTILO_ESTADO[pedido.estado]}`}
                  >
                    {ETIQUETA_ESTADO[pedido.estado]}
                  </span>
                </div>

                <ul className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
                  {pedido.lineas.map((linea) => (
                    <li key={linea.id} className="flex justify-between gap-3">
                      <span>
                        {textoCantidad(linea.cantidad)} × {linea.nombre}
                      </span>
                      <span className="tabular-nums text-muted">
                        {dinero(linea.cantidad * linea.precioUnitario)}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="flex items-baseline justify-between text-sm">
                  <span className="text-muted">Total</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {dinero(pedido.total)}
                  </span>
                </p>

                {pedido.repartidor ? (
                  <p className="text-sm text-muted">
                    Recoge: <span className="font-medium text-foreground">{pedido.repartidor}</span>
                  </p>
                ) : null}

                {paso ? (
                  <div className="flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-end">
                    <p className="text-sm text-muted sm:mr-auto sm:pb-2">
                      Siguiente: {paso.quien}
                    </p>
                    {paso.pideRepartidor ? (
                      <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
                        Quién recoge el pedido
                        <input
                          value={repartidor[pedido.id] ?? ""}
                          onChange={(evento) =>
                            setRepartidor((actual) => ({
                              ...actual,
                              [pedido.id]: evento.target.value,
                            }))
                          }
                          placeholder="Nombre del repartidor"
                          className="rounded-xl border border-line bg-background px-3 py-2 text-base font-normal outline-none focus:border-accent"
                        />
                      </label>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void avanzar(pedido)}
                      disabled={ocupado}
                      className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {ocupado ? "Guardando…" : paso.boton}
                    </button>
                  </div>
                ) : (
                  <p className="border-t border-line pt-3 text-sm text-olive">
                    Entrega completa.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
