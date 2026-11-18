import Link from "next/link";
import { RequiereSesion } from "@/components/RequiereSesion";

type PlantillaModuloProps = {
  titulo: string;
  resumen: string;
  tablas: string[];
  requiereSesion: boolean;
  aviso?: string;
};

function ContenidoModulo({
  titulo,
  resumen,
  tablas,
  aviso,
}: Omit<PlantillaModuloProps, "requiereSesion">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Módulo
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {titulo}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">{resumen}</p>
        {aviso ? (
          <p className="max-w-2xl text-sm leading-6 text-muted">{aviso}</p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-base font-semibold">Por construir</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Aquí va la pantalla de este módulo. Las tablas involucradas son:
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {tablas.map((tabla) => (
            <li
              key={tabla}
              className="rounded-md bg-background px-2 py-1 font-mono text-xs text-foreground"
            >
              {tabla}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted">
        <Link href="/" className="font-medium text-accent underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}

export function PlantillaModulo(props: PlantillaModuloProps) {
  const contenido = <ContenidoModulo {...props} />;

  if (props.requiereSesion) {
    return <RequiereSesion>{contenido}</RequiereSesion>;
  }

  return contenido;
}