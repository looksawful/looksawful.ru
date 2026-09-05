import type { SectionIntroData } from "../types/content.ts";

import { renderRevealAttribute, renderRevealGroupAttribute } from "../motion-contract.ts";
import { escapeHtml } from "../utils/html.ts";

interface SectionIntroRenderOptions {
  reveal?: boolean;
}

function renderParagraphs(data: SectionIntroData, reveal: boolean): string {
  const paragraphs = data.paragraphs?.filter(Boolean) ?? [];

  if (!paragraphs.length) {
    return "";
  }

  if (data.bodyClassName) {
    const paragraphHtml = paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");

    return `
      <div class="section-copy__text ${escapeHtml(data.bodyClassName)}"${renderRevealAttribute(
        reveal ? "copy" : false,
      )}>
        ${paragraphHtml}
      </div>
    `;
  }

  return paragraphs
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
  const paragraphs = renderParagraphs(data, reveal);
  if (!data.title && !paragraphs) return "";
  const title = data.title
    ? `<h3 class="section-copy__title"${renderRevealAttribute(reveal ? "copy" : false)}>
        ${escapeHtml(data.title)}
      </h3>`
    : "";

  return `
    <header class="section-copy flow"${renderRevealGroupAttribute(reveal)}>
      ${title}

      ${paragraphs}
    </header>
  `;
}
