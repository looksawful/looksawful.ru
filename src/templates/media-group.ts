import type { MediaEntryId } from "../data/media/index.ts";

import type {
  BentoMediaGroupData,
  CompactReelGridMediaGroupData,
  EditorialMediaGroupData,
  GridMediaGroupData,
  GridMediaGroupItemData,
  MasonryMediaGroupData,
  MediaGroupData,
  MediaGroupHeadData,
  MediaGroupItemBase,
  MediaGroupLinkData,
  MediaGroupNoteData,
  OverflowReelGridMediaGroupData,
  PlainGridMediaGroupData,
  SequenceMediaGroupData,
  StripMediaGroupData,
} from "../types/media-group.ts";

import type { MediaCaptionView, MediaFigureData } from "../types/media-presentation.ts";

import { renderRevealAttribute, renderRevealGroupAttribute, renderRevealRailAttribute } from "../motion-contract.ts";
import { escapeHtml } from "../utils/html.ts";

import {
  renderMediaFigure,
  type MediaFigurePlacement,
  type MediaFigureRevealPolicy,
} from "./media-figure.ts";

/* ==================================================
   Shared helpers
   ================================================== */

function pushVariable(variables: string[], name: string, value: string | number | undefined): void {
  if (value === undefined) {
    return;
  }

  variables.push(`${name}: ${value}`);
}

function renderVariables(variables: readonly string[]): string {
  if (!variables.length) {
    return "";
  }

  return ` style="${escapeHtml(`${variables.join("; ")};`)}"`;
}

/* ==================================================
   Group style
   ================================================== */

function renderGridStyle(data: GridMediaGroupData<MediaEntryId>): string[] {
  const variables: string[] = [];

  if (data.mode === "overflow-reel") {
    pushVariable(variables, "--group-mobile-rows", data.mobileRows);

    pushVariable(variables, "--group-reel-height", data.reelHeight);

    return variables;
  }

  if (data.mode === "compact-reel") {
    pushVariable(variables, "--group-columns", data.columns);

    pushVariable(variables, "--group-compact-item-size", data.compactItemSize);

    pushVariable(variables, "--group-compact-item-inline-size", data.compactItemInlineSize);

    pushVariable(variables, "--group-compact-align", data.compactAlign);

    pushVariable(variables, "--group-wide-item-inline-size", data.wideItemInlineSize);

    return variables;
  }

  pushVariable(variables, "--group-columns", data.columns);

  pushVariable(variables, "--group-mobile-columns", data.mobileColumns);

  return variables;
}

function renderGroupStyle(data: MediaGroupData<MediaEntryId>): string {
  const variables: string[] = [];

  switch (data.layout) {
    case "grid":
      variables.push(...renderGridStyle(data));

      break;

    case "strip":
      pushVariable(variables, "--strip-height", data.height);

      pushVariable(variables, "--infinite-reel-duration", data.infiniteReel?.duration);

      break;

    case "masonry":
      pushVariable(variables, "--masonry-columns", data.columns);

      pushVariable(variables, "--masonry-mobile-columns", data.mobileColumns);

      break;

    case "bento":
      pushVariable(variables, "--bento-rows", data.rows);

      pushVariable(variables, "--bento-columns", data.columns);

      pushVariable(variables, "--bento-cell-size", data.cellSize);

      pushVariable(variables, "--bento-height", data.height);

      break;

    case "sequence":
      pushVariable(variables, "--sequence-columns", data.columns);

      pushVariable(variables, "--sequence-mobile-rows", data.mobileRows);

      pushVariable(variables, "--sequence-ratio", data.ratio);

      break;

    case "editorial":
      break;
  }

  return renderVariables(variables);
}

/* ==================================================
   Group attributes
   ================================================== */

function renderGroupAttributes(data: MediaGroupData<MediaEntryId>): string {
  const attributes: string[] = [`data-layout="${escapeHtml(data.layout)}"`];

  if (data.layout === "grid") {
    if (data.mode === "overflow-reel") {
      attributes.push(`data-overflow="reel"`);
    }

    if (data.mode === "compact-reel") {
      attributes.push(`data-compact-layout="reel"`);
    }
  }

  if (data.layout === "sequence" && data.middleOverflow === "reel") {
    attributes.push(`data-middle-overflow="reel"`);
  }

  if (data.layout === "strip" && data.infiniteReel) {
    attributes.push(`data-infinite-reel=""`);
  }

  if (data.ariaLabelledBy) {
    attributes.push(`aria-labelledby="${escapeHtml(data.ariaLabelledBy)}"`);
  }

  return attributes.join(" ");
}

/* ==================================================
   Group head
   ================================================== */

function renderLink(link: MediaGroupLinkData): string {
  const target = link.target ? ` target="${escapeHtml(link.target)}"` : "";

  const rel = link.rel ? ` rel="${escapeHtml(link.rel)}"` : "";

  return `<a href="${escapeHtml(link.href)}"${target}${rel}>${escapeHtml(link.label)}</a>`;
}

