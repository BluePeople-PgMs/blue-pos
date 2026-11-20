import { Suspense } from "react";
import { EstadoConexion } from "@/components/EstadoConexion";
import { LogoPizza } from "@/components/LogoPizza";
import { PuertaInicio } from "@/components/PuertaInicio";
import { InicioAcciones } from "@/components/inicio/InicioAcciones";
import { InicioModulosTecnicos } from "@/components/inicio/InicioModulosTecnicos";

export default function Home() {
  return (
    <PuertaInicio>
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Cucina e dispensa
        </p>
        <h1 className="flex items-center gap-3 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          <LogoPizza className="size-12 shrink-0 sm:size-14" />
          Trattoria Blue
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted">
          Elige una acción abajo para vender, entrar mercancía o revisar
          cobros. Los módulos técnicos siguen disponibles para el equipo.
        </p>
      </header>

      <Suspense
        fallback={
          <section
            role="status"
            className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
          >
            Revisando la conexión…
          </section>
        }
      >
        <EstadoConexion />
      </Suspense>

      <InicioAcciones />

      <InicioModulosTecnicos />
    </main>
    </PuertaInicio>
  );
}
