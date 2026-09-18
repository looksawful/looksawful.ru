# Canonical outreach links

Use repository-generated URLs for every controlled link. Do not hand-edit UTM values.

`utm_content` is a bounded destination token such as `cv`, `home`, `jestei-pool` or `styx`. `utm_id` is an opaque batch token such as `2026w38a`. Never encode recruiter names, employers, handles, email addresses, recipient identity or message text in attribution values.

## Recruiter and job-search links

```bash
npm run outreach:link -- --destination /cv/ --source hh --medium message --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source hh --medium profile --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source telegram --medium dm --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source instagram --medium dm --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source linkedin --medium dm --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source linkedin --medium profile --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source vk --medium dm --campaign job_search --content cv --batch 2026w38a
npm run outreach:link -- --destination /cv/ --source email --medium outreach --campaign job_search --content cv --batch 2026w38a
```

## Portfolio discovery links

```bash
npm run outreach:link -- --destination / --source hh --medium profile --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination / --source telegram --medium channel --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination / --source telegram --medium profile --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination / --source instagram --medium bio --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination /work/jestei-pool/ --source instagram --medium story --campaign portfolio --content jestei-pool --batch 2026w38a
npm run outreach:link -- --destination /work/jestei-pool/ --source instagram --medium post --campaign portfolio --content jestei-pool --batch 2026w38a
npm run outreach:link -- --destination /work/jestei-pool/ --source instagram --medium reel --campaign portfolio --content jestei-pool --batch 2026w38a
npm run outreach:link -- --destination / --source linkedin --medium profile --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination /work/jestei-pool/ --source linkedin --medium post --campaign portfolio --content jestei-pool --batch 2026w38a
npm run outreach:link -- --destination / --source behance --medium profile --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination /work/jestei-pool/ --source behance --medium project --campaign portfolio --content jestei-pool --batch 2026w38a
npm run outreach:link -- --destination / --source vk --medium profile --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination /work/jestei-pool/ --source vk --medium post --campaign portfolio --content jestei-pool --batch 2026w38a
npm run outreach:link -- --destination / --source fashionbank --medium profile --campaign portfolio --content home --batch 2026w38a
npm run outreach:link -- --destination /work/jestei-pool/ --source fashionbank --medium project --campaign portfolio --content jestei-pool --batch 2026w38a
npm run outreach:link -- --destination / --source email --medium signature --campaign portfolio --content home --batch 2026w38a
```

`vk / dm / portfolio` is also allowed when a direct conversation is portfolio-oriented rather than recruiting-oriented.

## Destination rules

Use `/cv/` for recruiter or employment conversations. Use `/` for broad portfolio/profile discovery. Use a canonical `/work/<case>/` path when the publication or message is specifically about that case.

Create a new opaque `utm_id` for each outreach or publishing batch. Reuse the same batch token only when links belong to the same deliberate distribution batch and should be analyzed together.
