# Local Content / Media Desk HTTP contract

Status: CURRENT IMPLEMENTATION.

This document describes the local Desk contract integrated by the Media Base Foundation candidate. Executable authority lives in `tools/run-content-desk.mjs`, `tools/content-desk-policy.mjs`, `tools/cms-authoring-topology.mjs`, `src/devtools/media-desk/server.ts`, `src/devtools/media-desk/transaction-store.ts`, `src/devtools/media-desk/revision-client.ts` and their tests.

Canonical branch authority:

```text
dev = working / integration / PR base
prod = release / production / deploy only
content/text-cms = permanent editorial authoring branch
```

Editorial publication remains:

```text
content/text-cms
  -> explicit user READY / "готово"
  -> deliberate reconciliation + validation
  -> dev
  -> exact dev verification
  -> separate reviewed dev -> prod release
```

## Launch modes

### Read-only mode

```text
npm run desk
```

Ordinary Desk launch is the safe inspection path:

- no `media:ensure`, `media:sync` or other mutable media synchronization runs on startup;
- Vite binds to `127.0.0.1`;
- `CONTENT_DESK_WRITE=0` and `VITE_CONTENT_DESK_WRITE=0`;
- mutation middleware is not registered;
- the UI visibly reports `READ ONLY` with branch / HEAD / dirty / dev-divergence provenance where available.

Read-only provenance inspection is best-effort and must not silently enable writes when Git metadata is unavailable.

### Explicit write mode

```text
npm run desk:write
```

Write mode is a separate explicit launcher. It fails closed unless all repository-owned guards pass:

- CI and GitHub Actions are rejected;
- current checkout must be exactly `content/text-cms`;
- `dev`, `prod`, feature/fix and unintended branches are rejected;
- host is fixed to `127.0.0.1`;
- user `--host` overrides are rejected;
- the launcher and UI visibly report `WRITE` plus repository provenance.

Passing the local write guard is not publication authority and does not bypass the READY / reconciliation / dev verification flow above.

## Registration gate

The write plugin registers its HTTP endpoints only when:

```text
CONTENT_DESK_WRITE=1
```

The guarded `npm run desk:write` launcher is the intended local path that enables this flag. Ordinary `npm run desk` explicitly disables it.

The local Desk server has no network authentication layer. Do not expose it as a remote admin API. The separate protected Lab shell is read-only; authenticating to that shell does not grant CMS write authority.

## Global request rules

- JSON request-body limit: `128 KiB` (`131072` bytes).
- Empty body is rejected.
- Invalid JSON is rejected.
- Unsupported HTTP methods return `405` with `{ "ok": false, "error": "Method not allowed" }`.
- Mutation requests require a lowercase SHA-256 `expectedRevision` (`64` hex characters).
- A stale expected revision raises a revision conflict and returns `409`.
- Other request / validation / persistence errors return `400` unless a GET loader explicitly reports `500`.

## `GET /__media-desk/texts`

Returns the currently editable text entries. Each entry includes the exact revision of its source file.

Success:

```json
{
  "ok": true,
  "entries": [
    {
      "sourcePath": "src/content/navigation.json",
      "fieldPath": "title",
      "value": "...",
      "revision": "<sha256>"
    }
  ]
}
```

- success: `200`;
- load failure: `500`;
- methods other than `GET` / `POST`: `405`.

The existence of an arbitrary repository string does not make it editable. The loader-defined source/field inventory is the authorization boundary for local text editing.

## `POST /__media-desk/texts`

Request body has exactly:

```json
{
  "sourcePath": "src/content/...json",
  "fieldPath": "path.to.string",
  "value": "replacement text",
  "expectedRevision": "<sha256>"
}
```

Validation and concurrency rules:

- `sourcePath` must be a non-empty string;
- `fieldPath` and `value` must be strings;
- `expectedRevision` must be a lowercase SHA-256 revision;
- unexpected top-level fields are rejected;
- `sourcePath + fieldPath` must still be in the editable text inventory;
- the field must still exist and still be a string;
- the current source revision must equal `expectedRevision` before replacement;
- candidate content is re-enumerated before persistence;
- stale revision returns `409` and preserves newer bytes.

Success:

