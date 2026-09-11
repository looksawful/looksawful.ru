# Local Content / Media Desk HTTP contract

Status: CURRENT IMPLEMENTATION / TRANSITIONAL.

This document describes the local Desk HTTP contract implemented on `dev` at the time of reconciliation. It is not a promise that the current write model is the final safe architecture. GitHub #452 and #453 own read-only-by-default launch, guarded write activation, source authorization, stale-write/concurrency and atomic-persistence hardening.

Executable authority remains `src/devtools/media-desk/server.ts` plus its tests. If this document conflicts with executable code, fix the documentation or contract deliberately rather than treating prose as stronger evidence.

## Registration gate

The write plugin registers these endpoints only when:

```text
CONTENT_DESK_WRITE=1
```

`npm run desk` currently enables that flag through the Desk launcher. It also runs `media:ensure` before opening the Desk, so the ordinary Desk command is not a side-effect-free read-only inspection mode.

No authentication or authorization mechanism beyond this local write-mode gate is defined by `src/devtools/media-desk/server.ts`. Do not expose the current write interface as a network-admin API merely because the endpoints exist.

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

Request body has exactly these top-level fields:

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

The request does not contain an expected revision/hash/ETag. Current Desk text saves therefore do not provide optimistic-concurrency protection against another editor/worktree changing the same source after it was read. #453 owns the target revision/conflict contract.

## `POST /__media-desk/metadata`

Request body has exactly:

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
- prepared files are then written sequentially.

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

Prevalidation prevents an invalid later item from starting the write phase, but sequential multi-file persistence is not a filesystem transaction. A later filesystem failure after an earlier successful write does not have a documented rollback guarantee. #453 owns the target atomic/rollback semantics.

## CURRENT vs TARGET

CURRENT:

```text
npm run desk
  -> media:ensure may synchronize derived media state
  -> write mode enabled
  -> local Vite Desk
  -> current JSON write endpoints
```

TARGET under #451/#452/#453:

```text
fresh dev
  -> temporary content/* authoring branch/worktree
  -> read-only Desk by default
  -> explicit guarded write mode
  -> explicit source authorization + canonical validation
  -> revision-aware conflict handling
  -> atomic/rollback-safe persistence
  -> reviewed integration into dev
  -> existing trusted dev -> prod publication boundary
```

The TARGET diagram is planning state, not current behavior.
