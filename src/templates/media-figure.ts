import { getMediaAsset, getMediaEntry, type MediaEntryId } from "../data/media/index.ts";

import type { MediaFigureData, MediaLoading, MediaVideoOptions } from "../types/content.ts";

import { escapeHtml } from "../utils/html.ts";

export interface MediaElementOptions {
  loading?: MediaLoading;
  className?: string;
  video?: MediaVideoOptions;
}

function renderClassAttribute(className?: string): string {
  return className ? ` class="${escapeHtml(className)}"` : "";
}

function renderDimensions(width?: number, height?: number): string {
  const attributes: string[] = [];

  if (typeof height === "number") {
    attributes.push(`height="${height}"`);
  }

  if (typeof width === "number") {
    attributes.push(`width="${width}"`);
  }

  return attributes.length ? ` ${attributes.join(" ")}` : "";
}

function renderMediaRatio(width?: number, height?: number): string {
  if (typeof width !== "number" || typeof height !== "number") {
    return "";
  }

  return ` style="--media-ratio: ${width} / ${height}"`;
}

function renderVideoBooleanAttribute(name: string, enabled?: boolean): string {
  return enabled ? ` ${name}=""` : "";
}

export function renderMediaElement(
  entryId: MediaEntryId,
  options: MediaElementOptions = {},
): string {
  const entry = getMediaEntry(entryId);
  const asset = getMediaAsset(entry.assetId);

  if (asset.type === "image") {
    const loading = options.loading ?? "lazy";

    return `<img${renderClassAttribute(options.className)} alt="${escapeHtml(entry.alt ?? "")}" decoding="async"${renderDimensions(asset.width, asset.height)} loading="${loading}" src="${escapeHtml(asset.src)}">`;
  }

  const video = options.video ?? {};

  const poster = entry.posterAssetId ? getMediaAsset(entry.posterAssetId) : undefined;

  const preload = video.preload ?? "metadata";

  return `<video${renderClassAttribute(options.className)}${renderVideoBooleanAttribute("autoplay", video.autoplay)}${renderVideoBooleanAttribute("loop", video.loop)}${renderVideoBooleanAttribute("muted", video.muted)}${renderVideoBooleanAttribute("playsinline", video.playsInline)}${renderDimensions(asset.width, asset.height)}${poster ? ` poster="${escapeHtml(poster.src)}"` : ""} preload="${preload}" src="${escapeHtml(asset.src)}"></video>`;
}

export function renderMediaCaption(entryId: MediaEntryId): string {
  const entry = getMediaEntry(entryId);
  const caption = entry.caption;

  if (!caption) {
    return "";
  }

  const index =
    typeof caption.index === "number"
      ? `<span class="media__index">${String(caption.index).padStart(2, "0")}</span>`
      : "";

  const title = `<span class="media__title">${escapeHtml(caption.title)}</span>`;

  const text = caption.text ? `<span class="media__text">${escapeHtml(caption.text)}</span>` : "";

  const meta =
    caption.meta?.map((item) => `<span class="media__meta">${escapeHtml(item)}</span>`).join("") ??
    "";

  return `
    <figcaption class="media__caption">
      <p class="media__caption-line">
        ${index}
        ${title}
        ${text}
        ${meta}
      </p>
    </figcaption>
  `;
}

export function renderMediaFigure(data: MediaFigureData<MediaEntryId>): string {
  const entry = getMediaEntry(data.entryId);
  const asset = getMediaAsset(entry.assetId);

  const classes = ["media", data.className].filter(Boolean).join(" ");

  const presentation = data.presentation
    ? ` data-presentation="${escapeHtml(data.presentation)}"`
    : "";

  const captionRest = data.captionRest
    ? ` data-caption-rest="${escapeHtml(data.captionRest)}"`
    : "";

  const captionMode = data.captionMode === "overlay" ? ` data-caption="overlay"` : "";

  const tabIndex = data.tabIndex === 0 ? ` tabindex="0"` : "";

  return `
    <figure
      class="${escapeHtml(classes)}"
      ${presentation}
      ${captionRest}
      ${captionMode}
      ${tabIndex}
    >
      <div
        class="media__surface"
        ${renderMediaRatio(asset.width, asset.height)}
      >
        ${renderMediaElement(data.entryId, {
          loading: data.loading,
          className: data.mediaClassName,
          video: data.video,
        })}
      </div>

      ${renderMediaCaption(data.entryId)}
    </figure>
  `;
}
