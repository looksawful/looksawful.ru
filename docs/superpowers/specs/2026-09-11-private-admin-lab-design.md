# Private Admin + Debug Lab Architecture Design

Status: **APPROVED DIRECTION / IMPLEMENTATION SPEC**

Implementation branch: `feature/admin-debug-lab`

Base branch: `prod`

Related issue: `#732`

Related PR: `#735`

Related canonical architecture docs:

- `docs/superpowers/specs/2026-09-04-page-content-section-content-block-architecture-design.md`
- `docs/superpowers/specs/2026-09-04-component-contracts-and-screenshot-evidence.md`
- `docs/superpowers/specs/2026-09-04-shared-runtime-and-specialized-component-contracts.md`
- `docs/superpowers/specs/2026-09-04-ui-kit-token-component-traceability.md`

## Goal

Keep Lab as a useful internal debugging/design-development tool while removing its authority to act as an independent branch, deployment source, CMS, media store or release path.

The private Admin surface eventually contains two separate tools behind one authentication boundary:

- **Debug Lab** — read/debug/inspect internal site and component surfaces;
- **Media Desk** — photo/media management UI over the canonical CMS/media service.

The tools share authentication and shell infrastructure but do not share mutation authority.

## Branch and release authority

- `prod` is the active working, production and source-of-truth branch.
- `feature/*`, `fix/*` and `chore/*` branch from `prod` and return through PRs to `prod`.
- `dev` is archive-only. It does not participate in current development, preview, CMS, Media Desk, Lab deployment or release flow.
- the old `lab` branch is a frozen migration source only. Useful behavior may be ported selectively; the branch is never merged wholesale into `prod`.
- production deployment stays independent from Lab/Admin deployment.

## Product model

### Debug Lab

Lab must expose the complete internal design/development surface, not only content visible to public visitors.

Lab catalogs:

- LIVE pages;
- HIDDEN pages;
- WIP pages;
- generic components/organisms;
- specialized components/organisms;
- hidden/WIP organisms;
- PR-only pages/organisms where the current candidate source tree contains them.

Examples such as Berserk remain accessible in Lab even when ordinary site users cannot discover them.

**Invariant:** public visibility and Lab visibility are independent concepts.

### Media Desk

Media Desk remains a management UI over the canonical CMS/media service.

It may browse, preview, search, edit, upload, replace, delete and bulk-manage media only through the CMS/media service contract.

It must not gain a competing catalog, direct repository/file mutation path, or independent publication authority.

### Admin shell

The remote Admin surface is private and uses:

- GitHub OAuth for identity;
- server-side or edge-side session verification;
- a secure HttpOnly session cookie;
- no Cloudflare Zero Trust/Access dependency.

The same authenticated shell can expose `/lab` and `/media`, but authorization checks remain capability-specific.

## Canonical page catalog

The existing `src/site/pages/manifest.ts` remains the canonical page registry.

Lab derives its page catalog from `sitePages`; it does not maintain a duplicate page allowlist.

For each page Lab records:

- `id`;
- canonical `path`;
- page `type`;
- public discovery flags;
- Lab visibility;
- Lab lifecycle state.

Lifecycle rules:

- `LIVE` — candidate page is enabled and intended as a normal active surface;
- `HIDDEN` — candidate page exists and is buildable but public discovery is suppressed;
- `WIP` — candidate page exists in the current development/PR source and is explicitly marked work-in-progress while remaining Lab-visible.

A WIP page must be testable/renderable in Lab without becoming publicly discoverable merely because Lab can open it.

The first page-catalog contract slice already exists in PR #735 and proves that canonical hidden/non-indexable pages are not filtered out of Lab.

## Canonical component/organism catalog

The repository already has executable component contracts and documentation. The Lab catalog must consume those rather than invent an unrelated inventory.

Primary executable sources:

- `CONTENT_BLOCK_TYPES` in `src/content/contracts/content-block.ts` for typed ContentBlock families;
- `renderContentBlock()` in `src/site/renderers/entity/content-block.ts` as the closed renderer boundary;
- shared/specialized component owners under `src/components/`;
- existing component-contract and traceability specs for classification metadata.

The new repository-owned Lab/component metadata layer may add design/debug metadata that runtime contracts do not currently carry, but it must be validated against executable sources.

Each Lab organism entry has:

```ts
export type LabLifecycle = "live" | "hidden" | "wip";
export type LabComponentClass = "generic" | "specialized" | "runtime";

export interface LabComponentCatalogEntry {
  id: string;
  label: string;
  class: LabComponentClass;
  lifecycle: LabLifecycle;
  source: string;
  previewKind: "content-block" | "standalone" | "runtime-state";
  labVisible: true;
}
```

The catalog must include, where still present in the candidate source tree, at least the existing typed/specialized families documented by current architecture: Before/After, Page Flip, Animated Canvas Gallery, Jestei Theme, Awful Cases Game, Berserk Audio Player and Jestei filter/runtime surfaces.

Tests prevent the catalog from silently losing a canonical `CONTENT_BLOCK_TYPES` member.

## Lab runtime architecture

New Lab code lives under `src/devtools/lab/` and a tool entry page under `tools/lab/`.

The old `src/lab/*` implementation on the frozen `lab` branch is evidence/migration source, not target architecture.

Target modules are intentionally small:

- `catalog.ts` — page projection;
- `component-catalog.ts` — component/organism inventory metadata;
- `state.ts` — serializable Lab state and URL parsing;
- `targets.ts` — allowed local/preview/production targets and target capability policy;
- `frame-tools.ts` — same-origin outline/grid/inspection helpers;
- `scratch.ts` — ephemeral CSS scratch override;
- `entry.ts` — UI orchestration only;
- `lab.css` — Lab-owned visual shell styles;
- `tools/lab/index.html` — Lab document shell.

