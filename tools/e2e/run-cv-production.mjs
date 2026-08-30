import { runSmokeCv } from "../smoke-cv.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

export async function runProductionCvSmoke({ browser, baseUrl }) {
  await runSmokeCv({ browser, baseUrl, mode: "production" });
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runProductionCvSmoke({ browser, baseUrl }));
}
