const TAG_NAME = "awful-tool-preview";
const INSTANCE = Symbol.for("looksawful.awfulToolPreview.instance");

const noop = () => {};

const emptyRuntime = Object.freeze({
  setActive: noop,
  destroy: noop,
});

function setButtonLabel(button, label) {
  const lead = button.querySelector(".btn-u");

  if (!lead) {
    button.textContent = label;
    return;
  }

  lead.textContent = label.slice(0, 1);
  button.replaceChildren(lead, document.createTextNode(label.slice(1)));
}

function readCopyText(target, project) {
  const text = target.textContent.trim();

  if (project !== "awful-cases") {
    return text;
  }

  return text
    .replace(/^C:\\>\s?/gm, "")
    .replace(/^C:\\awful-cases>\s?/gm, "")
    .replace(/^REM\s?/gm, "# ")
    .trim();
}

function enhanceCopyButtons(root, project) {
  const cleanups = [];

  root.querySelectorAll("[data-copy-target]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const originalLabel = button.textContent.trim() || "copy";

    const handleClick = async () => {
      const targetId = button.dataset.copyTarget;
      const target = targetId
        ? root.querySelector(`#${CSS.escape(targetId)}`)
        : null;

      if (!target) {
        return;
      }

      try {
        await navigator.clipboard.writeText(readCopyText(target, project));
        button.classList.add("is-copied");
        setButtonLabel(button, project === "awful-cases" ? "Copied" : "copied");

        window.setTimeout(() => {
          button.classList.remove("is-copied");
          setButtonLabel(button, originalLabel);
        }, 1000);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(target);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    };

    button.addEventListener("click", handleClick);
    cleanups.push(() => button.removeEventListener("click", handleClick));
  });

  return () => cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
}

function isAccordionItemOpen(root) {
  const item = root.closest(".cv-item");
  const header = item?.querySelector(".cv-item__header");

  return (
    !(header instanceof HTMLElement) ||
    header.getAttribute("aria-expanded") === "true"
  );
}

function createPreviewActivation(root, onChange) {
  const item = root.closest(".cv-item");
  const header = item?.querySelector(".cv-item__header");
  const mutationObserver =
    header instanceof HTMLElement ? new MutationObserver(reconcile) : null;
  const intersectionObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries.some(
              (entry) => entry.target === root && entry.isIntersecting,
            );
            reconcile();
          },
          { rootMargin: "120px 0px", threshold: 0.01 },
        )
      : null;

  let visible = !intersectionObserver;
  let active = null;

  function reconcile() {
    const nextActive =
      visible &&
      isAccordionItemOpen(root) &&
      document.visibilityState !== "hidden" &&
      root.isConnected;

    if (nextActive === active) {
      return;
    }

    active = nextActive;
    onChange(active);
  }

  mutationObserver?.observe(header, {
    attributes: true,
    attributeFilter: ["aria-expanded"],
  });
  intersectionObserver?.observe(root);
  document.addEventListener("visibilitychange", reconcile);
  reconcile();

  return () => {
    mutationObserver?.disconnect();
    intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", reconcile);
    onChange(false);
  };
}

function enhanceLazyFrames(root) {
  const frames = [...root.querySelectorAll("[data-awful-frame-src]")].filter(
    (frame) => frame instanceof HTMLIFrameElement,
  );

  if (frames.length === 0) {
    return emptyRuntime;
  }

  return {
    setActive(active) {
      if (!active) {
        return;
      }

      frames.forEach((frame) => {
        if (frame.src || !frame.dataset.awfulFrameSrc) {
          return;
        }

        frame.src = frame.dataset.awfulFrameSrc;
      });
    },
    destroy: noop,
  };
}

function fitBerserkScreens(gallery) {
  const isGrid = gallery.classList.contains("is-grid");

  gallery.querySelectorAll(".screen-body").forEach((body) => {
    const fit = body.querySelector(".fit");

    if (!(fit instanceof HTMLElement)) {
      return;
    }

    fit.style.setProperty("--fit-scale", 1);
    body.style.setProperty("--fit-height", "auto");

    const width = Math.max(1, body.clientWidth);
    const maxHeight = isGrid ? 360 : 620;
    const scale = Math.min(1, width / fit.scrollWidth, maxHeight / fit.scrollHeight);

    fit.style.setProperty("--fit-scale", scale);
    body.style.setProperty("--fit-height", `${Math.ceil(fit.scrollHeight * scale)}px`);
  });
}

