#!/usr/bin/env node
/**
 * Genera SVG de portada en public/combos/portadas/ a partir de nombres en JSON o API.
 *
 * Uso:
 *   node scripts/generate-combo-portadas.mjs "Combo trattoria 1" "Combo trattoria 2"
 *   node scripts/generate-combo-portadas.mjs --from-supabase
 *
 * Requiere .env.local con NEXT_PUBLIC_SUPABASE_* para --from-supabase.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDirCombos = join(root, "public/combos/portadas");
const outDirProductos = join(root, "public/productos/portadas");

function slugComboNombre(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hashNombre(nombre) {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) {
    h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  }
  return h;
}

const PALETAS = [
  { fondoDesde: "#1e3a5f", fondoHasta: "#2d5a87", acento: "#e95d4a" },
  { fondoDesde: "#2c4a3e", fondoHasta: "#3d6b5a", acento: "#f4b860" },
  { fondoDesde: "#4a2c3d", fondoHasta: "#6b3d54", acento: "#7ec8c8" },
  { fondoDesde: "#3d3529", fondoHasta: "#5c4a38", acento: "#e95d4a" },
  { fondoDesde: "#1a3340", fondoHasta: "#2a4f60", acento: "#fde8e4" },
];

function motivoDesdeNombre(nombre) {
  const n = nombre.toLowerCase();
  if (/caf|espresso|capuccino|cappuccino/.test(n)) return "cafe";
  if (/pasta|spaghetti|ravioli|lasagna|pomodoro/.test(n)) return "pasta";
  if (/ensalada|caprese|bruschetta|antipast/.test(n)) return "ensalada";
  return "mixto";
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tituloPortadaLineas(nombre) {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length <= 2) return [nombre.trim()];
  const mitad = Math.ceil(palabras.length / 2);
  return [palabras.slice(0, mitad).join(" "), palabras.slice(mitad).join(" ")];
}

function svgMotivo(motivo, acento) {
  switch (motivo) {
    case "pasta":
      return `<ellipse cx="72" cy="148" rx="44" ry="18" fill="${acento}" opacity="0.35"/><path d="M48 130 Q72 95 96 130" stroke="${acento}" stroke-width="4" fill="none" opacity="0.6"/>`;
    case "cafe":
      return `<rect x="40" y="120" width="36" height="28" rx="6" fill="${acento}" opacity="0.4"/><path d="M76 128 h14 v4 a10 10 0 0 1 -10 10 h-8" stroke="${acento}" stroke-width="3" fill="none" opacity="0.55"/>`;
    case "ensalada":
      return `<circle cx="64" cy="136" r="28" fill="${acento}" opacity="0.25"/><circle cx="54" cy="128" r="6" fill="#fff" opacity="0.5"/><circle cx="76" cy="132" r="5" fill="#fff" opacity="0.45"/>`;
    default:
      return `<circle cx="56" cy="132" r="20" fill="${acento}" opacity="0.3"/><circle cx="88" cy="140" r="14" fill="#fff" opacity="0.2"/>`;
  }
}

function svgPortadaCombo(nombre, descuentoPct = 20) {
  const paleta = PALETAS[hashNombre(nombre) % PALETAS.length];
  const motivo = motivoDesdeNombre(nombre);
  const lineas = tituloPortadaLineas(nombre);
  const tituloY = lineas.length === 1 ? 118 : 108;
  const linea2 =
    lineas.length > 1
      ? `<tspan x="160" dy="32" font-size="22">${escapeXml(lineas[1])}</tspan>`
      : "";
  const badge =
    descuentoPct > 0
      ? `<circle cx="272" cy="48" r="36" fill="${paleta.acento}"/><text x="272" y="54" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="16" font-weight="700">−${descuentoPct}%</text>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="${escapeXml(nombre)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${paleta.fondoDesde}"/>
      <stop offset="100%" stop-color="${paleta.fondoHasta}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="200" fill="url(#bg)"/>
  ${svgMotivo(motivo, paleta.acento)}
  ${badge}
  <text x="160" y="${tituloY}" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="26" font-weight="700">${escapeXml(lineas[0])}${linea2}</text>
  <text x="160" y="178" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="system-ui,sans-serif" font-size="12" letter-spacing="0.08em">BLUE POS · COMBO</text>
</svg>`;
}

function parseEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim();
  }
  return vars;
}

function descuentoPorNumProductos(n) {
  if (n >= 5) return 30;
  if (n >= 3) return 20;
  if (n === 2) return 10;
  return 0;
}

async function combosDesdeSupabase() {
  const env = parseEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o KEY en .env.local");
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const [prodRes, compRes] = await Promise.all([
    fetch(
      `${url}/rest/v1/productos?select=id,nombre&tipo=eq.combo&activo=eq.true&order=nombre`,
      { headers },
    ),
    fetch(`${url}/rest/v1/combo_componentes?select=combo_id,producto_id`, {
      headers,
    }),
  ]);
  if (!prodRes.ok) throw new Error(await prodRes.text());
  if (!compRes.ok) throw new Error(await compRes.text());
  const productos = await prodRes.json();
  const componentes = await compRes.json();
  const conteo = new Map();
  for (const fila of componentes) {
    const set = conteo.get(fila.combo_id) ?? new Set();
    set.add(fila.producto_id);
    conteo.set(fila.combo_id, set);
  }
  return productos.map((p) => ({
    nombre: p.nombre,
    descuentoPct: descuentoPorNumProductos((conteo.get(p.id)?.size ?? 0)),
  }));
}

function escribirPortadas(items, outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const { nombre, descuentoPct } of items) {
    const slug = slugComboNombre(nombre);
    const file = join(outDir, `${slug}.svg`);
    writeFileSync(file, svgPortadaCombo(nombre, descuentoPct), "utf8");
    console.log("✓", file);
  }
}

async function productosSueltosDesdeSupabase() {
  const env = parseEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o KEY en .env.local");
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const res = await fetch(
    `${url}/rest/v1/productos?select=nombre&activo=eq.true&tipo=neq.combo&order=nombre`,
    { headers },
  );
  if (!res.ok) throw new Error(await res.text());
  const productos = await res.json();
  return productos.map((p) => ({ nombre: p.nombre, descuentoPct: 0 }));
}

const args = process.argv.slice(2);
if (args.includes("--from-supabase")) {
  const [combos, productos] = await Promise.all([
    combosDesdeSupabase(),
    productosSueltosDesdeSupabase(),
  ]);
  escribirPortadas(combos, outDirCombos);
  escribirPortadas(productos, outDirProductos);
} else if (args.length > 0) {
  escribirPortadas(
    args.map((nombre) => ({ nombre, descuentoPct: 20 })),
    outDirCombos,
  );
} else {
  console.error(
    'Indica nombres o usa: node scripts/generate-combo-portadas.mjs --from-supabase',
  );
  process.exit(1);
}