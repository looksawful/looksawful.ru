import assert from "node:assert/strict";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium, webkit } from "playwright";

import { buildReviewRuntimeMatrix } from "./runtime-matrix.mjs";
import {
  captureReviewEvidence,
  openReviewPage,
  prepareDynamicReviewStates,
} from "./runtime.mjs";

const host = "127.0.0.1";

const dynamicStates = [
  {
    id: "fixture-video",
    kind: "video",
    selector: "video[data-review-video]",
    time: 0.05,
  },
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
    <video
      data-review-dynamic="video"
      data-review-state-id="fixture-video"
      data-review-video
      muted
      preload="auto"
    ></video>
    <canvas
      data-review-dynamic="canvas"
      data-review-state-id="fixture-canvas"
      data-review-canvas
      data-review-ready="loading"
      data-review-stable="moving"
    ></canvas>
    <canvas
      data-review-dynamic="webgl"
      data-review-state-id="fixture-webgl"
      data-review-webgl
      data-review-ready="loading"
      data-review-stable="moving"
    ></canvas>
    <div
      data-review-dynamic="infinite-gallery"
      data-review-state-id="fixture-gallery"
      data-review-gallery
      data-review-ready="loading"
      data-review-stable="moving"
    ></div>
    <div
      data-reveal
      style="opacity:0;visibility:hidden;transform:translateX(40px)"
    >settled reveal</div>
    <script>
      const writeAscii = (view, offset, value) => {
        for (let index = 0; index < value.length; index += 1) {
          view.setUint8(offset + index, value.charCodeAt(index));
        }
      };
      const sampleRate = 8000;
      const sampleCount = 2000;
      const wav = new ArrayBuffer(44 + sampleCount);
      const wavView = new DataView(wav);
      writeAscii(wavView, 0, "RIFF");
      wavView.setUint32(4, 36 + sampleCount, true);
      writeAscii(wavView, 8, "WAVE");
      writeAscii(wavView, 12, "fmt ");
      wavView.setUint32(16, 16, true);
      wavView.setUint16(20, 1, true);
      wavView.setUint16(22, 1, true);
      wavView.setUint32(24, sampleRate, true);
      wavView.setUint32(28, sampleRate, true);
      wavView.setUint16(32, 1, true);
      wavView.setUint16(34, 8, true);
      writeAscii(wavView, 36, "data");
      wavView.setUint32(40, sampleCount, true);
      new Uint8Array(wav, 44).fill(128);
      document.querySelector("[data-review-video]").src = URL.createObjectURL(
        new Blob([wav], { type: "audio/wav" }),
      );
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

    if (row.phase === "technical-smoke") {
      await prepareDynamicReviewStates(opened.page, dynamicStates);
    }

    if (row.phase === "capture" || row.phase === "technical-smoke") {
      for (const state of dynamicStates.filter(({ kind }) => kind !== "video")) {
        const target = opened.page.locator(state.selector);
        assert.equal(await target.getAttribute("data-review-ready"), "ready");
        assert.equal(await target.getAttribute("data-review-stable"), "stable");
      }

      const videoState = dynamicStates.find(({ kind }) => kind === "video");
      const video = opened.page.locator(videoState.selector);
      assert.equal(await video.evaluate((element) => element.paused), true);
      assert.ok(
        Math.abs((await video.evaluate((element) => element.currentTime)) - videoState.time) <= 0.05,
      );
      assert.deepEqual(opened.runtimeErrors, []);
    }

    if (row.phase === "capture") {
      const revealStyle = await opened.page.locator("[data-reveal]").evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          opacity: style.opacity,
          visibility: style.visibility,
          transform: style.transform,
        };
      });
      assert.deepEqual(revealStyle, {
        opacity: "1",
        visibility: "visible",
        transform: "none",
      });

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
      reviewDepth: "Interactive",
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

    const captureRow = rows.find(
      ({ browser, phase }) => browser === "chromium" && phase === "capture",
    );
    assert.ok(captureRow);
    await assert.rejects(
      openReviewPage({
        browser: browsers.get("chromium"),
        baseUrl,
        route: "/",
        row: captureRow,
        dynamicStates: [],
      }),
      /Missing dynamic review state/i,
    );

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

const isDirectExecution = Boolean(
  process.argv[1] &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href,
);

if (isDirectExecution) {
  smokeReviewRuntimeMatrix()
    .then(() => {
      console.log("private review runtime smoke passed");
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
