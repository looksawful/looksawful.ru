const MEDIA_METADATA_ENDPOINT = "/__media-desk/metadata";
const MEDIA_BULK_ENDPOINT = "/__media-desk/metadata/bulk";

type FetchLike = typeof window.fetch;

interface RevisionPayload {
  ok?: boolean;
  revision?: string;
  error?: string;
}

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

export async function loadMediaDeskRevision(id: string): Promise<string> {
  return fetchRevision(window.fetch.bind(window), id);
}

export async function loadMediaDeskRevisions(
  ids: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  const fetcher = window.fetch.bind(window);
  const entries = await Promise.all(
    ids.map(async (id) => [id, await fetchRevision(fetcher, id)] as const),
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

export function installRevisionAwareMediaFetch(): void {
  const nativeFetch = window.fetch.bind(window);

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
      const expectedRevision = await fetchRevision(nativeFetch, record.id);
      return nativeFetch(input, {
        ...init,
        body: JSON.stringify({ ...record, expectedRevision }),
      });
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

      const revisions = new Map(
        await Promise.all(
          ids.map(async (id) => [id as string, await fetchRevision(nativeFetch, id as string)] as const),
        ),
      );
      const versioned = payload.map((item) => {
        const record = item as Record<string, unknown>;
        if (record.expectedRevision !== undefined) return record;
        return {
          ...record,
          expectedRevision: revisions.get(record.id as string),
        };
      });
      return nativeFetch(input, {
        ...init,
        body: JSON.stringify(versioned),
      });
    }

    return nativeFetch(input, init);
  };
}
