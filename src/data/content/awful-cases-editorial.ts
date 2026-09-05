import source from "../../content/standalone-projects/awful-cases.json" with { type: "json" };

import { expectAllowedKeys, expectRecord, readEditorialText } from "./editorial-validation.ts";

export interface AwfulCasesEditorialCodeBlock {
  title: string;
  code: string;
  description?: string;
}

export interface AwfulCasesEditorialContent {
  head: string;
  title: string;
  role: string;
  period: string;
  summary: string;
  lead: string;
  codeBlocks: {
    install: AwfulCasesEditorialCodeBlock;
    run: AwfulCasesEditorialCodeBlock;
  };
}

function parseCodeBlock(value: unknown, label: string): AwfulCasesEditorialCodeBlock {
  const record = expectRecord(value, label);
  expectAllowedKeys(record, ["title", "code", "description"], ["code"], label);

  const title = readEditorialText(record.title, `${label} title`);
  const code = readEditorialText(record.code, `${label} code`);
  const description = readEditorialText(record.description, `${label} description`);

  return {
    title,
    code,
    ...(description ? { description } : {}),
  };
}

export function parseAwfulCasesEditorialContent(value: unknown): AwfulCasesEditorialContent {
  const record = expectRecord(value, "Awful Cases editorial content");
  expectAllowedKeys(
    record,
    ["head", "title", "role", "period", "summary", "lead", "codeBlocks"],
    ["codeBlocks"],
    "Awful Cases editorial content",
  );

  const codeBlocks = expectRecord(record.codeBlocks, "Awful Cases code blocks");
  expectAllowedKeys(
    codeBlocks,
    ["install", "run"],
    ["install", "run"],
    "Awful Cases code blocks",
  );

  return {
    head: readEditorialText(record.head, "Awful Cases head"),
    title: readEditorialText(record.title, "Awful Cases title"),
    role: readEditorialText(record.role, "Awful Cases role"),
    period: readEditorialText(record.period, "Awful Cases period"),
    summary: readEditorialText(record.summary, "Awful Cases summary"),
    lead: readEditorialText(record.lead, "Awful Cases lead"),
    codeBlocks: {
      install: parseCodeBlock(codeBlocks.install, "Awful Cases install code block"),
      run: parseCodeBlock(codeBlocks.run, "Awful Cases run code block"),
    },
  };
}

export const awfulCasesEditorialContent = parseAwfulCasesEditorialContent(source);
