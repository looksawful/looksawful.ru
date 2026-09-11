import path from "node:path";
import { fileURLToPath } from "node:url";

const TEMPORARY_CONTENT_BRANCH = /^content\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const PERMANENT_LEGACY_BRANCH = "content/text-cms";

export function validateCmsAuthoringBranch(branch) {
  const value = typeof branch === "string" ? branch : "";

  if (!value) {
    return { valid: false, branch: value, reason: "missing authoring branch" };
  }

  if (value === PERMANENT_LEGACY_BRANCH) {
    return {
      valid: false,
      branch: value,
      reason: "permanent content/text-cms is retired; use a temporary content/* branch from fresh prod",
    };
  }

  if (!TEMPORARY_CONTENT_BRANCH.test(value)) {
    return {
      valid: false,
      branch: value,
      reason: "CMS publication source must be a temporary content/* branch",
    };
  }

  return { valid: true, branch: value };
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const branch = argumentValue(process.argv.slice(2), "--branch") ?? "";
  const result = validateCmsAuthoringBranch(branch);
  console.log(JSON.stringify(result));
  if (!result.valid) {
    console.error(`[cms-authoring-source] ${result.reason}`);
    process.exitCode = 1;
  }
}
