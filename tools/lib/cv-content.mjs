import { readFile } from "node:fs/promises";
import { parseCvContent } from "../../src/data/cv.ts";

const experienceArticlePattern = /<article\b([^>]*)>[\s\S]*?<\/article>/gi;
const hiddenAttributePattern = /\s+hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi;

function getClasses(attrs) {
  const classMatch = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i);
  return classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
}

function getExperienceId(classes) {
  const stableClasses = classes.filter(
    (className) => className.startsWith("experience-card--"),
  );

  if (stableClasses.length !== 1) {
    throw new Error(
      `CV experience card must have exactly one stable experience-card--* class; got ${stableClasses.length}`,
    );
  }

  return stableClasses[0].slice("experience-card--".length);
}

function setArticleHidden(article, hidden) {
  return article.replace(/^<article\b([^>]*)>/i, (_opening, attrs) => {
    const normalizedAttrs = attrs.replace(hiddenAttributePattern, "");
    return `<article${normalizedAttrs}${hidden ? " hidden" : ""}>`;
  });
}

export async function readCvContent(contentPath) {
  const raw = await readFile(contentPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid CV content JSON at ${contentPath}: ${message}`);
  }
  return parseCvContent(parsed);
}

export function transformCvExperienceVisibility(html, content, options = {}) {
  const { removeHidden = false } = options;
  const visibility = new Map(
    content.experience.map(({ id, visible }) => [id, visible]),
  );
  const seen = new Set();
  let hidden = 0;
  let removed = 0;

  const transformed = html.replace(experienceArticlePattern, (article, attrs) => {
    const classes = getClasses(attrs);
    if (!classes.includes("experience-card")) return article;

    const id = getExperienceId(classes);
    if (!visibility.has(id)) {
      throw new Error(`Unexpected CV experience card in HTML: ${id}`);
    }
    if (seen.has(id)) {
      throw new Error(`Duplicate CV experience card in HTML: ${id}`);
    }
    seen.add(id);

    const visible = visibility.get(id);
    if (visible) return setArticleHidden(article, false);

    if (removeHidden) {
      removed += 1;
      return "";
    }

    hidden += 1;
    return setArticleHidden(article, true);
  });

  for (const id of visibility.keys()) {
    if (!seen.has(id)) throw new Error(`Missing CV experience card in HTML: ${id}`);
  }

  return Object.freeze({ html: transformed, hidden, removed });
}
