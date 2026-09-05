import path from "node:path";
import { pathToFileURL } from "node:url";

import { getPageByPath } from "../pages/manifest.ts";
import { cvSearchPresentation } from "../pages/search-presentation.ts";
import { replacePageMetadata } from "../shell/metadata.ts";

interface CvContentModule {
  readCvContent(contentPath: string): Promise<unknown>;
  transformCvContent(html: string, content: unknown): { readonly html: string };
}

async function loadCvContentModule(root: string): Promise<CvContentModule> {
  const moduleUrl = pathToFileURL(path.resolve(root, "tools/lib/cv-content.mjs")).href;
  return await import(/* @vite-ignore */ moduleUrl) as CvContentModule;
}

function getCvPage() {
  const page = getPageByPath("/cv/");
  if (!page || page.renderer !== "cv") {
    throw new Error("CV route is unavailable");
  }
  return page;
}

export async function renderCvDevHtml(html: string, root = process.cwd()): Promise<string> {
  const contentLib = await loadCvContentModule(root);
  const content = await contentLib.readCvContent(path.resolve(root, "src/content/cv.json"));
  const rendered = contentLib.transformCvContent(html, content).html;
  return replacePageMetadata(rendered, {
    page: getCvPage(),
    ...cvSearchPresentation,
  });
}
