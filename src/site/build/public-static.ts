import path from "node:path";

import type { SitePageBuild } from "../pages/types.ts";

interface SitePageBuildLike {
  readonly build: SitePageBuild;
}

function publicStaticRelativePath(page: SitePageBuildLike): string {
  if (page.build.kind !== "public-static") {
    throw new Error("SitePage build must be public-static");
  }

  const sourcePath = page.build.sourcePath.replaceAll("\\", "/").replace(/^\.\//, "");
  const prefix = "public/";

  if (!sourcePath.startsWith(prefix) || sourcePath.length === prefix.length) {
    throw new Error(`Public-static SitePage source must live under public/: ${page.build.sourcePath}`);
  }

  const relativePath = sourcePath.slice(prefix.length);
  if (relativePath.split("/").includes("..")) {
    throw new Error(`Public-static SitePage source must stay inside public/: ${page.build.sourcePath}`);
  }

  return relativePath;
}

export function publicStaticRequestPath(page: SitePageBuildLike): string {
  return `/${publicStaticRelativePath(page)}`;
}

export function publicStaticOutputPath(
  page: SitePageBuildLike,
  root = process.cwd(),
): string {
  return path.resolve(root, "dist", publicStaticRelativePath(page));
}
