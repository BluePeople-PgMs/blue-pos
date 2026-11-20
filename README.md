# Blue POS 2.0

Cascarón de un punto de venta híbrido: se vende producto de mostrador y también comida con receta. Varias computadoras usan la misma base en Supabase.

Este repo trae la pantalla de inicio y las tablas. El equipo de la capacitación construye las pantallas.

El equipo **Slytherin** documenta su flujo de trabajo, el guión de demo final y las reglas de la base compartida en [docs/slytherin.md](docs/slytherin.md).

## Login

Supabase Auth guarda la cuenta. La tabla `perfiles` se llena sola cuando alguien se registra. La pantalla se pide así:

> Agrega el login con supabase.auth.signInWithPassword.

Inventario, ventas, pagos y cancelaciones solo se leen y escriben con una sesión iniciada. Los catálogos siguen abiertos para que el inicio pueda comprobar la conexión antes del login.

## Inventario y ventas

- Una entrada es un movimiento `tipo = 'entrada'`, sin venta. La pantalla suma esa cantidad a `existencias`.
- Al cobrar, la venta queda en estado `cobrada` y cada línea genera un movimiento `tipo = 'salida_venta'` con `venta_id`. La pantalla resta la existencia.
- Al cancelar, se guarda una fila en `cancelaciones` y un movimiento `tipo = 'cancelacion'` con `venta_id`. La pantalla devuelve la existencia. El estado de la venta pasa a `cancelada`.

La base rechaza un movimiento con el tipo mal escrito, una cantidad que no sea mayor a cero, una entrada ligada a una venta, o una salida sin venta. No actualiza `existencias` por sí misma.

## Conectar otra computadora

La base vive en el proyecto Supabase `blue-pos`. Quien creó el proyecto comparte solo estos dos valores, los mismos que están en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

No compartas la service role key ni la contraseña de la base.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Si las variables están bien, el inicio dice **Conectado**.

## Pedirle una pantalla a Cursor

Ejemplo para una relación que el equipo todavía agrega:

> Agrega la pantalla de categorías y relaciónala con productos.

```sql
alter table public.productos
  add constraint productos_categoria_id_fkey
  foreign key (categoria_id) references public.categorias (id);
```

Ese cambio va en un archivo nuevo dentro de `supabase/migrations`. Categorías, unidades, recetas y combos no traen llave foránea.
