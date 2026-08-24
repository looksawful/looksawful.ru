import { getMediaAsset, getMediaEntry, type MediaEntryId } from "../data/media/index.ts";
import type { MediaCaptionData } from "../types/media.ts";
import type {
  MockupDeckCanvasSlideData,
  MockupDeckData,
  MockupDeckImageSlideData,
  MockupDeckSlideData,
  StandardMockupDeckData,
} from "../types/mockup-deck.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderAnimatedCanvasGallery } from "./animated-canvas-gallery.ts";
import { renderMediaCaptionLine } from "./media-figure.ts";

function renderSlideMedia(
  slide: MockupDeckImageSlideData<MediaEntryId>,
  attributes: readonly string[] = [],
): string {
  const entry = getMediaEntry(slide.entryId);
  const asset = getMediaAsset(entry.assetId);

  if (asset.type !== "image") {
    throw new Error(`Image-only mockup deck received non-image media: ${slide.entryId}`);
  }

  const className = slide.mediaClassName
    ? ` class="${escapeHtml(slide.mediaClassName)}"`
    : "";
  const dimensions = [
    typeof asset.height === "number" ? `height="${asset.height}"` : "",
    typeof asset.width === "number" ? `width="${asset.width}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const mediaTitle = slide.mediaTitle
    ? ` data-media-title="${escapeHtml(slide.mediaTitle)}"`
    : "";
  const extra = attributes.length ? ` ${attributes.join(" ")}` : "";

  return `<img${className} alt="${escapeHtml(entry.alt ?? "")}"${extra}${mediaTitle} decoding="async"${
    slide.mediaDimensions === false ? "" : dimensions ? ` ${dimensions}` : ""
  } loading="${escapeHtml(slide.loading ?? "lazy")}" src="${escapeHtml(asset.src)}">`;
}

function renderCaptionDataLine(caption: MediaCaptionData): string {
  const title = caption.title
    ? `<span class="media__title">${escapeHtml(caption.title)}</span>`
    : "";
  const text = caption.text
    ? `<span class="media__text">${escapeHtml(caption.text)}</span>`
    : "";
  const meta = caption.meta?.map((item) => `<span class="media__meta">${escapeHtml(item)}</span>`).join("") ?? "";

  if (!title && !text && !meta) return "";
  return `<p class="media__caption-line">${title}${text}${meta}</p>`;
}

function renderSlideCaptionLine(slide: MockupDeckSlideData<MediaEntryId>): string {
  if (slide.caption) return renderCaptionDataLine(slide.caption);
  if (slide.kind === "canvas-gallery") return "";
  return renderMediaCaptionLine(slide.entryId);
}

function renderCaptions(data: MockupDeckData<MediaEntryId>): string {
  if (data.captions === false) return "";
  if (data.captions === "empty") {
    return `<div class="media__caption mockup__captions pile" aria-live="polite"></div>`;
  }

  return `
    <div class="media__caption mockup__captions pile" aria-live="polite">
      ${data.slides
        .map((slide, index) => {
          const active = index === 0 ? ' data-active=""' : "";
          const view = slide.captionView ?? data.captionView;
          return `<div class="mockup__caption-slide" data-slide-caption=""${active} data-caption-view="${escapeHtml(
            view,
          )}">${renderSlideCaptionLine(slide)}</div>`;
        })
        .join("")}
    </div>
  `;
}

function renderControls(slideCount: number): string {
  return `<div aria-label="Навигация по слайдам" class="slider-controls cluster"><button aria-label="Предыдущий кадр" class="slider-controls__button" data-deck-prev="" type="button">←</button><span aria-live="polite" class="slider-controls__count" data-deck-count="">01 / ${String(
    slideCount,
  ).padStart(2, "0")}</span><button aria-label="Следующий кадр" class="slider-controls__button" data-deck-next="" type="button">→</button></div>`;
}

function renderDeckAttributes(data: MockupDeckData<MediaEntryId>): string {
  const attributes = ['data-media-deck=""'];

  if (typeof data.interval === "number") {
    attributes.push(`data-deck-interval="${data.interval}"`);
  }

  return attributes.join(" ");
}

function renderCanvasSlide(slide: MockupDeckCanvasSlideData<MediaEntryId>, active: boolean): string {
  const classes = ["mockup__slide", slide.className].filter(Boolean).join(" ");
  const ariaHidden = slide.ariaHidden ? ' aria-hidden="true"' : "";
  const activeAttribute = active ? ' data-active=""' : "";
  return `<div${ariaHidden} class="${escapeHtml(classes)}"${activeAttribute} data-slide="">${renderAnimatedCanvasGallery(slide.gallery)}</div>`;
}

function renderStandardSlide(
  slide: MockupDeckSlideData<MediaEntryId>,
  index: number,
): string {
  if (slide.kind === "canvas-gallery") {
    return renderCanvasSlide(slide, index === 0);
  }

  return `<div class="mockup__slide"${index === 0 ? ' data-active=""' : ""} data-slide="">${renderSlideMedia(slide)}</div>`;
}

function renderStandard(data: StandardMockupDeckData<MediaEntryId>): string {
  const classes = ["media", "mockup", data.className].filter(Boolean).join(" ");
  const role = data.role ? ` data-role="${escapeHtml(data.role)}"` : "";
  const theme = data.theme ? ` data-mockup-theme="${escapeHtml(data.theme)}"` : "";
  const style = data.style ? ` style="${escapeHtml(data.style)}"` : "";
  const deck = renderDeckAttributes(data);

  const slides = data.slides.map(renderStandardSlide).join("\n");

  return `
    <figure class="${escapeHtml(classes)}" data-caption-view="${escapeHtml(
      data.captionView,
    )}" data-device="${escapeHtml(data.device)}" ${deck}${role}${theme}${style}>
      <div class="mockup__frame">
        <div class="mockup__viewport">
          <div class="mockup__slides pile">${slides}</div>
        </div>
      </div>
      ${renderCaptions(data)}
      ${data.controls === false ? "" : renderControls(data.slides.length)}
    </figure>
  `;
}

function renderMobileDevice(data: Extract<MockupDeckData<MediaEntryId>, { variant: "mobile-device" }>): string {
  const classes = ["media", data.className].filter(Boolean).join(" ");
  const deck = renderDeckAttributes(data);
  const slides = data.slides
    .map((slide, index) =>
      renderSlideMedia(slide, [index === 0 ? 'data-active=""' : "", 'data-slide=""'].filter(Boolean)),
    )
    .join("");

  return `
    <figure class="${escapeHtml(classes)}" data-caption-view="${escapeHtml(data.captionView)}" ${deck}>
      <div class="mobile-mockup">
        <div class="mobile-mockup__shell">
          <div aria-hidden="true" class="mobile-mockup__hardware cluster"><span class="mobile-mockup__speaker"></span><span class="mobile-mockup__camera"></span></div>
          <div class="mobile-mockup__screen"><div class="mobile-mockup__slides pile">${slides}</div></div>
          <span aria-hidden="true" class="mobile-mockup__home-indicator"></span>
        </div>
      </div>
      ${renderCaptions(data)}
      ${data.controls ? renderControls(data.slides.length) : ""}
    </figure>
  `;
}

export function renderMockupDeck(data: MockupDeckData<MediaEntryId>): string {
  return data.variant === "standard" ? renderStandard(data) : renderMobileDevice(data);
}
