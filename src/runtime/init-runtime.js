import { mountAll } from "./mount-engine.js";
import { MOUNTS } from "./mounts.js";
import { removeObsoleteCopy } from "./remove-obsolete-copy.js";
import { reorganizeJesteiLogoMedia } from "./reorganize-jestei-logo-media.js";

let initialized = false;

export async function initRuntime(root = document) {
  if (initialized) return;
  const main = document.getElementById("main");
  if (!(main instanceof HTMLElement)) return;

  initialized = true;
  removeObsoleteCopy(root);
  reorganizeJesteiLogoMedia(root);
  await mountAll(root, MOUNTS);
}
