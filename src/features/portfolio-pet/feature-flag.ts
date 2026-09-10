export interface PortfolioPetFeatureFlagInput {
  isDev: boolean;
  envValue?: string;
}

const enabledValues = new Set(["1", "true", "on", "yes"]);

export function resolvePortfolioPetEnabled({
  isDev,
  envValue,
}: PortfolioPetFeatureFlagInput): boolean {
  if (isDev) return true;
  if (!envValue) return false;
  return enabledValues.has(envValue.trim().toLowerCase());
}
