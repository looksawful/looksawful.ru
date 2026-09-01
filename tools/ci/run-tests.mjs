import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const derivativeTests = new Set(["test/responsive-manifest-contract.test.mjs", "test/video-delivery-contract.test.mjs"]);
export function selectTests(group, files) {
  const tests = files.filter((file) => file.endsWith(".test.mjs")).sort();
  if (group === "fast" || group === "unit") return tests.filter((file) => !file.startsWith("test/media-tools/") && !derivativeTests.has(file));
  if (group === "media-contract") return tests.filter((file) => derivativeTests.has(file));
  if (group === "media") return tests.filter((file) => /^test\/(media-|responsive-|video-delivery)/.test(file));
  if (group === "cv") return tests.filter((file) => /^test\/cv-/.test(file));
  if (group === "ci") return tests.filter((file) => /^test\/(ci-pipeline|change-scope|e2e-concurrency|media-ci-cache|tooling-pipeline|e2e-production-pipeline|test-groups)\.test\.mjs$/.test(file));
  throw new Error(`unknown test group: ${group}`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const files = readdirSync("test", { recursive: true }).map((file) => `test/${file.replaceAll("\\", "/")}`);
  const selected = selectTests(process.argv[2], files);
  if (!selected.length) throw new Error("test group is empty");
  const result = spawnSync(process.execPath, ["--test", ...selected], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
