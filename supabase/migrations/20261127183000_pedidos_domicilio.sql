-- Pedidos a domicilio. El estado de la venta de caja sigue siendo
-- abierta, cobrada o cancelada. Este recorrido es aparte.

create table public.pedidos_domicilio (
  id uuid primary key default gen_random_uuid(),
  folio text,
  cliente_nombre text not null,
  domicilio text not null,
  estado text not null default 'recibido',
  total numeric(12, 2) not null default 0,
  repartidor_nombre text,
  created_at timestamptz not null default now(),
  constraint pedidos_domicilio_estado check (
    estado in ('recibido', 'en_preparacion', 'listo', 'en_camino', 'entregado')
  ),
  constraint pedidos_domicilio_cliente check (char_length(btrim(cliente_nombre)) > 0),
  constraint pedidos_domicilio_domicilio check (char_length(btrim(domicilio)) > 0)
);

create table public.pedido_lineas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_domicilio (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  nombre text not null,
  cantidad numeric(12, 3) not null,
  precio_unitario numeric(12, 2) not null,
  constraint pedido_lineas_cantidad check (cantidad > 0),
  constraint pedido_lineas_nombre check (char_length(btrim(nombre)) > 0)
);

create index pedido_lineas_pedido_id_idx on public.pedido_lineas (pedido_id);

comment on table public.pedidos_domicilio is
  'Pedido a domicilio. Estados: recibido, en_preparacion, listo, en_camino, entregado.';

comment on column public.pedidos_domicilio.repartidor_nombre is
  'Quién recoge el pedido. Se llena al pasarlo a en_camino.';

grant select, insert, update, delete on
  public.pedidos_domicilio,
  public.pedido_lineas
to authenticated;

alter table public.pedidos_domicilio enable row level security;
alter table public.pedido_lineas enable row level security;

create policy pedidos_domicilio_authenticated_all
  on public.pedidos_domicilio
  for all
  to authenticated
  using (true)
  with check (true);

create policy pedido_lineas_authenticated_all
  on public.pedido_lineas
  for all
  to authenticated
  using (true)
  with check (true);
