export const retiredMediaAssetAliases = {
  "jestei-logo-source-34-logo-jestei-pool-3": "jestei-logo-source-logo-jestei-pool",
  "sands-04-source-05-2x3": "sands-02-source-02-2x3",
  "sensetique-12-source-11-427x640": "sensetique-11-source-72-427x640",
  "evasha-08-source-02-4x5": "evasha-06-source-03-4x5",
  "behance-hypression-007": "hypression-14-source-01-5x4",
  "styx-05-source-12-4x5": "styx-07-source-01-4x5",
  "styx-05-source-17-4x5": "styx-07-source-02-4x5",
  "portfolio-portfolio-extra-07-1216x1400": "behance-photography-and-digital-art-for-obladaet-006",
  "portfolio-portfolio-extra-08-1x1": "behance-hypression-001",
  "portfolio-portfolio-extra-09-2x3": "sensetique-09-source-04-2x3",
  "portfolio-portfolio-extra-06-2x3": "sensetique-09-source-03-2x3",
  "behance-hypression-004": "hypression-17-source-02-121x175",
  "obladaet-02-source-04-4x5": "behance-photography-and-digital-art-for-obladaet-004",
  "obladaet-04-source-01-4x5": "behance-obladaet-content-covers-008",
  "obladaet-04-source-02-4x5": "behance-obladaet-content-covers-007",
  "hypression-16-source-02-2x3": "behance-hypression-003",
  "styx-07-source-04-4x5": "styx-05-source-06-4x5",
  "hypression-16-source-01-479x671": "behance-hypression-005",
  "styx-05-source-16-4x5": "styx-01-source-03-4x5",
  "styx-05-source-14-4x5": "styx-03-source-01-4x5",
  "styx-05-source-09-4x5": "styx-03-source-03-4x5",
  "jestei-logo-source-13-png-icon-only-icon-only-orange": "jestei-logo-source-logo-secondary",
  "behance-offmi-cover": "behance-offmi-002",
  "styx-05-source-15-4x5": "styx-03-source-02-4x5",
} as const;

export type RetiredMediaAssetId = keyof typeof retiredMediaAssetAliases;

export const retiredMediaAssetIds = new Set<string>(
  Object.keys(retiredMediaAssetAliases),
);

export function canonicalMediaAssetId(assetId: string): string {
  return retiredMediaAssetAliases[assetId as RetiredMediaAssetId] ?? assetId;
}
