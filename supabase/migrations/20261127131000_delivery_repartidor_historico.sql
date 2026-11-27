-- Repartidor: lectura de pedidos ENTREGADO propios (tab histórico).

drop policy if exists delivery_orders_repartidor_select on public.delivery_orders;

create policy delivery_orders_repartidor_select
  on public.delivery_orders for select to authenticated
  using (
    public.delivery_rol_usuario() = 'repartidor'
    and (
      status = 'LISTO_PARA_PICKUP'
      or (status in ('EN_CAMINO', 'ENTREGADO') and driver_id = auth.uid())
    )
  );

drop policy if exists delivery_order_items_select on public.delivery_order_items;

create policy delivery_order_items_select
  on public.delivery_order_items for select to authenticated
  using (
    exists (
      select 1 from public.delivery_orders o
      where o.id = delivery_order_id
        and (
          o.customer_id = auth.uid()
          or public.delivery_rol_usuario() in ('mesero', 'administrador')
          or (
            public.delivery_rol_usuario() = 'repartidor'
            and (
              o.status = 'LISTO_PARA_PICKUP'
              or (o.status in ('EN_CAMINO', 'ENTREGADO') and o.driver_id = auth.uid())
            )
          )
        )
    )
  );