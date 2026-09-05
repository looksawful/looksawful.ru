import { execFileSync } from "node:child_process";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import { captureComponents } from "./capture-components.mjs";
import { capturePages } from "./capture-pages.mjs";
import {
  COMPONENTS,
  OUTPUT_ROOT,
  PAGE_EXCLUSIONS,
  PAGE_VIEWPORTS,
} from "./config.mjs";
import { discoverPageRoutes } from "./discover-pages.mjs";
import {
  addWarning,
  createManifest,
  writeManifest,
} from "./manifest.mjs";
import { withDesignCaptureRuntime } from "./runtime.mjs";
import {
  assertManualCaptureAllowed,
  hasManualFlag,
  parseMode,
  requiresInteractiveConfirmation,
} from "./safety.mjs";

function timestampFolderName(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-").replace(/Z$/, "");
}

function gitValue(rootDir, args) {
  try {
    return execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function sourceInfo(rootDir) {
  return {
    branch: gitValue(rootDir, ["branch", "--show-current"]),
    commit: gitValue(rootDir, ["rev-parse", "HEAD"]),
    dirty: Boolean(gitValue(rootDir, ["status", "--porcelain"])),
  };
}

async function confirmRun(mode) {
  const rl = createInterface({ input, output });
  try {
    output.write("\nMANUAL DESIGN CAPTURE\n");
    output.write("This is a local design/documentation tool. It is not a test or CI task.\n");
    const answer = await rl.question(`Capture mode '${mode}' now? [y/N] `);
    return /^(y|yes)$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

export async function runDesignCapture(args = process.argv.slice(2)) {
  assertManualCaptureAllowed(process.env);
  const mode = parseMode(args);
  const manual = hasManualFlag(args);
  const needsConfirmation = requiresInteractiveConfirmation({
    manual,
    isTTY: Boolean(process.stdin.isTTY && process.stdout.isTTY),
  });

  if (needsConfirmation && !(await confirmRun(mode))) {
    console.log("[design-capture] cancelled; no files written");
    return null;
  }

  const rootDir = process.cwd();
  const outputDir = path.resolve(rootDir, OUTPUT_ROOT, timestampFolderName());
  const manifest = createManifest({
    mode,
    outputDir: path.relative(rootDir, outputDir).replaceAll("\\", "/"),
    source: sourceInfo(rootDir),
  });

  try {
    const pages = mode === "components"
      ? []
      : await discoverPageRoutes({ rootDir, exclusions: PAGE_EXCLUSIONS });

    await withDesignCaptureRuntime(async ({ browser, baseUrl }) => {
      if (mode === "all" || mode === "pages") {
        console.log(`[design-capture] discovered ${pages.length} pages`);
        await capturePages({
          browser,
          baseUrl,
          outputDir,
          manifest,
          pages,
          viewports: PAGE_VIEWPORTS,
        });
      }

      if (mode === "all" || mode === "components") {
        await captureComponents({
          browser,
          baseUrl,
          rootDir,
          outputDir,
          manifest,
          components: COMPONENTS,
        });
      }
    }, { rootDir });
  } catch (error) {
    addWarning(manifest, `fatal: ${error instanceof Error ? error.message : String(error)}`);
    await writeManifest(manifest, outputDir);
    throw error;
  }

  const manifestPath = await writeManifest(manifest, outputDir);
  console.log(`[design-capture] ${manifest.captures.length} captures`);
  console.log(`[design-capture] ${manifest.warnings.length} warnings`);
  console.log(`[design-capture] output: ${outputDir}`);
  console.log(`[design-capture] manifest: ${manifestPath}`);
  return { outputDir, manifestPath, manifest };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  runDesignCapture().catch((error) => {
    console.error(`[design-capture] ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
