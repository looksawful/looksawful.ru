import { rm, rmdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const publicOnly = process.argv.includes("--public");
if (publicOnly) process.env.PUBLIC_STORYBOOK = "1";
const labOutputRoot = path.resolve(root, path.join("dist-lab", "lab"));
const outputDir = publicOnly
  ? path.resolve(root, "dist-storybook")
  : path.join(labOutputRoot, "system");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const packages = [
  "storybook@10.6.0",
  "@storybook/html-vite@10.6.0",
  "@storybook/addon-docs@10.6.0",
  "@storybook/addon-a11y@10.6.0",
  "axe-core@4.10.3",
];

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
  outputDir,
  "--quiet",
]);

if (publicOnly) {
  // Public visibility is an allowlist, not a filtered copy of the private Lab.
  const { entries } = JSON.parse(await readFile(path.join(outputDir, "index.json"), "utf8"));
  const approved = new Set([
    "00-foundations-design-tokens--docs",
    "00-foundations-design-tokens--palette",
    "00-foundations-design-tokens--typography",
    "00-foundations-design-tokens--spacing-and-layout",
    "00-foundations-design-tokens--shape-and-elevation",
    "00-foundations-design-tokens--motion-and-layers",
    "00-foundations-css-patterns--docs",
    "00-foundations-css-patterns--layout-primitives",
    "01-atoms-divider--docs",
    "01-atoms-divider--divider",
  ]);
  const actual = Object.keys(entries);
  if (actual.length !== approved.size || actual.some((id) => !approved.has(id))) {
    throw new Error("Public Storybook contains unapproved or missing stories: " + actual.join(", "));
  }
  console.log("[public-storybook] approved stories only: " + actual.length + " index entries");
}

const generatedTokenDir = path.join(root, "tools", "lab", "public");
await rm(path.join(generatedTokenDir, "design-tokens.source.json"), { force: true });
await rmdir(generatedTokenDir).catch(() => {});

console.log(`[lab-storybook] built ${path.relative(root, outputDir).replaceAll("\\", "/")}`);
