const noop = () => {};

const emptyRuntime = Object.freeze({
  setActive: noop,
  destroy: noop,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createActivation(root, onChange, accordionRuntime) {
  let active = null;

  function commit(nextActive) {
    const normalized = Boolean(nextActive && root.isConnected);
    if (normalized === active) return;
    active = normalized;
    onChange(active);
  }

  if (accordionRuntime?.subscribeScene) {
    const unsubscribeScene = accordionRuntime.subscribeScene(root, (state) => {
      commit(state.active && state.documentVisible);
    });

    return () => {
      unsubscribeScene();
      commit(false);
    };
  }

  const syncDocumentVisibility = () => {
    commit(document.visibilityState !== "hidden");
  };

  document.addEventListener("visibilitychange", syncDocumentVisibility);
  syncDocumentVisibility();

  return () => {
    document.removeEventListener("visibilitychange", syncDocumentVisibility);
    commit(false);
  };
}

function enhanceCopyButtons(root) {
  const cleanups = [];

  root.querySelectorAll("[data-berserk-copy-target]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;

    const key = button.dataset.berserkCopyTarget;
    const source = key
      ? root.querySelector(
          `[data-berserk-copy-source="${CSS.escape(key)}"]`,
        )
      : null;

    if (!(source instanceof HTMLElement)) return;

    const originalLabel = button.textContent.trim() || "copy";
    let resetTimer = 0;

    const setLabel = (value) => {
      button.textContent = value;
      button.setAttribute(
        "aria-label",
        value === "copied" ? "Команда скопирована" : "Скопировать команду",
      );
    };

    const reset = () => {
      window.clearTimeout(resetTimer);
      button.classList.remove("is-copied");
      setLabel(originalLabel);
    };

    const selectFallback = () => {
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    };

    const handleClick = async () => {
      const value = source.textContent.trim();

      try {
        await navigator.clipboard.writeText(value);
        button.classList.add("is-copied");
        setLabel("copied");
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(reset, 1000);
      } catch {
        selectFallback();
      }
    };

    button.addEventListener("click", handleClick);
    cleanups.push(() => {
      window.clearTimeout(resetTimer);
      button.removeEventListener("click", handleClick);
    });
  });

  return () => cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
}

function fitScreens(gallery) {
  const isGrid = gallery.classList.contains("is-grid");
  const maxHeight = isGrid ? 360 : 620;

  gallery.querySelectorAll("[data-berserk-screen-body]").forEach((body) => {
    const fit = body.querySelector("[data-berserk-fit]");
    if (!(body instanceof HTMLElement) || !(fit instanceof HTMLElement)) return;

    fit.style.setProperty("--fit-scale", 1);
    body.style.setProperty("--fit-height", "auto");

    const width = Math.max(1, body.clientWidth);
    const fitWidth = Math.max(1, fit.scrollWidth);
    const fitHeight = Math.max(1, fit.scrollHeight);
    const scale = Math.min(1, width / fitWidth, maxHeight / fitHeight);

    fit.style.setProperty("--fit-scale", scale);
    body.style.setProperty(
      "--fit-height",
      `${Math.ceil(fitHeight * scale)}px`,
    );
  });
}

function enhanceGallery(gallery) {
  const viewport = gallery.querySelector("[data-berserk-viewport]");
  const track = gallery.querySelector("[data-berserk-track]");
  const gridButton = gallery.querySelector("[data-berserk-toggle-grid]");
  const previousButton = gallery.querySelector("[data-berserk-prev]");
  const nextButton = gallery.querySelector("[data-berserk-next]");
  const dotsHost = gallery.querySelector("[data-berserk-dots]");
  const slides = [...gallery.querySelectorAll("[data-berserk-slide]")];

  if (
    !(viewport instanceof HTMLElement) ||
    !(track instanceof HTMLElement) ||
    !(dotsHost instanceof HTMLElement) ||
    slides.length === 0
  ) {
    return emptyRuntime;
  }

  const cleanups = [];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  let slideIndex = 0;
  let slideDirection = 1;
  let autoTimer = 0;
  let scrollTimer = 0;
  let active = false;
  let dragging = false;
  let startX = 0;
  let startLeft = 0;

  const isGrid = () => gallery.classList.contains("is-grid");

  function stopAuto() {
    if (!autoTimer) return;
    window.clearInterval(autoTimer);
    autoTimer = 0;
  }

  function getSlideLeft(index) {
    const slide = slides[index];
    if (!(slide instanceof HTMLElement)) return 0;

    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    return track.scrollLeft + slideRect.left - trackRect.left;
  }

  function findClosestSlide() {
    const trackLeft = track.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - trackLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function updateDots() {
    dotsHost.querySelectorAll("[data-berserk-dot]").forEach((dot, index) => {
      const current = index === slideIndex;
      dot.classList.toggle("is-active", current);
      dot.setAttribute("aria-current", current ? "true" : "false");
    });
  }

  function pulse(button) {
    if (!(button instanceof HTMLElement)) return;
    button.classList.add("is-pulse");
    window.setTimeout(() => button.classList.remove("is-pulse"), 700);
  }

  function goTo(index, sourceButton = null) {
    if (isGrid()) return;

    slideIndex = clamp(index, 0, slides.length - 1);
    track.scrollTo({
      left: getSlideLeft(slideIndex),
      behavior: reducedMotion?.matches ? "auto" : "smooth",
    });
    updateDots();
    pulse(sourceButton);
  }

  function autoMove() {
    if (isGrid()) return;

    if (slideIndex >= slides.length - 1) slideDirection = -1;
    if (slideIndex <= 0) slideDirection = 1;

    goTo(
      slideIndex + slideDirection,
      slideDirection > 0 ? nextButton : previousButton,
    );
  }

  function startAuto() {
    stopAuto();
    if (!active || isGrid() || reducedMotion?.matches) return;
    autoTimer = window.setInterval(autoMove, 10000);
  }

  function restartAuto() {
    startAuto();
  }

  function buildDots() {
    dotsHost.replaceChildren();

    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "berserk-timer-gallery__dot";
      dot.dataset.berserkDot = "";
      dot.setAttribute("aria-label", `Экран ${index + 1}`);

      const handleClick = () => {
        goTo(index, dot);
        restartAuto();
      };

      dot.addEventListener("click", handleClick);
      cleanups.push(() => dot.removeEventListener("click", handleClick));
      dotsHost.append(dot);
    });

    updateDots();
  }

  function refit() {
    window.requestAnimationFrame(() => {
      fitScreens(gallery);
      if (!isGrid()) track.scrollLeft = getSlideLeft(slideIndex);
    });
  }

  const handleGridClick = () => {
    gallery.classList.toggle("is-grid");
    const grid = isGrid();
    gridButton?.classList.toggle("is-active", grid);
    gridButton?.setAttribute("aria-pressed", String(grid));
    stopAuto();
    refit();
    if (!grid) startAuto();
  };

  const handlePreviousClick = () => {
    goTo(slideIndex - 1, previousButton);
    restartAuto();
  };

  const handleNextClick = () => {
    goTo(slideIndex + 1, nextButton);
    restartAuto();
  };

  const handlePointerDown = (event) => {
    if (isGrid()) return;
    dragging = true;
    startX = event.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
    stopAuto();
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    track.scrollLeft = startLeft - (event.clientX - startX);
  };

  const handlePointerUp = (event) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    track.releasePointerCapture?.(event.pointerId);
    slideIndex = findClosestSlide();
    goTo(slideIndex);
    restartAuto();
  };

  const handleScroll = () => {
    if (isGrid() || dragging) return;
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      slideIndex = findClosestSlide();
      updateDots();
    }, 80);
  };

  const handleReducedMotionChange = () => {
    if (reducedMotion?.matches) stopAuto();
    else startAuto();
  };

  gridButton?.addEventListener("click", handleGridClick);
  previousButton?.addEventListener("click", handlePreviousClick);
  nextButton?.addEventListener("click", handleNextClick);
  track.addEventListener("pointerdown", handlePointerDown);
  track.addEventListener("pointermove", handlePointerMove);
  track.addEventListener("pointerup", handlePointerUp);
  track.addEventListener("pointercancel", handlePointerUp);
  track.addEventListener("scroll", handleScroll, { passive: true });
  reducedMotion?.addEventListener?.("change", handleReducedMotionChange);

  cleanups.push(() => gridButton?.removeEventListener("click", handleGridClick));
  cleanups.push(() => previousButton?.removeEventListener("click", handlePreviousClick));
  cleanups.push(() => nextButton?.removeEventListener("click", handleNextClick));
  cleanups.push(() => track.removeEventListener("pointerdown", handlePointerDown));
  cleanups.push(() => track.removeEventListener("pointermove", handlePointerMove));
  cleanups.push(() => track.removeEventListener("pointerup", handlePointerUp));
  cleanups.push(() => track.removeEventListener("pointercancel", handlePointerUp));
  cleanups.push(() => track.removeEventListener("scroll", handleScroll));
  cleanups.push(() =>
    reducedMotion?.removeEventListener?.("change", handleReducedMotionChange),
  );
  cleanups.push(() => window.clearTimeout(scrollTimer));
  cleanups.push(stopAuto);

  const resizeObserver =
    "ResizeObserver" in window ? new ResizeObserver(refit) : null;

  if (resizeObserver) {
    resizeObserver.observe(viewport);
    cleanups.push(() => resizeObserver.disconnect());
  } else {
    window.addEventListener("resize", refit);
    cleanups.push(() => window.removeEventListener("resize", refit));
  }

  buildDots();
  refit();

  return {
    setActive(nextActive) {
      active = nextActive;
      if (!active) {
        stopAuto();
        return;
      }
      refit();
      startAuto();
    },
    destroy() {
      cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    },
  };
}

