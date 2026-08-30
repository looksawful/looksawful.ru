import { Marked } from "marked";

import { escapeHtml } from "../../utils/html.ts";

function fail(message: string): never {
  throw new Error(`[blog] Markdown ${message}`);
}

function isSafeLinkHref(href: string): boolean {
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
    return !href.startsWith("//");
  }

  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function isSafeBlogImageHref(href: string): boolean {
  const withoutQuery = href.split(/[?#]/, 1)[0] ?? href;
  return withoutQuery.startsWith("/media/blog/") && withoutQuery.toLowerCase().endsWith(".webp");
}

const blogMarkdown = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html() {
      return fail("raw HTML is not allowed");
    },
    code({ text, lang }) {
      const language = (lang ?? "").trim().split(/\s+/, 1)[0] ?? "";
      const languageClass = language ? ` class="language-${escapeHtml(language)}"` : "";
      const languageLabel = language
        ? `<span class="blog-code__language">${escapeHtml(language)}</span>`
        : '<span class="blog-code__language" aria-hidden="true"></span>';

      return `<div class="blog-code" data-code-block data-code-copy>\n<div class="blog-code__head">${languageLabel}<button class="blog-code__copy" type="button" data-code-copy-button>Копировать</button></div>\n<pre><code${languageClass} data-code-source>${escapeHtml(text)}</code></pre>\n</div>\n`;
    },
  },
  walkTokens(token) {
    if (token.type === "link" && !isSafeLinkHref(token.href)) {
      fail(`link URL is not allowed: ${token.href}`);
    }

    if (token.type === "image") {
      if (!isSafeBlogImageHref(token.href)) {
        fail(`image must reference a WebP under /media/blog/: ${token.href}`);
      }
      if (!token.text.trim()) fail("images require non-empty alt text");
    }
  },
});

export function renderBlogMarkdown(markdown: string): string {
  const html = blogMarkdown.parse(markdown, { async: false });
  if (typeof html !== "string") fail("renderer returned an unexpected async result");
  return html;
}
