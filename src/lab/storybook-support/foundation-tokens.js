const CUSTOM_PROPERTY_GROUPS = {
  color: (name) => name.startsWith("--clr-"),
  typography: (name) => /^--(?:ff|fw|fs|lh|ls)-/.test(name),
  sizing: (name) => /^--(?:size-|space-|content-|page-padding)/.test(name),
  radius: (name) => /^--radius-/.test(name),
  surface: (name) => /(?:surface|background|foreground|border|shadow|clr-bg|clr-text)/.test(name),
  motion: (name) => /(?:^--motion-|^--infinite-reel-(?:speed|duration))/.test(name),
  control: (name) => /(?:control|field|button|focus|shadow)/i.test(name),
};

function safeRules(sheet) {
  try {
    return sheet.cssRules ? Array.from(sheet.cssRules) : [];
  } catch {
    return [];
  }
}

function sourceLabel(sheet) {
  if (!sheet.href) return "inline";
  try {
    const url = new URL(sheet.href, document.baseURI);
    return url.pathname.replace(/^\//, "");
  } catch {
    return sheet.href;
  }
}

function walkRules(rules, visit, context = {}) {
  for (const rule of Array.from(rules ?? [])) {
    const condition = typeof rule.conditionText === "string" ? rule.conditionText : context.condition;
    if (rule.style) visit(rule, { ...context, condition });
    if (rule.cssRules) walkRules(rule.cssRules, visit, { ...context, condition });
  }
}

export function collectCustomProperties(doc = document) {
  const records = [];
  for (const sheet of Array.from(doc.styleSheets)) {
    const source = sourceLabel(sheet);
    walkRules(safeRules(sheet), (rule, context) => {
      for (const property of Array.from(rule.style)) {
        if (!property.startsWith("--")) continue;
        const rawValue = rule.style.getPropertyValue(property).trim();
        if (!rawValue) continue;
        records.push({
          name: property,
          rawValue,
          selector: rule.selectorText || "",
          condition: context.condition || "",
          source,
        });
      }
    });
  }
  return records.sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source));
}

export function collectProductionDeclarations(doc = document) {
  const records = [];
  for (const sheet of Array.from(doc.styleSheets)) {
    const source = sourceLabel(sheet);
    walkRules(safeRules(sheet), (rule, context) => {
      for (const property of Array.from(rule.style)) {
        if (property.startsWith("--")) continue;
        const value = rule.style.getPropertyValue(property).trim();
        if (!value) continue;
        records.push({ property, value, selector: rule.selectorText || "", condition: context.condition || "", source });
      }
    });
  }
  return records;
}

export function resolveCustomProperty(name, doc = document) {
  return getComputedStyle(doc.documentElement).getPropertyValue(name).trim();
}

export function customPropertiesFor(group, doc = document) {
  const predicate = CUSTOM_PROPERTY_GROUPS[group] ?? (() => false);
  return collectCustomProperties(doc).filter(({ name }) => predicate(name));
}

export function gradientDeclarations(doc = document) {
  return collectProductionDeclarations(doc).filter(({ value }) => /(?:linear|radial|conic)-gradient\(/i.test(value));
}

export function motionDeclarations(doc = document) {
  return collectProductionDeclarations(doc).filter(({ property }) => /^(?:transition|animation)/.test(property));
}

export function reducedMotionDeclarations(doc = document) {
  return collectProductionDeclarations(doc).filter(({ condition }) => /prefers-reduced-motion\s*:\s*reduce/i.test(condition));
}
