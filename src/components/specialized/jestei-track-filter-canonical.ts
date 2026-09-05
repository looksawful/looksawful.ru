import type { JesteiTrackFilterSection } from "../../content/contracts/sections.ts";
import { renderJesteiTrackFilter as renderExtractedJesteiTrackFilter } from "./jestei-track-filter.ts";

const LEGACY_FILTER_CAPTION = /Новый\s+дизайн системы фильтрации треков\./;

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
  return renderExtractedJesteiTrackFilter(section).replace(
    LEGACY_FILTER_CAPTION,
    "Новый интерфейс фильтрации треков.",
  );
}
