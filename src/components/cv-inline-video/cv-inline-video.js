export function initCvInlineVideos(root = document) {
  const players = [...root.querySelectorAll("[data-inline-video]")];

  players.forEach((player) => {
    if (!(player instanceof HTMLElement) || player.dataset.cvInlineVideoReady === "true") {
      return;
    }

    const video = player.querySelector("[data-inline-video-media]");
    const soundButton = player.querySelector("[data-inline-video-sound]");

    if (!(video instanceof HTMLVideoElement) || !(soundButton instanceof HTMLButtonElement)) {
      return;
    }

    player.dataset.cvInlineVideoReady = "true";
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
