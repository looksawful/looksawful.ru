import { getMediaAsset, getMediaEntry, type MediaEntryId } from "../data/media/index.ts";

import type {
  EmbeddedMediaDeckData,
  MediaCaptionField,
  MediaFigureData,
  MediaLoading,
  MediaSurfaceEntryData,
  MediaSurfacePresentation,
  MediaVideoOptions,
} from "../types/media-presentation.ts";

import { renderRevealAttribute } from "../motion-contract.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderResponsiveImageAttributes } from "./responsive-image.ts";

/* ==================================================
   Media element
   ================================================== */

export interface MediaElementOptions {
  loading?: MediaLoading;

  className?: string;

  dimensions?: boolean;

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

function renderMediaMetadataDimensions(width?: number, height?: number): string {
  if (typeof width !== "number" || typeof height !== "number") {
    return "";
  }

  return ` data-media-width="${width}" data-media-height="${height}"`;
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

    return `<img${renderClassAttribute(options.className)} alt="${escapeHtml(
      entry.alt ?? "",
    )}" decoding="async"${
      options.dimensions === false ? "" : renderDimensions(asset.width, asset.height)
    }${renderMediaMetadataDimensions(asset.width, asset.height)} loading="${loading}"${renderResponsiveImageAttributes(
      asset,
      loading,
    )} src="${escapeHtml(asset.src)}">`;
  }

  if (asset.type !== "video") {
    throw new Error(`Unsupported MediaAsset type for media element: ${asset.type}`);
  }

  const video = options.video ?? {};
  const poster = entry.posterAssetId ? getMediaAsset(entry.posterAssetId) : undefined;

  const preload = video.preload ?? (video.autoplay ? "auto" : "metadata");

  const attributes = `<video${renderClassAttribute(options.className)}${renderVideoBooleanAttribute(
    "autoplay",
    video.autoplay,
  )}${renderVideoBooleanAttribute("loop", video.loop)}${renderVideoBooleanAttribute(
    "muted",
    video.muted,
  )}${renderVideoBooleanAttribute("playsinline", video.playsInline)}${
    options.dimensions === false ? "" : renderDimensions(asset.width, asset.height)
  }${renderMediaMetadataDimensions(asset.width, asset.height)}${
    poster ? ` poster="${escapeHtml(poster.src)}"` : ""
  } preload="${preload}"`;

  if (video.mimeType) {
    return `${attributes}><source src="${escapeHtml(asset.src)}" type="${escapeHtml(
      video.mimeType,
    )}"></video>`;
  }

  return `${attributes} src="${escapeHtml(asset.src)}"></video>`;
}

/* ==================================================
   Surface
   ================================================== */

function renderMediaSurfaceStyle(
  width?: number,
  height?: number,
  surface?: MediaSurfacePresentation,
  deriveRatio = true,
): string {
  const variables: string[] = [];

  if (surface?.ratio) {
    variables.push(`--media-ratio: ${surface.ratio}`);
  } else if (deriveRatio && typeof width === "number" && typeof height === "number") {
    variables.push(`--media-ratio: ${width} / ${height}`);
  }

  if (surface?.fit) {
    variables.push(`--media-fit: ${surface.fit}`);
  }

  if (surface?.position) {
    variables.push(`--media-position: ${surface.position}`);
  }

  if (!variables.length) {
    return "";
  }

  return ` style="${escapeHtml(`${variables.join("; ")};`)}"`;
}

/* ==================================================
   Caption
   ================================================== */

export function renderMediaCaptionLine(
  entryId: MediaEntryId,
  fields?: readonly MediaCaptionField[],
): string {
  const entry = getMediaEntry(entryId);

  const caption = entry.caption;

  if (!caption) {
    return "";
  }

  const includes = (field: MediaCaptionField): boolean => !fields || fields.includes(field);

  const title = includes("title") && caption.title
    ? `<span class="media__title">${escapeHtml(caption.title)}</span>`
    : "";

  const text =
    includes("text") && caption.text
      ? `<span class="media__text">${escapeHtml(caption.text)}</span>`
      : "";

  const meta = includes("meta")
    ? (caption.meta?.map((item) => `<span class="media__meta">${escapeHtml(item)}</span>`).join("") ??
      "")
    : "";

  if (!title && !text && !meta) {
    return "";
  }

  return `
      <p class="media__caption-line">
        ${title}
        ${text}
        ${meta}
      </p>
  `;
}

export function renderMediaCaption(
  entryId: MediaEntryId,
  className?: string,
  fields?: readonly MediaCaptionField[],
): string {
  const line = renderMediaCaptionLine(entryId, fields);

  if (!line) {
    return "";
  }

  const classes = ["media__caption", className].filter(Boolean).join(" ");

  return `
    <figcaption class="${escapeHtml(classes)}">
      ${line}
    </figcaption>
  `;
}

/* ==================================================
   Placement
   ================================================== */

export type MediaFigurePlacement =
  | {
      kind: "grid";
      role?: "wide";
    }
  | {
      kind: "editorial";
      role?: "wide";
      start?: number;
      span?: number;
    }
  | {
      kind: "sequence";
      role: "wide";
    }
  | {
      kind: "bento";
      colSpan?: number;
      rowSpan?: number;
    };

export type MediaFigureRevealPolicy = "auto" | "media" | false;

export interface RenderMediaFigureOptions {
  placement?: MediaFigurePlacement;

  mediaDimensions?: boolean;

  reveal?: MediaFigureRevealPolicy;
}

