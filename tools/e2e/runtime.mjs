import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4173;
const SERVER_STOP_GRACE_MS = 2_000;

const BROWSER_TARGETS = {
  chromium: { type: chromium, launchOptions: {} },
  firefox: { type: firefox, launchOptions: {} },
  webkit: { type: webkit, launchOptions: {} },
  chrome: { type: chromium, launchOptions: { channel: "chrome" } },
  msedge: { type: chromium, launchOptions: { channel: "msedge" } },
  opera: { type: chromium, launchOptions: {} },
  yandex: { type: chromium, launchOptions: {} },
};

export function isDirectExecution(metaUrl) {
  return Boolean(
    process.argv[1]
      && fileURLToPath(metaUrl) === path.resolve(process.argv[1]),
  );
}

async function waitForServer(baseUrl, server, getOutput, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Vite preview exited with code ${server.exitCode}.\n${getOutput()}`);
    }

    try {
      const response = await fetch(baseUrl, { redirect: "follow" });
      if (response.ok) return;
    } catch {}

    await delay(250);
  }

  throw new Error(`Vite preview did not start at ${baseUrl}.\n${getOutput()}`);
}

function waitForExit(server) {
  if (!server || server.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    server.once("exit", resolve);
  });
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;

  const exited = waitForExit(server);
  server.kill("SIGTERM");

  const graceful = await Promise.race([
    exited.then(() => true),
    delay(SERVER_STOP_GRACE_MS).then(() => false),
  ]);

  if (graceful || server.exitCode !== null) return;

  server.kill("SIGKILL");
  await exited;
}

export async function withE2ERuntime(callback, options = {}) {
  const host = options.host ?? process.env.E2E_HOST ?? DEFAULT_HOST;
  const port = Number(options.port ?? process.env.E2E_PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`invalid E2E preview port: ${port}`);
  }

  const browserName = options.browserName ?? process.env.E2E_BROWSER ?? "chromium";
  const browserTarget = BROWSER_TARGETS[browserName];
  if (!browserTarget) {
    throw new Error(`unsupported E2E browser target: ${browserName}`);
  }

  const customExecutablePath = options.executablePath ?? process.env.E2E_EXECUTABLE_PATH;
  if ((browserName === "opera" || browserName === "yandex") && !customExecutablePath) {
    throw new Error(`${browserName} requires E2E_EXECUTABLE_PATH`);
  }

  const baseUrl = options.baseUrl ?? `http://${host}:${port}`;
  const server = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      host,
      "--port",
      String(port),
      "--strictPort",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let serverOutput = "";
  server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

  let browser;
  let cleanupPromise;
  const cleanup = () => {
    if (cleanupPromise) return cleanupPromise;
    cleanupPromise = (async () => {
      try {
        await browser?.close();
      } finally {
        await stopServer(server);
      }
    })();
    return cleanupPromise;
  };

  const onSignal = (signal) => {
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    void cleanup()
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        process.kill(process.pid, signal);
      });
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  try {
    await waitForServer(baseUrl, server, () => serverOutput, options.waitAttempts);
    browser = await browserTarget.type.launch({
      headless: true,
      ...browserTarget.launchOptions,
      ...(customExecutablePath ? { executablePath: customExecutablePath } : {}),
    });
    return await callback({ browser, browserName, baseUrl, host, port });
  } finally {
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    await cleanup();
  }
}
