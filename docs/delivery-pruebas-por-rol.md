# Delivery — pruebas por rol (Fase 1)

Aplica primero las migraciones en tu proyecto Supabase (proyecto **blue-pos**).

## Migraciones SQL

En el **SQL Editor** de Supabase, ejecuta en orden:

1. `supabase/migrations/20261127110000_perfiles_cuatro_roles.sql`
2. `supabase/migrations/20261127120000_delivery_orders.sql`
3. `supabase/migrations/20261127130000_delivery_enhancements.sql`
4. `supabase/migrations/20261127131000_delivery_repartidor_historico.sql` (histórico repartidor)
5. `supabase/migrations/20261127132000_delivery_realtime.sql` (Realtime en `delivery_orders`)

O, si tienes `SUPABASE_DB_PASSWORD` en `.env.local`:

```bash
node scripts/apply-delivery-migration.mjs
```

Verificación remota (tablas, `delivery_notes`, vista y RPCs):

```bash
npm run verify:delivery-schema
# o: bash scripts/verify-delivery-schema.sh
```

Asigna roles en `perfiles` según el usuario de prueba:

```sql
-- Sustituye el uuid por auth.users.id del correo de prueba
update public.perfiles set rol = 'cliente' where id = '…';
update public.perfiles set rol = 'mesero' where id = '…';
update public.perfiles set rol = 'repartidor' where id = '…';
```

Opcional: nombre del repartidor (visible en seguimiento EN_CAMINO):

```sql
update public.perfiles set nombre = 'Carlos Repartidor' where rol = 'repartidor';
```

---

## Cliente

1. Inicia sesión con un usuario cuyo `perfiles.rol` sea `cliente`.
2. Abre **Delivery** en el menú.
3. Arma el carrito con productos o combos con stock.
4. Escribe **dirección de entrega** y, si la UI ya lo expone, **referencias** (ej. “casa azul, portón negro”). El backend guarda referencias en `delivery_orders.delivery_notes` vía RPC `delivery_crear_pedido` (`p_notas`).
5. Confirma el pedido; anota el **folio** y entra al seguimiento.
6. Mientras el estado no sea `ENTREGADO`, el seguimiento se actualiza con **Realtime** (y polling de respaldo cada ~8 s).
7. Si el pedido está `EN_CAMINO`, puedes consultar `delivery_order_driver_display` (desde la app o SQL) para ver `driver_nombre`.
8. Cuando el estado sea `ENTREGADO`, califica **una sola vez** (puedes enviar solo estrellas de pedido, solo repartidor, o ambas). Un segundo intento debe fallar con mensaje de ya calificado.

Consulta SQL útil:

```sql
select id, folio, status, delivery_notes, order_rating, driver_rating
from public.delivery_orders
order by created_at desc
limit 5;
```

---

## Mesero / administrador

1. Inicia sesión con `mesero` o `administrador`.
2. Abre **Delivery (operación)** y localiza pedidos en `PENDIENTE`.
3. **Iniciar empaque** → estado `EMPACANDO`.
4. Marca cada línea del checklist (**toggle empaquetado**).
5. **Cerrar empaque** cuando todo esté marcado → `LISTO_PARA_PICKUP`.
6. Revisa en la lista que el pedido ya no aparezca como pendiente de empaque.
7. En **Activos**, pedidos nuevos deberían aparecer sin recargar (Realtime; migración `27132000`).

Si falla el cierre, confirma en SQL que no queden ítems con `is_packed = false`:

```sql
select * from public.delivery_order_items
where delivery_order_id = '…' and not is_packed;
```

---

## Repartidor

1. Inicia sesión con `perfiles.rol = 'repartidor'`.
2. Abre **Delivery repartidor**; deben listarse pedidos `LISTO_PARA_PICKUP`.
3. **Tomar entrega** en un pedido → `EN_CAMINO` y `driver_id` = tu usuario.
4. Con **otra sesión** de repartidor (u otro navegador), intenta tomar el **mismo** pedido: debe aparecer error claro de que otro repartidor ya lo tomó.
5. Pestaña **Histórico**: entregas propias (`ENTREGADO`, requiere migración `27131000`).
6. Con el repartidor asignado, **Finalizar entrega** → `ENTREGADO` y movimientos de inventario (`salida_venta` con `delivery_order_id`).

Prueba de carrera (dos repartidores):

```sql
select id, status, driver_id from public.delivery_orders where folio = 'D-…';
```

---

## Checklist rápido Fase 1 backend

| Caso | Resultado esperado |
|------|-------------------|
| `p_notas` al crear pedido | `delivery_notes` guardado (o null si vacío) |
| Segundo repartidor en mismo pedido | RPC `delivery_iniciar_entrega` rechaza con mensaje de carrera |
| Calificar dos veces | Segunda llamada a `delivery_calificar` rechazada |
| Calificar solo pedido o solo repartidor | Primera llamada acepta parcial null |
| Vista EN_CAMINO | `delivery_order_driver_display` muestra `driver_nombre` |