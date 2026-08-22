import type { MediaEntryId } from "../data/media/index.ts";

import type { MockupData } from "../types/content.ts";

import { escapeHtml } from "../utils/html.ts";

import { renderMediaCaption, renderMediaElement } from "./media-figure.ts";

export function renderMockup(data: MockupData<MediaEntryId>): string {
  const classes = ["media", "mockup", data.className].filter(Boolean).join(" ");

  const role = data.role ? ` data-role="${escapeHtml(data.role)}"` : "";

  const theme = data.theme ? ` data-mockup-theme="${escapeHtml(data.theme)}"` : "";

  const captionRest = data.captionRest
    ? ` data-caption-rest="${escapeHtml(data.captionRest)}"`
    : "";

  const captionMode = data.captionMode === "overlay" ? ` data-caption="overlay"` : "";

  const tabIndex = data.tabIndex === 0 ? ` tabindex="0"` : "";

  return `
    <figure
      class="${escapeHtml(classes)}"
      data-device="${escapeHtml(data.device)}"
      ${role}
      ${theme}
      ${captionRest}
      ${captionMode}
      ${tabIndex}
    >
      <div class="mockup__frame">
        <div class="mockup__viewport">
          ${renderMediaElement(data.entryId, {
            loading: data.loading,
            className: data.mediaClassName,
            video: data.video,
          })}
        </div>
      </div>

      ${renderMediaCaption(data.entryId)}
    </figure>
  `;
}
