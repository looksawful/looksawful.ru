const LOCAL_SCENE_MODULES = {
  jesteiUxCanvas: import.meta.glob("./masonry/assets/jestei-ux-canvas/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}", { eager: true, query: "?url", import: "default" }),
  jesteiProductCanvas: import.meta.glob(
    "./showcase-horizontal/assets/jestei-product-canvas/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiColorDiagonal: import.meta.glob(
    "./showcase-diagonal/assets/jestei-color-diagonal/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiFormDiagonal: import.meta.glob(
    "./showcase-diagonal/assets/jestei-form-diagonal/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiDepthDiagonalLoop: import.meta.glob(
    "./diagonal-loop/assets/jestei-depth-diagonal-loop/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiMotionPhotoLoop: import.meta.glob(
    "./photo-loop/assets/jestei-motion-photo-loop/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
  jesteiColorPhotoLoop: import.meta.glob(
    "./photo-loop/assets/jestei-color-photo-loop/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
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
  lyveGraphicCarousel: import.meta.glob(
    "./showcase-carousel/assets/lyve-graphic-carousel/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}",
    { eager: true, query: "?url", import: "default" },
  ),
};

const LOCAL_SCENE_DIRECTORIES = {
  jesteiUxCanvas: "src/visuals/canvas/masonry/assets/jestei-ux-canvas",
  jesteiProductCanvas: "src/visuals/canvas/showcase-horizontal/assets/jestei-product-canvas",
  jesteiColorDiagonal: "src/visuals/canvas/showcase-diagonal/assets/jestei-color-diagonal",
  jesteiFormDiagonal: "src/visuals/canvas/showcase-diagonal/assets/jestei-form-diagonal",
  jesteiDepthDiagonalLoop: "src/visuals/canvas/diagonal-loop/assets/jestei-depth-diagonal-loop",
  jesteiMotionPhotoLoop: "src/visuals/canvas/photo-loop/assets/jestei-motion-photo-loop",
  jesteiColorPhotoLoop: "src/visuals/canvas/photo-loop/assets/jestei-color-photo-loop",
  jesteiColorBeforeAfter: "src/visuals/canvas/before-after/assets/jestei-color-before-after",
  styxGraphicDiagonal: "src/visuals/canvas/showcase-diagonal/assets/styx-graphic-diagonal",
  styxBrandIdentity: "src/visuals/canvas/showcase-horizontal/assets/styx-brand-identity",
  lyveGraphicCarousel: "src/visuals/canvas/showcase-carousel/assets/lyve-graphic-carousel",
};

const SCENE_LABELS = {
  jesteiUxCanvas: "Jestei Pool / ux-ui / masonry",
  jesteiProductCanvas: "Jestei Pool / product / horizontal",
  jesteiColorDiagonal: "Jestei Pool / color / diagonal",
  jesteiFormDiagonal: "Jestei Pool / form / diagonal",
  jesteiDepthDiagonalLoop: "Jestei Pool / depth / diagonal loop",
  jesteiMotionPhotoLoop: "Jestei Pool / motion / photo loop",
  jesteiColorPhotoLoop: "Jestei Pool / color / photo loop",
  jesteiColorBeforeAfter: "Jestei Pool / color / before-after",
  styxGraphicDiagonal: "Styx Jewels / graphic / diagonal",
  styxBrandIdentity: "Styx Jewels / brand identity / horizontal",
  lyveGraphicCarousel: "Lyve Moscow / graphic / carousel",
};

const SCENE_DEFAULT_MAX_ITEMS = {
  jesteiUxCanvas: 18,
  jesteiProductCanvas: 20,
  jesteiColorDiagonal: 24,
  jesteiFormDiagonal: 18,
  jesteiDepthDiagonalLoop: 18,
  jesteiMotionPhotoLoop: 24,
  jesteiColorPhotoLoop: 136,
  jesteiColorBeforeAfter: 2,
  styxGraphicDiagonal: 36,
  styxBrandIdentity: 14,
  lyveGraphicCarousel: 8,
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
