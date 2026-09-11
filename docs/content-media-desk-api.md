# Local Content / Media Desk HTTP contract

Status: CURRENT IMPLEMENTATION / TRANSITIONAL.

This document describes the local Desk HTTP contract implemented on the current #452 candidate. Executable authority remains `tools/run-content-desk.mjs`, `tools/content-desk-policy.mjs`, `src/devtools/media-desk/server.ts` and their tests. #451 owns authoring reconciliation/integration topology; #453 owns source authorization, revision/concurrency and atomic persistence hardening.

## Launch modes

### Read-only mode

```text
npm run desk
```

Ordinary Desk launch is now the safe inspection path:

- it does not run `media:ensure`, `media:sync` or another mutable media synchronization command on startup;
- it binds Vite to `127.0.0.1`;
- it sets `CONTENT_DESK_WRITE=0` and `VITE_CONTENT_DESK_WRITE=0`;
- therefore the write plugin in `src/devtools/media-desk/server.ts` does not register mutation endpoints;
- opening/browsing the Desk itself is not an authorization to mutate canonical content/media files;
- the operator UI shows `READ ONLY` plus current branch, HEAD, dirty state and divergence information when available.

Read-only startup attempts to display repository provenance but does not fail just because Git provenance cannot be read. It must remain useful as an inspection surface without silently enabling writes.

### Explicit write mode

```text
npm run desk:write
```

Write mode is a separate explicit launcher path. Before Vite starts with write flags, the launcher fails closed unless all repository-owned guards pass:

- CI and GitHub Actions are rejected;
- the current checkout must be exactly the permanent `content/text-cms` authoring branch;
- direct write mode on `dev`, `prod`, feature/fix branches or another checkout is rejected;
- the host is fixed to `127.0.0.1`;
- user-supplied `--host` / `--host=...` overrides are rejected;
- mode/provenance are printed by the launcher and surfaced in the operator UI as `WRITE`.

Passing these local guards is not publication authority. Approved authored work still follows the project contract:

```text
content/text-cms
  -> explicit user READY / "готово"
  -> deliberate reconciliation and validation
  -> dev
  -> exact dev verification
  -> separate reviewed dev -> prod release
```

Remote authentication or a future private Lab does not bypass this branch/write policy.

## Registration gate

The write plugin registers its HTTP endpoints only when:

```text
CONTENT_DESK_WRITE=1
```

The guarded `npm run desk:write` launcher is the intended local way to set that flag. Ordinary `npm run desk` explicitly sets it to `0`.

No network authentication mechanism is defined by `src/devtools/media-desk/server.ts`. The current write interface is local operator tooling and must not be exposed as a network-admin API merely because the endpoints exist.

## Global request rules

- JSON request-body limit: `128 KiB` (`131072` bytes).
- Empty body is rejected.
- Invalid JSON is rejected.
- Unsupported HTTP methods return `405` with `{ "ok": false, "error": "Method not allowed" }`.
- Error strings come from the current server/parser/persistence boundary and should not be treated as a stable public API taxonomy unless deliberately versioned later.

## `GET /__media-desk/texts`

Returns the text entries currently exposed by the Content Desk loader.

Success:

```json
{
  "ok": true,
  "entries": []
}
```

- success: `200`;
- internal load failure: `500` with `{ "ok": false, "error": "..." }`;
- methods other than `GET` or `POST` on this path: `405`.

The existence of a string in the repository does not by itself make it a safe long-term editable contract. Current text discovery/authorization is being hardened under #453.

## `POST /__media-desk/texts`

Request body currently has exactly these top-level fields:

```json
{
  "sourcePath": "src/content/...json",
  "fieldPath": "path.to.string",
  "value": "replacement text"
}
```

Current validation:

- `sourcePath` must be a non-empty string;
- `fieldPath` must be a string;
- `value` must be a string;
- unexpected top-level fields are rejected;
- `sourcePath + fieldPath` must still be one of the text entries enumerated by the loader;
- the referenced field must still exist and still be a string when the save is performed.

Success:

```json
{
  "ok": true,
  "entry": {
    "sourcePath": "...",
    "fieldPath": "...",
    "value": "..."
  }
}
```

- success: `200`;
- invalid body, non-editable path, stale/missing/non-string field or persistence/validation failure: `400`;
- unsupported method: `405`.

### Known current limitation

The request does not yet contain an expected revision/hash/ETag in the #452 candidate. Optimistic-concurrency protection is owned by #453 and must not be inferred from the launcher safety work.

## `POST /__media-desk/metadata`

Request body currently has exactly:

```json
{
  "id": "media-record-id",
  "metadata": {}
}
```

Current validation:

- `id` must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`;
- `metadata` must be an object, not an array;
- unexpected top-level fields are rejected;
- the media catalog record must already exist;
- record identity must match;
- the resulting registered/upload record must pass its canonical Media Catalog parser before persistence;
- protected technical/identity fields remain outside ordinary editorial metadata ownership.

Success:

```json
{
  "ok": true,
  "record": {}
}
```

- success: `200`;
- invalid request, missing record, identity mismatch, invalid resulting record or persistence failure: `400`;
- unsupported method: `405`.

## `POST /__media-desk/metadata/bulk`

Request body is an array of the same `{ id, metadata }` objects.

Current constraints:

- minimum items: `1`;
- maximum items: `100`;
- IDs must be unique within the request;
- all candidate records are prepared and parser-validated before the write phase;
- prepared files are then written sequentially in the current #452 baseline.

Success:

```json
{
  "ok": true,
  "records": []
}
```

- success: `200`;
- invalid request, duplicate IDs, validation/preparation or persistence failure: `400`;
- unsupported method: `405`.

### Known current limitation

Prevalidation prevents an invalid later item from starting the write phase, but sequential multi-file persistence is not a filesystem transaction. #453 owns the revision-aware atomic/rollback-safe persistence contract.

## CURRENT vs remaining hardening

CURRENT #452 candidate behavior:

```text
npm run desk
  -> no mutable media startup
  -> loopback-only Vite
  -> READ ONLY
  -> no Desk write plugin endpoints

npm run desk:write
  -> reject CI/GitHub Actions
  -> require exact content/text-cms checkout
  -> reject host override
  -> loopback-only Vite
  -> visible WRITE + repository provenance
  -> current local JSON write endpoints
```

Remaining OPEN hardening is deliberately separate:

```text
#451: permanent content/text-cms provenance/reconciliation + READY gate
#453: explicit editable-source authorization + expected revision/conflicts
      + atomic single-file persistence + bulk rollback/all-or-nothing guarantee
```

Do not describe #453 guarantees as CURRENT until its exact implementation/tests land. Do not expose the local write server remotely; a private Lab/network boundary is a separate concern and does not grant write authorization.
