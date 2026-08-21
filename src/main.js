import "./components/awful-cases-game.js";
import "./components/animated-canvas-gallery.js";

import { createMotionPreference } from "./components/motion-preference.js";
import { createInfiniteReels } from "./components/infinite-reel.js";
import { createMediaDecks } from "./components/media-deck.js";
import { createMediaLightbox } from "./components/media-lightbox.js";
import { createCodeBlocks } from "./components/code-block.js";
import { createPageFlips } from "./components/page-flip.js";
import { createBerserkAudioPlayers } from "./components/berserk-audio-player.js";
import { initSiteInteractive } from "./interactive.js";

function initBeforeAfter(root) {
  const range = root.querySelector(".before-after__range");
  if (!(range instanceof HTMLInputElement)) return () => {};

  const render = () => {
    root.style.setProperty("--before-after-split", `${range.value}%`);
  };

  range.addEventListener("input", render, { passive: true });
  render();

  return () => range.removeEventListener("input", render);
}

const motion = createMotionPreference();
const destroys = [];

destroys.push(initSiteInteractive({ root: document, motion }));
destroys.push(createMediaLightbox({ root: document }));
destroys.push(createMediaDecks({ root: document, motion }));
destroys.push(createInfiniteReels({ root: document, motion }));
destroys.push(createCodeBlocks(document));
destroys.push(createPageFlips({ root: document, motion }));
destroys.push(createBerserkAudioPlayers(document));

document.querySelectorAll("[data-before-after]").forEach((root) => {
  destroys.push(initBeforeAfter(root));
});

window.addEventListener(
  "pagehide",
  () => {
    destroys.splice(0).reverse().forEach((destroy) => destroy?.());
    motion.destroy();
  },
  { once: true },
);
