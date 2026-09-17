import { runSmokeCv } from "./smoke-cv.mjs";
import { runSmokeNavigation } from "./smoke-site-navigation.mjs";
import { runSmokeSite } from "./smoke-site.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";
import { mapWithConcurrency, runSuiteWithDeadline } from "./concurrency.mjs";
import { runSmokeMpa } from "./smoke-mpa.mjs";
import { runSmokeProjectPages } from "./smoke-project-pages.mjs";
import { runQuickSmoke } from "./run-smoke.mjs";

export const FULL_E2E_SUITE_TIMEOUT_MS = Object.freeze({
  "quick-smoke": 4 * 60_000,
  "site-smoke": 12 * 60_000,
  "navigation-smoke": 8 * 60_000,
  "mpa-smoke": 8 * 60_000,
  "project-pages-smoke": 8 * 60_000,
  "cv-smoke": 8 * 60_000,
});

function namedSuite(name, run) {
  return {
    name,
    timeoutMs: FULL_E2E_SUITE_TIMEOUT_MS[name],
    run,
  };
}

export async function runAllSmokeSuites({ browser, baseUrl, cvMode = "authored" }) {
  const runtime = { browser, baseUrl };

  await runSuiteWithDeadline({
    ...namedSuite("quick-smoke", () => runQuickSmoke({ ...runtime, cvMode })),
  });

  const suites = [
    namedSuite("site-smoke", () => runSmokeSite(runtime)),
    namedSuite("navigation-smoke", () => runSmokeNavigation(runtime)),
    namedSuite("mpa-smoke", () => runSmokeMpa(runtime)),
    namedSuite("project-pages-smoke", () => runSmokeProjectPages(runtime)),
    namedSuite("cv-smoke", () => runSmokeCv({ ...runtime, mode: cvMode })),
  ];

  await mapWithConcurrency(suites, 2, (suite) => runSuiteWithDeadline(suite));
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runAllSmokeSuites({ browser, baseUrl, cvMode: "production" }));
}
