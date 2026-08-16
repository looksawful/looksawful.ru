import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

const gunzipAsync = promisify(gunzip);
const PROJECT_SELECTOR = "cv-item__project";
const CONTENT_MARKER =
  '<div class="cv-item__content wrapper" data-sensetique-content-root=""></div>';
const STYLE_MARKER = "data-sensetique-case-styles";
const CASE_DATA_ROOT = "src/components/sensetique-case/data";
const CONTENT_PARTS = [
  `${CASE_DATA_ROOT}/content-01.b64part`,
  `${CASE_DATA_ROOT}/content-02.b64part`,
  `${CASE_DATA_ROOT}/content-03.b64part`,
  `${CASE_DATA_ROOT}/content-04.b64part`,
  `${CASE_DATA_ROOT}/content-05.b64part`,
];
const STYLE_PARTS = [
  `${CASE_DATA_ROOT}/style-01.b64part`,
  `${CASE_DATA_ROOT}/style-02.b64part`,
  `${CASE_DATA_ROOT}/style-03.b64part`,
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function projectPattern(project) {
  return new RegExp(
    `<span[^>]*class=["'][^"']*${PROJECT_SELECTOR}[^"']*["'][^>]*>\\s*${escapeRegExp(
      project,
    )}\\s*</span>`,
    "i",
  );
}

export function findTopLevelProjectArticle(html, project) {
  const match = projectPattern(project).exec(html);
  if (!match) return null;

  const start = html.lastIndexOf("<article", match.index);
  if (start < 0) return null;

  const tokenPattern = /<\/?article\b[^>]*>/gi;
  tokenPattern.lastIndex = start;
  let depth = 0;
  let token;

  while ((token = tokenPattern.exec(html))) {
    const closing = /^<\/article/i.test(token[0]);
    depth += closing ? -1 : 1;
    if (depth === 0) {
      return {
        start,
        end: tokenPattern.lastIndex,
        html: html.slice(start, tokenPattern.lastIndex),
      };
    }
  }

  return null;
}

export function replaceSensetiqueScene(html, replacementArticle) {
  const current = findTopLevelProjectArticle(html, "Sensetique");
  const withoutCurrent = current
    ? html.slice(0, current.start) + html.slice(current.end)
    : html;
  const styx = findTopLevelProjectArticle(withoutCurrent, "Styx Jewels");

  if (!styx) return withoutCurrent;

  return (
    withoutCurrent.slice(0, styx.end) +
    `\n${replacementArticle}\n` +
    withoutCurrent.slice(styx.end)
  );
}

export function injectSensetiqueStyles(html, css) {
  if (html.includes(STYLE_MARKER)) return html;
  return html.replace(
    /<\/head>/i,
    `<style ${STYLE_MARKER}>\n${css}\n</style>\n</head>`,
  );
}

async function readBase64GunzipText(root, paths) {
  const parts = await Promise.all(
    paths.map((path) => readFile(resolve(root, path), "utf8")),
  );
  const compressed = Buffer.from(parts.join(""), "base64");
  return (await gunzipAsync(compressed)).toString("utf8");
}

export function createSensetiqueIndexPlugin({ root = process.cwd() } = {}) {
  const shellPath = resolve(
    root,
    "src/components/sensetique-case/sensetique-case.html",
  );

  let payloadPromise = null;

  const loadPayload = () => {
    payloadPromise ??= Promise.all([
      readFile(shellPath, "utf8"),
      readBase64GunzipText(root, CONTENT_PARTS),
      readBase64GunzipText(root, STYLE_PARTS),
    ]).then(([shell, content, css]) => {
      if (!shell.includes(CONTENT_MARKER)) {
        throw new Error("Sensetique shell is missing its content marker.");
      }

      return {
        article: shell.replace(
          CONTENT_MARKER,
          `<div class="cv-item__content wrapper" data-sensetique-content-root="">${content}</div>`,
        ),
        css,
      };
    });

    return payloadPromise;
  };

  return {
    name: "looksawful-sensetique-index",
    enforce: "pre",

    async transformIndexHtml(html) {
      if (
        !html.includes("data-cv-accordion-list") ||
        !projectPattern("Styx Jewels").test(html)
      ) {
        return html;
      }

      const { article, css } = await loadPayload();
      return injectSensetiqueStyles(
        replaceSensetiqueScene(html, article),
        css,
      );
    },
  };
}
