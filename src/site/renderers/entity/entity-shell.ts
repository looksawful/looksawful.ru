import { renderEntityIntro } from "../../../components/composition/entity-intro.ts";
import type { EntityPageContent } from "../../../content/contracts/page-content.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { renderSections, type SectionRenderOptions } from "./section.ts";

export interface EntityShellOptions extends SectionRenderOptions {
  /** Stable DOM id preserved from the current public article contract. */
  articleId: string;
  /** Existing page-level visual theme token; normalized separately from PageContent. */
  theme?: string;
  /** Home uses this hook for intra-page project navigation; standalone pages do not require it. */
  navigationProject?: boolean;
  introHeadingLevel?: 1 | 2;
}

export function renderEntityShell(
  content: EntityPageContent,
  options: EntityShellOptions,
): string {
  const attributes = [
    `class="project"`,
    `id="${escapeHtml(options.articleId)}"`,
  ];

  if (options.navigationProject) {
    attributes.push("data-navigation-project");
  }

  if (options.theme) {
    attributes.push(`data-theme="${escapeHtml(options.theme)}"`);
  }

  const intro = renderEntityIntro(content.intro, {
    headingLevel: options.introHeadingLevel ?? 1,
  });
  const sections = renderSections(content.sections, options);

  return `
    <article ${attributes.join(" ")}>
      ${intro}
      ${sections}
    </article>
  `;
}
