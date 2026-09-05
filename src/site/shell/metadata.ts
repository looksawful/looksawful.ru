import { SITE_ORIGIN } from "../config.ts";
import type { SitePageDefinition } from "../pages/types.ts";
import { escapeHtml } from "../../utils/html.ts";

export const SITE_NAME = "looksawful";
export const SITE_OWNER_NAME = "Иван Крушинский";
export const SITE_OWNER_ROLE = "Арт-директор цифровых продуктов";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/media/hero/hero-portrait.webp`;
export const DEFAULT_SOCIAL_IMAGE_ALT = SITE_OWNER_NAME;

export interface PageMetadataOptions {
  page: SitePageDefinition;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}

export function getPageCanonical(page: SitePageDefinition): string {
  return new URL(page.path, `${SITE_ORIGIN}/`).href;
}

export function renderPageMetadata({
  page,
  title,
  description,
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = DEFAULT_SOCIAL_IMAGE_ALT,
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
    const safeImage = escapeHtml(image);
    const safeImageAlt = escapeHtml(imageAlt);

    lines.push(
      `<link rel="canonical" href="${canonical}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:locale" content="ru_RU">`,
      `<meta property="og:site_name" content="${SITE_NAME}">`,
      `<meta property="og:title" content="${safeTitle}">`,
      `<meta property="og:description" content="${safeDescription}">`,
      `<meta property="og:url" content="${canonical}">`,
      `<meta property="og:image" content="${safeImage}">`,
      `<meta property="og:image:alt" content="${safeImageAlt}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${safeTitle}">`,
      `<meta name="twitter:description" content="${safeDescription}">`,
      `<meta name="twitter:image" content="${safeImage}">`,
      `<meta name="twitter:image:alt" content="${safeImageAlt}">`,
    );
  }

  return lines.join("\n");
}

export function replacePageMetadata(
  html: string,
  options: PageMetadataOptions,
): string {
  const cleaned = html
    .replace(/\s*<title\b[^>]*>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i, "")
    .replace(/\s*<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i, "")
    .replace(/\s*<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, "")
    .replace(/\s*<meta\b(?=[^>]*\bproperty=["']og:[^"']+["'])[^>]*>/gi, "")
    .replace(/\s*<meta\b(?=[^>]*\bname=["']twitter:[^"']+["'])[^>]*>/gi, "");

  if (!/<\/head>/i.test(cleaned)) {
    throw new Error("Cannot replace page metadata: missing </head>");
  }

  let output = cleaned.replace(
    /<\/head>/i,
    `${renderPageMetadata(options)}\n</head>`,
  );

  if (!/<link\b(?=[^>]*\brel=["']icon["'])[^>]*>/i.test(output)) {
    output = output.replace(
      /<\/head>/i,
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n</head>',
    );
  }

  return output;
}

export function renderHomeStructuredData(): string {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: SITE_OWNER_NAME,
        url: `${SITE_ORIGIN}/`,
      },
      {
        "@type": "Person",
        name: SITE_OWNER_NAME,
        url: `${SITE_ORIGIN}/`,
        jobTitle: SITE_OWNER_ROLE,
        image: DEFAULT_SOCIAL_IMAGE,
        sameAs: [
          "https://t.me/looksawful",
          "https://github.com/looksawful",
        ],
      },
    ],
  })}</script>`;
}
