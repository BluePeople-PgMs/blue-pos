#!/usr/bin/env node
/**
 * Crea esquema + catálogo en el proyecto Supabase de .env.local
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *   SUPABASE_DB_PASSWORD   (Settings → Database en el dashboard)
 *
 * Uso: npm run provision:supabase
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function parseEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    throw new Error("Falta .env.local");
  }
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

function projectRefFromUrl(url) {
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!m) throw new Error("URL de Supabase inválida");
  return m[1];
}

async function ejecutarSqlArchivo(client, rutaRel) {
  const sql = readFileSync(join(root, rutaRel), "utf8");
  console.log(`→ SQL ${rutaRel} (${sql.length} bytes)`);
  await client.query(sql);
}

async function aplicarEsquema(password, projectRef) {
  const pg = await import("pg");
  const client = new pg.default.Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const { rows } = await client.query(
      "select to_regclass('public.categorias') as t",
    );
    if (rows[0]?.t) {
      console.log("Esquema ya presente (categorias existe). Omito bootstrap.");
    } else {
      await ejecutarSqlArchivo(client, "supabase/bootstrap-proyecto-completo.sql");
      console.log("✓ Esquema aplicado");
    }
    try {
      await ejecutarSqlArchivo(client, "supabase/seed-datos-base.sql");
      console.log("✓ Datos base (cajas, categorías, unidades)");
    } catch (e) {
      if (String(e.message).includes("duplicate") || String(e).includes("23505")) {
        console.log("Datos base ya existían o parcialmente cargados.");
      } else {
        throw e;
      }
    }
  } finally {
    await client.end();
  }
}

function slugToNombre(archivo) {
  const base = archivo.replace(/\.svg$/i, "");
  const palabras = base.split("-");
  const minusculas = new Set([
    "a",
    "al",
    "alla",
    "allo",
    "ai",
    "agli",
    "con",
    "di",
    "da",
    "de",
    "del",
    "della",
    "e",
    "ed",
    "g",
    "in",
    "per",
    "con",
    "il",
    "la",
    "le",
    "lo",
    "i",
    "y",
    "ml",
    "kg",
    "l",
  ]);
  return palabras
    .map((w, i) => {
      if (/^\d+$/.test(w)) return w;
      if (i > 0 && minusculas.has(w)) return w;
      if (w.length <= 2 && /^[a-z]$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferirTipo(nombre) {
  const n = nombre.toLowerCase();
  if (/^combo\s/.test(n) || n.startsWith("combo ")) return "combo";
  if (
    /aglio|olio|aceto|panna|uovo|farina|basilico|origano|pepe|sale|mozzarella fior|insumo|semola|zafferano|pangrattato/.test(
      n,
    ) ||
    /\$0|precio 0/.test(n)
  ) {
    return "insumo";
  }
  if (
    /pizza|pasta|spaghetti|risotto|tiramisu|lasagna|ravioli|saltimbocca|osso buco|gnocchi|minestrone|caprese|bruschetta/.test(
      n,
    )
  ) {
    return "preparado";
  }
  return "directo";
}

function inferirPrecio(nombre, tipo) {
  if (tipo === "insumo") return 0;
  if (tipo === "combo") return null;
  const h = createHash("md5").update(nombre).digest();
  if (tipo === "preparado") return 85 + (h[0] % 6) * 15;
  if (/750\s*ml|prosecco|vino/i.test(nombre)) return 320 + (h[1] % 4) * 40;
  if (/250\s*g|500\s*g|1\s*kg/i.test(nombre)) return 48 + (h[2] % 5) * 12;
  return 28 + (h[3] % 10) * 7;
}

function headersRest(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal,resolution=merge-duplicates",
  };
}

async function fetchJson(url, key, init) {
  const res = await fetch(url, {
    ...init,
    headers: { ...headersRest(key), ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${url}\n${body.slice(0, 400)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function sembrarCatalogoDesdePortadas(url, key) {
  const count = await fetchJson(
    `${url}/rest/v1/productos?select=id&limit=1`,
    key,
  ).then((r) => (Array.isArray(r) ? r.length : 0));
  const totalRow = await fetch(
    `${url}/rest/v1/productos?select=id`,
    {
      headers: { ...headersRest(key), Prefer: "count=exact", Range: "0-0" },
    },
  );
  const contentRange = totalRow.headers.get("content-range") ?? "";
  const total = Number(contentRange.split("/").pop() || "0");
  if (total > 40) {
    console.log(`Catálogo ya tiene ${total} productos. Omito carga masiva.`);
    return;
  }

  const combosDir = join(root, "public/combos/portadas");
  const productosDir = join(root, "public/productos/portadas");

  const nombres = new Map();

  for (const dir of [combosDir, productosDir]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".svg")) continue;
      const nombre = slugToNombre(f);
      if (!nombre) continue;
      if (/^Combo trattoria \d+$/i.test(nombre)) {
        nombres.set(nombre, { nombre, tipo: "combo", precio: null });
      } else {
        const tipo = inferirTipo(nombre);
        nombres.set(nombre, {
          nombre,
          tipo,
          precio: inferirPrecio(nombre, tipo),
        });
      }
    }
  }

  for (let i = 1; i <= 8; i++) {
    const nombre = `Combo trattoria ${i}`;
    nombres.set(nombre, { nombre, tipo: "combo", precio: null });
  }

  const filas = [...nombres.values()].map((p) => ({
    nombre: p.nombre,
    tipo: p.tipo,
    precio: p.precio,
    activo: true,
    codigo: createHash("sha1").update(p.nombre).digest("hex").slice(0, 10),
  }));

  console.log(`→ Insertar/actualizar ${filas.length} productos…`);
  const chunk = 80;
  for (let i = 0; i < filas.length; i += chunk) {
    await fetchJson(`${url}/rest/v1/productos`, key, {
      method: "POST",
      headers: { Prefer: "return=minimal,resolution=merge-duplicates" },
      body: JSON.stringify(filas.slice(i, i + chunk)),
    });
  }

  const catalogo = await fetchJson(
    `${url}/rest/v1/productos?select=id,nombre,tipo&order=nombre`,
    key,
  );
  const porNombre = new Map(catalogo.map((p) => [p.nombre, p]));

  const vendibles = catalogo.filter(
    (p) => p.tipo !== "combo" && p.tipo !== "insumo",
  );

  for (let i = 1; i <= 8; i++) {
    const combo = porNombre.get(`Combo trattoria ${i}`);
    if (!combo) continue;
    const componentes = vendibles.slice((i - 1) * 5, i * 5 + 2);
    if (componentes.length < 2) continue;

    await fetchJson(
      `${url}/rest/v1/combo_componentes?combo_id=eq.${combo.id}`,
      key,
      { method: "DELETE" },
    ).catch(() => {});

    const filasCombo = componentes.map((p) => ({
      combo_id: combo.id,
      producto_id: p.id,
      cantidad: 1,
    }));
    await fetchJson(`${url}/rest/v1/combo_componentes`, key, {
      method: "POST",
      body: JSON.stringify(filasCombo),
    });
    console.log(`✓ Combo trattoria ${i}: ${componentes.length} componentes`);
  }

  try {
    const existente = await fetchJson(
      `${url}/rest/v1/existencias?select=producto_id`,
      key,
    );
    const ya = new Set(existente.map((e) => e.producto_id));

    const faltan = catalogo.filter((p) => !ya.has(p.id) && p.tipo !== "combo");

    const stock = faltan.map((p) => {
      const h = createHash("md5").update(p.id).digest();
      const cantidad =
        p.tipo === "insumo"
          ? 500 + (h[0] % 20) * 100
          : 12 + (h[1] % 15) * 4;
      return { producto_id: p.id, cantidad };
    });

    for (let i = 0; i < stock.length; i += chunk) {
      await fetchJson(`${url}/rest/v1/existencias`, key, {
        method: "POST",
        body: JSON.stringify(stock.slice(i, i + chunk)),
      });
    }
    console.log(`✓ Existencias para ${stock.length} productos`);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("401") || msg.includes("permission denied")) {
      console.log(
        "⚠ Existencias: requiere sesión o service role. Ejecuta supabase/seed-existencias-prueba.sql en el SQL Editor.",
      );
    } else {
      throw e;
    }
  }
}

async function verificarConexion(url, key) {
  const code = await fetch(`${url}/rest/v1/categorias?select=id&limit=1`, {
    headers: headersRest(key),
  }).then((r) => r.status);
  return code === 200;
}

async function main() {
  const env = parseEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let password = env.SUPABASE_DB_PASSWORD?.trim();
  const dbUrl = env.DATABASE_URL?.trim();
  if (!password && dbUrl) {
    try {
      const u = new URL(dbUrl.replace(/^postgresql:/, "postgres:"));
      password = decodeURIComponent(u.password);
    } catch {
      /* ignore */
    }
  }

  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_* en .env.local");
  }

  const ref = projectRefFromUrl(url);

  if (!(await verificarConexion(url, key))) {
    if (!password) {
      console.error(
        "No hay tablas y falta SUPABASE_DB_PASSWORD en .env.local.\n" +
          "Dashboard → Project Settings → Database → Database password\n" +
          "O pega supabase/bootstrap-proyecto-completo.sql en el SQL Editor.",
      );
      process.exit(1);
    }
    await aplicarEsquema(password, ref);
  } else {
    console.log("API OK (categorias).");
    if (password) {
      try {
        await aplicarEsquema(password, ref);
      } catch {
        /* seed base only if schema exists */
      }
    }
  }

  await sembrarCatalogoDesdePortadas(url, key);
  console.log("\nListo. Abre http://localhost:3000/login y regístrate.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});