```json
{
  "ok": true,
  "entry": {
    "sourcePath": "...",
    "fieldPath": "...",
    "value": "...",
    "revision": "<new-sha256>"
  }
}
```

Single-file persistence writes the next source to a unique temporary file, rechecks the current revision immediately before replacement, and atomically renames the prepared file over the target. The returned revision describes the newly persisted canonical source.

## `GET /__media-desk/metadata?id=<asset-id>`

Returns the exact revision of the existing media catalog source record.

Success:

```json
{
  "ok": true,
  "id": "media-record-id",
  "revision": "<sha256>"
}
```

- invalid / missing id or missing record: `400`;
- unsupported method: `405`.

The Desk client uses these revisions as optimistic-concurrency tokens and caches them for selected assets.

## `POST /__media-desk/metadata`

Request body has exactly:

```json
{
  "id": "media-record-id",
  "expectedRevision": "<sha256>",
  "metadata": {}
}
```

Validation and concurrency rules:

- `id` must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`;
- `expectedRevision` must be a lowercase SHA-256 revision;
- `metadata` must be an object, not an array;
- unexpected top-level fields are rejected;
- the catalog record must already exist and retain its identity;
- the current source revision must equal `expectedRevision`;
- the resulting registered/upload record must pass its canonical Media Catalog parser before persistence;
- protected technical/identity fields remain outside ordinary editorial metadata ownership;
- stale revision returns `409` and does not overwrite newer bytes.

Success:

```json
{
  "ok": true,
  "record": {},
  "revision": "<new-sha256>"
}
```

Persistence uses the same revision-checked temporary-file + rename transaction as text saves.

## `POST /__media-desk/metadata/bulk`

Request body is an array of versioned media mutations:

```json
[
  {
    "id": "media-record-id",
    "expectedRevision": "<sha256>",
    "metadata": {}
  }
]
```

Constraints and transaction semantics:

- minimum items: `1`;
- maximum items: `100`;
- IDs must be unique within the request;
- every `expectedRevision` is required and validated;
- every target is loaded, revision-checked, patched and parser-validated before the write phase;
- duplicate transactional paths are rejected;
- all current revisions are checked before staging replacements;
- every next source is written to a unique temporary file;
- each target revision is checked again immediately before replacement;
- original files are moved to backups during the transaction;
- if any later replacement fails, already replaced files are restored from backups in reverse order;
- temporary and backup files are cleaned up after success or rollback;
- a revision conflict returns `409` and does not begin a partial bulk write.

Success:

```json
{
  "ok": true,
  "records": [],
  "revisions": [
    {
      "id": "media-record-id",
      "revision": "<new-sha256>"
    }
  ]
}
```

The rollback guarantee is repository-local filesystem transaction behavior. It is not a claim of cross-machine or remote distributed transactionality.

## Protected Lab boundary

The repository also contains an isolated non-production Lab build. Its current boundary is intentionally narrower than the local writable Desk:

- separate `vite.lab.config.ts` / `dist-lab` artifact;
- fail-closed authentication when `LAB_PASSWORD` is absent;
- authenticated responses use private/no-store and noindex/noarchive security headers;
- the Lab client reports exact build provenance and `READ ONLY` mode;
- the Lab shell contains no remote Desk mutation transport;
- public production Vite output does not include the Lab entry.

Authentication to the Lab is only access control for the read-only shell. It does not authorize edits to `content/text-cms`, `dev` or `prod`.

## Current safety contract

```text
npm run desk
  -> local inspection only
  -> loopback
  -> READ ONLY
  -> no mutation endpoints

npm run desk:write
  -> reject CI/GitHub Actions
  -> require exact content/text-cms
  -> reject host override
  -> loopback
  -> WRITE provenance visible
  -> versioned text/media mutations
  -> stale writes rejected with 409
  -> atomic single-file replacement
  -> rollback-safe bulk replacement

protected Lab
  -> separate non-production artifact
  -> fail-closed password boundary
  -> READ ONLY
  -> no remote CMS mutation path
```

Remote managed write access, if introduced later, must preserve the same canonical authoring branch, READY gate, source authorization, revision checks and publication boundary rather than inventing a second canonical database or writing directly to `dev` / `prod`.
