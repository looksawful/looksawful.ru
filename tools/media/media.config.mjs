export const MEDIA_PIPELINE_VERSION = 1;

export const MEDIA_PROJECTS = Object.freeze([
  "jestei",
  "styx",
  "shootings",
  "illumihand",
  "berry",
  "sands",
  "lyve",
  "sensetique",
]);

export const MEDIA_PATHS = Object.freeze({
  sources: "media/projects",
  generated: "public/media/generated/projects",
  manifestJson: "src/generated/media-manifest.json",
  manifestModule: "src/generated/media-manifest.js",
  cache: ".cache/media/state.json",
  reports: ".cache/media/reports",
  legacyGenerated: "public/media/projects",
  index: "index.html",
});

export const IMAGE_RECIPE = Object.freeze({
  format: "webp",
  widths: Object.freeze([48, 320, 640, 960, 1280, 1600, 1920, 2560]),
  fallbackTarget: 48,
  thumbnailTarget: 320,
  defaultTarget: 1280,
  quality: Object.freeze({
    fallback: 42,
    regular: 82,
    large: 88,
  }),
  effort: 5,
  withoutEnlargement: true,
  ratioTolerance: 0.025,
});

export const VIDEO_EXTENSIONS = Object.freeze([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
]);

export const IMAGE_EXTENSIONS = Object.freeze([
  ".webp",
]);
