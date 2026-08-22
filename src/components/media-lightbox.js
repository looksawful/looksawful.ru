const SOURCE_SELECTOR = "[data-lightbox-source]";
const EXCLUDED_SELECTOR = ".before-after, [data-page-flip], [data-lightbox=\"off\"]";

function mediaFor(source) {
  if (!(source instanceof HTMLElement)) return null;
  if (source.classList.contains("mockup__viewport")) {
    return source.querySelector("[data-slide][data-active] img, [data-slide][data-active] video, img, video");
  }
  return source.querySelector("img, video");
}

function mediaUrl(media) {
  if (media instanceof HTMLImageElement) return media.currentSrc || media.src || "";
  if (!(media instanceof HTMLVideoElement)) return "";
  return media.currentSrc || media.src || media.querySelector("source[src]")?.getAttribute("src") || "";
}

function captionNodeFor(source) {
  const figure = source.closest("figure");
  if (!(figure instanceof HTMLElement)) return null;
  const activeSlideCaption =
    figure.querySelector(":scope > .media__caption [data-slide-caption][data-active]") ||
    figure.querySelector(":scope > .media__caption [data-slide-caption]");
  if (activeSlideCaption instanceof HTMLElement) return activeSlideCaption;
  const directCaption = figure.querySelector(":scope > figcaption.media__caption");
  return directCaption instanceof HTMLElement ? directCaption : null;
}

function renderCaption(host, source) {
  if (!(host instanceof HTMLElement)) return;
  host.replaceChildren();
  const caption = captionNodeFor(source);
  if (!caption) return;
  const line = caption.matches(".media__caption-line") ? caption : caption.querySelector(".media__caption-line") || caption;
  [...line.children].forEach((child) => {
    if (child instanceof Element) host.append(child.cloneNode(true));
  });
  if (!host.children.length) {
    const text = line.textContent?.replace(/\s+/g, " ").trim() || "";
    if (text) host.textContent = text;
  }
}

function sourcesFor(source) {
  const scope = source.closest(".media-group, .project__section, .project") || document;
  const seen = new Set();
  return [...scope.querySelectorAll(SOURCE_SELECTOR)].filter((candidate) => {
    const media = mediaFor(candidate);
    if (!(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)) return false;
    const key = mediaUrl(media);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function markLightboxSources(root = document) {
  root.querySelectorAll(".media__surface, .mockup__viewport").forEach((surface) => {
    if (!(surface instanceof HTMLElement)) return;
    if (surface.closest(EXCLUDED_SELECTOR)) return;
    if (surface.classList.contains("media__surface") && surface.closest(".mockup__viewport")) return;
    const media = mediaFor(surface);
    if (!(media instanceof HTMLVideoElement || media instanceof HTMLImageElement)) return;
    surface.setAttribute("data-lightbox-source", "");
    if (!surface.hasAttribute("tabindex")) surface.tabIndex = 0;
    surface.setAttribute("role", "button");
    surface.setAttribute("aria-label", "Открыть медиа");
  });
}

export function createMediaLightbox({ root = document } = {}) {
  const dialog = document.querySelector("[data-media-lightbox]");
  if (!(dialog instanceof HTMLDialogElement)) return () => {};
  const image = dialog.querySelector("[data-lightbox-image]");
  const video = dialog.querySelector("[data-lightbox-video]");
  const caption = dialog.querySelector("[data-lightbox-caption]");
  const prev = dialog.querySelector("[data-lightbox-prev]");
  const next = dialog.querySelector("[data-lightbox-next]");
  const close = dialog.querySelector("[data-lightbox-close]");
  let currentSources = [];
  let index = 0;
  let restoreFocus = null;
  let pointerX = null;

  const resetVideo = () => {
    if (!(video instanceof HTMLVideoElement)) return;
    video.pause();
    video.removeAttribute("src");
    video.removeAttribute("poster");
    video.load();
    video.hidden = true;
  };

  const render = () => {
    const source = currentSources[index];
    const media = mediaFor(source);
    if (!media) return;
    if (image instanceof HTMLImageElement) {
      image.hidden = true;
      image.removeAttribute("src");
    }
    resetVideo();

    if (media instanceof HTMLVideoElement && video instanceof HTMLVideoElement) {
      const src = mediaUrl(media);
      if (!src) return;
      video.src = src;
      video.poster = media.poster || "";
      video.controls = true;
      video.loop = media.loop;
      video.muted = false;
      video.defaultMuted = false;
      video.playsInline = true;
      video.preload = "auto";
      video.hidden = false;
      video.load();
      const resumeAt = Number.isFinite(media.currentTime) ? media.currentTime : 0;
      const play = () => {
        try {
          if (resumeAt > 0 && video.duration > resumeAt) video.currentTime = resumeAt;
        } catch {}
        video.play().catch(() => {});
      };
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) play();
      else video.addEventListener("loadedmetadata", play, { once: true });
    } else if (media instanceof HTMLImageElement && image instanceof HTMLImageElement) {
      image.src = mediaUrl(media);
      image.alt = media.alt || "";
      image.hidden = false;
    }

    renderCaption(caption, source);
    if (prev instanceof HTMLButtonElement) prev.disabled = currentSources.length < 2;
    if (next instanceof HTMLButtonElement) next.disabled = currentSources.length < 2;
  };

  const move = (step) => {
    if (currentSources.length < 2) return;
    index = (index + step + currentSources.length) % currentSources.length;
    render();
  };

  const open = (source) => {
    currentSources = sourcesFor(source);
    const selectedKey = mediaUrl(mediaFor(source));
    index = Math.max(0, currentSources.findIndex((candidate) => mediaUrl(mediaFor(candidate)) === selectedKey));
    restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    render();
    close?.focus();
  };

  const closeDialog = () => {
    resetVideo();
    if (dialog.open) dialog.close();
    restoreFocus?.focus?.();
    restoreFocus = null;
  };

  const handleClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest("a, button, input, select, textarea")) return;
    const source = target.closest(SOURCE_SELECTOR);
    if (!(source instanceof HTMLElement)) return;
    event.preventDefault();
    open(source);
  };
  const handleSourceKey = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const source = event.target instanceof Element ? event.target.closest(SOURCE_SELECTOR) : null;
    if (!(source instanceof HTMLElement)) return;
    event.preventDefault();
    open(source);
  };
  const handleDialogKey = (event) => {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  };
  const handleBackdrop = (event) => {
    if (event.target === dialog) closeDialog();
  };
  const handlePointerDown = (event) => {
    if (event.pointerType !== "mouse") pointerX = event.clientX;
  };
  const handlePointerUp = (event) => {
    if (pointerX === null) return;
    const delta = event.clientX - pointerX;
    pointerX = null;
    if (Math.abs(delta) > 48) move(delta < 0 ? 1 : -1);
  };

  prev?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));
  close?.addEventListener("click", closeDialog);
  dialog.addEventListener("click", handleBackdrop);
  dialog.addEventListener("keydown", handleDialogKey);
  dialog.addEventListener("pointerdown", handlePointerDown);
  dialog.addEventListener("pointerup", handlePointerUp);
  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleSourceKey);
  markLightboxSources(root);

  return () => {
    closeDialog();
    root.removeEventListener("click", handleClick);
    root.removeEventListener("keydown", handleSourceKey);
    dialog.removeEventListener("click", handleBackdrop);
    dialog.removeEventListener("keydown", handleDialogKey);
    dialog.removeEventListener("pointerdown", handlePointerDown);
    dialog.removeEventListener("pointerup", handlePointerUp);
  };
}
