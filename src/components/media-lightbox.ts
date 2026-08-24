import {
  createPhotoSwipeLightbox,
  type PhotoSwipeLightboxItem,
} from "./photoswipe-lightbox.ts";

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

function captionHtmlFor(source: HTMLElement): string {
  const host = document.createElement("p");
  host.className = "media-lightbox__caption";
  renderCaption(host, source);
  return host.innerHTML;
}

function dimensionFor(
  media: LightboxMedia,
  axis: "width" | "height",
): number {
  const metadata = axis === "width"
    ? media.dataset.mediaWidth
    : media.dataset.mediaHeight;
  const metadataValue = Number.parseInt(metadata || "", 10);
  if (Number.isFinite(metadataValue) && metadataValue > 0) {
    return metadataValue;
  }

  const intrinsic = media instanceof HTMLImageElement
    ? (axis === "width" ? media.naturalWidth : media.naturalHeight)
    : (axis === "width" ? media.videoWidth : media.videoHeight);

  if (intrinsic > 0) {
    return intrinsic;
  }

  const rect = media.getBoundingClientRect();
  const rendered = Math.round(axis === "width" ? rect.width : rect.height);
  if (rendered > 0) {
    return rendered;
  }

  return axis === "width" ? 1600 : 900;
}

function imageItemFor(
  source: HTMLElement,
  image: HTMLImageElement,
): PhotoSwipeLightboxItem | null {
  const src = mediaUrl(image);
  if (!src) {
    return null;
  }

  return {
    kind: "image",
    element: image,
    src,
    msrc: image.currentSrc || image.src || undefined,
    srcset: image.srcset || undefined,
    width: dimensionFor(image, "width"),
    height: dimensionFor(image, "height"),
    alt: image.alt || "",
    captionHtml: captionHtmlFor(source),
  };
}

function videoItemFor(
  source: HTMLElement,
  video: HTMLVideoElement,
): PhotoSwipeLightboxItem | null {
  const src = mediaUrl(video);
  if (!src) {
    return null;
  }

  return {
    kind: "video",
    type: "video",
    html: "",
    element: video,
    src,
    poster: video.poster || "",
    width: dimensionFor(video, "width"),
    height: dimensionFor(video, "height"),
    loop: video.loop,
    resumeAt: Number.isFinite(video.currentTime) ? video.currentTime : 0,
    captionHtml: captionHtmlFor(source),
  };
}

function itemFor(source: HTMLElement): PhotoSwipeLightboxItem | null {
  const media = mediaFor(source);
  if (media instanceof HTMLImageElement) {
    return imageItemFor(source, media);
  }

  if (media instanceof HTMLVideoElement) {
    return videoItemFor(source, media);
  }

  return null;
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
  const lightbox = createPhotoSwipeLightbox();

  const open = (source: HTMLElement): void => {
    const currentSources = sourcesFor(source);
    const items = currentSources
      .map((candidate) => itemFor(candidate))
      .filter((item): item is PhotoSwipeLightboxItem => item !== null);
    const selectedKey = mediaUrl(mediaFor(source));
    const index = Math.max(
      0,
      items.findIndex((item) => item.src === selectedKey),
    );

    if (!items.length) {
      return;
    }

    const restoreFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    lightbox.open({ items, index, restoreFocus });
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

  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleSourceKey);

  markLightboxSources(root);

  return () => {
    lightbox.destroy();
    root.removeEventListener("click", handleClick);
    root.removeEventListener("keydown", handleSourceKey);
  };
}
