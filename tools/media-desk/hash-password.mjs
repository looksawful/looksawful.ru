import { randomBytes, scryptSync } from "node:crypto";

const KEY_BYTES = 32;

function hashPassword(password) {
  if (password.length < 12) {
    throw new Error("Password must contain at least 12 characters.");
  }
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, KEY_BYTES, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$v1$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

async function readHiddenPassword() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8").trimEnd();
  }

  process.stdout.write("Media Desk password: ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return await new Promise((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };

    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };

    process.stdin.on("data", onData);
  });
}

try {
  const password = await readHiddenPassword();
  process.stdout.write(`${hashPassword(password)}\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
