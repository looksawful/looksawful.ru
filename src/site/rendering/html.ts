export type HtmlSlot = readonly [marker: string, content: string];
export type HtmlPatternReplacement = readonly [pattern: RegExp, replacement: string, label: string];

export function replaceRequiredSlot(html: string, marker: string, content: string): string {
  if (!html.includes(marker)) {
    throw new Error(`Required HTML slot not found: ${marker}`);
  }
  return html.replace(marker, content);
}

export function replaceRequiredSlots(html: string, slots: readonly HtmlSlot[]): string {
  return slots.reduce(
    (output, [marker, content]) => replaceRequiredSlot(output, marker, content),
    html,
  );
}

export function replaceRequiredPattern(
  html: string,
  pattern: RegExp,
  replacement: string,
  label: string,
): string {
  pattern.lastIndex = 0;
  if (!pattern.test(html)) {
    throw new Error(`Required HTML text not found: ${label}`);
  }
  pattern.lastIndex = 0;
  return html.replace(pattern, replacement);
}

export function replaceRequiredPatterns(
  html: string,
  replacements: readonly HtmlPatternReplacement[],
): string {
  return replacements.reduce(
    (output, [pattern, replacement, label]) =>
      replaceRequiredPattern(output, pattern, replacement, label),
    html,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractElementById(
  html: string,
  tagName: string,
  id: string,
): string {
  const tag = escapeRegExp(tagName);
  const targetId = escapeRegExp(id);
  const opening = new RegExp(
    `<${tag}\\b[^>]*\\bid=(?:"${targetId}"|'${targetId}')[^>]*>`,
    "i",
  );
  const openingMatch = opening.exec(html);
  if (!openingMatch || openingMatch.index === undefined) {
    throw new Error(`Required <${tagName}>#${id} not found`);
  }

  const start = openingMatch.index;
  const tokenPattern = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  tokenPattern.lastIndex = start;
  let depth = 0;
  let token: RegExpExecArray | null;

  while ((token = tokenPattern.exec(html)) !== null) {
    const value = token[0];
    const closing = /^<\//.test(value);
    const selfClosing = /\/\s*>$/.test(value);

    if (closing) {
      depth -= 1;
      if (depth === 0) return html.slice(start, tokenPattern.lastIndex);
      if (depth < 0) break;
      continue;
    }

    depth += 1;
    if (selfClosing) depth -= 1;
  }

  throw new Error(`Unbalanced <${tagName}>#${id}`);
}
