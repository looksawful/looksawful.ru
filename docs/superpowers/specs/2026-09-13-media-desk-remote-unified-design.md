# Media Desk Remote + Unified Media Graph Design

Issue: #808

## Status

Approved architecture for implementation on `feature/media-desk-remote-unified`, based on `dev@53c959b20207a39f8500a6a1dbd2b2d6af302d31`.

## Goal

Make Media Desk the single private, network-accessible control surface for media used by looksawful.ru. It must be reachable at `https://media.looksawful.ru` without the workstation being online, protected by password/session auth, and able to manage canonical media plus Gallery, project/pet/character covers, standalone pet/character page media and video posters without bypassing the repository's existing authoring safety rules.

## Non-negotiable branch and publication authority

- `dev` is the working/integration branch and normal PR base.
- `prod` is production/release/deploy only.
- `content/text-cms` is the permanent editorial authoring branch.
- Remote Media Desk writes target `content/text-cms` only.
- Remote Media Desk never commits directly to `dev` or `prod`.
- Publication remains `content/text-cms -> explicit READY/готово -> deliberate reconciliation -> dev -> exact verification -> reviewed dev -> prod`.
- Authentication grants access to the private Desk, not publication authority.

## Deployment architecture

```text
browser
  -> https://media.looksawful.ru
  -> Cloudflare Worker
       -> authentication/session gate
       -> static Media Desk assets
       -> private Media Desk API
            -> GitHub API
                 -> looksawful/looksawful.ru
                 -> content/text-cms
```

The remote runtime is Cloudflare Worker + Worker Static Assets. No always-on workstation process, Vite server, VM, writable disk or Cloudflare Tunnel is required for the remote product.

The local Desk remains available for development. Ordinary local `npm run desk` remains read-only and loopback-only. The existing guarded `npm run desk:write` path remains authoritative for local filesystem editing and is not weakened by the remote runtime.

## Authentication and session security

The Worker must run before Static Assets so unauthenticated clients cannot read HTML, JavaScript, source maps, API responses or generated inventory data.

Required bindings/secrets:

- `MEDIA_DESK_PASSWORD_HASH`
- `MEDIA_DESK_SESSION_SECRET`
- `MEDIA_DESK_GITHUB_TOKEN`

The password is stored only as a slow password hash. The implementation may use the existing PBKDF2 design from historical PR #717 if it meets the current tests. Plaintext passwords are never committed or logged.

Successful login produces a signed session cookie with:

- `HttpOnly`
- `Secure` in production
- `SameSite=Strict`
- host-only scope
- bounded expiry

State-changing requests must pass same-origin validation. The runtime returns `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow, noarchive`, defensive content-type headers and frame restrictions. Secrets and GitHub tokens remain server-side.

## Remote write model

The Cloudflare runtime does not mount or emulate the local filesystem transaction store. It writes repository sources through GitHub while preserving the same externally visible safety properties:

1. Read the canonical source and capture its source revision and branch head.
2. The client edits an allowlisted authored representation.
3. Mutation carries the expected source revision plus expected branch head.
4. The Worker refetches current source/head immediately before committing.
5. Stale source or moved head fails with `409`.
6. The complete candidate is validated against the same canonical parsers/ownership rules before commit.
7. A single edit produces one commit on `content/text-cms`.
8. A bulk edit is materialized as one Git tree/commit/ref update so all source changes advance together.
9. GitHub API credentials never reach the browser.

Remote writes are content/media edits only. Engineering/config/workflow paths are not writable through Media Desk.

## Canonical media model

Media Desk must not introduce a second media database. `MediaCatalogItem` and existing canonical content sources remain source of truth.

The Desk derives a `UnifiedMediaRecord` projection:

```ts
interface UnifiedMediaUsage {
  kind:
    | "gallery"
    | "project-cover"
    | "pet-cover"
    | "character-cover"
    | "page-media"
    | "video-poster"
    | "direct-placement";
  ownerId: string;
  sourcePath: string;
  fieldPath?: string;
  route?: string;
  blockingDelete: boolean;
}

interface UnifiedMediaRecord {
  assetId: string;
  item: MediaCatalogItem;
  usages: readonly UnifiedMediaUsage[];
  diagnostics: readonly MediaDiagnostic[];
}
```

Usages are derived, deterministic and non-persistent. A logical asset may have multiple usages.

## Usage discovery

The graph covers:

- Gallery membership via `showInCatalog`;
- canonical MediaEntry direct/poster placements;
- project card covers in authored project-card sources;
- pet-project covers;
- character/mascot cover assignments;
- media referenced by standalone `public/pets/**` pages when those references can be mapped to a registered asset;
- canonical video poster relationships;
- uploaded/registered assets with zero usage;
- missing-source, duplicate-id, duplicate-path and orphan diagnostics already supported by Media Base.

Discovery must use explicit source adapters, not arbitrary HTML scraping in the browser. Standalone page references may be indexed by build-time/repository-side adapters where necessary, but the resulting mapping must resolve back to canonical asset IDs.

## Normalization rule for covers and standalone page media

