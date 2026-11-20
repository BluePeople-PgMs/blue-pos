# Equipo Slytherin — workflow y demo final

## Git

- Rama de trabajo: `slytherin`.
- Al empezar: `git fetch origin` y `git pull origin slytherin`.
- Commits a esta rama, no a `main` salvo acuerdo del grupo.
- Antes de push: `npm run typecheck` y `npm run lint`.

## Supabase y datos

- Proyecto compartido `blue-pos`. Variables en `.env.local` (ver README).
- Catálogo oficial para capacitación: `npm run sembrar:catalogo` (una vez por base vacía).
- No ejecutes `supabase/migrations/20261118190000_datos_prueba_ristorante.sql` si el catálogo Trattoria ya está cargado: duplicaría filas.

## Roles (cajero y administrador)

- Columna `perfiles.rol`: `cajero` (por defecto) o `administrador` (migración `20261120140000_perfiles_rol.sql`).
- **Cajero:** menú reducido (Ventas, Catálogos), inicio «Tu turno de caja», puede cobrar y cancelar ventas abiertas; no cancela ventas pagadas ni entra a inventario/pagos/cancelaciones.
- **Administrador:** menú completo, módulos técnicos en inicio, inventario y reportes.
- Promover en SQL (reemplaza el uuid del usuario):

```sql
update public.perfiles set rol = 'administrador' where id = '…';
```

## Login

- Inventario, ventas, pagos y cancelaciones requieren sesión Supabase (JWT), no solo el correo en el navegador.
- Entrar en `/login` con correo y contraseña.
- Si el registro pide confirmar email: usa un usuario ya confirmado o `npm run auth:sin-confirmacion` con token de proyecto (solo quien administra Supabase).

## Arranque local

```bash
npm install
npm run dev
```

Abre la URL que muestra el terminal (`Local:`), normalmente http://localhost:3000.

## Guión de demo final (≈5 min)

Objetivo: ejecutar una venta, cancelarla y mostrar el impacto en inventario.

1. **Login** en `/login`.
2. **Inventario** (`/inventario`): registrar una entrada a un producto vendible del catálogo (comida preparada o empacado). Anota la existencia después.
3. **Ventas** (`/ventas`): nueva venta abierta → agregar línea(s) de ese producto → **Cobrar venta** (efectivo, tarjeta o transferencia).
4. **Inventario**: comprobar que bajó la existencia y que aparece un movimiento `salida_venta` en movimientos recientes.
5. **Ventas**: en la misma venta cobrada, **Cancelar y devolver existencia** con un motivo.
6. **Inventario**: existencia restaurada y movimiento `cancelacion` en la lista.
7. Opcional: **Pagos** y **Cancelaciones** para ver el historial de cobros y motivos.

## Quién construye qué

- Slytherin: inventario (entradas) y ventas (cobro/cancelación).
- Otros equipos: login, catálogos, combos, recetas según el menú del repo.