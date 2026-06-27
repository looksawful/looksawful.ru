import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');
const cssIndexPath = path.join(root, 'src/styles/index.css');
const structureCssPath = path.join(root, 'src/styles/modules/portfolio-structure.css');

const REQUIRED_COMMENT = 'ЭТО НЕ ОПЕЧАТКА, БУКВЫ S НЕТ';
const PROJECT_IDS = ['project-jesteipool', 'project-styx', 'project-shootings'];
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function makeBackup(files) {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const backupRoot = path.join(root, 'tools/portfolio-nesting-backups', stamp);
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(root, file);
    const out = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.copyFileSync(file, out);
  }
  return backupRoot;
}

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

function openingTagEnd(html, start) {
  let quote = null;
  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') return i + 1;
  }
  return -1;
}

function tagNameAt(html, start) {
  const m = html.slice(start).match(/^<\s*\/?\s*([a-zA-Z][\w:-]*)/);
  return m ? m[1].toLowerCase() : null;
}

function isSelfClosingTag(tagText, tagName) {
  return VOID_TAGS.has(tagName) || /\/\s*>$/.test(tagText);
}

function findMatchingClose(html, openStart) {
  const tagName = tagNameAt(html, openStart);
  if (!tagName) return -1;
  const openEnd = openingTagEnd(html, openStart);
  if (openEnd < 0) return -1;
  const firstTag = html.slice(openStart, openEnd);
  if (isSelfClosingTag(firstTag, tagName)) return openEnd;

  const tagRe = /<\s*(\/?)\s*([a-zA-Z][\w:-]*)(?:\s[^<>]*)?>/g;
  tagRe.lastIndex = openEnd;
  let depth = 1;
  let match;
  while ((match = tagRe.exec(html))) {
    const isClose = match[1] === '/';
    const name = match[2].toLowerCase();
    if (name !== tagName) continue;
    const tagText = match[0];
    if (!isClose && !isSelfClosingTag(tagText, name)) depth += 1;
    if (isClose) depth -= 1;
    if (depth === 0) return tagRe.lastIndex;
  }
  return -1;
}

