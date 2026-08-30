const BLOG_MEDIA_PREFIX = "/media/blog/";
const BLOG_MEDIA_ORIGIN = "https://blog-media.invalid";

export function isBlogMediaWebpPath(value: string): boolean {
  if (!value.startsWith(BLOG_MEDIA_PREFIX) || value.includes("?") || value.includes("#")) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(value, BLOG_MEDIA_ORIGIN);
  } catch {
    return false;
  }

  if (url.origin !== BLOG_MEDIA_ORIGIN || url.pathname !== value) return false;
  if (!url.pathname.startsWith(BLOG_MEDIA_PREFIX) || !url.pathname.toLowerCase().endsWith(".webp")) {
    return false;
  }

  const relativePath = value.slice(BLOG_MEDIA_PREFIX.length);
  if (!relativePath) return false;

  for (const segment of relativePath.split("/")) {
    if (!segment) return false;

    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return false;
    }

    if (
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("/") ||
      decoded.includes("\\") ||
      decoded.includes("\0")
    ) {
      return false;
    }
  }

  return true;
}
