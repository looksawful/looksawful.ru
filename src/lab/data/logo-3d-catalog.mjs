export const logo3dMaterials = Object.freeze({
  "neutral-metal": Object.freeze({
    kind: "metal",
    color: "#5B5854",
    baseColorLinear: [0.105, 0.098, 0.091],
    metalness: 1,
    roughness: 0.13,
  }),
  "jestei-pear-plastic": Object.freeze({
    kind: "plastic",
    color: "#B7E44A",
    metalness: 0.05,
    roughness: 0.3,
  }),
  "jestei-orange-plastic": Object.freeze({
    kind: "plastic",
    color: "#FF5A1F",
    metalness: 0.05,
    roughness: 0.3,
  }),
  "jestei-blue-plastic": Object.freeze({
    kind: "plastic",
    color: "#2357FF",
    metalness: 0.05,
    roughness: 0.3,
  }),
  "jestei-biloba-plastic": Object.freeze({
    kind: "plastic",
    color: "#C7A6FF",
    metalness: 0.05,
    roughness: 0.3,
  }),
});
const entry = (value) => Object.freeze(value);
const JESTEI_SYMBOL = "/media/projects/jestei/logo/source/logo-secondary.svg";
const JESTEI_WORDMARK = "/media/projects/jestei/logo/source/30-svg-text-only-text-logo-dark.svg";
const JESTEI_LOCKUP = "/media/projects/jestei/logo/source/21-svg-full-text-icon-full-split.svg";

