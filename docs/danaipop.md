# Rama `danaipop` — proyecto Supabase `grupos-blue`

## Base de datos

- Proyecto en Supabase: **grupos-blue** (ref `fuegbnbhzkzktuumpckm`, región us-east-2).
- Esquema: mismas migraciones que el repo en `supabase/migrations/` (aplicadas con el plugin Supabase de Cursor o `supabase db push` cuando tengas CLI enlazado).
- Catálogo Trattoria: `npm run sembrar:catalogo` (una vez por base vacía).
- Recetas: `npm run sembrar:recetas` después del catálogo.

## Variables locales

En `.env.local` (no se commitea):

```env
NEXT_PUBLIC_SUPABASE_URL=https://fuegbnbhzkzktuumpckm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key del proyecto grupos-blue>
```

Obtén la clave en Supabase → Settings → API, o pídele al agente que use el plugin **Supabase** (`get_publishable_keys`).

## Plugin Supabase en Cursor

Con el plugin conectado, el agente puede:

- Listar proyectos y elegir `grupos-blue`
- Aplicar migraciones (`apply_migration`)
- Ejecutar SQL, revisar tablas y asesores de seguridad

La app Next.js solo necesita las dos variables `NEXT_PUBLIC_*` anteriores; el plugin no sustituye `.env.local`, pero sirve para crear el proyecto, el esquema y el sembrado asistido.

## Stripe

Cobro con tarjeta en Ventas y Pagos, cuenta de prueba de Blue People. En `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
```

La secret key no va al navegador ni al repo. La migración `20261125170000_pagos_stripe.sql` agrega las columnas de Stripe en `pagos`. Stripe Tax no calcula IVA hasta que el entorno de prueba tenga domicilio fiscal. El PDF de la factura de Stripe no es un CFDI.

## Login sin confirmar correo

Para capacitación puedes:

1. **Supabase (Dashboard)** → Authentication → Sign in / Providers → Email → desactivar **Confirm email**, o
2. **`npm run auth:sin-confirmacion`** con `SUPABASE_ACCESS_TOKEN` en `.env.local` (ver `.env.example`), o
3. Con el plugin conectado, el agente puede **confirmar cuentas ya creadas** con SQL en `auth.users` (`email_confirmed_at`).

## Git

- Rama: `danaipop`
- La rama `slytherin` sigue documentada para el proyecto compartido `blue-pos` en [slytherin.md](./slytherin.md).