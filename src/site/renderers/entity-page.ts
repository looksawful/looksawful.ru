import {
  getCase,
  getCollection,
  getProject,
} from "../../data/catalog/lookup.ts";
import type { EntityPageDefinition } from "../pages/types.ts";
import { extractElementById } from "../rendering/html.ts";
import { renderPageShell } from "../shell/page-shell.ts";
import {
  renderHomepage,
  type HomepageIntroMarker,
} from "./home/home-slots.ts";

interface EntityRenderContract {
  articleId: string;
  introMarker: HomepageIntroMarker;
}

const caseContracts = {
  "jestei-pool": {
    articleId: "project-jestei",
    introMarker: "JESTEI_INTRO",
  },
  styx: {
    articleId: "project-styx",
    introMarker: "STYX_INTRO",
  },
  sensetique: {
    articleId: "project-sensetique",
    introMarker: "SENSETIQUE_INTRO",
  },
} as const satisfies Record<string, EntityRenderContract>;

const collectionContracts = {
  "music-photography": {
    articleId: "project-shootings",
    introMarker: "SHOOTINGS_INTRO",
  },
} as const satisfies Record<string, EntityRenderContract>;

function getRenderContract(page: EntityPageDefinition): EntityRenderContract {
  if (page.type === "case") {
    const contract = caseContracts[page.entityId as keyof typeof caseContracts];
    if (!contract) throw new Error(`No standalone renderer for Case: ${page.entityId}`);
    return contract;
  }

  if (page.type === "collection") {
    const contract = collectionContracts[page.entityId as keyof typeof collectionContracts];
    if (!contract) throw new Error(`No standalone renderer for Collection: ${page.entityId}`);
    return contract;
  }

  throw new Error(`No standalone renderer for Project: ${page.entityId}`);
}

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
  const contract = getRenderContract(page);
  const renderedHomepage = renderHomepage(homepageTemplate, {
    headingLevel1For: contract.introMarker,
  });
  const article = extractElementById(renderedHomepage, "article", contract.articleId);
  const copy = getEntityPageCopy(page);

  return renderPageShell({
    page,
    title: copy.title,
    description: copy.description,
    content: article,
  });
}
