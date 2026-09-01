export function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function expectAllowedKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  requiredKeys: readonly string[],
  label: string,
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) throw new Error(`${label} has unexpected field "${key}"`);
  }
  for (const key of requiredKeys) {
    if (!(key in record)) throw new Error(`${label} is missing field "${key}"`);
  }
}

export function expectStructuralString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

export function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(`${label} must be a boolean`);
  }
  return value;
}

export function expectPositiveInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive integer`);
  }
  return value;
}

export function readEditorialText(value: unknown, label: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new TypeError(`${label} must be a string when present`);
  return value.trim().length === 0 ? "" : value;
}

export function readEditorialTextList(value: unknown, label: string): readonly string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array when present`);
  return value
    .map((item, index) => readEditorialText(item, `${label}[${index}]`))
    .filter((item) => item.length > 0);
}

export function readEditorialTextSlots(value: unknown, label: string): readonly string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array when present`);
  return value.map((item, index) => readEditorialText(item, `${label}[${index}]`));
}

export function expectArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

export function expectKnownId<const T extends readonly string[]>(
  value: unknown,
  ids: T,
  label: string,
): T[number] {
  const id = expectStructuralString(value, label);
  if (!ids.some((candidate) => candidate === id)) {
    throw new Error(`${label} has unknown id "${id}"`);
  }
  return id as T[number];
}

export function normalizeById<T extends { id: string }>(
  values: readonly T[],
  expectedIds: readonly string[],
  label: string,
): readonly T[] {
  const byId = new Map<string, T>();
  for (const value of values) {
    if (byId.has(value.id)) throw new Error(`${label} contains duplicate id "${value.id}"`);
    byId.set(value.id, value);
  }
  for (const id of expectedIds) {
    if (!byId.has(id)) throw new Error(`${label} is missing id "${id}"`);
  }
  if (byId.size !== expectedIds.length) throw new Error(`${label} contains unexpected entries`);
  return expectedIds.map((id) => byId.get(id) as T);
}
