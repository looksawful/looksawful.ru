import "../styles/visible-repairs-final.css";
import "../final-site-repairs.js";
import "../styx-scanography-fixes.js";
import { mountAll } from "./mount-engine.js";
import { MOUNTS } from "./mounts.js";
import { removeObsoleteCopy } from "./remove-obsolete-copy.js";
import { reorganizeJesteiLogoMedia } from "./reorganize-jestei-logo-media.js";
import { mergeJesteiTypeIntoLogo } from "./merge-jestei-type-into-logo.js";
import { mountJesteiLogoAnimation } from "./mount-jestei-logo-animation.js";
import { replaceJesteiRebrandVisual } from "./replace-jestei-rebrand-visual.js";
import { mountJesteiAudienceMapInColor } from "./mount-jestei-audience-map-in-color.js";
import { placeJesteiWordsAfterColor } from "./place-jestei-words-after-color.js";
import { hideJesteiTemporaryDecorations } from "./hide-jestei-temporary-decorations.js";

let initialized = false;

export async function initRuntime(root = document) {
  if (initialized) return;
  const main = document.getElementById("main");
  if (!(main instanceof HTMLElement)) return;

  initialized = true;
  removeObsoleteCopy(root);
  reorganizeJesteiLogoMedia(root);
  mergeJesteiTypeIntoLogo(root);
  mountJesteiLogoAnimation(root);
  replaceJesteiRebrandVisual(root);
  mountJesteiAudienceMapInColor(root);
  placeJesteiWordsAfterColor(root);
  hideJesteiTemporaryDecorations(root);
  await mountAll(root, MOUNTS);
  hideJesteiTemporaryDecorations(root);
}
