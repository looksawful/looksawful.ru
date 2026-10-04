import {
  createPhotoSwipeLightbox,
  type PhotoSwipeLightboxItem,
} from "../photoswipe-lightbox.ts";

export interface GalleryLightboxOptions {
  root: HTMLElement;
  onChange?: (itemId: string, slide: number | null) => void;
  onClose?: () => void;
}

export interface GalleryLightboxController {
  openItem: (itemId: string, slide?: number | null) => boolean;
  close: () => void;
  destroy: () => void;
}

interface GalleryViewerSlide {
  itemId: string;
  slide: number | null;
  item: PhotoSwipeLightboxItem;
}

function escapeCaption(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function creditsFor(element: HTMLElement): readonly string[] {
  const raw = element.dataset.galleryCredits || "[]";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((credit): credit is string => (
      typeof credit === "string" && credit.trim().length > 0
    )))];
  } catch {
    return [];
  }
}

function captionHtml(element: HTMLElement): string {
  const title = element.dataset.galleryTitle?.trim() || "";
  const lines = [
    ...(title ? [title] : []),
    ...creditsFor(element),
  ];
  return lines.map((line) => `<span>${escapeCaption(line)}</span>`).join("<br>");
}

function positiveDimension(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function cardFallbackDimension(card: HTMLElement, axis: "width" | "height"): number {
  const image = card.querySelector<HTMLImageElement>("img");
  const intrinsic = axis === "width"
    ? image?.naturalWidth || image?.width || 0
    : image?.naturalHeight || image?.height || 0;
  return intrinsic > 0 ? intrinsic : axis === "width" ? 1600 : 900;
}

function descriptorItem(
  descriptor: HTMLElement,
  card: HTMLElement,
): PhotoSwipeLightboxItem | null {
  const kind = descriptor.dataset.galleryKind;
  const src = descriptor.dataset.gallerySrc?.trim() || "";
  const poster = descriptor.dataset.galleryPosterSrc?.trim() || "";
  const width = positiveDimension(
    descriptor.dataset.galleryWidth,
    cardFallbackDimension(card, "width"),
  );
  const height = positiveDimension(
    descriptor.dataset.galleryHeight,
    cardFallbackDimension(card, "height"),
  );
  const alt = descriptor.dataset.galleryAlt || "";
  const caption = captionHtml(descriptor);

  if (kind === "video" && src && poster) {
    return {
      kind: "video",
      type: "video",
      html: "",
      src,
      poster,
      width,
      height,
      loop: false,
      resumeAt: 0,
      muted: true,
      captionHtml: caption,
    };
  }

  if (kind === "model" && poster) {
    return {
      kind: "image",
      src: poster,
      msrc: poster,
      width,
      height,
      alt,
      captionHtml: caption,
    };
  }

  if (kind === "image" && src) {
    return {
      kind: "image",
      src,
      msrc: src,
      width,
      height,
      alt,
      captionHtml: caption,
    };
  }

  return null;
}

function legacyDescriptor(card: HTMLElement): HTMLElement {
  const descriptor = document.createElement("span");
  descriptor.dataset.galleryKind = card.dataset.galleryKind || "image";
  descriptor.dataset.gallerySrc = card.dataset.gallerySrc || "";
  descriptor.dataset.galleryPosterSrc = card.querySelector<HTMLImageElement>("img")?.currentSrc
    || card.querySelector<HTMLImageElement>("img")?.src
    || "";
  descriptor.dataset.galleryWidth = card.dataset.galleryWidth || "";
  descriptor.dataset.galleryHeight = card.dataset.galleryHeight || "";
  descriptor.dataset.galleryAlt = card.dataset.galleryAlt || "";
  descriptor.dataset.galleryTitle = card.dataset.galleryTitle || "";
  descriptor.dataset.galleryCredits = card.dataset.galleryCredits || "[]";
  return descriptor;
}

function slidesForCard(card: HTMLElement): readonly GalleryViewerSlide[] {
  const itemId = card.dataset.galleryItemId?.trim() || "";
  if (!itemId) return [];

  const descriptors = [...card.querySelectorAll<HTMLElement>("[data-gallery-media]")];
  const media = (descriptors.length ? descriptors : [legacyDescriptor(card)])
    .map((descriptor) => ({
      descriptor,
      item: descriptorItem(descriptor, card),
    }))
    .filter((entry): entry is { descriptor: HTMLElement; item: PhotoSwipeLightboxItem } => (
      entry.item !== null
    ));

  return media.map(({ item }, index) => ({
    itemId,
    slide: media.length > 1 ? index + 1 : null,
    item,
  }));
}

function cardsInSelectedSeries(root: HTMLElement, selected: HTMLElement): HTMLElement[] {
  const series = selected.closest<HTMLElement>("[data-gallery-series]");
  if (!series || !root.contains(series)) return [selected];
  return [...series.querySelectorAll<HTMLElement>("[data-gallery-card]")];
}

export function createGalleryLightbox({
  root,
  onChange,
  onClose,
}: GalleryLightboxOptions): GalleryLightboxController {
  const viewer = createPhotoSwipeLightbox();

  const openCard = (
    selected: HTMLElement,
    requestedSlide: number | null = null,
  ): boolean => {
    const slides = cardsInSelectedSeries(root, selected).flatMap(slidesForCard);
    if (!slides.length) return false;

    const itemId = selected.dataset.galleryItemId || "";
    const requestedIndex = slides.findIndex((entry) => (
      entry.itemId === itemId
      && (requestedSlide === null || entry.slide === requestedSlide)
    ));
    const firstItemIndex = slides.findIndex((entry) => entry.itemId === itemId);
    const index = requestedIndex >= 0 ? requestedIndex : firstItemIndex;
    if (index < 0) return false;

    viewer.open({
      items: slides.map(({ item }) => item),
      index,
      restoreFocus: selected,
      dialogLabel: "Галерея",
      mainClass: "media-lightbox media-lightbox--photoswipe gallery-lightbox",
      loop: false,
      onChange: (_item, activeIndex) => {
        const active = slides[activeIndex];
        if (active) onChange?.(active.itemId, active.slide);
      },
      onClose,
    });
    return true;
  };

  const openItem = (itemId: string, slide: number | null = null): boolean => {
    const card = [...root.querySelectorAll<HTMLElement>("[data-gallery-card]")]
      .find((candidate) => candidate.dataset.galleryItemId === itemId);
    return card ? openCard(card, slide) : false;
  };

  const handleClick = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest<HTMLElement>("[data-gallery-card]");
    if (!card || !root.contains(card)) return;
    event.preventDefault();
    openCard(card);
  };

  const handleKeydown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || (event.key !== "Enter" && event.key !== " ")) return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest<HTMLElement>("[data-gallery-card]");
    if (!card || !root.contains(card)) return;
    event.preventDefault();
    openCard(card);
  };

  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleKeydown);

  return {
    openItem,
    close: () => viewer.close(),
    destroy: () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeydown);
      viewer.destroy();
    },
  };
}
