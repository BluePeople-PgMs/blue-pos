-- Pedidos delivery + RPC (transiciones e inventario al entregar).

create table public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete restrict,
  packer_id uuid references public.perfiles (id),
  driver_id uuid references public.perfiles (id),
  status text not null default 'PENDIENTE',
  pickup_address text not null default 'Walmart Av. de los Maestros, Aguascalientes, Ags.',
  delivery_address text not null,
  delivery_lat numeric,
  delivery_lng numeric,
  estimated_delivery_time timestamptz,
  order_rating int,
  driver_rating int,
  packing_started_at timestamptz,
  ready_for_pickup_at timestamptz,
  in_transit_at timestamptz,
  delivered_at timestamptz,
  folio text,
  created_at timestamptz not null default now(),
  constraint delivery_orders_status check (
    status in (
      'PENDIENTE',
      'EMPACANDO',
      'LISTO_PARA_PICKUP',
      'EN_CAMINO',
      'ENTREGADO'
    )
  ),
  constraint delivery_orders_order_rating check (
    order_rating is null or order_rating between 1 and 5
  ),
  constraint delivery_orders_driver_rating check (
    driver_rating is null or driver_rating between 1 and 5
  )
);

create table public.delivery_order_items (
  id uuid primary key default gen_random_uuid(),
  delivery_order_id uuid not null references public.delivery_orders (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad numeric(12, 3) not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  notas text,
  es_combo boolean not null default false,
  is_packed boolean not null default false
);

create index delivery_orders_customer_id_idx on public.delivery_orders (customer_id);
create index delivery_orders_status_idx on public.delivery_orders (status);
create index delivery_order_items_order_id_idx on public.delivery_order_items (delivery_order_id);

alter table public.movimientos_inventario
  add column if not exists delivery_order_id uuid references public.delivery_orders (id);

alter table public.movimientos_inventario drop constraint if exists movimientos_origen;

alter table public.movimientos_inventario add constraint movimientos_origen check (
  (tipo = 'entrada' and venta_id is null and delivery_order_id is null)
  or (
    tipo = 'salida_venta'
    and (venta_id is not null or delivery_order_id is not null)
  )
  or (tipo = 'cancelacion' and venta_id is not null)
);

grant select, insert, update, delete on public.delivery_orders, public.delivery_order_items
to authenticated;

alter table public.delivery_orders enable row level security;
alter table public.delivery_order_items enable row level security;

create or replace function public.delivery_rol_usuario()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rol from public.perfiles where id = auth.uid()),
    'cliente'
  );
$$;

create policy delivery_orders_cliente_select
  on public.delivery_orders for select to authenticated
  using (customer_id = auth.uid());

create policy delivery_orders_ops_select
  on public.delivery_orders for select to authenticated
  using (public.delivery_rol_usuario() in ('mesero', 'administrador'));

create policy delivery_orders_repartidor_select
  on public.delivery_orders for select to authenticated
  using (
    public.delivery_rol_usuario() = 'repartidor'
    and (
      status = 'LISTO_PARA_PICKUP'
      or (status = 'EN_CAMINO' and driver_id = auth.uid())
    )
  );

create policy delivery_orders_cliente_insert
  on public.delivery_orders for insert to authenticated
  with check (
    customer_id = auth.uid()
    and public.delivery_rol_usuario() = 'cliente'
    and status = 'PENDIENTE'
  );

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
              or (o.status = 'EN_CAMINO' and o.driver_id = auth.uid())
            )
          )
        )
    )
  );

create policy delivery_order_items_cliente_insert
  on public.delivery_order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.delivery_orders o
      where o.id = delivery_order_id
        and o.customer_id = auth.uid()
        and o.status = 'PENDIENTE'
    )
  );

create or replace function public.delivery_stock_combo(
  p_combo_id uuid,
  p_cantidad numeric
) returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  r record;
  stock numeric;
  need numeric;
