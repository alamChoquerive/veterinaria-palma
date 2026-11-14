-- ============================================================
-- Veterinaria Palma — Migración 0007: promover usuarios desde el SQL Editor
--
-- El trigger proteger_campos_perfil (0002) bloqueaba cambiar rol/email/id
-- salvo admin, pero es_admin() usa auth.uid(), que es NULL cuando se corre
-- SQL a mano (rol postgres en el SQL Editor): el propio operador quedaba
-- bloqueado al promover el primer admin.
--
-- Corrección: el trigger solo bloquea cuando hay un USUARIO AUTENTICADO
-- de la app (auth.uid() is not null). Los operadores de la base (postgres
-- vía SQL Editor, service_role vía servidor) no tienen auth.uid() y pueden
-- cambiar esos campos; los usuarios de la app siguen sin poder auto-promoverse.
--
-- Además se agrega public.asignar_rol(email, rol), SECURITY DEFINER y
-- ejecutable SOLO por postgres (se revoca a public/anon/authenticated/
-- service_role), para promover usuarios de forma controlada y validada.
-- ============================================================

create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo se bloquea a usuarios autenticados de la app que no son admin.
  -- auth.uid() es null para el operador de la base (SQL Editor) y para
  -- service_role, que ya bypassa RLS y es solo del servidor.
  if auth.uid() is not null and not public.es_admin() then
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

-- Helper del operador: asignar rol a un perfil existente por email.
create or replace function public.asignar_rol(p_email text, p_rol text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_rol not in ('minorista', 'mayorista', 'admin') then
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

-- Nadie de la app puede ejecutarla: solo el dueño (postgres, SQL Editor)
revoke execute on function public.asignar_rol(text, text) from public, anon, authenticated, service_role;
