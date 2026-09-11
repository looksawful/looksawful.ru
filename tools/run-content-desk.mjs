import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const args = [
  vite,
  "--host",
  "127.0.0.1",
  "--open",
  "/tools/media-desk/",
  ...process.argv.slice(2),
];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
});

child.once("error", (error) => {
  console.error(`[content-desk] ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
