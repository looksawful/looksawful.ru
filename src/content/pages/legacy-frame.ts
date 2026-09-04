const LEGACY_SECTION_CLASSES = new Set(["project__section", "wrapper"]);

/**
 * Migration-only adapter for visual blocks whose old data object owned the
 * page-section frame. Canonical PageContent moves that frame to Section.
 *
 * Delete this helper after all source data stops carrying legacy section
 * classes directly.
 */
export function withoutLegacySectionFrame<T extends { className?: string }>(data: T): T {
  if (!data.className) return data;

  const className = data.className
    .split(/\s+/)
    .filter((token) => token && !LEGACY_SECTION_CLASSES.has(token))
    .join(" ");

  if (className === data.className) return data;

  return {
    ...data,
    className: className || undefined,
  };
}
