import { readFile } from "node:fs/promises";
import {
  CV_EDUCATION_COURSE_IDS,
  CV_EDUCATION_LINKS,
  parseCvContent,
} from "../../src/data/cv.ts";

const experienceArticlePattern = /<article\b([^>]*)>[\s\S]*?<\/article>/gi;
const hiddenAttributePattern = /\s+hidden(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi;
const skillSectionIds = ["hard", "tech", "soft", "tools"];

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

function transformCvSkillSection(html, sectionId, section) {
  const sectionPattern = new RegExp(
    `(<section\\b(?=[^>]*\\bclass=["'][^"']*\\b${sectionId}\\b[^"']*["'])[^>]*>)([\\s\\S]*?)(<\\/section>)`,
    "i",
  );

  return replaceExactlyOnce(
    html,
    sectionPattern,
    (_match, open, inner, close) => {
      let transformedInner = replaceElementTextByClass(
        inner,
        "h2",
        "section-title",
        section.title,
      );

      const paragraphPattern = /(<p\b[^>]*>)[\s\S]*?(<\/p>)/gi;
      const paragraphs = [...transformedInner.matchAll(paragraphPattern)];
      if (paragraphs.length !== section.rows.length) {
        throw new Error(
          `CV ${sectionId} paragraph row count must remain ${section.rows.length}; got ${paragraphs.length}`,
        );
      }

      let rowIndex = 0;
      transformedInner = transformedInner.replace(
        paragraphPattern,
        (_paragraph, paragraphOpen, paragraphClose) => {
          const row = section.rows[rowIndex];
          rowIndex += 1;
          return `${paragraphOpen}<b>${escapeHtml(row.label)}</b> ${escapeHtml(row.text)}${paragraphClose}`;
        },
      );

      return `${open}${transformedInner}${close}`;
    },
    `.${sectionId} skill section`,
  );
}

export function transformCvContacts(html, content) {
  const contacts = content.profile?.contacts;
  if (!contacts) throw new Error("CV profile.contacts content is required");

  const phoneHref = `tel:${contacts.phone.replace(/[^+\d]/g, "")}`;
  const telegramHref = `https://t.me/${contacts.telegram.slice(1)}`;
  const instagramHref = `https://www.instagram.com/${contacts.instagram.slice(1)}/`;
  const emailHref = `mailto:${contacts.email}`;

  const contactsPattern = /(<div\b(?=[^>]*\bclass=["'][^"']*\bcontacts\b[^"']*["'])[^>]*>)[\s\S]*?(<\/div>)/i;
  let transformed = replaceExactlyOnce(
    html,
    contactsPattern,
    (_match, open, close) =>
      `${open}${escapeHtml(contacts.location)}<br/><a href="${escapeHtml(phoneHref)}">${escapeHtml(contacts.phone)}</a><br/>Telegram: <a href="${escapeHtml(telegramHref)}" rel="noopener noreferrer" target="_blank">${escapeHtml(contacts.telegram)}</a><br/>Instagram: <a href="${escapeHtml(instagramHref)}" rel="noopener noreferrer" target="_blank">${escapeHtml(contacts.instagram)}</a><br/>email: <a href="${escapeHtml(emailHref)}">${escapeHtml(contacts.email)}</a>${close}`,
    ".contacts block",
  );

  const urlPattern = /(<div\b(?=[^>]*\bclass=["'][^"']*\burl\b[^"']*["'])[^>]*>)[\s\S]*?(<\/div>)/i;
  transformed = replaceExactlyOnce(
    transformed,
    urlPattern,
    (_match, open, close) =>
      `${open}<a href="${escapeHtml(contacts.website)}" rel="noopener noreferrer" target="_blank">${escapeHtml(contacts.website)}</a>${close}`,
    ".url contact block",
  );

  return transformed;
}

export function transformCvSkills(html, content) {
  const { skills } = content;
  if (!skills) throw new Error("CV skills content is required");

  let transformed = html;
  for (const sectionId of skillSectionIds) {
    const section = skills[sectionId];
    if (!section) throw new Error(`CV skills.${sectionId} content is required`);
    transformed = transformCvSkillSection(transformed, sectionId, section);
  }
  return transformed;
}

function transformEducationCourse(courseHtml, entry, expectedHref) {
  const anchorPattern = /(<b><a\b([^>]*)>)[\s\S]*?(<\/a><\/b>)([\s\S]*)/i;
  const match = courseHtml.match(anchorPattern);
  if (!match) {
    throw new Error(`CV education ${entry.id} link markup is missing`);
  }

  const [, anchorOpen, attrs, anchorClose] = match;
  const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
  if (href !== expectedHref) {
    throw new Error(
      `CV education ${entry.id} href drift: expected ${expectedHref}; got ${href ?? "missing"}`,
    );
  }

  return `${anchorOpen}${escapeHtml(entry.name)}${anchorClose}\n${entry.lines.map(escapeHtml).join("<br/>")}`;
}

export function transformCvEducation(html, content) {
  const { education } = content;
  if (!education) throw new Error("CV education content is required");

  const sectionPattern = /(<section\b(?=[^>]*\bclass=["'][^"']*\beducation\b[^"']*["'])[^>]*>)([\s\S]*?)(<\/section>)/i;
  return replaceExactlyOnce(
    html,
    sectionPattern,
    (_match, open, inner, close) => {
      const titlePattern = /(<h2\b(?=[^>]*\bclass=["'][^"']*\bcluster-title\b[^"']*["'])[^>]*>)[\s\S]*?(<\/h2>)/gi;
      const titles = [...inner.matchAll(titlePattern)];
      if (titles.length !== 2) {
        throw new Error(`CV education cluster-title count must remain 2; got ${titles.length}`);
      }

      let titleIndex = 0;
      const titleValues = [education.higherTitle, education.additionalTitle];
      let transformedInner = inner.replace(
        titlePattern,
        (_title, titleOpen, titleClose) => {
          const value = titleValues[titleIndex];
          titleIndex += 1;
          return `${titleOpen}${escapeHtml(value)}${titleClose}`;
        },
      );

      const coursePattern = /(<div\b(?=[^>]*\bclass=["'][^"']*\bcourse\b[^"']*["'])[^>]*>)([\s\S]*?)(<\/div>)/gi;
      const courses = [...transformedInner.matchAll(coursePattern)];
      const entries = [education.higher, ...education.additional];
      const ids = ["mpgu", ...CV_EDUCATION_COURSE_IDS];
      if (courses.length !== entries.length) {
        throw new Error(
          `CV education course count must remain ${entries.length}; got ${courses.length}`,
        );
      }

      let courseIndex = 0;
      transformedInner = transformedInner.replace(
        coursePattern,
        (_course, courseOpen, courseInner, courseClose) => {
          const entry = entries[courseIndex];
          const id = ids[courseIndex];
          courseIndex += 1;
          if (!entry || entry.id !== id) {
            throw new Error(`CV education course identity drift at index ${courseIndex - 1}`);
          }
          const expectedHref = CV_EDUCATION_LINKS[id];
          return `${courseOpen}${transformEducationCourse(courseInner, entry, expectedHref)}${courseClose}`;
        },
      );

      return `${open}${transformedInner}${close}`;
    },
    ".education section",
  );
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
  const withContacts = transformCvContacts(withProfile, content);
  const withSkills = transformCvSkills(withContacts, content);
  const withEducation = transformCvEducation(withSkills, content);
  return transformCvExperienceVisibility(withEducation, content, options);
}
