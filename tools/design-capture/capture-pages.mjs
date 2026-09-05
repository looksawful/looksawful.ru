import { mkdir } from "node:fs/promises";
import path from "node:path";

import { addCapture, addWarning } from "./manifest.mjs";
import { pageCapturePath, safeOutputPath } from "./paths.mjs";
import { openDesignPage, SCREENSHOT_TIMEOUT_MS } from "./runtime.mjs";

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

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

      console.log(`[design-capture]   ${kind} start`);
      try {
        await page.screenshot({
          path: absolutePath,
          fullPage: kind === "full-page",
          animations: "disabled",
          caret: "hide",
          timeout: SCREENSHOT_TIMEOUT_MS,
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
        console.log(`[design-capture]   ${kind} saved`);
      } catch (error) {
        const message = `${viewport.name} ${pageSpec.route} ${kind}: ${errorMessage(error)}`;
        addWarning(manifest, message);
        console.warn(`[design-capture]   warning: ${message}`);
      }
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
      try {
        await captureOne({
          browser,
          baseUrl,
          outputDir,
          manifest,
          pageSpec,
          viewport,
        });
      } catch (error) {
        const message = `${viewport.name} ${pageSpec.route}: ${errorMessage(error)}`;
        addWarning(manifest, message);
        console.warn(`[design-capture] warning: ${message}`);
      }
    }
  }
}
