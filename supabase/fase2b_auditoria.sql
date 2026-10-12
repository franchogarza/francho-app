-- FRANX · Correcciones de la auditoría (sincronización con revisiones, comentarios, bucket)
-- Pegar entero en Supabase > SQL Editor > New query > Run. Se puede ejecutar varias veces.

-- 1) Revisión por documento: una escritura solo gana si parte de la última versión del servidor
alter table public.registro add column if not exists rev bigint not null default 1;

create or replace function public.guardar_registro(p_clave text, p_valor jsonb, p_rev bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_rev bigint; v_valor jsonb;
begin
  if v_uid is null then raise exception 'sin sesión'; end if;
  if p_clave is null or length(p_clave) > 80 then raise exception 'clave no válida'; end if;
  select r.rev, r.valor into v_rev, v_valor from public.registro r where r.alumno = v_uid and r.clave = p_clave for update;
  if not found then
    if coalesce(p_rev, 0) <> 0 then return jsonb_build_object('ok', false, 'rev', 0, 'valor', null); end if;
    insert into public.registro (alumno, clave, valor, actualizado, rev) values (v_uid, p_clave, p_valor, now(), 1);
    return jsonb_build_object('ok', true, 'rev', 1);
  end if;
  if v_rev <> coalesce(p_rev, -1) then return jsonb_build_object('ok', false, 'rev', v_rev, 'valor', v_valor); end if;
  update public.registro set valor = p_valor, rev = v_rev + 1, actualizado = now() where alumno = v_uid and clave = p_clave;
  return jsonb_build_object('ok', true, 'rev', v_rev + 1);
end $$;
revoke execute on function public.guardar_registro(text, jsonb, bigint) from public, anon;
grant execute on function public.guardar_registro(text, jsonb, bigint) to authenticated;

-- 2) Comentarios: el alumno solo puede cambiar «leído», no el texto ni el autor
revoke update on public.comentario from authenticated, anon;
grant update (leido) on public.comentario to authenticated;

-- 3) Bucket de fotos: privado, solo JPEG y como máximo 8 MB por foto
update storage.buckets set public = false, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg']
where id = 'fotos';
