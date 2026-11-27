"use client";

import { CatalogoVentaCinepolis } from "@/components/pos/CatalogoVentaCinepolis";
import { PosLayout } from "@/components/pos/PosLayout";
import { PosOperacionHeader } from "@/components/pos/PosOperacionHeader";
import { TicketResumenVivo } from "@/components/pos/TicketResumenVivo";
import { VentasRecientesPanel } from "@/components/pos/VentasRecientesPanel";
import { ModalPagoStripe } from "@/components/ventas/ModalPagoStripe";
import { TIPO_PRODUCTO_COMBO } from "@/lib/catalogo/productos";
import {
  armarMenuVentaVisual,
  esIdComboEnCatalogo,
} from "@/lib/ventas/catalogoVentaVisual";
import {
  filtrarArticulosMenu,
  type FiltroCatalogoTab,
} from "@/lib/ventas/filtrosMenuCliente";
import {
  armarCombosParaVenta,
  esProductoCombo,
  notaLineaCombo,
  requerimientosInventario,
  salidasInventarioPorLinea,
  type ComboParaVenta,
  type ProductoVentaResumen,
} from "@/lib/ventas/combosEnVenta";
import { stripePublicadoEnCliente } from "@/lib/stripe/cliente";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

type Producto = ProductoVentaResumen;

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
      filasComboComponentes: {
        combo_id: string;
        producto_id: string;
        cantidad: number | string;
      }[];
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
  const [cajasRes, productosRes, comboCompRes, existenciasRes, cobradasRes, abiertaRes] =
    await Promise.all([
      client.from("cajas").select("id, nombre").eq("activa", true).order("nombre"),
      client
        .from("productos")
        .select("id, nombre, codigo, tipo, precio")
        .eq("activo", true)
        .order("nombre"),
      client.from("combo_componentes").select("combo_id, producto_id, cantidad"),
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
  if (comboCompRes.error) return { error: comboCompRes.error.message };
  if (existenciasRes.error) return { error: existenciasRes.error.message };
  if (cobradasRes.error) return { error: cobradasRes.error.message };

  const listaProductos = (productosRes.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    codigo: p.codigo,
    tipo: p.tipo,
    precio: p.precio == null ? null : Number(p.precio),
  }));

  return {
    listaCajas: cajasRes.data ?? [],
    listaProductos,
    filasComboComponentes: comboCompRes.data ?? [],
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
  const [catalogoProductos, setCatalogoProductos] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [combosVenta, setCombosVenta] = useState<ComboParaVenta[]>([]);
  const [componentesPorComboId, setComponentesPorComboId] = useState(
    () => new Map<string, { producto_id: string; cantidad: number }[]>(),
  );
  const [existencias, setExistencias] = useState<Map<string, number>>(new Map());
  const [venta, setVenta] = useState<VentaAbierta | null>(null);
  const [lineas, setLineas] = useState<VentaLinea[]>([]);
  const [ventasCobradas, setVentasCobradas] = useState<VentaCobrada[]>([]);

  const [articuloMenuId, setArticuloMenuId] = useState("");
  const [cantidadMenu, setCantidadMenu] = useState("1");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [pagoStripeAbierto, setPagoStripeAbierto] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [cancelarModal, setCancelarModal] = useState<{
    ventaId: string;
    folio: string | null;
    total: number;
    paso: 1 | 2;
  } | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [filtroQuery, setFiltroQuery] = useState("");
  const [filtroTab, setFiltroTab] = useState<FiltroCatalogoTab>("todos");

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

      const {
        listaCajas,
        listaProductos,
        filasComboComponentes,
        existenciasFilas,
        cobradas,
        ventaAbiertaId,
      } = datos;

      const mapExistencias = new Map(
        existenciasFilas.map((f) => [f.producto_id, Number(f.cantidad)]),
      );
      const productosConInventario = listaProductos.filter(
        (p) =>
          p.tipo !== TIPO_PRODUCTO_COMBO && (mapExistencias.get(p.id) ?? 0) > 0,
      );
      const { combos, componentesPorComboId: mapCombos } = armarCombosParaVenta(
        listaProductos,
        filasComboComponentes,
        mapExistencias,
      );
      const combosVendibles = combos.filter(
        (c) => c.componentes.length > 0 && c.precioUnitario != null,
      );

      setCajas(listaCajas);
      setCajaId((prev) => prev || listaCajas[0]?.id || "");
      setCatalogoProductos(listaProductos);
      setProductos(productosConInventario);
      setCombosVenta(combosVendibles);
      setComponentesPorComboId(mapCombos);
      const menuIds = [
        ...productosConInventario.map((p) => p.id),
        ...combosVendibles.map((c) => c.id),
      ];
      setArticuloMenuId((prev) =>
        prev && menuIds.includes(prev) ? prev : (menuIds[0] ?? ""),
      );
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

  const catalogoPorId = useMemo(
    () => new Map(catalogoProductos.map((p) => [p.id, p])),
    [catalogoProductos],
  );
  const tiposPorId = useMemo(
    () => new Map(catalogoProductos.map((p) => [p.id, p.tipo])),
    [catalogoProductos],
  );
  const productosPorId = catalogoPorId;
  const articulosMenu = useMemo(
    () => armarMenuVentaVisual(productos, combosVenta, existencias),
    [productos, combosVenta, existencias],
  );
  const articulosFiltrados = useMemo(
    () => filtrarArticulosMenu(articulosMenu, { query: filtroQuery, tab: filtroTab }),
    [articulosMenu, filtroQuery, filtroTab],
  );
  const lineasTicket = useMemo(
    () =>
      lineas.map((linea) => {
        const producto = linea.producto_id
          ? catalogoPorId.get(linea.producto_id)
          : null;
        return {
          id: linea.id,
          producto_id: linea.producto_id,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio_unitario,
          notas: linea.notas,
          etiqueta: producto
            ? etiquetaProducto(producto.nombre, producto.codigo)
            : "—",
        };
      }),
    [lineas, catalogoPorId],
  );

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
    setMensaje("Venta abierta. Agrega productos o combos al carrito.");
  }

  async function agregarArticuloAlPedido() {
    setMensaje(null);
    setError(null);

    if (!venta) {
      setError("Inicia una venta antes de agregar líneas.");
      return;
    }

    const menu = articulosMenu.find((a) => a.id === articuloMenuId);
    if (!menu) {
      setError("Elige un artículo del menú.");
      return;
    }

    const qty = Number(cantidadMenu);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }

    if (menu.esCombo) {
      await agregarComboAlPedido(menu.id, qty);
      return;
    }

    await agregarProductoAlPedido(menu.id, qty);
  }

  async function agregarComboAlPedido(comboIdLinea: string, qty: number) {
    if (!venta) {
      return;
    }
    const combo = combosVenta.find((c) => c.id === comboIdLinea);
    if (!combo) {
      setError("Elige un combo.");
      return;
    }
    if (combo.precioUnitario == null) {
      setError("El combo no tiene precio calculable (revisa precios de componentes).");
      return;
    }
    if (combo.componentes.length === 0) {
      setError("El combo no tiene componentes configurados.");
      return;
    }

    if (qty > combo.combosDisponibles) {
      setError(
        `Stock insuficiente para armar ${qty} combo(s). Máximo disponible: ${combo.combosDisponibles}.`,
      );
      return;
    }

    const notasCombo = notaLineaCombo(combo.descuentoPct, combo.numProductos);
    const lineaExistente = buscarLineaMisma(
      combo.id,
      combo.precioUnitario,
      notasCombo,
    );
    if (lineaExistente) {
      await actualizarCantidadLinea(lineaExistente, lineaExistente.cantidad + qty);
      setCantidadMenu("1");
      return;
    }

    setProcesando(true);

    const { data: linea, error: lineaError } = await supabase
      .from("venta_lineas")
      .insert({
        venta_id: venta.id,
        producto_id: combo.id,
        cantidad: qty,
        precio_unitario: combo.precioUnitario,
        notas: notasCombo,
      })
      .select("id, producto_id, cantidad, precio_unitario, notas")
      .single();

    if (lineaError || !linea) {
      setProcesando(false);
      setError(lineaError?.message ?? "No se pudo agregar el combo.");
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
    setCantidadMenu("1");
    setProcesando(false);
    setMensaje("Platillo agregado al pedido.");
  }

  async function agregarProductoAlPedido(productoIdLinea: string, qty: number) {
    if (!venta) {
      return;
    }
    const producto = productosPorId.get(productoIdLinea);
    if (!producto) {
      setError("Artículo no encontrado.");
      return;
    }
    if (producto.precio == null || producto.precio < 0) {
      setError("El artículo no tiene precio.");
      return;
    }

    const lineaExistente = buscarLineaMisma(producto.id, producto.precio, null);
    if (lineaExistente) {
      await actualizarCantidadLinea(lineaExistente, lineaExistente.cantidad + qty);
      setCantidadMenu("1");
      return;
    }

    setProcesando(true);

    const { data: linea, error: lineaError } = await supabase
      .from("venta_lineas")
      .insert({
        venta_id: venta!.id,
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
      await sincronizarTotal(venta!.id);
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
    setCantidadMenu("1");
    setProcesando(false);
    setMensaje("Artículo agregado al pedido.");
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

  function buscarLineaMisma(
    productoId: string,
    precioUnitario: number,
    notas: string | null,
  ): VentaLinea | undefined {
    return lineas.find(
      (l) =>
        l.producto_id === productoId &&
        l.precio_unitario === precioUnitario &&
        (l.notas ?? null) === (notas ?? null),
    );
  }

  async function actualizarCantidadLinea(linea: VentaLinea, nuevaCantidad: number) {
    if (!venta) {
      return;
    }
    if (nuevaCantidad <= 0) {
      await quitarLinea(linea.id);
      return;
    }
    if (!linea.producto_id) {
      return;
    }

    const esCombo = esIdComboEnCatalogo(linea.producto_id, catalogoProductos);
    if (esCombo) {
      const combo = combosVenta.find((c) => c.id === linea.producto_id);
      if (combo && nuevaCantidad > combo.combosDisponibles) {
        setError(
          `Stock insuficiente para armar ${nuevaCantidad} combo(s). Máximo disponible: ${combo.combosDisponibles}.`,
        );
        return;
      }
    } else {
      const stock = existencias.get(linea.producto_id) ?? 0;
      if (nuevaCantidad > stock) {
        const producto = productosPorId.get(linea.producto_id);
        const nombre = producto?.nombre ?? "producto";
        setError(
          `Stock insuficiente para ${nombre}. Disponible: ${stock}, pediste: ${nuevaCantidad}.`,
        );
        return;
      }
    }

    setMensaje(null);
    setError(null);
    setProcesando(true);

    const { error: updateError } = await supabase
      .from("venta_lineas")
      .update({ cantidad: nuevaCantidad })
      .eq("id", linea.id);

    if (updateError) {
      setProcesando(false);
      setError(updateError.message);
      return;
    }

    try {
      await sincronizarTotal(venta.id);
    } catch (e) {
      setProcesando(false);
      setError(e instanceof Error ? e.message : "Error al actualizar el total.");
      return;
    }

    setLineas((prev) =>
      prev.map((l) => (l.id === linea.id ? { ...l, cantidad: nuevaCantidad } : l)),
    );
    setProcesando(false);
    setMensaje("Cantidad actualizada.");
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

  async function completarCobroEnSupabase(total: number, metodoRegistro: string) {
    if (!venta) {
      return;
    }

    const { error: pagoError } = await supabase.from("pagos").insert({
      venta_id: venta.id,
      metodo: metodoRegistro,
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

      const esCombo = esProductoCombo(tiposPorId.get(linea.producto_id));
      const salidas = salidasInventarioPorLinea(
        { producto_id: linea.producto_id, cantidad: linea.cantidad },
        esCombo,
        componentesPorComboId.get(linea.producto_id),
      );
      const notaBase = esCombo
        ? `Venta combo ${catalogoPorId.get(linea.producto_id)?.nombre ?? linea.producto_id}`
        : `Venta ${venta.folio ?? venta.id}`;

      for (const salida of salidas) {
        const { error: movError } = await supabase.from("movimientos_inventario").insert({
          producto_id: salida.producto_id,
          caja_id: cajaId || venta.caja_id,
          venta_id: venta.id,
          tipo: "salida_venta",
          cantidad: salida.cantidad,
          nota: notaBase,
        });

        if (movError) {
          setProcesando(false);
          setError(movError.message);
          return;
        }

        try {
          await actualizarExistencia(salida.producto_id, -salida.cantidad);
        } catch (e) {
          setProcesando(false);
          setError(e instanceof Error ? e.message : "Error al actualizar existencias.");
          return;
        }
      }
    }

    setProcesando(false);
    setMensaje(`Venta cobrada. Total: ${formatoMoneda(total)}`);
    setVenta(null);
    setLineas([]);
    await recargarBase(true);
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

    const requerido = requerimientosInventario(
      lineas,
      tiposPorId,
      componentesPorComboId,
    );
    for (const [productoInventarioId, necesario] of requerido) {
      const stock = existencias.get(productoInventarioId) ?? 0;
      if (stock < necesario) {
        const nombre =
          catalogoPorId.get(productoInventarioId)?.nombre ?? productoInventarioId;
        setError(
          `Stock insuficiente para ${nombre}. Necesario: ${necesario}, disponible: ${stock}.`,
        );
        return;
      }
    }

    const total = venta.total;
    const metodo = metodoPago.trim() || "efectivo";

    if (metodo === "tarjeta" && stripePublicadoEnCliente()) {
      setPagoStripeAbierto(true);
      return;
    }

    setProcesando(true);
    await completarCobroEnSupabase(total, metodo);
  }

  async function alConfirmarStripe(paymentIntentId: string) {
    if (!venta) {
      return;
    }
    setPagoStripeAbierto(false);
    setProcesando(true);
    const metodo = `tarjeta (${paymentIntentId})`;
    await completarCobroEnSupabase(venta.total, metodo);
  }

  function abrirModalCancelar(venta: VentaCobrada) {
    setMotivoCancelacion("");
    setCancelarModal({
      ventaId: venta.id,
      folio: venta.folio,
      total: venta.total,
      paso: 1,
    });
  }

  function cerrarModalCancelar() {
    setCancelarModal(null);
    setMotivoCancelacion("");
  }

  async function cancelarVenta(ventaId: string, motivo: string | null) {
    setMensaje(null);
    setError(null);
    cerrarModalCancelar();

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
      const esCombo = esProductoCombo(tiposPorId.get(linea.producto_id));
      const salidas = salidasInventarioPorLinea(
        { producto_id: linea.producto_id, cantidad: qty },
        esCombo,
        componentesPorComboId.get(linea.producto_id),
      );

      for (const salida of salidas) {
        const { error: movError } = await supabase.from("movimientos_inventario").insert({
          producto_id: salida.producto_id,
          caja_id: ventaData.caja_id,
          venta_id: ventaId,
          tipo: "cancelacion",
          cantidad: salida.cantidad,
          nota: `Cancelación ${ventaData.folio ?? ventaId}`,
        });

        if (movError) {
          setProcesando(false);
          setError(movError.message);
          return;
        }

        try {
          await actualizarExistencia(salida.producto_id, salida.cantidad);
        } catch (e) {
          setProcesando(false);
          setError(e instanceof Error ? e.message : "Error al devolver existencias.");
          return;
        }
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

  async function agregarUnidadDesdeLinea(linea: VentaLinea) {
    await actualizarCantidadLinea(linea, linea.cantidad + 1);
  }

  async function decrementarLinea(linea: VentaLinea) {
    await actualizarCantidadLinea(linea, linea.cantidad - 1);
  }

  return (
    <div className="flex flex-col gap-3">
      <PosOperacionHeader
        cajas={cajas}
        cajaId={cajaId}
        onCajaChange={setCajaId}
        venta={venta}
        procesando={procesando}
        emailUsuario={session.user.email ?? null}
        query={filtroQuery}
        onQueryChange={setFiltroQuery}
        tab={filtroTab}
        onTabChange={setFiltroTab}
        onIniciarVenta={() => void iniciarVenta()}
        formatoMoneda={formatoMoneda}
        cargando={cargando}
      />

      {error ? (
        <p role="alert" className="cine-banner-error px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      {mensaje ? (
        <p role="status" className="cine-banner-ok px-4 py-3 text-sm">
          {mensaje}
        </p>
      ) : null}

      {cajas.length === 0 && !cargando ? (
        <p className="text-sm text-muted">
          No hay cajas activas. Agrega una en el módulo de catálogos.
        </p>
      ) : null}

      <PosLayout
        catalogo={
          venta ? (
            <CatalogoVentaCinepolis
              articulos={articulosFiltrados}
              articuloId={articuloMenuId}
              onArticuloIdChange={setArticuloMenuId}
              cantidad={cantidadMenu}
              onCantidadChange={setCantidadMenu}
              onAgregar={() => void agregarArticuloAlPedido()}
              formatoMoneda={formatoMoneda}
              procesando={procesando}
            />
          ) : (
            <div className="cine-panel px-5 py-12 text-center text-sm text-muted">
              Abre caja para ver el catálogo y agregar artículos.
            </div>
          )
        }
        ticket={
          <TicketResumenVivo
            folio={venta?.folio ?? null}
            ventaId={venta?.id ?? ""}
            lineas={lineasTicket}
            total={venta?.total ?? 0}
            metodoPago={metodoPago}
            onMetodoPagoChange={setMetodoPago}
            onCobrar={(e) => void cobrarVenta(e)}
            onDecrementarLinea={(linea) => {
              const original = lineas.find((l) => l.id === linea.id);
              if (original) {
                void decrementarLinea(original);
              }
            }}
            onAgregarUnidad={(linea) => {
              const original = lineas.find((l) => l.id === linea.id);
              if (original) {
                void agregarUnidadDesdeLinea(original);
              }
            }}
            procesando={procesando}
            formatoMoneda={formatoMoneda}
            ventaAbierta={Boolean(venta)}
          />
        }
        inferior={
          <VentasRecientesPanel
            ventas={ventasCobradas.map((v) => ({
              ...v,
              etiquetaFecha: formatoFecha(v.created_at),
            }))}
            cargando={cargando}
            procesando={procesando}
            onCancelar={(v) =>
              abrirModalCancelar({
                id: v.id,
                folio: v.folio,
                total: v.total,
                created_at: v.created_at,
              })
            }
            formatoMoneda={formatoMoneda}
          />
        }
      />

      {pagoStripeAbierto && venta ? (
        <ModalPagoStripe
          ventaId={venta.id}
          montoMxn={venta.total}
          formatoMoneda={formatoMoneda}
          onExito={(id) => void alConfirmarStripe(id)}
          onCerrar={() => setPagoStripeAbierto(false)}
        />
      ) : null}

      {cancelarModal ? (
        <div
          className="overlay-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onClick={cerrarModalCancelar}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelar-pedido-titulo"
            className="cine-panel w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {cancelarModal.paso === 1 ? (
              <>
                <h2
                  id="cancelar-pedido-titulo"
                  className="text-lg font-semibold text-foreground"
                >
                  ¿Seguro que deseas cancelar tu pedido?
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Pedido{" "}
                  <span className="font-medium text-foreground">
                    {cancelarModal.folio ?? cancelarModal.ventaId.slice(0, 8)}
                  </span>{" "}
                  · {formatoMoneda(cancelarModal.total)}
                </p>
                <p className="mt-3 text-sm text-muted">
                  Se devolverá el inventario y la venta quedará como cancelada.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={cerrarModalCancelar}
                    className="cine-btn-secondary px-4 py-2 text-sm"
                  >
                    No, volver
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCancelarModal((prev) =>
                        prev ? { ...prev, paso: 2 } : prev,
                      )
                    }
                    className="cine-btn-primary px-4 py-2 text-sm"
                  >
                    Sí, continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2
                  id="cancelar-pedido-titulo"
                  className="text-lg font-semibold text-foreground"
                >
                  Confirmar cancelación
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Última confirmación. Esta acción no se puede deshacer.
                </p>
                <label className="mt-4 flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Motivo (opcional)</span>
                  <textarea
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    rows={3}
                    className="rounded-lg border border-line bg-background px-3 py-2 text-sm"
                    placeholder="Ej. error en el ticket, cliente desistió…"
                  />
                </label>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCancelarModal((prev) =>
                        prev ? { ...prev, paso: 1 } : prev,
                      )
                    }
                    className="cine-btn-secondary px-4 py-2 text-sm"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() =>
                      void cancelarVenta(
                        cancelarModal.ventaId,
                        motivoCancelacion.trim() || null,
                      )
                    }
                    className="cine-btn-primary !bg-danger px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {procesando ? "Cancelando…" : "Confirmar cancelación"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}