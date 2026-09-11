# Contact Hub + Venus Notion / Site Documentation Audit

**VERDICT: GO WITH FIXES for pre-implementation; NO-GO for production release until privacy/analytics release gates are satisfied.**

Notion Projects 114 and 116 are now aligned at the top-level canonical decision layer. The public site documentation intentionally still describes only production behavior; it must not claim that a form, Postbox/Object Storage processing or AI assistant is live before those systems actually ship.

## FINDINGS

### D1 — Notion Project 114 is reconciled
Project 114 now records:
- canonical Venus rather than Awful Cases as default pet;
- pointer/touch drag;
- separate direct-form affordance;
- pet temporary hide / auto-return / persistent disable ownership;
- shared Contact Hub mobile collapse/restore instead of `mobile fullscreen`;
- prepared-intent -> structured deterministic answer -> generative fallback hierarchy.

Older notes may remain as historical context, but the canonical callout and targeted replacements supersede conflicting wording.

### D2 — Notion Project 116 is reconciled
Project 116 now records:
- name optional, email/message required;
- mobile stable collapsible sheet/overlay rather than fullscreen-only;
- Venus draggable and able to open form directly in one action;
- pet hide/persistent-disable behavior;
- visual viewport/safe-area/keyboard stability.

### D3 — public `/privacy/` correctly describes current production only
`public/privacy/index.html` currently describes Cloudflare Web Analytics and Yandex Metrika, current consent behavior and current conversion goals. It does not claim direct-form, attachment-storage or AI processing that is not yet deployed.

**Decision:** do not update public privacy copy during pre-implementation. Update it in the same release slice that activates the form/AI behavior.

### D4 — privacy release gate for direct contact
Before public form activation, `/privacy/` must accurately explain at least:
- visitor-provided name when supplied, email and message are processed solely to deliver/respond to the contact request;
- Yandex transactional/backend services used by the final implementation;
- optional attachment is temporarily stored privately, delivered by time-limited access and deleted by lifecycle policy;
- no form body/email/name/filename is sent as Metrika goal parameters;
- analytics consent is independent from contact submission;
- retention/logging policy for request metadata must match real backend behavior.

Do not describe a database/inbox if none exists.

### D5 — Webvisor form-field recording is a hard release check
Current analytics/privacy docs state Webvisor is enabled. #170 already requires review before public text forms. The release must verify that visitor-entered form content is not recorded by Webvisor. If the dashboard option `Записывать все поля` is enabled, disable it or configure an equivalent proven field-masking/exclusion path before release.

This is a privacy gate, not a cosmetic analytics preference.

### D6 — Contact Hub analytics should be documented only when runtime exists
Current `docs/analytics.md` lists production goals. `contact_form_open` / `contact_form_submit` should be added when corresponding runtime events exist and exact Metrika goals are configured. `contact_form_submit` remains success-only. `contact_form_error` is optional coarse operational telemetry, never field/validation payload.

### D7 — broader analytics docs have minor drift unrelated to Contact Hub
#170/#747/#750 mention `case_end`, while the current `docs/analytics.md` production goal table does not. That drift should be fixed by the analytics work that actually implements/configures `case_end`; it is not a reason to mutate Contact Hub scope.

### D8 — AI privacy docs are a separate activation gate
If Yandex AI mode ships with/after the form, public privacy copy must distinguish AI chat processing from direct-contact processing. It must not imply that form PII is AI context or that chat history is delivered by email. If AI remains feature-off, do not describe it as active production processing.

## FIXES APPLIED DURING AUDIT

1. Verified both Notion canonical pre-implementation callouts succeeded.
2. Replaced stale Project 116 `name required` and `mobile fullscreen` details.
3. Replaced stale Project 114 fixed-pet/mobile-fullscreen/old routing details.
4. Kept public privacy and analytics documents unchanged because the new processing is not deployed yet.

## PRE-IMPLEMENTATION READY CONDITIONS

- Notion 114/116 canonical sections agree with repo spec.
- GitHub #709/#746 and child issues agree with repo spec.
- Production documentation remains truthful to production rather than future architecture.

These conditions are satisfied by documentation review; executable RED remains a separate gate.

## PRODUCTION RELEASE CONDITIONS

1. Update `/privacy/` to actual contact/attachment processing and, if enabled, AI processing.
2. Update `docs/analytics.md` to actual Contact Hub goals.
3. Configure/verify exact Yandex goals.
4. Prove form-field values are not captured by Webvisor.
5. Prove analytics-denied/GPC/DNT users can still submit the form.
6. Re-read the deployed privacy page against actual network/storage behavior after production-like smoke.

## REQUIREMENT IDS AFFECTED
PRV-001.., AN-001.., SEC privacy boundaries, S success-only analytics semantics, A temporary private attachment handling, P-010 analytics-independent contact.

## TEST / EVIDENCE IMPACT
Automated:
- analytics submit only after confirmed backend success;
- analytics payload contains no name/email/message/filename;
- form works with analytics denied;
- attachment bytes never enter sessionStorage.

Manual/external:
- Metrika dashboard exact goal conditions;
- Webvisor field-recording/masking configuration;
- deployed privacy-page truthfulness;
- real Object Storage lifecycle/expiry and provider smoke.

## QUESTIONS REQUIRING OWNER DECISION
None before frontend RED/GREEN. Final privacy wording should be reviewed against the actual backend implementation rather than approved in the abstract now.
