import { rm, rmdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const labOutputRoot = path.resolve(root, path.join("dist-lab", "lab"));
const outputDir = path.join(labOutputRoot, "system");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const DEFAULT_PHASE_TIMEOUT_MS = 5 * 60 * 1000;

const packages = [
  "storybook@10.6.0",
  "@storybook/html-vite@10.6.0",
  "@storybook/addon-docs@10.6.0",
  "@storybook/addon-a11y@10.6.0",
  "axe-core@4.10.3",
  "storybook-design-token@5.0.0",
];

function resolvePhaseTimeoutMs() {
  const raw = process.env.LAB_STORYBOOK_PHASE_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_PHASE_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`LAB_STORYBOOK_PHASE_TIMEOUT_MS must be a positive number, got ${raw}`);
  }
  return Math.floor(parsed);
}

const phaseTimeoutMs = resolvePhaseTimeoutMs();

function terminateProcessTree(child, isWindows) {
  if (!child.pid) {
    child.kill("SIGKILL");
    child.unref();
    return;
  }

  if (isWindows) {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    killer.once("error", () => child.kill("SIGKILL"));
    killer.unref();
  } else {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }

  child.unref();
}

function run(phase, command, args) {
  const isWindows = process.platform === "win32";
  const executable = isWindows ? "cmd.exe" : command;
  const executableArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;
  const startedAt = Date.now();

  console.log(`[lab-storybook] phase=${phase} start timeout=${phaseTimeoutMs}ms`);

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const child = spawn(executable, executableArgs, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
      detached: !isWindows,
      windowsHide: true,
    });

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      callback();
    };

    child.once("error", (error) => {
      finish(() =>
        reject(
          new Error(`[lab-storybook] phase=${phase} failed to start: ${error.message}`, {
            cause: error,
          }),
        ),
      );
    });

    child.once("close", (code, signal) => {
      if (settled) return;

      if (code === 0) {
        finish(() => {
          console.log(`[lab-storybook] phase=${phase} done duration=${Date.now() - startedAt}ms`);
          resolve();
        });
        return;
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code ?? "unknown"}`;
      finish(() => reject(new Error(`[lab-storybook] phase=${phase} failed with ${reason}`)));
    });

    timer = setTimeout(() => {
      if (settled) return;
      const message = `[lab-storybook] phase=${phase} timed out after ${phaseTimeoutMs}ms`;
      console.error(message);
      terminateProcessTree(child, isWindows);
      finish(() => reject(new Error(message)));
    }, phaseTimeoutMs);
  });
}

await rm(outputDir, { recursive: true, force: true });

await run("install", npmCommand, [
  "install",
  "--no-save",
  "--package-lock=false",
  "--no-audit",
  "--no-fund",
  ...packages,
]);

await run("build", npmCommand, [
  "exec",
  "--no",
  "--",
  "storybook",
  "build",
  "--config-dir",
  "tools/lab/storybook",
  "--output-dir",
  outputDir,
  "--quiet",
]);

const generatedTokenDir = path.join(root, "tools", "lab", "public");
await rm(path.join(generatedTokenDir, "design-tokens.source.json"), { force: true });
await rmdir(generatedTokenDir).catch(() => {});

console.log(`[lab-storybook] built ${path.relative(root, outputDir).replaceAll("\\", "/")}`);
