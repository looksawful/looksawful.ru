import { injectStaticSiteAnalytics } from "../lib/static-site-analytics.mjs";

const ANALYTICS_PROBE_HTML = "<!doctype html><html><head></head><body></body></html>";

export function hasConfiguredCvAnalytics(env = process.env) {
  const result = injectStaticSiteAnalytics(ANALYTICS_PROBE_HTML, {
    cloudflareToken: env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
    yandexCounterId: env.VITE_YANDEX_METRIKA_COUNTER_ID,
  });
  return result !== ANALYTICS_PROBE_HTML;
}
