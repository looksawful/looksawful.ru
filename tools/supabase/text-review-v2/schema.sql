-- Round 2 text review persistence.
-- Round 1 snapshots are an existing shared dependency and are intentionally not mutated here.

create table if not exists public.temp_text_review_round_2_answers (
  item_id text primary key,
  option_id text not null,
  custom_text text,
  updated_at timestamptz not null default now(),
  constraint temp_text_review_round_2_answers_item_id_length
    check (char_length(item_id) between 1 and 200),
  constraint temp_text_review_round_2_answers_option_id_length
    check (char_length(option_id) between 1 and 80),
  constraint temp_text_review_round_2_answers_custom_text_length
    check (custom_text is null or char_length(custom_text) <= 10000)
);

alter table public.temp_text_review_round_2_answers enable row level security;

revoke all on table public.temp_text_review_round_2_answers from anon, authenticated;
grant select, insert, update, delete on table public.temp_text_review_round_2_answers to service_role;
