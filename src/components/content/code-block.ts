import type { CodeBlockData } from "../../content/contracts/content-block.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderCodeBlock(data: CodeBlockData): string {
  const languageAttribute = data.language
    ? ` data-code-language="${data.language}"`
    : "";
  const title = data.title
    ? `<h3 class="code-block__title">${escapeHtml(data.title)}</h3>`
    : "";
  const description = data.description
    ? `<p class="code-block__meta">${escapeHtml(data.description)}</p>`
    : "";

  return [
    `<section class="code-block" data-code-block data-code-copy${languageAttribute}>`,
    '<header class="code-block__head cluster">',
    title,
    '<button aria-label="Скопировать код" class="code-block__copy" data-code-copy-button type="button">Copy</button>',
    "</header>",
    `<pre><code data-code-source>${escapeHtml(data.code)}</code></pre>`,
    description,
    "</section>",
  ].filter(Boolean).join("\n");
}
