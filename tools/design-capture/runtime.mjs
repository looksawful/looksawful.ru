import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const STOP_GRACE_MS = 2_000;

export function validateRuntimeOptions({ host = "127.0.0.1", port }) {
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new Error(`Design capture server must use a loopback host, got ${host}`);
  }
  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    throw new Error(`Invalid design capture port: ${port}`);
  }
}

export function createDeterministicStyleTag() {
  return `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
      caret-color: transparent !important;
    }
    html { scroll-behavior: auto !important; }
  `;
}

async function getFreePort(host) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) reject(error);
        else if (!port) reject(new Error("Could not allocate a local design capture port"));
        else resolve(port);
      });
    });
  });
}

async function waitForServer(baseUrl, server, getOutput, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Vite design capture server exited with code ${server.exitCode}.\n${getOutput()}`);
    }
    try {
      const response = await fetch(baseUrl, { redirect: "follow" });
      if (response.ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error(`Vite design capture server did not start at ${baseUrl}.\n${getOutput()}`);
}

function waitForExit(server) {
  if (!server || server.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => server.once("exit", resolve));
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  const exited = waitForExit(server);
  server.kill("SIGTERM");
  const graceful = await Promise.race([
    exited.then(() => true),
    delay(STOP_GRACE_MS).then(() => false),
  ]);
  if (graceful || server.exitCode !== null) return;
  server.kill("SIGKILL");
  await exited;
}

export async function settleDesignPage(page) {
  await page.addStyleTag({ content: createDeterministicStyleTag() });
  await page.evaluate(async () => {
    for (const video of document.querySelectorAll("video")) {
      try { video.pause(); } catch {}
    }
    if (document.fonts?.ready) await document.fonts.ready;
    const images = [...document.images];
    await Promise.all(images.map(async (image) => {
      if (image.complete) {
        try { await image.decode?.(); } catch {}
        return;
      }
      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 3_000);
      });
      try { await image.decode?.(); } catch {}
    }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

export async function openDesignPage({ browser, baseUrl, route, viewport }) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const page = await context.newPage();
  const response = await page.goto(new URL(route, baseUrl).href, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  if (!response?.ok()) {
    await context.close();
    throw new Error(`${route}: navigation failed with ${response?.status() ?? "no response"}`);
  }
  await settleDesignPage(page);
  return { context, page };
}

export async function withDesignCaptureRuntime(callback, options = {}) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? await getFreePort(host);
  validateRuntimeOptions({ host, port });

  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
  const baseUrl = `http://${host}:${port}/`;
  const server = spawn(
    process.execPath,
    [viteBin, "--host", host, "--port", String(port), "--strictPort"],
    { cwd: rootDir, stdio: ["ignore", "pipe", "pipe"] },
  );

  let output = "";
  server.stdout.on("data", (chunk) => { output += chunk.toString(); });
  server.stderr.on("data", (chunk) => { output += chunk.toString(); });

  let browser;
  try {
    await waitForServer(baseUrl, server, () => output, options.waitAttempts);
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    return await callback({ browser, baseUrl, host, port, rootDir });
  } finally {
    try {
      await browser?.close();
    } finally {
      await stopServer(server);
    }
  }
}
