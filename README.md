# looksawful.ru

Personal portfolio by Ivan Krushinsky / looksawful.

Website: https://looksawful.ru

## Repository workflow

This repository has two permanent operational branches:

- `dev` — GitHub default branch and the working/integration branch;
- `prod` — production/release branch and the source for GitHub Pages deployment.

Production deployment is explicitly tied to `prod`; the repository default branch is not used as an implicit deployment selector.

Before changing the project, read [AGENTS.md](./AGENTS.md). Current documentation is indexed in [docs/README.md](./docs/README.md). Use [docs/agent-context/](./docs/agent-context/) as a compact navigation layer for agent work; canonical project documents remain the detailed guidance. Executable code, parsers, tests and workflows outrank prose when they disagree.

Common entry points:

- local/tooling workflow: [docs/tooling-pipeline.md](./docs/tooling-pipeline.md)
- testing policy: [docs/testing-policy.md](./docs/testing-policy.md)
- current testing map: [docs/testing-pipeline.md](./docs/testing-pipeline.md)
- CMS/content/media ownership: [docs/cms-architecture.md](./docs/cms-architecture.md)
- CMS operator handbook: [docs/cms-handbook.md](./docs/cms-handbook.md)
- site/CMS publication operations: [docs/site-operations.md](./docs/site-operations.md)
- local Content/Media Desk HTTP contract: [docs/content-media-desk-api.md](./docs/content-media-desk-api.md)

The CMS/Desk authoring model is currently under reconciliation in GitHub Issues #249 and #451–#453. Current implemented behavior and target safer behavior are documented separately; target work must not be treated as already implemented.

## Rights and licensing

This repository is public so the code and implementation can be reviewed as part of the portfolio. It is a proprietary, source-visible project, not an open-source project and not a general reuse grant.

Owner-controlled original material is governed by the **LOOKSAWFUL PORTFOLIO LICENSE, Version 1.0** unless a more specific license applies. Third-party libraries, fonts, client and collaborative work, trademarks, media, likenesses and referenced material remain under their own terms and rights.

The standalone Awful Cases source repository remains MIT-licensed for the software covered by its own MIT License; its branding and unrelated portfolio material are not automatically included in that grant.

Rights and licensing:

- [LICENSE](./LICENSE)
- [Content rights](./CONTENT_RIGHTS.md)
- [Licensing model](./docs/LICENSING.md)
- [Third-party notices](./THIRD_PARTY_NOTICES.md)
- [Rights and provenance](./docs/RIGHTS_AND_PROVENANCE.md)
- [References](./docs/REFERENCES.md)
- [Contributing](./CONTRIBUTING.md)
