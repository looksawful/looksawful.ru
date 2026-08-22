import type { SectionIntroData } from "../types/content.ts";

import { escapeHtml } from "../utils/html.ts";

export function renderSectionIntro(data: SectionIntroData): string {
  const paragraphs =
    data.paragraphs
      ?.map((paragraph) => `<p class="section-copy__text">${escapeHtml(paragraph)}</p>`)
      .join("") ?? "";

  return `
    <header class="section-copy flow">
      <h3 class="section-copy__title">
        ${escapeHtml(data.title)}
      </h3>

      ${paragraphs}
    </header>
  `;
}