function renderNote(note: MediaGroupNoteData, reveal: boolean): string {
  const className = note.kind === "editorial" ? "editorial-note" : "group-note";

  const link = note.link ? ` ${renderLink(note.link)}` : "";

  if (!note.text && !link) return "";

  return `
    <p class="${className}"${renderRevealAttribute(reveal ? "copy" : false)}>
      ${escapeHtml(note.text)}${link}
    </p>
  `;
}

function renderGroupHead(head?: MediaGroupHeadData, reveal = true): string {
  if (!head) {
    return "";
  }

  const credits = head.credits;
  const creditLines = credits?.lines?.filter(Boolean) ?? [];

  const hasCredits = Boolean(credits?.title || creditLines.length);

  const creditsHtml = hasCredits
    ? `
        <p class="credits"${renderRevealAttribute(reveal ? "copy" : false)}>
          ${
            credits?.title
              ? `<strong class="credits__title">${escapeHtml(credits.title)}</strong>`
              : ""
          }

          ${
            creditLines
              .map((line) => `<span class="credits__line">${escapeHtml(line)}</span>`)
              .join("")
          }
        </p>
      `
    : "";

  const noteHtml = head.note ? renderNote(head.note, reveal) : "";

  if (!creditsHtml && !noteHtml) {
    return "";
  }

  const classes = ["media-group__head", head.className ?? "flow"].filter(Boolean).join(" ");

  const style = head.style ? ` style="${escapeHtml(head.style)}"` : "";

  return `
    <header class="${escapeHtml(classes)}"${renderRevealGroupAttribute(reveal)}${style}>
      ${creditsHtml}
      ${noteHtml}
    </header>
  `;
}

/* ==================================================
   Item → figure
   ================================================== */

function toFigureData(
  item: MediaGroupItemBase<MediaEntryId>,
  groupCaptionView: MediaCaptionView,
): MediaFigureData<MediaEntryId> {
  return {
    entryId: item.entryId,

    captionView: item.captionView ?? groupCaptionView,

    loading: item.loading,

    className: item.className,

    mediaClassName: item.mediaClassName,

    surfaceClassName: item.surfaceClassName,

    captionClassName: item.captionClassName,

    captionFields: item.captionFields,

    surface: item.surface,

    surfaceLayout: item.surfaceLayout,

    surfaceEntries: item.surfaceEntries,

    surfaceDeck: item.surfaceDeck,

    surfaceOverlay: item.surfaceOverlay,

    lightbox: item.lightbox,

    video: item.video,
  };
}

/* ==================================================
   Placement
   ================================================== */

function gridPlacement(item: GridMediaGroupItemData<MediaEntryId>): MediaFigurePlacement {
  return {
    kind: "grid",
    role: item.role,
  };
}

function editorialPlacement(
  item: EditorialMediaGroupData<MediaEntryId>["items"][number],
): MediaFigurePlacement {
  return {
    kind: "editorial",

    role: item.role,

    start: item.start,

    span: item.span,
  };
}

function bentoPlacement(
  item: BentoMediaGroupData<MediaEntryId>["items"][number],
): MediaFigurePlacement {
  return {
    kind: "bento",

    colSpan: item.colSpan,

    rowSpan: item.rowSpan,
  };
}

function sequencePlacement(): MediaFigurePlacement {
  return {
    kind: "sequence",
    role: "wide",
  };
}

/* ==================================================
   Grid
   ================================================== */

function renderPlainGridItems(data: PlainGridMediaGroupData<MediaEntryId>): string {
  return data.items
    .map((item) =>
      renderMediaFigure(toFigureData(item, data.captionView), {
        placement: gridPlacement(item),
      }),
    )
    .join("\n");
}

function renderOverflowGridItems(data: OverflowReelGridMediaGroupData<MediaEntryId>): string {
  return data.items
    .map((item) =>
      renderMediaFigure(toFigureData(item, data.captionView), {
        placement: gridPlacement(item),
        reveal: false,
      }),
    )
    .join("\n");
}

function renderCompactGridItems(data: CompactReelGridMediaGroupData<MediaEntryId>): string {
  return data.items
    .map((item) =>
      renderMediaFigure(toFigureData(item, data.captionView), {
        placement: gridPlacement(item),
      }),
    )
    .join("\n");
}

function renderGridItems(data: GridMediaGroupData<MediaEntryId>): string {
  if (data.mode === "overflow-reel") {
    return renderOverflowGridItems(data);
  }

  if (data.mode === "compact-reel") {
    return renderCompactGridItems(data);
  }

  return renderPlainGridItems(data);
}

/* ==================================================
   Strip
   ================================================== */

function renderStripItems(data: StripMediaGroupData<MediaEntryId>): string {
  const reveal: MediaFigureRevealPolicy = data.infiniteReel ? false : "auto";

  return data.items
    .map((item) => renderMediaFigure(toFigureData(item, data.captionView), { reveal }))
    .join("\n");
}

