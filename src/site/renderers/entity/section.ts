import { renderSectionIntro } from "../../../components/composition/section-intro.ts";
import { renderMovesCanvasDemo } from "../../../components/specialized/index.ts";
import {
  assertNeverSection,
  type JesteiTrackFilterSection,
  type MovesCanvasDemoSection,
  type ProjectGroupSection,
  type ProjectPresentation,
  type Section,
  type SectionPresentation,
} from "../../../content/contracts/sections.ts";
import { renderRevealAttribute, renderRevealGroupAttribute } from "../../../motion-contract.ts";
import type { CreditsData, SectionNoteData } from "../../../types/content.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { renderContentBlocks } from "./content-block.ts";

export interface SpecializedSectionRenderers {
  jesteiTrackFilter?: (section: JesteiTrackFilterSection) => string;
}

export interface SectionRenderOptions {
  specialized?: SpecializedSectionRenderers;
}

function usesGlobalReveal(presentation?: SectionPresentation): boolean {
  return presentation?.motion !== "section-owned";
}

function renderSectionHead(
  credits?: CreditsData,
  note?: SectionNoteData,
  reveal = true,
): string {
  const lines = credits?.lines?.filter(Boolean) ?? [];
  const hasCredits = Boolean(credits?.title || lines.length);
  const hasNote = Boolean(note?.text || note?.link);

  if (!hasCredits && !hasNote) return "";

  const creditsHtml = hasCredits
    ? `<p class="credits"${renderRevealAttribute(reveal ? "copy" : false)}>
        ${
          credits?.title
            ? `<strong class="credits__title">${escapeHtml(credits.title)}</strong>`
            : ""
        }
        ${lines.map((line) => `<span class="credits__line">${escapeHtml(line)}</span>`).join("")}
      </p>`
    : "";

  const noteLink = note?.link
    ? ` <a href="${escapeHtml(note.link.href)}"${
        note.link.rel ? ` rel="${escapeHtml(note.link.rel)}"` : ""
      }${note.link.target ? ` target="${escapeHtml(note.link.target)}"` : ""}>${escapeHtml(
        note.link.label,
      )}</a>`
    : "";
  const noteHtml = hasNote
    ? `<p class="group-note"${renderRevealAttribute(reveal ? "copy" : false)}>${escapeHtml(
        note?.text ?? "",
      )}${noteLink}</p>`
    : "";

  return `
    <header class="media-group__head flow"${renderRevealGroupAttribute(reveal)}>
      ${creditsHtml}
      ${noteHtml}
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
    case "infinite-media-reel":
      return {
        className: "project__section wrapper media-group",
        attributes:
          ' data-infinite-reel="" data-layout="strip" style="--strip-height: clamp(12rem, 30cqi, 20rem); --infinite-reel-duration: 32s"',
      };
  }
}

interface SectionShellInput {
  id: string;
  type: Section["type"];
  presentation?: SectionPresentation;
}

function renderSectionShell(
  section: SectionShellInput,
  body: string,
  extraAttributes = "",
): string {
  const presentation = sectionShellPresentation(section.presentation);

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
  blocks: Extract<Section, { type: "content" | "project" }>["blocks"],
  presentation?: SectionPresentation,
): string {
  const reveal = usesGlobalReveal(presentation);
  const blockHtml = renderContentBlocks(blocks, { reveal });

  switch (presentation?.layout ?? "stack") {
    case "stack":
      return blockHtml;
    case "mockup-grid-reel":
      return `<div class="media-group__items reel">${blockHtml}</div>`;
    case "infinite-media-reel":
      return `<div class="media-group__items reel" data-infinite-reel-track="">${blockHtml}</div>`;
  }
}

function renderIntroAndBlocks(section: Extract<Section, { type: "content" | "project" }>): string {
  const reveal = usesGlobalReveal(section.presentation);
  const intro = section.intro ? renderSectionIntro(section.intro, { reveal }) : "";
  const head = renderSectionHead(section.credits, section.note, reveal);
  const blocks = renderBlockBody(section.blocks, section.presentation);
  const projectAttribute =
    section.type === "project" ? ` data-project-id="${escapeHtml(section.projectId)}"` : "";

  return renderSectionShell(section, `${intro}\n${head}\n${blocks}`, projectAttribute);
}

function renderProjectPresentation(item: ProjectPresentation): string {
  const reveal = usesGlobalReveal(item.presentation);
  const intro = item.intro ? renderSectionIntro(item.intro, { reveal }) : "";
  const head = renderSectionHead(item.credits, item.note, reveal);
  const blockHtml = renderContentBlocks(item.blocks, { reveal });
  const body =
    item.presentation?.layout === "mockup-grid-reel"
      ? `<div class="media-group__items reel">${blockHtml}</div>`
      : item.presentation?.layout === "infinite-media-reel"
        ? `<div class="media-group__items reel" data-infinite-reel-track="">${blockHtml}</div>`
        : blockHtml;
  const presentation = sectionShellPresentation(item.presentation);

  return `
    <div class="${presentation.className}" data-project-id="${escapeHtml(item.projectId)}" data-media-caption-scope${presentation.attributes}>
      ${intro}
      ${head}
      ${body}
    </div>
  `;
}

function renderProjectGroup(section: ProjectGroupSection): string {
  const intro = section.intro ? renderSectionIntro(section.intro) : "";
  const head = renderSectionHead(section.credits, section.note);
  const items = section.items.map(renderProjectPresentation).join("\n");

  return renderSectionShell(section, `${intro}\n${head}\n${items}`);
}

function renderMovesCanvasDemoSection(section: MovesCanvasDemoSection): string {
  return renderSectionShell(
    section,
    renderMovesCanvasDemo(section.gallery),
    ` data-project-id="${escapeHtml(section.projectId)}"`,
  );
}

function renderSpecializedSection(
  section: Extract<Section, { type: "specialized" }>,
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
    case "moves-canvas-demo":
      return renderMovesCanvasDemoSection(section);
    default: {
      const exhaustive: never = section;
      throw new Error(`Unhandled SpecializedSection: ${JSON.stringify(exhaustive)}`);
    }
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
