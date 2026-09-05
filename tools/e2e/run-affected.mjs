import { scopeFromGit } from "../ci/change-scope.mjs";
import { runSmokeCv } from "../smoke-cv.mjs";
import { runSmokeMpa } from "../smoke-mpa.mjs";
import { runSmokeNavigation } from "../smoke-site-navigation.mjs";
import { runSmokeSite } from "../smoke-site.mjs";
import { mapWithConcurrency } from "./concurrency.mjs";
import { runAllSmokeSuites } from "./run-all.mjs";
import { runQuickSmoke } from "./run-smoke.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";
import { runSmokeProjectPages } from "./smoke-project-pages.mjs";

export async function runAffected(runtime, suites) {
  const selected = [...new Set(suites)];
  const handlers = { cv: runSmokeCv, navigation: runSmokeNavigation, mpa: runSmokeMpa, "project-pages": runSmokeProjectPages, site: runSmokeSite };
  for (const suite of selected) if (!["full", "smoke", "media", ...Object.keys(handlers)].includes(suite)) throw new Error(`unknown affected suite: ${suite}`);
  if (!selected.length || selected.includes("full")) return runAllSmokeSuites(runtime);
  await runQuickSmoke(runtime);
  const focused = new Set(selected.filter((suite) => handlers[suite]));
  // Media changes exercise the existing deep real-media checks, not a stub audit.
  if (selected.includes("media")) for (const suite of ["site", "mpa", "project-pages"]) focused.add(suite);
  await mapWithConcurrency([...focused], 2, (suite) => handlers[suite](runtime));
}
if (isDirectExecution(import.meta.url)) {
  const suites = process.env.E2E_AFFECTED_SUITES
    ? process.env.E2E_AFFECTED_SUITES.split(",")
    : scopeFromGit({ base: process.env.CI_DIFF_BASE ?? "origin/prod", mergeBase: true }).suites;
  console.log(`[affected] ${suites.join(", ")}`);
  await withE2ERuntime((runtime) => runAffected(runtime, suites));
}
