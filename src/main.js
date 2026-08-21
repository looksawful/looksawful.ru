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

function initViewportAutoplayVideos(root = document) {
  if (!root?.querySelectorAll) return () => {};

  const videos = [...root.querySelectorAll("video[autoplay]")].filter(
    (video) =>
      video instanceof HTMLVideoElement &&
      !video.closest("[data-media-deck], [data-infinite-reel]"),
  );

  if (!videos.length) return () => {};

  const nearViewport = new Set();

  const syncVideo = (video) => {
    if (!document.hidden && nearViewport.has(video)) {
      if (video.paused) video.play().catch(() => {});
      return;
    }

    if (!video.paused) video.pause();
  };

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const video = entry.target;
              if (!(video instanceof HTMLVideoElement)) return;

              if (entry.isIntersecting) nearViewport.add(video);
              else nearViewport.delete(video);

              syncVideo(video);
            });
          },
          {
            rootMargin: "50% 0px",
            threshold: 0,
          },
        )
      : null;

  videos.forEach((video) => {
    if (observer) {
      video.pause();
      observer.observe(video);
      return;
    }

    nearViewport.add(video);
    syncVideo(video);
  });

  const handleVisibilityChange = () => {
    videos.forEach(syncVideo);
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    observer?.disconnect();
    videos.forEach((video) => video.pause());
    nearViewport.clear();
  };
}

const motion = createMotionPreference();
const destroys = [];

destroys.push(initSiteInteractive({ root: document, motion }));
destroys.push(createMediaLightbox({ root: document }));
destroys.push(createMediaDecks({ root: document, motion }));
destroys.push(createInfiniteReels({ root: document, motion }));
destroys.push(initViewportAutoplayVideos(document));
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
