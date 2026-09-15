export interface PortfolioPetFeatureFlagInput {
  isDev: boolean;
  envValue?: string;
  previewRequested?: boolean;
}

const enabledValues = new Set(["1", "true", "on", "yes"]);

export function resolvePortfolioPetEnabled({
  isDev,
  envValue,
  previewRequested = false,
}: PortfolioPetFeatureFlagInput): boolean {
  if (isDev || previewRequested) return true;
  if (!envValue) return false;
  return enabledValues.has(envValue.trim().toLowerCase());
}
