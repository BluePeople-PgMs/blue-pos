-- Fase 1 delivery: notas del cliente, calificación única, vista repartidor, mensajes de carrera.

alter table public.delivery_orders
  add column if not exists delivery_notes text;

comment on column public.delivery_orders.delivery_notes is
  'Referencias de entrega indicadas por el cliente (ej. color de fachada, entre calles).';

drop function if exists public.delivery_crear_pedido(text, jsonb);

create or replace function public.delivery_crear_pedido(
  p_direccion text,
  p_items jsonb,
  p_notas text default null
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
  v_notas text;
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

  v_notas := nullif(trim(coalesce(p_notas, '')), '');

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
    delivery_notes,
    estimated_delivery_time,
    folio
  ) values (
    v_uid,
    'PENDIENTE',
    trim(p_direccion),
    v_notas,
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

create or replace function public.delivery_iniciar_entrega(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := public.delivery_rol_usuario();
  v_status text;
begin
  if v_rol is distinct from 'repartidor' then
    raise exception 'Solo repartidor';
  end if;

  select status into v_status
  from public.delivery_orders
  where id = p_order_id;

  if v_status is null then
    raise exception 'Pedido no encontrado';
  end if;

  if v_status = 'EN_CAMINO' then
    raise exception 'Otro repartidor ya tomó este pedido; actualiza la lista e intenta con otro.';
  end if;

  update public.delivery_orders
  set
    status = 'EN_CAMINO',
    driver_id = auth.uid(),
    in_transit_at = now()
  where id = p_order_id
    and status = 'LISTO_PARA_PICKUP';

  if not found then
    raise exception 'Pedido no disponible para tomar (puede haber sido tomado por otro repartidor)';
  end if;
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
declare
  v_row public.delivery_orders%rowtype;
begin
  if public.delivery_rol_usuario() is distinct from 'cliente' then
    raise exception 'Solo el cliente';
  end if;

  select * into v_row
  from public.delivery_orders
  where id = p_order_id
    and customer_id = auth.uid();

  if not found then
    raise exception 'No se puede calificar este pedido';
  end if;

  if v_row.status is distinct from 'ENTREGADO' then
    raise exception 'Solo puedes calificar pedidos entregados';
  end if;

  if v_row.order_rating is not null or v_row.driver_rating is not null then
    raise exception 'Este pedido ya fue calificado (una sola vez)';
  end if;

  if p_order_rating is null and p_driver_rating is null then
    raise exception 'Indica al menos una calificación';
  end if;

  if p_order_rating is not null and (p_order_rating < 1 or p_order_rating > 5) then
    raise exception 'Calificación de pedido inválida';
  end if;
  if p_driver_rating is not null and (p_driver_rating < 1 or p_driver_rating > 5) then
    raise exception 'Calificación de repartidor inválida';
  end if;

  update public.delivery_orders
  set
    order_rating = p_order_rating,
    driver_rating = p_driver_rating
  where id = p_order_id
    and customer_id = auth.uid()
    and status = 'ENTREGADO';

  if not found then
    raise exception 'No se puede calificar este pedido';
  end if;
end;
$$;

create or replace view public.delivery_order_driver_display
with (security_invoker = true)
as
select
  o.id as order_id,
  o.folio,
  o.status,
  o.customer_id,
  o.driver_id,
  p.nombre as driver_nombre
from public.delivery_orders o
left join public.perfiles p on p.id = o.driver_id
where o.status = 'EN_CAMINO';

grant select on public.delivery_order_driver_display to authenticated;

grant execute on function public.delivery_crear_pedido(text, jsonb, text) to authenticated;
grant execute on function public.delivery_iniciar_entrega(uuid) to authenticated;
grant execute on function public.delivery_calificar(uuid, int, int) to authenticated;