# Demo delivery — ciclo completo

Objetivo de capacitación: **desde que el restaurante recibe el pedido hasta que llega al cliente**.

Modo actual: **sin Supabase** (`localStorage` + `sessionStorage`).

## Estados del recorrido

| Estado | Quién lo ve | Qué significa |
|--------|-------------|----------------|
| `recibido` | Cliente + cocina | Restaurante acaba de tomar el pedido (tras cobro en checkout). |
| `preparando` | Cliente + cocina | Cocina en trabajo. |
| `en_camino` | Cliente + cocina | Reparto hacia la dirección. |
| `entregado` | Cliente | Pedido en manos del cliente. Sale de la cola activa de cocina. |

## Guión de demo (dos pestañas)

**Pestaña cliente (móvil o ventana angosta)**

1. [http://localhost:3000/delivery](http://localhost:3000/delivery)
2. Añadir productos → carrito → checkout → **Confirmar y pagar**
3. Quedarse en **/delivery/pedido/D-…** (línea de tiempo en vivo)

**Pestaña restaurante**

1. [http://localhost:3000/login](http://localhost:3000/login) si cocina pide sesión
2. [http://localhost:3000/delivery/cocina](http://localhost:3000/delivery/cocina)
3. Mismo folio: **Recibido → Preparando → En camino → Marcar entregado al cliente**
4. Opcional: **Abrir vista cliente** en nueva pestaña para proyectar

**Cierre:** en la pestaña cliente debe aparecer **¡Llegó a tu puerta!** y los cuatro pasos en verde.

## Notas

- Mismo navegador = mismo `localStorage` (sincronización entre pestañas).
- Dos dispositivos requieren después conectar Supabase.
- POS clásico sigue en `/ventas`; enlace **POS** arriba en delivery.

## Supabase (opcional)

1. Migración `supabase/migrations/20261127120000_ventas_delivery.sql`
2. Auth anónimo activado · checkout reutiliza `cobrarVenta` (inventario real)
3. Sin migración: modo local automático

Ver también [`desarrollo-local.md`](desarrollo-local.md).