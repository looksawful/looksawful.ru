import { SITE_ORIGIN } from "../config.ts";
import type { SitePageDefinition } from "../pages/types.ts";
import { escapeHtml } from "../../utils/html.ts";

export interface PageMetadataExtras {
  ogType?: "website" | "article";
  image?: string;
  publishedAt?: string;
  modifiedAt?: string;
  structuredData?: Readonly<Record<string, unknown>>;
}

export interface PageMetadataOptions extends PageMetadataExtras {
  page: SitePageDefinition;
  title: string;
  description: string;
}

export function getPageCanonical(page: SitePageDefinition): string {
  return new URL(page.path, `${SITE_ORIGIN}/`).href;
}

function renderStructuredData(value: Readonly<Record<string, unknown>>): string {
  const json = JSON.stringify(value).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

export function renderPageMetadata({
  page,
  title,
  description,
  ogType = "website",
  image,
  publishedAt,
  modifiedAt,
  structuredData,
}: PageMetadataOptions): string {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const robots = page.discovery.indexable
    ? "index,follow,max-image-preview:large"
    : "noindex,nofollow";

  const lines = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDescription}">`,
    `<meta name="robots" content="${robots}">`,
  ];

  if (page.discovery.indexable) {
    const canonical = escapeHtml(getPageCanonical(page));
    lines.push(
      `<link rel="canonical" href="${canonical}">`,
      `<meta property="og:type" content="${ogType}">`,
      `<meta property="og:title" content="${safeTitle}">`,
      `<meta property="og:description" content="${safeDescription}">`,
      `<meta property="og:url" content="${canonical}">`,
      `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
    );
    if (image) lines.push(`<meta property="og:image" content="${escapeHtml(new URL(image, `${SITE_ORIGIN}/`).href)}">`);
    if (ogType === "article" && publishedAt) lines.push(`<meta property="article:published_time" content="${escapeHtml(publishedAt)}">`);
    if (ogType === "article" && modifiedAt) lines.push(`<meta property="article:modified_time" content="${escapeHtml(modifiedAt)}">`);
    if (structuredData) lines.push(renderStructuredData(structuredData));
  }

  return lines.join("\n");
}
