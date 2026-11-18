import { PlantillaModulo } from "@/components/PlantillaModulo";
import { menuModulos } from "@/lib/navegacion";

const modulo = menuModulos.find((m) => m.href === "/combos")!;

export default function CombosPage() {
  return (
    <PlantillaModulo
      titulo={modulo.nombre}
      resumen={modulo.resumen}
      tablas={modulo.tablas}
      requiereSesion={modulo.requiereSesion}
      aviso="Acceso abierto: no exige sesión."
    />
  );
}