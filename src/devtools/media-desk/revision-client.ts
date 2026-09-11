const MEDIA_METADATA_ENDPOINT = "/__media-desk/metadata";
const MEDIA_BULK_ENDPOINT = "/__media-desk/metadata/bulk";

type FetchLike = typeof window.fetch;

interface RevisionPayload {
  ok?: boolean;
  id?: string;
  revision?: string;
  revisions?: readonly { id: string; revision: string }[];
  error?: string;
}

const revisionCache = new Map<string, string>();
const revisionLoads = new Map<string, Promise<string>>();

async function fetchRevision(
  fetcher: FetchLike,
  id: string,
): Promise<string> {
  const response = await fetcher(
    `${MEDIA_METADATA_ENDPOINT}?${new URLSearchParams({ id })}`,
    { headers: { accept: "application/json" } },
  );
  const payload = await response.json() as RevisionPayload;
  if (!response.ok || !payload.ok || typeof payload.revision !== "string") {
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }
  return payload.revision;
}

async function primeRevision(fetcher: FetchLike, id: string): Promise<string> {
  const cached = revisionCache.get(id);
  if (cached) return cached;

  const existing = revisionLoads.get(id);
  if (existing) return existing;

  const loading = fetchRevision(fetcher, id)
    .then((revision) => {
      revisionCache.set(id, revision);
      return revision;
    })
    .finally(() => {
      revisionLoads.delete(id);
    });
  revisionLoads.set(id, loading);
  return loading;
}

export async function loadMediaDeskRevision(id: string): Promise<string> {
  return primeRevision(window.fetch.bind(window), id);
}

export async function loadMediaDeskRevisions(
  ids: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  const fetcher = window.fetch.bind(window);
  const entries = await Promise.all(
    ids.map(async (id) => [id, await primeRevision(fetcher, id)] as const),
  );
  return new Map(entries);
}

function requestPath(input: RequestInfo | URL): string | null {
  const raw = input instanceof Request ? input.url : String(input);
  try {
    return new URL(raw, location.origin).pathname;
  } catch {
    return null;
  }
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  return (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
}

function parseJsonBody(init?: RequestInit): unknown {
  return typeof init?.body === "string" ? JSON.parse(init.body) : null;
}

function selectedIds(event: Event): string[] {
  const ids = (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];
  return [...new Set(ids)].filter((id): id is string => typeof id === "string" && id.length > 0);
}

function expectedRevisionFor(id: string): string {
  const revision = revisionCache.get(id);
  if (!revision) {
    throw new Error(`Media Desk revision for "${id}" is not loaded. Reselect the asset and retry.`);
  }
  return revision;
}

async function updateCacheFromResponse(response: Response): Promise<void> {
  if (!response.ok) return;
  const payload = await response.clone().json() as RevisionPayload;
  if (payload.ok && typeof payload.id === "string" && typeof payload.revision === "string") {
    revisionCache.set(payload.id, payload.revision);
  }
  for (const entry of payload.revisions ?? []) {
    if (typeof entry.id === "string" && typeof entry.revision === "string") {
      revisionCache.set(entry.id, entry.revision);
    }
  }
}

export function installRevisionAwareMediaFetch(): void {
  const nativeFetch = window.fetch.bind(window);

  document.addEventListener("media-desk:selection-change", (event) => {
    for (const id of selectedIds(event)) {
      void primeRevision(nativeFetch, id).catch(() => {
        revisionCache.delete(id);
      });
    }
  });

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const path = requestPath(input);
    if (requestMethod(input, init) !== "POST") {
      return nativeFetch(input, init);
    }

    if (path === MEDIA_METADATA_ENDPOINT) {
      const payload = parseJsonBody(init);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return nativeFetch(input, init);
      }
      const record = payload as Record<string, unknown>;
      if (typeof record.id !== "string" || record.expectedRevision !== undefined) {
        return nativeFetch(input, init);
      }
      await revisionLoads.get(record.id);
      const expectedRevision = expectedRevisionFor(record.id);
      const response = await nativeFetch(input, {
        ...init,
        body: JSON.stringify({ ...record, expectedRevision }),
      });
      await updateCacheFromResponse(response);
      return response;
    }

    if (path === MEDIA_BULK_ENDPOINT) {
      const payload = parseJsonBody(init);
      if (!Array.isArray(payload)) return nativeFetch(input, init);
      const ids = payload.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const id = (item as Record<string, unknown>).id;
        return typeof id === "string" ? id : null;
      });
      if (ids.some((id) => id === null)) return nativeFetch(input, init);

      await Promise.all(ids.map((id) => id ? revisionLoads.get(id) : undefined));
      const versioned = payload.map((item) => {
        const record = item as Record<string, unknown>;
        if (record.expectedRevision !== undefined) return record;
        const id = record.id as string;
        return {
          ...record,
          expectedRevision: expectedRevisionFor(id),
        };
      });
      const response = await nativeFetch(input, {
        ...init,
        body: JSON.stringify(versioned),
      });
      await updateCacheFromResponse(response);
      return response;
    }

    return nativeFetch(input, init);
  };
}
