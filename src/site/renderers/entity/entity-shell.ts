import { renderEntityIntro } from "../../../components/composition/entity-intro.ts";
import type { EntityPageContent } from "../../../content/contracts/page-content.ts";
import type { EntityStandalonePresentation } from "../../pages/entity-presentation.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { renderSections, type SectionRenderOptions } from "./section.ts";

export interface EntityShellOptions extends SectionRenderOptions {
  articleId: string;
  theme?: string;
  navigationProject?: boolean;
  introHeadingLevel?: 1 | 2;
  visuallyHideIntroTitle?: boolean;
  standalonePresentation?: EntityStandalonePresentation;
  footerHtml?: string;
}

function applyStandalonePresentation(
  content: EntityPageContent,
  policy: EntityStandalonePresentation = {},
): EntityPageContent {
  const introPolicy = policy.intro ?? {};
  const hiddenSections = new Set(policy.hiddenSectionIds ?? []);
  const sectionsPolicy = policy.sections ?? {};

  const sections = content.sections
    .filter((section) => !hiddenSections.has(section.id))
    .filter((section) => {
      if (!sectionsPolicy.omitEmpty) return true;
      if (section.type !== "content" && section.type !== "project") return true;
      return section.blocks.length > 0;
    })
    .map((section) => {
      if (sectionsPolicy.copy !== false || (section.type !== "content" && section.type !== "project")) {
        return section;
      }
      return {
        ...section,
        intro: undefined,
        heading: undefined,
        credits: undefined,
        note: undefined,
        resources: undefined,
      };
    });

  return {
    ...content,
    intro: {
      ...content.intro,
      ...(introPolicy.head === false ? { head: undefined } : {}),
      ...(introPolicy.role === false ? { role: undefined } : {}),
      ...(introPolicy.period === false ? { period: undefined } : {}),
      ...(introPolicy.summary === false ? { summary: undefined } : {}),
      ...(introPolicy.lead === false ? { lead: undefined } : {}),
      ...(introPolicy.links === false ? { linksLabel: undefined, links: undefined } : {}),
    },
    sections,
  };
}

export function renderEntityShell(content: EntityPageContent, options: EntityShellOptions): string {
  const presentedContent = applyStandalonePresentation(content, options.standalonePresentation);
  const attributes = [`class="project"`, `id="${escapeHtml(options.articleId)}"`];

  if (options.navigationProject) attributes.push("data-navigation-project");
  if (options.theme) attributes.push(`data-theme="${escapeHtml(options.theme)}"`);

  const intro = renderEntityIntro(presentedContent.intro, {
    headingLevel: options.introHeadingLevel ?? 1,
    visuallyHideTitle: options.visuallyHideIntroTitle === true,
  });
  const sections = renderSections(presentedContent.sections, {
    ...options,
    suppressCaptions: options.standalonePresentation?.suppressCaptions ?? options.suppressCaptions,
  });

  return `
    <article ${attributes.join(" ")}>
      ${intro}
      ${sections}
      ${options.footerHtml ?? ""}
    </article>
  `;
}
