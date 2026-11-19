import Link from "next/link";
import { LogoPizza } from "@/components/LogoPizza";

export const metadata = {
  title: "Catálogos · Trattoria Blue",
};

const catalogos = [
  {
    href: "/catalogos/comidas",
    titulo: "Comidas preparadas",
    detalle:
      "Lo que sale de la cocina: entradas, pastas, pizzas al horno, platos fuertes, postres y bebidas de la casa.",
  },
  {
    href: "/catalogos/productos",
    titulo: "Productos terminados",
    detalle:
      "Mostrador empacado: pasta seca, conservas, quesos, embutidos, pizzas congeladas y despensa.",
  },
] as const;

export default function CatalogosPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
        <LogoPizza className="size-10 shrink-0" />
        Trattoria Blue
      </h1>
      <p className="max-w-2xl text-base leading-7 text-muted">
        Dos catálogos del mismo restaurante italiano. Las comidas se preparan en
        cocina. Los productos terminados se venden empacados, como la pasta seca
        y la pizza congelada.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {catalogos.map((catalogo) => (
          <li key={catalogo.href}>
            <Link
              href={catalogo.href}
              className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-card px-5 py-5"
            >
              <h2 className="text-lg font-semibold">{catalogo.titulo}</h2>
              <p className="text-sm leading-6 text-muted">{catalogo.detalle}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}