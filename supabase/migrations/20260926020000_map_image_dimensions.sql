-- フロアプラン画像の実ピクセルサイズを保持する(ImageOverlayのbounds計算に必要)

alter table public.projects
  add column if not exists map_image_width integer,
  add column if not exists map_image_height integer;

drop function if exists public.set_project_map_image(uuid, text);

create or replace function public.set_project_map_image(
  token uuid,
  image_path text,
  image_width integer,
  image_height integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.projects;
begin
  select * into proj from public.projects where edit_token = token;
  if not found then
    raise exception 'invalid token';
  end if;

  update public.projects
    set map_image_path = image_path,
        map_image_width = image_width,
        map_image_height = image_height
    where id = proj.id;
end;
$$;

revoke all on function public.set_project_map_image(uuid, text, integer, integer) from public;
grant execute on function public.set_project_map_image(uuid, text, integer, integer) to anon, authenticated;

create or replace function public.get_project_by_view_token(token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.projects;
  pin_list jsonb;
begin
  select * into proj from public.projects where view_token = token;
  if not found then
    raise exception 'invalid token';
  end if;

  select coalesce(jsonb_agg(p.* order by p.updated_at), '[]'::jsonb)
    into pin_list
    from public.pins p
    where p.project_id = proj.id;

  return jsonb_build_object(
    'id', proj.id,
    'name', proj.name,
    'map_type', proj.map_type,
    'map_image_path', proj.map_image_path,
    'map_image_width', proj.map_image_width,
    'map_image_height', proj.map_image_height,
    'pins', pin_list
  );
end;
$$;
