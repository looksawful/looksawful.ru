import { runQuickSmoke, runMediaSanity } from "./run-smoke.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

export async function runProductionE2E({ browser, baseUrl }) {
  await runQuickSmoke({ browser, baseUrl, cvMode: "production" });
  await runMediaSanity({ browser, baseUrl });
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runProductionE2E({ browser, baseUrl }));
}
