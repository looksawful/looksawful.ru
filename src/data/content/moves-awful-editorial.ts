import source from "../../content/standalone-projects/moves-awful.json" with { type: "json" };

export interface MovesAwfulEditorialContent {
  intro: {
    head: string;
    title: string;
    role: string;
    period: string;
    summary: string;
  };
  animations: {
    title: string;
    paragraphs: string[];
  };
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

function expectParagraphs(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError("Moves Awful animation paragraphs must be a non-empty array");
  }
  return value.map((paragraph, index) =>
    expectNonEmptyString(paragraph, `Moves Awful animation paragraph ${index + 1}`),
  );
}

export function parseMovesAwfulEditorialContent(value: unknown): MovesAwfulEditorialContent {
  const record = expectRecord(value, "Moves Awful editorial content");
  expectExactKeys(record, ["intro", "animations"], "Moves Awful editorial content");

  const intro = expectRecord(record.intro, "Moves Awful intro");
  expectExactKeys(intro, ["head", "title", "role", "period", "summary"], "Moves Awful intro");

  const animations = expectRecord(record.animations, "Moves Awful animations");
  expectExactKeys(animations, ["title", "paragraphs"], "Moves Awful animations");

  return {
    intro: {
      head: expectNonEmptyString(intro.head, "Moves Awful intro head"),
      title: expectNonEmptyString(intro.title, "Moves Awful intro title"),
      role: expectNonEmptyString(intro.role, "Moves Awful intro role"),
      period: expectNonEmptyString(intro.period, "Moves Awful intro period"),
      summary: expectNonEmptyString(intro.summary, "Moves Awful intro summary"),
    },
    animations: {
      title: expectNonEmptyString(animations.title, "Moves Awful animations title"),
      paragraphs: expectParagraphs(animations.paragraphs),
    },
  };
}

export const movesAwfulEditorialContent = parseMovesAwfulEditorialContent(source);
