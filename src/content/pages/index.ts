import type { EntityPageContent } from "../contracts/page-content.ts";
import { shootingsPageContent } from "./collections/shootings.ts";
import { awfulCasesPageContent } from "./projects/awful-cases.ts";
import { createEntityPageContentRegistry } from "./registry.ts";
import { validateEntityPageContents } from "./validation.ts";

/**
 * Migration registry. Page modules are added here only after their canonical
 * PageContent has passed focused structural review and are verified through
 * the normal page/build gates before integration.
 */
export const entityPageContents = [
  shootingsPageContent,
  awfulCasesPageContent,
] as const satisfies readonly EntityPageContent[];

validateEntityPageContents(entityPageContents);

export const entityPageContentRegistry = createEntityPageContentRegistry(entityPageContents);

export * from "./registry.ts";
export * from "./validation.ts";
