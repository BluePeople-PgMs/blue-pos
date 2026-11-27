import { NuevoPedidoVista } from "@/components/domicilio/NuevoPedidoVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Nuevo pedido · Trattoria Blue",
};

export default function NuevoPedidoPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <NuevoPedidoVista />
      </main>
    </RequiereSesion>
  );
}
