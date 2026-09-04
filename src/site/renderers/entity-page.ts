import {
  entityPageContentRegistry,
  getEntityPageContent,
  hasEntityPageContent,
} from "../../content/pages/index.ts";
import {
  getCase,
  getCollection,
  getProject,
} from "../../data/catalog/lookup.ts";
import { getEntityShellPresentation } from "../pages/entity-presentation.ts";
import type { EntityPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";
import { renderEntityShell } from "./entity/entity-shell.ts";
import { renderEntityArticle } from "./registry.ts";

function getEntityPageCopy(page: EntityPageDefinition): {
  title: string;
  description: string;
} {
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

function renderCanonicalEntityArticle(page: EntityPageDefinition): string {
  const content = getEntityPageContent(entityPageContentRegistry, page.id);
  const presentation = getEntityShellPresentation(page.id);

  return renderEntityShell(content, {
    ...presentation,
    introHeadingLevel: 1,
  });
}

export function renderStandaloneEntityPage(
  homepageTemplate: string,
  page: EntityPageDefinition,
): string {
  const article = hasEntityPageContent(entityPageContentRegistry, page.id)
    ? renderCanonicalEntityArticle(page)
    : renderEntityArticle(homepageTemplate, page);
  const copy = getEntityPageCopy(page);

  return renderPageShell({
    page,
    title: copy.title,
    description: copy.description,
    content: article,
  });
}
