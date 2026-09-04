import { getProject } from "../../data/catalog/lookup.ts";
import type { ProjectId } from "../../data/catalog/projects/index.ts";
import type { EntityPageContent } from "../contracts/page-content.ts";
import type { ProjectPresentation, Section } from "../contracts/sections.ts";

function validateProjectId(projectId: ProjectId): void {
  getProject(projectId);
}

function validateProjectPresentation(item: ProjectPresentation): void {
  validateProjectId(item.projectId);
}

function validateSection(section: Section): void {
  switch (section.type) {
    case "content":
      return;
    case "project":
      validateProjectId(section.projectId);
      return;
    case "project-group":
      section.items.forEach(validateProjectPresentation);
      return;
    case "specialized":
      switch (section.kind) {
        case "jestei-track-filter":
          validateProjectId(section.projectId);
          return;
      }
  }
}

export function validateEntityPageContent(content: EntityPageContent): void {
  const sectionIds = new Set<string>();

  for (const section of content.sections) {
    if (sectionIds.has(section.id)) {
      throw new Error(`Duplicate Section id in ${content.pageId}: ${section.id}`);
    }

    sectionIds.add(section.id);
    validateSection(section);
  }
}

export function validateEntityPageContents(contents: readonly EntityPageContent[]): void {
  const pageIds = new Set<string>();

  for (const content of contents) {
    if (pageIds.has(content.pageId)) {
      throw new Error(`Duplicate PageContent: ${content.pageId}`);
    }

    pageIds.add(content.pageId);
    validateEntityPageContent(content);
  }
}
