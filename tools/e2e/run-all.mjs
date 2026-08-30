import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SUITES = [
  "../smoke-site.mjs",
  "../smoke-site-navigation.mjs",
  "../smoke-mpa.mjs",
  "../smoke-project-pages.mjs",
  "../smoke-cv.mjs",
];

function runNodeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${path.basename(scriptPath)} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

export async function runAllSmokeSuites() {
  const directory = path.dirname(fileURLToPath(import.meta.url));
  for (const relativePath of SUITES) {
    await runNodeScript(path.resolve(directory, relativePath));
  }
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  await runAllSmokeSuites();
}
