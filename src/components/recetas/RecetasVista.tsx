"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { leerRecetas, type RecetaLista } from "@/lib/recetas";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function textoCantidad(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 3,
  }).format(valor);
}

export function RecetasVista() {
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [recetas, setRecetas] = useState<RecetaLista[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    leerRecetas().then((datos) => {
      if (!activo) return;
      setAviso(datos.error);
      setRecetas(datos.recetas);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  const categorias = useMemo(() => {
    const orden = new Map<string, number>();
    for (const receta of recetas) {
      if (!orden.has(receta.categoria)) {
        orden.set(receta.categoria, receta.orden);
      }
    }
    return [...orden.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([nombre]) => nombre);
  }, [recetas]);

  const visibles = useMemo(() => {
    const consulta = normalizar(busqueda.trim());
    return recetas.filter((receta) => {
      if (categoria !== "Todas" && receta.categoria !== categoria) return false;
      if (!consulta) return true;
      return (
        normalizar(receta.nombre).includes(consulta) ||
        normalizar(receta.platoCodigo).includes(consulta)
      );
    });
  }, [recetas, busqueda, categoria]);

  if (cargando) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Cargando recetas…
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

      <p className="text-sm leading-6 text-muted">
        Cada comida preparada tiene su lista de insumos por porción. Esos
        ingredientes se controlan en{" "}
        <Link href="/inventario" className="font-medium text-accent underline">
          inventario
        </Link>{" "}
        (filtro Insumos).
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
          Buscar plato
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre o código COM-"
            className="rounded-xl border border-line bg-card px-3 py-2 text-base font-normal outline-none focus:border-accent"
          />
        </label>
        <p className="text-sm text-muted">
          {visibles.length} de {recetas.length} recetas
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
        {["Todas", ...categorias].map((nombre) => (
          <button
            key={nombre}
            type="button"
            aria-pressed={categoria === nombre}
            onClick={() => setCategoria(nombre)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              categoria === nombre
                ? "bg-foreground text-background"
                : "bg-card text-muted ring-1 ring-line"
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted">
          {recetas.length === 0
            ? "No hay recetas en la base. Corre npm run sembrar:recetas tras sembrar el catálogo."
            : "Ninguna receta coincide con la búsqueda."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibles.map((receta) => {
            const expandida = abierta === receta.id;
            return (
              <li
                key={receta.id}
                className="rounded-2xl border border-line bg-card"
              >
                <button
                  type="button"
                  onClick={() =>
                    setAbierta(expandida ? null : receta.id)
                  }
                  className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-medium leading-6">
                      {receta.nombre}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {receta.platoCodigo} · {receta.categoria} · rendimiento{" "}
                      {textoCantidad(receta.rendimiento)} por.
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-muted">
                    {receta.insumos.length} insumos
                    {expandida ? " ▴" : " ▾"}
                  </span>
                </button>
                {expandida ? (
                  <div className="border-t border-line px-4 py-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted">
                          <th className="pb-2 font-medium">Insumo</th>
                          <th className="pb-2 text-right font-medium">
                            Cantidad
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {receta.insumos.map((insumo) => (
                          <tr
                            key={insumo.insumoId}
                            className="border-t border-line/60"
                          >
                            <td className="py-2 pr-3">
                              {insumo.nombre}
                              <span className="mt-0.5 block font-mono text-xs text-muted">
                                {insumo.codigo}
                              </span>
                            </td>
                            <td className="py-2 text-right font-medium tabular-nums">
                              {textoCantidad(insumo.cantidad)}
                              {insumo.unidad ? ` ${insumo.unidad}` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}