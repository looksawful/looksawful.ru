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

  const bodyClassName = data.bodyClassName ? ` ${escapeHtml(data.bodyClassName)}` : "";
  const paragraphReveal = data.bodyClassName ? "" : renderRevealAttribute(reveal ? "copy" : false);
  const bodyReveal = data.bodyClassName ? renderRevealAttribute(reveal ? "copy" : false) : "";
  const paragraphHtml = paragraphs
    .map((paragraph) => `<p${paragraphReveal}>${escapeHtml(paragraph)}</p>`)
    .join("");

  return `
    <div class="section-copy__text prose${bodyClassName}"${bodyReveal}>
      ${paragraphHtml}
    </div>
  `;
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
    <header class="section-copy text-pair"${renderRevealGroupAttribute(reveal)}>
      ${title}

      ${paragraphs}
    </header>
  `;
}
