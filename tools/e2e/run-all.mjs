import { runSmokeBlog } from "../smoke-blog.mjs";
import { runSmokeCv } from "../smoke-cv.mjs";
import { runSmokeMpa } from "../smoke-mpa.mjs";
import { runSmokeProjectPages } from "../smoke-project-pages.mjs";
import { runSmokeNavigation } from "../smoke-site-navigation.mjs";
import { runSmokeSite } from "../smoke-site.mjs";
import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

export async function runAllSmokeSuites({ browser, baseUrl, cvMode = "authored" }) {
  await runSmokeSite({ browser, baseUrl });
  await runSmokeNavigation({ browser, baseUrl });
  await runSmokeMpa({ browser, baseUrl });
  await runSmokeProjectPages({ browser, baseUrl });
  await runSmokeBlog({ browser, baseUrl });
  await runSmokeCv({ browser, baseUrl, mode: cvMode });
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runAllSmokeSuites({ browser, baseUrl }));
}
