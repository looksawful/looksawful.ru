const SOURCE_SELECTOR = "[data-lightbox-source]";
const EXCLUDED_SELECTOR = ".before-after, [data-page-flip], [data-lightbox=\"off\"]";
const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, [contenteditable], video[controls]";
const SUPPLEMENTAL_CAPTION_SELECTOR = "[data-lightbox-caption-copy]";

type LightboxRoot = ParentNode & EventTarget;
type LightboxMedia = HTMLImageElement | HTMLVideoElement;

function mediaFor(source: HTMLElement): LightboxMedia | null {
  return source.querySelector<HTMLImageElement | HTMLVideoElement>(
    "[data-slide][data-active] img, [data-slide][data-active] video, img, video",
  );
}

function mediaUrl(media: LightboxMedia | null): string {
  if (media instanceof HTMLImageElement) {
    return media.currentSrc || media.src || "";
  }

  if (!(media instanceof HTMLVideoElement)) {
    return "";
  }

  return (
    media.currentSrc ||
    media.src ||
    media.querySelector<HTMLSourceElement>("source[src]")?.getAttribute("src") ||
    ""
  );
}

function activeCaptionFor(figure: HTMLElement): HTMLElement | null {
  const activeSlideCaption =
    figure.querySelector<HTMLElement>(
      ":scope > .media__caption [data-slide-caption][data-active]",
    ) ||
    figure.querySelector<HTMLElement>(
      ":scope > .media__caption [data-slide-caption]",
    );

  if (activeSlideCaption) {
    return activeSlideCaption;
  }

  return figure.querySelector<HTMLElement>(":scope > figcaption.media__caption");
}

function appendSupplementalCaption(host: HTMLElement, figure: HTMLElement): void {
  if (host.querySelector(".media__text")) {
    return;
  }

  const supplemental = figure.querySelector<HTMLElement>(SUPPLEMENTAL_CAPTION_SELECTOR);
  const text = supplemental?.textContent?.replace(/\s+/g, " ").trim() || "";

  if (!text) {
    return;
  }

  const node = document.createElement("span");
  node.className = "media__text";
  node.textContent = text;
  host.append(node);
}

function renderCaption(host: HTMLElement | null, source: HTMLElement): void {
  if (!host) {
    return;
  }

  host.replaceChildren();

  const figure = source.closest("figure");
  if (!(figure instanceof HTMLElement)) {
    return;
  }

  const caption = activeCaptionFor(figure);

  if (caption) {
    const line = caption.matches(".media__caption-line")
      ? caption
      : caption.querySelector<HTMLElement>(".media__caption-line") || caption;

    [...line.children].forEach((child) => {
      host.append(child.cloneNode(true));
    });

    if (!host.children.length) {
      const text = line.textContent?.replace(/\s+/g, " ").trim() || "";
      if (text) {
        host.textContent = text;
      }
    }
  }

  appendSupplementalCaption(host, figure);
}

