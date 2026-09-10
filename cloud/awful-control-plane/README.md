# AWFUL Control Plane

Server-side integration layer for looksawful.ru and AWFUL tools.

The public portfolio stays on GitHub Pages/Cloudflare. This service is intended to run separately in Yandex Serverless Containers and become the controlled API/MCP boundary for AI providers, CMS/Media Desk, storage and automation.

## Current status

Implemented in v0.1.0:

- public `GET /healthz` health check;
- public `GET /readyz` readiness check without exposing secret values;
- authenticated `GET /v1/capabilities`;
- authenticated `POST /v1/ai/responses`;
- OpenAI Responses API upstream;
- Yandex AI Studio OpenAI-compatible Responses API upstream;
- constant-time comparison for the internal bearer token;
- 1 MiB request-body limit;
- upstream timeout;
- explicit CORS allowlist;
- Docker image running as the unprivileged `node` user.

Not implemented yet:

- remote MCP endpoint;
- Object Storage adapter;
- remote Media Desk write backend;
- CMS API;
- user/session authentication for browser access;
- Tracker, Cloud Video, Vision, Translate, SpeechKit and observability adapters.

Those are intentionally not faked before the actual Yandex Cloud resource IDs, service accounts and authorization model exist.

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

## AI request

```bash
curl -X POST http://127.0.0.1:8080/v1/ai/responses \
  -H "Authorization: Bearer dev-only-token" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "yandex",
    "input": "Ping"
  }'
```

The model may be supplied in the request or configured with `YANDEX_AI_MODEL` / `OPENAI_MODEL`.

## Secrets

Production secret values belong in Yandex Lockbox and must be injected into the Serverless Container revision. The service expects:

- `AWFUL_INTERNAL_TOKEN`;
- `OPENAI_API_KEY`;
- `YANDEX_AI_API_KEY`.

The application must not receive permission to enumerate unrelated secrets. The runtime service account should receive `lockbox.payloadViewer` only for the secrets required by this container.

## Browser access

`AWFUL_INTERNAL_TOKEN` is a server-to-server credential. It must never be shipped to looksawful.ru JavaScript or stored in the browser.

Before CMS or Media Desk is exposed over the internet, add real user/session authentication and a scoped authorization layer. The existing local Media Desk starts with write mode enabled, so publishing it directly as-is is explicitly forbidden.

## Planned topology

```text
looksawful.ru (GitHub Pages + Cloudflare)
        |
        | HTTPS
        v
api.looksawful.ru
        |
        v
AWFUL Control Plane (Yandex Serverless Containers)
        |
        +-- OpenAI
        +-- Yandex AI Studio
        +-- AWFUL MCP
        +-- Object Storage
        +-- CMS / Media Desk backend
        +-- Tracker / Video / Vision / Translate / Speech
        +-- logs / audit / backup status
```

See `docs/yandex-cloud-architecture.md` for the resource and access plan.

## Official references

- Yandex AI Studio OpenAI-compatible API: https://yandex.cloud/en/docs/tutorials/ml-ai/ai-model-ide-integration
- Serverless Containers: https://yandex.cloud/en/docs/serverless-containers/
- Lockbox secrets in Serverless Containers: https://yandex.cloud/en/docs/lockbox/operations/serverless/containers
