-- ============================================================
-- Veterinaria Palma — Migración 0008: turnos presenciales
--
-- Permite registrar turnos desde el panel admin para atención
-- presencial (sin cuenta de cliente):
--   - perfil_id pasa a ser nullable (turno sin usuario registrado)
--   - nuevos campos: especialidad, mascota_nombre, mascota_especie,
--     responsable_nombre, responsable_telefono
--   - la RPC crear_turno pasa a recibir esos campos; si p_perfil_id es
--     null (turno presencial) se exige el nombre del responsable y no
--     aplica el límite de 1 turno por día (ese límite es por cuenta)
--
-- Sigue ejecutable SOLO por service_role.
-- ============================================================

alter table public.turnos
  add column if not exists especialidad text,
  add column if not exists mascota_nombre text,
  add column if not exists mascota_especie text,
  add column if not exists responsable_nombre text,
  add column if not exists responsable_telefono text;

-- Turno presencial: sin perfil asociado (la FK se mantiene para los online)
alter table public.turnos alter column perfil_id drop not null;

-- ---------- crear_turno con datos del turno presencial ----------

drop function if exists public.crear_turno(uuid, date, time, time, text);

create or replace function public.crear_turno(
  p_perfil_id uuid,
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time,
  p_motivo text,
  p_especialidad text,
  p_mascota_nombre text,
  p_mascota_especie text,
  p_responsable_nombre text,
  p_responsable_telefono text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_horario_desde time := '09:00'::time;
  v_horario_hasta time := '17:00'::time;
  v_intervalo_min int := 30;
  v_max_por_dia int := 1;
  v_solapa boolean;
  v_cantidad int;
  v_turno_id uuid;
begin
  -- Turno online (con cuenta): el perfil debe existir.
  -- Turno presencial (sin cuenta): se exige el nombre del responsable.
  if p_perfil_id is not null then
    if not exists (select 1 from public.perfiles where id = p_perfil_id) then
      raise exception 'Perfil no encontrado';
    end if;
  else
    if nullif(btrim(p_responsable_nombre), '') is null then
      raise exception 'Un turno presencial requiere el nombre del responsable';
    end if;
  end if;

  -- La fecha no puede ser pasada (hoy sí vale)
  if p_fecha < current_date then
    raise exception 'La fecha del turno no puede ser pasada';
  end if;

  -- Rango horario válido y dentro del horario de atención
  if p_hora_inicio is null or p_hora_fin is null or p_hora_fin <= p_hora_inicio then
    raise exception 'El rango horario del turno es inválido';
  end if;
  if p_hora_inicio < v_horario_desde or p_hora_fin > v_horario_hasta then
    raise exception 'El turno debe estar dentro del horario de atención (09:00 a 17:00)';
  end if;
  if mod(extract(epoch from (p_hora_inicio - v_horario_desde))::int / 60, v_intervalo_min) <> 0 then
    raise exception 'La hora de inicio debe ser en intervalos de % minutos', v_intervalo_min;
  end if;

  -- Serializar las reservas de un mismo día para evitar solapamientos
  -- por condiciones de carrera entre dos reservas concurrentes
  perform pg_advisory_xact_lock(hashtext('turno:' || p_fecha::text));

  select exists (
    select 1
    from public.turnos t
    where t.fecha = p_fecha
      and t.estado <> 'cancelado'
      and t.hora_inicio < p_hora_fin
      and t.hora_fin > p_hora_inicio
  ) into v_solapa;

  if v_solapa then
    raise exception 'Ya hay un turno reservado en ese horario';
  end if;

  -- Límite de 1 turno activo por día solo cuando hay cuenta asociada
  if p_perfil_id is not null then
    select count(*) into v_cantidad
    from public.turnos t
    where t.perfil_id = p_perfil_id
      and t.fecha = p_fecha
      and t.estado <> 'cancelado';

    if v_cantidad >= v_max_por_dia then
      raise exception 'Ya tenés un turno activo para ese día';
    end if;
  end if;

  insert into public.turnos (
    perfil_id, fecha, hora_inicio, hora_fin, motivo, estado,
    especialidad, mascota_nombre, mascota_especie,
    responsable_nombre, responsable_telefono
  )
  values (
    p_perfil_id,
    p_fecha,
    p_hora_inicio,
    p_hora_fin,
    nullif(btrim(p_motivo), ''),
    'pendiente',
    nullif(btrim(p_especialidad), ''),
    nullif(btrim(p_mascota_nombre), ''),
    nullif(btrim(p_mascota_especie), ''),
    nullif(btrim(p_responsable_nombre), ''),
    nullif(btrim(p_responsable_telefono), '')
  )
  returning id into v_turno_id;

  return jsonb_build_object('turno_id', v_turno_id);
end;
$$;

revoke execute on function public.crear_turno(uuid, date, time, time, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.crear_turno(uuid, date, time, time, text, text, text, text, text, text) to service_role;
