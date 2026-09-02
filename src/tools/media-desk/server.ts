import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

import {
  parseRegisteredMediaCatalogRecord,
  parseUploadedMediaCatalogRecord,
} from "../../data/media/catalog.ts";
import {
  applyMediaEditorialPatch,
  collectContentDeskTextEntries,
  type ContentDeskTextEntry,
} from "./editor-model.ts";

const METADATA_API_PATH = "/__media-desk/metadata";
const TEXTS_API_PATH = "/__media-desk/texts";
const MAX_BODY_BYTES = 128 * 1024;
const SAFE_ASSET_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const TEXT_SOURCE_FILES = [
  "src/content/navigation.json",
  "src/content/projects.json",
] as const;

const TEXT_SOURCE_DIRECTORIES = [
  "src/content/editorial",
  "src/content/cases",
  "src/content/collections",
  "src/content/shootings",
  "src/content/standalone-projects",
] as const;

interface SaveRequest {
  id: string;
  metadata: Record<string, unknown>;
}

function json(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(body)}\n`);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large");
    chunks.push(buffer);
  }
  const source = Buffer.concat(chunks).toString("utf8");
  if (!source) throw new Error("Request body is empty");
  return JSON.parse(source);
}

function parseSaveRequest(value: unknown): SaveRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Media Desk save request must be an object");
  }
  const record = value as Record<string, unknown>;
  const unexpected = Object.keys(record).filter((key) => key !== "id" && key !== "metadata");
  if (unexpected.length > 0) {
    throw new Error(`Media Desk save request has unexpected field "${unexpected[0]}"`);
  }
  if (typeof record.id !== "string" || !SAFE_ASSET_ID.test(record.id)) {
    throw new TypeError("Media Desk save request id is invalid");
  }
  if (!record.metadata || typeof record.metadata !== "object" || Array.isArray(record.metadata)) {
    throw new TypeError("Media Desk save request metadata must be an object");
  }
  return { id: record.id, metadata: record.metadata as Record<string, unknown> };
}

async function existingRecordPath(root: string, id: string): Promise<{
  path: string;
  origin: "registered" | "upload";
}> {
  const candidates = [
    {
      path: resolve(root, "src/content/media-catalog/registered", `${id}.json`),
      origin: "registered" as const,
    },
    {
      path: resolve(root, "src/content/media-catalog/uploads", `${id}.json`),
      origin: "upload" as const,
    },
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate.path);
      return candidate;
    } catch {}
  }

  throw new Error(`Media catalog record "${id}" was not found`);
}

async function readTextSource(root: string, sourcePath: string): Promise<[string, unknown]> {
  const absolutePath = resolve(root, sourcePath);
  return [sourcePath, JSON.parse(await readFile(absolutePath, "utf8"))];
}

export async function loadContentDeskTextEntries(root: string): Promise<readonly ContentDeskTextEntry[]> {
  const sources: Record<string, unknown> = {};

  for (const sourcePath of TEXT_SOURCE_FILES) {
    const [path, value] = await readTextSource(root, sourcePath);
    sources[path] = value;
  }

  for (const directoryPath of TEXT_SOURCE_DIRECTORIES) {
    const absoluteDirectory = resolve(root, directoryPath);
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    const jsonFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();

    for (const filename of jsonFiles) {
      const sourcePath = join(directoryPath, filename).replaceAll("\\", "/");
      const [path, value] = await readTextSource(root, sourcePath);
      sources[path] = value;
    }
  }

  return collectContentDeskTextEntries(sources);
}

export async function saveMediaDeskMetadata(
  root: string,
  request: SaveRequest,
): Promise<Record<string, unknown>> {
  const target = await existingRecordPath(root, request.id);
  const current = JSON.parse(await readFile(target.path, "utf8")) as Record<string, unknown>;
  if (current.id !== request.id) {
    throw new Error(`Media catalog record id mismatch for "${request.id}"`);
  }

  const next = applyMediaEditorialPatch(current, request.metadata);
  if (target.origin === "registered") {
    parseRegisteredMediaCatalogRecord(next);
  } else {
    parseUploadedMediaCatalogRecord(next);
  }

  await writeFile(target.path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function createMediaDeskWritePlugin(root: string): Plugin {
  return {
    name: "looksawful-media-desk-write",
    apply: "serve",
    configureServer(server) {
      if (process.env.CONTENT_DESK_WRITE !== "1") return;

      server.middlewares.use(TEXTS_API_PATH, async (request, response) => {
        if (request.method !== "GET") {
          json(response, 405, { ok: false, error: "Method not allowed" });
          return;
        }

        try {
          const entries = await loadContentDeskTextEntries(root);
          json(response, 200, { ok: true, entries });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown Content Desk error";
          json(response, 500, { ok: false, error: message });
        }
      });

      server.middlewares.use(METADATA_API_PATH, async (request, response) => {
        if (request.method !== "POST") {
          json(response, 405, { ok: false, error: "Method not allowed" });
          return;
        }

        try {
          const payload = parseSaveRequest(await readJsonBody(request));
          const record = await saveMediaDeskMetadata(root, payload);
          json(response, 200, { ok: true, record });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown Media Desk error";
          json(response, 400, { ok: false, error: message });
        }
      });
    },
  };
}