begin
  for r in
    select producto_id, cantidad as qty
    from public.combo_componentes
    where combo_id = p_combo_id
  loop
    need := r.qty * p_cantidad;
    select coalesce(e.cantidad, 0) into stock
    from public.existencias e
    where e.producto_id = r.producto_id;
    if stock < need then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.delivery_crear_pedido(
  p_direccion text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_rol text;
  v_order_id uuid;
  v_folio text;
  v_item jsonb;
  v_producto_id uuid;
  v_cantidad numeric;
  v_precio numeric;
  v_es_combo boolean;
  v_stock numeric;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  select rol into v_rol from public.perfiles where id = v_uid;
  if v_rol is distinct from 'cliente' then
    raise exception 'Solo clientes pueden crear pedidos delivery';
  end if;

  if trim(coalesce(p_direccion, '')) = '' then
    raise exception 'Falta dirección de entrega';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido necesita al menos un artículo';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::numeric;
    v_precio := (v_item->>'precio_unitario')::numeric;
    v_es_combo := coalesce((v_item->>'es_combo')::boolean, false);

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad inválida';
    end if;

    if v_es_combo then
      if not public.delivery_stock_combo(v_producto_id, v_cantidad) then
        raise exception 'Stock insuficiente para un combo del pedido';
      end if;
    else
      select coalesce(e.cantidad, 0) into v_stock
      from public.existencias e
      where e.producto_id = v_producto_id;
      if v_stock < v_cantidad then
        raise exception 'Stock insuficiente para un producto del pedido';
      end if;
    end if;
  end loop;

  v_folio := 'D-' || to_char(now(), 'YYYYMMDDHH24MISS') ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  insert into public.delivery_orders (
    customer_id,
    status,
    delivery_address,
    estimated_delivery_time,
    folio
  ) values (
    v_uid,
    'PENDIENTE',
    trim(p_direccion),
    now() + interval '45 minutes',
    v_folio
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.delivery_order_items (
      delivery_order_id,
      producto_id,
      cantidad,
      precio_unitario,
      es_combo
    ) values (
      v_order_id,
      (v_item->>'producto_id')::uuid,
      (v_item->>'cantidad')::numeric,
      (v_item->>'precio_unitario')::numeric,
      coalesce((v_item->>'es_combo')::boolean, false)
    );
  end loop;

  return jsonb_build_object('id', v_order_id, 'folio', v_folio);
end;
$$;

create or replace function public.delivery_iniciar_empaque(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.delivery_rol_usuario();
begin
  if v_rol not in ('mesero', 'administrador') then
    raise exception 'Sin permiso';
  end if;

  update public.delivery_orders
  set
    status = 'EMPACANDO',
    packer_id = auth.uid(),
    packing_started_at = coalesce(packing_started_at, now())
  where id = p_order_id
    and status = 'PENDIENTE';

  if not found then
    raise exception 'No se pudo iniciar empaque (estado o pedido inválido)';
  end if;
end;
$$;

create or replace function public.delivery_toggle_item_packed(
  p_item_id uuid,
  p_is_packed boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.delivery_rol_usuario();
  v_order_id uuid;
  v_status text;
begin
  if v_rol not in ('mesero', 'administrador') then
    raise exception 'Sin permiso';
  end if;

  select o.id, o.status into v_order_id, v_status
  from public.delivery_order_items i
  join public.delivery_orders o on o.id = i.delivery_order_id
  where i.id = p_item_id;

  if v_status is distinct from 'EMPACANDO' then
    raise exception 'Solo en empaque';
  end if;

  update public.delivery_order_items
  set is_packed = p_is_packed
  where id = p_item_id;
end;
$$;

create or replace function public.delivery_cerrar_empaque(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.delivery_rol_usuario();
  v_pendientes int;
begin
  if v_rol not in ('mesero', 'administrador') then
    raise exception 'Sin permiso';
  end if;

  select count(*) into v_pendientes
  from public.delivery_order_items
  where delivery_order_id = p_order_id
    and not is_packed;

  if v_pendientes > 0 then
    raise exception 'Faltan artículos por marcar en el checklist';
  end if;

  update public.delivery_orders
  set
    status = 'LISTO_PARA_PICKUP',
    ready_for_pickup_at = now()
  where id = p_order_id
    and status = 'EMPACANDO';

  if not found then
    raise exception 'No se pudo cerrar empaque';
  end if;
end;
$$;

create or replace function public.delivery_iniciar_entrega(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.delivery_rol_usuario();
begin
  if v_rol is distinct from 'repartidor' then
    raise exception 'Solo repartidor';
  end if;

  update public.delivery_orders
  set
    status = 'EN_CAMINO',
    driver_id = auth.uid(),
    in_transit_at = now()
  where id = p_order_id
    and status = 'LISTO_PARA_PICKUP';

  if not found then
    raise exception 'Pedido no disponible para tomar';
  end if;
end;
$$;

create or replace function public.delivery_aplicar_salidas_inventario(p_order_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  r_item record;
  r_comp record;
  v_cant numeric;
  v_exist numeric;
begin
  for r_item in
    select * from public.delivery_order_items where delivery_order_id = p_order_id
  loop
    if r_item.es_combo then
      for r_comp in
        select producto_id, cantidad as qty
        from public.combo_componentes
        where combo_id = r_item.producto_id
      loop
        v_cant := r_item.cantidad * r_comp.qty;
        insert into public.movimientos_inventario (
          producto_id,
          tipo,
          cantidad,
          delivery_order_id,
          nota
        ) values (
          r_comp.producto_id,
          'salida_venta',
          v_cant,
          p_order_id,
          'salida delivery'
        );
        update public.existencias
        set cantidad = cantidad - v_cant
        where producto_id = r_comp.producto_id;
      end loop;
    else
      v_cant := r_item.cantidad;
      insert into public.movimientos_inventario (
        producto_id,
        tipo,
        cantidad,
        delivery_order_id,
        nota
      ) values (
        r_item.producto_id,
        'salida_venta',
        v_cant,
        p_order_id,
        'salida delivery'
      );
      update public.existencias
      set cantidad = cantidad - v_cant
      where producto_id = r_item.producto_id;
    end if;
  end loop;
end;
$$;

create or replace function public.delivery_finalizar(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.delivery_rol_usuario();
begin
  if v_rol is distinct from 'repartidor' then
    raise exception 'Solo repartidor';
  end if;

  update public.delivery_orders
  set
    status = 'ENTREGADO',
    delivered_at = now()
  where id = p_order_id
    and status = 'EN_CAMINO'
    and driver_id = auth.uid();

  if not found then
    raise exception 'No se puede finalizar este pedido';
  end if;

  perform public.delivery_aplicar_salidas_inventario(p_order_id);
end;
$$;

create or replace function public.delivery_calificar(
  p_order_id uuid,
  p_order_rating int default null,
  p_driver_rating int default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.delivery_rol_usuario() is distinct from 'cliente' then
    raise exception 'Solo el cliente';
  end if;

  if p_order_rating is not null and (p_order_rating < 1 or p_order_rating > 5) then
    raise exception 'Calificación de pedido inválida';
  end if;
  if p_driver_rating is not null and (p_driver_rating < 1 or p_driver_rating > 5) then
    raise exception 'Calificación de repartidor inválida';
  end if;

  update public.delivery_orders
  set
    order_rating = coalesce(p_order_rating, order_rating),
    driver_rating = coalesce(p_driver_rating, driver_rating)
  where id = p_order_id
    and customer_id = auth.uid()
    and status = 'ENTREGADO';

  if not found then
    raise exception 'No se puede calificar este pedido';
  end if;
end;
$$;

grant execute on function public.delivery_crear_pedido(text, jsonb) to authenticated;
grant execute on function public.delivery_iniciar_empaque(uuid) to authenticated;
grant execute on function public.delivery_toggle_item_packed(uuid, boolean) to authenticated;
grant execute on function public.delivery_cerrar_empaque(uuid) to authenticated;
grant execute on function public.delivery_iniciar_entrega(uuid) to authenticated;
grant execute on function public.delivery_finalizar(uuid) to authenticated;
grant execute on function public.delivery_calificar(uuid, int, int) to authenticated;