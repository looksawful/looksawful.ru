import { runSmokeCv } from "../smoke-cv.mjs";
import { runSmokeMpa } from "../smoke-mpa.mjs";
import { runSmokeProjectPages } from "../smoke-project-pages.mjs";
import { runSmokeNavigation } from "../smoke-site-navigation.mjs";
import { runSmokeSite } from "../smoke-site.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";
import { mapWithConcurrency } from "./concurrency.mjs";
import { runQuickSmoke } from "./run-smoke.mjs";

export async function runAllSmokeSuites({ browser, baseUrl, cvMode = "authored" }) {
  await runQuickSmoke({ browser, baseUrl, cvMode });
  await mapWithConcurrency([
    runSmokeSite, runSmokeNavigation, runSmokeMpa, runSmokeProjectPages,
    (runtime) => runSmokeCv({ ...runtime, mode: cvMode }),
  ], 2, (suite) => suite({ browser, baseUrl }));
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runAllSmokeSuites({ browser, baseUrl }));
}
