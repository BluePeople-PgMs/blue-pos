/**
 * Desactiva "Confirm email" en el proyecto Supabase en la nube
 * (mailer_autoconfirm = true → no pide verificación por correo al registrarse).
 *
 * Requiere SUPABASE_ACCESS_TOKEN en el entorno o en .env.local
 * (token en https://supabase.com/dashboard/account/tokens).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_REF = "tyclvddlsxksjnfcqalt";

function loadToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // sin .env.local
  }
  return null;
}

const token = loadToken();
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
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
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