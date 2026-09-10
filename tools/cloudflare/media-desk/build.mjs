import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const vite = fileURLToPath(new URL("../../../node_modules/vite/bin/vite.js", import.meta.url));
const config = fileURLToPath(new URL("./vite.config.mjs", import.meta.url));

const child = spawn(process.execPath, [vite, "build", "--config", config], {
  stdio: "inherit",
  env: {
    ...process.env,
    VITE_CONTENT_DESK_WRITE: "1",
    VITE_MEDIA_DESK_AUTH: "1",
  },
});

child.once("error", (error) => {
  console.error(`[media-desk-cloudflare] ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
