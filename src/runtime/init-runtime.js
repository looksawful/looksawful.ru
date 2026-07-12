import { mountAll } from "./mount-engine.js";
import { MOUNTS } from "./mounts.js";
import { removeObsoleteCopy } from "./remove-obsolete-copy.js";
import { reorganizeJesteiLogoMedia } from "./reorganize-jestei-logo-media.js";
import { mergeJesteiTypeIntoLogo } from "./merge-jestei-type-into-logo.js";

let initialized = false;

export async function initRuntime(root = document) {
  if (initialized) return;
  const main = document.getElementById("main");
  if (!(main instanceof HTMLElement)) return;

  initialized = true;
  removeObsoleteCopy(root);
  reorganizeJesteiLogoMedia(root);
  mergeJesteiTypeIntoLogo(root);
  await mountAll(root, MOUNTS);
}
