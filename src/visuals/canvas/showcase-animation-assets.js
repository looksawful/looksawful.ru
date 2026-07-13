const LOCAL_SCENE_MODULES = {
  jesteiInterfaceMasonry: import.meta.glob(
    "../../assets/cv/animations/jestei-interface-masonry/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiProductHorizontal: import.meta.glob(
    "./showcase-horizontal/assets/jestei-product-canvas/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiPromoDiagonal: import.meta.glob(
    "./showcase-diagonal/assets/jestei-promo-diagonal/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiColorBeforeAfter: import.meta.glob(
    "./before-after/assets/jestei-color-before-after/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  styxGraphicDiagonal: import.meta.glob(
    "./showcase-diagonal/assets/styx-graphic-diagonal/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  styxBrandIdentity: import.meta.glob(
    "./showcase-horizontal/assets/styx-brand-identity/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  styxPhotoProduction: import.meta.glob(
    "./showcase-diagonal/assets/styx-graphic-diagonal/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
};

const LOCAL_SCENE_DIRECTORIES = {
  jesteiInterfaceMasonry: "src/assets/cv/animations/jestei-interface-masonry",
  jesteiProductHorizontal: "src/visuals/canvas/showcase-horizontal/assets/jestei-product-canvas",
  jesteiPromoDiagonal: "src/visuals/canvas/showcase-diagonal/assets/jestei-promo-diagonal",
  jesteiColorBeforeAfter: "src/visuals/canvas/before-after/assets/jestei-color-before-after",
  styxGraphicDiagonal: "src/visuals/canvas/showcase-diagonal/assets/styx-graphic-diagonal",
  styxBrandIdentity: "src/visuals/canvas/showcase-horizontal/assets/styx-brand-identity",
  styxPhotoProduction: "src/visuals/canvas/showcase-diagonal/assets/styx-graphic-diagonal",
};

const SCENE_LABELS = {
  jesteiInterfaceMasonry: "Jestei Pool / ux-ui / masonry archive",
  jesteiProductHorizontal: "Jestei Pool / product / horizontal archive",
  jesteiPromoDiagonal: "Jestei Pool / promo organisms / diagonal",
  jesteiColorBeforeAfter: "Jestei Pool / color / before-after",
  styxGraphicDiagonal: "Styx Jewels / graphic / diagonal",
  styxBrandIdentity: "Styx Jewels / brand identity / horizontal",
  styxPhotoProduction: "Styx Jewels / photo production / orbit archive",
};

const SCENE_DEFAULT_MAX_ITEMS = {
  jesteiInterfaceMasonry: 36,
  jesteiProductHorizontal: 42,
  jesteiPromoDiagonal: 24,
  jesteiColorBeforeAfter: 2,
  styxGraphicDiagonal: 36,
  styxBrandIdentity: 14,
  styxPhotoProduction: 24,
};

const getModuleUrl = (moduleValue) =>
  typeof moduleValue === "string" ? moduleValue : moduleValue?.default || "";

const getFilename = (path) => path.split("/").pop() || "";
const getStem = (filename) => filename.replace(/\.[^.]+$/, "");

const sceneIdToFolder = (sceneId) =>
  sceneId.replace(/[A-Z]/g, (char) => "-" + char.toLowerCase());

const getAssetOrder = (path) => {
  const stem = getStem(getFilename(path));
  const numberMatch = stem.match(/^\d+/);
  return numberMatch ? Number(numberMatch[0]) : Number.MAX_SAFE_INTEGER;
};

export const getReadableTitle = (stem) => stem.replace(/[-_]+/g, " ");

const buildAnimationScenes = () =>
  Object.fromEntries(
    Object.entries(LOCAL_SCENE_MODULES)
      .filter(([, modules]) => Object.keys(modules).length)
      .map(([id, modules]) => [
        id,
        {
          id,
          label: SCENE_LABELS[id] || getReadableTitle(id),
          directory: LOCAL_SCENE_DIRECTORIES[id],
          folder: sceneIdToFolder(id),
          defaultMaxItems: SCENE_DEFAULT_MAX_ITEMS[id] || 36,
          modules,
        },
      ]),
  );

export const ANIMATION_SCENES = buildAnimationScenes();

export const getAnimationScene = (sceneId, fallbackSceneId) =>
  ANIMATION_SCENES[sceneId] ||
  ANIMATION_SCENES[fallbackSceneId] ||
  Object.values(ANIMATION_SCENES)[0];

export const createAnimationItems = (modules, { getTitle } = {}) =>
  Object.entries(modules || {})
    .map(([path, moduleValue]) => {
      const filename = getFilename(path);
      const stem = getStem(filename);

      return {
        imageUrl: getModuleUrl(moduleValue),
        mediaUrl: getModuleUrl(moduleValue),
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
  Object.entries(ANIMATION_SCENES).map(([id, scene]) => ({
    id,
    label: scene.label,
    directory: scene.directory,
    fileCount: Object.keys(scene.modules).length,
    defaultMaxItems: scene.defaultMaxItems,
  }));
