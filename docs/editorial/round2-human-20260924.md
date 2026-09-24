# Round 2 human checkpoint — 2026-09-24

Owner review was completed in the private Text Review surface.

- Supabase snapshot: `round_2_2026_09_24_human_window`
- Persisted decisions: 62
- Keep: 21
- Minimal: 14
- Strong: 13
- Custom: 5
- Repair: 4
- Use-dev: 2
- 2016–2018: 2
- New: 1
- Empty custom decisions: 0

Implementation rule: apply approved copy to canonical sources, regenerate derived media metadata, and never infer missing authorship.

Evidence-gated repair items still require primary-source confirmation:
- `fact-gallery-credit-012`
- `fact-gallery-credit-013`
- `fact-gallery-credit-014`
- `fact-gallery-credit-016`

The Gallery H1 custom response is an implementation instruction, not publishable copy. The dev implementation keeps the semantic H1 visually hidden.

Verification performed before PR:
- dedicated Round 2 selection contract test
- media catalog sync/check
- TypeScript
- fast tests
- site build
- affected E2E
- git diff check
