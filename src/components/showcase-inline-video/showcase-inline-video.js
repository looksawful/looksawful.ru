function isAutoplayVideo(video) {
  return video.hasAttribute("autoplay") || video.autoplay;
}

function safePlay(video) {
  const request = video.play();

  if (request && typeof request.catch === "function") {
    request.catch(() => {});
  }
}

function prepareVideo(video) {
  video.dataset.showcasePlainVideoReady = "true";
  video.preload = video.getAttribute("preload") || "metadata";
  video.muted = video.muted || video.hasAttribute("muted");
  video.defaultMuted = video.defaultMuted || video.muted;
  video.playsInline = true;
}

function observeAutoplay(video) {
  if (!("IntersectionObserver" in window) || !isAutoplayVideo(video)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      if (entry.isIntersecting) {
        safePlay(video);
      } else {
        video.pause();
      }
    },
    { rootMargin: "160px 0px", threshold: 0.08 },
  );

  observer.observe(video);
}

export function initCvInlineVideos(root = document) {
  root.querySelectorAll("video").forEach((video) => {
    if (!(video instanceof HTMLVideoElement) || video.dataset.showcasePlainVideoReady === "true") {
      return;
    }

    prepareVideo(video);
    observeAutoplay(video);
  });
}

