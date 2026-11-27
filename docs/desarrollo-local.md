# Desarrollo local (Supabase opcional)

Para el reto **delivery** y el trabajo del día a día puedes desarrollar **solo en tu máquina**: Next.js, UI y estado en el navegador. La base en Supabase (nube o `supabase start`) se conecta **cuando quieras**.

## Requisitos

| Herramienta | Uso |
|-------------|-----|
| **Node.js** | LTS o actual (ej. v20+). |
| **npm** | Este repo usa **npm**, no pnpm. |
| **Docker** | Solo si más adelante quieres **Supabase local** con `supabase start`. |
| **Supabase CLI** | Opcional; mismo caso que Docker. |

## Arranque rápido (sin base de datos)

```bash
git fetch origin
git checkout slytherin-kratos   # o SlytherinDeliveryKratos cuando exista
npm install
npm run dev
```

Abre la URL del terminal (normalmente [http://localhost:3000](http://localhost:3000)).

- Sin `.env.local` (o sin URL/key): el inicio muestra **Faltan las variables**; las pantallas públicas y el trabajo de **UI delivery** pueden seguir en `/delivery` con datos mock.
- Con `.env.local` y proyecto Supabase: **Conectado** y módulos que leen el catálogo real.

No commitees `.env.local`. Copia desde `.env.example`.

## Calidad antes de push

```bash
npm run typecheck
npm run lint
```

## Supabase cuando lo necesites

### Nube (Kratos u otro proyecto)

1. Settings → API → Project URL + Publishable key en `.env.local`.
2. Migraciones: aplicar en orden los archivos en `supabase/migrations/` (Dashboard SQL o `supabase db push` contra el proyecto enlazado).

### Local (opcional)

1. Instala **Docker Desktop** y pon `docker` en el PATH.
2. Instala [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
3. En la raíz del repo:

```bash
supabase start
supabase status   # copia API URL y anon/publishable key a .env.local
```

Las migraciones, incluido `20261118120000_cascaron.sql`, se aplican con `supabase db reset` o al levantar el stack según tu versión del CLI.

4. Catálogo para pruebas: `npm run sembrar:catalogo` (una vez por base vacía).

## Estrategia delivery (sin meterte aún en Supabase)

1. Rama `SlytherinDeliveryKratos` desde `origin/slytherin`.
2. **UI primero**: menú, carrito, checkout y cocina con tema mobile (referencia de capacitación).
3. **Estado local**: carrito y cola de cocina en `sessionStorage` / `localStorage` (demo del ciclo completo en una sola máquina).
4. **Después**: migración delivery en `supabase/migrations/` y cablear `src/lib/delivery.ts` a Supabase (misma lógica de cobro que `src/lib/ventas.ts`).

Ver guión de demo en `docs/delivery-demo.md` (cuando exista).