function enhancePlayer(caseRoot, player) {
  const audio = player.querySelector("[data-berserk-audio]");
  const playButton = player.querySelector("[data-berserk-play]");
  const progress = player.querySelector("[data-berserk-progress]");
  const progressFill = player.querySelector("[data-berserk-progress-fill]");
  const current = player.querySelector("[data-berserk-current]");
  const duration = player.querySelector("[data-berserk-duration]");
  const volume = player.querySelector("[data-berserk-volume]");
  const volumeFill = player.querySelector("[data-berserk-volume-fill]");
  const volumeText = player.querySelector("[data-berserk-volume-text]");
  const status = player.querySelector("[data-berserk-status]");
  const soundButtons = [
    ...player.querySelectorAll("[data-berserk-sound]"),
  ];

  if (
    !(audio instanceof HTMLAudioElement) ||
    !(playButton instanceof HTMLButtonElement) ||
    soundButtons.length === 0
  ) {
    return emptyRuntime;
  }

  const base = caseRoot.dataset.berserkAudioBase?.trim() ?? "";
  const fallbackBase =
    caseRoot.dataset.berserkAudioFallbackBase?.trim() ?? "";
  const cleanups = [];

  let volumeValue = 0.5;
  let currentSound =
    soundButtons.find((button) => button.classList.contains("is-active"))
      ?.dataset.berserkSound ?? soundButtons[0].dataset.berserkSound ?? "";
  let usingFallback = false;

  const resolveSource = (sourceBase, name) => {
    if (!sourceBase || !name) return "";
    return `${sourceBase.replace(/\/?$/, "/")}${name}`;
  };

  const formatTime = (value) => {
    if (!Number.isFinite(value)) return "00:00";
    const seconds = Math.max(0, Math.floor(value));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
      seconds % 60,
    ).padStart(2, "0")}`;
  };

  const playIcon = playButton.querySelector("[data-berserk-icon-play]");
  const pauseIcon = playButton.querySelector("[data-berserk-icon-pause]");

  function setPlayIcon(isPlaying) {
    playButton.classList.toggle("is-active", isPlaying);
    playButton.setAttribute("aria-pressed", String(isPlaying));
    if (playIcon instanceof SVGElement) playIcon.hidden = isPlaying;
    if (pauseIcon instanceof SVGElement) pauseIcon.hidden = !isPlaying;
  }

  function syncProgress() {
    if (progressFill instanceof HTMLElement) {
      progressFill.style.inlineSize = `${
        audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
      }%`;
    }
    if (current) current.textContent = formatTime(audio.currentTime);
    if (duration) duration.textContent = formatTime(audio.duration);
  }

  function syncVolume() {
    audio.volume = volumeValue;
    if (volumeFill instanceof HTMLElement) {
      volumeFill.style.inlineSize = `${volumeValue * 100}%`;
    }
    if (volumeText) {
      volumeText.textContent = `${Math.round(volumeValue * 10)}/10`;
    }
  }

  function setStatus(value) {
    if (status) status.textContent = value;
  }

  function unloadSound() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setPlayIcon(false);
    syncProgress();
  }

  function selectSound(name) {
    if (!name) return;
    usingFallback = false;
    currentSound = name;

    soundButtons.forEach((button) => {
      const selected = button.dataset.berserkSound === currentSound;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    unloadSound();
    setStatus("ready");
  }

  function loadSelectedSound() {
    if (audio.src) return true;
    const source = resolveSource(base, currentSound);
    if (!source) {
      setStatus("file not loaded");
      return false;
    }

    usingFallback = false;
    audio.src = source;
    audio.load();
    setStatus("loading");
    syncProgress();
    return true;
  }

  const handlePlay = async () => {
    if (audio.paused) {
      if (!loadSelectedSound()) return;
      try {
        await audio.play();
        setPlayIcon(true);
        setStatus("playing");
      } catch {
        setStatus("click again");
      }
      return;
    }

    audio.pause();
    setPlayIcon(false);
    setStatus("paused");
  };

  const handleProgressClick = (event) => {
    if (!audio.duration || !(progress instanceof HTMLElement)) return;
    const rect = progress.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    audio.currentTime = ratio * audio.duration;
  };

  const handleVolumeClick = (event) => {
    if (!(volume instanceof HTMLElement)) return;
    const rect = volume.getBoundingClientRect();
    if (!rect.width) return;
    volumeValue = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    syncVolume();
  };

  const handleAudioReady = () => {
    setStatus("ready");
    syncProgress();
  };

  const handleAudioEnded = () => {
    setPlayIcon(false);
    setStatus("ended");
    syncProgress();
  };

  const handleAudioError = () => {
    if (!usingFallback) {
      const fallback = resolveSource(fallbackBase, currentSound);
      if (fallback) {
        usingFallback = true;
        audio.src = fallback;
        audio.load();
        setStatus("fallback");
        return;
      }
    }
    setStatus("file not loaded");
  };

  playButton.addEventListener("click", handlePlay);
  progress?.addEventListener("click", handleProgressClick);
  volume?.addEventListener("click", handleVolumeClick);
  audio.addEventListener("loadedmetadata", handleAudioReady);
  audio.addEventListener("timeupdate", syncProgress);
  audio.addEventListener("ended", handleAudioEnded);
  audio.addEventListener("error", handleAudioError);

  cleanups.push(() => playButton.removeEventListener("click", handlePlay));
  cleanups.push(() => progress?.removeEventListener("click", handleProgressClick));
  cleanups.push(() => volume?.removeEventListener("click", handleVolumeClick));
  cleanups.push(() => audio.removeEventListener("loadedmetadata", handleAudioReady));
  cleanups.push(() => audio.removeEventListener("timeupdate", syncProgress));
  cleanups.push(() => audio.removeEventListener("ended", handleAudioEnded));
  cleanups.push(() => audio.removeEventListener("error", handleAudioError));

  soundButtons.forEach((button) => {
    const handleSoundClick = () => {
      const wasPlaying = !audio.paused;
      selectSound(button.dataset.berserkSound);
      if (wasPlaying) void handlePlay();
    };

    button.addEventListener("click", handleSoundClick);
    cleanups.push(() => button.removeEventListener("click", handleSoundClick));
  });

  audio.preload = "none";
  selectSound(currentSound);
  syncVolume();

  return {
    setActive(active) {
      if (!active && !audio.paused) {
        audio.pause();
        setPlayIcon(false);
        setStatus("paused");
      }
    },
    destroy() {
      unloadSound();
      cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    },
  };
}

export function createBerserkTimerCase(
  root,
  { accordionRuntime = null } = {},
) {
  if (!(root instanceof HTMLElement)) return emptyRuntime;

  const cleanups = [enhanceCopyButtons(root)];
  const activeRuntimes = [
    ...[...root.querySelectorAll("[data-berserk-gallery]")].map(
      enhanceGallery,
    ),
    ...[...root.querySelectorAll("[data-berserk-player]")].map((player) =>
      enhancePlayer(root, player),
    ),
  ];

  cleanups.push(() => {
    activeRuntimes.splice(0).reverse().forEach((runtime) => runtime.destroy());
  });

  cleanups.push(
    createActivation(
      root,
      (active) => {
        activeRuntimes.forEach((runtime) => runtime.setActive(active));
      },
      accordionRuntime,
    ),
  );

  root.dataset.berserkTimerReady = "";

  return {
    setActive(active) {
      activeRuntimes.forEach((runtime) => runtime.setActive(active));
    },
    destroy() {
      root.removeAttribute("data-berserk-timer-ready");
      cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    },
  };
}

export function createBerserkTimerCases({
  root = document,
  accordionRuntime = null,
} = {}) {
  if (!root || typeof root.querySelectorAll !== "function") return noop;

  const runtimes = [...root.querySelectorAll("[data-berserk-timer-case]")].map(
    (caseRoot) => createBerserkTimerCase(caseRoot, { accordionRuntime }),
  );

  return () => {
    runtimes.splice(0).reverse().forEach((runtime) => runtime.destroy());
  };
}
