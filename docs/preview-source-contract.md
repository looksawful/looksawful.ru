# Preview source contract

This repository owns Preview source identities and product/source mechanics only. Trusted deployment, private auth/runtime, provider credentials and cleanup authority live in `looksawful/awful-control`.

## Branch roles

- `dev` remains the default stable integration branch.
- `prod` remains the protected production/release branch.
- feature/fix/content work reaches `dev` through its own reviewed PR.
- `lab` is disposable generated integration state and is never a release source.
- never merge `lab -> dev`.

## Generated Lab

Run `Compose generated Lab` manually with an explicit comma-separated set of PR numbers. The composer always starts from current `dev`, accepts only open same-repository PR heads with exact SHAs, sorts PRs numerically, and merges them in that order.

The workflow does not push until every selected PR merges cleanly. Any conflict aborts the run and leaves the previous known-good `lab` ref unchanged. The final update is a force-with-lease update of `lab` only.

## CMS Preview

`tools/preview/cms-snapshot.mjs` is a local broker that uses the user's existing Git authorization. It creates `cms-preview/<bounded-id>` refs from an isolated temporary worktree.

Default base is `dev`. `lab` is allowed only with the explicit `--allow-lab` advanced mode. The broker reuses `tools/cms-publication-scope.mjs`; ENGINEERING, UNKNOWN, mixed unsafe scope or an empty change set fails closed.

Dry-run is the default. `--push` creates the synthetic exact snapshot ref. The private control plane derives the 72-hour TTL from the snapshot commit time. Creating a Preview grants neither Publish authority nor provider authority and does not mutate `content/text-cms`, `dev`, `prod` or the active engineering branch.

Example:

```powershell
'["src/content/cases/styx.json"]' | Set-Content $env:TEMP\cms-preview-files.json
node tools/preview/cms-snapshot.mjs --id styx-copy --files $env:TEMP\cms-preview-files.json
node tools/preview/cms-snapshot.mjs --id styx-copy --files $env:TEMP\cms-preview-files.json --push
```

## Security boundary

The public repository must not contain Cloudflare/provider credentials, Preview human/session secrets, trusted private runtime implementation, provider cleanup authority or a cross-repository dispatch credential. The private control plane discovers the resulting exact source refs independently.
