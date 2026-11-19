# Scripts de operación

## Migración de recetas en Supabase remoto

En el SQL Editor del proyecto **blue-pos** (`tyclvddlsxksjnfcqalt`), ejecuta uno de estos archivos (mismo contenido; el de `scripts` es idempotente):

- [`scripts/apply-recetas-fkeys.sql`](apply-recetas-fkeys.sql) (recomendado si ya hubo intentos)
- [`supabase/migrations/20261118150000_recetas_fkeys.sql`](../supabase/migrations/20261118150000_recetas_fkeys.sql)

Sin esa migración, la pantalla `/recetas` puede insertar datos huérfanos y el join `productos!receta_insumos_insumo_id_fkey` falla.

Enlace directo: [SQL Editor → New query](https://supabase.com/dashboard/project/tyclvddlsxksjnfcqalt/sql/new)

## Verificar remoto

```bash
npm run verify:recetas-schema
```

El script crea datos efímeros, comprueba unicidad y el embed FK, y los borra. Exit code **1** indica que falta aplicar la migración.