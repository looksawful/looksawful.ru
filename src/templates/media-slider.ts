import type { MediaEntryId } from "../data/media/index.ts";
import type { MediaSliderData } from "../types/media-slider.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderMediaCaptionLine, renderMediaElement } from "./media-figure.ts";

function renderDeckAttributes(data: MediaSliderData<MediaEntryId>): string {
  const attributes = ["data-media-deck=\"\""];

  if (typeof data.interval === "number") {
    attributes.push(`data-deck-interval="${data.interval}"`);
  }

  if (data.autoplay) {
    attributes.push(`data-deck-autoplay="${escapeHtml(data.autoplay)}"`);
  }

  if (data.advanceOnEnded) {
    attributes.push('data-deck-advance-on-ended=""');
  }

  return attributes.join(" ");
}

export function renderMediaSlider(data: MediaSliderData<MediaEntryId>): string {
  const classes = ["media", "slider", data.className].filter(Boolean).join(" ");
  const deckAttributes = renderDeckAttributes(data);

  const slides = data.slides
    .map(
      (slide, index) => `
        <div class="slider__slide"${index === 0 ? ' data-active=""' : ""} data-slide="">
          ${renderMediaElement(slide.entryId, {
            loading: slide.loading,
            className: slide.mediaClassName,
            dimensions: data.mediaDimensions !== false,
            video: slide.video,
          })}
        </div>
      `,
    )
    .join("\n");

  const captions = data.slides
    .map(
      (slide, index) => `
        <div
          class="slider__caption-slide"${index === 0 ? ' data-active=""' : ""}
          data-slide-caption=""
          data-caption-view="${escapeHtml(slide.captionView)}"
        >
          ${renderMediaCaptionLine(slide.entryId)}
        </div>
      `,
    )
    .join("\n");

  const count = `01 / ${String(data.slides.length).padStart(2, "0")}`;

  return `
    <figure
      class="${escapeHtml(classes)}"
      ${deckAttributes}
      data-caption-view="${escapeHtml(data.captionView)}"
    >
      <div class="slider__viewport">
        <div class="slider__slides pile">
          ${slides}
        </div>
      </div>

      <div class="media__caption slider__captions pile" aria-live="polite">
        ${captions}
      </div>

      <div aria-label="Навигация по слайдам" class="slider-controls cluster">
        <button aria-label="Предыдущий кадр" class="slider-controls__button" data-deck-prev="" type="button">←</button>
        <span aria-live="polite" class="slider-controls__count" data-deck-count="">${count}</span>
        <button aria-label="Следующий кадр" class="slider-controls__button" data-deck-next="" type="button">→</button>
      </div>
    </figure>
  `;
}
