import type { MediaEntryId } from "../data/media/index.ts";
import type { JustifiedGalleryData } from "../types/justified-gallery.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderMediaFigure } from "./media-figure.ts";

export function renderJustifiedGallery(data: JustifiedGalleryData<MediaEntryId>): string {
  const classes = ["justified-gallery", data.className].filter(Boolean).join(" ");

  const rows = data.rows
    .map(
      (row) => `
        <div class="justified-gallery__row reel" data-row-kind="${escapeHtml(row.kind)}">
          ${row.items
            .map((item) =>
              renderMediaFigure(
                {
                  ...item,
                  captionView: item.captionView ?? data.captionView,
                },
                { mediaDimensions: false },
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
