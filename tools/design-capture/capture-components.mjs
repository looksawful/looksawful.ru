import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  COMPONENT_VIEWPORT_HEIGHT,
  MAX_COMPONENT_WIDTH,
  MIN_COMPONENT_WIDTH,
} from "./config.mjs";
import {
  breakpointSides,
  extractResponsiveBreakpoints,
  mergeBreakpoints,
} from "./discover-breakpoints.mjs";
import { addCapture, addWarning } from "./manifest.mjs";
import { componentCapturePath, safeOutputPath } from "./paths.mjs";
import {
  openDesignPage,
  SCREENSHOT_TIMEOUT_MS,
  settleDesignPage,
} from "./runtime.mjs";

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function discoveredBreakpoints(rootDir, component, manifest) {
  const groups = [];
  for (const relativePath of component.stylesheetHints ?? []) {
    const absolutePath = path.resolve(rootDir, relativePath);
    try {
      const css = await readFile(absolutePath, "utf8");
      groups.push(extractResponsiveBreakpoints(css, {
        selectorHints: component.selectorHints ?? [component.selector],
      }));
    } catch (error) {
      addWarning(
        manifest,
        `${component.name}: could not read stylesheet hint ${relativePath}: ${errorMessage(error)}`,
      );
    }
  }
  return mergeBreakpoints(...groups);
}

function clampWidth(width) {
  return Math.max(MIN_COMPONENT_WIDTH, Math.min(MAX_COMPONENT_WIDTH, width));
}

async function captureComponentSide({
  browser,
  baseUrl,
  rootDir,
  outputDir,
  manifest,
  component,
  breakpoint,
  side,
}) {
  const rawWidth = side === "before" ? breakpointSides(breakpoint)[0] : breakpointSides(breakpoint)[1];
  const width = clampWidth(rawWidth);
  const viewport = { width, height: component.viewportHeight ?? COMPONENT_VIEWPORT_HEIGHT };
  const { context, page } = await openDesignPage({
    browser,
    baseUrl,
    route: component.route,
    viewport,
  });

  try {
    if (typeof component.prepare === "function") {
      await component.prepare(page, { breakpoint, side, width });
      await settleDesignPage(page);
    }

    const locator = page.locator(component.selector);
    const count = await locator.count();
    if (count === 0) {
      const message = `${component.name}: no matches for ${component.selector} at ${component.route}`;
      if (component.optional) {
        addWarning(manifest, message);
        return;
      }
      throw new Error(message);
    }

    for (let index = 0; index < count; index += 1) {
      const instance = index + 1;
      const relativePath = componentCapturePath({
        component: component.name,
        breakpoint,
        instance,
        side,
      });
      const absolutePath = safeOutputPath(outputDir, relativePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      const target = locator.nth(index);
      if (!(await target.isVisible())) {
        addWarning(manifest, `${component.name} instance ${instance} is hidden at ${width}px; skipped`);
        continue;
      }

      console.log(`[design-capture]   instance ${instance} screenshot start`);
      try {
        await target.screenshot({
          path: absolutePath,
          animations: "disabled",
          caret: "hide",
          timeout: SCREENSHOT_TIMEOUT_MS,
        });
        addCapture(manifest, {
          type: "component",
          component: component.name,
          route: component.route,
          selector: component.selector,
          instance,
          breakpoint,
          side,
          viewport: { width, height: viewport.height },
          file: relativePath.replaceAll("\\", "/"),
        });
        console.log(`[design-capture]   instance ${instance} saved`);
      } catch (error) {
        const message = `${component.name} ${breakpoint}px ${side} instance ${instance}: ${errorMessage(error)}`;
        addWarning(manifest, message);
        console.warn(`[design-capture]   warning: ${message}`);
      }
    }
  } finally {
    await context.close();
  }
}

export async function captureComponents({
  browser,
  baseUrl,
  rootDir,
  outputDir,
  manifest,
  components,
}) {
  for (const component of components) {
    const automatic = await discoveredBreakpoints(rootDir, component, manifest);
    const breakpoints = mergeBreakpoints(component.breakpoints ?? [], automatic)
      .filter((value) => value >= MIN_COMPONENT_WIDTH && value <= MAX_COMPONENT_WIDTH);

    if (breakpoints.length === 0) {
      addWarning(manifest, `${component.name}: no responsive breakpoints found; skipped`);
      continue;
    }

    for (const breakpoint of breakpoints) {
      for (const side of ["before", "after"]) {
        console.log(`[design-capture] component ${component.name} ${breakpoint}px ${side}`);
        try {
          await captureComponentSide({
            browser,
            baseUrl,
            rootDir,
            outputDir,
            manifest,
            component,
            breakpoint,
            side,
          });
        } catch (error) {
          const message = `${component.name} ${breakpoint}px ${side}: ${errorMessage(error)}`;
          addWarning(manifest, message);
          console.warn(`[design-capture] warning: ${message}`);
        }
      }
    }
  }
}
