import type { MediaEntryId } from "../data/media/index.ts";
import type { PageFlipData } from "../types/page-flip.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderMediaElement } from "./media-figure.ts";

function renderCredits(data: PageFlipData<MediaEntryId>["credits"]): string {
  const lines = data.lines
    ?.map((line) => `<span class="credits__line">${escapeHtml(line)}</span>`)
    .join("") ?? "";

  return `<p class="credits"><strong class="credits__title">${escapeHtml(data.title)}</strong>${lines}</p>`;
}

export function renderPageFlip(data: PageFlipData<MediaEntryId>): string {
  const pages = data.pages
    .map(
      (page) => `
        <div class="page-flip__page" data-density="${escapeHtml(page.density ?? "soft")}">
          ${renderMediaElement(page.entryId, {
            loading: page.loading ?? "lazy",
            dimensions: false,
          })}
          <span aria-hidden="true" class="page-flip__index">${page.index}</span>
        </div>
      `,
    )
    .join("\n");

  const spreadCount = Math.max(1, Math.ceil(data.pages.length / 2));
  const count = `01 / ${String(spreadCount).padStart(2, "0")}`;
  const lightbox = data.lightbox === false ? ' data-lightbox="off"' : "";

  return `
    <section class="page-flip"${lightbox} data-page-flip="">
      ${renderCredits(data.credits)}
      <div class="page-flip__stage">
        <div class="page-flip__wrap">
          <div class="page-flip__book" data-page-flip-book="">
            ${pages}
          </div>
        </div>
      </div>
      <div class="page-flip__nav cluster">
        <button aria-label="Назад" data-page-flip-prev="" type="button"><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M12.5 4.5 7 10l5.5 5.5"></path></svg></button>
        <span class="page-flip__count" data-page-flip-count="">${count}</span>
        <button aria-label="Вперёд" data-page-flip-next="" type="button"><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 4.5 5.5 5.5-5.5 5.5"></path></svg></button>
      </div>
    </section>
  `;
}
