import { renderJesteiTrackFilter } from "../../../components/specialized/index.ts";
import { entityPageContentRegistry, getEntityPageContent } from "../../../content/pages/index.ts";
import type { Section } from "../../../content/contracts/sections.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { getEntityShellPresentation } from "../../pages/entity-presentation.ts";
import {
  homepageEntries,
  type HomepageEntry,
  type HomepagePreviewSectionConfig,
} from "../../pages/homepage.ts";
import { getPageByPath } from "../../pages/manifest.ts";
import { homeSearchPresentation } from "../../pages/search-presentation.ts";
import type { EntityPageId } from "../../pages/types.ts";
import { replaceRequiredSlot } from "../../rendering/html.ts";
import { renderHomeStructuredData, replacePageMetadata } from "../../shell/metadata.ts";
import { renderSiteNavigation } from "../../shell/navigation.ts";
import { applyPageBodyAttributes } from "../../shell/page-shell.ts";
import { renderEntityShell } from "../entity/entity-shell.ts";
import { renderHomepage } from "./home-slots.ts";

const homeEntitiesMount = "<div data-home-entities></div>";
const legacyHomepageNavigation =
  /<nav\b(?=[^>]*\bdata-site-navigation\b)(?=[^>]*\bhidden\b)[^>]*>[\s\S]*?<\/nav>/g;
const homeStructuredData =
  /<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/i;

function getHomePage() {
  const page = getPageByPath("/");
  if (!page || page.type !== "home") throw new Error("Homepage route is unavailable");
  return page;
}

function pageIdForHomepageEntry(entry: HomepageEntry): EntityPageId {
  return `${entry.entity.type}:${entry.entity.id}` as EntityPageId;
}

function selectPreviewSection(
  sections: readonly Section[],
  config: HomepagePreviewSectionConfig,
): Section {
  const matches = sections.filter((section) => section.id === config.id);
  if (matches.length !== 1) {
    throw new Error(`Homepage preview section ${config.id} resolved ${matches.length} times`);
  }
  const section = matches[0];
  if (section.type !== "content" && section.type !== "project") {
    throw new Error(
      `Homepage preview section ${config.id} cannot select blocks from ${section.type}`,
    );
  }
  const blocks = config.blockIndexes.map((index) => {
    const block = section.blocks[index];
    if (!block) throw new Error(`Homepage preview section ${config.id} is missing block ${index}`);
    return block;
  });

  return {
    ...section,
    intro: undefined,
    heading: undefined,
    credits: undefined,
    note: undefined,
    resources: undefined,
    blocks,
  };
}

function renderPreviewCallout(entry: HomepageEntry): string {
  const preview = entry.preview;
  if (!preview) return "";
  return `
    <div class="project-preview-entry" data-reveal-group>
      <a class="project-preview-entry__link" href="${escapeHtml(preview.href)}" data-reveal="copy">
        <span>${escapeHtml(preview.calloutLabel)}</span>
        <span class="project-preview-entry__arrow" aria-hidden="true">→</span>
      </a>
    </div>
  `;
}

export function renderCompactHomepageEntity(entry: HomepageEntry): string {
  if (entry.mode !== "compact" || !entry.preview) {
    throw new Error("renderCompactHomepageEntity requires an explicit compact preview entry");
  }
  const pageId = pageIdForHomepageEntry(entry);
  const content = getEntityPageContent(entityPageContentRegistry, pageId);
  const presentation = getEntityShellPresentation(pageId);
  const sections = entry.preview.sections.map((config) =>
    selectPreviewSection(content.sections, config),
  );
  const compactContent = {
    ...content,
    intro: {
      ...content.intro,
      summary: undefined,
      linksLabel: undefined,
      links: undefined,
    },
    sections,
  };

  const rendered = renderEntityShell(compactContent, {
    ...presentation,
    introHeadingLevel: 2,
    visuallyHideIntroTitle: true,
    suppressCaptions: entry.preview.visualOnly === true,
    specialized: {
      jesteiTrackFilter: renderJesteiTrackFilter,
    },
  });

  return rendered.replace(/<\/article>\s*$/, `${renderPreviewCallout(entry)}</article>`);
}

function renderCanonicalHomepageEntity(entry: HomepageEntry): string {
  if (entry.mode === "none") return "";
  if (entry.mode === "compact") return renderCompactHomepageEntity(entry);

  const pageId = pageIdForHomepageEntry(entry);
  const content = getEntityPageContent(entityPageContentRegistry, pageId);
  const presentation = getEntityShellPresentation(pageId);
  return renderEntityShell(content, {
    ...presentation,
    introHeadingLevel: 2,
    specialized: { jesteiTrackFilter: renderJesteiTrackFilter },
  });
}

function renderCanonicalHomepageEntities(): string {
  return [...homepageEntries]
    .sort((left, right) => left.order - right.order)
    .map(renderCanonicalHomepageEntity)
    .filter(Boolean)
    .join("\n");
}

function replaceHomepageStructuredData(html: string): string {
  const structuredData = renderHomeStructuredData();
  if (homeStructuredData.test(html)) {
    return html.replace(homeStructuredData, structuredData);
  }
  if (!/<\/head>/i.test(html)) {
    throw new Error("Homepage is missing </head> for structured data");
  }
  return html.replace(/<\/head>/i, `${structuredData}\n</head>`);
}

function excludeUtilityTextFromSnippets(html: string): string {
  let output = html.replace(
    /<address class="cluster">([\s\S]*?)<\/address>/i,
    '<!--noindex--><address class="cluster" data-nosnippet>$1</address><!--/noindex-->',
  );
  output = output.replace(
    /<footer class="project__footer cluster" data-reveal-group>([\s\S]*?)<\/footer>/gi,
    '<!--noindex--><footer class="project__footer cluster" data-reveal-group data-nosnippet>$1</footer><!--/noindex-->',
  );
  output = output.replace(
    /<figcaption class="media__caption"([^>]*)>([\s\S]*?)<\/figcaption>/gi,
    '<!--noindex--><figcaption class="media__caption"$1 data-nosnippet>$2</figcaption><!--/noindex-->',
  );
  output = output.replace(
    /<p class="credits"([^>]*)>([\s\S]*?)<\/p>/gi,
    '<!--noindex--><p class="credits"$1 data-nosnippet>$2</p><!--/noindex-->',
  );
  return output;
}

export function renderHomepagePage(html: string): string {
  const page = getHomePage();
  const rendered = replaceRequiredSlot(
    renderHomepage(html),
    homeEntitiesMount,
    renderCanonicalHomepageEntities(),
  );
  const matches = rendered.match(legacyHomepageNavigation);
  if (matches?.length !== 1) {
    throw new Error(
      `Expected exactly one legacy homepage navigation, found ${matches?.length ?? 0}`,
    );
  }

  const withNavigation = rendered.replace(legacyHomepageNavigation, renderSiteNavigation(page));
  const withBodyAttributes = applyPageBodyAttributes(withNavigation, page);
  const withMetadata = replacePageMetadata(withBodyAttributes, {
    page,
    ...homeSearchPresentation,
  });
  const withStructuredData = replaceHomepageStructuredData(withMetadata);
  return excludeUtilityTextFromSnippets(withStructuredData);
}
