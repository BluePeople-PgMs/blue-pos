"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProductoCatalogo } from "@/lib/catalogo";
import { urlImagenCatalogo } from "@/lib/imagen-catalogo";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function dinero(valor: number | string | null) {
  const numero = typeof valor === "number" ? valor : Number(valor ?? 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number.isFinite(numero) ? numero : 0);
}

export function CatalogoVista({
  productos,
}: {
  productos: ProductoCatalogo[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todas");

  const categorias = useMemo(() => {
    const orden = new Map<string, number>();
    for (const producto of productos) {
      if (!orden.has(producto.categoria)) {
        orden.set(producto.categoria, producto.orden);
      }
    }
    return [...orden.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([nombre]) => nombre);
  }, [productos]);

  const visibles = useMemo(() => {
    const consulta = normalizar(busqueda.trim());
    return productos.filter((producto) => {
      if (categoria !== "Todas" && producto.categoria !== categoria) {
        return false;
      }
      if (!consulta) return true;
      return (
        normalizar(producto.nombre).includes(consulta) ||
        normalizar(producto.codigo).includes(consulta)
      );
    });
  }, [productos, busqueda, categoria]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, ProductoCatalogo[]>();
    for (const producto of visibles) {
      const lista = mapa.get(producto.categoria) ?? [];
      lista.push(producto);
      mapa.set(producto.categoria, lista);
    }
    return categorias
      .filter((nombre) => mapa.has(nombre))
      .map((nombre) => ({ nombre, productos: mapa.get(nombre) ?? [] }));
  }, [visibles, categorias]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
            Buscar
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Nombre o código"
              className="rounded-xl border border-line bg-card px-3 py-2 text-base font-normal text-foreground outline-none focus:border-accent"
            />
          </label>
          <p className="text-sm text-muted">
            {visibles.length} de {productos.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
          {["Todas", ...categorias].map((nombre) => {
            const activo = categoria === nombre;
            return (
              <button
                key={nombre}
                type="button"
                aria-pressed={activo}
                onClick={() => setCategoria(nombre)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  activo
                    ? "bg-foreground text-background"
                    : "bg-card text-muted ring-1 ring-line"
                }`}
              >
                {nombre}
              </button>
            );
          })}
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted">
          Ningún producto coincide con la búsqueda.
        </p>
      ) : (
        grupos.map((grupo) => (
          <section key={grupo.nombre} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{grupo.nombre}</h2>
              <span className="text-xs font-medium tracking-wide text-muted uppercase">
                {grupo.productos.length}
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {grupo.productos.map((producto) => (
                <li
                  key={producto.id}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-card p-3 sm:gap-4 sm:p-4"
                >
                  <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-muted/30 sm:h-20 sm:w-20">
                    <Image
                      src={urlImagenCatalogo({
                        codigo: producto.codigo,
                        nombre: producto.nombre,
                        categoria: producto.categoria,
                      })}
                      alt=""
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium leading-6">{producto.nombre}</h3>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {producto.codigo}
                        {producto.unidad ? ` · ${producto.unidad}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {dinero(producto.precio)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
