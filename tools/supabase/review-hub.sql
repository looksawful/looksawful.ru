-- Private Review Hub Supabase schema.
-- Public-safe infrastructure contract: no secret API keys, Vault values,
-- private evidence, or deployment credentials are stored here.
--
-- The Admin runtime authenticates as one dedicated Supabase Auth user with a
-- password generated at deploy time and stored only as a Cloudflare Worker secret.
-- Public Supabase URL/publishable-key values identify the project but grant only
-- the access allowed by RLS.

create table if not exists public.review_hub_objects (
  key text primary key,
  kind text not null check (kind in ('json', 'binary')),
  body_text text,
  storage_path text,
  content_type text not null,
  custom_metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  etag text not null default gen_random_uuid()::text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_hub_objects_payload_check check (
    (kind = 'json' and body_text is not null and storage_path is null)
    or
    (kind = 'binary' and body_text is null and storage_path is not null)
  )
);

alter table public.review_hub_objects enable row level security;

create or replace function public.review_hub_runtime_authorized()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    coalesce((select auth.jwt() ->> 'role') = 'service_role', false)
    or (
      (select auth.jwt() ->> 'role') = 'authenticated'
      and (select auth.jwt() ->> 'email') = 'review-hub-runtime@looksawful.invalid'
      and not coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false)
    );
$$;

revoke all on function public.review_hub_runtime_authorized()
  from public, anon;
grant execute on function public.review_hub_runtime_authorized()
  to authenticated, service_role;

revoke all on table public.review_hub_objects from anon, authenticated;
grant select, insert, update, delete on table public.review_hub_objects
  to authenticated, service_role;

drop policy if exists "review_hub_runtime_select" on public.review_hub_objects;
create policy "review_hub_runtime_select"
on public.review_hub_objects
for select
to authenticated
using ((select public.review_hub_runtime_authorized()));

drop policy if exists "review_hub_runtime_insert" on public.review_hub_objects;
create policy "review_hub_runtime_insert"
on public.review_hub_objects
for insert
to authenticated
with check (
  key like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
);

drop policy if exists "review_hub_runtime_update" on public.review_hub_objects;
create policy "review_hub_runtime_update"
on public.review_hub_objects
for update
to authenticated
using (
  key like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
)
with check (
  key like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
);

drop policy if exists "review_hub_runtime_delete" on public.review_hub_objects;
create policy "review_hub_runtime_delete"
on public.review_hub_objects
for delete
to authenticated
using (
  key like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
);

create index if not exists review_hub_objects_expires_at_idx
  on public.review_hub_objects (expires_at)
  where expires_at is not null;

