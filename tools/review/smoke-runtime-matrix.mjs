import assert from "node:assert/strict";
import { createServer } from "node:http";

import { chromium, webkit } from "playwright";

import { buildReviewRuntimeMatrix } from "./runtime-matrix.mjs";
import { captureReviewEvidence, openReviewPage } from "./runtime.mjs";

const host = "127.0.0.1";

const dynamicStates = [
  {
    id: "fixture-canvas",
    kind: "canvas",
    selector: "[data-review-canvas]",
    ready: { attribute: "data-review-ready", value: "ready" },
    stable: { attribute: "data-review-stable", value: "stable" },
  },
  {
    id: "fixture-webgl",
    kind: "webgl",
    selector: "[data-review-webgl]",
    ready: { attribute: "data-review-ready", value: "ready" },
    stable: { attribute: "data-review-stable", value: "stable" },
  },
  {
    id: "fixture-gallery",
    kind: "infinite-gallery",
    selector: "[data-review-gallery]",
    ready: { attribute: "data-review-ready", value: "ready" },
    stable: { attribute: "data-review-stable", value: "stable" },
  },
];

function startFixtureServer() {
  const server = createServer((request, response) => {
    if (request.url !== "/") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>private review runtime smoke</title>
  </head>
  <body>
    <main data-review-fixture="ready">runtime smoke</main>
    <div data-review-canvas data-review-ready="loading" data-review-stable="moving"></div>
    <div data-review-webgl data-review-ready="loading" data-review-stable="moving"></div>
    <div data-review-gallery data-review-ready="loading" data-review-stable="moving"></div>
    <script>
      document.addEventListener("looksawful:review-state-request", (event) => {
        const target = event.target;
        const stable = event.detail?.stable;
        if (!(target instanceof HTMLElement) || !stable) return;
        target.setAttribute("data-review-ready", "ready");
        target.setAttribute(stable.attribute, stable.value);
      });
    </script>
  </body>
</html>`);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Review smoke fixture did not receive a TCP address."));
        return;
      }
      resolve({
        server,
        baseUrl: `http://${host}:${address.port}/`,
      });
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function runRow(browser, baseUrl, row) {
  const opened = await openReviewPage({
    browser,
    baseUrl,
    route: "/",
    row,
    dynamicStates: row.phase === "capture" ? dynamicStates : [],
  });

  try {
    assert.equal(
      await opened.page.locator("[data-review-fixture=ready]").textContent(),
      "runtime smoke",
    );

    if (row.phase === "capture") {
      for (const state of dynamicStates) {
        const target = opened.page.locator(state.selector);
        assert.equal(await target.getAttribute("data-review-ready"), "ready");
        assert.equal(await target.getAttribute("data-review-stable"), "stable");
      }

      const evidence = await captureReviewEvidence(opened.page, row);
      assert.ok(evidence.length > 0);
      assert.ok(evidence.every(({ bytes }) => bytes.byteLength > 0));
    }
  } finally {
    await opened.context.close();
  }
}

export async function smokeReviewRuntimeMatrix() {
  const { server, baseUrl } = await startFixtureServer();
  const browsers = new Map();

  try {
    const matrix = buildReviewRuntimeMatrix({
      reviewDepth: "interactive",
      affectedProfiles: ["iphone-17", "ipad-air-11-portrait"],
    });

    const rows = matrix.filter(
      ({ phase }) =>
        phase === "runtime-smoke" ||
        phase === "technical-smoke" ||
        phase === "capture",
    );

    assert.ok(rows.some(({ browser, phase }) => browser === "chromium" && phase === "capture"));
    assert.ok(rows.some(({ browser, phase }) => browser === "chromium" && phase === "runtime-smoke"));
    assert.ok(rows.some(({ browser, phase }) => browser === "webkit" && phase === "technical-smoke"));

    for (const browserName of ["chromium", "webkit"]) {
      const browserType = browserName === "chromium" ? chromium : webkit;
      browsers.set(browserName, await browserType.launch({ headless: true }));
    }

    for (const row of rows) {
      const browser = browsers.get(row.browser);
      assert.ok(browser, `missing browser for ${row.browser}`);
      await runRow(browser, baseUrl, row);
    }
  } finally {
    await Promise.all([...browsers.values()].map((browser) => browser.close()));
    await closeServer(server);
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  smokeReviewRuntimeMatrix()
    .then(() => {
      console.log("private review runtime smoke passed");
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
