interface CatalogAssetLike {
  readonly id: string;
  readonly type: string;
  readonly src: string;
  readonly width?: number;
  readonly height?: number;
}

interface CatalogItemLike {
  readonly asset: CatalogAssetLike;
}

interface ProjectCoverLike {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

interface ProjectLike {
  readonly id: string;
  readonly visible: boolean;
  readonly cover: ProjectCoverLike;
}

interface EntryLike {
  readonly id: string;
  readonly assetId: string;
}

interface PetCardLike {
  readonly id: string;
  readonly coverEntryId: string;
  readonly [key: string]: unknown;
}

export interface MediaDeskAssignmentResult<T> {
  readonly sourcePath: string;
  readonly value: readonly T[];
}

function imageAssetWithDimensions(
  catalog: readonly CatalogItemLike[],
  assetId: string,
): CatalogAssetLike {
  const item = catalog.find(({ asset }) => asset.id === assetId);
  const asset = item?.asset;
  if (!asset || asset.type !== "image" || !asset.width || !asset.height) {
    throw new Error(`Media Desk cover assignment requires an image asset with dimensions: ${assetId}`);
  }
  return asset;
}

export function assignProjectCover<T extends ProjectLike>(options: {
  readonly projects: readonly T[];
  readonly ownerId: string;
  readonly assetId: string;
  readonly catalog: readonly CatalogItemLike[];
}): MediaDeskAssignmentResult<T> {
  const index = options.projects.findIndex(({ id }) => id === options.ownerId);
  if (index < 0) throw new Error(`Unknown project cover owner: ${options.ownerId}`);

  const asset = imageAssetWithDimensions(options.catalog, options.assetId);
  const next = options.projects.map((project, projectIndex) => {
    if (projectIndex !== index) return project;
    return {
      ...project,
      cover: {
        src: asset.src,
        width: asset.width as number,
        height: asset.height as number,
      },
    } as T;
  });

  return { sourcePath: "src/content/projects.json", value: next };
}

export function assignPetCover<T extends PetCardLike>(options: {
  readonly cards: readonly T[];
  readonly ownerId: string;
  readonly entryId: string;
  readonly entries: readonly EntryLike[];
}): MediaDeskAssignmentResult<T> {
  if (!options.entries.some(({ id }) => id === options.entryId)) {
    throw new Error(`Unknown media entry: ${options.entryId}`);
  }
  const index = options.cards.findIndex(({ id }) => id === options.ownerId);
  if (index < 0) throw new Error(`Unknown pet cover owner: ${options.ownerId}`);

  const next = options.cards.map((card, cardIndex) => (
    cardIndex === index ? { ...card, coverEntryId: options.entryId } as T : card
  ));
  return { sourcePath: "src/data/subproject-cards.ts", value: next };
}

export function assignSubprojectCardCoverOverride(options: {
  readonly overrides: Readonly<Record<string, string>>;
  readonly cards: readonly { readonly id: string }[];
  readonly ownerId: string;
  readonly entryId: string;
  readonly entries: readonly EntryLike[];
}): { readonly sourcePath: string; readonly value: Readonly<Record<string, string>> } {
  if (!options.entries.some(({ id }) => id === options.entryId)) {
    throw new Error(`Unknown media entry: ${options.entryId}`);
  }
  if (!options.cards.some(({ id }) => id === options.ownerId)) {
    throw new Error(`Unknown subproject card cover owner: ${options.ownerId}`);
  }
  return {
    sourcePath: "src/content/subproject-card-covers.json",
    value: { ...options.overrides, [options.ownerId]: options.entryId },
  };
}

export function assignCharacterCover(_options: {
  readonly ownerId: string;
  readonly assetId: string;
}): never {
  throw new Error("Character cover source is not configured");
}
