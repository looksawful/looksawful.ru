import { renderResourceLinks } from "../../../components/composition/resource-links.ts";
import { renderSectionIntro } from "../../../components/composition/section-intro.ts";
import { renderMovesCanvasDemo } from "../../../components/specialized/index.ts";
import {
  assertNeverSection,
  type JesteiTrackFilterSection,
  type MovesCanvasDemoSection,
  type ProjectGroupSection,
  type ProjectPresentation,
  type Section,
  type SectionHeadOrder,
  type SectionPresentation,
} from "../../../content/contracts/sections.ts";
import { renderRevealAttribute, renderRevealGroupAttribute } from "../../../motion-contract.ts";
import type { CreditsData, SectionHeadingData, SectionNoteData } from "../../../types/content.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { renderContentBlock, renderContentBlocks } from "./content-block.ts";

export interface SpecializedSectionRenderers {
  jesteiTrackFilter?: (section: JesteiTrackFilterSection) => string;
}

export interface SectionRenderOptions {
  specialized?: SpecializedSectionRenderers;
}

function usesGlobalReveal(presentation?: SectionPresentation): boolean {
  return presentation?.motion !== "section-owned";
}

function renderInnerDivider(): string {
  return '<div class="divider" aria-hidden="true"></div>';
}

function renderCredits(credits?: CreditsData, reveal = true): string {
  const lines = credits?.lines?.filter(Boolean) ?? [];
  const hasCredits = Boolean(credits?.title || lines.length);
  if (!hasCredits) return "";

  return `<p class="credits"${renderRevealAttribute(reveal ? "copy" : false)}>
    ${
      credits?.title
        ? `<strong class="credits__title">${escapeHtml(credits.title)}</strong>`
        : ""
    }
    ${lines.map((line) => `<span class="credits__line">${escapeHtml(line)}</span>`).join("")}
  </p>`;
}

function renderSectionHeading(heading?: SectionHeadingData, reveal = true): string {
  if (!heading?.text) return "";
  return `<h3${renderRevealAttribute(reveal ? "copy" : false)}>${escapeHtml(heading.text)}</h3>`;
}

function renderSectionNote(note?: SectionNoteData, reveal = true): string {
  const hasNote = Boolean(note?.text || note?.link);
  if (!hasNote) return "";

  const noteLink = note?.link
    ? ` <a href="${escapeHtml(note.link.href)}"${
        note.link.rel ? ` rel="${escapeHtml(note.link.rel)}"` : ""
      }${note.link.target ? ` target="${escapeHtml(note.link.target)}"` : ""}>${escapeHtml(
        note.link.label,
      )}</a>`
    : "";
  const className = note?.kind === "editorial" ? "editorial-note" : "group-note";

  return `<p class="${className}"${renderRevealAttribute(reveal ? "copy" : false)}>${escapeHtml(
    note?.text ?? "",
  )}${noteLink}</p>`;
}

function renderSectionHead(
  credits?: CreditsData,
  note?: SectionNoteData,
  reveal = true,
  order: SectionHeadOrder = "credits-note",
): string {
  const creditsHtml = renderCredits(credits, reveal);
  const noteHtml = renderSectionNote(note, reveal);

  if (!creditsHtml && !noteHtml) return "";

  const content =
    order === "note-credits"
      ? `${noteHtml}\n${creditsHtml}`
      : `${creditsHtml}\n${noteHtml}`;

  return `
    <header class="media-group__head flow"${renderRevealGroupAttribute(reveal)}>
      ${content}
    </header>
  `;
}

