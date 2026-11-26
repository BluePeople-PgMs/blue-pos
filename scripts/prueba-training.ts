/**
 * Prueba automática local ↔ Supabase (checklist capacitación Kratos).
 * Usa un producto tipo `directo` con existencia. Opcional: cancelar tras cobrar.
 *
 * Credenciales (en .env.local, no commitear):
 *   PRUEBA_TRAINING_EMAIL=
 *   PRUEBA_TRAINING_PASSWORD=
 * Si faltan, intenta registrar un usuario nuevo (requiere correo sin confirmación).
 */
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function leerEnvLocal() {
  const texto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const valores = new Map<string, string>();
  for (const linea of texto.split("\n")) {
    const limpio = linea.trim();
    if (!limpio || limpio.startsWith("#")) continue;
    const corte = limpio.indexOf("=");
    if (corte === -1) continue;
    valores.set(limpio.slice(0, corte), limpio.slice(corte + 1).trim());
  }
  return valores;
}

async function sincronizarTotal(supabase: SupabaseClient, ventaId: string) {
  const { data: lineas, error } = await supabase
    .from("venta_lineas")
    .select("cantidad, precio_unitario")
    .eq("venta_id", ventaId);
  if (error) throw new Error(error.message);
  const total = (lineas ?? []).reduce(
    (acc, fila) =>
      acc + Number(fila.cantidad) * Number(fila.precio_unitario),
    0,
  );
  const { error: up } = await supabase
    .from("ventas")
    .update({ total })
    .eq("id", ventaId);
  if (up) throw new Error(up.message);
  return total;
}

async function obtenerSesion(supabase: SupabaseClient, env: Map<string, string>) {
  const email = env.get("PRUEBA_TRAINING_EMAIL");
  const password = env.get("PRUEBA_TRAINING_PASSWORD");

  if (email && password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session) {
      throw new Error(error?.message ?? "No hubo sesión tras signIn.");
    }
    return { email, userId: data.user.id };
  }

  const nuevo = `capacitacion.kratos+${Date.now()}@bluepeople.com`;
  const clave = "KratosCap2026!";
  const { data, error } = await supabase.auth.signUp({
    email: nuevo,
    password: clave,
  });
  if (error) {
    throw new Error(
      `${error.message}. Añade PRUEBA_TRAINING_EMAIL y PRUEBA_TRAINING_PASSWORD a .env.local o desactiva confirmación de correo.`,
    );
  }
  if (!data.session) {
    throw new Error(
      "Registro sin sesión (confirmación de correo activa). Usa PRUEBA_TRAINING_EMAIL/PASSWORD o npm run auth:sin-confirmacion.",
    );
  }
  console.log(
    `Usuario de prueba creado: ${nuevo} (guarda la clave en .env.local si la reutilizas).`,
  );
  return { email: nuevo, userId: data.user!.id };
}

async function elegirProductoDirecto(supabase: SupabaseClient) {
  const { data: productos, error } = await supabase
    .from("productos")
    .select("id, nombre, codigo, precio, tipo")
    .eq("activo", true)
    .eq("tipo", "directo")
    .limit(30);
  if (error) throw new Error(error.message);

  for (const producto of productos ?? []) {
    const { data: ex } = await supabase
      .from("existencias")
      .select("cantidad")
      .eq("producto_id", producto.id)
      .maybeSingle();
    const stock = Number(ex?.cantidad ?? 0);
    if (stock >= 2) {
      return { ...producto, stock };
    }
  }
  throw new Error("No hay producto directo con existencia >= 2.");
}

async function cobrarDirecto(
  supabase: SupabaseClient,
  ventaId: string,
  folio: string,
  productoId: string,
  cantidad: number,
  total: number,
) {
  const { error: pagoError } = await supabase.from("pagos").insert({
    venta_id: ventaId,
    metodo: "efectivo",
    monto: total,
  });
  if (pagoError) throw new Error(pagoError.message);

  const { error: estadoError } = await supabase
    .from("ventas")
    .update({ estado: "cobrada" })
    .eq("id", ventaId);
  if (estadoError) throw new Error(estadoError.message);

  const { data: existencia, error: leerError } = await supabase
    .from("existencias")
    .select("id, cantidad")
    .eq("producto_id", productoId)
    .maybeSingle();
  if (leerError) throw new Error(leerError.message);
  if (!existencia) throw new Error("Sin fila de existencia.");

  const anterior = Number(existencia.cantidad);
  const siguiente = anterior - cantidad;
  if (siguiente < 0) throw new Error("Stock insuficiente.");

  const { error: upEx } = await supabase
    .from("existencias")
    .update({ cantidad: siguiente })
    .eq("id", existencia.id);
  if (upEx) throw new Error(upEx.message);

  const { error: movError } = await supabase.from("movimientos_inventario").insert({
    producto_id: productoId,
    venta_id: ventaId,
    tipo: "salida_venta",
    cantidad,
    nota: `Cobro folio ${folio}`,
  });
  if (movError) throw new Error(movError.message);

  return { anterior, siguiente };
}

