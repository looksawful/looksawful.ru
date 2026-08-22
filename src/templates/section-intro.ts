import type { SectionIntroData } from "../types/content.ts";

import { escapeHtml } from "../utils/html.ts";

function renderParagraphs(data: SectionIntroData): string {
  if (!data.paragraphs?.length) {
    return "";
  }

  if (data.bodyClassName) {
    const paragraphs = data.paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");

    return `
      <div class="section-copy__text ${escapeHtml(data.bodyClassName)}">
        ${paragraphs}
      </div>
    `;
  }

  return data.paragraphs
    .map((paragraph) => `<p class="section-copy__text">${escapeHtml(paragraph)}</p>`)
    .join("");
}

export function renderSectionIntro(data: SectionIntroData): string {
  return `
    <header class="section-copy flow">
      <h3 class="section-copy__title">
        ${escapeHtml(data.title)}
      </h3>

      ${renderParagraphs(data)}
    </header>
  `;
}
