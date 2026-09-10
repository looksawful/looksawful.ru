const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function envFlag(value) {
  return typeof value === "string" && TRUE_VALUES.has(value.trim().toLowerCase());
}

export function assertManualCaptureAllowed(env = process.env) {
  if (envFlag(env.GITHUB_ACTIONS)) {
    throw new Error("Design capture is local-only and refuses to run in GitHub Actions.");
  }
  if (envFlag(env.CI)) {
    throw new Error("Design capture is manual-only and refuses to run in CI.");
  }
}

export function hasManualFlag(args = process.argv.slice(2)) {
  return args.includes("--manual");
}

export function requiresInteractiveConfirmation({ manual, isTTY }) {
  if (manual) return false;
  if (!isTTY) {
    throw new Error(
      "Design capture requires an interactive confirmation. An explicitly instructed agent must pass --manual.",
    );
  }
  return true;
}

export function parseMode(args = process.argv.slice(2)) {
  const modeArg = args.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.slice("--mode=".length) : "all";
  if (!new Set(["all", "pages", "components"]).has(mode)) {
    throw new Error(`Invalid design-capture mode: ${mode}`);
  }
  return mode;
}
