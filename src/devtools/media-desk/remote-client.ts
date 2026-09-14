type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface RemoteStatusPayload {
  readonly ok?: boolean;
  readonly branch?: string;
  readonly head?: string;
  readonly error?: string;
}

interface RemoteRevisionPayload {
  readonly ok?: boolean;
  readonly path?: string;
  readonly revision?: string;
  readonly head?: string;
  readonly error?: string;
}

interface RemoteMutationPayload {
  readonly ok?: boolean;
  readonly branchHead?: string;
  readonly error?: string;
  readonly [key: string]: unknown;
}

export class RemoteMediaDeskError extends Error {
  readonly status: number;
  readonly payload: Readonly<Record<string, unknown>>;

  constructor(status: number, message: string, payload: Readonly<Record<string, unknown>> = {}) {
    super(message);
    this.name = "RemoteMediaDeskError";
    this.status = status;
    this.payload = payload;
  }
}async function readJson<T extends Record<string, unknown>>(response: Response): Promise<T> {
  let payload: Record<string, unknown> = {};
  try {
    payload = await response.json() as Record<string, unknown>;
  } catch {
    // Preserve the HTTP status even if an intermediary returned invalid JSON.
  }
  if (!response.ok) {
    const message = typeof payload.error === "string"
      ? payload.error
      : `Remote Media Desk request failed with HTTP ${response.status}`;
    throw new RemoteMediaDeskError(response.status, message, payload);
  }
  return payload as T;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Remote Media Desk response is missing ${label}`);
  }
  return value;
}

export interface RemoteSourceRevision {
  readonly path: string;
  readonly revision: string;
  readonly head: string;
}

export class RemoteMediaDeskSession {
  readonly #fetcher: FetchLike;
  #head: string | null = null;

  constructor(fetcher: FetchLike = window.fetch.bind(window)) {
    this.#fetcher = fetcher;
  }  async initialize(): Promise<string> {
    const response = await this.#fetcher("/api/status", {
      headers: { accept: "application/json" },
    });
    const payload = await readJson<RemoteStatusPayload & Record<string, unknown>>(response);
    if (payload.ok !== true) throw new Error("Remote Media Desk status response is not ok");
    this.#head = requiredString(payload.head, "head");
    return this.#head;
  }

  expectedHead(): string {
    if (!this.#head) throw new Error("Remote Media Desk session is not initialized");
    return this.#head;
  }

  async sourceRevision(path: string): Promise<RemoteSourceRevision> {
    const query = new URLSearchParams({ path });
    const response = await this.#fetcher(`/api/media/revision?${query}`, {
      headers: { accept: "application/json" },
    });
    const payload = await readJson<RemoteRevisionPayload & Record<string, unknown>>(response);
    if (payload.ok !== true) throw new Error("Remote Media Desk revision response is not ok");
    const head = requiredString(payload.head, "head");
    this.#head = head;
    return {
      path: requiredString(payload.path, "path"),
      revision: requiredString(payload.revision, "revision"),
      head,
    };
  }
  async postJson(
    path: string,
    body: Readonly<Record<string, unknown>>,
  ): Promise<RemoteMutationPayload> {
    const expectedHead = this.expectedHead();
    const response = await this.#fetcher(path, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...body, expectedHead }),
    });
    const payload = await readJson<RemoteMutationPayload>(response);
    if (payload.ok !== true) throw new Error("Remote Media Desk mutation response is not ok");
    if (typeof payload.branchHead === "string" && payload.branchHead.length > 0) {
      this.#head = payload.branchHead;
    }
    return payload;
  }

  async postMultipart(
    path: string,
    metadata: Readonly<Record<string, unknown>>,
    file: File,
  ): Promise<RemoteMutationPayload> {
    const form = new FormData();
    form.set("metadata", JSON.stringify({ ...metadata, expectedHead: this.expectedHead() }));
    form.set("file", file);
    const response = await this.#fetcher(path, {
      method: "POST",
      headers: { accept: "application/json" },
      body: form,
    });
    const payload = await readJson<RemoteMutationPayload>(response);
    if (payload.ok !== true) throw new Error("Remote Media Desk mutation response is not ok");
    if (typeof payload.branchHead === "string" && payload.branchHead.length > 0) {
      this.#head = payload.branchHead;
    }
    return payload;
  }
}
