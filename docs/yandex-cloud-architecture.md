# Yandex Cloud integration architecture

Status: control-plane infrastructure bootstrapped in the dedicated `awful` folder. The existing public portfolio remains on GitHub Pages + Cloudflare.

## Goals

1. Add cloud capabilities without migrating the portfolio hosting.
2. Give ChatGPT/Codex/Yandex agents/Alice access through explicit tools instead of broad cloud-admin credentials.
3. Host a secure online CMS and Media Desk backend.
4. Store heavy media separately from Git and make it addressable by metadata.
5. Keep all service credentials out of browser code, Git and model-visible tool results.
6. Make destructive or privileged operations auditable and narrowly scoped.
7. Do not require the OpenAI API. ChatGPT conversations and Codex are clients of AWFUL tools, not model providers inside the backend.

## Target topology

```text
looksawful.ru
  -> GitHub Pages + Cloudflare                         (unchanged)

Codex
  -> Yandex AI Studio MCP Gateway                     (direct during development)
  -> AWFUL tool actions
  -> private Serverless Container / Yandex services

ChatGPT
  -> mcp.looksawful.ru                                (future OAuth/mTLS facade)
  -> Yandex AI Studio MCP Gateway
  -> AWFUL tool actions

studio.looksawful.ru
  -> future authenticated CMS UI

media.looksawful.ru
  -> future authenticated Media Desk UI

api.looksawful.ru
  -> future browser/API Gateway facade where needed
```

The target subdomains are architectural names only. This branch does not change Cloudflare DNS.

## Bootstrapped Yandex resources

The following resources already exist in folder `awful` and their non-secret IDs are recorded in `cloud/awful-control-plane/yandex.resources.json`:

- service account `awful-runtime`;
- service account `awful-deployer`;
- Container Registry `awful`;
- Serverless Container `awful-control-plane`;
- Lockbox secret metadata `awful-control-plane`;
- GitHub Workload Identity Federation `awful-github`;
- federated credential limited to `looksawful/looksawful.ru` branch `dev`.

The GitHub deployer uses OIDC/WIF. Do not create or store a permanent Yandex service-account JSON key in GitHub.

## Runtime secret

The control plane currently needs only the Yandex AI Studio credential:

- Lockbox entry `yandex-ai-api-key` -> runtime variable `YANDEX_AI_API_KEY`.

The Yandex API key is scoped to `yc.ai.languageModels.execute`.

There is no OpenAI API key in this architecture.

Never put secret values in `.env.example`, GitHub issues, pull requests, browser storage, tool responses or chat messages.

## Yandex AI routing

The control plane exposes an internal Yandex-only route:

`POST /v1/ai/responses`

Request shape:

```json
{
  "model": "optional model URI",
  "input": "Responses API input",
  "instructions": "optional",
  "tools": []
}
```

The backend sends the request to the OpenAI-compatible Yandex AI Studio endpoint `https://ai.api.cloud.yandex.net/v1/responses`. A typical model URI is `gpt://<folder-id>/yandexgpt/latest`.

ChatGPT and Codex do not call this route in order to become GPT model providers. They connect to AWFUL as MCP clients using their own ChatGPT/Codex product sessions.

## MCP architecture decision

Do not implement the MCP transport inside `awful-control-plane` unless the managed gateway proves insufficient.

Use Yandex AI Studio MCP Gateway as the MCP protocol layer. It natively supports Streamable HTTP and can expose tools whose actions call Serverless Containers, functions, HTTP endpoints, other MCP servers, gRPC endpoints or Workflows.

```text
Codex --------------------------+
                                |
ChatGPT -> auth facade ---------+--> AWFUL MCP Gateway
                                      |
                                      +--> containerCall -> awful-control-plane
                                      +--> httpCall
                                      +--> mcpCall
                                      +--> startWorkflow
```

Why this boundary is deliberate:

- OpenAI requires production MCP servers to support Streamable HTTP at a stable HTTPS endpoint and preserve authentication/authorization boundaries.
- Yandex Serverless Containers removes incoming `Authorization` before passing requests to the application, so a custom MCP bearer/OAuth implementation mounted directly inside the container would not receive the original authorization header.
- Yandex MCP Gateway already implements the MCP transport and has its own invocation access model, logs and metrics.
- The control plane can remain ordinary HTTP business logic instead of reimplementing protocol transport, sessions and compatibility behavior.

## Codex authentication path

During development, Codex can connect directly to the Yandex MCP Gateway using Streamable HTTP.

Yandex supports API-key authentication for MCP Gateway invocation with scope:

`yc.serverless.mcpGateways.invoke`

Codex supports HTTP MCP servers with static headers, environment-backed headers and helper-generated headers. The caller API key must therefore live in a local environment variable or secure helper, never in `.codex/config.toml` as a literal secret.

Target shape:

