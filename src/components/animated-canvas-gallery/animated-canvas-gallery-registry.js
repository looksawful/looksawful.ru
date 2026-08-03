const VARIANTS = Object.freeze({
  arc: {
    aspectRatio: "1280 / 860",
    repositoryPath: "",
    load: async () => {
      const module = await import("./variants/arc/component.js");
      return {
        fields: module.ARC_FIELDS,
        mount: module.mountArcComponent,
      };
    },
  },

  spiral: {
    aspectRatio: "1",
    repositoryPath: "",
    load: async () => {
      const module = await import("./variants/spiral/component.js");
      return {
        fields: module.SPIRAL_FIELDS,
        mount: module.mountSpiralComponent,
      };
    },
  },

  horizontal: {
    aspectRatio: "1280 / 670",
    repositoryPath: "",
    load: async () => {
      const module = await import("./variants/horizontal/component.js");
      return {
        fields: module.HORIZONTAL_FIELDS,
        mount: module.mountHorizontalComponent,
      };
    },
  },

  diagonal: {
    aspectRatio: "1280 / 700",
    repositoryPath: "",
    load: async () => {
      const module = await import("./variants/diagonal/component.js");
      return {
        fields: module.DIAGONAL_FIELDS,
        mount: module.mountDiagonalComponent,
      };
    },
  },

  "showcase-diagonal": {
    aspectRatio: "1280 / 700",
    repositoryPath: "",
    load: async () => {
      const module = await import("./variants/showcase-diagonal/component.js");
      return {
        fields: module.SHOWCASE_DIAGONAL_FIELDS,
        mount: module.mountShowcaseDiagonalComponent,
      };
    },
  },

  masonry: {
    aspectRatio: "1280 / 660",
    repositoryPath: "",
    load: async () => {
      const module = await import("./variants/masonry/component.js");
      return {
        fields: module.MASONRY_FIELDS,
        mount: module.mountMasonryComponent,
      };
    },
  },
});

const definitionCache = new Map();

export const ANIMATED_CANVAS_GALLERY_VARIANTS = Object.freeze(
  Object.keys(VARIANTS),
);

export function hasAnimatedCanvasGalleryVariant(name) {
  return Object.hasOwn(VARIANTS, name);
}

export function getAnimatedCanvasGalleryVariantMeta(name) {
  return VARIANTS[name] ?? null;
}

export async function loadAnimatedCanvasGalleryVariant(name) {
  const record = VARIANTS[name];

  if (!record) {
    throw new Error(
      `Animated Canvas Gallery: неизвестный вариант "${name}".`,
    );
  }

  if (!definitionCache.has(name)) {
    definitionCache.set(
      name,
      record.load().then((definition) => ({
        ...definition,
        name,
        aspectRatio: record.aspectRatio,
        repositoryPath: record.repositoryPath,
      })),
    );
  }

  return definitionCache.get(name);
}
