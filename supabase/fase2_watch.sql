-- FRANX · Fase 2: Apple Watch (Atajo de iOS) + avisos de seguridad del linter
-- Pegar entero en Supabase > SQL Editor > New query > Run. Se puede ejecutar varias veces.

-- Seguridad (avisos del linter)
revoke execute on function public.nuevo_perfil() from public, anon, authenticated;
revoke execute on function public.puede_ver(uuid) from public, anon;
grant execute on function public.puede_ver(uuid) to authenticated;

-- Token personal para el Atajo de iOS
create table if not exists public.token_salud (
  alumno uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  token text not null unique check (length(token) >= 32),
  creado timestamptz default now()
);
alter table public.token_salud enable row level security;
drop policy if exists propio on public.token_salud;
create policy propio on public.token_salud for all using (auth.uid() = alumno) with check (auth.uid() = alumno);

-- El Atajo llama a esta función sin sesión: solo escribe en salud_diaria del dueño del token
create or replace function public.registrar_salud(p_token text, p_fecha date, p_datos jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_alumno uuid;
begin
  select alumno into v_alumno from public.token_salud where token = p_token;
  if v_alumno is null then raise exception 'token no válido'; end if;
  if p_fecha is null or p_fecha < current_date - 30 or p_fecha > current_date + 1 then raise exception 'fecha fuera de rango'; end if;
  if pg_column_size(p_datos) > 4000 then raise exception 'datos demasiado grandes'; end if;
  insert into public.salud_diaria as s (alumno, fecha, pasos, kcal_activas, min_pie, sueno_min, vfc, fc_reposo, entrenos, recibido)
  values (v_alumno, p_fecha,
    nullif(round(coalesce((p_datos->>'pasos')::numeric, 0)), 0)::int,
    nullif(round(coalesce((p_datos->>'kcal_activas')::numeric, 0)), 0)::int,
    nullif(round(coalesce((p_datos->>'min_ejercicio')::numeric, 0)), 0)::int,
    nullif(round(coalesce((p_datos->>'sueno_h')::numeric, 0) * 60), 0)::int,
    nullif(coalesce((p_datos->>'vfc')::numeric, 0), 0),
    nullif(round(coalesce((p_datos->>'fc_reposo')::numeric, 0)), 0)::int,
    coalesce(p_datos->'entrenos', '[]'::jsonb), now())
  on conflict (alumno, fecha) do update set
    pasos = coalesce(excluded.pasos, s.pasos), kcal_activas = coalesce(excluded.kcal_activas, s.kcal_activas),
    min_pie = coalesce(excluded.min_pie, s.min_pie), sueno_min = coalesce(excluded.sueno_min, s.sueno_min),
    vfc = coalesce(excluded.vfc, s.vfc), fc_reposo = coalesce(excluded.fc_reposo, s.fc_reposo),
    entrenos = case when excluded.entrenos = '[]'::jsonb then s.entrenos else excluded.entrenos end, recibido = now();
  return 'ok ' || p_fecha;
end $$;
revoke execute on function public.registrar_salud(text, date, jsonb) from public;
grant execute on function public.registrar_salud(text, date, jsonb) to anon, authenticated;
