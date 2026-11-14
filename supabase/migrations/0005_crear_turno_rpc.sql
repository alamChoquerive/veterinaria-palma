-- ============================================================
-- Veterinaria Palma — Migración 0005: creación validada de turnos
--
-- public.crear_turno(...):
--   - fecha no pasada (hoy vale)
--   - horario dentro de la atención (09:00 a 17:00, sincronizar con
--     HORARIOS_TURNO en lib/constants.ts)
--   - hora_fin > hora_inicio y hora_inicio alineada a intervalos de 30 min
--   - sin solapamiento con turnos activos de ese día (lock advisory por
--     fecha para evitar carreras entre dos reservas concurrentes)
--   - máximo 1 turno activo por día por cliente
--
-- Solo ejecutable por service_role (igual que crear_pedido).
--
-- Además: la policy "turnos propios update" no tenía WITH CHECK, lo que
-- permitía a un cliente reasignar su turno a otro perfil; se agrega.
-- ============================================================

create or replace function public.crear_turno(
  p_perfil_id uuid,
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time,
  p_motivo text
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
  if not exists (select 1 from public.perfiles where id = p_perfil_id) then
    raise exception 'Perfil no encontrado';
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
  -- por condiciones de carrera entre dos clientes concurrentes
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

  select count(*) into v_cantidad
  from public.turnos t
  where t.perfil_id = p_perfil_id
    and t.fecha = p_fecha
    and t.estado <> 'cancelado';

  if v_cantidad >= v_max_por_dia then
    raise exception 'Ya tenés un turno activo para ese día';
  end if;

  insert into public.turnos (perfil_id, fecha, hora_inicio, hora_fin, motivo, estado)
  values (
    p_perfil_id,
    p_fecha,
    p_hora_inicio,
    p_hora_fin,
    nullif(btrim(p_motivo), ''),
    'pendiente'
  )
  returning id into v_turno_id;

  return jsonb_build_object('turno_id', v_turno_id);
end;
$$;

revoke execute on function public.crear_turno(uuid, date, time, time, text) from public, anon, authenticated;
grant execute on function public.crear_turno(uuid, date, time, time, text) to service_role;

-- ---------- fix: WITH CHECK en update de turnos ----------

drop policy if exists "turnos propios update" on public.turnos;
create policy "turnos propios update" on public.turnos
  for update
  using (perfil_id = auth.uid() or public.es_admin())
  with check (perfil_id = auth.uid() or public.es_admin());