function enhanceBerserkGallery(gallery) {
  const viewport = gallery.querySelector(".viewport");
  const track = gallery.querySelector("[data-track]");
  const gridButton = gallery.querySelector("[data-toggle-grid]");
  const previousButton = gallery.querySelector("[data-prev]");
  const nextButton = gallery.querySelector("[data-next]");
  const dotsHost = gallery.querySelector("[data-slide-dots]");
  const slides = [...gallery.querySelectorAll(".slide")];

  if (
    !(viewport instanceof HTMLElement) ||
    !(track instanceof HTMLElement) ||
    !(dotsHost instanceof HTMLElement) ||
    slides.length === 0
  ) {
    return emptyRuntime;
  }

  const cleanups = [];
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let slideIndex = 0;
  let slideDirection = 1;
  let autoTimer = 0;
  let active = false;
  let dragging = false;
  let startX = 0;
  let startLeft = 0;

  const isGrid = () => gallery.classList.contains("is-grid");
  const getStep = () => Math.max(1, viewport.clientWidth);

  function stopAuto() {
    if (!autoTimer) {
      return;
    }

    window.clearInterval(autoTimer);
    autoTimer = 0;
  }

  function updateDots() {
    dotsHost
      .querySelectorAll(".slide-dot")
      .forEach((dot, index) => dot.classList.toggle("is-active", index === slideIndex));
  }

  function pulse(button) {
    if (!(button instanceof HTMLElement)) {
      return;
    }

    button.classList.add("is-pulse");
    window.setTimeout(() => button.classList.remove("is-pulse"), 700);
  }

  function goTo(index, button) {
    if (isGrid()) {
      return;
    }

    slideIndex = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({
      left: slideIndex * getStep(),
      behavior: prefersReducedMotion?.matches ? "auto" : "smooth",
    });
    updateDots();
    pulse(button);
  }

  function autoMove() {
    if (isGrid()) {
      return;
    }

    if (slideIndex >= slides.length - 1) {
      slideDirection = -1;
    }

    if (slideIndex <= 0) {
      slideDirection = 1;
    }

    goTo(slideIndex + slideDirection, slideDirection > 0 ? nextButton : previousButton);
  }

  function startAuto() {
    stopAuto();

    if (!active || prefersReducedMotion?.matches) {
      return;
    }

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
      dot.className = "slide-dot";
      dot.setAttribute("aria-label", `slide ${index + 1}`);

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

  const refit = () => {
    window.requestAnimationFrame(() => {
      fitBerserkScreens(gallery);

      if (!isGrid()) {
        track.scrollLeft = slideIndex * getStep();
      }
    });
  };

  const handleGridClick = () => {
    gallery.classList.toggle("is-grid");
    gridButton?.classList.toggle("is-active", isGrid());
    gridButton?.setAttribute("aria-pressed", String(isGrid()));
    stopAuto();
    refit();

    if (!isGrid()) {
      startAuto();
    }
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
    if (isGrid()) {
      return;
    }

    dragging = true;
    startX = event.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
    stopAuto();
  };

  const handlePointerMove = (event) => {
    if (!dragging) {
      return;
    }

    track.scrollLeft = startLeft - (event.clientX - startX);
  };

  const handlePointerUp = () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    track.classList.remove("is-dragging");
    slideIndex = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / getStep())));
    goTo(slideIndex);
    restartAuto();
  };

  const handleScroll = () => {
    if (isGrid()) {
      return;
    }

    window.clearTimeout(track._awfulBerserkScrollTimer);
    track._awfulBerserkScrollTimer = window.setTimeout(() => {
      slideIndex = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / getStep())));
      updateDots();
    }, 80);
  };

  gridButton?.addEventListener("click", handleGridClick);
  previousButton?.addEventListener("click", handlePreviousClick);
  nextButton?.addEventListener("click", handleNextClick);
  track.addEventListener("pointerdown", handlePointerDown);
  track.addEventListener("pointermove", handlePointerMove);
  track.addEventListener("pointerup", handlePointerUp);
  track.addEventListener("pointercancel", handlePointerUp);
  track.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", refit);

  cleanups.push(() => gridButton?.removeEventListener("click", handleGridClick));
  cleanups.push(() => previousButton?.removeEventListener("click", handlePreviousClick));
  cleanups.push(() => nextButton?.removeEventListener("click", handleNextClick));
  cleanups.push(() => track.removeEventListener("pointerdown", handlePointerDown));
  cleanups.push(() => track.removeEventListener("pointermove", handlePointerMove));
  cleanups.push(() => track.removeEventListener("pointerup", handlePointerUp));
  cleanups.push(() => track.removeEventListener("pointercancel", handlePointerUp));
  cleanups.push(() => track.removeEventListener("scroll", handleScroll));
  cleanups.push(() => window.removeEventListener("resize", refit));
  cleanups.push(stopAuto);

  const resizeObserver =
    "ResizeObserver" in window
      ? new ResizeObserver(refit)
      : null;

  resizeObserver?.observe(gallery);
  cleanups.push(() => resizeObserver?.disconnect());

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

      if (!isGrid()) {
        startAuto();
      }
    },
    destroy() {
      cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    },
  };
}

