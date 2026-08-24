import {
  createEmblaDeck,
  type EmblaDeckController,
} from "./embla-deck.ts";

const pad = (value: number): string => String(value).padStart(2, "0");
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const noop = (): void => {};
const VIEWPORT_MARGIN = "50% 0px";

type MotionState = { allowed: boolean };
type MotionController = {
  allowsMotion?: () => boolean;
  subscribe?: (callback: (state: MotionState) => void) => () => void;
};

type CreateMediaDeckOptions = {
  motion?: MotionController;
};

type CreateMediaDecksOptions = CreateMediaDeckOptions & {
  root?: ParentNode;
};

function fitContent(root: HTMLElement): void {
  const grid = root.dataset.deckView === "grid";
  const maxHeight = grid ? 360 : 620;

  root.querySelectorAll<HTMLElement>("[data-deck-fit-viewport]").forEach((viewport) => {
    const fit = viewport.querySelector<HTMLElement>("[data-deck-fit]");
    if (!fit) return;

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

export function createMediaDeck(
  root: Element,
  { motion }: CreateMediaDeckOptions = {},
): () => void {
  if (!(root instanceof HTMLElement)) return noop;

  const slides = [...root.querySelectorAll<HTMLElement>("[data-slide]")];
  if (slides.length < 2) return noop;

  const captions = [...root.querySelectorAll<HTMLElement>("[data-slide-caption]")];
  const prev = root.querySelector<HTMLElement>("[data-deck-prev]");
  const next = root.querySelector<HTMLElement>("[data-deck-next]");
  const count = root.querySelector<HTMLElement>("[data-deck-count]");
  const gridButton = root.querySelector<HTMLElement>("[data-deck-toggle-grid]");
  const dots = [...root.querySelectorAll<HTMLElement>("[data-deck-dot]")];
  const track = root.querySelector<HTMLElement>("[data-deck-track]");
  const viewport = track?.closest<HTMLElement>("[data-deck-viewport]") || null;
  const richTrack = track instanceof HTMLElement && viewport instanceof HTMLElement;
  const interval = Number(root.dataset.deckInterval) || 5000;
  const autoplayMode = root.dataset.deckAutoplay || "forward";
  const autoplay = autoplayMode !== "off";
  const pingPong = autoplayMode === "ping-pong";
  const advanceOnEnded = root.hasAttribute("data-deck-advance-on-ended");
  const deckVideos = slides.flatMap((slide) =>
    [...slide.querySelectorAll<HTMLVideoElement>("video")],
  );

  let index = Math.max(
    0,
    slides.findIndex((slide) => slide.hasAttribute("data-active")),
  );
  let direction = 1;
  let timer = 0;
  let updateFrame = 0;
  let pointerStart: number | null = null;
  let allowed = motion?.allowsMotion?.() ?? true;
  let nearViewport = typeof IntersectionObserver !== "function";
  let playbackIndex = -1;
  let emblaDeck: EmblaDeckController | null = null;

  const isGrid = (): boolean => root.dataset.deckView === "grid";
  const isActive = (): boolean => allowed && nearViewport && !document.hidden;

  const stopTimer = (): void => {
    window.clearTimeout(timer);
    timer = 0;
  };

  const pauseVideos = (): void => {
    deckVideos.forEach((video) => video.pause());
  };

  const updateDots = (): void => {
    dots.forEach((dot, dotIndex) => {
      const current = dotIndex === index;
      dot.toggleAttribute("data-active", current);
      dot.setAttribute("aria-current", current ? "true" : "false");
    });
  };

  const updateStack = (): void => {
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

  const syncVideoPlayback = (): void => {
    if (!isActive() || isGrid()) {
      pauseVideos();
      return;
    }

    if (advanceOnEnded && !richTrack) {
      slides.forEach((slide, slideIndex) => {
        const videos = [...slide.querySelectorAll<HTMLVideoElement>("video")];

        videos.forEach((video) => {
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

          void video.play().catch(() => {});
        });
      });

      return;
    }

    deckVideos.forEach((video) => {
      if (!video.hasAttribute("autoplay")) {
        if (!video.paused) video.pause();
        return;
      }

      const slide = video.closest("[data-slide]");
      const shouldPlay =
        richTrack ||
        (slide instanceof HTMLElement && slides[index] === slide);

      if (shouldPlay) {
        if (video.paused) void video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    });
  };

  const scrollToIndex = (jump = !allowed): void => {
    if (!emblaDeck || isGrid()) return;
    emblaDeck.scrollToIndex(index, jump);
  };

  const refreshLayout = ({ alignTrack = true } = {}): void => {
    if (!nearViewport) return;

    fitContent(root);

    if (emblaDeck) {
      emblaDeck.reInit({
        active: !isGrid(),
        startIndex: index,
      });
    }

    if (alignTrack && emblaDeck && !isGrid()) {
      scrollToIndex(true);
    }
  };

  const schedulePostUpdate = (): void => {
    if (updateFrame) cancelAnimationFrame(updateFrame);

    updateFrame = requestAnimationFrame(() => {
      updateFrame = 0;

      if (nearViewport) fitContent(root);
      syncVideoPlayback();
    });
  };

  const update = ({ scroll = true } = {}): void => {
    if (!richTrack) updateStack();
    if (count) count.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;

    updateDots();

    if (scroll) scrollToIndex();
    schedulePostUpdate();
  };

  const nextIndex = (step = 1): number => {
    if (pingPong) {
      if (index >= slides.length - 1) direction = -1;
      if (index <= 0) direction = 1;

      return clamp(index + direction, 0, slides.length - 1);
    }

    return (index + step + slides.length) % slides.length;
  };

  const activeSlideHasVideo = (): boolean =>
    advanceOnEnded && slides[index]?.querySelector("video") instanceof HTMLVideoElement;

  const schedule = (): void => {
    stopTimer();

    if (!autoplay || !isActive() || isGrid()) return;

    if (activeSlideHasVideo()) return;

    timer = window.setTimeout(() => {
      index = nextIndex(1);
      update();
      schedule();
    }, interval);
  };

  const syncActivity = ({ refresh = false } = {}): void => {
    if (!isActive()) {
      stopTimer();
      pauseVideos();
      return;
    }

    if (refresh) refreshLayout();

    syncVideoPlayback();
    schedule();
  };

  const goTo = (nextIndexValue: number, { restart = true } = {}): void => {
    if (isGrid()) return;

    index = richTrack
      ? clamp(nextIndexValue, 0, slides.length - 1)
      : (nextIndexValue + slides.length) % slides.length;

    update();

    if (restart) schedule();
  };

  const handleVideoEnded = (event: Event): void => {
    if (!advanceOnEnded || isGrid() || !isActive()) return;

    const slideIndex = slides.findIndex((slide) => slide.contains(event.currentTarget as Node));
    if (slideIndex !== index) return;

    playbackIndex = -1;
    goTo(index + 1);
  };

  if (advanceOnEnded) {
    deckVideos.forEach((video) => {
      video.removeAttribute("loop");
      video.addEventListener("ended", handleVideoEnded);
    });
  }

  const handlePrev = (): void => goTo(index - 1);
  const handleNext = (): void => goTo(index + 1);

  const handlePointerDown = (event: PointerEvent): void => {
    if (isGrid()) return;

    pointerStart = event.clientX;
    stopTimer();
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (pointerStart === null) return;

    const delta = event.clientX - pointerStart;
    pointerStart = null;

    if (Math.abs(delta) > 40) {
      goTo(index + (delta < 0 ? 1 : -1), { restart: false });
    }

    schedule();
  };

  const toggleGrid = (): void => {
    const grid = !isGrid();

    root.dataset.deckView = grid ? "grid" : "slider";
    gridButton?.setAttribute("aria-pressed", String(grid));

    stopTimer();
    update({ scroll: !grid });
    syncActivity({ refresh: true });
  };

  prev?.addEventListener("click", handlePrev);
  next?.addEventListener("click", handleNext);
  gridButton?.addEventListener("click", toggleGrid);

  const dotHandlers = dots.map((dot, dotIndex) => {
    const handler = (): void => goTo(dotIndex);
    dot.addEventListener("click", handler);
    return [dot, handler] as const;
  });

  const pointerHost = richTrack ? null : root;

  pointerHost?.addEventListener("pointerdown", handlePointerDown);
  pointerHost?.addEventListener("pointerup", handlePointerUp);
  pointerHost?.addEventListener("pointercancel", handlePointerUp);

  if (richTrack && viewport) {
    emblaDeck = createEmblaDeck({
      viewport,
      active: !isGrid(),
      startIndex: index,
      onPointerDown: () => {
        if (isGrid()) return;
        root.toggleAttribute("data-deck-dragging", true);
        stopTimer();
      },
      onPointerUp: () => {
        root.removeAttribute("data-deck-dragging");
        schedule();
      },
      onSelect: (selectedIndex) => {
        if (isGrid() || selectedIndex === index) return;

        index = selectedIndex;
        update({ scroll: false });
        schedule();
      },
    });
  }

  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            const wasNearViewport = nearViewport;
            nearViewport = Boolean(entry?.isIntersecting);

            syncActivity({
              refresh: nearViewport && !wasNearViewport,
            });
          },
          {
            rootMargin: VIEWPORT_MARGIN,
            threshold: 0,
          },
        )
      : null;

  intersectionObserver?.observe(root);

  const handleVisibility = (): void => {
    syncActivity({ refresh: !document.hidden });
  };

  document.addEventListener("visibilitychange", handleVisibility);

  const unsubscribe =
    motion?.subscribe?.(({ allowed: nextAllowed }) => {
      allowed = Boolean(nextAllowed);
      syncActivity();
    }) ?? noop;

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          if (!nearViewport) return;
          refreshLayout();
        })
      : null;

  resizeObserver?.observe(root);

  root.dataset.deckView ||= "slider";
  update({ scroll: false });
  syncActivity({ refresh: true });

  return () => {
    stopTimer();

    if (updateFrame) {
      cancelAnimationFrame(updateFrame);
      updateFrame = 0;
    }

    prev?.removeEventListener("click", handlePrev);
    next?.removeEventListener("click", handleNext);
    gridButton?.removeEventListener("click", toggleGrid);

    dotHandlers.forEach(([dot, handler]) => {
      dot.removeEventListener("click", handler);
    });

    pointerHost?.removeEventListener("pointerdown", handlePointerDown);
    pointerHost?.removeEventListener("pointerup", handlePointerUp);
    pointerHost?.removeEventListener("pointercancel", handlePointerUp);

    document.removeEventListener("visibilitychange", handleVisibility);

    if (advanceOnEnded) {
      deckVideos.forEach((video) => {
        video.removeEventListener("ended", handleVideoEnded);
      });
    }

    pauseVideos();
    emblaDeck?.destroy();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    unsubscribe();
  };
}

export function createMediaDecks(
  { root = document, motion }: CreateMediaDecksOptions = {},
): () => void {
  const destroys = [...root.querySelectorAll("[data-media-deck]")].map((deck) =>
    createMediaDeck(deck, { motion }),
  );

  return () =>
    destroys
      .splice(0)
      .reverse()
      .forEach((destroy) => destroy?.());
}
