-- ============================================================
-- Veterinaria Palma — Esquema inicial (migración 0001)
-- Aplicar en: Supabase Dashboard → SQL Editor, o con
--   supabase db push (CLI linkeado al proyecto)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- Tablas ----------

-- Perfil de usuario (extiende auth.users). Roles: minorista | mayorista | admin
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text,
  apellido text,
  telefono text,
  rol text not null default 'minorista'
    check (rol in ('minorista', 'mayorista', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categorias (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

-- Productos de la tienda. Doble precio: minorista y mayorista.
create table if not exists public.productos (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid references public.categorias (id) on delete set null,
  nombre text not null,
  descripcion text,
  precio_minorista numeric(12, 2) not null check (precio_minorista >= 0),
  precio_mayorista numeric(12, 2) not null check (precio_mayorista >= 0),
  stock integer not null default 0 check (stock >= 0),
  stock_minimo integer not null default 0 check (stock_minimo >= 0),
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Turnos de la veterinaria. Un turno por horario (unique fecha+hora_inicio).
create table if not exists public.turnos (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  motivo text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmado', 'atendido', 'cancelado')),
  notas text,
  created_at timestamptz not null default now(),
  unique (fecha, hora_inicio)
);

create table if not exists public.pedidos (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid references public.perfiles (id) on delete set null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'pago_pendiente', 'pagado', 'preparando',
                    'enviado', 'entregado', 'retiro_pendiente', 'cancelado')),
  metodo_entrega text not null
    check (metodo_entrega in ('retiro_tienda', 'envio_local', 'envio_provincial')),
  direccion_envio text,
  costo_envio numeric(12, 2) not null default 0 check (costo_envio >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Items del pedido con precio congelado según el rol del comprador en ese momento.
create table if not exists public.pedido_items (
  id uuid primary key default uuid_generate_v4(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

-- Pagos recibidos vía webhook de Mercado Pago.
create table if not exists public.pagos (
  id uuid primary key default uuid_generate_v4(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  proveedor text not null default 'mercadopago',
  proveedor_pago_id text,
  estado text not null,
  monto numeric(12, 2) not null check (monto >= 0),
  raw jsonb,
  created_at timestamptz not null default now()
);

-- Zonas de envío: local (ciudad) vs provincial, con costo fijo por zona.
create table if not exists public.zonas_envio (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  tipo text not null check (tipo in ('local', 'provincial')),
  costo numeric(12, 2) not null default 0 check (costo >= 0),
  activo boolean not null default true
);

insert into public.zonas_envio (nombre, tipo, costo) values
  ('Retiro en tienda', 'local', 0),
  ('Envío local (ciudad)', 'local', 0),
  ('Envío provincial', 'provincial', 0)
on conflict do nothing;

-- ---------- Función helper de rol ----------

create or replace function public.rol_usuario_actual()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select rol from public.perfiles where id = auth.uid()
$$;

create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  )
$$;

-- ---------- Trigger: perfil automático al registrarse ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre, apellido)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'apellido'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------

alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.turnos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.pagos enable row level security;
alter table public.zonas_envio enable row level security;

-- perfiles: cada uno ve/edita su perfil; admin ve todo
create policy "perfil propio lectura" on public.perfiles
  for select using (auth.uid() = id or public.es_admin());
create policy "perfil propio update" on public.perfiles
  for update using (auth.uid() = id or public.es_admin());
create policy "perfil admin insert" on public.perfiles
  for insert with check (public.es_admin());

-- catálogo: lectura pública, escritura solo admin
create policy "catalogo publico lectura" on public.categorias
  for select using (true);
create policy "categorias admin escritura" on public.categorias
  for all using (public.es_admin()) with check (public.es_admin());

create policy "productos publico lectura" on public.productos
  for select using (true);
create policy "productos admin escritura" on public.productos
  for all using (public.es_admin()) with check (public.es_admin());

create policy "zonas publico lectura" on public.zonas_envio
  for select using (activo = true);
create policy "zonas admin escritura" on public.zonas_envio
  for all using (public.es_admin()) with check (public.es_admin());

-- turnos: el cliente ve/cancela los suyos; admin gestiona todos
create policy "turnos propios lectura" on public.turnos
  for select using (perfil_id = auth.uid() or public.es_admin());
create policy "turnos propios insercion" on public.turnos
  for insert with check (perfil_id = auth.uid());
create policy "turnos propios update" on public.turnos
  for update using (perfil_id = auth.uid() or public.es_admin());
create policy "turnos admin delete" on public.turnos
  for delete using (public.es_admin());

-- pedidos: el cliente ve los suyos; admin ve y gestiona todos
create policy "pedidos propios lectura" on public.pedidos
  for select using (perfil_id = auth.uid() or public.es_admin());
create policy "pedidos propios insercion" on public.pedidos
  for insert with check (perfil_id = auth.uid());
create policy "pedidos admin update" on public.pedidos
  for update using (public.es_admin());

create policy "pedido_items lectura" on public.pedido_items
  for select using (
    exists (select 1 from public.pedidos p
            where p.id = pedido_id and (p.perfil_id = auth.uid() or public.es_admin()))
  );
create policy "pedido_items insercion" on public.pedido_items
  for insert with check (
    exists (select 1 from public.pedidos p
            where p.id = pedido_id and p.perfil_id = auth.uid())
  );

-- pagos: lectura para dueño del pedido o admin; escritura solo vía service role (webhook)
create policy "pagos lectura" on public.pagos
  for select using (
    exists (select 1 from public.pedidos p
            where p.id = pedido_id and (p.perfil_id = auth.uid() or public.es_admin()))
  );
