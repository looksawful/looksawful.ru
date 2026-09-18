import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseInvocation(argv) {
  const separator = argv.indexOf("--");
  if (separator < 0 || separator === argv.length - 1) {
    throw new Error("usage: --temp-root <path> -- <command> [args...]");
  }
  const options = argv.slice(0, separator);
  let tempRoot;
  for (let index = 0; index < options.length; index += 2) {
    if (options[index] !== "--temp-root" || !options[index + 1]) {
      throw new Error(`invalid verification option: ${options[index] ?? "<end>"}`);
    }
    tempRoot = options[index + 1];
  }
  if (!tempRoot) throw new Error("missing --temp-root");
  return {
    tempRoot: path.resolve(tempRoot),
    command: argv[separator + 1],
    args: argv.slice(separator + 2),
  };
}

function verifyWritableTempRoot(tempRoot) {
  mkdirSync(tempRoot, { recursive: true });
  const probe = mkdtempSync(path.join(tempRoot, "preflight-"));
  rmSync(probe, { recursive: true, force: true });
}
export function runVerification(argv = process.argv.slice(2)) {
  const invocation = parseInvocation(argv);
  verifyWritableTempRoot(invocation.tempRoot);
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: "utf8",
    env: {
      ...process.env,
      TEMP: invocation.tempRoot,
      TMP: invocation.tempRoot,
      TMPDIR: invocation.tempRoot,
    },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  return result.status ?? 1;
}

try {
  process.exitCode = runVerification();
} catch (error) {
  console.error(`VERIFICATION_ERROR ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