function addClassToTag(tag, ...classes) {
  const clean = [...new Set(classes.filter(Boolean))];
  if (!clean.length) return tag;
  const classMatch = tag.match(/\sclass=(['"])(.*?)\1/s);
  if (!classMatch) {
    return tag.replace(/>$/, ` class="${clean.join(' ')}">`);
  }
  const existing = classMatch[2].split(/\s+/).filter(Boolean);
  const merged = [...new Set([...existing, ...clean])].join(' ');
  return tag.replace(classMatch[0], ` class=${classMatch[1]}${merged}${classMatch[1]}`);
}

function removeClassFromTag(tag, ...classes) {
  const remove = new Set(classes.filter(Boolean));
  const classMatch = tag.match(/\sclass=(['"])(.*?)\1/s);
  if (!classMatch) return tag;
  const kept = classMatch[2].split(/\s+/).filter(Boolean).filter((name) => !remove.has(name));
  return tag.replace(classMatch[0], kept.length ? ` class=${classMatch[1]}${kept.join(' ')}${classMatch[1]}` : '');
}

function hasClass(fragment, className) {
  const open = fragment.match(/^\s*<[^>]+>/s)?.[0] || '';
  const m = open.match(/\sclass=(['"])(.*?)\1/s);
  if (!m) return false;
  return m[2].split(/\s+/).includes(className);
}

function hasAnyClass(fragment, classNames) {
  return classNames.some((name) => hasClass(fragment, name));
}

function replaceOpeningTag(fragment, transform) {
  const m = fragment.match(/^\s*<[^>]+>/s);
  if (!m) return fragment;
  const before = fragment.slice(0, m.index || 0);
  const open = m[0].trimStart();
  const leading = m[0].slice(0, m[0].length - open.length);
  return before + leading + transform(open) + fragment.slice((m.index || 0) + m[0].length);
}

function replaceClosingTag(fragment, oldTag, newTag) {
  const close = new RegExp(`</\\s*${oldTag}\\s*>\\s*$`, 'i');
  return fragment.replace(close, `</${newTag}>`);
}

function getOpeningTag(fragment) {
  return fragment.match(/^\s*<[^>]+>/s)?.[0] || '';
}

function getTagName(fragment) {
  return tagNameAt(fragment, fragment.search(/</));
}

function parseDirectNodes(inner) {
  const nodes = [];
  let pos = 0;
  while (pos < inner.length) {
    const next = inner.indexOf('<', pos);
    if (next < 0) {
      if (pos < inner.length) nodes.push({ type: 'text', html: inner.slice(pos) });
      break;
    }
    if (next > pos) nodes.push({ type: 'text', html: inner.slice(pos, next) });

    if (inner.startsWith('<!--', next)) {
      const end = inner.indexOf('-->', next + 4);
      const close = end < 0 ? inner.length : end + 3;
      nodes.push({ type: 'comment', html: inner.slice(next, close) });
      pos = close;
      continue;
    }

    if (/^<\s*\//.test(inner.slice(next, next + 4))) {
      nodes.push({ type: 'text', html: inner.slice(next) });
      break;
    }

    const tagName = tagNameAt(inner, next);
    if (!tagName) {
      nodes.push({ type: 'text', html: inner[next] });
      pos = next + 1;
      continue;
    }
    const end = findMatchingClose(inner, next);
    if (end < 0) {
      nodes.push({ type: 'text', html: inner.slice(next) });
      break;
    }
    nodes.push({ type: 'element', tagName, html: inner.slice(next, end) });
    pos = end;
  }
  return nodes;
}

function splitElement(fragment) {
  const openStart = fragment.search(/</);
  const openEnd = openingTagEnd(fragment, openStart);
  const tagName = tagNameAt(fragment, openStart);
  if (!tagName || openEnd < 0) return null;
  const open = fragment.slice(0, openEnd);
  const closeMatch = fragment.match(new RegExp(`</\\s*${tagName}\\s*>\\s*$`, 'i'));
  if (!closeMatch) return { tagName, open, inner: fragment.slice(openEnd), close: '' };
  const closeStart = fragment.length - closeMatch[0].length;
  return { tagName, open, inner: fragment.slice(openEnd, closeStart), close: closeMatch[0] };
}

function hasMeaningfulContent(html) {
  return html.replace(/<!--.*?-->/gs, '').trim().length > 0;
}

function isProject(node) {
  return node.type === 'element' && /\bid=(['"])project-(jesteipool|styx|shootings)\1/.test(getOpeningTag(node.html));
}

function isChapter(node) {
  const open = getOpeningTag(node.html);
  return node.type === 'element' && /\b(?:jestei-chapter-section|case-chapter-section|case-section-clean)\b/.test(open);
}

function isProjectHeader(node) {
  return node.type === 'element' && (hasClass(node.html, 'project__header') || (node.tagName === 'header' && /title--display/.test(node.html)));
}

function isProjectIntro(node) {
  return node.type === 'element' && hasClass(node.html, 'project-skill-cloud');
}

function isChapterHeader(node) {
  return node.type === 'element' && hasAnyClass(node.html, ['jestei-chapter-hero', 'case-chapter-hero', 'case-chapter__header']);
}

function normalizeProjectHeader(headerHtml, introHtmls) {
  let out = headerHtml;
  if (hasClass(out, 'project__header')) {
    out = replaceOpeningTag(out, (tag) => addClassToTag(tag, 'case__header'));
    if (introHtmls.length) {
      out = out.replace(/<\/\s*section\s*>\s*$/i, `\n${introHtmls.join('\n')}\n</section>`);
    }
    return out;
  }

  // Some projects used a bare display header instead of the shared project header.
  const wrapped = [out, ...introHtmls].join('\n');
  return `<section class="project__header case__header">\n${wrapped}\n</section>`;
}

function normalizeChapter(chapterHtml) {
  const element = splitElement(chapterHtml);
  if (!element) return chapterHtml;
  const open = addClassToTag(element.open, 'case-chapter');
  const nodes = parseDirectNodes(element.inner);
  const headerIndex = nodes.findIndex(isChapterHeader);
  if (headerIndex < 0) return open + element.inner + element.close;

  const beforeHeader = nodes.slice(0, headerIndex).map((node) => node.html).join('');
  let headerHtml = nodes[headerIndex].html;
  headerHtml = replaceOpeningTag(headerHtml, (tag) => addClassToTag(tag, 'case-chapter__header'));

  const afterHeaderNodes = nodes.slice(headerIndex + 1);
  const existingBody = afterHeaderNodes.find((node) => node.type === 'element' && hasClass(node.html, 'case-chapter__body'));
  let bodyHtml;
  if (existingBody && afterHeaderNodes.filter((node) => hasMeaningfulContent(node.html)).length === 1) {
    bodyHtml = existingBody.html;
  } else {
    const bodyInner = afterHeaderNodes.map((node) => node.html).join('').trim();
    bodyHtml = bodyInner ? `\n<div class="case-chapter__body">\n${bodyInner}\n</div>` : '';
  }

  return `${open}${beforeHeader}${headerHtml}${bodyHtml}${element.close}`;
}

function normalizeProject(projectHtml) {
  const element = splitElement(projectHtml);
  if (!element) return projectHtml;
  const open = addClassToTag(element.open, 'case');
  const nodes = parseDirectNodes(element.inner);
  const headerIndex = nodes.findIndex(isProjectHeader);
  const firstChapterIndex = nodes.findIndex(isChapter);
  if (headerIndex < 0 || firstChapterIndex < 0) return open + element.inner + element.close;

  const beforeHeader = nodes.slice(0, headerIndex).map((node) => node.html).join('');
  const between = nodes.slice(headerIndex + 1, firstChapterIndex);
  const introNodes = between.filter(isProjectIntro);
  const strayBetween = between.filter((node) => !isProjectIntro(node));
  const headerHtml = normalizeProjectHeader(nodes[headerIndex].html, introNodes.map((node) => node.html));

  const normalizedRest = nodes.slice(firstChapterIndex).map((node) => {
    if (isChapter(node)) return normalizeChapter(node.html);
    return node.html;
  }).join('');

  const strayHtml = strayBetween.map((node) => node.html).join('');
  return `${open}${beforeHeader}${headerHtml}${strayHtml}${normalizedRest}${element.close}`;
}

function normalizeProjects(html) {
  let out = html;
  let changed = 0;
  for (const id of PROJECT_IDS) {
    const marker = new RegExp(`<article\\b[^>]*\\bid=(['"])${id}\\1[^>]*>`, 'i');
    const match = marker.exec(out);
    if (!match) continue;
    const start = match.index;
    const end = findMatchingClose(out, start);
    if (end < 0) continue;
    const original = out.slice(start, end);
    const normalized = normalizeProject(original);
    if (normalized !== original) {
      out = out.slice(0, start) + normalized + out.slice(end);
      changed += 1;
    }
  }
  return { html: out, changed };
}

function ensureCssImport(css) {
  const importLine = '@import "./modules/portfolio-structure.css";';
  if (css.includes(importLine) || css.includes("@import './modules/portfolio-structure.css';")) return css;
  const galleryLine = '@import "./modules/portfolio-gallery.css";';
  const contentLine = '@import "./modules/portfolio-content-sections.css";';
  if (css.includes(contentLine)) return css.replace(contentLine, `${contentLine}\n${importLine}`);
  if (css.includes(galleryLine)) return css.replace(galleryLine, `${galleryLine}\n${importLine}`);
  const imports = [...css.matchAll(/^@import\s+[^;]+;\s*$/gm)];
  if (imports.length) {
    const last = imports[imports.length - 1];
    const insertAt = (last.index || 0) + last[0].length;
    return css.slice(0, insertAt) + `\n${importLine}` + css.slice(insertAt);
  }
  return `${importLine}\n${css}`;
}

function validate(htmlBefore, htmlAfter) {
  const checks = [
    ['img', /<img\b/g],
    ['video', /<video\b/g],
    ['canvas', /<canvas\b/g],
    ['src assets', /src="\/assets\//g],
    ['href assets', /href="\/assets\//g],
  ];
  for (const [label, pattern] of checks) {
    const before = count(htmlBefore, pattern);
    const after = count(htmlAfter, pattern);
    if (before !== after) throw new Error(`${label} count changed: ${before} -> ${after}`);
  }
  if (!htmlAfter.includes(REQUIRED_COMMENT)) throw new Error('mailto safety comment was lost');
}

const css = `#showcase .case {
  display: grid;
  gap: var(--gap-lg);
  min-inline-size: 0;
}

#showcase .case__header,
#showcase .project__header {
  min-inline-size: 0;
}

#showcase .case-chapter {
  display: grid;
  gap: var(--gap-lg);
  min-inline-size: 0;
}

#showcase .case-chapter__header {
  min-inline-size: 0;
}

#showcase .case-chapter__body {
  display: grid;
  gap: var(--gap-lg);
  min-inline-size: 0;
}

#showcase .case-chapter__body > :where(.case-chapter-panel, .project-chapter, .block, .content-section, .text-sections, .media-group) {
  min-inline-size: 0;
}

#showcase .case__header > .project-skill-cloud {
  margin-block-start: var(--gap);
}

@media (max-width: 48rem) {
  #showcase .case,
  #showcase .case-chapter,
  #showcase .case-chapter__body {
    gap: var(--gap);
  }
}
`;

if (!fs.existsSync(htmlPath)) throw new Error(`index.html not found: ${htmlPath}`);
const htmlBefore = read(htmlPath);
const backup = makeBackup([htmlPath, cssIndexPath, structureCssPath]);
const { html: htmlAfter, changed } = normalizeProjects(htmlBefore);
validate(htmlBefore, htmlAfter);
write(htmlPath, htmlAfter);
write(structureCssPath, css);
if (fs.existsSync(cssIndexPath)) {
  write(cssIndexPath, ensureCssImport(read(cssIndexPath)));
}

const summary = {
  backup,
  projectsNormalized: changed,
  caseCount: count(htmlAfter, /class="[^"]*\bcase\b/g),
  chapterCount: count(htmlAfter, /class="[^"]*\bcase-chapter\b/g),
  chapterHeaderCount: count(htmlAfter, /class="[^"]*\bcase-chapter__header\b/g),
  chapterBodyCount: count(htmlAfter, /class="[^"]*\bcase-chapter__body\b/g),
};
console.log(JSON.stringify(summary, null, 2));
