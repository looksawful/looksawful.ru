import { renderSectionIntro } from "../../../components/composition/section-intro.ts";
import {
  assertNeverSection,
  type JesteiTrackFilterSection,
  type ProjectGroupSection,
  type ProjectPresentation,
  type Section,
  type SectionPresentation,
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

function sectionShellPresentation(presentation?: SectionPresentation): {
  className: string;
  attributes: string;
} {
  switch (presentation?.layout ?? "stack") {
    case "stack":
      return {
        className: "project__section wrapper stack",
        attributes: "",
      };
    case "mockup-grid-reel":
      return {
        className: "project__section wrapper media-group",
        attributes:
          ' data-layout="grid" data-compact-layout="reel" style="--group-columns: 4; --group-compact-item-size: min(72cqi, 18rem); --group-compact-align: stretch; --group-wide-item-inline-size: min(100%, 18rem)"',
      };
  }
}

function renderSectionShell(
  section: Exclude<Section, SpecializedSection>,
  body: string,
  extraAttributes = "",
): string {
  const presentation = "presentation" in section ? sectionShellPresentation(section.presentation) : sectionShellPresentation();

  return `
    <section
      class="${presentation.className}"
      id="${escapeHtml(section.id)}"
      data-section-type="${escapeHtml(section.type)}"
      data-media-caption-scope${presentation.attributes}${extraAttributes}
    >
      ${body}
    </section>
  `;
}

function renderBlockBody(
  section: Extract<Section, { type: "content" | "project" }>,
): string {
  const blocks = renderContentBlocks(section.blocks);

  if (section.presentation?.layout === "mockup-grid-reel") {
    return `<div class="media-group__items reel">${blocks}</div>`;
  }

  return blocks;
}

function renderIntroAndBlocks(section: Extract<Section, { type: "content" | "project" }>): string {
  const intro = section.intro ? renderSectionIntro(section.intro) : "";
  const credits = renderCredits(section.credits);
  const blocks = renderBlockBody(section);
  const projectAttribute =
    section.type === "project" ? ` data-project-id="${escapeHtml(section.projectId)}"` : "";

  return renderSectionShell(section, `${intro}\n${credits}\n${blocks}`, projectAttribute);
}

function renderProjectPresentation(item: ProjectPresentation): string {
  const intro = item.intro ? renderSectionIntro(item.intro) : "";
  const credits = renderCredits(item.credits);
  const blocks = renderContentBlocks(item.blocks);
  const body = item.presentation?.layout === "mockup-grid-reel"
    ? `<div class="media-group__items reel">${blocks}</div>`
    : blocks;
  const presentation = sectionShellPresentation(item.presentation);

  return `
    <div class="${presentation.className}" data-project-id="${escapeHtml(item.projectId)}" data-media-caption-scope${presentation.attributes}>
      ${intro}
      ${credits}
      ${body}
    </div>
  `;
}

function renderProjectGroup(section: ProjectGroupSection): string {
  const intro = section.intro ? renderSectionIntro(section.intro) : "";
  const credits = renderCredits(section.credits);
  const items = section.items.map(renderProjectPresentation).join("\n");

  return renderSectionShell(section, `${intro}\n${credits}\n${items}`);
}

function renderSpecializedSection(
  section: JesteiTrackFilterSection,
  renderers: SpecializedSectionRenderers = {},
): string {
  const renderer = renderers.jesteiTrackFilter;
  if (!renderer) {
    throw new Error("Missing specialized renderer: jestei-track-filter");
  }
  return renderer(section);
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
