import { captureCaptionQa } from "../capture-caption-qa.mjs";
import { runAllSmokeSuites } from "./run-all.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

export async function runProductionE2E({ browser, baseUrl }) {
  await runAllSmokeSuites({ browser, baseUrl, cvMode: "production" });
  await captureCaptionQa({ browser, baseUrl });
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runProductionE2E({ browser, baseUrl }));
}
