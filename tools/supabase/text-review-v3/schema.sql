-- Round 3 text-review runtime storage.
-- Round 1/2 storage is historical evidence and is never mutated here.
-- All tables are private service-role data behind RLS.

create table if not exists public.temp_text_review_round_3_items (
  item_id text primary key,
  sort_order integer not null,
  payload jsonb not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint temp_text_review_round_3_items_item_id_length
    check (char_length(item_id) between 1 and 200),
  constraint temp_text_review_round_3_items_payload_id_match
    check (payload->>'id' = item_id)
);

create index if not exists temp_text_review_round_3_items_active_sort_idx
  on public.temp_text_review_round_3_items (active, sort_order);

alter table public.temp_text_review_round_3_items enable row level security;
revoke all on table public.temp_text_review_round_3_items from anon, authenticated;
grant select, insert, update, delete
  on table public.temp_text_review_round_3_items to service_role;
create table if not exists public.temp_text_review_round_3_answers (
  item_id text primary key
    references public.temp_text_review_round_3_items(item_id) on delete restrict,
  option_id text not null,
  custom_text text,
  updated_at timestamptz not null default now(),
  constraint temp_text_review_round_3_answers_option_id_length
    check (char_length(option_id) between 1 and 80),
  constraint temp_text_review_round_3_answers_custom_text_length
    check (custom_text is null or char_length(custom_text) <= 10000)
);

alter table public.temp_text_review_round_3_answers enable row level security;
revoke all on table public.temp_text_review_round_3_answers from anon, authenticated;
grant select, insert, update, delete
  on table public.temp_text_review_round_3_answers to service_role;

create table if not exists public.temp_text_review_round_3_prior_decisions (
  decision_id text primary key,
  source_round text not null,
  source_item_id text not null,
  original_text text not null,
  chosen_text text not null,
  chosen_option text not null,
  custom_text text,
  source_provenance text not null,
  decided_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  recovered_at timestamptz not null default now(),
  constraint temp_text_review_round_3_prior_decisions_id_length
    check (char_length(decision_id) between 1 and 240),
  constraint temp_text_review_round_3_prior_decisions_source_round_length
    check (char_length(source_round) between 1 and 120),
  constraint temp_text_review_round_3_prior_decisions_source_item_length
    check (char_length(source_item_id) between 1 and 200),
  constraint temp_text_review_round_3_prior_decisions_unique_source
    unique (source_round, source_item_id)
);

create index if not exists temp_text_review_round_3_prior_source_idx
  on public.temp_text_review_round_3_prior_decisions (source_round, source_item_id);

alter table public.temp_text_review_round_3_prior_decisions enable row level security;
revoke all on table public.temp_text_review_round_3_prior_decisions from anon, authenticated;
grant select, insert, update, delete
  on table public.temp_text_review_round_3_prior_decisions to service_role;
