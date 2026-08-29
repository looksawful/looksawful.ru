import {
  getCase,
  getCollection,
  getProject,
} from "../../data/catalog/lookup.ts";
import type { EntityPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";
import { renderEntityArticle } from "./registry.ts";

function getEntityPageCopy(page: EntityPageDefinition): {
  title: string;
  description: string;
} {
  if (page.type === "case") {
    const entity = getCase(page.entityId);
    return {
      title: `${entity.name} — Иван Крушинский`,
      description: entity.description ?? entity.summary ?? entity.name,
    };
  }

  if (page.type === "collection") {
    const entity = getCollection(page.entityId);
    const name = entity.displayName ?? entity.name;
    return {
      title: `${name} — Иван Крушинский`,
      description: entity.description ?? entity.summary ?? entity.name,
    };
  }

  const entity = getProject(page.entityId);
  return {
    title: `${entity.name} — Иван Крушинский`,
    description: entity.description ?? entity.summary ?? entity.name,
  };
}

export function renderStandaloneEntityPage(
  homepageTemplate: string,
  page: EntityPageDefinition,
): string {
  const article = renderEntityArticle(homepageTemplate, page);
  const copy = getEntityPageCopy(page);

  return renderPageShell({
    page,
    title: copy.title,
    description: copy.description,
    content: article,
  });
}
