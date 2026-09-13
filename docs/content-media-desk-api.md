# Local Content / Media Desk HTTP contract

Status: INTEGRATION CANDIDATE / `feature/media-base-integration`.

This document describes the revision-aware local Desk contract implemented on the current integration candidate. Branch and publication authority remains fixed and separate:

- `dev` = default working/integration branch;
- `prod` = production/release/deploy branch;
- `content/text-cms` = permanent editorial authoring branch;
- editorial publication = `content/text-cms -> explicit READY/готово -> dev -> separate reviewed dev -> prod`.

Executable authority for the write contract is `src/devtools/media-desk/server.ts`, `src/devtools/media-desk/transaction-store.ts`, `tools/content-desk-policy.mjs`, `tools/cms-authoring-topology.mjs`, the existing canonical Media Catalog parsers/editor ownership model and their tests. The local Desk contract does not grant publication authority and must not be exposed as an unauthenticated remote admin API.

## Launch and registration gate

Ordinary inspection is read-only:

```text
npm run desk
```

It no longer runs `media:ensure`, does not enable mutation routes, and binds the local Vite server to loopback.

Explicit local write mode is separate:

```text
npm run desk:write
```

Write mode is accepted only when all of the following are true:

- current branch is exactly `content/text-cms`;
- execution is not CI / GitHub Actions;
- the caller does not override the fixed loopback host;
- `CONTENT_DESK_WRITE=1` is supplied only by the guarded launcher path.

The server-side write plugin registers its mutation endpoints only when:

```text
CONTENT_DESK_WRITE=1
```

`dev`, `prod`, arbitrary feature/fix branches and remote host overrides fail closed at the launcher policy. Network authentication, if added around a private Lab surface, does not grant Desk write authority.

## Revision model

A revision is the lowercase SHA-256 digest of the exact UTF-8 source bytes read from disk.

Rules:

- reads expose the revision belonging to the exact source version shown to the editor;
- every mutation requires `expectedRevision` as a 64-character lowercase SHA-256 value;
- missing or malformed `expectedRevision` is a `400` request error;
- if current source bytes no longer match `expectedRevision`, the mutation fails with `409` and the newer source is preserved untouched;
- the Media Desk client captures media revisions when assets enter the editing selection/session and does not fetch a fresh revision immediately before save;
- after a successful save, the client advances its cached revision only from the revision returned by the server;
- conflict handling never silently merges arbitrary authored changes.

## Global request rules

- JSON request-body limit: `128 KiB` (`131072` bytes).
- Empty body is rejected.
- Invalid JSON is rejected.
- Unsupported methods return `405` with `{ "ok": false, "error": "Method not allowed" }`.
- Stale revision conflicts return `409`.
- Other request/parser/persistence errors currently return `400`, except text-load failures on `GET /__media-desk/texts`, which return `500`.
- Error strings are implementation diagnostics, not a versioned public error taxonomy.

## `GET /__media-desk/texts`

Returns the current Content Desk text entries. Every entry carries the revision of its complete source file.

Example:

```json
{
  "ok": true,
  "entries": [
    {
      "sourcePath": "src/content/navigation.json",
      "fieldPath": "title",
      "value": "...",
      "revision": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }
  ]
}
```

- success: `200`;
- internal load failure: `500`;
- methods other than `GET` or `POST` on this path: `405`.

The editable text set is still derived from the existing Content Desk ownership/discovery contract. A string is not made editable merely because it exists somewhere in the repository.

## `POST /__media-desk/texts`

Request body:

