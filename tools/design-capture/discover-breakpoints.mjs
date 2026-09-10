const ROOT_FONT_SIZE_PX = 16;

function toPixels(value, unit) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (unit === "px") return Math.round(number);
  if (unit === "rem" || unit === "em") return Math.round(number * ROOT_FONT_SIZE_PX);
  return null;
}

function responsiveBlocks(cssText) {
  const blocks = [];
  const pattern = /@(media|container)\b/gi;
  let match;

  while ((match = pattern.exec(cssText))) {
    const headerStart = match.index;
    const open = cssText.indexOf("{", pattern.lastIndex);
    if (open < 0) break;

    let depth = 1;
    let index = open + 1;
    while (index < cssText.length && depth > 0) {
      if (cssText[index] === "{") depth += 1;
      else if (cssText[index] === "}") depth -= 1;
      index += 1;
    }
    if (depth !== 0) break;

    blocks.push({
      kind: match[1].toLowerCase(),
      header: cssText.slice(headerStart, open),
      body: cssText.slice(open + 1, index - 1),
    });
    pattern.lastIndex = index;
  }

  return blocks;
}

function widthsFromHeader(header) {
  const values = [];
  const patterns = [
    /(?:min|max)-width\s*:\s*([0-9]*\.?[0-9]+)\s*(px|rem|em)/gi,
    /width\s*(?:<=|>=|<|>)\s*([0-9]*\.?[0-9]+)\s*(px|rem|em)/gi,
    /([0-9]*\.?[0-9]+)\s*(px|rem|em)\s*(?:<=|>=|<|>)\s*width/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(header))) {
      const pixels = toPixels(match[1], match[2].toLowerCase());
      if (pixels !== null) values.push(pixels);
    }
  }
  return values;
}

export function extractResponsiveBreakpoints(cssText, { selectorHints = [] } = {}) {
  const breakpoints = [];
  for (const block of responsiveBlocks(cssText)) {
    if (selectorHints.length > 0 && !selectorHints.some((hint) => block.body.includes(hint))) {
      continue;
    }
    breakpoints.push(...widthsFromHeader(block.header));
  }
  return [...new Set(breakpoints)].sort((a, b) => a - b);
}

export function extractMediaBreakpoints(cssText) {
  return extractResponsiveBreakpoints(cssText);
}

export function mergeBreakpoints(...groups) {
  return [...new Set(groups.flat().filter((value) => Number.isFinite(value)).map((value) => Math.round(value)))]
    .sort((a, b) => a - b);
}

export function breakpointSides(px) {
  const rounded = Math.round(px);
  return [rounded - 1, rounded + 1];
}
