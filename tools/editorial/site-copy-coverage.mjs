export function normalizeVisibleCopy(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function keyOf({ route, locale, text }) {
  return `${route}\u0000${locale}\u0000${normalizeVisibleCopy(text)}`;
}

export function findUnindexedVisibleCopy({ indexed, rendered }) {
  const indexedKeys = new Set(
    indexed
      .filter(({ text }) => normalizeVisibleCopy(text))
      .map(keyOf),
  );

  return rendered.filter((entry) => {
    if (!normalizeVisibleCopy(entry.text)) return false;
    return !indexedKeys.has(keyOf(entry));
  });
}
