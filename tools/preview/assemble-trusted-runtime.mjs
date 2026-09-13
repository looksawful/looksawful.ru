import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { validatePreviewArtifact } from "./validate-candidate-artifact.mjs";

export async function assembleTrustedPreviewRuntime({
  distDir,
  workspaceDir,
  trustedRuntimeDir,
} = {}) {
  if (!distDir) throw new Error("distDir is required");
  if (!workspaceDir) throw new Error("workspaceDir is required");
  if (!trustedRuntimeDir) throw new Error("trustedRuntimeDir is required");

  await validatePreviewArtifact({ distDir });

  const workspace = path.resolve(workspaceDir);
  const siteDir = path.join(workspace, "site");
  const functionsDir = path.join(workspace, "functions");
  const trustedFunctionsDir = path.resolve(trustedRuntimeDir, "functions");

  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  await cp(path.resolve(distDir), siteDir, { recursive: true, force: false, errorOnExist: true });
  await cp(trustedFunctionsDir, functionsDir, { recursive: true, force: false, errorOnExist: true });

  const routes = { version: 1, include: ["/*"], exclude: [] };
  await writeFile(path.join(siteDir, "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

  return { workspaceDir: workspace, siteDir, functionsDir };
}
