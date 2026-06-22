const FILTER_WIDTH = 1540;
const FILTER_HEIGHT = 900;
const FILTER_URL = new URL("./playlist-filter.html", import.meta.url);

const getScale = (width) => {
  if (!Number.isFinite(width) || width <= 0) {
    return 1;
  }

  return width / FILTER_WIDTH;
};

const updateFilterSize = (root) => {
  const viewport = root.querySelector("[data-playlist-filter-viewport]");
  const frame = root.querySelector("[data-playlist-filter-frame]");

  if (!(viewport instanceof HTMLElement) || !(frame instanceof HTMLIFrameElement)) {
    return;
  }

  const width = viewport.clientWidth;
  const scale = getScale(width);
  const height = Math.max(240, Math.ceil(FILTER_HEIGHT * scale));

  viewport.style.height = height + "px";
  frame.style.transform = "scale(" + scale + ")";
};

const initPlaylistFilterRoot = (root) => {
  if (!(root instanceof HTMLElement) || root.dataset.playlistFilterReady === "true") {
    return;
  }

  const frame = root.querySelector("[data-playlist-filter-frame]");

  if (!(frame instanceof HTMLIFrameElement)) {
    return;
  }

  root.dataset.playlistFilterReady = "true";
  frame.src = FILTER_URL.href;
  updateFilterSize(root);

  const resizeObserver = new ResizeObserver(() => {
    updateFilterSize(root);
  });

  resizeObserver.observe(root);
  window.addEventListener("resize", () => updateFilterSize(root), { passive: true });
};

export const initPlaylistFilterEmbed = (scope = document) => {
  const roots = scope.querySelectorAll("[data-playlist-filter-embed]");

  roots.forEach((root) => initPlaylistFilterRoot(root));
};
