/**
 * Desactiva "Confirm email" en el proyecto Supabase en la nube
 * (mailer_autoconfirm = true → no pide verificación por correo al registrarse).
 *
 * Requiere SUPABASE_ACCESS_TOKEN en el entorno o en .env.local
 * (token en https://supabase.com/dashboard/account/tokens).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const raw = readFileSync(envPath, "utf8");
    const valores = new Map();
    for (const line of raw.split("\n")) {
      const limpio = line.trim();
      if (!limpio || limpio.startsWith("#")) continue;
      const corte = limpio.indexOf("=");
      if (corte === -1) continue;
      valores.set(limpio.slice(0, corte), limpio.slice(corte + 1).trim());
    }
    return valores;
  } catch {
    return new Map();
  }
}

function projectRefFromUrl(url) {
  const m = url.match(/^https:\/\/([^.]+)\.supabase\.co\/?$/);
  return m?.[1] ?? null;
}

function loadToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const env = loadEnvLocal();
  const token = env.get("SUPABASE_ACCESS_TOKEN");
  if (token) return token.replace(/^["']|["']$/g, "");
  return null;
}

const env = loadEnvLocal();
const token = loadToken();
const projectRef =
  projectRefFromUrl(env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "") ??
  process.env.SUPABASE_PROJECT_REF?.trim();
if (!projectRef) {
  console.error(
    "No pude leer el ref del proyecto desde NEXT_PUBLIC_SUPABASE_URL en .env.local.",
  );
  process.exit(1);
}
if (!token) {
  console.error(
    [
      "Falta SUPABASE_ACCESS_TOKEN.",
      "Créalo en https://supabase.com/dashboard/account/tokens",
      "y añádelo a .env.local (no lo subas al repo):",
      "SUPABASE_ACCESS_TOKEN=sbp_...",
      "",
      "Luego: npm run auth:sin-confirmacion",
    ].join("\n"),
  );
  process.exit(1);
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mailer_autoconfirm: true,
      external_email_enabled: true,
    }),
  },
);

const body = await res.text();
if (!res.ok) {
  console.error(`Error ${res.status}:`, body);
  process.exit(1);
}

console.log("Listo: registro sin confirmación por correo (mailer_autoconfirm = true).");
console.log(body.slice(0, 200) + (body.length > 200 ? "…" : ""));