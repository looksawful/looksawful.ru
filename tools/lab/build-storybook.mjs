import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputDir = path.resolve(root, "dist-storybook");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  const isWindows = process.platform === "win32";
  const executable = isWindows ? "cmd.exe" : command;
  const executableArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;
  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed: ${result.status ?? "unknown"}`);
}

await rm(outputDir, { recursive: true, force: true });
run(npmCommand, [
  "exec", "--no", "--", "storybook", "build",
  "--config-dir", "tools/lab/storybook", "--output-dir", outputDir, "--quiet",
]);

const { entries } = JSON.parse(await readFile(path.join(outputDir, "index.json"), "utf8"));
const count = Object.keys(entries).length;
if (!count) throw new Error("Storybook catalog is empty");
console.log(`[storybook] curated catalog: ${count} index entries`);
