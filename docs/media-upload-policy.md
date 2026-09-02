# Media upload policy

This document defines the current repository-backed upload boundary for new Pages CMS Media Catalog masters.

## Scope

The policy applies only to new Media Catalog upload records under:

```text
src/content/media-catalog/uploads/*.json
public/media/catalog/*
```

Existing registered assets under `src/content/media-catalog/registered/**` are not retroactively rejected by these limits.

The source master remains preserved. Generated responsive images, web-video delivery files and posters remain reproducible outputs owned by the existing media tooling.

## Size limits

| Media type | Warning above | Hard reject above |
| --- | ---: | ---: |
| Image | 20 MiB | 50 MiB |
| Video | 50 MiB | 95 MiB |

A file at the exact warning threshold is accepted without a warning. A file above the warning threshold but at or below the hard limit is accepted and emits a diagnostic. A file above the hard limit fails closed.

The hard video limit intentionally leaves headroom below the practical ~100 MB Git/GitHub single-file transport boundary. Files that require larger source masters should not be pushed through the current Git-backed CMS upload path; use a future external/object-storage workflow instead of weakening the repository guard.

## Enforcement point

`tools/sync-media-catalog.mjs` checks the physical source file size immediately after `stat()` and before `ffprobe` or any derivative work. This prevents an oversized CMS master from consuming media-probe/transcode time before being rejected.

The same guard is used by stored-upload validation, so an oversized file cannot bypass the policy through a cached/unchanged-input verification path.

## Ownership

The size policy controls storage/operational safety only. It must not rewrite editorial fields such as:

- title;
- alt;
- description;
- project/taxonomy relations;
- tags;
- credits;
- reusable/archive state.

Technical metadata such as width, height, duration, MIME type, byte length and generated delivery metadata remains media-tooling-owned.

## Current storage baseline

The 2026-09-02 active-tree cleanup removed 541 obsolete repository-root `media/**` files, approximately 174.4 MB, while preserving the canonical `public/media/**` delivery tree. The measured pre-cleanup working tree was approximately 1004 MiB, so the resulting active working set is approximately 830 MiB by subtraction.

Reachable Git history remains approximately 2.64 GiB because the cleanup intentionally did not rewrite permanent-branch history. Historical compaction is therefore a separate future decision, not part of normal CMS upload handling.
