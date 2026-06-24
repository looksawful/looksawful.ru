function initPlainShowcaseVideos(root = document) {
  const videos = [...root.querySelectorAll("video")];
  const canObserve = "IntersectionObserver" in window;

  videos.forEach((video) => {
    if (!(video instanceof HTMLVideoElement) || video.dataset.showcasePlainVideoReady === "true") {
      return;
    }

    video.dataset.showcasePlainVideoReady = "true";
    video.preload = video.getAttribute("preload") || "metadata";
    video.muted = video.muted || video.hasAttribute("muted");
    video.defaultMuted = video.defaultMuted || video.muted;
    video.playsInline = true;

    const shouldAutoplay = video.hasAttribute("autoplay") || video.autoplay;

    if (!canObserve || !shouldAutoplay) {
      return;
    }

    const play = () => {
      const request = video.play();
      if (request && typeof request.catch === "function") {
        request.catch(() => {});
      }
    };

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      if (entry.isIntersecting) {
        play();
      } else {
        video.pause();
      }
    }, { rootMargin: "160px 0px", threshold: 0.08 });

    observer.observe(video);
  });
}

export function initCvInlineVideos(root = document) {
  initPlainShowcaseVideos(root);
  const players = [...root.querySelectorAll("[data-showcase-inline-video]")];

  players.forEach((player) => {
    if (!(player instanceof HTMLElement) || player.dataset.showcaseInlineVideoReady === "true") {
      return;
    }

    const video = player.querySelector("[data-showcase-inline-video-media]");
    const soundButton = player.querySelector("[data-showcase-inline-video-sound]");

    if (!(video instanceof HTMLVideoElement) || !(soundButton instanceof HTMLButtonElement)) {
      return;
    }

    player.dataset.showcaseInlineVideoReady = "true";
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.playsInline = true;

    const syncSoundState = () => {
      const isMuted = video.muted || video.volume === 0;
      player.classList.toggle("is-sound-on", !isMuted);
      soundButton.setAttribute("aria-pressed", String(!isMuted));
      soundButton.setAttribute("aria-label", isMuted ? "включить звук" : "выключить звук");
    };

    const syncPlaybackState = () => {
      player.classList.toggle("is-paused", video.paused);
    };

    const playVideo = () => {
      const playRequest = video.play();

      if (playRequest && typeof playRequest.catch === "function") {
        playRequest.catch(() => {
          syncPlaybackState();
        });
      }
    };

    video.addEventListener("click", () => {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });

    video.addEventListener("play", syncPlaybackState);
    video.addEventListener("pause", syncPlaybackState);
    video.addEventListener("volumechange", syncSoundState);

    soundButton.addEventListener("click", (event) => {
      event.stopPropagation();
      video.muted = !video.muted;

      if (!video.muted && video.paused) {
        playVideo();
      }

      syncSoundState();
    });

    syncSoundState();
    syncPlaybackState();
    playVideo();
  });
}
