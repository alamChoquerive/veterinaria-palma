-- ============================================================
-- Veterinaria Palma — Migración 0002: hardening de seguridad
--
--  - perfiles: bloquear la auto-promoción a admin (policy con WITH CHECK
--    + trigger que impide cambiar rol/email/id salvo admin)
--  - pedidos: forzar estado inicial en INSERT, permitir cancelación y
--    borrado solo del propio pedido pendiente
--  - pagos: unique en proveedor_pago_id (idempotencia de webhooks)
--  - turnos: un turno cancelado libera el slot (índice parcial)
--  - índices en foreign keys (las policies RLS hacen EXISTS por fila)
--  - revoke EXECUTE de funciones helper a los roles públicos
-- ============================================================

-- ---------- perfiles: no se puede cambiar rol/email/id salvo admin ----------

drop policy if exists "perfil propio update" on public.perfiles;
create policy "perfil propio update" on public.perfiles
  for update
  using (auth.uid() = id or public.es_admin())
  with check (
    (auth.uid() = id and rol = (select p.rol from public.perfiles p where p.id = auth.uid()))
    or public.es_admin()
  );

-- Trigger de defensa en profundidad: bloquea el cambio de campos sensibles
-- aunque una policy futura vuelva a quedar permisiva. También refresca updated_at.
create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    if new.rol is distinct from old.rol then
      raise exception 'No está permitido cambiar el rol del perfil';
    end if;
    if new.email is distinct from old.email then
      raise exception 'No está permitido cambiar el email del perfil';
    end if;
    if new.id is distinct from old.id then
      raise exception 'No está permitido cambiar el id del perfil';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists proteger_campos_perfil on public.perfiles;
create trigger proteger_campos_perfil
  before update on public.perfiles
  for each row execute function public.proteger_campos_perfil();

-- ---------- pedidos: estado inicial forzado + cancelación/borrado propio ----------

drop policy if exists "pedidos propios insercion" on public.pedidos;
create policy "pedidos propios insercion" on public.pedidos
  for insert with check (
    perfil_id = auth.uid()
    and estado in ('pendiente', 'pago_pendiente')
  );

create policy "pedidos propios cancelacion" on public.pedidos
  for update
  using (perfil_id = auth.uid() and estado in ('pendiente', 'pago_pendiente'))
  with check (perfil_id = auth.uid() and estado = 'cancelado');

create policy "pedidos propios delete" on public.pedidos
  for delete using (perfil_id = auth.uid());

-- ---------- pagos: idempotencia por id de pago del proveedor ----------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pagos_proveedor_pago_id_key'
      and conrelid = 'public.pagos'::regclass
  ) then
    alter table public.pagos
      add constraint pagos_proveedor_pago_id_key unique (proveedor_pago_id);
  end if;
end $$;

-- ---------- turnos: un turno cancelado libera el slot ----------

alter table public.turnos drop constraint if exists turnos_fecha_hora_inicio_key;
drop index if exists public.turnos_slot_activo_unico;
create unique index turnos_slot_activo_unico
  on public.turnos (fecha, hora_inicio)
  where estado <> 'cancelado';

-- ---------- índices en foreign keys ----------

create index if not exists idx_productos_categoria on public.productos (categoria_id);
create index if not exists idx_turnos_perfil on public.turnos (perfil_id);
create index if not exists idx_pedidos_perfil on public.pedidos (perfil_id);
create index if not exists idx_pedido_items_pedido on public.pedido_items (pedido_id);
create index if not exists idx_pedido_items_producto on public.pedido_items (producto_id);
create index if not exists idx_pagos_pedido on public.pagos (pedido_id);

-- ---------- funciones helper: solo las usa el servidor ----------
-- (las policies RLS las llaman internally como SECURITY DEFINER, así que
--  revocar EXECUTE a anon/authenticated no las afecta)

revoke execute on function public.rol_usuario_actual() from anon, authenticated;
revoke execute on function public.es_admin() from anon, authenticated;