function sectionShellPresentation(presentation?: SectionPresentation): {
  className: string;
  attributes: string;
} {
  switch (presentation?.layout ?? "stack") {
    case "stack":
    case "split-always":
      return {
        className: "project__section wrapper stack",
        attributes: "",
      };
    case "media-stack":
      return {
        className: "project__section wrapper media-stack stack",
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

function renderStackBlocks(
  blocks: Extract<Section, { type: "content" | "project" }>["blocks"],
  presentation: SectionPresentation | undefined,
  reveal: boolean,
): string {
  const blockHtml = blocks.map((block) => renderContentBlock(block, { reveal }));

  if (presentation?.separator === "between-blocks") {
    return blockHtml.join(`\n${renderInnerDivider()}\n`);
  }

  return blockHtml.join("\n");
}

function renderMediaStackBlocks(
  blocks: readonly ProjectPresentation["blocks"][number][],
  reveal: boolean,
): string {
  const [first, ...rest] = blocks.map((block) => renderContentBlock(block, { reveal }));
  if (!first) return "";
  return `<div class="media-stack__hero">${first}</div>\n${rest.join("\n")}`;
}

function renderBlockBody(
  blocks: Extract<Section, { type: "content" | "project" }>["blocks"],
  presentation?: SectionPresentation,
): string {
  const reveal = usesGlobalReveal(presentation);
  const layout = presentation?.layout ?? "stack";
  const isStackLike = layout === "stack" || layout === "split-always";

  if (presentation?.separator && !isStackLike) {
    throw new Error(`Section separator requires stack-like layout; got ${layout}`);
  }

  switch (layout) {
    case "stack":
    case "split-always": {
      const blocksHtml = renderStackBlocks(blocks, presentation, reveal);
      return presentation?.separator === "before-blocks"
        ? `${renderInnerDivider()}\n${blocksHtml}`
        : blocksHtml;
    }
    case "media-stack":
      return renderMediaStackBlocks(blocks, reveal);
    case "mockup-grid-reel": {
      const blockHtml = renderContentBlocks(blocks, { reveal });
      return `<div class="media-group__items reel">${blockHtml}</div>`;
    }
    case "infinite-media-reel": {
      const blockHtml = renderContentBlocks(blocks, { reveal });
      return `<div class="media-group__items reel" data-infinite-reel-track="">${blockHtml}</div>`;
    }
  }
}

function wrapSectionBody(body: string, presentation?: SectionPresentation): string {
  if (presentation?.layout !== "split-always") return body;

  return `<div class="split split-always" style="--split-min: 8rem; --split-gap: clamp(0.75rem, 3cqi, 1.5rem)">
    ${body}
  </div>`;
}

function renderIntroAndBlocks(section: Extract<Section, { type: "content" | "project" }>): string {
  const reveal = usesGlobalReveal(section.presentation);
  const intro = section.intro ? renderSectionIntro(section.intro, { reveal }) : "";
  const notePlacement = section.presentation?.notePlacement ?? "before-blocks";
  const head = renderSectionHead(
    section.credits,
    notePlacement === "before-blocks" ? section.note : undefined,
    reveal,
    section.presentation?.headOrder,
  );
  const heading = renderSectionHeading(section.heading, reveal);
  const blocks = renderBlockBody(section.blocks, section.presentation);
  const trailingNote =
    notePlacement === "after-blocks" ? renderSectionNote(section.note, reveal) : "";
  const resources = section.resources
    ? renderResourceLinks(section.resources, { reveal })
    : "";
  const body = wrapSectionBody(
    `${intro}\n${head}\n${heading}\n${blocks}\n${trailingNote}\n${resources}`,
    section.presentation,
  );
  const projectAttribute =
    section.type === "project" ? ` data-project-id="${escapeHtml(section.projectId)}"` : "";

  return renderSectionShell(section, body, projectAttribute);
}

function renderProjectPresentation(item: ProjectPresentation): string {
  const reveal = usesGlobalReveal(item.presentation);
  const intro = item.intro ? renderSectionIntro(item.intro, { reveal }) : "";
  const notePlacement = item.presentation?.notePlacement ?? "before-blocks";
  const head = renderSectionHead(
    item.credits,
    notePlacement === "before-blocks" ? item.note : undefined,
    reveal,
    item.presentation?.headOrder,
  );
  const heading = renderSectionHeading(item.heading, reveal);
  const blockHtml = renderContentBlocks(item.blocks, { reveal });
  const blocks =
    item.presentation?.layout === "mockup-grid-reel"
      ? `<div class="media-group__items reel">${blockHtml}</div>`
      : item.presentation?.layout === "infinite-media-reel"
        ? `<div class="media-group__items reel" data-infinite-reel-track="">${blockHtml}</div>`
        : item.presentation?.layout === "media-stack"
          ? renderMediaStackBlocks(item.blocks, reveal)
          : item.presentation?.separator === "before-blocks"
            ? `${renderInnerDivider()}\n${renderStackBlocks(item.blocks, item.presentation, reveal)}`
            : renderStackBlocks(item.blocks, item.presentation, reveal);
  const trailingNote =
    notePlacement === "after-blocks" ? renderSectionNote(item.note, reveal) : "";
  const resources = item.resources ? renderResourceLinks(item.resources, { reveal }) : "";
  const body = wrapSectionBody(
    `${intro}\n${head}\n${heading}\n${blocks}\n${trailingNote}\n${resources}`,
    item.presentation,
  );
  const presentation = sectionShellPresentation(item.presentation);

  return `
    <div class="${presentation.className}" data-project-id="${escapeHtml(item.projectId)}" data-media-caption-scope${presentation.attributes}>
      ${body}
    </div>
  `;
}

function renderProjectGroup(section: ProjectGroupSection): string {
  const reveal = usesGlobalReveal(section.presentation);
  const intro = section.intro ? renderSectionIntro(section.intro, { reveal }) : "";
  const head = renderSectionHead(
    section.credits,
    section.note,
    reveal,
    section.presentation?.headOrder,
  );
  const heading = renderSectionHeading(section.heading, reveal);
  const items = section.items.map(renderProjectPresentation).join("\n");
  const resources = section.resources ? renderResourceLinks(section.resources, { reveal }) : "";

  return renderSectionShell(section, `${intro}\n${head}\n${heading}\n${items}\n${resources}`);
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

function shouldRenderOuterDivider(section: Section): boolean {
  if (section.type === "specialized") return true;
  return section.presentation?.outerDivider !== false;
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
    .map((section) => {
      const divider = shouldRenderOuterDivider(section)
        ? '<div class="divider wrapper" aria-hidden="true"></div>\n'
        : "";
      return `${divider}${renderSection(section, options)}`;
    })
    .join("\n");
}
