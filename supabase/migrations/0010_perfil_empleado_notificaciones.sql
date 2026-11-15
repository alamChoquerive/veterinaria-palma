-- ============================================================
-- Veterinaria Palma — Migración 0010: foto de perfil, rol empleado
--   y preferencias de notificaciones
--
--   - perfiles.foto_url: foto de perfil editable desde Perfil/Ajustes
--     (el email NO se toca: el trigger proteger_campos_perfil lo bloquea)
--   - el CHECK de perfiles.rol pasa a incluir 'empleado' (el sidebar
--     restringido del empleado llega con el POS, pero el alta de
--     empleados desde el panel ya puede asignar el rol)
--   - asignar_rol acepta 'empleado'
--   - config_tienda: claves notif_* para las preferencias de
--     notificaciones del panel (stock bajo, nuevo pedido, pago
--     confirmado, turno nuevo)
-- ============================================================

alter table public.perfiles
  add column if not exists foto_url text;

-- Rol empleado (además de minorista | mayorista | admin)
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles
  add constraint perfiles_rol_check
  check (rol in ('minorista', 'mayorista', 'admin', 'empleado'));

-- asignar_rol también acepta 'empleado'
create or replace function public.asignar_rol(p_email text, p_rol text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_rol not in ('minorista', 'mayorista', 'admin', 'empleado') then
    raise exception 'Rol inválido: %', p_rol;
  end if;

  select id into v_id
  from public.perfiles
  where email = lower(btrim(p_email));

  if not found then
    raise exception 'No existe un perfil con el email %', p_email;
  end if;

  update public.perfiles set rol = p_rol where id = v_id;
end;
$$;

revoke execute on function public.asignar_rol(text, text) from public, anon, authenticated, service_role;

-- Preferencias de notificaciones (default: todas activas)
insert into public.config_tienda (clave, valor) values
  ('notif_stock_bajo', 'true'),
  ('notif_nuevo_pedido', 'true'),
  ('notif_pago_confirmado', 'true'),
  ('notif_turno_nuevo', 'true')
on conflict (clave) do nothing;
