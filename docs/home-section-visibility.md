# Homepage section visibility

## Client logo wall

The Homepage client logo wall is controlled by the canonical authored visibility source:

```text
src/content/visibility/home.json
```

Stable code-owned section ID:

```text
client-logo-wall
```

The only editorial state is:

```json
{ "id": "client-logo-wall", "visible": false }
```

- `visible: false` removes the complete client section from generated Homepage markup, including the `Клиенты` heading, logo reel wrapper and infinite-reel runtime hooks.
- `visible: true` restores the existing section without restoring code or media.
- Individual logo visibility remains independently controlled by `src/content/client-logo-visibility.json`.
- Client/logo definitions, media files, ordering and per-logo visibility are not mutated by the whole-section switch.

The Home visibility source is explicitly allowlisted by the CMS publication classifier. Pages CMS UI exposure is a separate presentation/configuration concern; it must point at this canonical boolean source rather than introduce another visibility state.

The current removal seam lives at the final Homepage render boundary because `index.html` still owns legacy Home composition. Issue #251 should absorb the same visibility decision into the canonical Home renderer when that migration lands, then retire the structural extraction seam without changing the content contract.
