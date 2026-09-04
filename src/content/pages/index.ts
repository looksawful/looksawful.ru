import type { EntityPageContent } from "../contracts/page-content.ts";
import { createEntityPageContentRegistry } from "./registry.ts";
import { validateEntityPageContents } from "./validation.ts";

/**
 * Migration registry. Page modules are added here only after their canonical
 * PageContent has passed parity verification against the current renderer.
 */
export const entityPageContents = [] as const satisfies readonly EntityPageContent[];

validateEntityPageContents(entityPageContents);

export const entityPageContentRegistry = createEntityPageContentRegistry(entityPageContents);

export * from "./registry.ts";
export * from "./validation.ts";
