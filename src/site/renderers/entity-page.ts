import {
  getCase,
  getCollection,
  getProject,
} from "../../data/catalog/lookup.ts";
import type { EntityPageDefinition } from "../pages/types.ts";
import {
  extractElementById,
  extractElementContainingMarker,
  replaceRequiredSlots,
} from "../rendering/html.ts";
import { renderPageShell } from "../shell/page-shell.ts";
import {
  createHomepageSlots,
  renderHomepage,
  type HomepageIntroMarker,
} from "./home/home-slots.ts";

interface LargeEntityRenderContract {
  articleId: string;
  introMarker: HomepageIntroMarker;
}

interface ProjectRenderContract {
  articleId: string;
  sourceMarker: string;
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
} as const satisfies Record<string, LargeEntityRenderContract>;

const collectionContracts = {
  "music-photography": {
    articleId: "project-shootings",
    introMarker: "SHOOTINGS_INTRO",
  },
} as const satisfies Record<string, LargeEntityRenderContract>;

const projectContracts = {
  "awful-cases": {
    articleId: "project-awful-cases",
    sourceMarker: "<!-- AWFUL_CASES_INTRO -->",
  },
  "moves-awful": {
    articleId: "project-moves-awful",
    sourceMarker: "<!-- MOVES_AWFUL_INTRO -->",
  },
  "berry-social-content-2020": {
    articleId: "project-berry-social-content-2020",
    sourceMarker: "<!-- BERRY_INTRO -->",
  },
} as const satisfies Record<string, ProjectRenderContract>;

function getLargeEntityRenderContract(page: EntityPageDefinition): LargeEntityRenderContract {
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

  throw new Error(`Expected Case or Collection page, got Project: ${page.entityId}`);
}

function renderStandaloneProjectArticle(
  homepageTemplate: string,
  projectId: keyof typeof projectContracts,
): string {
  const contract = projectContracts[projectId];
  const sourceArticle = extractElementContainingMarker(
    homepageTemplate,
    "article",
    contract.sourceMarker,
  );
  const relevantSlots = createHomepageSlots().filter(([marker]) => sourceArticle.includes(marker));
  let article = replaceRequiredSlots(sourceArticle, relevantSlots);

  article = article.replace(
    /^<article\b([^>]*)>/,
    (_opening, attributes: string) => {
      const visibleAttributes = attributes.replace(/\s+hidden(?=\s|$)/, "");
      return `<article id="${contract.articleId}"${visibleAttributes}>`;
    },
  );
  article = article.replace(
    /<h2(\s+class="project__title"[^>]*)>([\s\S]*?)<\/h2>/,
    "<h1$1>$2</h1>",
  );

  return article;
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
  let article: string;

  if (page.type === "project") {
    const projectId = page.entityId as keyof typeof projectContracts;
    if (!projectContracts[projectId]) {
      throw new Error(`No standalone renderer for Project: ${page.entityId}`);
    }
    article = renderStandaloneProjectArticle(homepageTemplate, projectId);
  } else {
    const contract = getLargeEntityRenderContract(page);
    const renderedHomepage = renderHomepage(homepageTemplate, {
      headingLevel1For: contract.introMarker,
    });
    article = extractElementById(renderedHomepage, "article", contract.articleId);
  }

  const copy = getEntityPageCopy(page);

  return renderPageShell({
    page,
    title: copy.title,
    description: copy.description,
    content: article,
  });
}
