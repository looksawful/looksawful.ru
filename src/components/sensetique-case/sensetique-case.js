import { createSensetiqueCaptions } from "./captions.js";
import { createSensetiqueCrossfades } from "./crossfade.js";
import { createSensetiqueFlipbook } from "./flipbook.js";
import { prepareSensetiqueCase } from "./scene.js";
import { createSensetiqueStudioRows } from "./studio-rows.js";
import { createViewportVideoPlayback } from "./video-autoplay.js";

const noop = () => {};

export { prepareSensetiqueCase };

export function createSensetiqueCase({
  root = document,
  motion = null,
  accordionRuntime = null,
} = {}) {
  const scene = root.querySelector(".cv-item--sensetique");
  if (!(scene instanceof HTMLElement)) return noop;

  const controller = new AbortController();
  const { signal } = controller;
  const cleanups = [];

  cleanups.push(createSensetiqueCaptions(scene, signal));
  cleanups.push(
    createSensetiqueCrossfades(scene, { motion, accordionRuntime, signal }),
  );
  cleanups.push(
    createViewportVideoPlayback(scene, { motion, accordionRuntime, signal }),
  );

  const studioRows = createSensetiqueStudioRows(scene, {
    accordionRuntime,
    signal,
  });
  cleanups.push(studioRows);
  cleanups.push(
    createSensetiqueFlipbook(scene, { accordionRuntime, signal }),
  );

  const destroy = () => {
    controller.abort();
    while (cleanups.length) cleanups.pop()?.();
    scene.querySelectorAll('[data-caption-open="true"]').forEach((figure) => {
      figure.removeAttribute("data-caption-open");
    });
  };

  destroy.refresh = () => studioRows.refresh?.();
  return destroy;
}
