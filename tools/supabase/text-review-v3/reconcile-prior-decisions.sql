-- Reconcile prior owner decisions into the Round 3 ledger.
-- This script is idempotent and never mutates Round 1 / Round 2 source tables.

insert into public.temp_text_review_round_3_prior_decisions (
  decision_id,
  source_round,
  source_item_id,
  original_text,
  chosen_text,
  chosen_option,
  custom_text,
  source_provenance,
  decided_at,
  metadata
)
select
  'round_2_2026_09_22:' || a.item_id,
  'round_2_2026_09_22',
  a.item_id,
  coalesce(i.payload#>>'{current,source}', i.payload->>'label', ''),
  coalesce(
    case
      when a.option_id = 'custom' then a.custom_text
      else (
        select option->>'text'
        from jsonb_array_elements(i.payload->'options') option
        where option->>'id' = a.option_id
        limit 1
      )
    end,
    ''
  ),
  a.option_id,
  a.custom_text,
  coalesce(
    i.payload#>>'{current,sourceProvenance}',
    'Round 2 item ' || a.item_id
  ),
  a.updated_at,
  jsonb_build_object(
    'imported_from', 'temp_text_review_round_2_answers',
    'recovery_status', 'confirmed',
    'kind', i.payload->>'kind',
    'label', i.payload->>'label',
    'context', jsonb_build_object(
      'pageId', i.payload->>'pageId',
      'section', i.payload->>'section',
      'role', i.payload->>'role',
      'kind', i.payload->>'kind'
    ),
    'source_mismatch', coalesce((i.payload#>>'{current,sourceMismatch}')::boolean, false),
    'production_text', i.payload#>>'{current,production}',
    'stale', false,
    'synthetic', false,
    'aggregate',
      coalesce((i.payload->>'occurrenceCount')::integer, 1) > 1
      or a.item_id in (
        'r2-jestei-filter-toolbar-ui',
        'r2-jestei-filter-quick-ui',
        'r2-jestei-filter-advanced-ui',
        'r2-jestei-filter-key-dialog-ui',
        'r2-jestei-filter-actions-ui',
        'r2-jestei-subscription-before-after-ui'
      )
  )
from public.temp_text_review_round_2_answers a
join public.temp_text_review_round_2_items i using (item_id)
on conflict (source_round, source_item_id) do nothing;

-- Enrich only R1 decisions that have an exact, structured Round 2 bridge.
-- R1 decisions without a structured bridge remain represented in the ledger
-- but fail closed for automatic inheritance until a later slice supplies evidence.
update public.temp_text_review_round_3_prior_decisions p
set metadata = p.metadata || jsonb_build_object(
  'kind', i.payload->>'kind',
  'context', jsonb_build_object(
    'pageId', i.payload->>'pageId',
    'section', i.payload->>'section',
    'role', i.payload->>'role',
    'kind', i.payload->>'kind'
  ),
  'stale', false,
  'synthetic', false,
  'aggregate', coalesce((i.payload->>'occurrenceCount')::integer, 1) > 1
)
from public.temp_text_review_round_2_items i
where p.source_round = 'round_1_2026_09_22'
  and i.payload#>>'{round1,itemId}' = p.source_item_id
  and i.payload#>>'{current,source}' = p.chosen_text
  and p.metadata->>'recovery_status' = 'confirmed'
  and not (p.metadata ? 'context');
