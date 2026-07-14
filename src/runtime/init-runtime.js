import { mountAll } from "./mount-engine.js";
import { MOUNTS } from "./mounts.js";

let initialized = false;

export async function initRuntime(root = document) {
  if (initialized) return;
  const main = document.getElementById("main");
  if (!(main instanceof HTMLElement)) return;

  initialized = true;
  await mountAll(root, MOUNTS);
}
