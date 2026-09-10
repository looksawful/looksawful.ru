import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const forwardedArgs = process.argv.slice(2);
const hasHost = forwardedArgs.some((arg) => arg === "--host" || arg.startsWith("--host="));
const hasPort = forwardedArgs.some((arg) => arg === "--port" || arg.startsWith("--port="));

const args = [
  vite,
  ...(hasHost ? [] : ["--host", "127.0.0.1"]),
  ...(hasPort ? [] : ["--port", "4174", "--strictPort"]),
  ...forwardedArgs,
];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    CONTENT_DESK_WRITE: "1",
    VITE_CONTENT_DESK_WRITE: "1",
    MEDIA_DESK_AUTH: "1",
    VITE_MEDIA_DESK_AUTH: "1",
  },
});

child.once("error", (error) => {
  console.error(`[content-desk-network] ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
