/**
 * Normalize authored caption copy while preserving plain-text semantics.
 * Consumers must place the returned value through textContent, never innerHTML.
 */
export function normalizeCaptionText(
  value: string | null | undefined,
): string {
  return value?.replace(/\s+/g, " ").trim() || "";
}
