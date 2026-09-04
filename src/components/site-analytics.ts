export type SiteAnalyticsProvider = "cloudflare" | "yandex";

export type SiteAnalyticsGoal =
  | "project_open"
  | "cv_open"
  | "contact_email"
  | "contact_telegram"
  | "download";

export interface SiteAnalyticsConfig {
  cloudflareToken?: string | null;
  yandexCounterId?: string | number | null;
}

export interface SitePrivacySignals {
  globalPrivacyControl?: boolean;
  doNotTrack?: string | null;
}

export interface SiteAnalyticsScript {
  provider: SiteAnalyticsProvider;
  src: string;
  type: string;
  async: boolean;
  attributes: Readonly<Record<string, string>>;
}

export interface SiteAnalyticsGoalEvent {
  goal: SiteAnalyticsGoal;
  params: Readonly<Record<string, string>>;
}

interface MountSiteAnalyticsOptions {
  root: Document;
  target: Window;
  config: SiteAnalyticsConfig;
}

interface MountSiteAnalyticsGoalTrackingOptions {
  root: Document;
  target: Window;
  config: SiteAnalyticsConfig;
}

type YandexMetrikaFunction = ((...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

type AnalyticsWindow = Window & {
  ym?: YandexMetrikaFunction;
};

type PrivacyNavigator = Navigator & {
  globalPrivacyControl?: boolean;
};

const CLOUDFLARE_BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";
const YANDEX_METRIKA_SRC = "https://mc.yandex.ru/metrika/tag.js";
const ANALYTICS_CONSENT_KEY = "looksawful:analytics-consent";
const noop = () => {};

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseYandexCounterId(value: string | number | null | undefined): number | null {
  const normalized = typeof value === "number" ? String(value) : clean(value);
  if (!/^[1-9]\d*$/.test(normalized)) return null;

  const counterId = Number(normalized);
  return Number.isSafeInteger(counterId) ? counterId : null;
}

function optedOut(privacy: SitePrivacySignals): boolean {
  return privacy.globalPrivacyControl === true || privacy.doNotTrack === "1";
}

export function isLocalAnalyticsHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return normalized === "localhost"
    || normalized === "127.0.0.1"
    || normalized === "::1"
    || normalized.endsWith(".localhost");
}

export function selectSiteAnalyticsProviders(
  config: SiteAnalyticsConfig,
  privacy: SitePrivacySignals,
  analyticsConsent: boolean,
): SiteAnalyticsProvider[] {
  if (optedOut(privacy)) return [];

  const providers: SiteAnalyticsProvider[] = [];
  if (clean(config.cloudflareToken)) providers.push("cloudflare");
  if (parseYandexCounterId(config.yandexCounterId) && analyticsConsent) providers.push("yandex");
  return providers;
}

export function buildSiteAnalyticsScripts(
  config: SiteAnalyticsConfig,
  privacy: SitePrivacySignals,
  analyticsConsent: boolean,
): SiteAnalyticsScript[] {
  const providers = selectSiteAnalyticsProviders(config, privacy, analyticsConsent);
  const scripts: SiteAnalyticsScript[] = [];

  for (const provider of providers) {
    if (provider === "cloudflare") {
      const token = clean(config.cloudflareToken);
      scripts.push({
        provider,
        src: CLOUDFLARE_BEACON_SRC,
        type: "module",
        async: false,
        attributes: Object.freeze({
          "data-cf-beacon": JSON.stringify({ token }),
        }),
      });
      continue;
    }

    scripts.push({
      provider,
      src: YANDEX_METRIKA_SRC,
      type: "text/javascript",
      async: true,
      attributes: Object.freeze({}),
    });
  }

  return scripts;
}

export function readSitePrivacySignals(target: Window): SitePrivacySignals {
  const navigator = target.navigator as PrivacyNavigator;
  return {
    globalPrivacyControl: navigator.globalPrivacyControl === true,
    doNotTrack: navigator.doNotTrack ?? null,
  };
}

export function hasStoredAnalyticsConsent(target: Window): boolean {
  try {
    return target.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function storeSiteAnalyticsConsent(target: Window, granted: boolean): boolean {
  try {
    target.localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? "granted" : "denied");
    return true;
  } catch {
    return false;
  }
}

function ensureYandexQueue(target: Window): YandexMetrikaFunction {
  const analyticsTarget = target as AnalyticsWindow;
  if (analyticsTarget.ym) return analyticsTarget.ym;

  const ym = ((...args: unknown[]) => {
    ym.a ??= [];
    ym.a.push(args);
  }) as YandexMetrikaFunction;
  ym.a = [];
  ym.l = Date.now();
  analyticsTarget.ym = ym;
  return ym;
}

function queueYandexInit(target: Window, counterId: number): void {
  const ym = ensureYandexQueue(target);
  ym(counterId, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

export function mountSiteAnalytics({ root, target, config }: MountSiteAnalyticsOptions): SiteAnalyticsProvider[] {
  if (isLocalAnalyticsHostname(target.location.hostname)) return [];

  const privacy = readSitePrivacySignals(target);
  const analyticsConsent = hasStoredAnalyticsConsent(target);
  const scripts = buildSiteAnalyticsScripts(config, privacy, analyticsConsent);
  const host = root.head ?? root.documentElement;
  const mounted: SiteAnalyticsProvider[] = [];

  for (const descriptor of scripts) {
    if (root.querySelector(`script[data-site-analytics="${descriptor.provider}"]`)) continue;

    if (descriptor.provider === "yandex") {
      const counterId = parseYandexCounterId(config.yandexCounterId);
      if (!counterId) continue;
      queueYandexInit(target, counterId);
    }

    const script = root.createElement("script");
    script.src = descriptor.src;
    script.type = descriptor.type;
    script.async = descriptor.async;
    script.setAttribute("data-site-analytics", descriptor.provider);
    for (const [name, value] of Object.entries(descriptor.attributes)) {
      script.setAttribute(name, value);
    }
    host.append(script);
    mounted.push(descriptor.provider);
  }

  return mounted;
}

function analyticsPagePath(target: Window): string {
  return target.location.pathname || "/";
}

function urlForAnchor(anchor: HTMLAnchorElement, target: Window): URL | null {
  const href = anchor.getAttribute("href")?.trim();
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return null;

  try {
    return new URL(href, target.location.href);
  } catch {
    return null;
  }
}

export function classifySiteAnalyticsGoal(
  anchor: HTMLAnchorElement,
  target: Window,
): SiteAnalyticsGoalEvent | null {
  const href = anchor.getAttribute("href")?.trim() ?? "";
  const page = analyticsPagePath(target);

  if (href.toLowerCase().startsWith("mailto:")) {
    return { goal: "contact_email", params: Object.freeze({ page }) };
  }

  const url = urlForAnchor(anchor, target);
  if (!url) return null;

  if (anchor.classList.contains("project-card")) {
    return {
      goal: "project_open",
      params: Object.freeze({ page, target: url.pathname }),
    };
  }

  if (anchor.hasAttribute("download")) {
    return {
      goal: "download",
      params: Object.freeze({ page, target: url.pathname }),
    };
  }

  if (url.hostname === "t.me" || url.hostname === "telegram.me") {
    return { goal: "contact_telegram", params: Object.freeze({ page }) };
  }

  if (url.origin === target.location.origin && url.pathname.replace(/\/+$/, "/") === "/cv/") {
    return { goal: "cv_open", params: Object.freeze({ page }) };
  }

  return null;
}

export function reachSiteAnalyticsGoal(
  target: Window,
  config: SiteAnalyticsConfig,
  event: SiteAnalyticsGoalEvent,
): boolean {
  if (isLocalAnalyticsHostname(target.location.hostname)) return false;
  if (optedOut(readSitePrivacySignals(target))) return false;
  if (!hasStoredAnalyticsConsent(target)) return false;

  const counterId = parseYandexCounterId(config.yandexCounterId);
  if (!counterId) return false;

  const ym = ensureYandexQueue(target);
  ym(counterId, "reachGoal", event.goal, {
    action_info: event.params,
  });
  return true;
}

export function mountSiteAnalyticsGoalTracking({
  root,
  target,
  config,
}: MountSiteAnalyticsGoalTrackingOptions): () => void {
  if (isLocalAnalyticsHostname(target.location.hostname)) return noop;
  if (!parseYandexCounterId(config.yandexCounterId)) return noop;

  const onClick = (event: MouseEvent): void => {
    const source = event.target;
    if (!(source instanceof Element)) return;

    const anchor = source.closest<HTMLAnchorElement>("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const analyticsEvent = classifySiteAnalyticsGoal(anchor, target);
    if (!analyticsEvent) return;
    reachSiteAnalyticsGoal(target, config, analyticsEvent);
  };

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
