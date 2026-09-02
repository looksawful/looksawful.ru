import source from "../../content/editorial/standalone-projects/berry-social-content-2020.json" with { type: "json" };

import { expectAllowedKeys, expectRecord, readEditorialText } from "./editorial-validation.ts";

export interface BerryEditorialContent {
  head: string;
  title: string;
  role: string;
  period: string;
  summary: string;
  lead: string;
}

export function parseBerryEditorialContent(value: unknown): BerryEditorialContent {
  const record = expectRecord(value, "Berry editorial content");
  expectAllowedKeys(
    record,
    ["head", "title", "role", "period", "summary", "lead"],
    [],
    "Berry editorial content",
  );

  return {
    head: readEditorialText(record.head, "Berry head"),
    title: readEditorialText(record.title, "Berry title"),
    role: readEditorialText(record.role, "Berry role"),
    period: readEditorialText(record.period, "Berry period"),
    summary: readEditorialText(record.summary, "Berry summary"),
    lead: readEditorialText(record.lead, "Berry lead"),
  };
}

export const berryEditorialContent = parseBerryEditorialContent(source);