/* ==================================================
   Masonry
   ================================================== */

function renderMasonryItems(data: MasonryMediaGroupData<MediaEntryId>): string {
  return data.items
    .map((item) => renderMediaFigure(toFigureData(item, data.captionView)))
    .join("\n");
}

/* ==================================================
   Bento
   ================================================== */

function renderBentoItems(data: BentoMediaGroupData<MediaEntryId>): string {
  return data.items
    .map((item) =>
      renderMediaFigure(toFigureData(item, data.captionView), {
        placement: bentoPlacement(item),
      }),
    )
    .join("\n");
}

/* ==================================================
   Editorial
   ================================================== */

function renderEditorialItems(data: EditorialMediaGroupData<MediaEntryId>): string {
  return data.items
    .map((item) =>
      renderMediaFigure(toFigureData(item, data.captionView), {
        placement: editorialPlacement(item),
      }),
    )
    .join("\n");
}

/* ==================================================
   Sequence
   ================================================== */

function renderSequenceItems(data: SequenceMediaGroupData<MediaEntryId>): string {
  const leading = renderMediaFigure(toFigureData(data.leading, data.captionView), {
    placement: sequencePlacement(),
  });

  const middle = data.middle
    .map((item) => renderMediaFigure(toFigureData(item, data.captionView)))
    .join("\n");

  const trailing = renderMediaFigure(toFigureData(data.trailing, data.captionView), {
    placement: sequencePlacement(),
  });

  const middleClasses = ["media-group__middle", data.middleOverflow === "reel" ? "reel" : undefined]
    .filter(Boolean)
    .join(" ");

  const middleMotion =
    data.middleOverflow === "reel"
      ? `${renderRevealGroupAttribute()}${renderRevealRailAttribute()}`
      : "";

  return `
    ${leading}

    <div class="${middleClasses}"${middleMotion}>
      ${middle}
    </div>

    ${trailing}
  `;
}

/* ==================================================
   Layout dispatch
   ================================================== */

function renderItems(data: MediaGroupData<MediaEntryId>): string {
  switch (data.layout) {
    case "grid":
      return renderGridItems(data);

    case "strip":
      return renderStripItems(data);

    case "masonry":
      return renderMasonryItems(data);

    case "bento":
      return renderBentoItems(data);

    case "editorial":
      return renderEditorialItems(data);

    case "sequence":
      return renderSequenceItems(data);
  }
}

/* ==================================================
   Track
   ================================================== */

function usesOuterReel(data: MediaGroupData<MediaEntryId>): boolean {
  switch (data.layout) {
    case "strip":
    case "bento":
      return true;

    case "grid":
      return data.mode === "overflow-reel" || data.mode === "compact-reel";

    case "sequence":
      return data.middleOverflow !== "reel";

    case "masonry":
    case "editorial":
      return false;
  }
}

function renderTrackAttribute(data: MediaGroupData<MediaEntryId>): string {
  return data.layout === "strip" && data.infiniteReel ? ` data-infinite-reel-track=""` : "";
}

function usesOuterRevealGroup(data: MediaGroupData<MediaEntryId>): boolean {
  if (data.layout === "grid") {
    return data.mode !== "overflow-reel";
  }

  if (data.layout === "strip") {
    return !data.infiniteReel;
  }

  return true;
}

function usesOuterRevealRail(data: MediaGroupData<MediaEntryId>): boolean {
  switch (data.layout) {
    case "grid":
      return data.mode === "overflow-reel" || data.mode === "compact-reel";

    case "strip":
      return !data.infiniteReel;

    case "bento":
      return true;

    case "sequence":
      return data.middleOverflow !== "reel";

    case "masonry":
    case "editorial":
      return false;
  }
}

function renderItemsMotionAttributes(data: MediaGroupData<MediaEntryId>): string {
  return `${renderRevealGroupAttribute(usesOuterRevealGroup(data))}${renderRevealRailAttribute(
    usesOuterRevealRail(data),
  )}`;
}

/* ==================================================
   Media group
   ================================================== */

export function renderMediaGroup(data: MediaGroupData<MediaEntryId>): string {
  const classes = ["media-group", data.className].filter(Boolean).join(" ");

  const itemClasses = ["media-group__items", usesOuterReel(data) ? "reel" : undefined]
    .filter(Boolean)
    .join(" ");

  const attributes = renderGroupAttributes(data);

  const style = renderGroupStyle(data);

  const head = renderGroupHead(data.head, !(data.layout === "strip" && data.infiniteReel));

  const track = renderTrackAttribute(data);

  const element = data.element ?? "section";

  return `
    <${element}
      class="${escapeHtml(classes)}"
      ${attributes}${style}
    >
      ${head}

      <div
        class="${escapeHtml(itemClasses)}"${renderItemsMotionAttributes(data)}${track}
      >
        ${renderItems(data)}
      </div>
    </${element}>
  `;
}
