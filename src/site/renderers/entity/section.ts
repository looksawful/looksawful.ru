import { renderSectionIntro } from "../../../components/composition/section-intro.ts";
import {
  assertNeverSection,
  type JesteiTrackFilterSection,
  type ProjectGroupSection,
  type ProjectPresentation,
  type Section,
  type SpecializedSection,
} from "../../../content/contracts/sections.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { renderContentBlocks } from "./content-block.ts";

export interface SpecializedSectionRenderers {
  jesteiTrackFilter?: (section: JesteiTrackFilterSection) => string;
}

export interface SectionRenderOptions {
  specialized?: SpecializedSectionRenderers;
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
  const blocks = renderContentBlocks(section.blocks);
  const projectAttribute =
    section.type === "project" ? ` data-project-id="${escapeHtml(section.projectId)}"` : "";

  return renderSectionShell(section, `${intro}\n${blocks}`, projectAttribute);
}

function renderProjectPresentation(item: ProjectPresentation): string {
  const intro = item.intro ? renderSectionIntro(item.intro) : "";
  const blocks = renderContentBlocks(item.blocks);

  return `
    <div class="stack" data-project-id="${escapeHtml(item.projectId)}">
      ${intro}
      ${blocks}
    </div>
  `;
}

function renderProjectGroup(section: ProjectGroupSection): string {
  const intro = section.intro ? renderSectionIntro(section.intro) : "";
  const items = section.items.map(renderProjectPresentation).join("\n");

  return renderSectionShell(section, `${intro}\n${items}`);
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
  return sections.map((section) => renderSection(section, options)).join("\n");
}
