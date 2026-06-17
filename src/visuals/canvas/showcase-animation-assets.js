const animationModules = import.meta.glob(
  [
    "../../assets/*/animations/**/*.{webp,png,jpg,jpeg,avif,gif}",
    "!../../assets/jestei/animations/landing-motion-arc/**",
    "!../../assets/styx/animations/styx-scanography-loops/**",
    "!../../assets/styx/animations/styx-photo-production/**",
  ],
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);


const SCENE_LABELS = {
  jesteiUxCanvas: "Jestei Pool / ux-ui / masonry",
  jesteiProductCanvas: "Jestei Pool / product / horizontal",
  styxGraphicDiagonal: "Styx Jewels / graphic / diagonal",
  styxBrandIdentity: "Styx Jewels / brand identity / horizontal",
  styxPhotoProduction: "Styx Jewels / photo production / arc",
  styxScanographyLoops: "Styx Jewels / scanography loops",
  lyveGraphicCarousel: "Lyve Moscow / graphic / carousel",
  lyveInterfaceStrip: "Lyve Moscow / interface / horizontal",
  jesteiLogoCanvas: "Jestei Pool / logo / prepared",
  jesteiColorCanvas: "Jestei Pool / color / prepared",
  jesteiFormCanvas: "Jestei Pool / form / prepared",
  jesteiDepthCanvas: "Jestei Pool / depth / prepared",
  jesteiMotionCanvas: "Jestei Pool / motion / prepared",
  jesteiLanguageCanvas: "Jestei Pool / language / prepared",
};

const SCENE_DEFAULT_MAX_ITEMS = {
  jesteiUxCanvas: 18,
  jesteiProductCanvas: 20,
  styxGraphicDiagonal: 12,
  styxBrandIdentity: 14,
  styxPhotoProduction: 24,
  styxScanographyLoops: 6,
  lyveGraphicCarousel: 8,
  lyveInterfaceStrip: 8,
  jesteiLogoCanvas: 12,
  jesteiColorCanvas: 20,
  jesteiFormCanvas: 18,
  jesteiDepthCanvas: 18,
  jesteiMotionCanvas: 20,
  jesteiLanguageCanvas: 12,
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

const buildPublicModules = (basePath, filenames) =>
  Object.fromEntries(filenames.map((filename) => [basePath + "/" + filename, basePath + "/" + filename]));

const buildRepeatedPublicModules = (basePath, filenames, count) => {
  const entries = [];

  for (let index = 0; index < count; index += 1) {
    const filename = filenames[index % filenames.length];
    const slot = String(index + 1).padStart(2, "0");

    entries.push([basePath + "/" + slot + "-" + filename, basePath + "/" + filename]);
  }

  return Object.fromEntries(entries);
};

const buildPublicModuleAliases = (entries) =>
  Object.fromEntries(entries.map(({ path, url }) => [path, url]));

const buildStyxGraphicDiagonalScene = (scene = {}) => ({
  id: "styxGraphicDiagonal",
  label: SCENE_LABELS.styxGraphicDiagonal,
  directory: scene.directory || "src/assets/styx/animations/styx-graphic-diagonal + public/assets/styx/video",
  folder: scene.folder || "styx-graphic-diagonal",
  defaultMaxItems: scene.defaultMaxItems || SCENE_DEFAULT_MAX_ITEMS.styxGraphicDiagonal || 12,
  modules: {
    ...(scene.modules || {}),
    ...buildPublicModuleAliases([
      {
        path: "/assets/styx/animations/styx-graphic-diagonal/basement-16x9-Ci2Jjxc4.mp4",
        url: "/assets/styx/video/styx-scanography-loops/basement-16x9-Ci2Jjxc4.mp4",
      },
      {
        path: "/assets/styx/animations/styx-graphic-diagonal/box-animation-side-DJxRwJf8.mp4",
        url: "/assets/styx/video/styx-graphic-design/04.mp4",
      },
      {
        path: "/assets/styx/animations/styx-graphic-diagonal/box-animation-top-CdTfNhGZ.mp4",
        url: "/assets/styx/video/styx-graphic-design/04.mp4",
      },
      {
        path: "/assets/styx/animations/styx-graphic-diagonal/styx-visual-system-loop-zwCa4H7L.mp4",
        url: "/assets/styx/video/styx-scanography-loops/styx-visual-system-loop-zwCa4H7L.mp4",
      },
    ]),
  },
});

const buildPublicSceneOverrides = (sourceScenes) => ({
  styxGraphicDiagonal: buildStyxGraphicDiagonalScene(sourceScenes.styxGraphicDiagonal),
  styxPhotoProduction: {
    id: "styxPhotoProduction",
    label: SCENE_LABELS.styxPhotoProduction,
    directory: "public/assets/styx/galleries/styx-photo-production",
    folder: "styx-photo-production",
    defaultMaxItems: SCENE_DEFAULT_MAX_ITEMS.styxPhotoProduction || 24,
    modules: buildRepeatedPublicModules("/assets/styx/galleries/styx-photo-production", [
      "1.webp",
      "2.webp",
      "3.webp",
      "4.webp",
      "5.webp",
      "6.webp",
      "7.webp",
      "8.webp",
    ], 24),
  },
});

const sourceAnimationScenes = buildAnimationScenes();

export const ANIMATION_SCENES = {
  ...sourceAnimationScenes,
  ...buildPublicSceneOverrides(sourceAnimationScenes),
};

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
