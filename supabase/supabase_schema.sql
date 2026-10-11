-- App Seguimiento Francho · esquema Supabase (fase 1)
-- Pegar entero en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar más de una vez sin romper nada.

-- 1. Perfiles y relación alumno–entrenador -----------------------------
create table if not exists public.perfil (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text not null default 'alumno' check (rol in ('alumno','entrenador')),
  creado timestamptz default now()
);

create table if not exists public.entrenador_alumno (
  entrenador uuid references auth.users(id) on delete cascade,
  alumno uuid references auth.users(id) on delete cascade,
  primary key (entrenador, alumno)
);

-- Crea el perfil automáticamente al registrarse
create or replace function public.nuevo_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfil (id, nombre) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.nuevo_perfil();

-- ¿Puede el usuario actual ver los datos de este alumno?
create or replace function public.puede_ver(alumno_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() = alumno_id
      or exists (select 1 from public.entrenador_alumno ea
                 where ea.entrenador = auth.uid() and ea.alumno = alumno_id);
$$;

-- 2. Plan de Jesús (versionado) -------------------------------------------
-- Cada volcado del Excel crea una versión nueva; las anteriores se conservan.
create table if not exists public.plan_version (
  id bigint generated always as identity primary key,
  alumno uuid not null references auth.users(id) on delete cascade,
  desde date not null,
  datos jsonb not null,           -- días, bloques, ejercicios, series, menús, suplementos
  nota text,                      -- qué cambió en este volcado
  creado timestamptz default now()
);

-- 3. Registro diario ------------------------------------------------------
create table if not exists public.dia (
  alumno uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  tipo text check (tipo in ('entreno','sin_entreno','viaje')),
  menu int,                        -- menú 1–6 de Jesús
  dia_entreno int,                 -- día 1–4
  habitos jsonb default '{}',      -- sentadillas, movilidad, suplementos tomados…
  energia int check (energia between 1 and 5),
  nota text,
  actualizado timestamptz default now(),
  primary key (alumno, fecha)
);

create table if not exists public.comida (
  id bigint generated always as identity primary key,
  alumno uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  momento text not null check (momento in ('desayuno','almuerzo','cena','extra')),
  estado text check (estado in ('seguida','cambiada','fuera')),
  ajustes jsonb default '{}',      -- raciones +/- y gramos opcionales
  kcal int, p int, c int, g int,
  foto text,                       -- ruta en Storage
  nota text,
  creado timestamptz default now(),
  unique (alumno, fecha, momento)
);

create table if not exists public.sesion (
  id bigint generated always as identity primary key,
  alumno uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  dia_entreno int not null,
  plan_version bigint references public.plan_version(id),
  inicio timestamptz, fin timestamptz,
  nota text
);

create table if not exists public.serie (
  id bigint generated always as identity primary key,
  sesion bigint not null references public.sesion(id) on delete cascade,
  alumno uuid not null references auth.users(id) on delete cascade,
  ejercicio text not null,         -- clave "D1-B-4" del plan
  num int not null,
  peso text, reps text, rir text,
  nota text,
  hecho timestamptz default now()
);

create table if not exists public.cardio (
  id bigint generated always as identity primary key,
  sesion bigint not null references public.sesion(id) on delete cascade,
  alumno uuid not null references auth.users(id) on delete cascade,
  bloque text,                     -- 'HIIT' o 'CINTA'
  maquina text,
  vatios int, distancia int, sensacion int,
  fc_media int, fc_max int         -- se rellenan con el Watch
);

create table if not exists public.medicion (
  id bigint generated always as identity primary key,
  alumno uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  peso numeric, grasa numeric, cintura numeric,
  perimetros jsonb default '{}',
  origen text default 'alumno'
);

-- 4. Apple Watch (fase 2) -------------------------------------------------
create table if not exists public.salud_diaria (
  alumno uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  pasos int, kcal_activas int, kcal_reposo int, min_pie int,
  sueno_min int, vfc numeric, fc_reposo int,
  entrenos jsonb default '[]',
  recibido timestamptz default now(),
  primary key (alumno, fecha)
);

-- 5. Comunicación ---------------------------------------------------------
create table if not exists public.comentario (
  id bigint generated always as identity primary key,
  alumno uuid not null references auth.users(id) on delete cascade,
  autor uuid not null references auth.users(id),
  ambito text not null,            -- 'dia','sesion','serie','comida','semana'
  ref text,                        -- fecha o id al que se refiere
  texto text not null,
  leido boolean default false,
  creado timestamptz default now()
);

-- 6. Permisos (RLS) -------------------------------------------------------
-- Alumno: lee y escribe lo suyo. Entrenador: lee todo y solo escribe comentarios.
do $$
declare t text;
begin
  foreach t in array array['plan_version','dia','comida','sesion','serie','cardio','medicion','salud_diaria','comentario'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists leer on public.%I', t);
    execute format('create policy leer on public.%I for select using (public.puede_ver(alumno))', t);
  end loop;
  foreach t in array array['dia','comida','sesion','serie','cardio','medicion','salud_diaria'] loop
    execute format('drop policy if exists escribir on public.%I', t);
    execute format('create policy escribir on public.%I for all using (auth.uid() = alumno) with check (auth.uid() = alumno)', t);
  end loop;
end $$;

-- El plan solo lo inserta el alumno (volcado asistido desde su sesión)
drop policy if exists escribir on public.plan_version;
create policy escribir on public.plan_version for insert with check (auth.uid() = alumno);

-- Comentarios: los escribe cualquiera que pueda ver al alumno, firmados por sí mismo
drop policy if exists escribir on public.comentario;
create policy escribir on public.comentario for insert
  with check (auth.uid() = autor and public.puede_ver(alumno));
drop policy if exists marcar_leido on public.comentario;
create policy marcar_leido on public.comentario for update
  using (auth.uid() = alumno) with check (auth.uid() = alumno);

alter table public.perfil enable row level security;
drop policy if exists leer on public.perfil;
create policy leer on public.perfil for select using (public.puede_ver(id) or auth.uid() = id);
alter table public.entrenador_alumno enable row level security;
drop policy if exists leer on public.entrenador_alumno;
create policy leer on public.entrenador_alumno for select using (auth.uid() in (entrenador, alumno));

-- 7. Fotos ----------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('fotos','fotos', false)
  on conflict (id) do nothing;
drop policy if exists fotos_subir on storage.objects;
create policy fotos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_ver on storage.objects;
create policy fotos_ver on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and public.puede_ver(((storage.foldername(name))[1])::uuid));
-- Tabla de sincronización de la app (copia en la nube de lo que guardas en el móvil)
create table if not exists public.registro (
  alumno uuid not null default auth.uid() references auth.users(id) on delete cascade,
  clave text not null,              -- 'dia:2026-10-12', 'sem:2026-10-12', 'medidas'…
  valor jsonb,
  actualizado timestamptz not null default now(),
  primary key (alumno, clave)
);
alter table public.registro enable row level security;
drop policy if exists leer on public.registro;
create policy leer on public.registro for select using (public.puede_ver(alumno));
drop policy if exists escribir on public.registro;
create policy escribir on public.registro for all using (auth.uid() = alumno) with check (auth.uid() = alumno);
