-- ============================================================
-- Veterinaria Palma — Migración 0011: rol empleado y POS (venta presencial)
--
--   - es_staff(): admin o empleado
--   - policies: el staff (admin + empleado) lee turnos y pedidos;
--     el empleado NO escribe productos/pedidos directo (ver RPCs)
--   - ventas + venta_items: ventas presenciales del POS
--   - RPC crear_venta_presencial(...): valida stock, calcula total con
--     precio minorista, inserta venta + items y descuenta stock de forma
--     atómica (advisory lock); ejecutable SOLO por service_role
--   - RPC actualizar_producto_basico(...): el empleado solo puede cambiar
--     nombre e imagen del producto (no precios ni stock)
-- ============================================================

-- ---------- helper de staff ----------

create or replace function public.es_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('admin', 'empleado')
  )
$$;

-- ---------- perfiles: el staff lee los datos de los clientes ----------
-- (los paneles de turnos, pedidos y POS muestran nombre/email del cliente
-- y del vendedor)

drop policy if exists "perfil propio lectura" on public.perfiles;
create policy "perfiles lectura staff" on public.perfiles
  for select using (id = auth.uid() or public.es_staff());

-- ---------- turnos: el staff lee y gestiona todos ----------

drop policy if exists "turnos propios lectura" on public.turnos;
create policy "turnos lectura staff" on public.turnos
  for select using (perfil_id = auth.uid() or public.es_staff());

drop policy if exists "turnos propios update" on public.turnos;
create policy "turnos update staff" on public.turnos
  for update
  using (perfil_id = auth.uid() or public.es_staff())
  with check (perfil_id = auth.uid() or public.es_staff());

-- ---------- pedidos: el staff lee todos ----------

drop policy if exists "pedidos propios lectura" on public.pedidos;
create policy "pedidos lectura staff" on public.pedidos
  for select using (perfil_id = auth.uid() or public.es_staff());

-- ---------- ventas presenciales (POS) ----------

create table if not exists public.ventas (
  id uuid primary key default uuid_generate_v4(),
  perfil_id uuid not null references public.perfiles (id), -- quién vendió (staff)
  cliente_nombre text, -- opcional, para el ticket
  metodo_pago text not null check (metodo_pago in ('efectivo', 'mercadopago')),
  estado text not null default 'pagada'
    check (estado in ('pagada', 'pago_pendiente', 'cancelado')),
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.venta_items (
  id uuid primary key default uuid_generate_v4(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create index if not exists ventas_creada_idx on public.ventas (created_at desc);
create index if not exists venta_items_venta_idx on public.venta_items (venta_id);

alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;

-- Solo el staff ve las ventas; NADIE escribe directo: solo la RPC
-- con service_role (igual que crear_pedido / crear_turno)
create policy "ventas lectura staff" on public.ventas
  for select using (public.es_staff());
create policy "venta_items lectura staff" on public.venta_items
  for select using (public.es_staff());

-- ---------- RPC: crear venta presencial (POS) ----------

create or replace function public.crear_venta_presencial(
  p_perfil_id uuid,
  p_cliente_nombre text,
  p_metodo_pago text,
  p_items jsonb -- [{ "producto_id": "uuid", "cantidad": 2 }]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_metodo text;
  v_item jsonb;
  v_producto_id uuid;
  v_cantidad int;
  v_precio numeric(12, 2);
  v_stock int;
  v_total numeric(12, 2) := 0;
  v_venta_id uuid;
begin
  -- Solo staff (admin o empleado) puede vender en el POS
  select rol into v_rol from public.perfiles where id = p_perfil_id;
  if v_rol is null then
    raise exception 'Perfil no encontrado';
  end if;
  if v_rol not in ('admin', 'empleado') then
    raise exception 'Solo el personal de la tienda puede registrar ventas presenciales';
  end if;

  if p_metodo_pago not in ('efectivo', 'mercadopago') then
    raise exception 'Método de pago inválido';
  end if;
  v_metodo := p_metodo_pago;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene productos';
  end if;

  -- Serializa las ventas para que el descuento de stock sea atómico
  perform pg_advisory_xact_lock(hashtext('venta:stock'));

  -- Validar items, calcular total y preparar descuento de stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_producto_id := (v_item ->> 'producto_id')::uuid;
    v_cantidad := (v_item ->> 'cantidad')::int;

    if v_cantidad is null or v_cantidad <= 0 then
      raise exception 'Cantidad inválida en uno de los productos';
    end if;

    select precio_minorista, stock into v_precio, v_stock
    from public.productos
    where id = v_producto_id and activo = true;

    if not found then
      raise exception 'Producto no encontrado o inactivo';
    end if;

    if v_stock < v_cantidad then
      raise exception 'Stock insuficiente (quedan % unidades)', v_stock;
    end if;

    v_total := v_total + v_precio * v_cantidad;
  end loop;

  insert into public.ventas (perfil_id, cliente_nombre, metodo_pago, estado, total)
  values (
    p_perfil_id,
    nullif(btrim(p_cliente_nombre), ''),
    v_metodo,
    case when v_metodo = 'efectivo' then 'pagada' else 'pago_pendiente' end,
    v_total
  )
  returning id into v_venta_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_producto_id := (v_item ->> 'producto_id')::uuid;
    v_cantidad := (v_item ->> 'cantidad')::int;

    select precio_minorista into v_precio
    from public.productos where id = v_producto_id;

    insert into public.venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    values (v_venta_id, v_producto_id, v_cantidad, v_precio, v_precio * v_cantidad);

    update public.productos
    set stock = stock - v_cantidad, updated_at = now()
    where id = v_producto_id;
  end loop;

  return jsonb_build_object('venta_id', v_venta_id, 'total', v_total);
end;
$$;

revoke execute on function public.crear_venta_presencial(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.crear_venta_presencial(uuid, text, text, jsonb) to service_role;

-- ---------- RPC: edición básica de producto (empleado: solo nombre y foto) ----------

create or replace function public.actualizar_producto_basico(
  p_producto_id uuid,
  p_nombre text,
  p_imagen_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(btrim(p_nombre), '') is null or length(btrim(p_nombre)) < 2 then
    raise exception 'El nombre debe tener al menos 2 caracteres';
  end if;

  if not exists (select 1 from public.productos where id = p_producto_id) then
    raise exception 'Producto no encontrado';
  end if;

  update public.productos
  set nombre = btrim(p_nombre),
      imagen_url = nullif(btrim(p_imagen_url), ''),
      updated_at = now()
  where id = p_producto_id;
end;
$$;

revoke execute on function public.actualizar_producto_basico(uuid, text, text) from public, anon, authenticated;
grant execute on function public.actualizar_producto_basico(uuid, text, text) to service_role;