export const logo3dCatalog = Object.freeze([
  entry({ id: "jestei-symbol-metal", family: "Jestei Pool", variant: "symbol", materialId: "neutral-metal", sourceUrl: JESTEI_SYMBOL, modelUrl: "/media/projects/jestei/model-viewer/jestei-logo-web.glb", sourceType: "vector-svg", status: "ready" }),
  entry({ id: "jestei-wordmark-metal", family: "Jestei Pool", variant: "wordmark", materialId: "neutral-metal", sourceUrl: JESTEI_WORDMARK, modelUrl: "/media/logo-3d/jestei/jestei-wordmark-metal.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-lockup-metal", family: "Jestei Pool", variant: "lockup", materialId: "neutral-metal", sourceUrl: JESTEI_LOCKUP, modelUrl: "/media/logo-3d/jestei/jestei-lockup-metal.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-symbol-pear", family: "Jestei Pool", variant: "symbol", colorway: "pear", materialId: "jestei-pear-plastic", sourceUrl: JESTEI_SYMBOL, modelUrl: "/media/logo-3d/jestei/jestei-symbol-pear.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-wordmark-pear", family: "Jestei Pool", variant: "wordmark", colorway: "pear", materialId: "jestei-pear-plastic", sourceUrl: JESTEI_WORDMARK, modelUrl: "/media/logo-3d/jestei/jestei-wordmark-pear.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-lockup-pear", family: "Jestei Pool", variant: "lockup", colorway: "pear", materialId: "jestei-pear-plastic", sourceUrl: JESTEI_LOCKUP, modelUrl: "/media/logo-3d/jestei/jestei-lockup-pear.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-symbol-orange", family: "Jestei Pool", variant: "symbol", colorway: "orange", materialId: "jestei-orange-plastic", sourceUrl: JESTEI_SYMBOL, modelUrl: "/media/logo-3d/jestei/jestei-symbol-orange.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-wordmark-orange", family: "Jestei Pool", variant: "wordmark", colorway: "orange", materialId: "jestei-orange-plastic", sourceUrl: JESTEI_WORDMARK, modelUrl: "/media/logo-3d/jestei/jestei-wordmark-orange.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-lockup-orange", family: "Jestei Pool", variant: "lockup", colorway: "orange", materialId: "jestei-orange-plastic", sourceUrl: JESTEI_LOCKUP, modelUrl: "/media/logo-3d/jestei/jestei-lockup-orange.glb", sourceType: "vector-svg", status: "planned" }),  entry({ id: "jestei-symbol-blue", family: "Jestei Pool", variant: "symbol", colorway: "blue", materialId: "jestei-blue-plastic", sourceUrl: JESTEI_SYMBOL, modelUrl: "/media/logo-3d/jestei/jestei-symbol-blue.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-wordmark-blue", family: "Jestei Pool", variant: "wordmark", colorway: "blue", materialId: "jestei-blue-plastic", sourceUrl: JESTEI_WORDMARK, modelUrl: "/media/logo-3d/jestei/jestei-wordmark-blue.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-lockup-blue", family: "Jestei Pool", variant: "lockup", colorway: "blue", materialId: "jestei-blue-plastic", sourceUrl: JESTEI_LOCKUP, modelUrl: "/media/logo-3d/jestei/jestei-lockup-blue.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-symbol-biloba", family: "Jestei Pool", variant: "symbol", colorway: "biloba", materialId: "jestei-biloba-plastic", sourceUrl: JESTEI_SYMBOL, modelUrl: "/media/logo-3d/jestei/jestei-symbol-biloba.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-wordmark-biloba", family: "Jestei Pool", variant: "wordmark", colorway: "biloba", materialId: "jestei-biloba-plastic", sourceUrl: JESTEI_WORDMARK, modelUrl: "/media/logo-3d/jestei/jestei-wordmark-biloba.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "jestei-lockup-biloba", family: "Jestei Pool", variant: "lockup", colorway: "biloba", materialId: "jestei-biloba-plastic", sourceUrl: JESTEI_LOCKUP, modelUrl: "/media/logo-3d/jestei/jestei-lockup-biloba.glb", sourceType: "vector-svg", status: "planned" }),

  entry({ id: "styx-monogram-metal", family: "Styx Jewel", variant: "monogram", materialId: "neutral-metal", sourceUrl: "/media/projects/styx/logo/source/02-styx-logo.svg", modelUrl: "/media/logo-3d/styx/styx-monogram-metal.glb", sourceType: "raster-wrapper", status: "source-recovery-required", provenance: "Current SVG contains embedded raster image; recover original vector or trace with review." }),
  entry({ id: "styx-wordmark-metal", family: "Styx Jewel", variant: "wordmark", materialId: "neutral-metal", sourceUrl: "/media/projects/styx/logo/source/02-styx-logo.svg", modelUrl: "/media/logo-3d/styx/styx-wordmark-metal.glb", sourceType: "raster-wrapper", status: "source-recovery-required", provenance: "Current SVG contains embedded raster image; recover original vector or trace with review." }),
  entry({ id: "awfulface-metal", family: "AWFUL", variant: "awfulface", materialId: "neutral-metal", sourceUrl: "/favicon.svg", modelUrl: "/media/logo-3d/awful/awfulface-metal.glb", sourceType: "vector-svg", status: "planned", provenance: "Canonical static Awfulface geometry; no hidden navigation morph targets." }),
  entry({ id: "sensetique-metal", family: "Sensetique", variant: "lockup", materialId: "neutral-metal", sourceUrl: "/media/projects/sensetique/logo/sensetique_logo_svg/02_lockups/112_lockups_r18_c01.svg", modelUrl: "/media/logo-3d/sensetique/sensetique-metal.glb", sourceType: "vector-svg", status: "planned" }),
  entry({ id: "lyve-moscow-metal", family: "LYVÈ Moscow", variant: "primary", materialId: "neutral-metal", sourceUrl: "/media/projects/lyve/logo/source/01-lyve-logo.svg", modelUrl: "/media/logo-3d/lyve/lyve-moscow-metal.glb", sourceType: "vector-svg", status: "planned" }),  entry({ id: "line-metal", family: "LI-NE Agency", variant: "primary", materialId: "neutral-metal", sourceUrl: "/media/projects/line/logo/source/01-line-logo.svg", modelUrl: "/media/logo-3d/line/line-metal.glb", sourceType: "raster-wrapper", status: "source-recovery-required", provenance: "Current SVG contains embedded raster image; recover original vector or trace with review." }),
  entry({ id: "progress-tradition-metal", family: "Progress Tradition", variant: "primary", materialId: "neutral-metal", sourceUrl: "/media/projects/progresstrad/logo/source/01-progresstrad-logo.svg", modelUrl: "/media/logo-3d/progress-tradition/progress-tradition-metal.glb", sourceType: "raster-wrapper", status: "source-recovery-required", provenance: "Current SVG contains embedded raster image; recover original vector or trace with review." }),
  entry({ id: "s-and-s-metal", family: "S&S", variant: "primary", materialId: "neutral-metal", modelUrl: "/media/logo-3d/s-and-s/s-and-s-metal.glb", sourceType: "missing", status: "source-missing", sourceRasterUrl: "/media/clients/logo-wall/client-logo-23.webp" }),
  entry({ id: "illumihand-metal", family: "illumihand", variant: "primary", materialId: "neutral-metal", modelUrl: "/media/logo-3d/illumihand/illumihand-metal.glb", sourceType: "missing", status: "source-missing" }),
]);

export const getLogo3dEntry = (id) =>
  logo3dCatalog.find((item) => item.id === id) ?? null;

export const getGeneratableLogo3dEntries = () =>
  logo3dCatalog.filter((item) => item.status === "planned" && item.sourceType === "vector-svg");