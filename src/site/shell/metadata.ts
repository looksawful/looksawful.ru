import { SITE_ORIGIN } from "../config.ts";
import type { SitePageDefinition } from "../pages/types.ts";
import { escapeHtml } from "../../utils/html.ts";

export interface PageMetadataOptions {
  page: SitePageDefinition;
  title: string;
  description: string;
}

export function getPageCanonical(page: SitePageDefinition): string {
  return new URL(page.path, `${SITE_ORIGIN}/`).href;
}

export function renderPageMetadata({
  page,
  title,
  description,
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
      `<meta property="og:title" content="${safeTitle}">`,
      `<meta property="og:description" content="${safeDescription}">`,
      `<meta property="og:url" content="${canonical}">`,
    );
  }

  return lines.join("\n");
}
