import type { MediaEntryId } from "../data/media/index.ts";
import type { JustifiedGalleryData } from "../types/justified-gallery.ts";
import type { EditorialCopyRenderOptions } from "../types/render-options.ts";
import { renderRevealGroupAttribute, renderRevealRailAttribute } from "../motion-contract.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderMediaFigure } from "./media-figure.ts";

export function renderJustifiedGallery(
  data: JustifiedGalleryData<MediaEntryId>,
  options: EditorialCopyRenderOptions = {},
): string {
  const classes = ["justified-gallery", data.className].filter(Boolean).join(" ");

  const rows = data.rows
    .map(
      (row) => `
        <div class="justified-gallery__row reel"${renderRevealGroupAttribute()}${renderRevealRailAttribute()} data-row-kind="${escapeHtml(row.kind)}">
          ${row.items
            .map((item) =>
              renderMediaFigure(
                {
                  ...item,
                  captionView: item.captionView ?? data.captionView,
                },
                { mediaDimensions: false, showEditorialCopy: options.showEditorialCopy },
              ),
            )
            .join("\n")}
        </div>
      `,
    )
    .join("\n");

  return `
    <div class="${escapeHtml(classes)}">
      ${rows}
    </div>
  `;
}
