-- 初期スキーマ: projects (案件) / pins (設置場所ピン)
-- アクセス制御方針は docs/adr/0003-token-based-access.md を参照。
-- テーブルへの直接アクセスは anon ロールに一切許可せず(RLSを有効化しポリシーを1つも作らない=deny by default)、
-- SECURITY DEFINER 関数(このファイル下部)経由でのみ読み書きさせる。

create extension if not exists pgcrypto;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  map_type text not null check (map_type in ('image', 'geo')),
  map_image_path text, -- Supabase Storageのパス。map_type='image'のときのみ使用
  view_token uuid not null default gen_random_uuid(),
  edit_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create unique index projects_view_token_idx on public.projects (view_token);
create unique index projects_edit_token_idx on public.projects (edit_token);

create table public.pins (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  label text not null default '',
  x double precision, -- map_type='image'のときのピクセル座標
  y double precision,
  lat double precision, -- map_type='geo'のときの緯度経度
  lng double precision,
  updated_at timestamptz not null default now()
);

create index pins_project_id_idx on public.pins (project_id);

alter table public.projects enable row level security;
alter table public.pins enable row level security;
-- ポリシーを意図的に1つも作らない(anonロールはテーブルに直接アクセスできない)

-- anon/authenticatedロールに対するテーブルへの直接権限を明示的に剥奪する(defense in depth)
revoke all on public.projects from anon, authenticated;
revoke all on public.pins from anon, authenticated;

-- ================================================================
-- get_project_by_view_token: 閲覧用トークンで案件情報とピン一覧を取得する
-- ================================================================
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
    'pins', pin_list
  );
end;
$$;

revoke all on function public.get_project_by_view_token(uuid) from public;
grant execute on function public.get_project_by_view_token(uuid) to anon, authenticated;

-- ================================================================
-- upsert_pin_by_edit_token: 編集用トークンでピンを追加/更新する。
-- 既存ピンの更新時は client_updated_at が現在のDB値と一致しない場合、競合として拒否する
-- (docs/adr/0004-conflict-handling.md の楽観的ロック方針)
-- ================================================================
create or replace function public.upsert_pin_by_edit_token(
  token uuid,
  pin_id uuid,
  pin_label text,
  pin_x double precision,
  pin_y double precision,
  pin_lat double precision,
  pin_lng double precision,
  client_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.projects;
  current_updated_at timestamptz;
  result public.pins;
begin
  select * into proj from public.projects where edit_token = token;
  if not found then
    raise exception 'invalid token';
  end if;

  if pin_id is null then
    -- 新規ピンの追加(競合は起こりようがない)
    insert into public.pins (project_id, label, x, y, lat, lng)
    values (proj.id, coalesce(pin_label, ''), pin_x, pin_y, pin_lat, pin_lng)
    returning * into result;
  else
    select updated_at into current_updated_at
      from public.pins
      where id = pin_id and project_id = proj.id;

    if not found then
      raise exception 'pin not found';
    end if;

    if client_updated_at is null or current_updated_at <> client_updated_at then
      raise exception 'conflict: pin was updated by someone else' using errcode = '40001';
    end if;

    update public.pins
      set label = coalesce(pin_label, ''),
          x = pin_x,
          y = pin_y,
          lat = pin_lat,
          lng = pin_lng,
          updated_at = now()
      where id = pin_id and project_id = proj.id
      returning * into result;
  end if;

  return to_jsonb(result);
end;
$$;

revoke all on function public.upsert_pin_by_edit_token(uuid, uuid, text, double precision, double precision, double precision, double precision, timestamptz) from public;
grant execute on function public.upsert_pin_by_edit_token(uuid, uuid, text, double precision, double precision, double precision, double precision, timestamptz) to anon, authenticated;

-- ================================================================
-- delete_pin_by_edit_token: 編集用トークンでピンを削除する
-- ================================================================
create or replace function public.delete_pin_by_edit_token(token uuid, target_pin_id uuid)
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

  delete from public.pins where id = target_pin_id and project_id = proj.id;
end;
$$;

revoke all on function public.delete_pin_by_edit_token(uuid, uuid) from public;
grant execute on function public.delete_pin_by_edit_token(uuid, uuid) to anon, authenticated;
