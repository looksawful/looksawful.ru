import type { MediaDeskInventoryRecord, MediaDeskUnifiedUsage } from "./inventory-model.ts";

export function blockingDeleteUsages(
  record: Pick<MediaDeskInventoryRecord, "usages">,
): readonly MediaDeskUnifiedUsage[] {
  return record.usages.filter((usage) => usage.blockingDelete);
}

interface RemoteMutationSessionLike {
  sourceRevision(path: string): Promise<{ readonly revision: string }>;
  assetRevision(assetId: string, surface: "catalog" | "source"): Promise<{ readonly revision: string }>;
  postJson(
    path: string,
    body: Readonly<Record<string, unknown>>,
  ): Promise<Readonly<Record<string, unknown>>>;
  postMultipart(
    path: string,
    metadata: Readonly<Record<string, unknown>>,
    file: File,
  ): Promise<Readonly<Record<string, unknown>>>;
}

export class MediaDeskBlockedDeleteError extends Error {
  readonly blockingUsages: readonly MediaDeskUnifiedUsage[];

  constructor(blockingUsages: readonly MediaDeskUnifiedUsage[]) {
    super("Referenced media cannot be deleted");
    this.name = "MediaDeskBlockedDeleteError";
    this.blockingUsages = blockingUsages;
  }
}

export async function deleteInventoryRecord(
  session: RemoteMutationSessionLike,
  record: MediaDeskInventoryRecord,
): Promise<Readonly<Record<string, unknown>>> {
  if (record.item.origin !== "cms") {
    throw new Error("Registered/code-owned media cannot be deleted remotely");
  }
  const blockingUsages = blockingDeleteUsages(record);
  if (blockingUsages.length > 0) throw new MediaDeskBlockedDeleteError(blockingUsages);
  const source = await session.assetRevision(record.assetId, "catalog");
  return session.postJson("/api/media/delete", {
    assetId: record.assetId,
    expectedRevision: source.revision,
  });
}

function remoteReplaceSupported(record: MediaDeskInventoryRecord): boolean {
  const asset = record.item.asset;
  return record.item.origin === "cms"
    && asset.type === "image"
    && /\.(?:png|jpe?g|gif|webp)$/iu.test(asset.src);
}

export async function replaceInventoryRecord(
  session: RemoteMutationSessionLike,
  record: MediaDeskInventoryRecord,
  file: File,
): Promise<Readonly<Record<string, unknown>>> {
  if (record.item.origin !== "cms") {
    throw new Error("Registered/code-owned media cannot be replaced remotely");
  }
  if (!remoteReplaceSupported(record)) {
    throw new Error("Remote replace supports CMS PNG/JPEG/GIF/WebP images only");
  }
  const source = await session.assetRevision(record.assetId, "source");
  return session.postMultipart(
    "/api/media/replace",
    { assetId: record.assetId, expectedRevision: source.revision },
    file,
  );
}

export interface RemoteControlState {
  readonly replaceEnabled: boolean;
  readonly deleteEnabled: boolean;
  readonly deleteReason: string;
}

export function remoteControlState(record: MediaDeskInventoryRecord): RemoteControlState {
  if (record.item.origin !== "cms") {
    return {
      replaceEnabled: false,
      deleteEnabled: false,
      deleteReason: "Registered/code-owned media is read-only in remote Media Desk",
    };
  }
  const replaceEnabled = remoteReplaceSupported(record);
  const replaceReason = replaceEnabled ? "" : "Remote replace supports CMS PNG/JPEG/GIF/WebP images only";
  const blockingUsages = blockingDeleteUsages(record);
  if (blockingUsages.length === 0) {
    return { replaceEnabled, deleteEnabled: true, deleteReason: replaceReason };
  }
  return {
    replaceEnabled,
    deleteEnabled: false,
    deleteReason: blockingUsages
      .map((usage) => `${usage.kind}: ${usage.ownerId}`)
      .join("; "),
  };
}

export async function assignProjectCoverFromInventory(
  session: RemoteMutationSessionLike,
  record: MediaDeskInventoryRecord,
  ownerId: string,
): Promise<Readonly<Record<string, unknown>>> {
  const asset = record.item.asset;
  if (asset.type !== "image" || !asset.width || !asset.height) {
    throw new Error("Project cover assignment requires an image asset with dimensions");
  }
  if (!ownerId) throw new Error("Project cover owner is required");
  const source = await session.sourceRevision("src/content/projects.json");
  return session.postJson("/api/media/assign", {
    target: { kind: "project-cover", ownerId },
    asset: {
      id: asset.id,
      type: asset.type,
      src: asset.src,
      width: asset.width,
      height: asset.height,
    },
    expectedRevision: source.revision,
  });
}

export async function assignPetCoverFromInventory(
  session: RemoteMutationSessionLike,
  record: MediaDeskInventoryRecord,
  ownerId: string,
  entryId: string,
): Promise<Readonly<Record<string, unknown>>> {
  if (!ownerId) throw new Error("Pet cover owner is required");
  if (!record.usage.entryIds.includes(entryId)) {
    throw new Error(`Media entry ${entryId} does not belong to selected asset`);
  }
  const source = await session.sourceRevision("src/content/subproject-card-covers.json");
  return session.postJson("/api/media/assign", {
    target: { kind: "pet-cover", ownerId },
    entryId,
    expectedRevision: source.revision,
  });
}

export const REMOTE_MEDIA_TRANSPORT_LIMIT_BYTES = 16 * 1024 * 1024;

export interface NewRemoteMediaInput {
  readonly title: string;
  readonly alt?: string;
  readonly description?: string;
  readonly date?: string;
  readonly width: number;
  readonly height: number;
  readonly durationSeconds?: number;
  readonly showInCatalog?: boolean;
  readonly reusable?: boolean;
  readonly archived?: boolean;
}

function uploadMediaType(file: File): "image" | "video" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  throw new Error("Remote upload accepts image or video files only");
}
export async function uploadNewMedia(
  session: RemoteMutationSessionLike,
  file: File,
  input: NewRemoteMediaInput,
): Promise<Readonly<Record<string, unknown>>> {
  if (file.size > REMOTE_MEDIA_TRANSPORT_LIMIT_BYTES) {
    throw new Error("Remote media transport is limited to 16 MiB");
  }
  const title = input.title.trim();
  if (!title) throw new Error("Media title is required");
  const mediaType = uploadMediaType(file);

  return session.postMultipart("/api/media/upload", {
    mediaType,
    mimeType: file.type,
    title,
    alt: input.alt ?? "",
    description: input.description ?? "",
    date: input.date ?? "",
    width: input.width,
    height: input.height,
    durationSeconds: input.durationSeconds ?? 0,
    showInCatalog: Boolean(input.showInCatalog),
    reusable: Boolean(input.reusable),
    archived: Boolean(input.archived),
  }, file);
}