```json
{
  "sourcePath": "src/content/navigation.json",
  "fieldPath": "title",
  "value": "replacement text",
  "expectedRevision": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

Validation and persistence:

- only the four documented top-level fields are accepted;
- `sourcePath + fieldPath` must still be an editable text entry;
- the target leaf must still exist and be a string;
- the complete in-memory candidate is rechecked through the existing Content Desk entry contract before persistence;
- the exact source revision must match `expectedRevision` immediately before replacement;
- candidate JSON is serialized with two-space indentation and one trailing newline;
- persistence uses a same-directory temporary file and replacement through the transactional store.

Success:

```json
{
  "ok": true,
  "entry": {
    "sourcePath": "src/content/navigation.json",
    "fieldPath": "title",
    "value": "replacement text",
    "revision": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
  }
}
```

- success: `200`;
- stale revision: `409`;
- invalid request/non-editable field/parser or persistence error: `400`;
- unsupported method: `405`.

## `GET /__media-desk/metadata?id=<media-record-id>`

Returns the exact revision of the canonical media-record source bytes used for optimistic concurrency.

Success:

```json
{
  "ok": true,
  "id": "media-record-id",
  "revision": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

- success: `200`;
- invalid or missing asset id / missing record: `400`;
- unsupported method on the metadata route: `405`.

## `POST /__media-desk/metadata`

Request body:

```json
{
  "id": "media-record-id",
  "expectedRevision": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "metadata": {}
}
```

Validation and persistence:

- `id` must match the existing safe asset-id contract;
- `metadata` must be an object, not an array;
- only the documented top-level fields are accepted;
- ordinary editorial ownership remains defined by the existing editor model; protected identity/technical fields cannot be smuggled into the patch;
- the current record identity must match its canonical target;
- the complete resulting registered/upload record must pass its existing canonical Media Catalog parser before persistence;
- invalid candidates never reach the canonical file;
- the current exact revision is checked during preparation and rechecked immediately before replacement;
- serialization is stable two-space JSON plus a trailing newline.

Success:

```json
{
  "ok": true,
  "record": {},
  "revision": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
}
```

- success: `200`;
- stale revision: `409`;
- invalid request/protected field/missing record/identity/parser or persistence failure: `400`;
- unsupported method: `405`.

## `POST /__media-desk/metadata/bulk`

Request body is an array of versioned media writes:

```json
[
  {
    "id": "media-record-id-1",
    "expectedRevision": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "metadata": {}
  },
  {
    "id": "media-record-id-2",
    "expectedRevision": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    "metadata": {}
  }
]
```

Constraints and exact guarantee:

- minimum items: `1`;
- maximum items: `100`;
- IDs and final filesystem paths must be unique within the transaction;
- every candidate record and every expected revision is validated before the first final replacement;
- all next-source bytes are staged to unique same-directory temporary files before final replacement begins;
- immediately before each final replacement, that source revision is rechecked;
- the original file is moved to a unique backup, then the staged candidate is moved into the canonical path;
- if a later item fails, already replaced items are restored in reverse order from their captured backups;
- injected mid-bulk failure is covered by a permanent regression test proving that previously replaced files return byte-for-byte to their original contents;
- if both the write and a rollback operation fail, the service raises an aggregate failure instead of pretending the transaction succeeded.

This is a tested rollback-backed all-or-nothing guarantee under the service failure model. It is not described as a true multi-file filesystem transaction.

Success:

```json
{
  "ok": true,
  "records": [],
  "revisions": [
    {
      "id": "media-record-id-1",
      "revision": "..."
    }
  ]
}
```

- success: `200`;
- stale revision in any item: `409`;
- invalid request/duplicate/protected field/parser or persistence failure: `400`;
- unsupported method: `405`.

## Single-file replacement guarantee

For one source, the transactional store:

1. verifies the current exact revision;
2. writes complete candidate bytes to a unique temporary file in the canonical file's directory;
3. runs the final pre-replacement revision check;
4. replaces the canonical path through the platform filesystem rename primitive;
5. removes leftover staging data on failure or completion.

A candidate is fully serialized and validated before the canonical path is replaced. A stale source cannot pass the final revision check silently.

## Authoring topology guard

`tools/cms-authoring-topology.mjs` is a read-only policy/provenance helper. It reports:

- current branch/worktree/HEAD;
- fresh `dev` SHA;
- dirty state;
- ahead/behind and divergence against `dev`;
- whether current checkout is the permanent `content/text-cms` authoring branch;
- whether explicit READY/`готово` is present;
- whether the candidate diff is CMS/content/media-only or contains engineering/unknown paths.

It never rebases, resets, merges, commits or pushes. Diverged authoring and `dev` histories fail closed with `reconciliation-required`.

## Integrated operator flow

```text
ordinary Desk browse
  -> READ ONLY
  -> no hidden media sync
  -> loopback only

explicit authorized write session
  -> npm run desk:write
  -> content/text-cms only
  -> capture source revision
  -> edit
  -> canonical validation
  -> expectedRevision check
  -> transactional replacement / rollback-backed bulk write
  -> explicit user READY / "готово"
  -> topology + scope verification
  -> deliberate reconciliation into fresh dev
  -> exact dev verification
  -> separate reviewed dev -> prod release
```

The Desk does not merge branches, deploy `prod`, expose mutation endpoints through the private Lab, or replace Git-backed authored sources with another database.