Where a cover/page reference is currently a raw path, the migration direction is to resolve and store a canonical asset ID while preserving current rendering behavior. New Media Desk assignment operations must write canonical relationships rather than inventing additional free-form paths.

Existing raw-path sources may remain readable during migration, but the Desk must show them as legacy path-backed usage and must not silently duplicate the file into a second store.

## Operations

### Browse and metadata

Remote and local Desk share the same UI projection for:

- search;
- type/project/usage/diagnostic filtering;
- preview/lightbox;
- authored metadata editing;
- `showInCatalog`;
- reusable/archive state;
- project/tag/credit metadata;
- bulk metadata edits.

### Upload

Uploads are accepted only for allowlisted media destinations. Before commit the server validates:

- path normalization and traversal rejection;
- extension/type policy;
- current upload size policy;
- canonical ID uniqueness;
- generated metadata required by the existing Media Catalog parser.

The first implementation does not perform expensive video transcoding inside a Worker. Uploaded binaries are committed as source assets only when they fit GitHub/API limits and repository policy. Media requiring local derivative generation remains explicitly marked as requiring the existing media pipeline before publication.

### Replace

Replace preserves logical asset identity and relationships. The old source revision/head must match. The candidate must pass the same type/size/path rules as upload. The operation updates the backing file and canonical technical metadata together in one branch commit where both are repository-authored.

### Assignment

The Desk can assign or change:

- Gallery visibility;
- project cover;
- pet cover;
- character/mascot cover;
- video poster;
- supported page-media relationships.

Each assignment writes the existing canonical source that owns that relationship.

### Delete

Delete is denied when any `blockingDelete` usage exists. The API returns the blocking usages. An unreferenced asset may be deleted only together with the canonical catalog record/update required to keep the catalog valid. Delete also uses expected source revision + expected branch head.

## UI behavior

Each media card/detail view shows:

- asset ID;
- source path/type/dimensions where available;
- authored metadata;
- visibility/archive/reusable state;
- every usage with owner and route/source provenance;
- diagnostics;
- edit/replace/assignment actions when the authenticated runtime supports write mode;
- delete only when dependency analysis is clear.

Remote mode must visibly identify itself as `REMOTE WRITE · content/text-cms` and show branch/head provenance. Local read-only/write mode labels remain distinct.

## Error semantics

- `400`: malformed/invalid/unsupported candidate;
- `401`: unauthenticated mutation/API access;
- `403`: authenticated but forbidden target/path/action;
- `404`: unknown asset/source;
- `405`: method not allowed;
- `409`: stale source revision, moved branch head or assignment conflict;
- `413`: upload exceeds policy/runtime limit;
- `500/502`: upstream/runtime failure with no success claim.

No error path may silently retry by dropping the expected revision/head guard.

## Testing strategy

Permanent focused contracts cover:

- auth secrets/session cookie/same-origin behavior;
- Worker-first asset protection and private headers;
- target branch fixed to `content/text-cms`;
- GitHub mutation expected-head/source conflict behavior;
- bulk single-commit semantics;
- unified media usage derivation for Gallery, cover, page and poster relationships;
- delete blocking;
- upload/replace path/type/size policy;
- UI mode/provenance and usage rendering;
- build isolation from the public production site.

Cloudflare build must support a Wrangler dry-run in CI. Browser verification must exercise unauthenticated rejection, authenticated Desk load and a non-destructive authenticated API read against the deployed preview. Real branch mutation is tested against deterministic adapters/fixtures, not against `dev`/`prod`.

## Deployment and secrets

A dedicated workflow builds and deploys the remote Desk from trusted `dev` pushes/manual dispatch only. Pull requests may build/dry-run and deploy isolated previews without production secrets, but must not receive the GitHub write token or production password/session secret.

`media.looksawful.ru` is the only production custom domain accepted by the Worker security policy. `.workers.dev`/preview hosts must not be treated as production authenticated origins.

Account-side secret provisioning is performed through an explicit operator script or Cloudflare dashboard/API action and is documented separately. Secret values never appear in repository files, Actions logs or generated artifacts.

## Explicitly out of scope for this package

- replacing Pages CMS as text CMS;
- publishing directly to `dev` or `prod`;
- arbitrary repository file editing;
- image/video AI generation inside Media Desk;
- expensive server-side transcoding inside Cloudflare Worker;
- introducing a database merely to mirror Git-backed media metadata;
- exposing private Lab mutation APIs.

## Definition of done

The package is complete when:

1. `media.looksawful.ru` can be opened from another device without the workstation online;
2. unauthenticated clients cannot read Desk assets or private API data;
3. authenticated remote edits can only commit valid media/content changes to `content/text-cms`;
4. Gallery, project/pet/character covers, standalone pet/character page media and video posters appear in one inventory with usage provenance;
5. referenced assets cannot be deleted silently;
6. stale edits are rejected rather than overwriting newer branch/source state;
7. exact implementation head passes focused tests, Fast CI, CodeQL, Dependency Review, production build isolation, Cloudflare dry-run and remote browser verification before merge.
