import { rm } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputDir = path.join(root, "dist", "lab", "system");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const packages = [
  "storybook@10.6.0",
  "@storybook/html-vite@10.6.0",
  "@storybook/addon-docs@10.6.0",
  "@storybook/addon-a11y@10.6.0",
  "storybook-design-token@5.0.0",
];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
}

await rm(outputDir, { recursive: true, force: true });

run(npmCommand, [
  "install",
  "--no-save",
  "--package-lock=false",
  "--no-audit",
  "--no-fund",
  ...packages,
]);

run(npmCommand, [
  "exec",
  "--no",
  "--",
  "storybook",
  "build",
  "--config-dir",
  "tools/lab/storybook",
  "--output-dir",
  "dist/lab/system",
  "--quiet",
]);

console.log("[lab-storybook] built dist/lab/system");
