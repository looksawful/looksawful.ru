# Pages CMS roadmap — historical

Status: historical implementation roadmap.

This file is retained only as a record of the earlier staged Pages CMS migration. It is not the current source of truth for CMS ownership, publication safety or future implementation order.

Current architecture and ownership rules are documented in:

- `docs/cms-architecture.md` — authoritative CMS/content/media ownership and publication trust boundary;
- `docs/cms-content-map.md` — detailed content/render-slot inventory;
- `docs/site-operations.md` — operational CMS/media/publication procedures;
- `.pages.yml` — current Pages CMS UI/configuration;
- current TypeScript parsers, tests and GitHub Actions workflows — executable contracts.

The following historical principles remain valid where they do not conflict with current code:

- Pages CMS edits authored/editorial data rather than routes, renderers or runtime;
- TypeScript owns domain identity and application architecture;
- generated media is tool-owned and is not edited manually;
- public design/runtime should not change as a side effect of content-storage work;
- CMS capabilities are added incrementally rather than by converting the site into a generic page builder.

Several milestones described by the original roadmap have since been completed, including strict Case editorial sources, Shootings content, CV/navigation/project-card CMS integration, the reusable Media Catalog, canonical CMS option generation and media synchronization. Therefore old stage labels, pilot recommendations and statements such as “future candidate” must not be used to infer current ownership.

For future CMS development, start from `docs/cms-architecture.md` and the current repository state rather than this historical roadmap.
