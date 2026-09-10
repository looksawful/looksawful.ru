# Yandex control bridge

This repository exposes a narrow owner-only GitHub Issues bridge for Yandex Webmaster operations that are safe to report on a public repository.

## Runtime configuration

Repository Actions configuration is expected to provide:

- secret `YANDEX_OAUTH_TOKEN`;
- variable `YANDEX_METRIKA_COUNTER_ID`.

Never copy the secret value into repository files, issues, pull requests, Actions variables, logs, artifacts, or chat.

## Command transport

Only an issue opened by the repository owner and titled with the exact prefix `[yandex-control] ` can reach the secret-bearing job. The issue body is a JSON object. The workflow checks out the exact default-branch SHA with persisted Git credentials disabled and gives the control job only `contents: read` and `issues: write`.

Supported public commands:

- `[yandex-control] webmaster-status` with `{}`;
- `[yandex-control] webmaster-recrawl` with `{"url":"https://www.looksawful.ru/"}`;
- `[yandex-control] webmaster-recrawl-status` with `{}`;
- `[yandex-control] metrika-access-check` with `{}`.

The recrawl action accepts only HTTPS URLs on `www.looksawful.ru`. There is no shell command action, arbitrary provider URL, repository dispatch input, or workflow-dispatch secret surface.

## Public reporting boundary

`looksawful.ru` is a public repository. The workflow therefore publishes only information that is already public or low-sensitivity operational status about the public site: verification state, Webmaster data status, diagnostic problem codes, recrawl quota, public URLs, recrawl state, and whether the configured Metrika counter is reachable.

Raw Yandex responses, OAuth data, user IDs, host IDs, owner login, internal recrawl task IDs, and Metrika traffic numbers are not published.

`tools/yandex-control.mjs` contains `metrika-summary` and `metrika-goals` implementations for reuse only through a private result channel with `YANDEX_CONTROL_PRIVATE_OUTPUT=1`. The public workflow cannot invoke those actions successfully.

## ChatGPT operation

An authenticated GitHub client can create one of the allowlisted command issues, wait for `Yandex Control`, and read the sanitized issue comment. Successful command issues are closed automatically; failed commands stay open for diagnosis.

This bridge does not require GPT Work, Codex, a custom MCP server, Yandex Webmaster Pro, or Yandex Cloud. It uses ordinary GitHub Actions plus the provider OAuth/API boundary.
