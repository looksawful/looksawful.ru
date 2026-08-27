import { getMediaAsset, getMediaEntry, type MediaEntryId } from "../data/media/index.ts";
import type {
  JesteiThemeData,
  JesteiThemeOrganismMockupData,
} from "../types/jestei-theme-organism.ts";
import { escapeHtml } from "../utils/html.ts";

function renderPaletteSet(theme: JesteiThemeData): string {
  const items = theme.tokens
    .map((token, index) => {
      const swatch = `var(--jestei-swatch-${index + 1})`;

      return `
        <div class="jestei-theme-organism__palette-item">
          <span class="jestei-theme-organism__palette-swatch" style="--jestei-swatch: ${escapeHtml(swatch)}"></span>
          <span class="jestei-theme-organism__palette-copy">
            <span>${escapeHtml(token.name)}</span>
            <span>${escapeHtml(token.value)}</span>
          </span>
        </div>
      `;
    })
    .join("");

  return `<div class="jestei-theme-organism__palette-set" data-theme-palette="${escapeHtml(theme.name)}">${items}</div>`;
}

function renderThemeCard(theme: JesteiThemeData, loopClone = false): string {
  const clone = loopClone ? ' data-loop-clone="" aria-hidden="true"' : "";
  const tokens = theme.tokens
    .map(
      (token) => `
        <div class="jestei-theme-organism__token">
          <dt class="jestei-theme-organism__token-identity">
            <span class="jestei-theme-organism__token-swatch" style="--jestei-token-color: ${escapeHtml(token.rgb)}"></span>
            <span class="jestei-theme-organism__token-name">${escapeHtml(token.name)}</span>
          </dt>
          <dd class="jestei-theme-organism__token-value">${escapeHtml(token.value)}</dd>
        </div>
      `,
    )
    .join("");

  return `
    <li class="jestei-theme-organism__card" data-theme="${escapeHtml(theme.name)}"${clone}>
      <article class="jestei-theme-organism__card-content">
        <span class="jestei-theme-organism__card-chip">${escapeHtml(theme.label)}</span>
        <div class="jestei-theme-organism__card-copy">
          <h2>${escapeHtml(theme.label)}</h2>
          <p>${escapeHtml(theme.description)}</p>
        </div>
        <dl class="jestei-theme-organism__card-palette">${tokens}</dl>
      </article>
    </li>
  `;
}

function resolveModelSrc(entryId: MediaEntryId): string {
  const entry = getMediaEntry(entryId);
  const asset = getMediaAsset(entry.assetId);

  if (asset.type !== "model") {
    throw new Error(`Jestei theme organism requires model media: ${entryId}`);
  }

  return asset.src;
}

export function renderJesteiThemeOrganismMockup(
  data: JesteiThemeOrganismMockupData<MediaEntryId>,
): string {
  const classes = ["media", "mockup", data.className].filter(Boolean).join(" ");
  const theme = data.theme ? ` data-mockup-theme="${escapeHtml(data.theme)}"` : "";
  const style = data.ratio ? ` style="${escapeHtml(`--mockup-ratio: ${data.ratio};`)}"` : "";
  const modelSrc = resolveModelSrc(data.modelEntryId);
  const initialTheme = data.initialTheme;
  const badges = data.themes
    .map(
      (themeItem) =>
        `<span class="jestei-theme-organism__badge" data-theme-chip="${escapeHtml(themeItem.name)}">${escapeHtml(themeItem.label)}</span>`,
    )
    .join("");
  const palettes = data.themes.map((themeItem) => renderPaletteSet(themeItem)).join("");
  const cards = [
    ...data.themes.map((themeItem) => renderThemeCard(themeItem)),
    renderThemeCard(data.themes[0], true),
  ].join("");

  return `
    <figure
      class="${escapeHtml(classes)}"
      data-device="${escapeHtml(data.device)}"
      data-caption-view="lightbox-only"
      data-lightbox="off"
      ${theme}
      ${style}
    >
      <div class="mockup__frame">
        <div class="mockup__viewport">
          <div
            class="jestei-theme-organism"
            data-jestei-theme-instance="inline"
            data-jestei-theme-organism=""
            data-jestei-theme-model-src="${escapeHtml(modelSrc)}"
            data-jestei-theme-draco-path="${escapeHtml(data.dracoPath)}"
            data-motion-preference="allow"
            data-motion-state="static"
            data-theme-active="${escapeHtml(initialTheme)}"
            data-theme-from="${escapeHtml(initialTheme)}"
            data-theme-to="${escapeHtml(initialTheme)}"
          >
            <div class="jestei-theme-organism__wrapper">
              <section
                aria-busy="false"
                aria-label="${escapeHtml(data.ariaLabel)}"
                class="jestei-theme-organism__stage"
                data-motion-state="static"
              >
                <div aria-live="polite" class="jestei-theme-organism__loading" data-jestei-theme-loading="" role="status">
                  <span aria-hidden="true" class="jestei-theme-organism__loading-surface"></span>
                  <span class="visually-hidden">${escapeHtml(data.loadingLabel)}</span>
                </div>
                <div class="jestei-theme-organism__layout">
                  <div class="jestei-theme-organism__canvas-shell">
                    <canvas aria-hidden="true" data-jestei-theme-canvas=""></canvas>
                    <div class="jestei-theme-organism__canvas-overlay">
                      <div class="jestei-theme-organism__chips">${badges}</div>
                      <div aria-hidden="true" class="jestei-theme-organism__palette">${palettes}</div>
                    </div>
                  </div>
                  <div class="jestei-theme-organism__copy">
                    <div class="jestei-theme-organism__track-viewport">
                      <ul class="jestei-theme-organism__track" data-theme-track="">${cards}</ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </figure>
  `;
}
