import { createHash, randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const REVISION_PATTERN = /^[a-f0-9]{64}$/;

export interface TransactionHooks {
  beforeReplace?(context: { index: number; path: string }): void | Promise<void>;
}

export interface VersionedFile {
  source: string;
  revision: string;
}

export interface PreparedTransactionalWrite {
  path: string;
  expectedRevision: string;
  nextSource: string;
}

export class RevisionConflictError extends Error {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = "RevisionConflictError";
  }
}

export function revisionForSource(source: string): string {
  return createHash("sha256").update(source, "utf8").digest("hex");
}

export function requireExpectedRevision(value: unknown): string {
  if (typeof value !== "string" || !REVISION_PATTERN.test(value)) {
    throw new TypeError("expectedRevision must be a lowercase SHA-256 revision");
  }
  return value;
}

export function serializeCanonicalJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function readVersionedFile(path: string): Promise<VersionedFile> {
  const source = await readFile(path, "utf8");
  return { source, revision: revisionForSource(source) };
}

function temporaryPath(path: string, kind: "next" | "backup"): string {
  return join(dirname(path), `.${basename(path)}.${kind}.${randomUUID()}.tmp`);
}

async function safeRemove(path: string): Promise<void> {
  await rm(path, { force: true });
}

async function assertCurrentRevision(path: string, expectedRevision: string): Promise<void> {
  const current = await readVersionedFile(path);
  if (current.revision !== expectedRevision) {
    throw new RevisionConflictError(`Revision conflict for "${path}"`);
  }
}

export async function replaceFileTransactionally(
  write: PreparedTransactionalWrite,
  hooks: TransactionHooks = {},
): Promise<void> {
  await assertCurrentRevision(write.path, write.expectedRevision);
  const nextPath = temporaryPath(write.path, "next");
  await writeFile(nextPath, write.nextSource, { encoding: "utf8", flag: "wx" });
  try {
    await hooks.beforeReplace?.({ index: 0, path: write.path });
    await assertCurrentRevision(write.path, write.expectedRevision);
    await rename(nextPath, write.path);
  } finally {
    await safeRemove(nextPath);
  }
}

interface StagedWrite extends PreparedTransactionalWrite {
  nextPath: string;
  backupPath: string;
  committed: boolean;
}

async function rollback(staged: readonly StagedWrite[]): Promise<void> {
  let rollbackError: unknown;
  for (const item of [...staged].reverse()) {
    if (!item.committed) continue;
    try {
      await safeRemove(item.path);
      await rename(item.backupPath, item.path);
      item.committed = false;
    } catch (error) {
      rollbackError ??= error;
    }
  }
  if (rollbackError) throw rollbackError;
}

export async function replaceFilesTransactionally(
  writes: readonly PreparedTransactionalWrite[],
  hooks: TransactionHooks = {},
): Promise<void> {
  if (writes.length === 0) return;
  const paths = new Set<string>();
  for (const write of writes) {
    if (paths.has(write.path)) throw new Error(`Duplicate transactional path "${write.path}"`);
    paths.add(write.path);
    requireExpectedRevision(write.expectedRevision);
  }

  for (const write of writes) {
    await assertCurrentRevision(write.path, write.expectedRevision);
  }

  const staged: StagedWrite[] = writes.map((write) => ({
    ...write,
    nextPath: temporaryPath(write.path, "next"),
    backupPath: temporaryPath(write.path, "backup"),
    committed: false,
  }));

  try {
    for (const item of staged) {
      await writeFile(item.nextPath, item.nextSource, { encoding: "utf8", flag: "wx" });
    }

    for (const [index, item] of staged.entries()) {
      await hooks.beforeReplace?.({ index, path: item.path });
      await assertCurrentRevision(item.path, item.expectedRevision);
      await rename(item.path, item.backupPath);
      try {
        await rename(item.nextPath, item.path);
        item.committed = true;
      } catch (error) {
        await rename(item.backupPath, item.path);
        throw error;
      }
    }
  } catch (error) {
    try {
      await rollback(staged);
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Transactional write failed and rollback failed");
    }
    throw error;
  } finally {
    for (const item of staged) {
      await safeRemove(item.nextPath);
      if (!item.committed) await safeRemove(item.backupPath);
    }
  }

  for (const item of staged) {
    await safeRemove(item.backupPath);
  }
}
