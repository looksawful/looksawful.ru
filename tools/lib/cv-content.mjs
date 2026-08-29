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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function replaceExactlyOnce(html, pattern, replacer, label) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matches = [...html.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${label} in CV HTML; got ${matches.length}`);
  }
  return html.replace(pattern, replacer);
}

function replaceElementTextByClass(html, tagName, className, value) {
  const pattern = new RegExp(
    `(<${tagName}\\b(?=[^>]*\\bclass=["'][^"']*\\b${className}\\b[^"']*["'])[^>]*>)[\\s\\S]*?(<\\/${tagName}>)`,
    "i",
  );
  return replaceExactlyOnce(
    html,
    pattern,
    (_match, open, close) => `${open}${escapeHtml(value)}${close}`,
    `.${className}`,
  );
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

export function transformCvProfile(html, content) {
  const { profile } = content;
  if (!profile) throw new Error("CV profile content is required");

  let transformed = replaceElementTextByClass(html, "h1", "name", profile.name);
  transformed = replaceElementTextByClass(transformed, "div", "role", profile.role);

  const aboutPattern = /(<section\b(?=[^>]*\bclass=["'][^"']*\babout\b[^"']*["'])[^>]*>[\s\S]*?<div\b(?=[^>]*\bclass=["'][^"']*\burl\b[^"']*["'])[^>]*>[\s\S]*?<\/div>)<p>[\s\S]*?<\/p><p>[\s\S]*?<\/p>(<div\b(?=[^>]*\bclass=["'][^"']*\bsales\b[^"']*["'])[^>]*>)/i;
  transformed = replaceExactlyOnce(
    transformed,
    aboutPattern,
    (_match, prefix, salesOpen) => `${prefix}<p>${escapeHtml(profile.aboutPrimary)}</p><p>${escapeHtml(profile.aboutSecondary)}</p>${salesOpen}`,
    "about copy block",
  );

  const salesPattern = /(<div\b(?=[^>]*\bclass=["'][^"']*\bsales\b[^"']*["'])[^>]*>)[\s\S]*?(<\/div>)/i;
  const salesHtml = profile.principles
    .map(({ title, text }) => `<p><b>${escapeHtml(title)}</b> ${escapeHtml(text)}</p>`)
    .join("");
  transformed = replaceExactlyOnce(
    transformed,
    salesPattern,
    (_match, open, close) => `${open}${salesHtml}${close}`,
    ".sales block",
  );

  const languagesPattern = /(<section\b(?=[^>]*\bclass=["'][^"']*\blangs\b[^"']*["'])[^>]*>[\s\S]*?<p>)[\s\S]*?(<\/p>[\s\S]*?<\/section>)/i;
  const languagesHtml = profile.languages
    .map(({ name, level }) => `<b>${escapeHtml(name)}</b> — ${escapeHtml(level)}`)
    .join("<br/>");
  transformed = replaceExactlyOnce(
    transformed,
    languagesPattern,
    (_match, prefix, suffix) => `${prefix}${languagesHtml}${suffix}`,
    ".langs copy block",
  );

  return transformed;
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

export function transformCvContent(html, content, options = {}) {
  const withProfile = transformCvProfile(html, content);
  return transformCvExperienceVisibility(withProfile, content, options);
}
