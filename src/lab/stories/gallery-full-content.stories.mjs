import { createModelViewers } from "../../components/model-viewer.ts";
import {
  getGalleryItems,
  getGallerySeriesId,
} from "../../data/media/gallery.ts";
import { escapeHtml } from "../../utils/html.ts";
import { logo3dCatalog } from "../data/logo-3d-catalog.mjs";

const PHOTO_ITEMS = getGalleryItems();
const GALLERY_LOGO_IDS = [
  "jestei-symbol-metal",
  "jestei-symbol-pear",
  "jestei-symbol-orange",
  "jestei-symbol-blue",
  "jestei-symbol-biloba",
];

const READY_LOGOS = GALLERY_LOGO_IDS.map((id) => {
  const entry = logo3dCatalog.find(
    (candidate) => candidate.id === id && candidate.status === "ready" && candidate.modelUrl,
  );
  if (!entry) throw new Error(`Missing ready Gallery 3D logo: ${id}`);
  return entry;
});
const STYLE_ID = "gallery-full-content-story-styles";

const groupPhotos = () => {
  const groups = new Map();
  for (const item of PHOTO_ITEMS) {
    const id = getGallerySeriesId(item);
    const group = groups.get(id) ?? [];
    group.push(item);
    groups.set(id, group);
  }
  return [...groups.entries()];
};
const previewForModel = (modelUrl) =>
  modelUrl.replace(/\/([^/]+)\.glb$/, "/preview/$1.png");

const renderPhotoCard = (item) => {
  const title = item.title || item.alt || "";
  const alt = item.alt.trim() || title;

  return `<figure class="gallery-card" aria-label="${escapeHtml(alt)}">
    <img class="gallery-card__image" src="${escapeHtml(item.asset.src)}"
      width="${item.width}" height="${item.height}" alt="${escapeHtml(alt)}"
      loading="lazy" decoding="async">
  </figure>`;
};

const renderModelCard = (entry) => {
  const label = `${entry.family} · ${entry.variant}${entry.colorway ? ` · ${entry.colorway}` : ""}`;
  return `<figure class="gallery-card gallery-card--model" data-gallery-model-card>
    <div class="gallery-model" data-model-viewer-runtime
      data-model-src="${escapeHtml(entry.modelUrl)}" data-model-autorotate="false"
      role="img" aria-label="${escapeHtml(label)}">
      <img class="gallery-model__poster" src="${escapeHtml(previewForModel(entry.modelUrl))}"
        alt="" loading="lazy" decoding="async">
      <canvas class="gallery-model__canvas" data-model-viewer-canvas aria-hidden="true"></canvas>
    </div>
  </figure>`;
};
const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .gallery-full-content-preview { min-block-size: 100%; background: var(--clr-surface-page); }
    .gallery-full-content-preview .gallery { min-height: 0; }
    .gallery-full-content-preview .gallery-card--model { cursor: grab; aspect-ratio: 1 / 1; }
    .gallery-full-content-preview .gallery-card--model:active { cursor: grabbing; }
    .gallery-model { position: relative; inline-size: 100%; block-size: 100%; overflow: hidden; }
    .gallery-model__poster,
    .gallery-model__canvas { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; }
    .gallery-model__poster { object-fit: contain; padding: 7%; transition: opacity 140ms ease; }
    .gallery-model__canvas { display: block; opacity: 0; touch-action: none; }
    .gallery-model[data-model-state="ready"] .gallery-model__poster { opacity: 0; pointer-events: none; }
    .gallery-model[data-model-state="ready"] .gallery-model__canvas { opacity: 1; }
    .gallery-model[data-model-state="error"] .gallery-model__poster { opacity: 1; }
    @media (prefers-reduced-motion: reduce) {
      .gallery-model__poster { transition: none; }
    }
  `;
  document.head.append(style);
};

const renderPhotoSeries = () => groupPhotos()
  .map(([id, items]) => `<section class="gallery-series" data-gallery-series="${escapeHtml(id)}">
    <div class="gallery-series__grid" data-gallery-series-grid>
      ${items.map(renderPhotoCard).join("\n")}
    </div>
  </section>`)
  .join("\n");
const renderModelSeries = () => `<section class="gallery-series" data-gallery-series="3d-logos">
  <div class="gallery-series__grid" data-gallery-series-grid>
    ${READY_LOGOS.map(renderModelCard).join("\n")}
  </div>
</section>`;

const mountVisibleModels = (root) => {
  const cleanups = new Map();
  const cards = [...root.querySelectorAll("[data-gallery-model-card]")];
  if (!cards.length) return () => {};

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const card = entry.target;
      if (!(card instanceof HTMLElement)) continue;

      if (entry.isIntersecting) {
        if (!cleanups.has(card)) {
          cleanups.set(card, createModelViewers({ root: card }));
        }
      } else {
        cleanups.get(card)?.();
        cleanups.delete(card);
      }
    }
  }, { rootMargin: "320px 0px", threshold: 0 });

  cards.forEach((card) => observer.observe(card));
  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    cleanups.clear();
  };
};
const createStory = () => {
  ensureStyles();
  const root = document.createElement("main");
  root.className = "gallery-full-content-preview";
  root.innerHTML = `<section class="gallery" data-gallery-full-content>
    <div class="gallery__content">
      ${renderPhotoSeries()}
      ${renderModelSeries()}
    </div>
  </section>`;

  const cleanupModels = mountVisibleModels(root);
  const cleanupObserver = new MutationObserver(() => {
    if (root.isConnected) return;
    cleanupObserver.disconnect();
    cleanupModels();
  });
  cleanupObserver.observe(document.documentElement, { childList: true, subtree: true });
  return root;
};

export default {
  title: "05 Pages/Gallery/Full Content Preview",
  tags: ["autodocs", "experimental"],
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/data/media/gallery.ts",
        "src/styles/gallery.css",
        "src/components/model-viewer.ts",
        "src/lab/data/logo-3d-catalog.mjs",
      ],
      layer: "page",
      policy: "experimental",
      canonical: false,
      state: "full-content-with-3d",
      visibility: ["always", "offscreen-or-virtualized", "input-capability"],
      interaction: ["default", "active-or-pressed"],
      data: ["ready"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
      routeDiscovery: { listed: true, indexable: true },
    },
    docs: {
      description: {
        component: `Предрелизный вид Gallery: ${PHOTO_ITEMS.length} фотографий + ${READY_LOGOS.length} готовых 3D-логотипов. 3D использует production model-viewer без панелей управления; WebGL монтируется только возле viewport.`,
      },
    },
  },
};

export const AllContent = {
  name: `Все материалы · ${PHOTO_ITEMS.length} фото + ${READY_LOGOS.length} 3D`,
  render: createStory,
};
