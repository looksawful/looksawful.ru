export interface PortfolioPetFeatureFlagInput {
  isDev: boolean;
  envValue?: string;
  previewRequested?: boolean;
}

const enabledValues = new Set(["1", "true", "on", "yes"]);
const PREVIEW_HOST_SUFFIX = ".looksawful-ru-preview.pages.dev";

function isPortfolioPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(PREVIEW_HOST_SUFFIX);
}

export function resolvePortfolioPetEnabled({
  isDev,
  envValue,
  previewRequested = false,
}: PortfolioPetFeatureFlagInput): boolean {
  if (isDev || previewRequested || isPortfolioPreviewHost()) return true;
  if (!envValue) return false;
  return enabledValues.has(envValue.trim().toLowerCase());
}
