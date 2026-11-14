-- ============================================================
-- Veterinaria Palma — Migración 0006: rate limiting en Postgres
--
-- En serverless no hay memoria compartida entre instancias, así que
-- el store del rate limit es una tabla de Postgres y la lógica vive
-- en la RPC public.verificar_rate_limit (SECURITY DEFINER, ejecutable
-- solo por service_role), que el servidor llama con createAdminClient().
--
-- verificar_rate_limit(p_clave, p_max, p_ventana):
--   - bloquea con advisory lock por clave (serializa count + insert,
--     evita que dos pedidos concurrentes pasen el límite a la vez)
--   - borra los eventos de esa clave que quedaron fuera de la ventana
--   - si ya hay >= p_max eventos dentro de la ventana, devuelve false
--   - si no, registra el evento y devuelve true
-- ============================================================

create table if not exists public.rate_limit_eventos (
  id bigint generated always as identity primary key,
  clave text not null,
  creada_en timestamptz not null default now()
);

create index if not exists rate_limit_eventos_clave_creada_idx
  on public.rate_limit_eventos (clave, creada_en);

-- Nadie accede directo a la tabla: solo la RPC con service_role
alter table public.rate_limit_eventos enable row level security;
revoke all on public.rate_limit_eventos from anon, authenticated, public;

create or replace function public.verificar_rate_limit(
  p_clave text,
  p_max int,
  p_ventana interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_max is null or p_max <= 0 then
    return false;
  end if;

  -- Serializa el check por clave (ventana deslizante consistente)
  perform pg_advisory_xact_lock(hashtext(p_clave));

  delete from public.rate_limit_eventos
  where clave = p_clave
    and creada_en < now() - p_ventana;

  select count(*) into v_count
  from public.rate_limit_eventos
  where clave = p_clave;

  if v_count >= p_max then
    return false;
  end if;

  insert into public.rate_limit_eventos (clave) values (p_clave);

  -- Limpieza probabilística global (1% de las llamadas) para que la
  -- tabla no crezca sin control entre migraciones
  if random() < 0.01 then
    delete from public.rate_limit_eventos
    where creada_en < now() - interval '1 hour';
  end if;

  return true;
end;
$$;

revoke execute on function public.verificar_rate_limit(text, int, interval) from public, anon, authenticated;
grant execute on function public.verificar_rate_limit(text, int, interval) to service_role;
