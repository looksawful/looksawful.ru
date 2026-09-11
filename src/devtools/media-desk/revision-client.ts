const MEDIA_METADATA_ENDPOINT = "/__media-desk/metadata";

interface RevisionPayload {
  ok?: boolean;
  revision?: string;
  error?: string;
}

export async function loadMediaDeskRevision(id: string): Promise<string> {
  const response = await fetch(
    `${MEDIA_METADATA_ENDPOINT}?${new URLSearchParams({ id })}`,
    { headers: { accept: "application/json" } },
  );
  const payload = await response.json() as RevisionPayload;
  if (!response.ok || !payload.ok || typeof payload.revision !== "string") {
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }
  return payload.revision;
}

export async function loadMediaDeskRevisions(
  ids: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await loadMediaDeskRevision(id)] as const),
  );
  return new Map(entries);
}
