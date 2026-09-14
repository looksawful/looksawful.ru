# AWFUL Control Plane

Server-side integration layer for looksawful.ru and AWFUL tools.

The public portfolio stays on GitHub Pages/Cloudflare. This service runs separately in Yandex Serverless Containers and becomes the controlled API/MCP boundary for CMS, Media Desk, storage, Yandex AI and automation.

ChatGPT conversations and Codex are external clients of AWFUL through MCP/apps. This project does not require or use the OpenAI API.

## Current status

Implemented:

- public `GET /healthz` health check;
- public `GET /readyz` readiness check without exposing secret values;
- authenticated `GET /v1/capabilities`;
- authenticated `POST /v1/ai/responses` for Yandex AI Studio;
- constant-time comparison for the internal bearer token;
- 1 MiB request-body limit;
- upstream timeout;
- explicit CORS allowlist;
- Docker image running as the unprivileged `node` user;
- Windows bootstrap for Yandex Cloud resources and GitHub OIDC federation;
- local Yandex-only secret provisioning that writes directly to Lockbox without committing or printing payloads;
- GitHub Actions deployment path using Workload Identity Federation instead of a permanent Yandex service-account key.

Not implemented yet:

- remote MCP endpoint;
- ChatGPT custom app/plugin connection;
- Codex MCP connection;
- Object Storage adapter;
- remote Media Desk write backend;
- CMS API;
- user/session authentication for browser access;
- Tracker, Cloud Video, Vision, Translate, SpeechKit and observability adapters.

## Architecture

```text
ChatGPT conversations ----\
                          \
Codex ---------------------> AWFUL MCP / Control Plane
                             |
                             +-- Yandex AI Studio
                             +-- Object Storage
                             +-- CMS / Media Desk
                             +-- GitHub / Tracker
                             +-- Video / Vision / Translate / Speech

looksawful.ru remains on GitHub Pages + Cloudflare.
```

ChatGPT and Codex do not need an OpenAI API key to act as clients. Their ability to call a custom MCP app depends on the capabilities enabled for the user's ChatGPT/Codex product and plan. The server itself never receives the user's ChatGPT subscription credentials.

## Local check

```bash
cd cloud/awful-control-plane
npm run check
AWFUL_INTERNAL_TOKEN=dev-only-token npm start
```

Then:

```bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/readyz
curl -H "Authorization: Bearer dev-only-token" http://127.0.0.1:8080/v1/capabilities
```

Do not commit a real internal token or provider API key.

## Yandex Cloud bootstrap on Windows

After installing the current `yc` CLI and running `yc init`, execute from the repository root:

```powershell
pwsh -File .\cloud\awful-control-plane\scripts\bootstrap-yandex.ps1
```

The script creates or reuses:

- service account `awful-runtime`;
- service account `awful-deployer`;
- Container Registry `awful`;
- Serverless Container `awful-control-plane`;
- Lockbox secret metadata `awful-control-plane`;
- Workload Identity Federation `awful-github`;
- GitHub federated credential restricted to `looksawful/looksawful.ru` and the `dev` branch;
- minimal runtime/deploy roles required by the current architecture.

It does not write secret payloads.

## Runtime secrets

After bootstrap, create the Yandex runtime secrets locally:

```powershell
pwsh -File .\cloud\awful-control-plane\scripts\configure-secrets.ps1
```

This script:

- creates a Yandex AI Studio API key restricted to `yc.ai.languageModels.execute`;
- generates the internal AWFUL server-to-server token locally;
- sends both values to Yandex Lockbox over stdin;
- never writes the secret values to Git or prints them.

It does not ask for or create an OpenAI API key.

Do not rerun secret provisioning casually. Yandex API key secret values are only returned at creation time. Use `-RotateYandexApiKey` only for an intentional rotation.

## Yandex AI request

```bash
curl -X POST http://127.0.0.1:8080/v1/ai/responses \
  -H "Authorization: Bearer dev-only-token" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Ping"
  }'
```

The model may be supplied in the request or configured with `YANDEX_AI_MODEL`.

## Secrets

Production secret values belong in Yandex Lockbox and must be injected into the Serverless Container revision. The service currently expects:

- `AWFUL_INTERNAL_TOKEN`;
- `YANDEX_AI_API_KEY`.

The runtime service account should receive `lockbox.payloadViewer` only for the secret required by this container.

`AWFUL_INTERNAL_TOKEN` is a server-to-server credential. It must never be shipped to looksawful.ru JavaScript or stored in a browser.

Before CMS or Media Desk is exposed over the internet, add real user/session authentication and scoped authorization. The existing local Media Desk starts with write mode enabled, so publishing it directly as-is is explicitly forbidden.

## Next stages

1. Provision the Lockbox runtime secrets.
2. Merge the staging PR into `dev` after CI is green.
3. Let GitHub Actions build/push the image and deploy the first Serverless Container revision via OIDC/WIF.
4. Add API Gateway and HTTPS endpoint.
5. Implement the remote AWFUL MCP server.
6. Connect Codex to AWFUL MCP.
7. Package the MCP tools as a ChatGPT app/plugin to the extent supported by the current ChatGPT plan.
8. Add Object Storage, Media Desk backend and CMS.
