<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Blue POS 2.0

Cascarón para que el equipo de la capacitación construya el punto de venta. La pantalla de inicio y las tablas ya existen. La primera tarea del equipo es el login.

- Los módulos (login, catálogos, ventas, inventario, combos, recetas) los construye quien esté en la sesión.
- El login usa Supabase Auth: `supabase.auth.signInWithPassword`. Al registrarse, el trigger crea la fila en `perfiles`. No inventes otra tabla de usuarios.
- Inventario: una entrada es un `movimientos_inventario` con `tipo = 'entrada'` y sin `venta_id`. Al cobrar una venta, la salida es `tipo = 'salida_venta'` con `venta_id`. Al cancelar, se inserta en `cancelaciones` y un movimiento `tipo = 'cancelacion'` con `venta_id`. La pantalla suma o resta `existencias`. La base no lo hace sola.
- `ventas.estado` solo puede ser `abierta`, `cobrada` o `cancelada`.
- Un cambio de esquema es un archivo nuevo en `supabase/migrations`. No edites `20261118120000_cascaron.sql` para rehacer las tablas.
- No borres el cascarón de tablas para empezar de cero. Agrega columnas o llaves foráneas en una migración posterior.
- La relación de ejemplo que el equipo todavía agrega es `productos.categoria_id` → `categorias.id`. Categorías, unidades, recetas y combos no traen llave foránea.
- La llave de servicio de Supabase no se escribe en el cliente ni se commitea. Solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

