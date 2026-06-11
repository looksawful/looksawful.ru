const animationModules = import.meta.glob("../../assets/*/animations/**/*.{webp,png,jpg,jpeg,avif,gif,mp4,webm}", {
  eager: true,
  query: "?url",
  import: "default",
});


const SCENE_LABELS = {
  jesteiUxCanvas: "Jestei Pool / ux-ui / masonry",
  jesteiProductCanvas: "Jestei Pool / product / horizontal",
  jesteiGraphicArc: "Jestei Pool / graphic / arc",
  jesteiLandingArc: "Jestei Pool / landing / arc",
  jesteiLandingSpiral: "Jestei Pool / landing / spiral",
  jesteiLandingMasonry: "Jestei Pool / landing / masonry",
  styxGraphicDiagonal: "Styx Jewels / graphic / diagonal",
  styxBrandIdentity: "Styx Jewels / brand identity / horizontal",
  styxPhotoProduction: "Styx Jewels / photo production / arc",
  styxScanographyLoops: "Styx Jewels / scanography loops",
  lyveGraphicCarousel: "Lyve Moscow / graphic / carousel",
  lyveInterfaceStrip: "Lyve Moscow / interface / horizontal",
  jesteiLandingScreenshots: "Jestei Pool / landing / screenshots",
};

const SCENE_DEFAULT_MAX_ITEMS = {
  jesteiUxCanvas: 18,
  jesteiProductCanvas: 20,
  jesteiGraphicArc: 12,
  jesteiLandingArc: 12,
  jesteiLandingSpiral: 5,
  jesteiLandingMasonry: 18,
  styxGraphicDiagonal: 12,
  styxBrandIdentity: 14,
  styxPhotoProduction: 12,
  styxScanographyLoops: 6,
  lyveGraphicCarousel: 8,
  lyveInterfaceStrip: 8,
  jesteiLandingScreenshots: 4,
};

const getModuleUrl = (moduleValue) =>
  typeof moduleValue === "string" ? moduleValue : moduleValue?.default || "";

const getFilename = (path) => path.split("/").pop() || "";
const getStem = (filename) => filename.replace(/\.[^.]+$/, "");

const folderToSceneId = (folder) =>
  folder.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());

const getFolderFromPath = (path) => {
  const normalized = path.replaceAll("\\", "/");
  const match = normalized.match(/\/assets\/[^/]+\/animations\/([^/]+)\//);

  return match?.[1] || "";
};

const getAssetOrder = (path) => {
  const stem = getStem(getFilename(path));
  const numberMatch = stem.match(/^\d+/);
  return numberMatch ? Number(numberMatch[0]) : Number.MAX_SAFE_INTEGER;
};

export const getReadableTitle = (stem) => stem.replace(/[-_]+/g, " ");

const buildAnimationScenes = () => {
  const scenes = {};
  const moduleEntries = Object.entries(animationModules);

  moduleEntries.forEach(([path, moduleValue]) => {
    const folder = getFolderFromPath(path);

    if (!folder) return;

    const id = folderToSceneId(folder);

    if (!scenes[id]) {
      scenes[id] = {
        id,
        label: SCENE_LABELS[id] || getReadableTitle(folder),
        directory: "src/assets/*/animations/" + folder,
        folder,
defaultMaxItems: SCENE_DEFAULT_MAX_ITEMS[id] || 36,
        modules: {},
      };
    }

    scenes[id].modules[path] = moduleValue;
  });

  return scenes;
};

export const CV_ANIMATION_SCENES = buildAnimationScenes();

export const getAnimationScene = (sceneId, fallbackSceneId) =>
  CV_ANIMATION_SCENES[sceneId] ||
  CV_ANIMATION_SCENES[fallbackSceneId] ||
  Object.values(CV_ANIMATION_SCENES)[0];

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
  Object.entries(CV_ANIMATION_SCENES).map(([id, scene]) => ({
    id,
    label: scene.label,
    directory: scene.directory,
    fileCount: Object.keys(scene.modules).length,
    defaultMaxItems: scene.defaultMaxItems,
  }));

