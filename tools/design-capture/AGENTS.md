# Agent rules for `tools/design-capture`

This directory is a manual development/design utility.

- Do not run it unless the user explicitly asks for screenshots, design capture, breakpoint capture, or equivalent design-documentation work.
- Do not add it to CI, GitHub Actions, normal test commands, verification commands, build scripts, deploy scripts, hooks, or scheduled automation.
- Do not import it from `src/` or other client/runtime code.
- Do not move generated screenshots into tracked repository paths.
- Keep all generated output under `_local/design-capture/`.
- For non-interactive explicit agent runs, use `--manual`; this flag is not permission to automate future runs.
- If the task is only code validation, do not invoke screenshot capture. Use `npm run design:capture:selfcheck` only when validating this tool itself.
