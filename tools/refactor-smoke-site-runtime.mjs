import { readFile, writeFile } from "node:fs/promises";

const file = "tools/smoke-site.mjs";
let source = await readFile(file, "utf8");

function replaceExact(label, before, after) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${label}: source pattern not found`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`${label}: source pattern is not unique`);
  }
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceExact(
  "imports and base URL",
  `import { spawn } from "node:child_process";\nimport { setTimeout as delay } from "node:timers/promises";\nimport { chromium } from "playwright";\n\nconst HOST = "127.0.0.1";\nconst PORT = 4173;\nconst BASE_URL = \`http://\${HOST}:\${PORT}\`;\n`,
  `import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";\n\nlet BASE_URL = "";\n`,
);

replaceExact(
  "owned preview server",
  `\nconst server = spawn(\n  process.execPath,\n  [\n    "node_modules/vite/bin/vite.js",\n    "preview",\n    "--host",\n    HOST,\n    "--port",\n    String(PORT),\n    "--strictPort",\n  ],\n  { stdio: ["ignore", "pipe", "pipe"] },\n);\nlet serverOutput = "";\nserver.stdout.on("data", (chunk) => {\n  serverOutput += chunk.toString();\n});\nserver.stderr.on("data", (chunk) => {\n  serverOutput += chunk.toString();\n});\n`,
  "\n",
);

replaceExact(
  "owned server wait loop",
  `\nasync function waitForServer() {\n  for (let attempt = 0; attempt < 80; attempt += 1) {\n    try {\n      const response = await fetch(BASE_URL, { redirect: "follow" });\n      if (response.ok) return;\n    } catch {}\n    await delay(250);\n  }\n\n  throw new Error(\`Vite preview did not start.\\n\${serverOutput}\`);\n}\n`,
  "\n",
);

replaceExact(
  "top-level browser lifecycle",
  `\nlet browser;\nconst allWarnings = [];\n\ntry {\n  await waitForServer();\n  browser = await chromium.launch({ headless: true });\n\n  for (const viewport of VIEWPORTS) {\n    allWarnings.push(...(await auditViewport(browser, viewport)));\n  }\n\n  await auditDeepReloadAndHistory(browser);\n  await auditReducedMotion(browser);\n\n  allWarnings.forEach((warning) => console.warn(\`[smoke] warning: \${warning}\`));\n  console.log(\`Browser smoke OK: \${VIEWPORTS.length} viewports, motion contract, reveal batching, rail release, navigation lifecycle, reduced motion, media decode, video metadata, canvas health, lightbox, overflow\`);\n} finally {\n  await browser?.close();\n  server.kill("SIGTERM");\n}\n`,
  `\nexport async function runSmokeSite({ browser, baseUrl }) {\n  BASE_URL = baseUrl;\n  const allWarnings = [];\n\n  for (const viewport of VIEWPORTS) {\n    allWarnings.push(...(await auditViewport(browser, viewport)));\n  }\n\n  await auditDeepReloadAndHistory(browser);\n  await auditReducedMotion(browser);\n\n  allWarnings.forEach((warning) => console.warn(\`[smoke] warning: \${warning}\`));\n  console.log(\`Browser smoke OK: \${VIEWPORTS.length} viewports, motion contract, reveal batching, rail release, navigation lifecycle, reduced motion, media decode, video metadata, canvas health, lightbox, overflow\`);\n}\n\nif (isDirectExecution(import.meta.url)) {\n  await withE2ERuntime(({ browser, baseUrl }) => runSmokeSite({ browser, baseUrl }));\n}\n`,
);

await writeFile(file, source, "utf8");
console.log("smoke-site runtime lifecycle refactored with four exact replacements");