create or replace function public.review_hub_put_object(
  p_key text,
  p_kind text,
  p_body_text text,
  p_storage_path text,
  p_content_type text,
  p_custom_metadata jsonb default '{}'::jsonb,
  p_expected_etag text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_etag text := gen_random_uuid()::text;
  v_expires_at timestamptz := null;
begin
  if not public.review_hub_runtime_authorized() then
    raise insufficient_privilege using message = 'Review Hub runtime authorization required';
  end if;

  if p_key not like 'review-hub/v1/%' then
    raise exception 'invalid review object key';
  end if;

  if p_kind not in ('json', 'binary') then
    raise exception 'invalid review object kind';
  end if;

  if p_kind = 'json' and (p_body_text is null or p_storage_path is not null) then
    raise exception 'invalid json review object';
  end if;

  if p_kind = 'binary' and (p_body_text is not null or p_storage_path is null) then
    raise exception 'invalid binary review object';
  end if;

  if p_custom_metadata ? 'expiresAt' then
    v_expires_at := (p_custom_metadata ->> 'expiresAt')::timestamptz;
  end if;

  if p_expected_etag is not null then
    update public.review_hub_objects
    set
      kind = p_kind,
      body_text = p_body_text,
      storage_path = p_storage_path,
      content_type = p_content_type,
      custom_metadata = coalesce(p_custom_metadata, '{}'::jsonb),
      expires_at = v_expires_at,
      etag = v_etag,
      updated_at = now()
    where key = p_key
      and etag = p_expected_etag;

    if not found then
      return jsonb_build_object('stored', false, 'etag', null);
    end if;
  else
    insert into public.review_hub_objects (
      key,
      kind,
      body_text,
      storage_path,
      content_type,
      custom_metadata,
      expires_at,
      etag
    )
    values (
      p_key,
      p_kind,
      p_body_text,
      p_storage_path,
      p_content_type,
      coalesce(p_custom_metadata, '{}'::jsonb),
      v_expires_at,
      v_etag
    )
    on conflict (key) do update
    set
      kind = excluded.kind,
      body_text = excluded.body_text,
      storage_path = excluded.storage_path,
      content_type = excluded.content_type,
      custom_metadata = excluded.custom_metadata,
      expires_at = excluded.expires_at,
      etag = excluded.etag,
      updated_at = now();
  end if;

  return jsonb_build_object('stored', true, 'etag', v_etag);
end;
$$;

revoke all on function public.review_hub_put_object(
  text, text, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.review_hub_put_object(
  text, text, text, text, text, jsonb, text
) to authenticated, service_role;

create or replace function public.review_hub_delete_object_rows(p_keys text[])
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if not public.review_hub_runtime_authorized() then
    raise insufficient_privilege using message = 'Review Hub runtime authorization required';
  end if;

  delete from public.review_hub_objects
  where key = any(p_keys)
    and key like 'review-hub/v1/%';

  get diagnostics v_deleted = row_count;
  return jsonb_build_object('deleted', v_deleted);
end;
$$;

revoke all on function public.review_hub_delete_object_rows(text[])
  from public, anon, authenticated;
grant execute on function public.review_hub_delete_object_rows(text[])
  to authenticated, service_role;

create or replace function public.review_hub_expired_objects(p_limit integer default 500)
returns table (
  key text,
  kind text,
  storage_path text,
  content_type text,
  etag text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not public.review_hub_runtime_authorized() then
    raise insufficient_privilege using message = 'Review Hub runtime authorization required';
  end if;

  return query
  select
    o.key,
    o.kind,
    o.storage_path,
    o.content_type,
    o.etag
  from public.review_hub_objects as o
  where o.expires_at is not null
    and o.expires_at <= now()
    and o.key like 'review-hub/v1/cases/%'
  order by o.expires_at asc
  limit greatest(1, least(coalesce(p_limit, 500), 1000));
end;
$$;

revoke all on function public.review_hub_expired_objects(integer)
  from public, anon, authenticated;
grant execute on function public.review_hub_expired_objects(integer)
  to authenticated, service_role;

create or replace function public.review_hub_confirm_runtime_signup()
returns trigger
language plpgsql
security definer
set search_path = auth, public, pg_temp
as $$
begin
  if new.email = 'review-hub-runtime@looksawful.invalid' then
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
    new.confirmation_token := '';
  end if;
  return new;
end;
$$;

revoke all on function public.review_hub_confirm_runtime_signup()
  from public, anon, authenticated, service_role;
grant execute on function public.review_hub_confirm_runtime_signup()
  to supabase_auth_admin;

drop trigger if exists review_hub_runtime_autoconfirm on auth.users;
create trigger review_hub_runtime_autoconfirm
before insert on auth.users
for each row
when (new.email = 'review-hub-runtime@looksawful.invalid')
execute function public.review_hub_confirm_runtime_signup();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'review-hub-evidence',
  'review-hub-evidence',
  false,
  20971520,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "review_hub_runtime_storage_select" on storage.objects;
create policy "review_hub_runtime_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'review-hub-evidence'
  and (select public.review_hub_runtime_authorized())
);

drop policy if exists "review_hub_runtime_storage_insert" on storage.objects;
create policy "review_hub_runtime_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'review-hub-evidence'
  and name like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
);

drop policy if exists "review_hub_runtime_storage_update" on storage.objects;
create policy "review_hub_runtime_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'review-hub-evidence'
  and name like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
)
with check (
  bucket_id = 'review-hub-evidence'
  and name like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
);

drop policy if exists "review_hub_runtime_storage_delete" on storage.objects;
create policy "review_hub_runtime_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'review-hub-evidence'
  and name like 'review-hub/v1/%'
  and (select public.review_hub_runtime_authorized())
);
