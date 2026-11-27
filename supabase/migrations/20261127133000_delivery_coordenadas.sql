-- Coordenadas de entrega elegidas por el cliente en el mapa.

drop function if exists public.delivery_crear_pedido(text, jsonb);
drop function if exists public.delivery_crear_pedido(text, jsonb, text);

create or replace function public.delivery_crear_pedido(
  p_direccion text,
  p_items jsonb,
  p_notas text default null,
  p_lat numeric default null,
  p_lng numeric default null
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
    delivery_lat,
    delivery_lng,
    delivery_notes,
    estimated_delivery_time,
    folio
  ) values (
    v_uid,
    'PENDIENTE',
    trim(p_direccion),
    p_lat,
    p_lng,
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

grant execute on function public.delivery_crear_pedido(text, jsonb, text, numeric, numeric)
  to authenticated;