// Storybook reuses public site media without copying the media catalog.
const ORIGIN = "https://www.looksawful.ru";
const PUBLIC_PATH = /(["'(\s])\/(media|vendor|components)\//g;

export function usePublishedAssetUrls(markup) {
  return String(markup).replace(PUBLIC_PATH, "$1" + ORIGIN + "/$2/");
}

export function usePublishedAssetUrlsInNode(root) {
  for (const element of [root, ...root.querySelectorAll("*")]) {
    if (element.nodeType !== 1) continue;
    for (const attr of element.getAttributeNames()) {
      const value = element.getAttribute(attr);
      if (!value || !/\/(?:media|vendor|components)\//.test(value)) continue;
      const rewritten = usePublishedAssetUrls('"' + value + '"').slice(1, -1);
      if (rewritten !== value) element.setAttribute(attr, rewritten);
    }
    if (element.tagName === "SCRIPT" && element.type === "application/json") {
      element.textContent = usePublishedAssetUrls(element.textContent || "");
    }
  }
  return root;
}
