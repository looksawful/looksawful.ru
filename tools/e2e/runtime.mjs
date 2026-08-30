import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4173;

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

function stopServer(server) {
  if (!server || server.exitCode !== null || server.killed) return;
  server.kill("SIGTERM");
}

export async function withE2ERuntime(callback, options = {}) {
  const host = options.host ?? process.env.E2E_HOST ?? DEFAULT_HOST;
  const port = Number(options.port ?? process.env.E2E_PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`invalid E2E preview port: ${port}`);
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
  let cleaning = false;
  const cleanup = async () => {
    if (cleaning) return;
    cleaning = true;
    try {
      await browser?.close();
    } finally {
      stopServer(server);
    }
  };

  const onSignal = () => {
    void cleanup();
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  try {
    await waitForServer(baseUrl, server, () => serverOutput, options.waitAttempts);
    browser = await chromium.launch({ headless: true });
    return await callback({ browser, baseUrl, host, port });
  } finally {
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    await cleanup();
  }
}