function enhanceBerserkMusicPlayer(player) {
  const audio = player.querySelector("[data-music-audio]");
  const playButton = player.querySelector("[data-music-play]");
  const progress = player.querySelector("[data-music-progress]");
  const progressFill = progress?.querySelector("span");
  const current = player.querySelector("[data-music-current]");
  const duration = player.querySelector("[data-music-duration]");
  const volume = player.querySelector("[data-music-volume]");
  const volumeFill = volume?.querySelector("span");
  const volumeText = player.querySelector("[data-music-volume-text]");
  const status = player.querySelector("[data-music-status]");
  const soundButtons = [...player.querySelectorAll("[data-sound]")];

  if (!(audio instanceof HTMLAudioElement) || !(playButton instanceof HTMLButtonElement)) {
    return emptyRuntime;
  }

  const cleanups = [];
  const base = "https://cdn.jsdelivr.net/gh/looksawful/berserk-timer@dev/assets/";
  const fallbackBase = "https://raw.githubusercontent.com/looksawful/berserk-timer/dev/assets/";
  let volumeValue = 0.5;
  let currentSound = "alert1.wav";
  let usingFallback = false;

  const formatTime = (value) => {
    if (!Number.isFinite(value)) {
      return "00:00";
    }

    const seconds = Math.max(0, Math.floor(value));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };

  function setPlayIcon(isPlaying) {
    playButton.classList.toggle("is-active", isPlaying);
    playButton.innerHTML = isPlaying
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.8c0-.9 1-1.43 1.74-.94l9.2 6.13c.67.45.67 1.43 0 1.88l-9.2 6.13C9 19.49 8 18.96 8 18.06V5.8Z"/></svg>';
  }

  function syncProgress() {
    if (progressFill instanceof HTMLElement) {
      progressFill.style.width = `${audio.duration ? (audio.currentTime / audio.duration) * 100 : 0}%`;
    }

    if (current) {
      current.textContent = formatTime(audio.currentTime);
    }

    if (duration) {
      duration.textContent = formatTime(audio.duration);
    }
  }

  function syncVolume() {
    audio.volume = volumeValue;

    if (volumeFill instanceof HTMLElement) {
      volumeFill.style.width = `${volumeValue * 100}%`;
    }

    if (volumeText) {
      volumeText.textContent = `${Math.round(volumeValue * 10)}/10`;
    }
  }

  function setStatus(value) {
    if (status) {
      status.textContent = value;
    }
  }

  function unloadSound() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setPlayIcon(false);
    syncProgress();
  }

  function selectSound(name) {
    usingFallback = false;
    currentSound = name || currentSound;
    soundButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.sound === name));
    unloadSound();
    setStatus("ready");
  }

  function loadSelectedSound() {
    if (audio.src) {
      return;
    }

    usingFallback = false;
    audio.src = `${base}${currentSound}`;
    audio.load();
    setStatus("loading");
    syncProgress();
  }

  const handlePlay = async () => {
    if (audio.paused) {
      try {
        loadSelectedSound();
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
    if (!audio.duration || !(progress instanceof HTMLElement)) {
      return;
    }

    const rect = progress.getBoundingClientRect();
    audio.currentTime = ((event.clientX - rect.left) / rect.width) * audio.duration;
  };

  const handleVolumeClick = (event) => {
    if (!(volume instanceof HTMLElement)) {
      return;
    }

    const rect = volume.getBoundingClientRect();
    volumeValue = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
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
      usingFallback = true;
      audio.src = `${fallbackBase}${currentSound}`;
      audio.load();
      setStatus("fallback");
      return;
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
      selectSound(button.dataset.sound);

      if (wasPlaying) {
        void handlePlay();
      }
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

function enhanceBerserkTimer(root) {
  const runtimes = [
    ...[...root.querySelectorAll("[data-gallery]")].map(enhanceBerserkGallery),
    ...[...root.querySelectorAll("[data-music-player]")].map(enhanceBerserkMusicPlayer),
  ];

  return {
    setActive(active) {
      runtimes.forEach((runtime) => runtime.setActive(active));
    },
    destroy() {
      runtimes.splice(0).reverse().forEach((runtime) => runtime.destroy());
    },
  };
}

function enhanceAwfulToolPreview(root) {
  const project = root.getAttribute("project") || root.dataset.awfulTool || "";
  const cleanups = [enhanceCopyButtons(root, project)];
  const activeRuntimes = [];

  if (project === "awful-cases") {
    activeRuntimes.push(enhanceLazyFrames(root));
  }

  if (project === "berserk-timer") {
    activeRuntimes.push(enhanceBerserkTimer(root));
  }

  if (activeRuntimes.length > 0) {
    cleanups.push(
      createPreviewActivation(root, (active) => {
        activeRuntimes.forEach((runtime) => runtime.setActive(active));
      }),
    );
    cleanups.push(() => {
      activeRuntimes.splice(0).reverse().forEach((runtime) => runtime.destroy());
    });
  }

  root.dataset.awfulToolReady = "";

  return {
    destroy() {
      root.removeAttribute("data-awful-tool-ready");
      cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    },
  };
}

class AwfulToolPreview extends HTMLElement {
  connectedCallback() {
    this[INSTANCE]?.destroy();
    this[INSTANCE] = enhanceAwfulToolPreview(this);
  }

  disconnectedCallback() {
    this[INSTANCE]?.destroy();
    delete this[INSTANCE];
  }
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, AwfulToolPreview);
}

export { AwfulToolPreview };
