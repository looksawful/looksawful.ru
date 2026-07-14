const VIDEO_SELECTOR = "[data-showcase] video";
const ENHANCED_ATTR = "data-video-controls-enhanced";
const SVG_NS = "http://www.w3.org/2000/svg";

const icons = {
  pause: "M6 4h3v12H6V4Zm5 0h3v12h-3V4Z",
  play: "M6 4.8c0-.75.82-1.22 1.48-.84l8.1 4.7c.65.38.65 1.31 0 1.68l-8.1 4.7A.99.99 0 0 1 6 14.2V4.8Z",
  mute: "M3 7h3.2L10 3.6v12.8L6.2 13H3V7Zm10.1-.7 1.1-1.1L17 8l2.8-2.8 1.1 1.1L18.1 9l2.8 2.8-1.1 1.1L17 10.1l-2.8 2.8-1.1-1.1L15.9 9l-2.8-2.7Z",
  sound: "M3 7h3.2L10 3.6v12.8L6.2 13H3V7Zm10.7-1.2c1 .8 1.7 1.9 1.7 3.2s-.6 2.4-1.7 3.2l-.9-1.2c.7-.5 1.1-1.2 1.1-2s-.4-1.5-1.1-2l.9-1.2Zm2.1-2.4A7 7 0 0 1 18.3 9a7 7 0 0 1-2.5 5.4l-.9-1.2A5.5 5.5 0 0 0 16.8 9c0-1.7-.7-3.1-1.9-4.2l.9-1.4Z",
  fullscreen: "M3 3h5v2H5v3H3V3Zm9 0h5v5h-2V5h-3V3ZM5 12v3h3v2H3v-5h2Zm12 0v5h-5v-2h3v-3h2Z",
};

function createIcon(pathData) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathData);
  svg.append(path);

  return svg;
}

function createButton(action, label) {
  const button = document.createElement("button");
  button.className = `showcase-video-control showcase-video-control--${action}`;
  button.type = "button";
  button.dataset.videoAction = action;
  button.setAttribute("aria-label", label);
  return button;
}

function setButtonIcon(button, icon) {
  button.replaceChildren(createIcon(icon));
}

function getShell(video) {
  const mediaItem = video.closest("[data-section-media-item], figure");
  return mediaItem instanceof HTMLElement ? mediaItem : video.parentElement;
}

function sync(video, buttons) {
  const isPaused = video.paused;
  const isMuted = video.muted || video.volume === 0;

  setButtonIcon(buttons.play, isPaused ? icons.play : icons.pause);
  buttons.play.setAttribute("aria-label", isPaused ? "запустить видео" : "остановить видео");

  setButtonIcon(buttons.mute, isMuted ? icons.mute : icons.sound);
  buttons.mute.setAttribute("aria-label", isMuted ? "включить звук" : "выключить звук");
}

function enhanceVideo(video) {
  if (!(video instanceof HTMLVideoElement) || video.hasAttribute(ENHANCED_ATTR)) return;

  const shell = getShell(video);
  if (!(shell instanceof HTMLElement)) return;

  video.setAttribute(ENHANCED_ATTR, "true");
  shell.classList.add("showcase-video-frame");
  if (video.videoHeight > video.videoWidth || shell.dataset.mediaOrientation === "vertical") {
    shell.classList.add("showcase-video-frame--vertical");
  }

  const controls = document.createElement("span");
  controls.className = "showcase-video-controls";
  controls.setAttribute("aria-label", "управление видео");

  const buttons = {
    play: createButton("play", "остановить видео"),
    mute: createButton("mute", "включить звук"),
    fullscreen: createButton("fullscreen", "открыть видео на весь экран"),
  };

  controls.append(buttons.play, buttons.mute, buttons.fullscreen);
  shell.append(controls);

  controls.addEventListener("click", async (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-video-action]") : null;
    if (!(button instanceof HTMLButtonElement)) return;

    event.preventDefault();
    event.stopPropagation();

    const action = button.dataset.videoAction;
    if (action === "play") {
      if (video.paused) {
        await video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    if (action === "mute") {
      video.muted = !video.muted;
    }

    if (action === "fullscreen") {
      const target = video.requestFullscreen ? video : shell;
      await target.requestFullscreen?.().catch(() => {});
    }

    sync(video, buttons);
  });

  video.addEventListener("play", () => sync(video, buttons));
  video.addEventListener("pause", () => sync(video, buttons));
  video.addEventListener("volumechange", () => sync(video, buttons));
  video.addEventListener(
    "loadedmetadata",
    () => {
      if (video.videoHeight > video.videoWidth) {
        shell.classList.add("showcase-video-frame--vertical");
      }
    },
    { once: true },
  );

  sync(video, buttons);
}

export function initShowcaseVideoControls(root = document) {
  const videos = Array.from(root.querySelectorAll(VIDEO_SELECTOR));
  for (const video of videos) enhanceVideo(video);
  return { videos: videos.length };
}
