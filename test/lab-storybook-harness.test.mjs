import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Storybook preview keeps canonical CSS and the three Lab review viewports", async () => {
  const preview = await read("tools/lab/storybook/preview.mjs");

  assert.match(preview, /src\/styles\/index\.css/);
  assert.match(preview, /viewport\s*:\s*\{[\s\S]*options\s*:/);
  assert.match(preview, /width:\s*"1440px"[\s\S]*height:\s*"1000px"/);
  assert.match(preview, /width:\s*"834px"[\s\S]*height:\s*"1112px"/);
  assert.match(preview, /width:\s*"390px"[\s\S]*height:\s*"844px"/);
});

test("Storybook a11y findings are blocking evidence instead of todo metadata", async () => {
  const preview = await read("tools/lab/storybook/preview.mjs");
  assert.match(preview, /a11y\s*:\s*\{[\s\S]*test\s*:\s*"error"/);
  assert.doesNotMatch(preview, /a11y\s*:\s*\{[\s\S]*test\s*:\s*"todo"/);
});

test("global experimental model-viewer CSS stays namespaced to the prototype stage", async () => {
  const css = await read("src/lab/model-viewer-controls-prototype.css");
  const selectors = css
    .split("{")
    .slice(0, -1)
    .map((chunk) => chunk.split("}").at(-1)?.trim())
    .filter((selector) => selector && !selector.startsWith("@"));

  assert.ok(selectors.length > 0);
  for (const selector of selectors) {
    assert.match(selector, /\.mv-stage\s/);
  }
});

test("Storybook launcher uses a fixed Windows command interpreter without shell mode", async () => {
  const buildScript = await read("tools/lab/build-storybook.mjs");

  assert.match(buildScript, /isWindows \? "cmd\.exe" : command/);
  assert.match(buildScript, /\["\/d",\s*"\/s",\s*"\/c",\s*command,\s*\.\.\.args\]/);
  assert.doesNotMatch(buildScript, /shell:\s*true|shell:\s*process\.platform/);
});


test("Storybook launcher bounds a stalled install phase and reports the phase", { skip: process.platform === "win32" }, async () => {
  const binDir = await mkdtemp(path.join(tmpdir(), "lab-storybook-timeout-"));
  const fakeNpm = path.join(binDir, "npm");
  await writeFile(
    fakeNpm,
    "#!/usr/bin/env node\nsetTimeout(() => process.exit(0), 300);\n",
    "utf8",
  );
  await chmod(fakeNpm, 0o755);

  const fixtureRoot = await mkdtemp(path.join(tmpdir(), "lab-storybook-fixture-"));
  const launcher = fileURLToPath(new URL("../tools/lab/build-storybook.mjs", import.meta.url));

  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [launcher], {
        cwd: fixtureRoot,
        env: {
          ...process.env,
          PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
          LAB_STORYBOOK_PHASE_TIMEOUT_MS: "75",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let output = "";
      child.stdout.on("data", (chunk) => {
        output += chunk;
      });
      child.stderr.on("data", (chunk) => {
        output += chunk;
      });
      child.on("error", reject);
      child.on("close", (code, signal) => resolve({ code, signal, output }));
    });

    assert.notEqual(result.code, 0, "stalled install must fail instead of continuing");
    assert.match(
      result.output,
      /\[lab-storybook\][^\n]*phase=install[^\n]*timed out[^\n]*75ms/i,
    );
  } finally {
    await Promise.all([
      rm(binDir, { recursive: true, force: true }),
      rm(fixtureRoot, { recursive: true, force: true }),
    ]);
  }
});
