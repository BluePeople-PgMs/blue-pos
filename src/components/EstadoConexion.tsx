import { getSupabaseBrowser } from "@/lib/supabase";

export async function EstadoConexion() {
  const supabase = getSupabaseBrowser();

  if (!supabase) {
    return (
      <Estado
        tono="aviso"
        titulo="Faltan las variables"
        detalle="Copia .env.example a .env.local y pega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Reinicia npm run dev después de guardarlas."
      />
    );
  }

  const { error } = await supabase.from("categorias").select("id").limit(1);

  if (error) {
    return (
      <Estado
        tono="error"
        titulo="Hay llaves, pero no se pudo leer"
        detalle={error.message}
      />
    );
  }

  return (
    <Estado
      tono="ok"
      titulo="Conectado"
      detalle="La lectura de categorias respondió. Puedes abrir /catalogos para administrar las tablas maestras."
    />
  );
}

function Estado({
  tono,
  titulo,
  detalle,
}: {
  tono: "aviso" | "error" | "ok";
  titulo: string;
  detalle: string;
}) {
  const tonoClase = {
    aviso: "border-warn/30 bg-warn-soft text-warn",
    error: "border-danger/30 bg-danger-soft text-danger",
    ok: "border-accent/30 bg-accent-soft text-accent",
  }[tono];

  return (
    <section
      role="status"
      className={`rounded-2xl border px-5 py-4 ${tonoClase}`}
    >
      <h2 className="text-base font-semibold">{titulo}</h2>
      <p className="mt-1 text-sm leading-6">{detalle}</p>
    </section>
  );
}
