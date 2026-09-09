import { readFile } from "node:fs/promises";
import path from "node:path";

import { sitePages } from "../../src/site/pages/manifest.ts";

const CASE_SOURCE_CONFIG = [
  {
    page: "case:jestei-pool",
    locale: "ru",
    source: "src/content/cases/jestei-pool.json",
  },
  {
    page: "case:jestei-pool",
    locale: "en",
    source: "src/content/i18n/en/cases/jestei-pool.json",
  },
  {
    page: "case:styx",
    locale: "ru",
    source: "src/content/cases/styx.json",
  },
  {
    page: "case:styx",
    locale: "en",
    source: "src/content/i18n/en/cases/styx.json",
  },
  {
    page: "case:sensetique",
    locale: "ru",
    source: "src/content/cases/sensetique.json",
  },
];

function pushRecord(records, context, section, field, text) {
  if (typeof text !== "string" || text.trim() === "") return;

  records.push({
    page: context.page,
    route: context.route,
    locale: context.locale,
    section,
    field,
    source: context.source,
    text,
  });
}

export function extractCaseDocument({ page, route, locale, source, data }) {
  const context = { page, route, locale, source };
  const records = [];

  if (typeof data?.lead === "string") {
    pushRecord(records, context, "intro", "lead", data.lead);
  } else {
    pushRecord(records, context, "intro", "intro.lead", data?.intro?.lead);
  }

  for (const [sectionIndex, section] of (data?.sections ?? []).entries()) {
    const sectionId = section?.id || `section-${sectionIndex}`;
    pushRecord(
      records,
      context,
      sectionId,
      `sections[${sectionIndex}].title`,
      section?.title,
    );

    for (const [paragraphIndex, paragraph] of (section?.paragraphs ?? []).entries()) {
      pushRecord(
        records,
        context,
        sectionId,
        `sections[${sectionIndex}].paragraphs[${paragraphIndex}]`,
        paragraph,
      );
    }
  }

  for (const [overlayIndex, overlay] of (data?.overlays ?? []).entries()) {
    pushRecord(
      records,
      context,
      overlay?.id || `overlay-${overlayIndex}`,
      `overlays[${overlayIndex}].text`,
      overlay?.text,
    );
  }

  for (const [creditIndex, credit] of (data?.credits ?? []).entries()) {
    const creditId = credit?.id || `credit-${creditIndex}`;
    pushRecord(
      records,
      context,
      creditId,
      `credits[${creditIndex}].title`,
      credit?.title,
    );
    for (const [lineIndex, line] of (credit?.lines ?? []).entries()) {
      pushRecord(
        records,
        context,
        creditId,
        `credits[${creditIndex}].lines[${lineIndex}]`,
        line,
      );
    }
  }

  for (const [noteIndex, note] of (data?.notes ?? []).entries()) {
    pushRecord(
      records,
      context,
      note?.id || `note-${noteIndex}`,
      `notes[${noteIndex}].text`,
      note?.text,
    );
  }

  return records;
}

export function resolveConfiguredCaseSources() {
  const routeByPage = new Map(
    sitePages.filter((page) => page.enabled).map((page) => [page.id, page.path]),
  );

  return CASE_SOURCE_CONFIG.map((entry) => {
    const route = routeByPage.get(entry.page);
    if (!route) {
      throw new Error(`Site copy source references unknown page: ${entry.page}`);
    }
    return { ...entry, route };
  });
}

export async function loadConfiguredCaseCopy({ root = process.cwd() } = {}) {
  const records = [];

  for (const entry of resolveConfiguredCaseSources()) {
    const sourcePath = path.resolve(root, entry.source);
    const data = JSON.parse(await readFile(sourcePath, "utf8"));
    records.push(...extractCaseDocument({ ...entry, data }));
  }

  return records;
}
