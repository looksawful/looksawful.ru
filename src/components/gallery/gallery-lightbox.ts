import PhotoSwipeLightbox from "photoswipe/lightbox";
import type { SlideData } from "photoswipe";
import "photoswipe/style.css";

type GallerySlide = SlideData & {
  galleryItemId: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  captionHtml: string;
};

export interface GalleryLightboxOptions {
  root: HTMLElement;
  onChange?: (itemId: string) => void;
  onClose?: () => void;
}

export interface GalleryLightboxController {
  openItem: (itemId: string) => boolean;
  close: () => void;
  destroy: () => void;
}

function activeCards(root: HTMLElement): HTMLElement[] {
  const panel = root.querySelector<HTMLElement>("[data-gallery-layer-panel]:not([hidden])");
  return panel ? [...panel.querySelectorAll<HTMLElement>("[data-gallery-card]")] : [];
}

function slideFor(card: HTMLElement): GallerySlide | null {
  const image = card.querySelector<HTMLImageElement>("img");
  const id = card.dataset.galleryItemId || "";
  const src = card.dataset.gallerySrc || image?.currentSrc || image?.src || "";
  const width = Number.parseInt(card.dataset.galleryWidth || "", 10);
  const height = Number.parseInt(card.dataset.galleryHeight || "", 10);
  if (!id || !src || !Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  const title = card.dataset.galleryTitle?.trim() || "";
  return {
    galleryItemId: id,
    src,
    msrc: image?.currentSrc || image?.src || undefined,
    srcset: image?.srcset || undefined,
    width,
    height,
    alt: card.dataset.galleryAlt || image?.alt || "",
    captionHtml: title ? `<span>${title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>` : "",
  };
}

export function createGalleryLightbox({
  root,
  onChange,
  onClose,
}: GalleryLightboxOptions): GalleryLightboxController {
  let current: PhotoSwipeLightbox | null = null;

  const destroyCurrent = (): void => {
    current?.destroy();
    current = null;
  };

  const openCard = (selected: HTMLElement): boolean => {
    const cards = activeCards(root);
    const pairs = cards
      .map((card) => ({ card, slide: slideFor(card) }))
      .filter((pair): pair is { card: HTMLElement; slide: GallerySlide } => pair.slide !== null);
    const index = pairs.findIndex(({ card }) => card === selected);
    if (index < 0 || pairs.length === 0) return false;

    destroyCurrent();
    const slides = pairs.map(({ slide }) => slide);
    const lightbox = new PhotoSwipeLightbox({
      dataSource: slides,
      index,
      pswpModule: () => import("photoswipe"),
      mainClass: "media-lightbox media-lightbox--photoswipe gallery-lightbox",
      bgOpacity: 0.96,
      loop: slides.length > 1,
      showHideAnimationType: "none",
      showAnimationDuration: 0,
      hideAnimationDuration: 0,
      zoomAnimationDuration: 0,
      returnFocus: true,
      preload: [1, 1],
    });

    const syncItem = (): void => {
      const active = slides[lightbox.pswp?.currIndex ?? index];
      if (active) onChange?.(active.galleryItemId);
    };

    lightbox.on("uiRegister", () => {
      lightbox.pswp?.ui?.registerElement({
        name: "gallery-caption",
        className: "media-lightbox__caption",
        tagName: "p",
        isButton: false,
        appendTo: "root",
        order: 9,
        onInit: (element, instance) => {
          const syncCaption = (): void => {
            const slide = slides[instance.currIndex];
            element.innerHTML = slide?.captionHtml || "";
            element.toggleAttribute("hidden", !element.textContent?.trim());
          };
          instance.on("change", syncCaption);
          instance.on("afterInit", syncCaption);
          syncCaption();
        },
      });
    });
    lightbox.on("afterInit", syncItem);
    lightbox.on("change", syncItem);
    lightbox.on("close", () => onClose?.());
    lightbox.on("destroy", () => {
      if (current === lightbox) current = null;
    });

    current = lightbox;
    lightbox.loadAndOpen(index);
    return true;
  };

  const openItem = (itemId: string): boolean => {
    const card = activeCards(root).find((candidate) => candidate.dataset.galleryItemId === itemId);
    return card ? openCard(card) : false;
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
    close: () => {
      if (current?.pswp) current.pswp.close();
      else destroyCurrent();
    },
    destroy: () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeydown);
      destroyCurrent();
    },
  };
}