function renderPlacementAttributes(placement?: MediaFigurePlacement): string {
  if (!placement) {
    return "";
  }

  const attributes: string[] = [];
  const variables: string[] = [];

  if ("role" in placement && placement.role) {
    attributes.push(`data-role="${escapeHtml(placement.role)}"`);
  }

  if (placement.kind === "editorial") {
    if (typeof placement.start === "number") {
      variables.push(`--start: ${placement.start}`);
    }

    if (typeof placement.span === "number") {
      variables.push(`--span: ${placement.span}`);
    }
  }

  if (placement.kind === "bento") {
    if (typeof placement.colSpan === "number") {
      variables.push(`--bento-col-span: ${placement.colSpan}`);
    }

    if (typeof placement.rowSpan === "number") {
      variables.push(`--bento-row-span: ${placement.rowSpan}`);
    }
  }

  if (variables.length) {
    attributes.push(`style="${escapeHtml(`${variables.join("; ")};`)}"`);
  }

  return attributes.length ? ` ${attributes.join(" ")}` : "";
}

function renderSurfaceEntries(
  entries: readonly MediaSurfaceEntryData<MediaEntryId>[],
): string {
  return entries
    .map((item) =>
      renderMediaElement(item.entryId, {
        loading: item.loading,
        className: item.mediaClassName,
        video: item.video,
      }),
    )
    .join("\n");
}

function renderEmbeddedMediaDeck(
  deck: EmbeddedMediaDeckData<MediaEntryId>,
): string {
  const classes = [deck.className].filter(Boolean).join(" ");
  const classAttribute = classes ? ` class="${escapeHtml(classes)}"` : "";
  const autoplay = deck.autoplay
    ? ` data-deck-autoplay="${escapeHtml(deck.autoplay)}"`
    : "";
  const advanceOnEnded = deck.advanceOnEnded ? ` data-deck-advance-on-ended=""` : "";

  const slides = deck.slides
    .map(
      (slide, index) => `
        <div class="slider__slide"${index === 0 ? ' data-active=""' : ""} data-slide="">
          ${renderMediaElement(slide.entryId, {
            loading: slide.loading,
            className: slide.mediaClassName,
            video: slide.video,
          })}
        </div>
      `,
    )
    .join("\n");

  return `
    <div${classAttribute}${advanceOnEnded} data-media-deck=""${autoplay}>
      <div class="slider__viewport">
        <div class="slider__slides pile">
          ${slides}
        </div>
      </div>
    </div>
  `;
}

function isImageEntry(entryId: MediaEntryId): boolean {
  const entry = getMediaEntry(entryId);
  const asset = getMediaAsset(entry.assetId);

  return asset.type === "image";
}

function resolveRevealKind(
  data: MediaFigureData<MediaEntryId>,
  options: RenderMediaFigureOptions,
): "media" | false {
  const policy = options.reveal ?? "auto";

  if (policy === false) {
    return false;
  }

  if (policy === "media") {
    return "media";
  }

  if (data.surfaceDeck) {
    return false;
  }

  const surfaceEntries = data.surfaceEntries ?? [];

  if (surfaceEntries.length) {
    return surfaceEntries.every((item) => isImageEntry(item.entryId)) ? "media" : false;
  }

  return isImageEntry(data.entryId) ? "media" : false;
}

/* ==================================================
   Figure
   ================================================== */

export function renderMediaFigure(
  data: MediaFigureData<MediaEntryId>,
  options: RenderMediaFigureOptions = {},
): string {
  const entry = getMediaEntry(data.entryId);

  const asset = getMediaAsset(entry.assetId);

  const classes = ["media", data.className].filter(Boolean).join(" ");

  const presentation = data.presentation
    ? ` data-presentation="${escapeHtml(data.presentation)}"`
    : "";

  const lightbox = data.lightbox === false ? ` data-lightbox="off"` : "";

  const reveal = renderRevealAttribute(resolveRevealKind(data, options));

  const placement = renderPlacementAttributes(options.placement);

  const hasCompoundSurface = Boolean(data.surfaceEntries?.length || data.surfaceDeck);

  const surfaceStyle = renderMediaSurfaceStyle(
    asset.width,
    asset.height,
    data.surface,
    !hasCompoundSurface && data.surface?.deriveRatio !== false,
  );

  const surfaceClasses = ["media__surface", data.surfaceClassName].filter(Boolean).join(" ");

  const surfaceLayout = data.surfaceLayout
    ? ` data-layout="${escapeHtml(data.surfaceLayout)}"`
    : "";

  const surfaceMedia = data.surfaceDeck
    ? renderEmbeddedMediaDeck(data.surfaceDeck)
    : data.surfaceEntries?.length
      ? renderSurfaceEntries(data.surfaceEntries)
      : renderMediaElement(data.entryId, {
          loading: data.loading,
          className: data.mediaClassName,
          dimensions: options.mediaDimensions,
          video: data.video,
        });

  const overlay = data.surfaceOverlay
    ? `<p class="${escapeHtml(data.surfaceOverlay.className)}" data-lightbox-caption-copy>${escapeHtml(
        data.surfaceOverlay.text,
      )}</p>`
    : "";

  return `
    <figure
      class="${escapeHtml(classes)}"
      data-caption-view="${escapeHtml(data.captionView)}"${presentation}${lightbox}${reveal}${placement}
    >
      <div
        class="${escapeHtml(surfaceClasses)}"${surfaceLayout}${surfaceStyle}
      >
        ${surfaceMedia}
        ${overlay}
      </div>

      ${renderMediaCaption(data.entryId, data.captionClassName, data.captionFields)}
    </figure>
  `;
}
