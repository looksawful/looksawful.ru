export const DEFAULT_MAX_PIXEL_RATIO = 2;

export function getSafePixelRatio(maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO) {
  return Math.min(globalThis.devicePixelRatio || 1, maxPixelRatio);
}

export function getElementRenderSize(element, options = {}) {
  const {
    minWidth = 1,
    minHeight = 1,
    maxWidth = Number.POSITIVE_INFINITY,
    maxHeight = Number.POSITIVE_INFINITY,
    fallbackWidth = 1,
    fallbackHeight = 1,
  } = options;

  if (!element) {
    return {
      width: Math.max(1, Math.floor(fallbackWidth)),
      height: Math.max(1, Math.floor(fallbackHeight)),
    };
  }

  const rect = element.getBoundingClientRect?.();
  const rawWidth = rect?.width || element.clientWidth || fallbackWidth;
  const rawHeight = rect?.height || element.clientHeight || fallbackHeight;

  const width = Math.min(Math.max(Math.floor(rawWidth), minWidth), maxWidth);
  const height = Math.min(Math.max(Math.floor(rawHeight), minHeight), maxHeight);

  return { width, height };
}

export function resizePerspectiveRenderer(renderer, camera, element, state = {}, options = {}) {
  const {
    minWidth = 1,
    minHeight = 1,
    maxWidth = Number.POSITIVE_INFINITY,
    maxHeight = Number.POSITIVE_INFINITY,
    fallbackWidth = 1,
    fallbackHeight = 1,
    maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
  } = options;

  const { width, height } = getElementRenderSize(element, {
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    fallbackWidth,
    fallbackHeight,
  });

  if (!width || !height) {
    return false;
  }

  const pixelRatio = getSafePixelRatio(maxPixelRatio);

  if (renderer.getPixelRatio?.() !== pixelRatio) {
    renderer.setPixelRatio(pixelRatio);
  }

  if (state.width === width && state.height === height && state.pixelRatio === pixelRatio) {
    return false;
  }

  state.width = width;
  state.height = height;
  state.pixelRatio = pixelRatio;

  renderer.setSize(width, height, false);

  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix?.();
  }

  return true;
}

export function createFrameTimer() {
  let previousTime = performance.now();
  let elapsed = 0;

  return {
    tick() {
      const currentTime = performance.now();
      const delta = Math.max(0, (currentTime - previousTime) / 1000);
      previousTime = currentTime;
      elapsed += delta;

      return { delta, elapsed };
    },

    reset() {
      previousTime = performance.now();
      elapsed = 0;
    },
  };
}

export function disposeMaterial(material) {
  if (!material) {
    return;
  }

  Object.values(material).forEach((value) => {
    if (value?.isTexture && typeof value.dispose === "function") {
      value.dispose();
    }
  });

  material.dispose?.();
}

export function disposeObjectResources(object) {
  object?.traverse?.((child) => {
    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial);
    } else {
      disposeMaterial(child.material);
    }
  });
}
