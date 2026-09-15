# Canonical outreach links

Use repository-generated URLs for every controlled link. Do not hand-edit UTM values.

## Recruiter CV links

```bash
npm run outreach:link -- --destination /cv/ --source hh --medium message --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source telegram --medium dm --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source email --medium outreach --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source linkedin --medium dm --campaign job_search --content cv --batch 2026w38a
```

## Instagram

The outreach-link utility must be extended before using these recipes so `instagram` is allowlisted with the exact medium/campaign pairs below:

```text
instagram / dm / job_search
instagram / bio / portfolio
instagram / story / portfolio
```

Canonical destinations:

```text
Instagram DM -> /cv/ when the conversation is employment/recruiting
Instagram bio -> / when it is general portfolio discovery
Instagram story -> the promoted case or / depending on the story
```

Use a new opaque `utm_id` for each outreach batch or publishing batch. Do not encode recruiter, employer, username or recipient identity in it.
