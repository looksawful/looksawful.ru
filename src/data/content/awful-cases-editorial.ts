import source from "../../content/editorial/standalone-projects/awful-cases.json" with { type: "json" };

import { expectAllowedKeys, expectRecord, readEditorialText } from "./editorial-validation.ts";

export interface AwfulCasesEditorialContent {
  head: string;
  title: string;
  role: string;
  period: string;
  summary: string;
  lead: string;
}

export function parseAwfulCasesEditorialContent(value: unknown): AwfulCasesEditorialContent {
  const record = expectRecord(value, "Awful Cases editorial content");
  expectAllowedKeys(
    record,
    ["head", "title", "role", "period", "summary", "lead"],
    [],
    "Awful Cases editorial content",
  );

  return {
    head: readEditorialText(record.head, "Awful Cases head"),
    title: readEditorialText(record.title, "Awful Cases title"),
    role: readEditorialText(record.role, "Awful Cases role"),
    period: readEditorialText(record.period, "Awful Cases period"),
    summary: readEditorialText(record.summary, "Awful Cases summary"),
    lead: readEditorialText(record.lead, "Awful Cases lead"),
  };
}

export const awfulCasesEditorialContent = parseAwfulCasesEditorialContent(source);