function sourcesFor(source: HTMLElement): HTMLElement[] {
  const project = source.closest(".project");
  const scope: ParentNode = project instanceof HTMLElement ? project : document;
  const seen = new Set<string>();

  return [...scope.querySelectorAll<HTMLElement>(SOURCE_SELECTOR)].filter((candidate) => {
    const media = mediaFor(candidate);
    if (!media) {
      return false;
    }

    const key = mediaUrl(media);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function markLightboxSources(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>(".media__surface, .mockup__viewport")
    .forEach((surface) => {
      if (surface.closest(EXCLUDED_SELECTOR)) {
        return;
      }

      if (
        surface.classList.contains("media__surface") &&
        surface.closest(".mockup__viewport")
      ) {
        return;
      }

      const media = mediaFor(surface);
      if (!media) {
        return;
      }

      surface.setAttribute("data-lightbox-source", "");

      if (!surface.hasAttribute("tabindex")) {
        surface.tabIndex = 0;
      }

      surface.setAttribute("role", "button");
      surface.setAttribute("aria-haspopup", "dialog");
      surface.setAttribute("aria-label", "Открыть медиа");
    });
}

export function createMediaLightbox(
  { root = document }: { root?: LightboxRoot } = {},
): () => void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-media-lightbox]");
  if (!dialog) {
    return () => {};
  }

  const layout = dialog.querySelector<HTMLElement>(".media-lightbox__layout");
  const gestureArea = dialog.querySelector<HTMLElement>(".media-lightbox__figure");
  const image = dialog.querySelector<HTMLImageElement>("[data-lightbox-image]");
  const video = dialog.querySelector<HTMLVideoElement>("[data-lightbox-video]");
  const caption = dialog.querySelector<HTMLElement>("[data-lightbox-caption]");
  const prev = dialog.querySelector<HTMLButtonElement>("[data-lightbox-prev]");
  const next = dialog.querySelector<HTMLButtonElement>("[data-lightbox-next]");
  const close = dialog.querySelector<HTMLButtonElement>("[data-lightbox-close]");

  let currentSources: HTMLElement[] = [];
  let index = 0;
  let restoreFocus: HTMLElement | null = null;
  let pointerX: number | null = null;

  const resetVideo = (): void => {
    if (!video) {
      return;
    }

    video.pause();
    video.removeAttribute("src");
    video.removeAttribute("poster");
    video.load();
    video.hidden = true;
  };

  const render = (): void => {
    const source = currentSources[index];
    if (!source) {
      return;
    }

    const media = mediaFor(source);
    if (!media) {
      return;
    }

    if (image) {
      image.hidden = true;
      image.removeAttribute("src");
    }

    resetVideo();

    if (media instanceof HTMLVideoElement && video) {
      const src = mediaUrl(media);
      if (!src) {
        return;
      }

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
      const play = (): void => {
        try {
          if (resumeAt > 0 && video.duration > resumeAt) {
            video.currentTime = resumeAt;
          }
        } catch {
          // Some media implementations reject currentTime before seekable data.
        }

        void video.play().catch(() => {});
      };

      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        play();
      } else {
        video.addEventListener("loadedmetadata", play, { once: true });
      }
    } else if (media instanceof HTMLImageElement && image) {
      image.src = mediaUrl(media);
      image.alt = media.alt || "";
      image.hidden = false;
    }

    renderCaption(caption, source);

    if (prev) {
      prev.disabled = currentSources.length < 2;
    }

    if (next) {
      next.disabled = currentSources.length < 2;
    }
  };

  const move = (step: number): void => {
    if (currentSources.length < 2) {
      return;
    }

    index = (index + step + currentSources.length) % currentSources.length;
    render();
  };

  const open = (source: HTMLElement): void => {
    currentSources = sourcesFor(source);
    const selectedKey = mediaUrl(mediaFor(source));
    index = Math.max(
      0,
      currentSources.findIndex(
        (candidate) => mediaUrl(mediaFor(candidate)) === selectedKey,
      ),
    );

    restoreFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    if (!dialog.open) {
      dialog.showModal();
    }

    render();
    close?.focus();
  };

  const finishClose = (): void => {
    resetVideo();
    restoreFocus?.focus();
    restoreFocus = null;
    currentSources = [];
    pointerX = null;
  };

  const closeDialog = (): void => {
    if (dialog.open) {
      dialog.close();
      return;
    }

    finishClose();
  };

  const handleClick = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(INTERACTIVE_SELECTOR)) {
      return;
    }

    const source = target.closest(SOURCE_SELECTOR);
    if (!(source instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    open(source);
  };

  const handleSourceKey = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const source = event.target instanceof Element
      ? event.target.closest(SOURCE_SELECTOR)
      : null;

    if (!(source instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    open(source);
  };

  const handleDialogKey = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLVideoElement) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  };

  const handleBackdrop = (event: MouseEvent): void => {
    const target = event.target;
    if (target === dialog || target === layout) {
      closeDialog();
    }
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" || !event.isPrimary) {
      return;
    }

    pointerX = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (pointerX === null || !event.isPrimary) {
      return;
    }

    const delta = event.clientX - pointerX;
    pointerX = null;

    if (Math.abs(delta) > 48) {
      move(delta < 0 ? 1 : -1);
    }
  };

  const handlePointerCancel = (): void => {
    pointerX = null;
  };

  const handlePrev = (): void => move(-1);
  const handleNext = (): void => move(1);

  prev?.addEventListener("click", handlePrev);
  next?.addEventListener("click", handleNext);
  close?.addEventListener("click", closeDialog);
  dialog.addEventListener("click", handleBackdrop);
  dialog.addEventListener("keydown", handleDialogKey);
  dialog.addEventListener("close", finishClose);
  gestureArea?.addEventListener("pointerdown", handlePointerDown);
  gestureArea?.addEventListener("pointerup", handlePointerUp);
  gestureArea?.addEventListener("pointercancel", handlePointerCancel);
  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleSourceKey);

  markLightboxSources(root);

  return () => {
    closeDialog();
    prev?.removeEventListener("click", handlePrev);
    next?.removeEventListener("click", handleNext);
    close?.removeEventListener("click", closeDialog);
    dialog.removeEventListener("click", handleBackdrop);
    dialog.removeEventListener("keydown", handleDialogKey);
    dialog.removeEventListener("close", finishClose);
    gestureArea?.removeEventListener("pointerdown", handlePointerDown);
    gestureArea?.removeEventListener("pointerup", handlePointerUp);
    gestureArea?.removeEventListener("pointercancel", handlePointerCancel);
    root.removeEventListener("click", handleClick);
    root.removeEventListener("keydown", handleSourceKey);
  };
}
