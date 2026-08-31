import source from "../../content/standalone-projects/awful-cases.json" with { type: "json" };

export interface AwfulCasesEditorialContent {
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

export function parseAwfulCasesEditorialContent(value: unknown): AwfulCasesEditorialContent {
  const record = expectRecord(value, "Awful Cases editorial content");
  expectExactKeys(
    record,
    ["head", "title", "role", "period", "summary", "lead"],
    "Awful Cases editorial content",
  );

  return {
    head: expectNonEmptyString(record.head, "Awful Cases head"),
    title: expectNonEmptyString(record.title, "Awful Cases title"),
    role: expectNonEmptyString(record.role, "Awful Cases role"),
    period: expectNonEmptyString(record.period, "Awful Cases period"),
    summary: expectNonEmptyString(record.summary, "Awful Cases summary"),
    lead: expectNonEmptyString(record.lead, "Awful Cases lead"),
  };
}

export const awfulCasesEditorialContent = parseAwfulCasesEditorialContent(source);