The orchestration file must not absorb state parsing, security policy or inspector logic.

## Preserved behavior from old Lab

Port and verify:

- route switcher;
- go/reload/open/copy-view-link actions;
- fit/desktop/tablet/mobile viewport presets;
- custom width/height;
- checker/light/dark canvas;
- outline elements toggle;
- page-grid toggle;
- same-origin element inspector;
- computed style summary;
- selector copy;
- keyboard shortcuts;
- ephemeral CSS scratchpad;
- scratch copy/reset;
- build/branch/SHA/target provenance.

Storybook/component explorer is optional. It must not be required to start Lab, build Lab, run Fast CI or deploy Admin.

## Target capability policy

Lab supports three conceptual target classes.

### Local

Local same-origin candidate may expose full read/debug tooling:

- route navigation;
- viewport controls;
- outline/grid;
- element inspection;
- computed style reading;
- ephemeral CSS injection.

### PR Preview

PR Preview always supports visual/responsive testing.

Privileged DOM/CSS inspection is allowed only when same-origin or through a separately reviewed preview-only read/debug bridge. Any bridge must be:

- absent from production bundles;
- strict-origin constrained;
- session/nonce constrained;
- read/debug only;
- unable to invoke CMS/media mutations.

### Production

Production is visual/read-only by default.

Do not add a privileged production debug agent simply to make Lab inspection convenient.

## Security invariants

- Lab cannot mutate CMS/media data.
- Lab cannot publish or merge.
- Admin authentication does not automatically grant Media Desk mutation authority to Lab code.
- arbitrary cross-origin iframes cannot receive privileged inspection commands.
- production bundles contain no privileged Lab bridge.
- OAuth client secret and session secret never enter Vite client bundles.
- remote auth uses exact redirect URIs and an anti-CSRF `state` value.
- session cookie is `HttpOnly`, `Secure`, `SameSite=Strict` and expires.
- unauthorized requests to private Admin routes do not receive private Lab/Media Desk HTML/data.

## Build/deployment isolation

Public production `npm run build:site` must remain independent from Lab.

Lab/Admin uses its own build entry/configuration. A failure in optional Storybook or Lab tooling cannot block production-site build unless a repository-wide contract test itself has legitimately failed.

PR Preview remains ephemeral and candidate-SHA scoped.

Remote Admin is deployed separately from `www.looksawful.ru` and should target `admin.looksawful.ru` only after authentication tests and deployment preflight pass.

## Media Desk boundary for this workstream

This Lab plan does not rewrite Media Desk CRUD.

Before remote Media Desk integration, a separate plan must:

1. make opening/browsing Media Desk side-effect-free;
2. define the canonical CMS/media service API;
3. add revision/conflict protection;
4. remove direct UI-to-filesystem mutation authority;
5. add upload/replace/delete/usages/bulk through the service;
6. enforce Admin session authorization server-side for mutations.

That work is a separate subsystem and gets its own implementation plan after the Lab core is stable.

## TDD policy

Every behavioral slice follows RED → GREEN → REFACTOR:

1. write one focused failing test;
2. run it and record the expected failure;
3. implement the minimum behavior;
4. rerun the focused test;
5. run affected fast tests/typecheck;
6. refactor only while tests stay green;
7. commit the self-contained slice.

Do not batch unrelated behavior behind one large implementation commit.

## Verification layers

### Contract/unit

- page catalog coverage;
- hidden/WIP lifecycle mapping;
- component catalog coverage and uniqueness;
- state parsing/serialization;
- target capability policy;
- scratch reset behavior;
- security policy helpers.

### Repository/CI

- `npm run typecheck`;
- `npm run test:fast`;
- repository structure contract;
- production `npm run build:site`;
- Lab-specific build command.

### Browser/E2E

At desktop/tablet/mobile:

- route selection;
- viewport presets/custom dimensions;
- target switching;
- outline/grid;
- same-origin inspect;
- scratch CSS apply/reset;
- provenance display;
- console/network cleanliness;
- keyboard shortcuts;
- hidden page/component discoverability in Lab;
- no unauthorized CMS mutation surface.

### Security/auth

After Admin auth plan is implemented:

- unauthenticated Admin request rejected/redirected;
- valid owner GitHub session accepted;
- invalid OAuth state rejected;
- expired/tampered session rejected;
- auth endpoints do not leak secrets;
- Lab remains read/debug-only after authentication.

## Migration sequence

1. keep old `lab` branch frozen;
2. characterize existing behavior from `lab/index.html`, `src/lab/index.ts`, `src/lab/scratch.ts` and `src/lab/lab.css`;
3. build the new Lab core on fresh `prod` foundation;
4. prove page/component catalog completeness;
5. port runtime/UI behavior slice by slice;
6. verify local browser parity;
7. add private Admin authentication in a separate plan;
8. verify remote Admin Lab;
9. only then retire obsolete old Lab deployment/workflow/branch artifacts.

No old Lab deployment or branch is deleted before functional parity is evidenced.

## Definition of Done

Lab core is complete when:

- new implementation is based on `prod`;
- all canonical pages, including hidden/non-indexable pages, appear in Lab;
- WIP state has an explicit non-public representation;
- component/organism catalog covers canonical typed ContentBlocks and required specialized/internal organisms;
- old useful Lab controls are ported and browser-tested;
- Lab build is isolated from production build and Storybook;
- production has no privileged debug bridge;
- Lab has no CMS/media mutation authority;
- typecheck, fast tests, production build and Lab build are green;
- PR #735 contains reviewable, self-contained commits;
- old Lab remains available as migration evidence until remote Admin parity is proven.
