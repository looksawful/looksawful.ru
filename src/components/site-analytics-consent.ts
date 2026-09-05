import {
  isLocalAnalyticsHostname,
  isSiteAnalyticsOptedOut,
  mountSiteAnalytics,
  parseAnalyticsCountryResponse,
  parseYandexCounterId,
  readSessionAnalyticsCountry,
  readSitePrivacySignals,
  readStoredAnalyticsConsent,
  shouldAutoGrantAnalyticsConsent,
  storeSessionAnalyticsCountry,
  storeSiteAnalyticsConsent,
  type SiteAnalyticsConfig,
} from "./site-analytics.ts";

interface MountSiteAnalyticsConsentOptions {
  root: Document;
  target: Window;
  config: SiteAnalyticsConfig;
}

const COUNTRY_ENDPOINTS = ["/cdn-cgi/trace", "https://api.country.is/"] as const;
const COUNTRY_LOOKUP_TIMEOUT_MS = 1_500;
const noop = () => {};

function button(root: Document, label: string, value: "granted" | "denied"): HTMLButtonElement {
  const element = root.createElement("button");
  element.type = "button";
  element.className = "site-analytics-consent__button";
  element.dataset.analyticsConsent = value;
  element.textContent = label;
  return element;
}

async function fetchAnalyticsCountry(target: Window, endpoint: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = target.setTimeout(() => controller.abort(), COUNTRY_LOOKUP_TIMEOUT_MS);

  try {
    const response = await target.fetch(endpoint, {
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return parseAnalyticsCountryResponse(await response.text());
  } catch {
    return null;
  } finally {
    target.clearTimeout(timeout);
  }
}

async function resolveAnalyticsCountry(target: Window): Promise<string | null> {
  const cachedCountry = readSessionAnalyticsCountry(target);
  if (cachedCountry) return cachedCountry;

  for (const endpoint of COUNTRY_ENDPOINTS) {
    const country = await fetchAnalyticsCountry(target, endpoint);
    if (!country) continue;
    storeSessionAnalyticsCountry(target, country);
    return country;
  }

  return null;
}

export function mountSiteAnalyticsConsent({
  root,
  target,
  config,
}: MountSiteAnalyticsConsentOptions): () => void {
  if (isLocalAnalyticsHostname(target.location.hostname)) return noop;
  if (!parseYandexCounterId(config.yandexCounterId)) return noop;
  if (isSiteAnalyticsOptedOut(readSitePrivacySignals(target))) return noop;
  if (readStoredAnalyticsConsent(target) !== null) return noop;
  if (root.querySelector("[data-site-analytics-consent]")) return noop;

  const host = root.body ?? root.documentElement;
  let destroyed = false;
  let panel: HTMLElement | null = null;
  let accept: HTMLButtonElement | null = null;
  let reject: HTMLButtonElement | null = null;
  let onAccept: (() => void) | null = null;
  let onReject: (() => void) | null = null;

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    if (accept && onAccept) accept.removeEventListener("click", onAccept);
    if (reject && onReject) reject.removeEventListener("click", onReject);
    panel?.remove();
  };

  const renderConsent = (): void => {
    if (destroyed) return;
    if (readStoredAnalyticsConsent(target) !== null) return;
    if (root.querySelector("[data-site-analytics-consent]")) return;

    panel = root.createElement("aside");
    panel.className = "site-analytics-consent";
    panel.dataset.siteAnalyticsConsent = "";
    panel.setAttribute("aria-label", "Настройки cookies");

    const copy = root.createElement("p");
    copy.className = "site-analytics-consent__copy";
    copy.append("Этот сайт использует cookies. ");
    const privacy = root.createElement("a");
    privacy.className = "site-analytics-consent__privacy";
    privacy.href = "/privacy/";
    privacy.textContent = "Подробнее";
    copy.append(privacy);

    const actions = root.createElement("div");
    actions.className = "site-analytics-consent__actions";
    accept = button(root, "Принять", "granted");
    reject = button(root, "Отклонить", "denied");
    actions.append(accept, reject);
    panel.append(copy, actions);

    onAccept = (): void => {
      if (!storeSiteAnalyticsConsent(target, true)) return;
      mountSiteAnalytics({ root, target, config });
      destroy();
    };

    onReject = (): void => {
      if (!storeSiteAnalyticsConsent(target, false)) return;
      destroy();
    };

    accept.addEventListener("click", onAccept);
    reject.addEventListener("click", onReject);
    host.append(panel);
  };

  const cachedCountry = readSessionAnalyticsCountry(target);
  if (shouldAutoGrantAnalyticsConsent(cachedCountry)) return noop;
  if (cachedCountry) {
    renderConsent();
    return destroy;
  }

  void resolveAnalyticsCountry(target).then((country) => {
    if (destroyed) return;
    if (isSiteAnalyticsOptedOut(readSitePrivacySignals(target))) return;

    const explicitConsent = readStoredAnalyticsConsent(target);
    if (explicitConsent === "denied") return;
    if (explicitConsent === "granted") {
      mountSiteAnalytics({ root, target, config });
      return;
    }

    if (shouldAutoGrantAnalyticsConsent(country)) {
      mountSiteAnalytics({ root, target, config });
      return;
    }

    renderConsent();
  });

  return destroy;
}
