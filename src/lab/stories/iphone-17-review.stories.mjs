import { createModelViewers } from "../../components/model-viewer.ts";

const CANDIDATE_SHA = "2bebd2cc2a64f08230ca243f3437db270ac15152";
const CANDIDATE_MODEL =
  "https://raw.githubusercontent.com/looksawful/awful-studio/" +
  CANDIDATE_SHA +
  "/assets/device_mockups/iphone_17/runtime/v30/iphone_17_v30_web_meshopt.glb";
const STYLE_ID = "iphone-17-private-review-styles";

const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .iphone17-review {
      min-block-size: 100vh;
      padding: var(--size-300);
      background: var(--clr-surface-page);
      color: var(--clr-text);
    }

    .iphone17-review__meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: .5rem 1rem;
      inline-size: min(100%, 72rem);
      margin: 0 auto var(--size-300);
      color: var(--clr-text-muted);
      font-size: var(--fs-200);
      line-height: var(--lh-ui);
    }

    .iphone17-review__stage {
      position: relative;
      inline-size: min(100%, 72rem);
      margin-inline: auto;
      aspect-ratio: 4 / 5;
      overflow: hidden;
      border: var(--border-width-100) solid var(--clr-border);
      border-radius: var(--radius-contained);
      background: var(--clr-surface-raised);
      cursor: grab;
    }

    .iphone17-review__stage:active {
      cursor: grabbing;
    }

    .iphone17-review__stage canvas {
      position: absolute;
      inset: 0;
      display: block;
      inline-size: 100%;
      block-size: 100%;
      touch-action: none;
    }

    @media (min-width: 48rem) {
      .iphone17-review__stage {
        aspect-ratio: 16 / 10;
      }
    }
  `;

  document.head.append(style);
};

const createStory = () => {
  ensureStyles();

  const root = document.createElement("main");
  root.className = "iphone17-review";
  root.innerHTML = `
    <div class="iphone17-review__meta">
      <strong>iPhone 17 · PR #119</strong>
      <span>candidate ${CANDIDATE_SHA.slice(0, 8)} · drag to rotate · wheel/pinch to zoom</span>
    </div>
    <div
      class="iphone17-review__stage"
      data-model-viewer-runtime
      data-model-src="${CANDIDATE_MODEL}"
      data-model-autorotate="false"
      data-model-view="three-quarter"
      role="img"
      aria-label="iPhone 17 review candidate from PR #119"
    >
      <canvas data-model-viewer-canvas aria-hidden="true"></canvas>
    </div>
  `;

  const cleanup = createModelViewers({ root });
  const observer = new MutationObserver(() => {
    if (root.isConnected) return;
    observer.disconnect();
    cleanup();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  return root;
};

export default {
  id: "iphone-17-review",
  title: "90 Experimental/3D Review/iPhone 17 · PR #119",
  tags: ["experimental"],
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: ["src/components/model-viewer.ts"],
      layer: "page",
      policy: "experimental",
      canonical: false,
      state: "iphone-17-pr-119",
      visibility: ["always", "input-capability"],
      interaction: ["default", "active-or-pressed"],
      data: ["ready"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
      routeDiscovery: { listed: false, indexable: false },
    },
    docs: {
      description: {
        component:
          "Приватная review-поверхность exact iPhone 17 candidate из awful-studio PR #119. Не production и не canonical.",
      },
    },
  },
};

export const Candidate = {
  name: "Текущий кандидат",
  render: createStory,
};
