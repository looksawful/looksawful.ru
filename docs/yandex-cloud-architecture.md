# Yandex Cloud integration architecture

Status: initial control-plane scaffold. The existing public portfolio remains on GitHub Pages + Cloudflare.

## Goals

1. Add cloud capabilities without migrating the portfolio hosting.
2. Give ChatGPT/Codex/Yandex agents/Alice access through explicit tools instead of broad cloud-admin credentials.
3. Host a secure online CMS and Media Desk backend.
4. Store heavy media separately from Git and make it addressable by metadata.
5. Keep all provider keys and service credentials out of browser code and Git.
6. Make every destructive or privileged operation auditable and narrowly scoped.

## Target domains

- `looksawful.ru` - existing public portfolio, unchanged.
- `api.looksawful.ru` - API Gateway / AWFUL Control Plane entrypoint.
- `studio.looksawful.ru` - future authenticated CMS UI.
- `media.looksawful.ru` - future authenticated Media Desk UI.

The last three domains are targets, not DNS changes performed by this branch.

## Initial Yandex Cloud resources

Create these first in one dedicated folder:

- service account: `awful-runtime`;
- Container Registry: `awful`;
- Serverless Container: `awful-control-plane`;
- Lockbox secret: `awful-control-plane`;
- Object Storage bucket: globally unique name chosen during provisioning;
- API Gateway: `awful-api` after the container is healthy;
- Audit Trails / observability destination before write-capable agent tools are enabled.

PostgreSQL, Cloud Video, Tracker, Vision, Translate, SpeechKit, AI Search and GPU resources are phase-two resources. Do not provision everything merely because the console contains a button for it.

## Secret keys

The `awful-control-plane` Lockbox secret is expected to contain separate key/value items:

- `awful-internal-token`;
- `openai-api-key`;
- `yandex-ai-api-key`.

Map them to runtime variables:

- `AWFUL_INTERNAL_TOKEN`;
- `OPENAI_API_KEY`;
- `YANDEX_AI_API_KEY`.

Never put these values in `.env.example`, GitHub issues, pull requests, browser storage or chat messages.

## AI routing

The control plane exposes one internal route:

`POST /v1/ai/responses`

Request shape:

```json
{
  "provider": "openai | yandex",
  "model": "optional model id/uri",
  "input": "Responses API input",
  "instructions": "optional",
  "tools": []
}
```

OpenAI goes to `https://api.openai.com/v1/responses`.

Yandex goes to the OpenAI-compatible AI Studio base URL `https://ai.api.cloud.yandex.net/v1` and uses the same Responses API concept. A typical Yandex model URI is `gpt://<folder-id>/yandexgpt/latest`.

## Access model

Do not grant ChatGPT, Codex, Alice or an MCP server a general-purpose cloud administrator credential.

Expose narrow tools instead:

### Safe read tools

- `media.search`
- `media.get`
- `storage.list`
- `storage.stat`
- `cms.get_project`
- `tracker.search`
- `logs.search`
- `metrics.query`
- `backup.status`

### Scoped write tools

- `media.tag`
- `media.move`
- `cms.create_draft`
- `cms.update_project`
- `tracker.create_issue`
- `tracker.update_issue`
- `video.submit`
- `render.submit`

### Confirmation-required tools

- `cms.publish`
- `storage.archive`
- `deploy.promote`
- `backup.request_restore`

### Never expose as general agent tools

- raw Lockbox payload enumeration;
- unrestricted IAM role assignment;
- cloud/folder deletion;
- arbitrary shell on production infrastructure;
- unrestricted object/bucket deletion;
- unrestricted database administration.

## Media Desk migration rule

The existing Media Desk is local and its launcher explicitly enables write mode. Therefore it must not be published directly to the internet.

Migration order:

1. split UI from filesystem write operations;
2. add authenticated server-side media API;
3. move heavy binaries to Object Storage;
4. keep metadata/relationships in a database;
5. issue short-lived upload/download URLs instead of proxying large files through an AI agent;
6. add user/session authorization;
7. only then expose `media.looksawful.ru`.

## MCP plan

`AWFUL MCP` will sit on top of the control-plane service layer. It is an adapter, not the authority itself.

```text
ChatGPT / Codex / Yandex Agent / Alice
                 |
             AWFUL MCP
                 |
        AWFUL Control Plane
                 |
  IAM-scoped Yandex Cloud services
```

The backend performs authorization and policy checks even if the MCP client is trusted.

## Provisioning order

1. Dedicated cloud folder and billing.
2. Runtime service account.
3. Lockbox secret and minimal secret access.
4. Container Registry.
5. Build and deploy `awful-control-plane`.
6. Verify `/healthz` and `/readyz`.
7. Add Yandex AI Studio key and test provider `yandex`.
8. Add OpenAI API key and test provider `openai`.
9. Add API Gateway and `api.looksawful.ru`.
10. Add Object Storage.
11. Build the authenticated CMS/Media Desk API.
12. Add AWFUL MCP.
13. Add Tracker/Video/Vision/Translate/Speech/360 adapters only when a concrete workflow needs them.
14. Add GPU jobs only after queue, cost limits and cancellation controls exist.

## Current branch safety boundary

This branch does not:

- touch `prod`;
- change GitHub Pages deployment;
- change Cloudflare DNS;
- expose the local Media Desk;
- add real API keys;
- provision paid Yandex Cloud resources;
- create broad IAM permissions.
