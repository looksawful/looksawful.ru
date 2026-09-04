import { renderSectionIntro } from "../../../components/composition/section-intro.ts";
import {
  assertNeverSection,
  type JesteiTrackFilterSection,
  type ProjectGroupSection,
  type ProjectPresentation,
  type Section,
  type SpecializedSection,
} from "../../../content/contracts/sections.ts";
import { renderRevealAttribute, renderRevealGroupAttribute } from "../../../motion-contract.ts";
import type { CreditsData } from "../../../types/content.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { renderContentBlocks } from "./content-block.ts";

export interface SpecializedSectionRenderers {
  jesteiTrackFilter?: (section: JesteiTrackFilterSection) => string;
}

export interface SectionRenderOptions {
  specialized?: SpecializedSectionRenderers;
}

function renderCredits(credits?: CreditsData): string {
  const lines = credits?.lines?.filter(Boolean) ?? [];
  if (!credits?.title && !lines.length) return "";

  const title = credits?.title
    ? `<strong class="credits__title">${escapeHtml(credits.title)}</strong>`
    : "";
  const lineHtml = lines
    .map((line) => `<span class="credits__line">${escapeHtml(line)}</span>`)
    .join("");

  return `
    <header class="media-group__head flow"${renderRevealGroupAttribute()}>
      <p class="credits"${renderRevealAttribute("copy")}>
        ${title}
        ${lineHtml}
      </p>
    </header>
  `;
}

function renderSectionShell(
  section: Exclude<Section, SpecializedSection>,
  body: string,
  extraAttributes = "",
): string {
  return `
    <section
      class="project__section wrapper stack"
      id="${escapeHtml(section.id)}"
      data-section-type="${escapeHtml(section.type)}"
      data-media-caption-scope${extraAttributes}
    >
      ${body}
    </section>
  `;
}

function renderIntroAndBlocks(section: Extract<Section, { type: "content" | "project" }>): string {
  const intro = section.intro ? renderSectionIntro(section.intro) : "";
  const credits = renderCredits(section.credits);
  const blocks = renderContentBlocks(section.blocks);
  const projectAttribute =
    section.type === "project" ? ` data-project-id="${escapeHtml(section.projectId)}"` : "";

  return renderSectionShell(section, `${intro}\n${credits}\n${blocks}`, projectAttribute);
}

function renderProjectPresentation(item: ProjectPresentation): string {
  const intro = item.intro ? renderSectionIntro(item.intro) : "";
  const credits = renderCredits(item.credits);
  const blocks = renderContentBlocks(item.blocks);

  return `
    <div class="stack" data-project-id="${escapeHtml(item.projectId)}" data-media-caption-scope>
      ${intro}
      ${credits}
      ${blocks}
    </div>
  `;
}

function renderProjectGroup(section: ProjectGroupSection): string {
  const intro = section.intro ? renderSectionIntro(section.intro) : "";
  const credits = renderCredits(section.credits);
  const items = section.items.map(renderProjectPresentation).join("\n");

  return renderSectionShell(section, `${intro}\n${credits}\n${items}`);
}

function assertNeverSpecializedSection(section: never): never {
  throw new Error(`Unhandled SpecializedSection: ${JSON.stringify(section)}`);
}

function renderSpecializedSection(
  section: SpecializedSection,
  renderers: SpecializedSectionRenderers = {},
): string {
  switch (section.kind) {
    case "jestei-track-filter": {
      const renderer = renderers.jesteiTrackFilter;
      if (!renderer) {
        throw new Error("Missing specialized renderer: jestei-track-filter");
      }
      return renderer(section);
    }
    default:
      return assertNeverSpecializedSection(section);
  }
}

export function renderSection(section: Section, options: SectionRenderOptions = {}): string {
  switch (section.type) {
    case "content":
    case "project":
      return renderIntroAndBlocks(section);
    case "project-group":
      return renderProjectGroup(section);
    case "specialized":
      return renderSpecializedSection(section, options.specialized);
    default:
      return assertNeverSection(section);
  }
}

export function renderSections(
  sections: readonly Section[],
  options: SectionRenderOptions = {},
): string {
  return sections
    .map(
      (section) =>
        `<div class="divider wrapper" aria-hidden="true"></div>\n${renderSection(section, options)}`,
    )
    .join("\n");
}
