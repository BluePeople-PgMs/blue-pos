import { PlantillaModulo } from "@/components/PlantillaModulo";
import { menuModulos } from "@/lib/navegacion";

const modulo = menuModulos.find((m) => m.href === "/recetas")!;

export default function RecetasPage() {
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