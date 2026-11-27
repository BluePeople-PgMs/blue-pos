-- Entregas a domicilio: pedido independiente con flujo de estados.

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  folio text,
  estado text not null default 'recibido',
  cliente_nombre text not null,
  direccion text not null,
  telefono text,
  repartidor text,
  total numeric(12, 2) not null default 0,
  venta_id uuid references public.ventas (id),
  notas text,
  created_at timestamptz not null default now(),
  constraint entregas_estado check (
    estado in (
      'recibido',
      'en_preparacion',
      'listo_para_recoger',
      'en_camino',
      'entregado'
    )
  )
);

create table public.entrega_lineas (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references public.entregas (id) on delete cascade,
  producto_id uuid references public.productos (id),
  cantidad numeric(12, 3) not null,
  precio_unitario numeric(12, 2) not null,
  notas text,
  constraint entrega_lineas_cantidad check (cantidad > 0)
);

create index entregas_estado_created_idx on public.entregas (estado, created_at desc);
create index entrega_lineas_entrega_idx on public.entrega_lineas (entrega_id);

alter table public.entregas enable row level security;
alter table public.entrega_lineas enable row level security;

create policy entregas_authenticated_all
  on public.entregas
  for all
  to authenticated
  using (true)
  with check (true);

create policy entrega_lineas_authenticated_all
  on public.entrega_lineas
  for all
  to authenticated
  using (true)
  with check (true);

grant all on table public.entregas to authenticated;
grant all on table public.entrega_lineas to authenticated;