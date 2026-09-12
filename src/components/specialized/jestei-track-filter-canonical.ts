import type { JesteiTrackFilterSection } from "../../content/contracts/sections.ts";
import { renderJesteiTrackFilter as renderExtractedJesteiTrackFilter } from "./jestei-track-filter.ts";

const LEGACY_FILTER_CAPTION = /Новый\s+дизайн системы фильтрации треков\./;
const LEGACY_FILTER_TITLE = "<h1>Новые релизы</h1>";
const FILTER_TITLE = "<h2>Новые релизы</h2>";
const FILTER_STYLESHEET =
  '<link href="/components/playlist-filter-workflow.css" rel="stylesheet">';
const FILTER_STYLESHEETS = `${FILTER_STYLESHEET}
                        <link href="/components/playlist-filter-workflow-layout.css" rel="stylesheet">`;
const FILTER_VIEWPORT_OPEN =
  '<div class="mockup__viewport"><playlist-filter-workflow';
const FILTER_VIEWPORT_SEARCH_EXCLUDED_OPEN =
  '<!--noindex--><div class="mockup__viewport" data-nosnippet><playlist-filter-workflow';
const FILTER_VIEWPORT_CLOSE = "</playlist-filter-workflow></div>";
const FILTER_VIEWPORT_SEARCH_EXCLUDED_CLOSE =
  "</playlist-filter-workflow></div><!--/noindex-->";

/**
 * Transitional parity adapter.
 *
 * The legacy large-case path normalizes this caption after the homepage is
 * rendered. Keep canonical standalone output identical until Home is migrated
 * and the old post-render replacement disappears. Then move the final caption
 * into the specialized source and delete this adapter.
 *
 * The embedded filter belongs below the case/page heading, so normalize its
 * legacy document-level H1 to H2 without changing the visible label.
 *
 * Keep the interactive filter viewport out of Yandex indexing and Google
 * snippets without changing layout ownership or excluding the authored caption.
 */
export function renderJesteiTrackFilter(
  section: JesteiTrackFilterSection,
): string {
  return renderExtractedJesteiTrackFilter(section)
    .replace(FILTER_STYLESHEET, FILTER_STYLESHEETS)
    .replace(LEGACY_FILTER_TITLE, FILTER_TITLE)
    .replace(FILTER_VIEWPORT_OPEN, FILTER_VIEWPORT_SEARCH_EXCLUDED_OPEN)
    .replace(FILTER_VIEWPORT_CLOSE, FILTER_VIEWPORT_SEARCH_EXCLUDED_CLOSE)
    .replace(LEGACY_FILTER_CAPTION, "Новый интерфейс фильтрации треков.");
}
