const jesteiInterfaceMasonryModules = import.meta.glob(
  "../../assets/cv/animations/jestei-interface-masonry/**/*.{webp,png,jpg,jpeg,avif,mp4}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const jesteiProductHorizontalModules = import.meta.glob(
  "../../assets/cv/animations/jestei-product-horizontal/**/*.{webp,png,jpg,jpeg,avif,mp4}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const jesteiGraphicArcModules = import.meta.glob(
  "../../assets/cv/animations/jestei-graphic-arc/**/*.{webp,png,jpg,jpeg,avif,mp4}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const styxGraphicDiagonalModules = import.meta.glob(
  "../../assets/cv/animations/styx-graphic-diagonal/**/*.{webp,png,jpg,jpeg,avif,mp4}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

const lyveGraphicCarouselModules = import.meta.glob(
  "../../assets/cv/animations/lyve-graphic-carousel/**/*.{webp,png,jpg,jpeg,avif,mp4}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export const CV_ANIMATION_SCENES = {
  jesteiInterfaceMasonry: {
    label: "Jestei Pool / ux-ui / masonry",
    directory: "src/assets/cv/animations/jestei-interface-masonry",
    modules: jesteiInterfaceMasonryModules,
  },
  jesteiProductHorizontal: {
    label: "Jestei Pool / product / horizontal",
    directory: "src/assets/cv/animations/jestei-product-horizontal",
    modules: jesteiProductHorizontalModules,
  },
  jesteiGraphicArc: {
    label: "Jestei Pool / graphic / arc",
    directory: "src/assets/cv/animations/jestei-graphic-arc",
    modules: jesteiGraphicArcModules,
  },
  styxGraphicDiagonal: {
    label: "Styx Jewels / graphic / diagonal",
    directory: "src/assets/cv/animations/styx-graphic-diagonal",
    modules: styxGraphicDiagonalModules,
  },
  lyveGraphicCarousel: {
    label: "Lyve Moscow / graphic / carousel",
    directory: "src/assets/cv/animations/lyve-graphic-carousel",
    modules: lyveGraphicCarouselModules,
  },
};

const getModuleUrl = (moduleValue) =>
  typeof moduleValue === "string" ? moduleValue : moduleValue?.default || "";

const getFilename = (path) => path.split("/").pop() || "";
const getStem = (filename) => filename.replace(/\.[^.]+$/, "");

const getAssetOrder = (path) => {
  const stem = getStem(getFilename(path));
  const numberMatch = stem.match(/^\d+/);
  return numberMatch ? Number(numberMatch[0]) : Number.MAX_SAFE_INTEGER;
};

export const getReadableTitle = (stem) => stem.replace(/[-_]+/g, " ");

export const createAnimationItems = (modules, { getTitle } = {}) =>
  Object.entries(modules)
    .map(([path, moduleValue]) => {
      const filename = getFilename(path);
      const stem = getStem(filename);

      return {
        imageUrl: getModuleUrl(moduleValue),
        sourcePath: path,
        filename,
        stem,
        order: getAssetOrder(path),
        title: getTitle ? getTitle(stem) : getReadableTitle(stem),
      };
    })
    .filter((item) => item.imageUrl)
    .sort((a, b) => a.order - b.order || a.filename.localeCompare(b.filename, "en", { numeric: true }))
    .map((item, index) => ({
      ...item,
      sourceIndex: index,
    }));

export const getAnimationSceneSummaries = () =>
  Object.entries(CV_ANIMATION_SCENES).map(([id, scene]) => ({
    id,
    label: scene.label,
    directory: scene.directory,
    fileCount: Object.keys(scene.modules).length,
  }));
