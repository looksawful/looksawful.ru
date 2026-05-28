const RAW_ASSET_PATTERN = /\/src\/assets\/[^"'<>)\s&]+/g;

const SECTION_ASSET_MODULES = import.meta.glob(
  [
    "../assets/cv/logos/*.{svg,png}",
    "../assets/jesteipool-animations/J-02.png",
    "../assets/brand/fin/Logo-spec1.png",
    "../assets/brand/filter/Record Pool.png",
    "../assets/projects/jestei/palette/jestei-palette-grid.png",
    "../assets/projects/jestei/scanography/*.{jpg,jpeg,png,webp}",
    "../assets/projects/styx/*.{jpg,jpeg,png,webp,mp4}",
  ],
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const toSourceAssetPath = (modulePath) => modulePath.replace("../assets", "/src/assets");

const assetUrlBySourcePath = new Map(
  Object.entries(SECTION_ASSET_MODULES).flatMap(([modulePath, assetUrl]) => {
    const sourcePath = toSourceAssetPath(modulePath);

    return [
      [sourcePath, assetUrl],
      [encodeURI(sourcePath), assetUrl],
    ];
  }),
);

export function resolveSectionAssetUrls(markup) {
  return markup.replace(RAW_ASSET_PATTERN, (sourcePath) => {
    const assetUrl = assetUrlBySourcePath.get(sourcePath) ?? assetUrlBySourcePath.get(decodeURI(sourcePath));

    if (!assetUrl) {
      throw new Error(`[sections] unresolved raw asset URL: ${sourcePath}`);
    }

    return assetUrl;
  });
}
