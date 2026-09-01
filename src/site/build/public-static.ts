import path from "node:path";

import type { PublicStaticPageBuild } from "../pages/types.ts";

interface PublicStaticPageLike {
  readonly build: PublicStaticPageBuild;
}

function publicStaticRelativePath(page: PublicStaticPageLike): string {
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

export function publicStaticRequestPath(page: PublicStaticPageLike): string {
  return `/${publicStaticRelativePath(page)}`;
}

export function publicStaticOutputPath(
  page: PublicStaticPageLike,
  root = process.cwd(),
): string {
  return path.resolve(root, "dist", publicStaticRelativePath(page));
}
