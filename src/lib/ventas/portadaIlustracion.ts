import {
  slugComboNombre,
  temaComboDesdeNombre,
  tituloPortadaLineas,
} from "@/lib/ventas/comboPresentacion";

export type CategoriaPortada =
  | "pizza"
  | "pasta"
  | "cafe"
  | "ensalada"
  | "bebida"
  | "vino"
  | "postre"
  | "queso"
  | "carne"
  | "pescado"
  | "pan"
  | "insumo"
  | "sopa"
  | "risotto"
  | "antipasto"
  | "mixto";

export function categoriaDesdeNombre(nombre: string): CategoriaPortada {
  const n = nombre.toLowerCase();
  if (/pizza|margherita|diavola|bufalina|capricciosa|marinara/.test(n)) return "pizza";
  if (/pasta|spaghetti|linguine|ravioli|lasagna|lasagne|penne|rigatoni|gnocchi|tagliatelle|bucatini|paccheri|carbonara|amatriciana|cacio/.test(n)) return "pasta";
  if (/caf|espresso|cappuccino|capuccino/.test(n)) return "cafe";
  if (/ensalada|insalata|caprese|bruschetta|panzanella|rucola/.test(n)) return "ensalada";
  if (/prosecco|chianti|vino|birra|aranciata|acqua|agua/.test(n)) return /vino|chianti|prosecco/.test(n) ? "vino" : "bebida";
  if (/tiramisu|cannoli|gelato|panna cotta|panettone|savoiardi|cioccolato/.test(n)) return "postre";
  if (/mozzarella|parmigiano|burrata|ricotta|gorgonzola|pecorino|formaggi|grana/.test(n)) return "queso";
  if (/bistecca|manzo|vitello|guanciale|pancetta|prosciutto|salame|osso|pollo|saltimbocca/.test(n)) return "carne";
  if (/branzino|pesce|vongole|mare|frutti di mare|zuppa di pesce/.test(n)) return "pescado";
  if (/focaccia|ciabatta|\bpane\b|pan-ciabatta/.test(n)) return "pan";
  if (/minestrone|zuppa|brodo|fagioli/.test(n)) return "sopa";
  if (/risotto/.test(n)) return "risotto";
  if (/aceite|olio|aceto|farina|passata|pomodoro|insumo|semola|lievito|sale|pepe/.test(n)) return "insumo";
  if (/arancini|antipast|tagliere/.test(n)) return "antipasto";
  return "mixto";
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ilustracionCategoria(categoria: CategoriaPortada, acento: string): string {
  const g = (inner: string) =>
    `<g transform="translate(200 215)" opacity="0.92">${inner}</g>`;

  switch (categoria) {
    case "pizza":
      return g(`
        <circle r="78" fill="${acento}" opacity="0.22"/>
        <circle r="62" fill="#f4d03f" opacity="0.35"/>
        <circle cx="-22" cy="-12" r="9" fill="#c0392b" opacity="0.85"/>
        <circle cx="8" cy="6" r="8" fill="#c0392b" opacity="0.85"/>
        <circle cx="26" cy="-18" r="7" fill="#c0392b" opacity="0.8"/>
        <circle cx="-6" cy="22" r="6" fill="#27ae60" opacity="0.75"/>
        <ellipse cx="0" cy="38" rx="52" ry="10" fill="#000" opacity="0.12"/>
      `);
    case "pasta":
      return g(`
        <ellipse cx="0" cy="28" rx="70" ry="22" fill="#ecf0f1" opacity="0.35"/>
        <path d="M-52 -8 Q-12 -58 32 -8 Q56 8 38 28 Q12 42 -28 28 Q-48 18 -52 -8" fill="none" stroke="${acento}" stroke-width="7" stroke-linecap="round"/>
        <path d="M-38 0 Q-8 -42 26 0" fill="none" stroke="#fdebd0" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
      `);
    case "cafe":
      return g(`
        <rect x="-38" y="-18" width="76" height="52" rx="10" fill="#5d4037" opacity="0.85"/>
        <rect x="-32" y="-10" width="64" height="28" rx="6" fill="${acento}" opacity="0.5"/>
        <path d="M38 -2 h20 v6 a16 16 0 0 1 -16 16 h-10" stroke="#fdebd0" stroke-width="4" fill="none"/>
        <path d="M-20 -34 Q0 -48 22 -34" stroke="#fff" stroke-width="5" fill="none" opacity="0.45" stroke-linecap="round"/>
      `);
    case "ensalada":
      return g(`
        <ellipse cx="0" cy="24" rx="72" ry="26" fill="${acento}" opacity="0.28"/>
        <circle cx="-28" cy="0" r="14" fill="#27ae60" opacity="0.75"/>
        <circle cx="6" cy="-8" r="16" fill="#2ecc71" opacity="0.7"/>
        <circle cx="30" cy="6" r="12" fill="#c0392b" opacity="0.65"/>
        <rect x="-8" y="-32" width="16" height="36" rx="4" fill="#f1c40f" opacity="0.55"/>
      `);
    case "bebida":
      return g(`
        <rect x="-22" y="-40" width="44" height="72" rx="8" fill="#a5d8ff" opacity="0.55"/>
        <rect x="-18" y="-12" width="36" height="36" rx="4" fill="${acento}" opacity="0.45"/>
        <ellipse cx="0" cy="-40" rx="22" ry="6" fill="#fff" opacity="0.35"/>
        <circle cx="0" cy="8" r="10" fill="#fff" opacity="0.25"/>
      `);
    case "vino":
      return g(`
        <path d="M-28 40 V-8 Q0 -42 28 -8 V40 Z" fill="#722f37" opacity="0.75"/>
        <path d="M-28 -8 Q0 6 28 -8" fill="#c0392b" opacity="0.5"/>
        <rect x="-6" y="40" width="12" height="18" fill="#ecf0f1" opacity="0.5"/>
        <ellipse cx="0" cy="58" rx="26" ry="6" fill="#000" opacity="0.15"/>
      `);
    case "postre":
      return g(`
        <path d="M-48 20 L48 20 L32 -24 Q0 -50 -32 -24 Z" fill="#fdebd0" opacity="0.85"/>
        <circle cx="0" cy="-28" r="14" fill="${acento}" opacity="0.65"/>
        <circle cx="-20" cy="-6" r="6" fill="#c0392b" opacity="0.6"/>
        <circle cx="18" cy="-4" r="5" fill="#8e44ad" opacity="0.55"/>
      `);
    case "queso":
      return g(`
        <path d="M-52 18 L52 18 L38 -20 L-38 -20 Z" fill="#f9e79f" opacity="0.9"/>
        <circle cx="-18" cy="-2" r="5" fill="#f5b041" opacity="0.7"/>
        <circle cx="12" cy="2" r="4" fill="#f5b041" opacity="0.65"/>
        <circle cx="28" cy="-8" r="3.5" fill="#f5b041" opacity="0.6"/>
        <ellipse cx="0" cy="28" rx="58" ry="10" fill="#000" opacity="0.1"/>
      `);
    case "carne":
      return g(`
        <ellipse cx="0" cy="8" rx="58" ry="38" fill="#c0392b" opacity="0.55"/>
        <path d="M-30 -8 Q0 -28 34 -6" fill="none" stroke="#922b21" stroke-width="4" opacity="0.6"/>
        <rect x="-6" y="-38" width="12" height="28" rx="3" fill="#8d6e63" opacity="0.7"/>
      `);
    case "pescado":
      return g(`
        <ellipse cx="0" cy="4" rx="62" ry="28" fill="#5dade2" opacity="0.55"/>
        <path d="M52 4 L78 18 V-10 Z" fill="${acento}" opacity="0.6"/>
        <circle cx="-18" cy="-4" r="5" fill="#fff" opacity="0.85"/>
        <circle cx="-20" cy="-4" r="2" fill="#1a5276"/>
      `);
    case "pan":
      return g(`
        <ellipse cx="0" cy="10" rx="68" ry="30" fill="#d4ac6e" opacity="0.85"/>
        <path d="M-48 0 Q0 -22 48 0" fill="none" stroke="#a67c52" stroke-width="3" opacity="0.5"/>
        <ellipse cx="0" cy="36" rx="52" ry="10" fill="#000" opacity="0.1"/>
      `);
    case "insumo":
      return g(`
        <rect x="-34" y="-36" width="68" height="78" rx="10" fill="#ecf0f1" opacity="0.4"/>
        <rect x="-28" y="-28" width="56" height="40" rx="6" fill="${acento}" opacity="0.55"/>
        <rect x="-20" y="18" width="40" height="14" rx="3" fill="#fff" opacity="0.35"/>
      `);
    case "sopa":
      return g(`
        <ellipse cx="0" cy="22" rx="70" ry="28" fill="#b9770e" opacity="0.35"/>
        <path d="M-58 20 Q-58 -8 0 -20 Q58 -8 58 20 Z" fill="#fdebd0" opacity="0.5"/>
        <circle cx="-16" cy="0" r="6" fill="#27ae60" opacity="0.65"/>
        <circle cx="14" cy="-4" r="5" fill="#e67e22" opacity="0.6"/>
      `);
    case "risotto":
      return g(`
        <ellipse cx="0" cy="24" rx="72" ry="26" fill="#f4d03f" opacity="0.4"/>
        <ellipse cx="0" cy="8" rx="54" ry="18" fill="#fdebd0" opacity="0.55"/>
        <circle cx="-20" cy="2" r="5" fill="${acento}" opacity="0.55"/>
        <circle cx="16" cy="-2" r="4" fill="#27ae60" opacity="0.5"/>
      `);
    case "antipasto":
      return g(`
        <ellipse cx="0" cy="20" rx="76" ry="24" fill="#7f8c8d" opacity="0.35"/>
        <circle cx="-32" cy="0" r="12" fill="#c0392b" opacity="0.6"/>
        <rect x="-8" y="-14" width="26" height="18" rx="4" fill="#f9e79f" opacity="0.7"/>
        <circle cx="32" cy="4" r="10" fill="#27ae60" opacity="0.55"/>
      `);
    default:
      return g(`
        <circle r="48" fill="${acento}" opacity="0.28"/>
        <circle cx="-24" cy="-8" r="12" fill="#fff" opacity="0.22"/>
        <circle cx="20" cy="12" r="10" fill="#fff" opacity="0.18"/>
        <path d="M-40 36 H40" stroke="#fff" stroke-width="3" opacity="0.2" stroke-linecap="round"/>
      `);
  }
}

export function generarPortadaSvg(options: {
  nombre: string;
  esCombo: boolean;
  descuentoPct?: number;
}): string {
  const { nombre, esCombo, descuentoPct = 0 } = options;
  const tema = temaComboDesdeNombre(nombre);
  const categoria = categoriaDesdeNombre(nombre);
  const lineas = tituloPortadaLineas(nombre);
  const tituloY = lineas.length === 1 ? 430 : 418;
  const linea2 =
    lineas.length > 1
      ? `<tspan x="200" dy="36" font-size="24">${escapeXml(lineas[1]!)}</tspan>`
      : "";

  const badgeDescuento =
    descuentoPct > 0
      ? `<g transform="translate(320 56)"><circle r="40" fill="${tema.acento}"/><text y="6" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="17" font-weight="700">−${descuentoPct}%</text></g>`
      : "";

  const etiqueta = esCombo ? "COMBO" : categoria.toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${escapeXml(nombre)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${tema.fondoDesde}"/>
      <stop offset="100%" stop-color="${tema.fondoHasta}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="500" fill="url(#bg)"/>
  <rect width="400" height="500" fill="url(#halo)"/>
  ${ilustracionCategoria(categoria, tema.acento)}
  ${badgeDescuento}
  <text x="200" y="${tituloY}" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="28" font-weight="700">${escapeXml(lineas[0]!)}${linea2}</text>
  <text x="200" y="472" text-anchor="middle" fill="rgba(255,255,255,0.72)" font-family="system-ui,sans-serif" font-size="13" font-weight="600" letter-spacing="0.14em">${etiqueta}</text>
</svg>`;
}

export function urlPortadaVentaApi(
  nombre: string,
  esCombo: boolean,
  descuentoPct = 0,
): string {
  const params = new URLSearchParams({
    nombre,
    esCombo: esCombo ? "1" : "0",
    descuentoPct: String(descuentoPct),
  });
  return `/api/venta-portada?${params.toString()}`;
}

export { slugComboNombre };