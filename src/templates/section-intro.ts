import type { SectionIntroData } from "../types/content.ts";

import { renderRevealAttribute, renderRevealGroupAttribute } from "../motion-contract.ts";
import { escapeHtml } from "../utils/html.ts";

interface SectionIntroRenderOptions {
  reveal?: boolean;
}

function renderParagraphs(data: SectionIntroData, reveal: boolean): string {
  if (!data.paragraphs?.length) {
    return "";
  }

  if (data.bodyClassName) {
    const paragraphs = data.paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");

    return `
      <div class="section-copy__text ${escapeHtml(data.bodyClassName)}"${renderRevealAttribute(
        reveal ? "copy" : false,
      )}>
        ${paragraphs}
      </div>
    `;
  }

  return data.paragraphs
    .map(
      (paragraph) =>
        `<p class="section-copy__text"${renderRevealAttribute(reveal ? "copy" : false)}>${escapeHtml(
          paragraph,
        )}</p>`,
    )
    .join("");
}

export function renderSectionIntro(data: SectionIntroData, options: SectionIntroRenderOptions = {}): string {
  const reveal = options.reveal ?? true;

  return `
    <header class="section-copy flow"${renderRevealGroupAttribute(reveal)}>
      <h3 class="section-copy__title"${renderRevealAttribute(reveal ? "copy" : false)}>
        ${escapeHtml(data.title)}
      </h3>

      ${renderParagraphs(data, reveal)}
    </header>
  `;
}
