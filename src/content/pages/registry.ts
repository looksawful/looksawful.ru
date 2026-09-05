import type { EntityPageId } from "../contracts/ids.ts";
import type { EntityPageContent } from "../contracts/page-content.ts";

export type EntityPageContentRegistry = ReadonlyMap<EntityPageId, EntityPageContent>;

export function createEntityPageContentRegistry(
  contents: readonly EntityPageContent[],
): EntityPageContentRegistry {
  const registry = new Map<EntityPageId, EntityPageContent>();

  for (const content of contents) {
    if (registry.has(content.pageId)) {
      throw new Error(`Duplicate PageContent: ${content.pageId}`);
    }

    registry.set(content.pageId, content);
  }

  return registry;
}

export function hasEntityPageContent(
  registry: EntityPageContentRegistry,
  pageId: EntityPageId,
): boolean {
  return registry.has(pageId);
}

export function getEntityPageContent(
  registry: EntityPageContentRegistry,
  pageId: EntityPageId,
): EntityPageContent {
  const content = registry.get(pageId);

  if (!content) {
    throw new Error(`Missing PageContent: ${pageId}`);
  }

  return content;
}

export function listEntityPageContents(
  registry: EntityPageContentRegistry,
): readonly EntityPageContent[] {
  return [...registry.values()];
}
