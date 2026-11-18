"use client";

import {
  etiquetaTipoProducto,
  listarProductosCatalogo,
  mensajeErrorCatalogo,
  TIPO_PRODUCTO_COMBO,
  type ProductoCatalogo,
} from "@/lib/catalogo/productos";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const formatPrecio = (precio: number | null) =>
  precio == null
    ? "—"
    : new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(precio);

export function ListaProductosCatalogo() {
  const searchParams = useSearchParams();
  const filtroTipoInicial = searchParams.get("tipo") ?? "";
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [filtroTipo, setFiltroTipo] = useState(filtroTipoInicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cargaInicial = useRef(false);

  const cargar = useCallback(async (tipo: string) => {
    setCargando(true);
    setError(null);
    const { data, error: listError } = await listarProductosCatalogo({
      tipo: tipo || undefined,
      soloActivos: true,
    });
    setCargando(false);
    if (listError) {
      setError(mensajeErrorCatalogo(listError));
      setProductos([]);
      return;
    }
    setProductos(data ?? []);
  }, []);

  useEffect(() => {
    if (cargaInicial.current) return;
    cargaInicial.current = true;
    void cargar(filtroTipoInicial);
  }, [cargar, filtroTipoInicial]);

  function onFiltrar(e: React.FormEvent) {
    e.preventDefault();
    void cargar(filtroTipo);
  }

  const tipos = [...new Set(productos.map((p) => p.tipo))].sort();

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={onFiltrar}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card px-5 py-4"
      >
        <div className="flex min-w-[12rem] flex-col gap-2">
          <label htmlFor="filtro-tipo" className="text-sm font-medium">
            Tipo (catálogo)
          </label>
          <input
            id="filtro-tipo"
            list="tipos-catalogo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            placeholder={`ej. ${TIPO_PRODUCTO_COMBO}`}
            className="rounded-xl border border-line bg-background px-3 py-2 text-sm"
          />
          <datalist id="tipos-catalogo">
            <option value={TIPO_PRODUCTO_COMBO} />
            <option value="directo" />
            <option value="preparado" />
            <option value="insumo" />
          </datalist>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={() => {
            setFiltroTipo("");
            void cargar("");
          }}
          className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-muted"
        >
          Ver todos
        </button>
      </form>

      <p className="text-sm text-muted">
        Los combos leen esta misma tabla{" "}
        <span className="font-mono text-foreground">productos</span>. Crea
        productos con{" "}
        <span className="font-mono text-foreground">tipo = combo</span> para el
        selector de combos.{" "}
        <Link href="/combos" className="font-semibold text-accent hover:underline">
          Ir a Combos
        </Link>
      </p>

      {cargando ? (
        <p className="text-sm text-muted" role="status">
          Cargando catálogo…
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {!cargando && productos.length === 0 ? (
        <p className="text-sm text-muted">No hay productos activos con ese filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-line bg-background text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {productos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.codigo ?? "—"}</td>
                  <td className="px-4 py-3">{etiquetaTipoProducto(p.tipo)}</td>
                  <td className="px-4 py-3 font-mono">{formatPrecio(p.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tipos.length > 0 ? (
        <p className="text-xs text-muted">
          Tipos en esta vista: {tipos.map(etiquetaTipoProducto).join(", ")}
        </p>
      ) : null}
    </div>
  );
}