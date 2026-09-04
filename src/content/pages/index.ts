import type { EntityPageContent } from "../contracts/page-content.ts";
import { jesteiPoolPageContent } from "./cases/jestei-pool.ts";
import { shootingsPageContent } from "./collections/shootings.ts";
import { awfulCasesPageContent } from "./projects/awful-cases.ts";
import { berrySocialContentPageContent } from "./projects/berry-social-content-2020.ts";
import { movesAwfulPageContent } from "./projects/moves-awful.ts";
import { createEntityPageContentRegistry } from "./registry.ts";
import { validateEntityPageContents } from "./validation.ts";

/**
 * Migration registry. Page modules are added here only after their canonical
 * PageContent has passed focused structural review and are verified through
 * the normal page/build gates before integration.
 */
export const entityPageContents = [
  jesteiPoolPageContent,
  shootingsPageContent,
  awfulCasesPageContent,
  berrySocialContentPageContent,
  movesAwfulPageContent,
] as const satisfies readonly EntityPageContent[];

validateEntityPageContents(entityPageContents);

export const entityPageContentRegistry = createEntityPageContentRegistry(entityPageContents);

export * from "./registry.ts";
export * from "./validation.ts";
