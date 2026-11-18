import { PlantillaModulo } from "@/components/PlantillaModulo";
import { menuModulos } from "@/lib/navegacion";

const modulo = menuModulos.find((m) => m.href === "/ventas")!;

export default function VentasPage() {
  return (
    <PlantillaModulo
      titulo={modulo.nombre}
      resumen={modulo.resumen}
      tablas={modulo.tablas}
      requiereSesion
      aviso="Solo lectura y escritura con sesión iniciada."
    />
  );
}