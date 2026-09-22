-- Private Review Hub Supabase schema.
-- Safe to keep in the public repository: no project ids, API keys, Vault values,
-- private object ids, or review evidence are stored here.
--
-- Scheduled physical cleanup is provisioned separately because its Edge Function
-- URL and Vault token are deployment-specific. See docs/private-lab.md.

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

revoke all on table public.review_hub_objects from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.review_hub_objects
  from service_role;
grant select on table public.review_hub_objects to service_role;

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
  p_expected_etag text default null,
  p_create_only boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_etag text := gen_random_uuid()::text;
  v_expires_at timestamptz := null;
begin
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

  if p_expected_etag is not null and p_create_only then
    raise exception 'review object write cannot be both CAS and create-only';
  end if;

  if p_create_only then
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
    on conflict (key) do nothing;

    if not found then
      return jsonb_build_object('stored', false, 'etag', null);
    end if;
  elsif p_expected_etag is not null then
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
  text, text, text, text, text, jsonb, text, boolean
) from public, anon, authenticated;
grant execute on function public.review_hub_put_object(
  text, text, text, text, text, jsonb, text, boolean
) to service_role;

create or replace function public.review_hub_delete_object_rows(p_keys text[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
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
  to service_role;

create or replace function public.review_hub_expired_objects(p_limit integer default 500)
returns table (
  key text,
  kind text,
  storage_path text,
  content_type text,
  etag text
)
language sql
security definer
set search_path = public, pg_temp
as $$
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
$$;

revoke all on function public.review_hub_expired_objects(integer)
  from public, anon, authenticated;
grant execute on function public.review_hub_expired_objects(integer)
  to service_role;

-- The private Storage bucket is intentionally not named in this public file.
-- Provision its deployment-specific id outside the public repository, then pass
-- that id to the Admin runtime through REVIEW_EVIDENCE_BUCKET.
-- Required bucket properties:
--   public = false
--   file_size_limit = 20 MiB
--   allowed_mime_types = image/png, image/jpeg, image/webp
