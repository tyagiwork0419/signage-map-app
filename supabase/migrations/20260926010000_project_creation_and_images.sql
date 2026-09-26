-- 案件作成、およびフロアプラン画像アップロード対応。
-- 案件作成は「ログイン無し」の設計方針(docs/adr/0003-token-based-access.md)のもと、
-- このアプリの利用者(看板業者側の運用者)がURLを知っていれば誰でも実行できる操作として扱う。
-- 一般公開せず、運用者だけがURLを知っている状態で使う想定(既知の制約。将来ログインを足すなら
-- ここが対象になる)。

-- ================================================================
-- create_project: 新規案件を作成し、閲覧用/編集用トークンを返す
-- ================================================================
create or replace function public.create_project(project_name text, project_map_type text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.projects;
begin
  if project_map_type not in ('image', 'geo') then
    raise exception 'invalid map_type: %', project_map_type;
  end if;

  insert into public.projects (name, map_type)
  values (project_name, project_map_type)
  returning * into result;

  return jsonb_build_object(
    'id', result.id,
    'name', result.name,
    'map_type', result.map_type,
    'view_token', result.view_token,
    'edit_token', result.edit_token
  );
end;
$$;

revoke all on function public.create_project(text, text) from public;
grant execute on function public.create_project(text, text) to anon, authenticated;

-- ================================================================
-- set_project_map_image: 編集用トークンで、案件のフロアプラン画像パスを設定する
-- ================================================================
create or replace function public.set_project_map_image(token uuid, image_path text)
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

  update public.projects set map_image_path = image_path where id = proj.id;
end;
$$;

revoke all on function public.set_project_map_image(uuid, text) from public;
grant execute on function public.set_project_map_image(uuid, text) to anon, authenticated;

-- ================================================================
-- Storage: フロアプラン画像用バケット。
-- 読み取りは誰でも可(閲覧リンクを持つ人が地図画像を見られる必要があるため)。
-- 書き込みはStorageのRLSでは制御せず、アップロード自体は
-- サーバー側(app/api/upload-map-image、Service Roleキー使用)でedit_tokenを検証してから行う。
-- そのため anon ロールにはStorageへの直接書き込み権限を与えない。
-- ================================================================
insert into storage.buckets (id, name, public)
values ('map-images', 'map-images', true)
on conflict (id) do nothing;
