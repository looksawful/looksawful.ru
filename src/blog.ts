import { createCodeBlocks } from "./components/code-block.ts";
import { initBlogFilter } from "./components/blog-filter.ts";
import { initBlogVideos } from "./components/blog-video.ts";
import { mountSiteAnalytics } from "./components/site-analytics.ts";
import { initSiteNavigation } from "./components/site-navigation.ts";

if (import.meta.env.PROD) {
  mountSiteAnalytics({
    root: document,
    target: window,
    config: {
      cloudflareToken: import.meta.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
      clarityProjectId: import.meta.env.VITE_CLARITY_PROJECT_ID,
    },
  });
}

const destroys: Array<() => void> = [
  initSiteNavigation(document),
  initBlogFilter(document, window),
  initBlogVideos(document),
  createCodeBlocks(document),
];

window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;
  destroys.splice(0).reverse().forEach((destroy) => destroy());
}, { once: true });
