import aliasSource from "./asset-aliases.json" with { type: "json" };

export interface RetiredMediaAssetAlias {
  componentId: number;
  fromAssetId: string;
  toAssetId: string;
}

export const retiredMediaAssetAliasRecords =
  aliasSource as readonly RetiredMediaAssetAlias[];

export const retiredMediaAssetAliases = new Map<string, string>(
  retiredMediaAssetAliasRecords.map(({ fromAssetId, toAssetId }) => [
    fromAssetId,
    toAssetId,
  ] as const),
);

export const retiredMediaAssetIds = new Set<string>(
  retiredMediaAssetAliasRecords.map(({ fromAssetId }) => fromAssetId),
);

export function canonicalMediaAssetId(assetId: string): string {
  return retiredMediaAssetAliases.get(assetId) ?? assetId;
}
