"use client";

import { getSupabaseBrowser } from "@/lib/supabase";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Producto = {
  id: string;
  nombre: string;
  codigo: string | null;
  precio: number | null;
};

type Caja = {
  id: string;
  nombre: string;
};

type VentaLinea = {
  id: string;
  producto_id: string | null;
  cantidad: number;
  precio_unitario: number;
  notas: string | null;
};

type VentaAbierta = {
  id: string;
  folio: string | null;
  total: number;
  caja_id: string | null;
};

type VentaCobrada = {
  id: string;
  folio: string | null;
  total: number;
  created_at: string;
};

function etiquetaProducto(nombre: string, codigo: string | null) {
  return codigo ? `${nombre} (${codigo})` : nombre;
}

function formatoFecha(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatoMoneda(monto: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(monto);
}

type DatosBaseVentas =
  | { error: string }
  | {
      listaCajas: Caja[];
      listaProductos: Producto[];
      existenciasFilas: { producto_id: string; cantidad: number | string }[];
      cobradas: {
        id: string;
        folio: string | null;
        total: number | string;
        created_at: string;
      }[];
      ventaAbiertaId: string | null;
    };

async function consultarDatosBaseVentas(
  client: SupabaseClient,
): Promise<DatosBaseVentas> {
  const [cajasRes, productosRes, existenciasRes, cobradasRes, abiertaRes] =
    await Promise.all([
      client.from("cajas").select("id, nombre").eq("activa", true).order("nombre"),
      client
        .from("productos")
        .select("id, nombre, codigo, precio")
        .eq("activo", true)
        .order("nombre"),
      client.from("existencias").select("producto_id, cantidad"),
      client
        .from("ventas")
        .select("id, folio, total, created_at")
        .eq("estado", "cobrada")
        .order("created_at", { ascending: false })
        .limit(20),
      client
        .from("ventas")
        .select("id")
        .eq("estado", "abierta")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (cajasRes.error) return { error: cajasRes.error.message };
  if (productosRes.error) return { error: productosRes.error.message };
  if (existenciasRes.error) return { error: existenciasRes.error.message };
  if (cobradasRes.error) return { error: cobradasRes.error.message };

  const listaProductos = (productosRes.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    codigo: p.codigo,
    precio: p.precio == null ? null : Number(p.precio),
  }));

  return {
    listaCajas: cajasRes.data ?? [],
    listaProductos,
    existenciasFilas: existenciasRes.data ?? [],
    cobradas: cobradasRes.data ?? [],
    ventaAbiertaId:
      abiertaRes.error || !abiertaRes.data?.[0]
        ? null
        : abiertaRes.data[0].id,
  };
}

export function PuntoVenta({ session }: { session: Session }) {
  const supabase = getSupabaseBrowser()!;
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [cajaId, setCajaId] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [existencias, setExistencias] = useState<Map<string, number>>(new Map());
  const [venta, setVenta] = useState<VentaAbierta | null>(null);
  const [lineas, setLineas] = useState<VentaLinea[]>([]);
  const [ventasCobradas, setVentasCobradas] = useState<VentaCobrada[]>([]);

  const [productoId, setProductoId] = useState("");
  const [cantidadLinea, setCantidadLinea] = useState("1");
  const [metodoPago, setMetodoPago] = useState("efectivo");

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarVentaAbierta = useCallback(
    async (ventaId: string) => {
      const { data: ventaData, error: ventaError } = await supabase
        .from("ventas")
        .select("id, folio, total, caja_id, estado")
        .eq("id", ventaId)
        .single();

      if (ventaError || !ventaData || ventaData.estado !== "abierta") {
        setVenta(null);
        setLineas([]);
        return;
      }

      const { data: lineasData, error: lineasError } = await supabase
        .from("venta_lineas")
        .select("id, producto_id, cantidad, precio_unitario, notas")
        .eq("venta_id", ventaId)
        .order("id");

      if (lineasError) {
        setError(lineasError.message);
        return;
      }

      setVenta({
        id: ventaData.id,
        folio: ventaData.folio,
        total: Number(ventaData.total),
        caja_id: ventaData.caja_id,
      });
      setLineas(
        (lineasData ?? []).map((l) => ({
          id: l.id,
          producto_id: l.producto_id,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario),
          notas: l.notas,
        })),
      );
    },
    [supabase],
  );

  const aplicarDatosBase = useCallback(
    async (datos: DatosBaseVentas) => {
      if ("error" in datos) {
        setError(datos.error);
        setCargando(false);
        return;
      }

      const { listaCajas, listaProductos, existenciasFilas, cobradas, ventaAbiertaId } =
        datos;

      const mapExistencias = new Map(
        existenciasFilas.map((f) => [f.producto_id, Number(f.cantidad)]),
      );
      const productosConInventario = listaProductos.filter(
        (p) => (mapExistencias.get(p.id) ?? 0) > 0,
      );

      setCajas(listaCajas);
      setCajaId((prev) => prev || listaCajas[0]?.id || "");
      setProductos(productosConInventario);
      setProductoId((prev) => {
        if (prev && productosConInventario.some((p) => p.id === prev)) {
          return prev;
        }
        return productosConInventario[0]?.id ?? "";
      });
      setExistencias(mapExistencias);
      setVentasCobradas(
        cobradas.map((v) => ({
          id: v.id,
          folio: v.folio,
          total: Number(v.total),
          created_at: v.created_at,
        })),
      );

      if (ventaAbiertaId) {
        await cargarVentaAbierta(ventaAbiertaId);
      } else {
        setVenta(null);
        setLineas([]);
      }

      setCargando(false);
    },
    [cargarVentaAbierta],
  );

  const recargarBase = useCallback(
    async (mostrarCarga = false) => {
      if (mostrarCarga) {
        setCargando(true);
        setError(null);
      }
      const datos = await consultarDatosBaseVentas(supabase);
      await aplicarDatosBase(datos);
    },
    [aplicarDatosBase, supabase],
  );

  useEffect(() => {
    let activo = true;
    void consultarDatosBaseVentas(supabase).then((datos) => {
      if (!activo) return;
      void aplicarDatosBase(datos);
    });
    return () => {
      activo = false;
    };
  }, [aplicarDatosBase, session.user.id, supabase]);

  const productosPorId = new Map(productos.map((p) => [p.id, p]));

  async function sincronizarTotal(ventaId: string) {
    const { data, error: lineasError } = await supabase
      .from("venta_lineas")
      .select("cantidad, precio_unitario")
      .eq("venta_id", ventaId);

    if (lineasError) {
      throw new Error(lineasError.message);
    }

    const total = (data ?? []).reduce(
      (acc, l) => acc + Number(l.cantidad) * Number(l.precio_unitario),
      0,
    );

    const { error: updateError } = await supabase
      .from("ventas")
      .update({ total })
      .eq("id", ventaId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    setVenta((prev) => (prev ? { ...prev, total } : prev));
    return total;
  }

  async function iniciarVenta() {
    setMensaje(null);
    setError(null);
    if (!cajaId) {
      setError("Registra al menos una caja activa en el catálogo.");
      return;
    }
    if (venta) {
      setError("Ya hay una venta abierta. Ciérrala o cobra antes de iniciar otra.");
      return;
    }

    setProcesando(true);
    const folio = `V-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
    const { data, error: insertError } = await supabase
      .from("ventas")
      .insert({
        caja_id: cajaId,
        folio,
        estado: "abierta",
        total: 0,
      })
      .select("id, folio, total, caja_id")
      .single();

    setProcesando(false);
    if (insertError || !data) {
      setError(insertError?.message ?? "No se pudo crear la venta.");
      return;
    }

    setVenta({
      id: data.id,
      folio: data.folio,
      total: Number(data.total),
      caja_id: data.caja_id,
    });
    setLineas([]);
    setMensaje("Venta abierta. Agrega productos al carrito.");
  }

  async function agregarLinea(event: React.FormEvent) {
    event.preventDefault();
    setMensaje(null);
    setError(null);

    if (!venta) {
      setError("Inicia una venta antes de agregar líneas.");
      return;
    }

    const producto = productosPorId.get(productoId);
    if (!producto) {
      setError("Elige un producto.");
      return;
    }
    if (producto.precio == null || producto.precio < 0) {
      setError("El producto no tiene precio.");
      return;
    }

    const qty = Number(cantidadLinea);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    setProcesando(true);

    const { data: linea, error: lineaError } = await supabase
      .from("venta_lineas")
      .insert({
        venta_id: venta.id,
        producto_id: producto.id,
        cantidad: qty,
        precio_unitario: producto.precio,
      })
      .select("id, producto_id, cantidad, precio_unitario, notas")
      .single();

    if (lineaError || !linea) {
      setProcesando(false);
      setError(lineaError?.message ?? "No se pudo agregar la línea.");
      return;
    }

    try {
      await sincronizarTotal(venta.id);
    } catch (e) {
      setProcesando(false);
      setError(e instanceof Error ? e.message : "Error al actualizar el total.");
      return;
    }

    setLineas((prev) => [
      ...prev,
      {
        id: linea.id,
        producto_id: linea.producto_id,
        cantidad: Number(linea.cantidad),
        precio_unitario: Number(linea.precio_unitario),
        notas: linea.notas,
      },
    ]);
    setCantidadLinea("1");
    setProcesando(false);
    setMensaje("Producto agregado al carrito.");
  }

  async function quitarLinea(lineaId: string) {
    if (!venta) {
      return;
    }
    setProcesando(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("venta_lineas")
      .delete()
      .eq("id", lineaId);

    if (deleteError) {
      setProcesando(false);
      setError(deleteError.message);
      return;
    }

    try {
      await sincronizarTotal(venta.id);
    } catch (e) {
      setProcesando(false);
      setError(e instanceof Error ? e.message : "Error al actualizar el total.");
      return;
    }

    setLineas((prev) => prev.filter((l) => l.id !== lineaId));
    setProcesando(false);
  }

  async function actualizarExistencia(
    productoIdActualizar: string,
    delta: number,
  ) {
    const actual = existencias.get(productoIdActualizar) ?? 0;
    const nueva = actual + delta;

    if (actual === 0 && delta > 0) {
      const { error: insertError } = await supabase.from("existencias").insert({
        producto_id: productoIdActualizar,
        cantidad: nueva,
      });
      if (insertError) {
        throw new Error(insertError.message);
      }
    } else {
      const { error: updateError } = await supabase
        .from("existencias")
        .update({ cantidad: nueva })
        .eq("producto_id", productoIdActualizar);
      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    setExistencias((prev) => new Map(prev).set(productoIdActualizar, nueva));
  }

  async function cobrarVenta(event: React.FormEvent) {
    event.preventDefault();
    setMensaje(null);
    setError(null);

    if (!venta) {
      setError("No hay venta abierta.");
      return;
    }
    if (lineas.length === 0) {
      setError("Agrega al menos una línea antes de cobrar.");
      return;
    }

    for (const linea of lineas) {
      if (!linea.producto_id) {
        continue;
      }
      const stock = existencias.get(linea.producto_id) ?? 0;
      if (stock < linea.cantidad) {
        const nombre =
          productosPorId.get(linea.producto_id)?.nombre ?? linea.producto_id;
        setError(`Stock insuficiente para ${nombre}. Disponible: ${stock}.`);
        return;
      }
    }

    const total = venta.total;

    setProcesando(true);

    const { error: pagoError } = await supabase.from("pagos").insert({
      venta_id: venta.id,
      metodo: metodoPago.trim() || "efectivo",
      monto: total,
    });

    if (pagoError) {
      setProcesando(false);
      setError(pagoError.message);
      return;
    }

    const { error: ventaError } = await supabase
      .from("ventas")
      .update({ estado: "cobrada", total })
      .eq("id", venta.id);

    if (ventaError) {
      setProcesando(false);
      setError(ventaError.message);
      return;
    }

    for (const linea of lineas) {
      if (!linea.producto_id) {
        continue;
      }

      const { error: movError } = await supabase.from("movimientos_inventario").insert({
        producto_id: linea.producto_id,
        caja_id: cajaId || venta.caja_id,
        venta_id: venta.id,
        tipo: "salida_venta",
        cantidad: linea.cantidad,
        nota: `Venta ${venta.folio ?? venta.id}`,
      });

      if (movError) {
        setProcesando(false);
        setError(movError.message);
        return;
      }

      try {
        await actualizarExistencia(linea.producto_id, -linea.cantidad);
      } catch (e) {
        setProcesando(false);
        setError(e instanceof Error ? e.message : "Error al actualizar existencias.");
        return;
      }
    }

    setProcesando(false);
    setMensaje(`Venta cobrada. Total: ${formatoMoneda(total)}`);
    setVenta(null);
    setLineas([]);
    await recargarBase(true);
  }

  async function cancelarVenta(ventaId: string) {
    setMensaje(null);
    setError(null);

    const motivoRespuesta = window.prompt("Motivo de la cancelación (opcional)");
    if (motivoRespuesta === null) {
      return;
    }
    const motivo = motivoRespuesta.trim() || null;

    setProcesando(true);

    const { data: ventaData, error: ventaError } = await supabase
      .from("ventas")
      .select("id, folio, estado, caja_id")
      .eq("id", ventaId)
      .single();

    if (ventaError || !ventaData) {
      setProcesando(false);
      setError(ventaError?.message ?? "Venta no encontrada.");
      return;
    }
    if (ventaData.estado !== "cobrada") {
      setProcesando(false);
      setError("Solo se pueden cancelar ventas cobradas.");
      return;
    }

    const { data: lineasVenta, error: lineasError } = await supabase
      .from("venta_lineas")
      .select("producto_id, cantidad")
      .eq("venta_id", ventaId);

    if (lineasError) {
      setProcesando(false);
      setError(lineasError.message);
      return;
    }

    const { error: cancelError } = await supabase.from("cancelaciones").insert({
      venta_id: ventaId,
      motivo,
    });

    if (cancelError) {
      setProcesando(false);
      setError(cancelError.message);
      return;
    }

    for (const linea of lineasVenta ?? []) {
      if (!linea.producto_id) {
        continue;
      }
      const qty = Number(linea.cantidad);

      const { error: movError } = await supabase.from("movimientos_inventario").insert({
        producto_id: linea.producto_id,
        caja_id: ventaData.caja_id,
        venta_id: ventaId,
        tipo: "cancelacion",
        cantidad: qty,
        nota: `Cancelación ${ventaData.folio ?? ventaId}`,
      });

      if (movError) {
        setProcesando(false);
        setError(movError.message);
        return;
      }

      try {
        await actualizarExistencia(linea.producto_id, qty);
      } catch (e) {
        setProcesando(false);
        setError(e instanceof Error ? e.message : "Error al devolver existencias.");
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("ventas")
      .update({ estado: "cancelada" })
      .eq("id", ventaId);

    if (updateError) {
      setProcesando(false);
      setError(updateError.message);
      return;
    }

    setProcesando(false);
    setMensaje("Venta cancelada. Las existencias se devolvieron.");
    await recargarBase(true);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
            Ventas
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Carrito y cobro</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Venta en estado <code className="font-mono text-xs">abierta</code>, cobro
            con <code className="font-mono text-xs">salida_venta</code> y cancelación
            con devolución a{" "}
            <code className="font-mono text-xs">existencias</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-lg border border-line bg-card px-3 py-2 font-medium hover:bg-background"
          >
            Inicio
          </Link>
          <button
            type="button"
            onClick={() => void cerrarSesion()}
            className="rounded-lg border border-line px-3 py-2 text-muted hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {error ? (
        <p
          className="rounded-2xl border border-danger/30 bg-danger-soft px-5 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {mensaje ? (
        <p
          className="rounded-2xl border border-accent/30 bg-accent-soft px-5 py-3 text-sm text-accent"
          role="status"
        >
          {mensaje}
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">Ticket actual</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Caja</span>
            <select
              value={cajaId}
              onChange={(e) => setCajaId(e.target.value)}
              disabled={procesando || Boolean(venta) || cajas.length === 0}
              className="rounded-lg border border-line bg-background px-3 py-2"
            >
              {cajas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          {!venta ? (
            <button
              type="button"
              onClick={() => void iniciarVenta()}
              disabled={procesando || cargando || cajas.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Iniciar venta
            </button>
          ) : (
            <p className="text-sm text-muted">
              Folio{" "}
              <strong className="text-foreground">{venta.folio ?? venta.id}</strong>
              {" · "}
              Total <strong className="text-foreground">{formatoMoneda(venta.total)}</strong>
            </p>
          )}
        </div>
        {cajas.length === 0 && !cargando ? (
          <p className="mt-3 text-sm text-muted">
            No hay cajas activas. Agrega una en el módulo de catálogos.
          </p>
        ) : null}
      </section>

      {venta ? (
        <>
          <section className="rounded-2xl border border-line bg-card px-5 py-6">
            <h2 className="text-lg font-semibold">Agregar al carrito</h2>
            {productos.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No hay productos con existencia disponible. Registra entradas en
                inventario antes de vender.
              </p>
            ) : (
              <form
                onSubmit={(e) => void agregarLinea(e)}
                className="mt-4 grid max-w-xl gap-4"
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Producto</span>
                  <select
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    disabled={procesando}
                    className="rounded-lg border border-line bg-background px-3 py-2"
                  >
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {etiquetaProducto(p.nombre, p.codigo)}
                        {p.precio != null ? ` — ${formatoMoneda(p.precio)}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Cantidad</span>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    value={cantidadLinea}
                    onChange={(e) => setCantidadLinea(e.target.value)}
                    disabled={procesando}
                    className="rounded-lg border border-line bg-background px-3 py-2"
                  />
                </label>
                <p className="text-xs text-muted">
                  Existencia:{" "}
                  <strong className="text-foreground">
                    {existencias.get(productoId) ?? 0}
                  </strong>
                </p>
                <button
                  type="submit"
                  disabled={procesando}
                  className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Agregar línea
                </button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-card px-5 py-6">
            <h2 className="text-lg font-semibold">Líneas del carrito</h2>
            {lineas.length === 0 ? (
              <p className="mt-3 text-sm text-muted">El carrito está vacío.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-muted">
                      <th className="py-2 pr-4 font-medium">Producto</th>
                      <th className="py-2 pr-4 font-medium">Cant.</th>
                      <th className="py-2 pr-4 font-medium">P. unit.</th>
                      <th className="py-2 pr-4 font-medium">Importe</th>
                      <th className="py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((linea) => {
                      const producto = linea.producto_id
                        ? productosPorId.get(linea.producto_id)
                        : null;
                      const importe = linea.cantidad * linea.precio_unitario;
                      return (
                        <tr key={linea.id} className="border-b border-line/70">
                          <td className="py-2 pr-4">
                            {producto
                              ? etiquetaProducto(producto.nombre, producto.codigo)
                              : "—"}
                          </td>
                          <td className="py-2 pr-4 font-mono tabular-nums">
                            {linea.cantidad}
                          </td>
                          <td className="py-2 pr-4 font-mono tabular-nums">
                            {formatoMoneda(linea.precio_unitario)}
                          </td>
                          <td className="py-2 pr-4 font-mono tabular-nums">
                            {formatoMoneda(importe)}
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => void quitarLinea(linea.id)}
                              disabled={procesando}
                              className="text-xs text-danger hover:underline disabled:opacity-60"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <form
              onSubmit={(e) => void cobrarVenta(e)}
              className="mt-6 flex max-w-xl flex-col gap-3 border-t border-line pt-6"
            >
              <h3 className="text-base font-semibold">Cobrar</h3>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Método de pago</span>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  disabled={procesando || lineas.length === 0}
                  className="rounded-lg border border-line bg-background px-3 py-2"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </label>
              <p className="text-sm">
                Total a cobrar:{" "}
                <strong className="text-lg">{formatoMoneda(venta.total)}</strong>
              </p>
              <button
                type="submit"
                disabled={procesando || lineas.length === 0}
                className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {procesando ? "Procesando…" : "Cobrar venta"}
              </button>
            </form>
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">Ventas cobradas recientes</h2>
        <p className="mt-1 text-sm text-muted">
          Cancelación con movimiento{" "}
          <code className="font-mono text-xs">cancelacion</code> y devolución de stock.
        </p>
        {ventasCobradas.length === 0 && !cargando ? (
          <p className="mt-3 text-sm text-muted">No hay ventas cobradas.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {ventasCobradas.map((v) => (
              <li
                key={v.id}
                className="flex flex-col gap-3 rounded-xl border border-line/70 bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {v.folio ?? v.id.slice(0, 8)}{" "}
                    <span className="text-muted">· {formatoFecha(v.created_at)}</span>
                  </p>
                  <p className="text-muted">{formatoMoneda(v.total)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void cancelarVenta(v.id)}
                  disabled={procesando}
                  className="rounded-lg border border-danger/40 px-3 py-2 text-sm font-medium text-danger disabled:opacity-60"
                >
                  Cancelar venta
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}