async function cancelarCobrada(supabase: SupabaseClient, ventaId: string) {
  const motivo = "Prueba automática capacitación";
  const { error: cancelError } = await supabase.from("cancelaciones").insert({
    venta_id: ventaId,
    motivo,
  });
  if (cancelError) throw new Error(cancelError.message);

  const { data: salidas, error: salidasError } = await supabase
    .from("movimientos_inventario")
    .select("producto_id, cantidad")
    .eq("venta_id", ventaId)
    .eq("tipo", "salida_venta");
  if (salidasError) throw new Error(salidasError.message);

  for (const salida of salidas ?? []) {
    const cantidad = Number(salida.cantidad);
    const { data: existencia, error: leerError } = await supabase
      .from("existencias")
      .select("id, cantidad")
      .eq("producto_id", salida.producto_id)
      .maybeSingle();
    if (leerError) throw new Error(leerError.message);
    const siguiente = Number(existencia?.cantidad ?? 0) + cantidad;
    if (existencia) {
      const { error } = await supabase
        .from("existencias")
        .update({ cantidad: siguiente })
        .eq("id", existencia.id);
      if (error) throw new Error(error.message);
    }
    const { error: movError } = await supabase.from("movimientos_inventario").insert({
      producto_id: salida.producto_id,
      venta_id: ventaId,
      tipo: "cancelacion",
      cantidad,
      nota: motivo,
    });
    if (movError) throw new Error(movError.message);
  }

  const { error: estadoError } = await supabase
    .from("ventas")
    .update({ estado: "cancelada" })
    .eq("id", ventaId);
  if (estadoError) throw new Error(estadoError.message);
}

async function main() {
  const completo = process.argv.includes("--completo");
  const env = leerEnvLocal();
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const key = env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o publishable en .env.local");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { email, userId } = await obtenerSesion(supabase, env);
  const producto = await elegirProductoDirecto(supabase);

  const folio = `TRAIN-${Date.now().toString(36).toUpperCase()}`;
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({ folio, estado: "abierta", total: 0, caja_id: null })
    .select("id")
    .single();
  if (ventaError) throw new Error(ventaError.message);

  const cantidad = 1;
  const precio = Number(producto.precio ?? 0);
  const { error: lineaError } = await supabase.from("venta_lineas").insert({
    venta_id: venta.id,
    producto_id: producto.id,
    cantidad,
    precio_unitario: precio,
  });
  if (lineaError) throw new Error(lineaError.message);

  const total = await sincronizarTotal(supabase, venta.id);
  const stock = await cobrarDirecto(
    supabase,
    venta.id,
    folio,
    producto.id,
    cantidad,
    total,
  );

  if (completo) {
    await cancelarCobrada(supabase, venta.id);
  }

  const { count: movCount } = await supabase
    .from("movimientos_inventario")
    .select("id", { count: "exact", head: true })
    .eq("venta_id", venta.id);

  const ref = url.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "proyecto";

  console.log("\n--- Prueba capacitación OK ---");
  console.log(`Supabase: ${ref}`);
  console.log(`Usuario: ${email} (${userId})`);
  console.log(`Venta: ${folio} → ${completo ? "cancelada" : "cobrada"} · total $${total}`);
  console.log(
    `Producto: ${producto.codigo} ${producto.nombre} · existencia ${stock.anterior} → ${completo ? stock.anterior : stock.siguiente}`,
  );
  console.log(`Movimientos con venta_id: ${movCount ?? "?"}`);
  console.log("\nMensaje PM (copiar):");
  console.log(
    `Solo · rama slytherin-kratos · Supabase Kratos (${ref}) · app local conectada · prueba venta ${folio} ${completo ? "cobrada+cancelada" : "cobrada"} OK.`,
  );
}

main().catch((error) => {
  console.error("Prueba falló:", error instanceof Error ? error.message : error);
  process.exit(1);
});