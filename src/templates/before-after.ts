import { getMediaAsset, getMediaEntry, type MediaEntryId } from "../data/media/index.ts";
import type { BeforeAfterData, BeforeAfterSideData } from "../types/before-after.ts";
import { escapeHtml } from "../utils/html.ts";

function renderSide(
  side: BeforeAfterSideData<MediaEntryId>,
  className: string,
): string {
  const entry = getMediaEntry(side.entryId);
  const asset = getMediaAsset(entry.assetId);

  if (asset.type !== "image") {
    throw new Error(`Before/after requires image media: ${side.entryId}`);
  }

  const dimensions = [
    typeof asset.height === "number" ? `height="${asset.height}"` : "",
    typeof asset.width === "number" ? `width="${asset.width}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<img alt="${escapeHtml(entry.alt ?? "")}" class="${escapeHtml(
    className,
  )}" decoding="async" draggable="false"${dimensions ? ` ${dimensions}` : ""} loading="${escapeHtml(
    side.loading ?? "lazy",
  )}" src="${escapeHtml(asset.src)}">`;
}

function renderCaption(data: BeforeAfterData<MediaEntryId>): string {
  const index =
    typeof data.caption.index === "number"
      ? `<span class="media__index">${String(data.caption.index).padStart(2, "0")}</span>`
      : "";
  const text = data.caption.text
    ? `<span class="media__text">${escapeHtml(data.caption.text)}</span>`
    : "";

  return `
    <figcaption class="media__caption">
      <p class="media__caption-line">
        ${index}
        <span class="media__title">${escapeHtml(data.caption.title)}</span>
        ${text}
      </p>
    </figcaption>
  `;
}

export function renderBeforeAfter(data: BeforeAfterData<MediaEntryId>): string {
  const value = data.value ?? 50;
  const min = data.min ?? 0;
  const max = data.max ?? 100;
  const step = data.step ?? 0.1;
  const ariaLabel = data.ariaLabel ?? "Сравнить изображение до и после";

  return `
    <figure class="before-after" data-before-after="" data-caption-view="${escapeHtml(
      data.captionView,
    )}">
      <div class="before-after__viewport">
        ${renderSide(data.before, "before-after__image before-after__base")}
        <div class="before-after__reveal">${renderSide(data.after, "before-after__image")}</div>
        <span aria-hidden="true" class="before-after__separator"></span>
        <span aria-hidden="true" class="before-after__handle"><svg viewBox="0 0 24 24"><path d="M9 5 3 12l6 7M15 5l6 7-6 7"></path></svg></span>
        <span class="before-after__label before-after__label--before">${escapeHtml(data.before.label)}</span>
        <span class="before-after__label before-after__label--after">${escapeHtml(data.after.label)}</span>
        <input aria-label="${escapeHtml(ariaLabel)}" class="before-after__range" max="${max}" min="${min}" step="${step}" type="range" value="${value}">
      </div>
      ${renderCaption(data)}
    </figure>
  `;
}
