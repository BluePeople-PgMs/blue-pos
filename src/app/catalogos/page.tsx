import Link from "next/link";

const SECCIONES = [
  {
    href: "/catalogos/lista",
    titulo: "Lista de productos",
    detalle: "Vista compartida para combos, inventario y ventas (solo lectura).",
  },
  {
    href: "/catalogos/categorias",
    titulo: "Categorías",
    detalle: "Agrupa productos y define el orden en listas.",
  },
  {
    href: "/catalogos/unidades",
    titulo: "Unidades",
    detalle: "Pieza, kilo, litro… con abreviatura.",
  },
  {
    href: "/catalogos/productos",
    titulo: "Productos",
    detalle: "Alta y edición: directo, preparado, insumo o combo.",
  },
  {
    href: "/catalogos/cajas",
    titulo: "Cajas",
    detalle: "Puntos de cobro activos para ventas.",
  },
] as const;

export default function CatalogosHubPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Catálogos
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tablas maestras
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Acceso público (sin login). Inventario, ventas y combos reutilizan los
          mismos productos y selects de categoría, unidad y caja.
        </p>
        <Link
          href="/"
          className="w-fit text-sm font-medium text-accent hover:underline"
        >
          ← Inicio
        </Link>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECCIONES.map((seccion) => (
          <li
            key={seccion.href}
            className="rounded-2xl border border-line bg-card px-5 py-5"
          >
            <h2 className="text-lg font-semibold">{seccion.titulo}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{seccion.detalle}</p>
            <Link
              href={seccion.href}
              className="mt-4 inline-block rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white"
            >
              Abrir
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}