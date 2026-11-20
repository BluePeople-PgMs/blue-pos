"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VentasPosLayout } from "@/components/ventas/ventas-pos-layout";
import { useRol } from "@/components/contexto/RolContext";
import {
  actualizarCantidadLinea,
  agregarLinea,
  cancelarVentaAbierta,
  eliminarLineaVenta,
  cancelarVentaCobrada,
  cobrarVenta,
  crearVentaAbierta,
  existenciasDeLineas,
  leerCatalogoVentas,
  leerVenta,
  listarVentas,
  resumenCambiosExistencia,
  type MetodoPago,
  type ProductoVenta,
  type VentaDetalle,
  type VentaLista,
} from "@/lib/ventas";

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

function etiquetaMetodo(metodo: string) {
  if (metodo === "efectivo") return "Efectivo";
  if (metodo === "tarjeta") return "Tarjeta";
  if (metodo === "transferencia") return "Transferencia";
  return metodo;
}

function textoResumenExistencia(
  cambios: ReturnType<typeof resumenCambiosExistencia>,
) {
  if (cambios.length === 0) return "";
  return cambios
    .map(
      (c) =>
        `${c.nombre}: ${textoCantidad(c.anterior)} → ${textoCantidad(c.siguiente)}`,
    )
    .join(" · ");
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

type FiltroLista = "todas" | VentaLista["estado"];
type TonoMensaje = "info" | "ok" | "error";

function InsigniaEstado({ estado }: { estado: VentaLista["estado"] }) {
  const base =
    "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide";
  if (estado === "abierta") {
    return (
      <span className={`${base} bg-olive-soft text-olive`}>Abierta</span>
    );
  }
  if (estado === "cobrada") {
    return (
      <span className={`${base} bg-accent-soft text-accent`}>Pagada</span>
    );
  }
  return (
    <span className={`${base} bg-background text-muted ring-1 ring-line`}>
      Cancelada
    </span>
  );
}

const METODOS: { id: MetodoPago; titulo: string; detalle: string }[] = [
  { id: "efectivo", titulo: "Efectivo", detalle: "Caja" },
  { id: "tarjeta", titulo: "Tarjeta", detalle: "Terminal" },
  { id: "transferencia", titulo: "Transferencia", detalle: "SPEI" },
];

export function VentasVista() {
  const { esAdministrador } = useRol();
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [puedeOperar, setPuedeOperar] = useState(false);
  const [productos, setProductos] = useState<ProductoVenta[]>([]);
  const [ventas, setVentas] = useState<VentaLista[]>([]);
  const [ventaId, setVentaId] = useState<string | null>(null);
  const [venta, setVenta] = useState<VentaDetalle | null>(null);
  const [productoId, setProductoId] = useState("");
  const [notasLinea, setNotasLinea] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tonoMensaje, setTonoMensaje] = useState<TonoMensaje>("info");
  const [enlaceInventario, setEnlaceInventario] = useState(false);
  const [filtroLista, setFiltroLista] = useState<FiltroLista>("todas");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [tipoCatalogo, setTipoCatalogo] = useState<
    "todos" | "comidas" | "empacados"
  >("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const recargar = useCallback(async () => {
    const [catalogo, lista] = await Promise.all([
      leerCatalogoVentas(),
      listarVentas(),
    ]);
    setAviso(catalogo.error ?? lista.error);
    setPuedeOperar(!catalogo.error && !lista.error);
    setProductos(catalogo.productos);
    setVentas(lista.ventas);
    setCargando(false);
  }, []);

  const cargarVenta = useCallback(async (id: string) => {
    const { error, venta: detalle } = await leerVenta(id);
    if (error) {
      setMensaje(error);
      setTonoMensaje("error");
      setVenta(null);
      return;
    }
    setVenta(detalle);
  }, []);

  useEffect(() => {
    let activo = true;
    void (async () => {
      const [catalogo, lista] = await Promise.all([
        leerCatalogoVentas(),
        listarVentas(),
      ]);
      if (!activo) return;
      setAviso(catalogo.error ?? lista.error);
      setPuedeOperar(!catalogo.error && !lista.error);
      setProductos(catalogo.productos);
      setVentas(lista.ventas);
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const ventasVisibles = useMemo(() => {
    if (filtroLista === "todas") return ventas;
    return ventas.filter((v) => v.estado === filtroLista);
  }, [ventas, filtroLista]);

  const categoriasMenu = useMemo(() => {
    const nombres = new Set(
      productos.map((p) => p.categoria || "General").filter(Boolean),
    );
    return [...nombres].sort((a, b) => a.localeCompare(b, "es"));
  }, [productos]);

  const productosMenu = useMemo(() => {
    const consulta = normalizar(busquedaProducto.trim());
    let base = productos.filter((p) => {
      if (tipoCatalogo === "comidas" && p.tipo !== "preparado") return false;
      if (tipoCatalogo === "empacados" && p.tipo !== "directo") return false;
      if (
        categoriaFiltro !== "todas" &&
        (p.categoria || "General") !== categoriaFiltro
      ) {
        return false;
      }
      return true;
    });
    if (consulta) {
      base = base.filter(
        (p) =>
          normalizar(p.nombre).includes(consulta) ||
          normalizar(p.codigo).includes(consulta),
      );
    } else {
      base = base.filter((p) => p.existencia > 0);
    }
    return base;
  }, [productos, busquedaProducto, tipoCatalogo, categoriaFiltro]);

  function publicarMensaje(texto: string, tono: TonoMensaje, inventario = false) {
    setMensaje(texto);
    setTonoMensaje(tono);
    setEnlaceInventario(inventario);
  }

  async function seleccionarVenta(id: string) {
    setVentaId(id);
    setMensaje(null);
    await cargarVenta(id);
  }

  async function nuevaVenta() {
    setMensaje(null);
    setEnviando(true);
    const { error, ventaId: id } = await crearVentaAbierta(null);
    setEnviando(false);
    if (error || !id) {
      publicarMensaje(error ?? "No se creó la venta.", "error");
      return;
    }
    await recargar();
    await seleccionarVenta(id);
    setFiltroLista("abierta");
    publicarMensaje(
      "Venta nueva lista. Busca un producto y agrégalo al carrito.",
      "ok",
    );
  }

  async function cambiarCantidadLinea(lineaId: string, cantidad: number) {
    if (!ventaId) return;
    setEnviando(true);
    const { error } = await actualizarCantidadLinea({
      ventaId,
      lineaId,
      cantidad,
    });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    await recargar();
    await cargarVenta(ventaId);
  }

  async function quitarLinea(lineaId: string) {
    if (!ventaId) return;
    setEnviando(true);
    const { error } = await eliminarLineaVenta({ ventaId, lineaId });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje("Línea quitada del carrito.", "ok");
  }

  async function agregarProductoRapido(producto: ProductoVenta) {
    if (!ventaId) {
      publicarMensaje("Abre o selecciona una venta abierta.", "error");
      return;
    }
    if (venta?.estado !== "abierta") {
      publicarMensaje("Solo puedes agregar líneas a ventas abiertas.", "error");
      return;
    }
    if (producto.existencia <= 0 && !busquedaProducto.trim()) {
      publicarMensaje(
        `Sin existencia suficiente de ${producto.nombre}.`,
        "error",
      );
      return;
    }
    setProductoId(producto.id);
    setEnviando(true);
    const { error } = await agregarLinea({
      ventaId,
      productoId: producto.id,
      cantidad: 1,
      notas: notasLinea.trim() ? notasLinea : "",
    });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje(`${producto.nombre} agregado al pedido.`, "ok");
  }

  async function cobrar() {
    if (!ventaId || !venta) return;
    setEnlaceInventario(false);
    const antes = await existenciasDeLineas(venta.lineasDetalle);
    setEnviando(true);
    const { error } = await cobrarVenta({ ventaId, metodo });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    const despues = await existenciasDeLineas(venta.lineasDetalle);
    const cambios = resumenCambiosExistencia(
      venta.lineasDetalle,
      antes.cantidades,
      despues.cantidades,
    );
    const resumen = textoResumenExistencia(cambios);
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje(
      resumen
        ? `¡Cobrado! Inventario: ${resumen}.`
        : "¡Cobrado! El inventario ya restó las existencias.",
      "ok",
      true,
    );
  }

  async function cancelarAbierta() {
    if (!ventaId) return;
    setEnviando(true);
    const { error } = await cancelarVentaAbierta(ventaId);
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje(
      "Venta cancelada antes del cobro (sin movimiento en inventario).",
      "info",
    );
  }

  async function cancelarCobrada() {
    if (!ventaId || !venta) return;
    setEnlaceInventario(false);
    const antes = await existenciasDeLineas(venta.lineasDetalle);
    setEnviando(true);
    const { error } = await cancelarVentaCobrada({
      ventaId,
      motivo: motivo,
    });
    setEnviando(false);
    if (error) {
      publicarMensaje(error, "error");
      return;
    }
    const despues = await existenciasDeLineas(venta.lineasDetalle);
    const cambios = resumenCambiosExistencia(
      venta.lineasDetalle,
      antes.cantidades,
      despues.cantidades,
    );
    const resumen = textoResumenExistencia(cambios);
    setMotivo("");
    await recargar();
    await cargarVenta(ventaId);
    publicarMensaje(
      resumen
        ? `Venta cancelada. Existencias: ${resumen}.`
        : "Venta cancelada. La existencia se devolvió.",
      "ok",
      true,
    );
  }

  if (cargando) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-card px-6 py-10 text-center"
      >
        <p className="text-sm text-muted">Preparando captura de pedidos…</p>
      </div>
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

      {mensaje ? (
        <div
          role="status"
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-sm ${
            tonoMensaje === "ok"
              ? "border-olive/25 bg-olive-soft text-foreground"
              : tonoMensaje === "error"
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-line bg-card text-muted"
          }`}
        >
          <span>{mensaje}</span>
          {enlaceInventario ? (
            <Link
              href="/inventario"
              className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              Ver inventario
            </Link>
          ) : null}
        </div>
      ) : null}

      <VentasPosLayout
        ventasVisibles={ventasVisibles}
        ventaId={ventaId}
        venta={venta}
        filtroLista={filtroLista}
        setFiltroLista={setFiltroLista}
        puedeOperar={puedeOperar}
        enviando={enviando}
        onNuevaVenta={() => void nuevaVenta()}
        onSeleccionarVenta={(id) => void seleccionarVenta(id)}
        busquedaProducto={busquedaProducto}
        setBusquedaProducto={setBusquedaProducto}
        tipoCatalogo={tipoCatalogo}
        setTipoCatalogo={setTipoCatalogo}
        categoriaFiltro={categoriaFiltro}
        setCategoriaFiltro={setCategoriaFiltro}
        categoriasMenu={categoriasMenu}
        productosMenu={productosMenu}
        productoId={productoId}
        notasLinea={notasLinea}
        setNotasLinea={setNotasLinea}
        metodo={metodo}
        setMetodo={setMetodo}
        motivo={motivo}
        setMotivo={setMotivo}
        esAdministrador={esAdministrador}
        onAgregarRapido={(p) => void agregarProductoRapido(p)}
        onCambiarCantidad={(lineaId, cantidad) =>
          void cambiarCantidadLinea(lineaId, cantidad)
        }
        onQuitarLinea={(lineaId) => void quitarLinea(lineaId)}
        onCobrar={() => void cobrar()}
        onCancelarAbierta={() => void cancelarAbierta()}
        onCancelarCobrada={() => void cancelarCobrada()}
        dinero={dinero}
        textoCantidad={textoCantidad}
        etiquetaMetodo={etiquetaMetodo}
        InsigniaEstado={InsigniaEstado}
        METODOS={METODOS}
      />
    </div>
  );
}