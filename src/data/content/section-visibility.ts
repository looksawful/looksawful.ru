export interface SectionVisibilityRecord {
  readonly id: string;
  readonly visible: boolean;
}

function assertRecord(value: unknown, index: number): SectionVisibilityRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`section visibility record ${index} must be an object`);
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 2 || !keys.includes("id") || !keys.includes("visible")) {
    throw new Error(`section visibility record ${index} contains unsupported fields`);
  }
  if (typeof record.id !== "string" || record.id.length === 0) {
    throw new Error(`section visibility record ${index} must have a non-empty id`);
  }
  if (typeof record.visible !== "boolean") {
    throw new Error(`section visibility record ${record.id} must have boolean visible`);
  }

  return { id: record.id, visible: record.visible };
}

export function parseSectionVisibility(
  value: unknown,
  expectedIds: readonly string[],
): readonly SectionVisibilityRecord[] {
  if (!Array.isArray(value)) {
    throw new Error("section visibility content must be an array");
  }

  const expected = new Set(expectedIds);
  if (expected.size !== expectedIds.length) {
    throw new Error("expected section visibility ids must be unique");
  }

  const seen = new Set<string>();
  const records = value.map((item, index) => assertRecord(item, index));

  for (const record of records) {
    if (seen.has(record.id)) {
      throw new Error(`duplicate section visibility id: ${record.id}`);
    }
    seen.add(record.id);

    if (!expected.has(record.id)) {
      throw new Error(`unexpected section visibility id: ${record.id}`);
    }
  }

  for (const id of expectedIds) {
    if (!seen.has(id)) {
      throw new Error(`missing section visibility id: ${id}`);
    }
  }

  return records;
}
