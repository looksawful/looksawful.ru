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
  }),  "jestei-biloba-plastic": Object.freeze({
    kind: "plastic",
    color: "#C7A6FF",
    metalness: 0.05,
    roughness: 0.3,
  }),
});

const entry = (value) => Object.freeze(value);

export const logo3dCatalog = Object.freeze([
  entry({
    id: "jestei-symbol-metal",
    family: "Jestei Pool",
    variant: "symbol",
    materialId: "neutral-metal",
    modelUrl: "/media/projects/jestei/model-viewer/jestei-logo-web.glb",
    sourceType: "vector-svg",
    status: "ready",
  }),  entry({
    id: "jestei-wordmark-metal",
    family: "Jestei Pool",
    variant: "wordmark",
    materialId: "neutral-metal",
    modelUrl: "/media/logo-3d/jestei/jestei-wordmark-metal.glb",
    sourceType: "vector-svg",
  }),
  entry({
    id: "jestei-lockup-metal",
    family: "Jestei Pool",
    variant: "lockup",
    materialId: "neutral-metal",
    modelUrl: "/media/logo-3d/jestei/jestei-lockup-metal.glb",
    sourceType: "vector-svg",
  }),
  entry({ id: "jestei-wordmark-pear", family: "Jestei Pool", variant: "wordmark", colorway: "pear", materialId: "jestei-pear-plastic", modelUrl: "/media/logo-3d/jestei/jestei-wordmark-pear.glb", sourceType: "vector-svg" }),
  entry({ id: "jestei-lockup-pear", family: "Jestei Pool", variant: "lockup", colorway: "pear", materialId: "jestei-pear-plastic", modelUrl: "/media/logo-3d/jestei/jestei-lockup-pear.glb", sourceType: "vector-svg" }),
  entry({ id: "jestei-wordmark-orange", family: "Jestei Pool", variant: "wordmark", colorway: "orange", materialId: "jestei-orange-plastic", modelUrl: "/media/logo-3d/jestei/jestei-wordmark-orange.glb", sourceType: "vector-svg" }),
  entry({ id: "jestei-lockup-orange", family: "Jestei Pool", variant: "lockup", colorway: "orange", materialId: "jestei-orange-plastic", modelUrl: "/media/logo-3d/jestei/jestei-lockup-orange.glb", sourceType: "vector-svg" }),  entry({ id: "jestei-wordmark-blue", family: "Jestei Pool", variant: "wordmark", colorway: "blue", materialId: "jestei-blue-plastic", modelUrl: "/media/logo-3d/jestei/jestei-wordmark-blue.glb", sourceType: "vector-svg" }),
  entry({ id: "jestei-lockup-blue", family: "Jestei Pool", variant: "lockup", colorway: "blue", materialId: "jestei-blue-plastic", modelUrl: "/media/logo-3d/jestei/jestei-lockup-blue.glb", sourceType: "vector-svg" }),
  entry({ id: "jestei-wordmark-biloba", family: "Jestei Pool", variant: "wordmark", colorway: "biloba", materialId: "jestei-biloba-plastic", modelUrl: "/media/logo-3d/jestei/jestei-wordmark-biloba.glb", sourceType: "vector-svg" }),
  entry({ id: "jestei-lockup-biloba", family: "Jestei Pool", variant: "lockup", colorway: "biloba", materialId: "jestei-biloba-plastic", modelUrl: "/media/logo-3d/jestei/jestei-lockup-biloba.glb", sourceType: "vector-svg" }),
  entry({ id: "styx-monogram-metal", family: "Styx Jewel", variant: "monogram", materialId: "neutral-metal", modelUrl: "/media/logo-3d/styx/styx-monogram-metal.glb", sourceType: "derived-vector", provenance: "canonical raster-backed SVG; vector recovery required" }),
  entry({ id: "styx-wordmark-metal", family: "Styx Jewel", variant: "wordmark", materialId: "neutral-metal", modelUrl: "/media/logo-3d/styx/styx-wordmark-metal.glb", sourceType: "derived-vector", provenance: "canonical raster-backed SVG; vector recovery required" }),
  entry({ id: "awfulface-metal", family: "AWFUL", variant: "awfulface", materialId: "neutral-metal", modelUrl: "/media/logo-3d/awful/awfulface-metal.glb", sourceType: "inline-vector-svg", provenance: "src/site/shell/navigation.ts visible awfulface geometry" }),
  entry({ id: "sensetique-metal", family: "Sensetique", variant: "lockup", materialId: "neutral-metal", modelUrl: "/media/logo-3d/sensetique/sensetique-metal.glb", sourceType: "vector-svg" }),
  entry({ id: "lyve-moscow-metal", family: "LYVÈ Moscow", variant: "primary", materialId: "neutral-metal", modelUrl: "/media/logo-3d/lyve/lyve-moscow-metal.glb", sourceType: "vector-svg" }),
]);

export const getLogo3dEntry = (id) =>
  logo3dCatalog.find((item) => item.id === id) ?? null;
