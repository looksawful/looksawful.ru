const pad = (value) => String(value).padStart(2, "0");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function fitContent(root) {
  const grid = root.dataset.deckView === "grid";
  const maxHeight = grid ? 360 : 620;

  root.querySelectorAll("[data-deck-fit-viewport]").forEach((viewport) => {
    const fit = viewport.querySelector("[data-deck-fit]");
    if (!(viewport instanceof HTMLElement) || !(fit instanceof HTMLElement)) return;

    fit.style.setProperty("--deck-fit-scale", "1");
    viewport.style.setProperty("--deck-fit-height", "auto");

    const width = Math.max(1, viewport.clientWidth);
    const fitWidth = Math.max(1, fit.scrollWidth);
    const fitHeight = Math.max(1, fit.scrollHeight);
    const scale = Math.min(1, width / fitWidth, maxHeight / fitHeight);

    fit.style.setProperty("--deck-fit-scale", String(scale));
    viewport.style.setProperty("--deck-fit-height", `${Math.ceil(fitHeight * scale)}px`);
  });
}

export function createMediaDeck(root, { motion } = {}) {
  if (!(root instanceof HTMLElement)) return () => {};
  const slides = [...root.querySelectorAll("[data-slide]")];
  if (slides.length < 2) return () => {};

  const captions = [...root.querySelectorAll("[data-slide-caption]")];
  const prev = root.querySelector("[data-deck-prev]");
  const next = root.querySelector("[data-deck-next]");
  const count = root.querySelector("[data-deck-count]");
  const gridButton = root.querySelector("[data-deck-toggle-grid]");
  const dots = [...root.querySelectorAll("[data-deck-dot]")];
  const track = root.querySelector("[data-deck-track]");
  const richTrack = track instanceof HTMLElement;
  const interval = Number(root.dataset.deckInterval) || 5000;
  const autoplayMode = root.dataset.deckAutoplay || "forward";
  const autoplay = autoplayMode !== "off";
  const pingPong = autoplayMode === "ping-pong";
  const advanceOnEnded = root.hasAttribute("data-deck-advance-on-ended");

  let index = Math.max(
    0,
    slides.findIndex((slide) => slide.hasAttribute("data-active")),
  );
  let direction = 1;
  let timer = 0;
  let pointerStart = null;
  let pointerScrollStart = 0;
  let dragging = false;
  let allowed = motion?.allowsMotion?.() ?? true;
  let resizeObserver = null;
  let playbackIndex = -1;

  const isGrid = () => root.dataset.deckView === "grid";

  const stopTimer = () => {
    window.clearTimeout(timer);
    timer = 0;
  };

  const updateDots = () => {
    dots.forEach((dot, dotIndex) => {
      const current = dotIndex === index;
      dot.toggleAttribute("data-active", current);
      dot.setAttribute("aria-current", current ? "true" : "false");
    });
  };

  const updateStack = () => {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.toggleAttribute("data-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    captions.forEach((caption, captionIndex) => {
      const active = captionIndex === index;
      caption.toggleAttribute("data-active", active);
      caption.setAttribute("aria-hidden", String(!active));
    });
  };

  const deckVideos = advanceOnEnded
    ? slides.flatMap((slide) => [...slide.querySelectorAll("video")])
    : [];

  const syncEndedPlayback = () => {
    if (!advanceOnEnded || richTrack || isGrid() || document.hidden) return;

    slides.forEach((slide, slideIndex) => {
      const videos = [...slide.querySelectorAll("video")];

      videos.forEach((video) => {
        if (!(video instanceof HTMLVideoElement)) return;

        video.muted = true;
        video.playsInline = true;

        if (slideIndex !== index) {
          video.pause();
          if (video.currentTime !== 0) video.currentTime = 0;
          return;
        }

        if (playbackIndex !== index) {
          video.currentTime = 0;
          playbackIndex = index;
        }

        video.play().catch(() => {});
      });
    });
  };

  const slideLeft = (slideIndex) => {
    if (!richTrack) return 0;
    const slide = slides[slideIndex];
    if (!(slide instanceof HTMLElement)) return 0;
    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    return track.scrollLeft + slideRect.left - trackRect.left;
  };

  const scrollToIndex = (behavior = allowed ? "smooth" : "auto") => {
    if (!richTrack || isGrid()) return;
    track.scrollTo({ left: slideLeft(index), behavior });
  };

  const update = ({ scroll = true } = {}) => {
    if (!richTrack) updateStack();
    if (count) count.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
    updateDots();
    if (scroll) scrollToIndex();
    requestAnimationFrame(() => {
      fitContent(root);
      syncEndedPlayback();
    });
  };

  const nextIndex = (step = 1) => {
    if (pingPong) {
      if (index >= slides.length - 1) direction = -1;
      if (index <= 0) direction = 1;
      return clamp(index + direction, 0, slides.length - 1);
    }
    return (index + step + slides.length) % slides.length;
  };

  const schedule = () => {
    stopTimer();

    if (!autoplay || !allowed || document.hidden || isGrid()) return;

    // Обычный слайд живёт по interval.
    // Видео-слайд ждёт собственного события ended.
    if (activeSlideHasVideo()) return;

    timer = window.setTimeout(() => {
      index = nextIndex(1);
      update();
      schedule();
    }, interval);
  };

  const activeSlideHasVideo = () =>
    advanceOnEnded && slides[index]?.querySelector("video") instanceof HTMLVideoElement;

  const goTo = (nextIndexValue, { restart = true } = {}) => {
    if (isGrid()) return;
    index = richTrack
      ? clamp(nextIndexValue, 0, slides.length - 1)
      : (nextIndexValue + slides.length) % slides.length;
    update();
    if (restart) schedule();
  };

  const handleVideoEnded = (event) => {
    if (!advanceOnEnded || isGrid()) return;

    const slideIndex = slides.findIndex((slide) => slide.contains(event.currentTarget));
    if (slideIndex !== index) return;

    playbackIndex = -1;
    goTo(index + 1);
  };

  deckVideos.forEach((video) => {
    video.removeAttribute("loop");
    video.addEventListener("ended", handleVideoEnded);
  });

  const closestTrackSlide = () => {
    if (!richTrack) return index;
    const left = track.getBoundingClientRect().left;
    let closest = index;
    let distance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, slideIndex) => {
      const nextDistance = Math.abs(slide.getBoundingClientRect().left - left);
      if (nextDistance < distance) {
        distance = nextDistance;
        closest = slideIndex;
      }
    });
    return closest;
  };

  const handlePrev = () => goTo(index - 1);
  const handleNext = () => goTo(index + 1);

  const handlePointerDown = (event) => {
    if (isGrid()) return;
    pointerStart = event.clientX;
    if (richTrack) {
      dragging = true;
      pointerScrollStart = track.scrollLeft;
      track.setPointerCapture?.(event.pointerId);
      root.toggleAttribute("data-deck-dragging", true);
    }
    stopTimer();
  };

  const handlePointerMove = (event) => {
    if (!richTrack || !dragging || pointerStart === null) return;
    track.scrollLeft = pointerScrollStart - (event.clientX - pointerStart);
  };

  const handlePointerUp = (event) => {
    if (pointerStart === null) return;
    const delta = event.clientX - pointerStart;
    pointerStart = null;

    if (richTrack) {
      dragging = false;
      root.removeAttribute("data-deck-dragging");
      track.releasePointerCapture?.(event.pointerId);
      index = closestTrackSlide();
      if (Math.abs(delta) > 36) index = clamp(index + (delta < 0 ? 1 : -1), 0, slides.length - 1);
      update();
    } else if (Math.abs(delta) > 40) {
      goTo(index + (delta < 0 ? 1 : -1), { restart: false });
    }
    schedule();
  };

  const toggleGrid = () => {
    const grid = !isGrid();
    root.dataset.deckView = grid ? "grid" : "slider";
    gridButton?.setAttribute("aria-pressed", String(grid));
    stopTimer();
    update({ scroll: !grid });
    if (!grid) schedule();
  };

  prev?.addEventListener("click", handlePrev);
  next?.addEventListener("click", handleNext);
  gridButton?.addEventListener("click", toggleGrid);
  dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => goTo(dotIndex)));

  const pointerHost = richTrack ? track : root;
  pointerHost.addEventListener("pointerdown", handlePointerDown);
  pointerHost.addEventListener("pointermove", handlePointerMove);
  pointerHost.addEventListener("pointerup", handlePointerUp);
  pointerHost.addEventListener("pointercancel", handlePointerUp);

  const handleVisibility = () => {
    if (document.hidden) {
      stopTimer();
      if (advanceOnEnded) deckVideos.forEach((video) => video.pause());
      return;
    }

    schedule();
    syncEndedPlayback();
  };
  document.addEventListener("visibilitychange", handleVisibility);

  const unsubscribe =
    motion?.subscribe?.(({ allowed: nextAllowed }) => {
      allowed = Boolean(nextAllowed);
      if (!allowed) stopTimer();
      else schedule();
    }) ?? (() => {});

  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(() => {
      fitContent(root);
      if (richTrack && !isGrid()) scrollToIndex("auto");
    });
    resizeObserver.observe(root);
  }

  root.dataset.deckView ||= "slider";
  update({ scroll: false });
  if (richTrack) requestAnimationFrame(() => scrollToIndex("auto"));
  schedule();

  return () => {
    stopTimer();
    prev?.removeEventListener("click", handlePrev);
    next?.removeEventListener("click", handleNext);
    gridButton?.removeEventListener("click", toggleGrid);
    pointerHost.removeEventListener("pointerdown", handlePointerDown);
    pointerHost.removeEventListener("pointermove", handlePointerMove);
    pointerHost.removeEventListener("pointerup", handlePointerUp);
    pointerHost.removeEventListener("pointercancel", handlePointerUp);
    document.removeEventListener("visibilitychange", handleVisibility);
    deckVideos.forEach((video) => {
      video.removeEventListener("ended", handleVideoEnded);
      video.pause();
    });
    resizeObserver?.disconnect();
    unsubscribe();
  };
}

export function createMediaDecks({ root = document, motion } = {}) {
  const destroys = [...root.querySelectorAll("[data-media-deck]")].map((deck) =>
    createMediaDeck(deck, { motion }),
  );
  return () =>
    destroys
      .splice(0)
      .reverse()
      .forEach((destroy) => destroy?.());
}
