import source from "../../content/standalone-projects/berry-social-content-2020.json" with { type: "json" };

export interface BerryEditorialContent {
  head: string;
  title: string;
  role: string;
  period: string;
  summary: string;
  lead: string;
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectExactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const allowed = new Set(expected);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      throw new Error(`${label} has unexpected field "${key}"`);
    }
  }
  for (const key of expected) {
    if (!(key in record)) {
      throw new Error(`${label} is missing field "${key}"`);
    }
  }
}

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

export function parseBerryEditorialContent(value: unknown): BerryEditorialContent {
  const record = expectRecord(value, "Berry editorial content");
  expectExactKeys(
    record,
    ["head", "title", "role", "period", "summary", "lead"],
    "Berry editorial content",
  );

  return {
    head: expectNonEmptyString(record.head, "Berry head"),
    title: expectNonEmptyString(record.title, "Berry title"),
    role: expectNonEmptyString(record.role, "Berry role"),
    period: expectNonEmptyString(record.period, "Berry period"),
    summary: expectNonEmptyString(record.summary, "Berry summary"),
    lead: expectNonEmptyString(record.lead, "Berry lead"),
  };
}

export const berryEditorialContent = parseBerryEditorialContent(source);
