import Image from "next/image";
import type { ComponentType } from "react";
import type { MetodoPago, ProductoVenta, VentaDetalle, VentaLista } from "@/lib/ventas";
import { urlImagenCatalogo } from "@/lib/imagen-catalogo";

type FiltroLista = "todas" | VentaLista["estado"];

export type VentasPosLayoutProps = {
  ventasVisibles: VentaLista[];
  ventaId: string | null;
  venta: VentaDetalle | null;
  filtroLista: FiltroLista;
  setFiltroLista: (v: FiltroLista) => void;
  puedeOperar: boolean;
  enviando: boolean;
  onNuevaVenta: () => void;
  onSeleccionarVenta: (id: string) => void;
  busquedaProducto: string;
  setBusquedaProducto: (v: string) => void;
  tipoCatalogo: "todos" | "comidas" | "empacados";
  setTipoCatalogo: (v: "todos" | "comidas" | "empacados") => void;
  categoriaFiltro: string;
  setCategoriaFiltro: (v: string) => void;
  categoriasMenu: string[];
  productosMenu: ProductoVenta[];
  productoId: string;
  notasLinea: string;
  setNotasLinea: (v: string) => void;
  metodo: MetodoPago;
  setMetodo: (v: MetodoPago) => void;
  motivo: string;
  setMotivo: (v: string) => void;
  esAdministrador: boolean;
  onAgregarRapido: (p: ProductoVenta) => void;
  onCambiarCantidad: (lineaId: string, cantidad: number) => void;
  onQuitarLinea: (lineaId: string) => void;
  onCobrar: () => void;
  onCancelarAbierta: () => void;
  onCancelarCobrada: () => void;
  dinero: (n: number) => string;
  textoCantidad: (n: number) => string;
  etiquetaMetodo: (m: string) => string;
  InsigniaEstado: ComponentType<{ estado: VentaLista["estado"] }>;
  METODOS: { id: MetodoPago; titulo: string; detalle: string }[];
};

