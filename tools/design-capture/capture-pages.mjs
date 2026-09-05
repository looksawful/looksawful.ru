import { mkdir } from "node:fs/promises";
import path from "node:path";

import { addCapture } from "./manifest.mjs";
import { pageCapturePath, safeOutputPath } from "./paths.mjs";
import { openDesignPage } from "./runtime.mjs";

async function captureOne({ browser, baseUrl, outputDir, manifest, pageSpec, viewport }) {
  const { context, page } = await openDesignPage({
    browser,
    baseUrl,
    route: pageSpec.route,
    viewport,
  });

  try {
    for (const kind of ["viewport", "full-page"]) {
      const relativePath = pageCapturePath({
        viewport: viewport.name,
        route: pageSpec.route,
        kind,
      });
      const absolutePath = safeOutputPath(outputDir, relativePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await page.screenshot({
        path: absolutePath,
        fullPage: kind === "full-page",
        animations: "disabled",
        caret: "hide",
      });
      addCapture(manifest, {
        type: "page",
        kind,
        route: pageSpec.route,
        sourcePath: pageSpec.sourcePath,
        viewport: {
          name: viewport.name,
          width: viewport.width,
          height: viewport.height,
        },
        file: relativePath.replaceAll("\\", "/"),
      });
    }
  } finally {
    await context.close();
  }
}

export async function capturePages({
  browser,
  baseUrl,
  outputDir,
  manifest,
  pages,
  viewports,
}) {
  for (const viewport of viewports) {
    for (const pageSpec of pages) {
      console.log(`[design-capture] page ${viewport.name} ${pageSpec.route}`);
      await captureOne({
        browser,
        baseUrl,
        outputDir,
        manifest,
        pageSpec,
        viewport,
      });
    }
  }
}
