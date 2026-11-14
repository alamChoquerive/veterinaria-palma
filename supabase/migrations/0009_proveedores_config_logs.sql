-- ============================================================
-- Veterinaria Palma — Migración 0009: proveedores, medios de pago,
--   configuración de la tienda, logs de acceso y precio de costo
--
-- Nuevas tablas para el panel admin (paso 3 y 4):
--   - proveedores: catálogo interno de proveedores (solo admin)
--   - medios_pago: medios de pago habilitados (lectura pública solo
--     los activos; escritura solo admin)
--   - config_tienda: clave/valor (márgenes globales, datos de la tienda)
--   - logs_acceso: intentos de login (solo lectura admin; se inserta
--     solo con service_role desde el servidor, nunca por RLS)
--
-- Además: productos.precio_costo para calcular márgenes globales
-- (los precios de venta los fija el admin, el costo es referencia).
-- ============================================================

-- ---------- precio de costo en productos (nullable: los viejos no lo tienen) ----------

alter table public.productos
  add column if not exists precio_costo numeric(12, 2) check (precio_costo >= 0);

-- ---------- proveedores ----------

create table if not exists public.proveedores (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  contacto_nombre text,
  email text,
  telefono text,
  categoria text not null default 'general', -- qué provee (alimentos, farmacia, etc.)
  descripcion text,
  activo boolean not null default true,
  monto_pendiente numeric(12, 2) not null default 0 check (monto_pendiente >= 0),
  ultimo_pedido_fecha date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.proveedores enable row level security;
-- Solo el admin ve y administra proveedores (datos internos de contacto)
create policy "proveedores admin lectura" on public.proveedores
  for select using (public.es_admin());
create policy "proveedores admin escritura" on public.proveedores
  for all using (public.es_admin()) with check (public.es_admin());

-- ---------- medios de pago habilitados ----------

create table if not exists public.medios_pago (
  id uuid primary key default uuid_generate_v4(),
  clave text not null unique, -- 'mercadopago', 'efectivo', 'transferencia'
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.medios_pago enable row level security;
-- Cualquiera puede ver cuáles están habilitados (checkout / POS)
create policy "medios pago publico lectura activos" on public.medios_pago
  for select using (activo = true);
create policy "medios pago admin lectura" on public.medios_pago
  for select using (public.es_admin());
create policy "medios pago admin escritura" on public.medios_pago
  for all using (public.es_admin()) with check (public.es_admin());

insert into public.medios_pago (clave, nombre, activo) values
  ('mercadopago', 'Mercado Pago', true),
  ('efectivo', 'Efectivo', true),
  ('transferencia', 'Transferencia bancaria', false)
on conflict (clave) do nothing;

-- ---------- configuración de la tienda (clave/valor) ----------

create table if not exists public.config_tienda (
  clave text primary key,
  valor text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.config_tienda enable row level security;
create policy "config tienda publico lectura" on public.config_tienda
  for select using (true);
create policy "config tienda admin escritura" on public.config_tienda
  for all using (public.es_admin()) with check (public.es_admin());

insert into public.config_tienda (clave, valor) values
  ('nombre_tienda', 'Veterinaria Palma'),
  ('cuit', ''),
  ('direccion', ''),
  ('telefono_tienda', ''),
  ('margen_minorista_pct', '30'),
  ('margen_mayorista_pct', '15')
on conflict (clave) do nothing;

-- ---------- logs de acceso (intentos de login) ----------

create table if not exists public.logs_acceso (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid references public.perfiles (id) on delete set null,
  email text not null,
  exito boolean not null,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists logs_acceso_creado_idx on public.logs_acceso (created_at desc);

alter table public.logs_acceso enable row level security;
-- Solo el admin lee los logs; NADIE inserta por RLS: se escribe solo
-- con service_role desde el servidor (loginAction), así un atacante no
-- puede inundar la tabla ni leer quién intentó entrar.
create policy "logs acceso admin lectura" on public.logs_acceso
  for select using (public.es_admin());