export function VentasPosLayout({
  ventasVisibles,
  ventaId,
  venta,
  filtroLista,
  setFiltroLista,
  puedeOperar,
  enviando,
  onNuevaVenta,
  onSeleccionarVenta,
  busquedaProducto,
  setBusquedaProducto,
  tipoCatalogo,
  setTipoCatalogo,
  categoriaFiltro,
  setCategoriaFiltro,
  categoriasMenu,
  productosMenu,
  productoId,
  notasLinea,
  setNotasLinea,
  metodo,
  setMetodo,
  motivo,
  setMotivo,
  esAdministrador,
  onAgregarRapido,
  onCambiarCantidad,
  onQuitarLinea,
  onCobrar,
  onCancelarAbierta,
  onCancelarCobrada,
  dinero,
  textoCantidad,
  etiquetaMetodo,
  InsigniaEstado,
  METODOS,
}: VentasPosLayoutProps) {
  const ventaAbierta = venta?.estado === "abierta";

  return (
    <div className="grid min-h-[min(720px,calc(100vh-11rem))] gap-3 lg:grid-cols-[minmax(200px,220px)_minmax(0,1fr)_minmax(300px,360px)] lg:gap-4">
      <aside className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-card p-3 shadow-sm lg:max-h-[calc(100vh-10rem)]">
        <EncabezadoOrdens
          puedeOperar={puedeOperar}
          enviando={enviando}
          onNuevaVenta={onNuevaVenta}
        />
        <FiltroVentas
          filtroLista={filtroLista}
          setFiltroLista={setFiltroLista}
        />
        <ListaVentas
          ventas={ventasVisibles}
          ventaId={ventaId}
          puedeOperar={puedeOperar}
          enviando={enviando}
          onNuevaVenta={onNuevaVenta}
          onSeleccionar={onSeleccionarVenta}
          dinero={dinero}
          InsigniaEstado={InsigniaEstado}
        />
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-[#f7f8f6] shadow-sm">
        <header className="border-b border-line bg-card px-4 py-3">
          <label className="sr-only" htmlFor="buscar-menu">
            Buscar en el menú
          </label>
          <input
            id="buscar-menu"
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
            placeholder="Buscar en el menú…"
            className="w-full rounded-xl border border-line bg-background px-4 py-2.5 text-sm outline-none ring-olive/30 focus:border-olive focus:ring-2"
          />
          <div
            className="mt-3 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Tipo de producto"
          >
            {(
              [
                ["todos", "Todo"],
                ["comidas", "Platillos"],
                ["empacados", "Empacados"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={tipoCatalogo === valor}
                onClick={() => setTipoCatalogo(valor)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  tipoCatalogo === valor
                    ? "bg-foreground text-background"
                    : "bg-background text-muted ring-1 ring-line"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Categorías"
          >
            <button
              type="button"
              role="tab"
              aria-selected={categoriaFiltro === "todas"}
              onClick={() => setCategoriaFiltro("todas")}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold ${
                categoriaFiltro === "todas"
                  ? "bg-olive text-white shadow-sm"
                  : "bg-card text-muted ring-1 ring-line"
              }`}
            >
              Todas
            </button>
            {categoriasMenu.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={categoriaFiltro === cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold ${
                  categoriaFiltro === cat
                    ? "bg-olive text-white shadow-sm"
                    : "bg-card text-muted ring-1 ring-line"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {productosMenu.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-card px-4 py-10 text-center text-sm text-muted">
              Ningún producto con stock en esta categoría. Prueba otra o busca
              por nombre.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {productosMenu.map((p) => {
                const seleccionado = p.id === productoId;
                const src = urlImagenCatalogo({
                  codigo: p.codigo,
                  nombre: p.nombre,
                  categoria: p.categoria,
                });
                const sinStock = p.existencia <= 0;
                return (
                  <li key={p.id}>
                    <article
                      className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow ${
                        seleccionado
                          ? "border-olive shadow-md ring-2 ring-olive/25"
                          : "border-line shadow-sm hover:border-olive/40"
                      } ${sinStock ? "opacity-75" : ""}`}
                    >
                      <div className="relative mx-auto mt-4 size-28 overflow-hidden rounded-full bg-background ring-4 ring-white">
                        <Image
                          src={src}
                          alt=""
                          width={112}
                          height={112}
                          className="size-full object-cover"
                          sizes="112px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col px-3 pb-3 pt-2 text-center">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                          {p.nombre}
                        </h3>
                        <p className="mt-1 text-sm font-bold tabular-nums text-olive">
                          {dinero(p.precio)}
                        </p>
                        <p className="text-[11px] text-muted">
                          Stock {textoCantidad(p.existencia)} {p.unidad}
                        </p>
                        <button
                          type="button"
                          disabled={
                            !puedeOperar || enviando || !ventaAbierta || sinStock
                          }
                          onClick={() => onAgregarRapido(p)}
                          className="mt-3 w-full rounded-xl bg-olive py-2.5 text-xs font-bold tracking-wide text-white uppercase disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          + Añadir
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm lg:max-h-[calc(100vh-10rem)]">
        {!venta ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <p className="text-sm text-muted">
              Selecciona un pedido o abre uno nuevo para capturar líneas.
            </p>
            <button
              type="button"
              disabled={!puedeOperar || enviando}
              onClick={onNuevaVenta}
              className="rounded-xl bg-olive px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Nuevo pedido
            </button>
          </div>
        ) : (
          <>
            <header className="border-b border-line px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                    Pedido
                  </p>
                  <p className="font-mono text-xl font-bold">
                    {venta.folio ?? venta.id.slice(0, 8)}
                  </p>
                </div>
                <InsigniaEstado estado={venta.estado} />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-olive">
                {dinero(venta.total)}
              </p>
              {venta.pago ? (
                <p className="mt-1 text-xs text-muted">
                  {etiquetaMetodo(venta.pago.metodo)} · {dinero(venta.pago.monto)}
                </p>
              ) : null}
              {venta.cancelacion ? (
                <p className="mt-1 text-xs text-muted">
                  Cancelación:{" "}
                  {venta.cancelacion.motivo?.trim() || "Sin motivo"}
                </p>
              ) : null}
            </header>

            <PedidoItems
              venta={venta}
              enviando={enviando}
              dinero={dinero}
              textoCantidad={textoCantidad}
              onCambiarCantidad={onCambiarCantidad}
              onQuitarLinea={onQuitarLinea}
            />

            {ventaAbierta ? (
              <footer className="mt-auto border-t border-line bg-background/80 p-4">
                <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                  Nota para la línea siguiente (opcional)
                  <input
                    value={notasLinea}
                    onChange={(e) => setNotasLinea(e.target.value)}
                    placeholder="Sin cebolla, extra queso…"
                    className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground"
                  />
                </label>

                <p className="mt-3 text-xs font-semibold text-muted">
                  Método de pago
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group">
                  {METODOS.map((opcion) => (
                    <button
                      key={opcion.id}
                      type="button"
                      aria-pressed={metodo === opcion.id}
                      onClick={() => setMetodo(opcion.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        metodo === opcion.id
                          ? "bg-olive-soft text-olive ring-1 ring-olive/30"
                          : "bg-card text-muted ring-1 ring-line"
                      }`}
                    >
                      {opcion.titulo}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={
                      !puedeOperar ||
                      enviando ||
                      venta.lineasDetalle.length === 0
                    }
                    onClick={onCobrar}
                    className="w-full rounded-xl bg-olive py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
                  >
                    {enviando
                      ? "Procesando…"
                      : `Cobrar ${dinero(venta.total)}`}
                  </button>
                  <button
                    type="button"
                    disabled={!puedeOperar || enviando}
                    onClick={onCancelarAbierta}
                    className="w-full rounded-xl border border-line py-2 text-xs font-medium text-muted hover:bg-card disabled:opacity-50"
                  >
                    Cancelar pedido sin cobrar
                  </button>
                </div>
              </footer>
            ) : null}

            {venta.estado === "cobrada" && esAdministrador ? (
              <div className="border-t border-line p-4">
                <label className="flex flex-col gap-1 text-xs font-medium">
                  Motivo de cancelación
                  <input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="rounded-lg border border-line bg-background px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  disabled={!puedeOperar || enviando}
                  onClick={onCancelarCobrada}
                  className="mt-3 w-full rounded-xl border border-danger/40 bg-danger-soft py-2 text-xs font-semibold text-danger disabled:opacity-50"
                >
                  Cancelar y devolver existencia
                </button>
              </div>
            ) : null}
            {venta.estado === "cobrada" && !esAdministrador ? (
              <p className="border-t border-line p-4 text-xs text-muted">
                Para cancelar una venta pagada, pide a un administrador.
              </p>
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}

function EncabezadoOrdens({
  puedeOperar,
  enviando,
  onNuevaVenta,
}: {
  puedeOperar: boolean;
  enviando: boolean;
  onNuevaVenta: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-bold">Órdenes</h2>
      <button
        type="button"
        disabled={!puedeOperar || enviando}
        onClick={onNuevaVenta}
        className="rounded-lg bg-olive px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50"
      >
        + Nuevo
      </button>
    </div>
  );
}

function FiltroVentas({
  filtroLista,
  setFiltroLista,
}: {
  filtroLista: FiltroLista;
  setFiltroLista: (v: FiltroLista) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar ventas">
      {(
        [
          ["todas", "Todos"],
          ["abierta", "Abiertas"],
          ["cobrada", "Pagadas"],
          ["cancelada", "Cancel."],
        ] as const
      ).map(([valor, etiqueta]) => (
        <button
          key={valor}
          type="button"
          aria-pressed={filtroLista === valor}
          onClick={() => setFiltroLista(valor)}
          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
            filtroLista === valor
              ? "bg-foreground text-background"
              : "bg-background text-muted ring-1 ring-line"
          }`}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );
}

function ListaVentas({
  ventas,
  ventaId,
  puedeOperar,
  enviando,
  onNuevaVenta,
  onSeleccionar,
  dinero,
  InsigniaEstado,
}: {
  ventas: VentaLista[];
  ventaId: string | null;
  puedeOperar: boolean;
  enviando: boolean;
  onNuevaVenta: () => void;
  onSeleccionar: (id: string) => void;
  dinero: (n: number) => string;
  InsigniaEstado: ComponentType<{ estado: VentaLista["estado"] }>;
}) {
  if (ventas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line px-2 py-6 text-center text-xs text-muted">
        Sin pedidos con este filtro.
        <button
          type="button"
          disabled={!puedeOperar || enviando}
          onClick={onNuevaVenta}
          className="mt-2 block w-full text-xs font-semibold text-olive"
        >
          Crear pedido
        </button>
      </div>
    );
  }
  return (
    <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
      {ventas.map((v) => {
        const activa = v.id === ventaId;
        return (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => onSeleccionar(v.id)}
              className={`flex w-full flex-col gap-1 rounded-xl border px-2.5 py-2 text-left text-xs transition-colors ${
                activa
                  ? "border-olive bg-olive-soft"
                  : "border-line bg-background hover:border-olive/35"
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="font-mono font-bold">
                  {v.folio ?? v.id.slice(0, 6)}
                </span>
                <InsigniaEstado estado={v.estado} />
              </span>
              <span className="flex justify-between text-muted">
                <span>{v.lineas} ítems</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {dinero(v.total)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PedidoItems({
  venta,
  enviando,
  dinero,
  textoCantidad,
  onCambiarCantidad,
  onQuitarLinea,
}: {
  venta: VentaDetalle;
  enviando: boolean;
  dinero: (n: number) => string;
  textoCantidad: (n: number) => string;
  onCambiarCantidad: (lineaId: string, cantidad: number) => void;
  onQuitarLinea: (lineaId: string) => void;
}) {
  const editable = venta.estado === "abierta";
  return (
    <>
      <h2 className="sr-only">Líneas del pedido</h2>
      <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto px-3 py-2">
      {venta.lineasDetalle.length === 0 ? (
        <li className="py-8 text-center text-xs text-muted">
          El pedido está vacío. Añade desde el menú.
        </li>
      ) : (
        venta.lineasDetalle.map((linea) => (
          <li key={linea.id} className="py-2.5 text-sm">
            <div className="flex items-start justify-between gap-2">
              <LineaTitulo
                linea={linea}
                dinero={dinero}
                textoCantidad={textoCantidad}
                editable={editable}
              />
              <span className="shrink-0 font-bold tabular-nums">
                {dinero(linea.subtotal)}
              </span>
            </div>
            {editable ? (
              <div className="mt-2 flex items-center gap-1">
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() =>
                    onCambiarCantidad(linea.id, linea.cantidad - 1)
                  }
                  className="flex size-7 items-center justify-center rounded-md border border-line text-sm disabled:opacity-50"
                  aria-label="Menos uno"
                >
                  −
                </button>
                <span className="min-w-[2rem] text-center text-xs font-bold tabular-nums">
                  {textoCantidad(linea.cantidad)}
                </span>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() =>
                    onCambiarCantidad(linea.id, linea.cantidad + 1)
                  }
                  className="flex size-7 items-center justify-center rounded-md border border-line text-sm disabled:opacity-50"
                  aria-label="Más uno"
                >
                  +
                </button>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => onQuitarLinea(linea.id)}
                  className="ml-auto text-[11px] font-medium text-warn"
                >
                  Quitar
                </button>
              </div>
            ) : null}
          </li>
        ))
      )}
      </ul>
    </>
  );
}

function LineaTitulo({
  linea,
  dinero,
  textoCantidad,
  editable,
}: {
  linea: VentaDetalle["lineasDetalle"][number];
  dinero: (n: number) => string;
  textoCantidad: (n: number) => string;
  editable: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="font-semibold leading-snug">{linea.producto}</p>
      <p className="mt-0.5 text-[11px] text-muted">
        {dinero(linea.precioUnitario)} c/u
        {linea.notas ? (
          <span className="ml-1 rounded-md bg-danger-soft px-1.5 py-0.5 text-danger">
            {linea.notas}
          </span>
        ) : null}
        {!editable ? (
          <span className="ml-1">× {textoCantidad(linea.cantidad)}</span>
        ) : null}
      </p>
    </div>
  );
}