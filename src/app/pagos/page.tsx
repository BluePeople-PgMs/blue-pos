import { PlantillaModulo } from "@/components/PlantillaModulo";
import { menuModulos } from "@/lib/navegacion";

const modulo = menuModulos.find((m) => m.href === "/pagos")!;

export default function PagosPage() {
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