```toml
[mcp_servers.awful]
url = "https://<managed-mcp-domain>/mcp"
env_http_headers = { Authorization = "AWFUL_MCP_AUTH" }
default_tools_approval_mode = "writes"
```

`AWFUL_MCP_AUTH` contains `Api-Key <secret>` in the local environment. This caller credential is separate from the Yandex AI key used by the backend.

## ChatGPT authentication path

Do not make a private AWFUL MCP Gateway unauthenticated merely to connect ChatGPT.

For ChatGPT, the production target is a stable public HTTPS MCP facade at `mcp.looksawful.ru` which preserves the private managed gateway behind it and implements the authentication method supported by the ChatGPT plugin/app connection. OpenAI production guidance currently calls for OAuth 2.1 when user authentication is required and supports OpenAI-managed mTLS for authenticating ChatGPT as the MCP client.

This facade is deliberately deferred until the first managed MCP tools work end to end. Authentication is a boundary, not a decorative checkbox to add after publishing private storage tools.

## Access model

Do not grant ChatGPT, Codex, Alice or an MCP caller general cloud administrator credentials.

Expose narrow tools instead.

### Safe read tools

- `awful_status`
- `media_search`
- `media_get`
- `storage_list`
- `storage_stat`
- `cms_get_project`
- `tracker_search`
- `logs_search`
- `metrics_query`
- `backup_status`

### Scoped write tools

- `media_tag`
- `media_move`
- `cms_create_draft`
- `cms_update_project`
- `tracker_create_issue`
- `tracker_update_issue`
- `video_submit`
- `render_submit`

### Confirmation-required tools

- `cms_publish`
- `storage_archive`
- `deploy_promote`
- `backup_request_restore`

### Never expose as general agent tools

- raw Lockbox payload enumeration;
- unrestricted IAM role assignment;
- cloud/folder deletion;
- arbitrary shell on production infrastructure;
- unrestricted object/bucket deletion;
- unrestricted database administration.

Tool metadata must truthfully mark read-only, destructive and open-world behavior. The server/gateway policy remains authoritative even when a model or client marks an action as approved.

## Media Desk migration rule

The existing Media Desk is local and its launcher explicitly enables write mode. It must not be published directly to the internet.

Migration order:

1. split UI from filesystem write operations;
2. add authenticated server-side media API;
3. move heavy binaries to Object Storage;
4. keep metadata/relationships in a database;
5. issue short-lived upload/download URLs instead of proxying large files through an AI agent;
6. add user/session authorization;
7. only then expose `media.looksawful.ru`.

## Deployment and trust boundaries

`awful-control-plane` stays private. GitHub Actions deploys revisions through the dedicated `awful-deployer` service account using Workload Identity Federation.

Future Yandex MCP Gateway should use its own service account and receive only the ability to invoke the specific AWFUL backend resources required by its tool actions. It must not reuse `awful-deployer`.

The managed MCP caller credential is also separate from runtime AI credentials:

```text
Codex caller key
  scope: yc.serverless.mcpGateways.invoke
  -> invokes MCP Gateway only

MCP Gateway service account
  -> invokes approved private backend resources

awful-runtime
  -> runtime access needed by the container

Yandex AI API key
  scope: yc.ai.languageModels.execute
  -> AI Studio only

awful-deployer
  -> deployment only via GitHub OIDC
```

## Provisioning order from current state

1. Re-run the idempotent `configure-secrets.ps1` to inspect the existing Yandex AI key / Lockbox state without reading secret values.
2. If the current Lockbox already contains the required Yandex AI key, make no credential changes.
3. If an earlier API key exists but its value was never persisted in Lockbox, rotate it once with `-RotateYandexApiKey`; write the replacement to Lockbox before deleting the old managed key.
4. Merge the staging PR into `dev` only after credential state is healthy.
5. Let GitHub Actions build/push the image and deploy the first private Serverless Container revision through OIDC/WIF.
6. Verify container health and Yandex AI end to end.
7. Create a dedicated MCP Gateway service account with only the required invocation permissions.
8. Create the managed `awful` MCP Gateway with Streamable HTTP and logging.
9. Add the first read-only `awful_status` tool and test it through MCP Inspector / Codex.
10. Create a dedicated MCP caller service account + API key scoped only to `yc.serverless.mcpGateways.invoke` for Codex development.
11. Add Object Storage and metadata persistence before any media-write tools.
12. Add the ChatGPT OAuth/mTLS MCP facade only after the managed gateway tool contract is stable.
13. Add CMS/Media Desk, Tracker, Video, Vision, Translate, Speech and Yandex 360 tools only for concrete workflows.
14. Add GPU jobs only after queue, cancellation and cost controls exist.

## Current safety boundary

The branch does not:

- touch `prod`;
- change GitHub Pages deployment;
- change Cloudflare DNS;
- expose the local Media Desk;
- contain API-key values;
- use the OpenAI API;
- make the Serverless Container public;
- make the future MCP Gateway public without authentication;
- grant agents or MCP callers broad IAM permissions.
