const VAR_RE = /var\(\s*(--[\w-]+)(?:\s*,[^)]*)?\s*\)/g;

export function classifyToken(name, value) {
  const n = name.toLowerCase();
  const v = String(value).trim().toLowerCase();
  if (/gradient\(/.test(v) || n.includes("gradient")) return "gradient";
  if (/^--clr-|color|colour/.test(n) || /^(#|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\(|color\()/.test(v)) return "color";
  if (/font-family|font-face/.test(n) || /(^|-)font$/.test(n)) return "font-family";
  if (/font-size|type-size|text-size/.test(n)) return "font-size";
  if (/font-weight|weight/.test(n)) return "font-weight";
  if (/line-height|leading/.test(n)) return "line-height";
  if (/letter-spacing|tracking/.test(n)) return "letter-spacing";
  if (/radius|rounded/.test(n)) return "radius";
  if (/shadow/.test(n)) return "shadow";
  if (/opacity|alpha/.test(n)) return "opacity";
  if (/z-index|^--z-/.test(n)) return "z-index";
  if (/duration|delay/.test(n) || /^-?\d*\.?\d+m?s$/.test(v)) return "duration";
  if (/ease|easing/.test(n) || /cubic-bezier\(|steps\(/.test(v)) return "easing";
  if (/border|stroke|outline/.test(n)) return "border";
  if (/space|gap|gutter|padding|margin|width|height|size|container|grid/.test(n)) return "spacing";
  return "other";
}

export function resolveTokenValue(value, values, stack = new Set()) {
  const original = String(value).trim();
  let unresolved = false;
  const resolved = original.replace(VAR_RE, (match, name) => {
    if (!values.has(name) || stack.has(name)) {
      unresolved = true;
      return match;
    }
    const nextStack = new Set(stack);
    nextStack.add(name);
    const next = resolveTokenValue(values.get(name), values, nextStack);
    if (/var\(/.test(next)) unresolved = true;
    return next;
  });
  return unresolved ? original : resolved;
}

export function tokenAliases(value) {
  return [...String(value).matchAll(VAR_RE)].map((match) => match[1]);
}