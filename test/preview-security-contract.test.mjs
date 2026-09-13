import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validatePreviewArtifact } from "../tools/preview/validate-candidate-artifact.mjs";
import { assembleTrustedPreviewRuntime } from "../tools/preview/assemble-trusted-runtime.mjs";

async function makeDist() {
  const root = await mkdtemp(path.join(os.tmpdir(), "preview-v2-security-"));
  const distDir = path.join(root, "dist");
  await mkdir(distDir, { recursive: true });
  await writeFile(path.join(distDir, "index.html"), "<!doctype html><title>candidate</title>\n", "utf8");
  return { root, distDir };
}

test("candidate artifact rejects runtime takeover files", async () => {
  for (const relativePath of ["_worker.js", "_routes.json", "functions/auth.js"]) {
    const { distDir } = await makeDist();
    const absolute = path.join(distDir, relativePath);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, "candidate runtime takeover\n", "utf8");

    await assert.rejects(
      validatePreviewArtifact({ distDir }),
      new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("candidate artifact rejects symlinks", async (t) => {
  if (process.platform === "win32") {
    t.skip("symlink creation is not reliable without privileges on Windows");
    return;
  }

  const { root, distDir } = await makeDist();
  const outside = path.join(root, "outside.txt");
  await writeFile(outside, "outside\n", "utf8");
  await symlink(outside, path.join(distDir, "escape.txt"));

  await assert.rejects(validatePreviewArtifact({ distDir }), /symlink/i);
});

test("trusted runtime owns Pages Functions and catch-all route policy", async () => {
  const { root, distDir } = await makeDist();
  const workspaceDir = path.join(root, "workspace");
  const trustedRuntimeDir = path.join(root, "trusted-runtime");
  await mkdir(path.join(trustedRuntimeDir, "functions"), { recursive: true });
  await writeFile(
    path.join(trustedRuntimeDir, "functions", "_middleware.js"),
    "export const onRequest = () => new Response('trusted');\n",
    "utf8",
  );

  const result = await assembleTrustedPreviewRuntime({ distDir, workspaceDir, trustedRuntimeDir });

  assert.equal(result.siteDir, path.join(workspaceDir, "site"));
  assert.equal(result.functionsDir, path.join(workspaceDir, "functions"));
  assert.match(await readFile(path.join(result.functionsDir, "_middleware.js"), "utf8"), /trusted/);

  const routes = JSON.parse(await readFile(path.join(result.siteDir, "_routes.json"), "utf8"));
  assert.deepEqual(routes, { version: 1, include: ["/*"], exclude: [] });
});
