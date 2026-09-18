import { renderJesteiTrackFilter } from "../../components/specialized/index.ts";
import {
  entityPageContentRegistry,
  getEntityPageContent,
} from "../../content/pages/index.ts";
import type { EntityPageContent } from "../../content/contracts/page-content.ts";
import {
  getCase,
  getCollection,
  getProject,
} from "../../data/catalog/lookup.ts";
import { getEntityShellPresentation } from "../pages/entity-presentation.ts";
import { getEntitySearchPresentation } from "../pages/search-presentation.ts";
import type { EntityPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";
import { renderEntityShell } from "./entity/entity-shell.ts";

function getEntityPageCopy(page: EntityPageDefinition): {
  title: string;
  description: string;
} {
  const searchPresentation = getEntitySearchPresentation(page.id);
  if (searchPresentation) return searchPresentation;

  if (page.type === "case") {
    const entity = getCase(page.entityId);
    const name = entity.name || page.entityId;
    return {
      title: `${name} — Иван Крушинский`,
      description: entity.description || entity.summary || name,
    };
  }
  if (page.type === "collection") {
    const entity = getCollection(page.entityId);
    const name = entity.displayName || entity.name || page.entityId;
    return {
      title: `${name} — Иван Крушинский`,
      description: entity.description || entity.summary || name,
    };
  }

  const entity = getProject(page.entityId);
  const name = entity.name || page.entityId;
  return {
    title: `${name} — Иван Крушинский`,
    description: entity.description || entity.summary || name,
  };
}

function withoutStandaloneIdentity(content: EntityPageContent): EntityPageContent {
  return {
    ...content,
    intro: {
      ...content.intro,
      head: undefined,
    },
  };
}
function withoutStyxSocialInstructions(content: EntityPageContent): EntityPageContent {
  return {
    ...content,
    sections: content.sections.filter((section) => section.id !== "styx-social-instructions"),
  };
}

function shootingsVisualOnlyContent(content: EntityPageContent): EntityPageContent {
  const sections = content.sections
    .filter((section) => {
      if (section.type === "content" || section.type === "project") {
        return section.blocks.length > 0;
      }
      return true;
    })
    .map((section) => {
      if (section.type !== "content" && section.type !== "project") return section;
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
      head: undefined,
      role: undefined,
      period: undefined,
      summary: undefined,
      lead: undefined,
      linksLabel: undefined,
      links: undefined,
    },
    sections,
  };
}

function standalonePresentationContent(
  page: EntityPageDefinition,
  content: EntityPageContent,
): EntityPageContent {
  if (page.id === "collection:music-photography") return shootingsVisualOnlyContent(content);

  const pageContent = page.id === "case:styx"
    ? withoutStyxSocialInstructions(content)
    : content;

  if (page.type === "case" || page.type === "project") {
    return withoutStandaloneIdentity(pageContent);
  }

  return pageContent;
}

function renderCanonicalEntityArticle(page: EntityPageDefinition): string {
  const content = getEntityPageContent(entityPageContentRegistry, page.id);
  const presentation = getEntityShellPresentation(page.id);
  const standaloneContent = standalonePresentationContent(page, content);
  return renderEntityShell(standaloneContent, {
    ...presentation,
    introHeadingLevel: 1,
    suppressCaptions: page.id === "collection:music-photography",
    specialized: {
      jesteiTrackFilter: renderJesteiTrackFilter,
    },
  });
}

export function renderStandaloneEntityPage(page: EntityPageDefinition): string {
  const article = renderCanonicalEntityArticle(page);
  const copy = getEntityPageCopy(page);

  return renderPageShell({
    page,
    title: copy.title,
    description: copy.description,
    content: article,
  });
}
