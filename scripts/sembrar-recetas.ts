import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { recetas } from "../src/data/recetas-italiano.ts";

function leerEnvLocal() {
  const texto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const valores = new Map<string, string>();
  for (const linea of texto.split("\n")) {
    const limpio = linea.trim();
    if (!limpio || limpio.startsWith("#")) continue;
    const corte = limpio.indexOf("=");
    if (corte === -1) continue;
    valores.set(limpio.slice(0, corte), limpio.slice(corte + 1));
  }
  return valores;
}

async function main() {
  const env = leerEnvLocal();
  const url = env.get("NEXT_PUBLIC_SUPABASE_URL");
  const key = env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    throw new Error("Faltan las variables en .env.local");
  }

  const supabase = createClient(url, key);

  const { data: productos, error: productosError } = await supabase
    .from("productos")
    .select("id, codigo, nombre, tipo");
  if (productosError) {
    throw new Error(mensajeLegible(productosError.message));
  }

  const idPorCodigo = new Map<string, string>();
  const nombrePorCodigo = new Map<string, string>();
  for (const producto of productos ?? []) {
    if (producto.codigo) {
      idPorCodigo.set(producto.codigo, producto.id);
      nombrePorCodigo.set(producto.codigo, producto.nombre);
    }
  }

  const { data: recetasActuales, error: recetasError } = await supabase
    .from("recetas")
    .select("id, producto_id");
  if (recetasError) throw new Error(recetasError.message);

  const recetaIdPorProducto = new Map(
    (recetasActuales ?? []).map((fila) => [fila.producto_id, fila.id]),
  );

  let recetasNuevas = 0;
  let lineasNuevas = 0;

  for (const semilla of recetas) {
    const platoId = idPorCodigo.get(semilla.platoCodigo);
    if (!platoId) {
      throw new Error(
        `No está en la base el plato ${semilla.platoCodigo}. Corre npm run sembrar:catalogo.`,
      );
    }

    let recetaId = recetaIdPorProducto.get(platoId);
    const nombre =
      nombrePorCodigo.get(semilla.platoCodigo) ?? semilla.platoCodigo;

    if (!recetaId) {
      const { data, error } = await supabase
        .from("recetas")
        .insert({
          producto_id: platoId,
          nombre,
          rendimiento: 1,
        })
        .select("id")
        .single();
      if (error) throw new Error(`recetas: ${error.message}`);
      recetaId = data.id;
      recetaIdPorProducto.set(platoId, recetaId);
      recetasNuevas += 1;
    } else {
      const { error } = await supabase
        .from("recetas")
        .update({ nombre, rendimiento: 1 })
        .eq("id", recetaId);
      if (error) throw new Error(`recetas: ${error.message}`);
    }

    const { error: borrarError } = await supabase
      .from("receta_insumos")
      .delete()
      .eq("receta_id", recetaId);
    if (borrarError) throw new Error(`receta_insumos: ${borrarError.message}`);

    const filas = semilla.lineas.map((linea) => {
      const insumoId = idPorCodigo.get(linea.insumoCodigo);
      if (!insumoId) {
        throw new Error(
          `Falta insumo ${linea.insumoCodigo} en productos. Corre sembrar:catalogo.`,
        );
      }
      return {
        receta_id: recetaId,
        insumo_id: insumoId,
        cantidad: linea.cantidad,
      };
    });

    for (let inicio = 0; inicio < filas.length; inicio += 40) {
      const lote = filas.slice(inicio, inicio + 40);
      const { error } = await supabase.from("receta_insumos").insert(lote);
      if (error) throw new Error(`receta_insumos: ${error.message}`);
    }
    lineasNuevas += filas.length;
  }

  console.log(
    `Listo. ${recetas.length} recetas (${recetasNuevas} nuevas), ${lineasNuevas} líneas de insumo.`,
  );
  console.log(
    "Existencias: aplica la migración 20261120183000_existencias_iniciales_italiano.sql o registra entradas en /inventario.",
  );
}

function mensajeLegible(mensaje: string) {
  if (mensaje.includes("<!DOCTYPE") || mensaje.includes("522")) {
    return "Supabase no respondió (timeout). Intenta de nuevo en unos minutos.";
  }
  if (mensaje.length > 200) {
    return "Supabase devolvió una respuesta inesperada.";
  }
  return mensaje;
}

main().catch((error: unknown) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error(mensaje);
  process.exit(1);
});