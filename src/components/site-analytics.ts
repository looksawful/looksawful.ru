export type SiteAnalyticsProvider = "cloudflare" | "clarity";

export interface SiteAnalyticsConfig {
  cloudflareToken?: string | null;
  clarityProjectId?: string | null;
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

interface MountSiteAnalyticsOptions {
  root: Document;
  target: Window;
  config: SiteAnalyticsConfig;
}

type ClarityFunction = ((...args: unknown[]) => void) & {
  q?: unknown[][];
};

type AnalyticsWindow = Window & {
  clarity?: ClarityFunction;
};

type PrivacyNavigator = Navigator & {
  globalPrivacyControl?: boolean;
};

const CLOUDFLARE_BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";
const CLARITY_SCRIPT_BASE = "https://www.clarity.ms/tag/";
const CLARITY_CONSENT_KEY = "looksawful:analytics-consent";

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function optedOut(privacy: SitePrivacySignals): boolean {
  return privacy.globalPrivacyControl === true || privacy.doNotTrack === "1";
}

export function selectSiteAnalyticsProviders(
  config: SiteAnalyticsConfig,
  privacy: SitePrivacySignals,
  clarityConsent: boolean,
): SiteAnalyticsProvider[] {
  if (optedOut(privacy)) return [];

  const providers: SiteAnalyticsProvider[] = [];
  if (clean(config.cloudflareToken)) providers.push("cloudflare");
  if (clean(config.clarityProjectId) && clarityConsent) providers.push("clarity");
  return providers;
}

export function buildSiteAnalyticsScripts(
  config: SiteAnalyticsConfig,
  privacy: SitePrivacySignals,
  clarityConsent: boolean,
): SiteAnalyticsScript[] {
  const providers = selectSiteAnalyticsProviders(config, privacy, clarityConsent);
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

    const projectId = clean(config.clarityProjectId);
    scripts.push({
      provider,
      src: `${CLARITY_SCRIPT_BASE}${encodeURIComponent(projectId)}`,
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

export function hasStoredClarityConsent(target: Window): boolean {
  try {
    return target.localStorage.getItem(CLARITY_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

function ensureClarityQueue(target: Window): ClarityFunction {
  const analyticsTarget = target as AnalyticsWindow;
  if (analyticsTarget.clarity) return analyticsTarget.clarity;

  const clarity = ((...args: unknown[]) => {
    clarity.q ??= [];
    clarity.q.push(args);
  }) as ClarityFunction;
  clarity.q = [];
  analyticsTarget.clarity = clarity;
  return clarity;
}

function queueClarityConsent(target: Window): void {
  const clarity = ensureClarityQueue(target);
  clarity("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: "granted",
  });
}

export function mountSiteAnalytics({ root, target, config }: MountSiteAnalyticsOptions): SiteAnalyticsProvider[] {
  const scripts = buildSiteAnalyticsScripts(
    config,
    readSitePrivacySignals(target),
    hasStoredClarityConsent(target),
  );
  const host = root.head ?? root.documentElement;
  const mounted: SiteAnalyticsProvider[] = [];

  for (const descriptor of scripts) {
    if (root.querySelector(`script[data-site-analytics="${descriptor.provider}"]`)) continue;
    if (descriptor.provider === "clarity") queueClarityConsent(target);

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
