import type { JesteiTrackFilterSection } from "../../content/contracts/sections.ts";
import { renderJesteiTrackFilter as renderExtractedJesteiTrackFilter } from "./jestei-track-filter.ts";

const LEGACY_FILTER_CAPTION = /Новый\s+дизайн системы фильтрации треков\./;
const FILTER_STYLESHEET =
  '<link href="/components/playlist-filter-workflow.css" rel="stylesheet">';
const FILTER_STYLESHEETS = `${FILTER_STYLESHEET}
                        <link href="/components/playlist-filter-workflow-layout.css" rel="stylesheet">`;

/**
 * Transitional parity adapter.
 *
 * The legacy large-case path normalizes this caption after the homepage is
 * rendered. Keep canonical standalone output identical until Home is migrated
 * and the old post-render replacement disappears. Then move the final caption
 * into the specialized source and delete this adapter.
 */
export function renderJesteiTrackFilter(
  section: JesteiTrackFilterSection,
): string {
  return renderExtractedJesteiTrackFilter(section)
    .replace(FILTER_STYLESHEET, FILTER_STYLESHEETS)
    .replace(LEGACY_FILTER_CAPTION, "Новый интерфейс фильтрации треков.");
}
