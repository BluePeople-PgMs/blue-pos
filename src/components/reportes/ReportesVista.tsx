"use client";

import { useState } from "react";
import {
  generarReporte,
  type ResultadoReporte,
  type TipoReporte,
} from "@/lib/reportes";

const TIPOS: { id: TipoReporte; titulo: string; resumen: string }[] = [
  {
    id: "ventas",
    titulo: "Ventas",
    resumen: "Tickets por estado y total cobrado en el periodo.",
  },
  {
    id: "inventario",
    titulo: "Inventario",
    resumen: "Entradas, salidas por venta y devoluciones por cancelación.",
  },
  {
    id: "cancelaciones",
    titulo: "Cancelaciones",
    resumen: "Folios y motivos registrados en el periodo.",
  },
  {
    id: "combos",
    titulo: "Combos",
    resumen: "Combos más vendidos (ventas cobradas).",
  },
  {
    id: "recetas",
    titulo: "Recetas / platillos",
    resumen: "Comidas preparadas más vendidas (consumo de receta).",
  },
];

function dinero(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

function textoCantidad(valor: number) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 }).format(
    valor,
  );
}

function fechaCorta(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function TablaSimple({
  encabezados,
  filas,
}: {
  encabezados: string[];
  filas: (string | number)[][];
}) {
  if (filas.length === 0) {
    return (
      <p className="text-sm text-muted">Sin datos en este periodo.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted">
            {encabezados.map((h) => (
              <th key={h} className="py-2 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-b border-line/80 last:border-0">
              {fila.map((celda, j) => (
                <td key={j} className="py-2.5 pr-4">
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MostrarResultado({ resultado }: { resultado: ResultadoReporte }) {
  if (resultado.tipo === "ventas") {
    const d = resultado.datos;
    return (
      <TablaSimple
        encabezados={["Concepto", "Valor"]}
        filas={[
          ["Tickets en el periodo", d.tickets],
          ["Abiertas", d.abiertas],
          ["Cobradas (pagadas)", d.cobradas],
          ["Canceladas", d.canceladas],
          ["Total cobrado", dinero(d.totalCobrado)],
        ]}
      />
    );
  }

  if (resultado.tipo === "inventario") {
    const d = resultado.datos;
    return (
      <div className="flex flex-col gap-6">
        <TablaSimple
          encabezados={["Movimiento", "Cantidad (uds.)"]}
          filas={[
            ["Entradas", textoCantidad(d.entradas)],
            ["Salidas por venta", textoCantidad(d.salidasVenta)],
            ["Devoluciones (cancelación)", textoCantidad(d.cancelaciones)],
          ]}
        />
        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Productos con más salida por venta
          </h3>
          <TablaSimple
            encabezados={["Producto", "Cantidad"]}
            filas={d.productosConMasSalida.map((f) => [
              f.nombre,
              textoCantidad(f.cantidad),
            ])}
          />
        </div>
      </div>
    );
  }

  if (resultado.tipo === "cancelaciones") {
    const d = resultado.datos;
    return (
      <>
        <p className="mb-3 text-sm text-muted">
          Total en el periodo: <strong>{d.total}</strong>
        </p>
        <TablaSimple
          encabezados={["Folio", "Motivo", "Fecha"]}
          filas={d.filas.map((f) => [
            f.folio ?? "—",
            f.motivo?.trim() || "—",
            fechaCorta(f.cuando),
          ])}
        />
      </>
    );
  }

  const d = resultado.datos;
  const titulo =
    resultado.tipo === "combos" ? "Combos más vendidos" : "Platillos más vendidos";
  return (
    <>
      <h3 className="mb-2 text-sm font-semibold">{titulo}</h3>
      <TablaSimple
        encabezados={["Producto", "Código", "Unidades vendidas"]}
        filas={d.filas.map((f) => [
          f.nombre,
          f.detalle ?? "—",
          textoCantidad(f.cantidad),
        ])}
      />
    </>
  );
}

function rangoUltimos30Dias() {
  const hoy = new Date();
  const hace30 = new Date(hoy);
  hace30.setDate(hace30.getDate() - 30);
  return {
    desde: hace30.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
  };
}

export function ReportesVista() {
  const [desde, setDesde] = useState(() => rangoUltimos30Dias().desde);
  const [hasta, setHasta] = useState(() => rangoUltimos30Dias().hasta);
  const [tipo, setTipo] = useState<TipoReporte>("ventas");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoReporte | null>(null);

  async function consultar() {
    setCargando(true);
    setError(null);
    setResultado(null);
    const { error: err, resultado: res } = await generarReporte(tipo, desde, hasta);
    setCargando(false);
    if (err) {
      setError(err);
      return;
    }
    setResultado(res);
  }

  const tipoInfo = TIPOS.find((t) => t.id === tipo);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-lg font-semibold">Periodo</h2>
        <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-xl border border-line bg-background px-3 py-2 font-normal"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-xl border border-line bg-background px-3 py-2 font-normal"
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-lg font-semibold">Elegir reporte</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TIPOS.map((t) => {
            const activo = tipo === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  activo
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-background hover:border-accent/40"
                }`}
              >
                <span className="block text-sm font-semibold">{t.titulo}</span>
                <span
                  className={`mt-1 block text-xs leading-5 ${
                    activo ? "text-white/90" : "text-muted"
                  }`}
                >
                  {t.resumen}
                </span>
              </button>
            );
          })}
        </div>
        {tipoInfo ? (
          <p className="text-sm text-muted">{tipoInfo.resumen}</p>
        ) : null}
        <button
          type="button"
          disabled={cargando || !desde || !hasta}
          onClick={() => void consultar()}
          className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {cargando ? "Generando…" : "Generar reporte"}
        </button>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {resultado ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-5 py-5">
          <h2 className="text-lg font-semibold">
            Resultado · {TIPOS.find((t) => t.id === resultado.tipo)?.titulo}
          </h2>
          <p className="text-xs text-muted">
            {desde} — {hasta}
          </p>
          <MostrarResultado resultado={resultado} />
        </section>
      ) : null}
    </div>
  );
}