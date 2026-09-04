import {
  isLocalAnalyticsHostname,
  isSiteAnalyticsOptedOut,
  mountSiteAnalytics,
  parseYandexCounterId,
  readSitePrivacySignals,
  readStoredAnalyticsConsent,
  storeSiteAnalyticsConsent,
  type SiteAnalyticsConfig,
} from "./site-analytics.ts";

interface MountSiteAnalyticsConsentOptions {
  root: Document;
  target: Window;
  config: SiteAnalyticsConfig;
}

const noop = () => {};

function button(root: Document, label: string, value: "granted" | "denied"): HTMLButtonElement {
  const element = root.createElement("button");
  element.type = "button";
  element.className = "site-analytics-consent__button";
  element.dataset.analyticsConsent = value;
  element.textContent = label;
  return element;
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
  const panel = root.createElement("aside");
  panel.className = "site-analytics-consent";
  panel.dataset.siteAnalyticsConsent = "";
  panel.setAttribute("aria-label", "Настройки аналитики");

  const copy = root.createElement("p");
  copy.className = "site-analytics-consent__copy";
  copy.textContent = "Использую Яндекс Метрику, чтобы понимать, какие страницы и проекты смотрят. Метрика загружается только с вашего согласия.";

  const actions = root.createElement("div");
  actions.className = "site-analytics-consent__actions";
  const accept = button(root, "Разрешить", "granted");
  const reject = button(root, "Не разрешать", "denied");
  actions.append(accept, reject);
  panel.append(copy, actions);

  let destroyed = false;

  const onAccept = (): void => {
    if (!storeSiteAnalyticsConsent(target, true)) return;
    mountSiteAnalytics({ root, target, config });
    destroy();
  };

  const onReject = (): void => {
    if (!storeSiteAnalyticsConsent(target, false)) return;
    destroy();
  };

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    accept.removeEventListener("click", onAccept);
    reject.removeEventListener("click", onReject);
    panel.remove();
  };

  accept.addEventListener("click", onAccept);
  reject.addEventListener("click", onReject);
  host.append(panel);

  return destroy;
}
