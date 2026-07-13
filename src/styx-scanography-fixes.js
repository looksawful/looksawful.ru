const SECTION_SELECTOR = "#styx-scanography";
const VIDEO_SELECTOR = `${SECTION_SELECTOR} [data-scanography-videos] video`;
const observedVideos = new WeakSet();

let playbackObserver = null;
let listenersInstalled = false;
let scheduled = false;

function setTextIfChanged(element, value) {
  if (element && element.textContent !== value) {
    element.textContent = value;
  }
}

function setAttributeIfChanged(element, name, value) {
  if (element && element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function normalizeScanographyTitle(root = document) {
  const section = root.querySelector(SECTION_SELECTOR);
  const title = section?.querySelector("[data-section-title]");
  const main = title?.querySelector("[data-section-title-main]");
  const accent = title?.querySelector("[data-section-title-accent]");

  if (!title || !main) return;

  if (!title.hasAttribute("data-letter-ready")) {
    setTextIfChanged(main, "сканография");
    setTextIfChanged(accent, "");
  }

  setAttributeIfChanged(title, "aria-label", "сканография");
  setAttributeIfChanged(section, "aria-label", "сканография");
  setAttributeIfChanged(section, "data-chapter-title", "сканография");
}

function configureMutedVideo(video) {
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.playsInline = true;
  video.preload = "auto";

  video.setAttribute("autoplay", "");
  video.setAttribute("loop", "");
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.setAttribute("preload", "auto");
}

function tryPlay(video) {
  configureMutedVideo(video);

  const request = video.play();
  if (request && typeof request.catch === "function") {
    request.catch(() => {});
  }
}

function prepareScanographyVideos(root = document) {
  const videos = [...root.querySelectorAll(VIDEO_SELECTOR)];
  if (!videos.length) return;

  videos.forEach((video) => {
    configureMutedVideo(video);

    if (observedVideos.has(video)) {
      tryPlay(video);
      return;
    }

    observedVideos.add(video);
    video.dataset.scanographyPlaybackReady = "true";
    video.addEventListener("loadeddata", () => tryPlay(video), { passive: true });
    video.addEventListener("canplay", () => tryPlay(video), { passive: true });

    const link = video.closest("a");
    link?.addEventListener("click", (event) => {
      if (!video.paused) return;
      event.preventDefault();
      tryPlay(video);
    });
  });

  if ("IntersectionObserver" in window) {
    playbackObserver ||= new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!(video instanceof HTMLVideoElement)) return;

          if (entry.isIntersecting) {
            tryPlay(video);
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );

    videos.forEach((video) => playbackObserver.observe(video));
  } else {
    videos.forEach(tryPlay);
  }

  const retryPlayback = () => videos.forEach(tryPlay);

  if (!listenersInstalled) {
    listenersInstalled = true;
    document.addEventListener("pointerdown", retryPlayback, { once: true, passive: true });
    document.addEventListener("touchstart", retryPlayback, { once: true, passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) retryPlayback();
    });
  }

  requestAnimationFrame(retryPlayback);
  window.setTimeout(retryPlayback, 250);
  window.setTimeout(retryPlayback, 1000);
}

function initialize() {
  scheduled = false;
  normalizeScanographyTitle(document);
  prepareScanographyVideos(document);
}

function scheduleInitialize() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(initialize);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}

const observer = new MutationObserver(() => {
  scheduleInitialize();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
