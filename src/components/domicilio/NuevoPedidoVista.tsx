"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DomicilioEncabezado } from "@/components/domicilio/DomicilioEncabezado";
import { leerCatalogoVentas, type ProductoVenta } from "@/lib/ventas";
import { crearPedidoDomicilio, dinero, textoCantidad } from "@/lib/domicilio";

type LineaBorrador = {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function NuevoPedidoVista() {
  const router = useRouter();
  const [cliente, setCliente] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [lineas, setLineas] = useState<LineaBorrador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    leerCatalogoVentas().then((datos) => {
      if (!activo) return;
      setAviso(datos.error);
      setProductos(datos.productos);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  const visibles = useMemo(() => {
    const consulta = normalizar(busqueda.trim());
    const lista = consulta
      ? productos.filter((producto) => {
          const texto = normalizar(`${producto.nombre} ${producto.codigo}`);
          return texto.includes(consulta);
        })
      : productos;
    return lista.slice(0, 8);
  }, [busqueda, productos]);

  const total = useMemo(
    () => lineas.reduce((suma, linea) => suma + linea.cantidad * linea.precio, 0),
    [lineas],
  );

  function agregar(producto: ProductoVenta) {
    setMensaje(null);
    setLineas((actuales) => {
      const existente = actuales.find((linea) => linea.productoId === producto.id);
      if (existente) {
        return actuales.map((linea) =>
          linea.productoId === producto.id
            ? { ...linea, cantidad: linea.cantidad + 1 }
            : linea,
        );
      }
      return [
        ...actuales,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
        },
      ];
    });
  }

  function cambiarCantidad(productoId: string, cantidad: number) {
    setLineas((actuales) => {
      if (cantidad <= 0) {
        return actuales.filter((linea) => linea.productoId !== productoId);
      }
      return actuales.map((linea) =>
        linea.productoId === productoId ? { ...linea, cantidad } : linea,
      );
    });
  }

  async function guardar() {
    setMensaje(null);
    setEnviando(true);
    const resultado = await crearPedidoDomicilio({
      cliente,
      domicilio,
      lineas: lineas.map((linea) => ({
        productoId: linea.productoId,
        cantidad: linea.cantidad,
      })),
    });
    setEnviando(false);
    if (resultado.error || !resultado.id) {
      setMensaje(resultado.error ?? "No se pudo guardar el pedido.");
      return;
    }
    router.push("/domicilio");
  }

  return (
    <div className="flex flex-col gap-6">
      <DomicilioEncabezado
        titulo="Recibir pedido"
        detalle="Arma un pedido de prueba. Al guardarlo queda como Recibido y cocina lo ve en el tablero."
      />

      {aviso ? (
        <p className="rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn" role="alert">
          {aviso}
        </p>
      ) : null}
      {mensaje ? (
        <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {mensaje}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Nombre del cliente
              <input
                value={cliente}
                onChange={(evento) => setCliente(evento.target.value)}
                autoComplete="name"
                placeholder="Ana Ruiz"
                className="rounded-xl border border-line bg-card px-3 py-2 text-base font-normal outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Domicilio
              <input
                value={domicilio}
                onChange={(evento) => setDomicilio(evento.target.value)}
                autoComplete="street-address"
                placeholder="Calle, número, colonia"
                className="rounded-xl border border-line bg-card px-3 py-2 text-base font-normal outline-none focus:border-accent"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Buscar en el menú
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Platillo o código"
              className="rounded-xl border border-line bg-card px-3 py-2 text-base font-normal outline-none focus:border-accent"
            />
          </label>
          <p className="text-sm text-muted">Toca un platillo para sumarlo al pedido.</p>

          {cargando ? (
            <p className="text-sm text-muted" role="status">
              Cargando el menú…
            </p>
          ) : visibles.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card px-4 py-4 text-sm text-muted">
              Ningún platillo coincide con la búsqueda.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {visibles.map((producto) => (
                <li key={producto.id}>
                  <button
                    type="button"
                    onClick={() => agregar(producto)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left hover:border-accent/40"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium leading-6">{producto.nombre}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {producto.categoria}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {dinero(producto.precio)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-line bg-card px-4 py-4 lg:sticky lg:top-4">
          <h2 className="text-lg font-semibold">Pedido</h2>
          {lineas.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              Todavía no hay productos. El total aparece aquí.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lineas.map((linea) => (
                <li key={linea.productoId} className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium leading-5">{linea.nombre}</span>
                    <span className="shrink-0 text-sm tabular-nums">
                      {dinero(linea.cantidad * linea.precio)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Quitar uno de ${linea.nombre}`}
                      onClick={() => cambiarCantidad(linea.productoId, linea.cantidad - 1)}
                      className="size-8 rounded-full bg-background text-base font-semibold ring-1 ring-line"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                      {textoCantidad(linea.cantidad)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Agregar uno de ${linea.nombre}`}
                      onClick={() => cambiarCantidad(linea.productoId, linea.cantidad + 1)}
                      className="size-8 rounded-full bg-background text-base font-semibold ring-1 ring-line"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm text-muted">Total</span>
            <span className="text-xl font-semibold tabular-nums">{dinero(total)}</span>
          </p>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={enviando}
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "Guardar como Recibido"}
          </button>
        </aside>
      </div>
    </div>
  );
}
