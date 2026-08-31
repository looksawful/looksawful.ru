import {
  deliverables,
  type Deliverable,
  type DeliverableId,
} from "./deliverables.ts";
import {
  projectTypes,
  type ProjectType,
  type ProjectTypeId,
} from "./project-types.ts";
import {
  workAreas,
  type WorkArea,
  type WorkAreaId,
} from "./work-areas.ts";

function selectTaxonomyItems<
  Item extends { readonly id: string },
  Id extends Item["id"],
>(
  values: readonly Item[],
  selectedIds: readonly Id[],
  label: string,
): readonly Item[] {
  return selectedIds.map((id) => {
    const value = values.find((candidate) => candidate.id === id);
    if (!value) throw new Error(`${label} references unknown taxonomy id "${id}"`);
    return value;
  });
}

export const MEDIA_CATALOG_WORK_AREA_IDS = [
  "photography",
  "photo-direction",
  "production",
  "illustration",
  "graphic-design",
  "editorial-design",
  "identity",
  "brand-communication",
  "social-media",
  "motion",
  "3d",
  "product-design",
  "ux",
  "ui",
  "design-systems",
  "art-direction",
  "frontend",
] as const satisfies readonly WorkAreaId[];

export const MEDIA_CATALOG_SHOOTING_TYPE_IDS = [
  "music-shooting",
  "lookbook",
  "catalog",
  "campaign-shooting",
  "editorial",
] as const satisfies readonly ProjectTypeId[];

export const MEDIA_CATALOG_PROJECT_TYPE_IDS = [
  "shooting",
  ...MEDIA_CATALOG_SHOOTING_TYPE_IDS,
  "product-shooting",
  "fashion-shooting",
  "portrait-shooting",
  "cover-shooting",
  "backstage",
  "content-production",
  "advertorial",
  "graphic-design-project",
  "identity-project",
  "print-project",
  "packaging-project",
  "poster-project",
  "social-content",
  "motion-project",
  "animation",
  "interface-animation",
  "video-project",
  "3d-project",
  "3d-animation",
  "scanography-project",
  "book-project",
  "book-design",
] as const satisfies readonly ProjectTypeId[];

export const MEDIA_CATALOG_DELIVERABLE_IDS = [
  "identity-system",
  "logo",
  "brandbook",
  "brand-assets",
  "design-assets",
  "business-card",
  "banner",
  "advertising-banner",
  "social-post",
  "social-media-assets",
  "advertising-creative",
  "cover",
  "certificate",
  "poster",
  "sticker",
  "booklet",
  "t-shirt",
  "print-materials",
  "packaging",
  "merch",
  "campaign-assets",
  "product-photography",
  "catalog",
  "lookbook",
  "website",
  "landing-page",
  "ui-kit",
  "wireframe",
  "prototype",
  "screen-mockup",
  "music-cover",
  "book",
] as const satisfies readonly DeliverableId[];

export type MediaCatalogWorkAreaId = (typeof MEDIA_CATALOG_WORK_AREA_IDS)[number];
export type MediaCatalogShootingTypeId = (typeof MEDIA_CATALOG_SHOOTING_TYPE_IDS)[number];
export type MediaCatalogProjectTypeId = (typeof MEDIA_CATALOG_PROJECT_TYPE_IDS)[number];
export type MediaCatalogDeliverableId = (typeof MEDIA_CATALOG_DELIVERABLE_IDS)[number];

export const mediaCatalogWorkAreas = selectTaxonomyItems<WorkArea, WorkAreaId>(
  workAreas,
  MEDIA_CATALOG_WORK_AREA_IDS,
  "Media catalog work areas",
);

export const mediaCatalogProjectTypes = selectTaxonomyItems<ProjectType, ProjectTypeId>(
  projectTypes,
  MEDIA_CATALOG_PROJECT_TYPE_IDS,
  "Media catalog project types",
);

export const mediaCatalogShootingTypes = selectTaxonomyItems<ProjectType, ProjectTypeId>(
  projectTypes,
  MEDIA_CATALOG_SHOOTING_TYPE_IDS,
  "Media catalog shooting types",
);

export const mediaCatalogDeliverables = selectTaxonomyItems<Deliverable, DeliverableId>(
  deliverables,
  MEDIA_CATALOG_DELIVERABLE_IDS,
  "Media catalog deliverables",
);

export const mediaCatalogTaxonomy = {
  workAreas: mediaCatalogWorkAreas,
  projectTypes: mediaCatalogProjectTypes,
  shootingTypes: mediaCatalogShootingTypes,
  deliverables: mediaCatalogDeliverables,
} as const;
