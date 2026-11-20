import Link from "next/link";
import { CombosVista } from "@/components/combos/CombosVista";
import { RequiereAdministrador } from "@/components/RequiereAdministrador";

export const metadata = {
  title: "Combos · Blue POS 2.0",
};

export default function CombosPage() {
  return (
    <RequiereAdministrador>
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
            Combos
          </p>
          <Link href="/" className="text-sm font-medium text-muted">
            Inicio
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Menú de combos
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          Combos armados con productos de{" "}
          <Link
            href="/catalogos/comidas"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            comidas preparadas
          </Link>{" "}
          y{" "}
          <Link
            href="/catalogos/productos"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            productos terminados
          </Link>
          . Cada combo incluye entrada, bebida y plato fuerte.
        </p>
      </header>
      <CombosVista />
    </main>
    </RequiereAdministrador>
  );
}