export const JESTEI_THEME_DEFINITIONS = Object.freeze([
  Object.freeze({
    name: "neutral",
    label: "Neutral",
    description: "\u00A0",
    color: "#000000",
    rgb: "0 0 0",
    tokens: Object.freeze([
      Object.freeze({ name: "neutral", value: "#000000", rgb: "0 0 0" }),
      Object.freeze({ name: "dark", value: "#3C3C3C", rgb: "60 60 60" }),
      Object.freeze({ name: "mid", value: "#969696", rgb: "150 150 150" }),
      Object.freeze({ name: "light", value: "#E4E4E4", rgb: "228 228 228" }),
    ]),
  }),
  Object.freeze({
    name: "basic",
    label: "Basic",
    description:
      "Для клубных диджеев. Основной цвет ленты треков и клубного контента.",
    color: "#F08000",
    rgb: "240 128 0",
    tokens: Object.freeze([
      Object.freeze({ name: "basic", value: "#F08000", rgb: "240 128 0" }),
      Object.freeze({ name: "dark", value: "#814705", rgb: "129 71 5" }),
      Object.freeze({ name: "mid", value: "#EAA556", rgb: "234 165 86" }),
      Object.freeze({ name: "light", value: "#D3B087", rgb: "211 176 135" }),
    ]),
  }),
  Object.freeze({
    name: "event",
    label: "Event",
    description:
      "Для ивент-диджеев. Отмечает подборки и инструменты для свадеб, корпоративов и частных мероприятий.",
    color: "#D0E232",
    rgb: "208 226 50",
    tokens: Object.freeze([
      Object.freeze({ name: "event", value: "#D0E232", rgb: "208 226 50" }),
      Object.freeze({ name: "dark", value: "#788318", rgb: "120 131 24" }),
      Object.freeze({ name: "mid", value: "#D7E087", rgb: "215 224 135" }),
      Object.freeze({ name: "light", value: "#CDD2A2", rgb: "205 210 162" }),
    ]),
  }),
  Object.freeze({
    name: "pro",
    label: "Pro",
    description:
      "Для диджеев с расширенным доступом. Отмечает эксклюзивные эдиты, миксы и специальные продукты.",
    color: "#147AFF",
    rgb: "20 122 255",
    tokens: Object.freeze([
      Object.freeze({ name: "pro", value: "#147AFF", rgb: "20 122 255" }),
      Object.freeze({ name: "dark", value: "#064494", rgb: "6 68 148" }),
      Object.freeze({ name: "mid", value: "#78ABEE", rgb: "120 171 238" }),
      Object.freeze({ name: "light", value: "#9AB5DA", rgb: "154 181 218" }),
    ]),
  }),
  Object.freeze({
    name: "feature",
    label: "Feauture",
    description:
      "Для всех пользователей. Отмечает новые и экспериментальные функции, не привязанные к одному разделу.",
    color: "#B19FE9",
    rgb: "177 159 233",
    tokens: Object.freeze([
      Object.freeze({ name: "feauture", value: "#B19FE9", rgb: "177 159 233" }),
      Object.freeze({ name: "dark", value: "#4D2EAD", rgb: "77 46 173" }),
      Object.freeze({ name: "mid", value: "#A695DB", rgb: "166 149 219" }),
      Object.freeze({ name: "light", value: "#E0DCEC", rgb: "224 220 236" }),
    ]),
  }),
]);

export const JESTEI_THEME_DETAIL_METRICS = Object.freeze({
  minInlineSize: "38rem",
  preferredInlineSize: "48rem",
  maxInlineSize: "64rem",
});

export const JESTEI_THEME_CSS_PROPERTIES = Object.freeze({
  slideWidth: "--jestei-slide-width",
  backgroundStart: "--jestei-theme-bg-start",
  backgroundEnd: "--jestei-theme-bg-end",
  glow: "--jestei-theme-glow",
  ink: "--jestei-theme-ink",
  border: "--jestei-theme-border",
  swatches: Object.freeze([
    "--jestei-swatch-1",
    "--jestei-swatch-2",
    "--jestei-swatch-3",
    "--jestei-swatch-4",
  ]),
});

export const JESTEI_THEME_SETTINGS = Object.freeze({
  modelRadius: 1.3,
  gridCellSize: 0.062,
  gridLineWidth: 0.075,
  passDuration: 5,
  pixelRatioLimit: 2,
  baseRotationX: -12,
  baseRotationY: 25,
  baseRotationZ: 1,
});

export const JESTEI_THEME_MODEL_URL =
  "./media/projects/jestei/theme-organism/jestei-theme-organism.glb";
export const JESTEI_THEME_DRACO_PATH = "./vendor/draco/gltf/";

function tokenMarkup(token) {
  return `
    <div class="jestei-theme-organism__token">
      <dt class="jestei-theme-organism__token-identity">
        <span
          class="jestei-theme-organism__token-swatch"
          style="--jestei-token-color: ${token.rgb}"
        ></span>
        <span class="jestei-theme-organism__token-name">${token.name}</span>
      </dt>
      <dd class="jestei-theme-organism__token-value">${token.value}</dd>
    </div>`;
}

function themeCardMarkup(theme) {
  return `
    <li class="jestei-theme-organism__card" data-theme="${theme.name}">
      <article class="jestei-theme-organism__card-content">
        <span class="jestei-theme-organism__card-chip">${theme.label}</span>
        <div class="jestei-theme-organism__card-copy">
          <h2>${theme.label}</h2>
          <p>${theme.description}</p>
        </div>
        <dl class="jestei-theme-organism__card-palette">
          ${theme.tokens.map(tokenMarkup).join("")}
        </dl>
      </article>
    </li>`;
}

function paletteItemMarkup(token, index) {
  return `
    <div class="jestei-theme-organism__palette-item">
      <span
        class="jestei-theme-organism__palette-swatch"
        style="--jestei-swatch: var(--jestei-swatch-${index + 1})"
      ></span>
      <span class="jestei-theme-organism__palette-copy">
        <span data-color-name>${token.name}</span>
        <span data-color-hex>${token.value}</span>
      </span>
    </div>`;
}

export function createJesteiThemeOrganismMarkup() {
  const neutral = JESTEI_THEME_DEFINITIONS[0];

  return `
    <div class="jestei-theme-organism__wrapper">
      <section
        aria-label="Цветовые темы Jestei Pool"
        class="jestei-theme-organism__stage"
        data-motion-state="static"
      >
        <div class="jestei-theme-organism__layout">
          <div aria-hidden="true" class="jestei-theme-organism__canvas-shell">
            <canvas
              aria-label="Сетка Jestei Pool с черным стартом, заполнением ячеек до сплошной 3D-модели и физичными разворотами"
              data-jestei-theme-canvas
            ></canvas>
            <div class="jestei-theme-organism__canvas-overlay">
              <div class="jestei-theme-organism__chips">
                ${JESTEI_THEME_DEFINITIONS.map(
                  (theme) =>
                    `<span class="jestei-theme-organism__badge" data-theme-chip="${theme.name}">${theme.label}</span>`,
                ).join("")}
              </div>
              <div aria-hidden="true" class="jestei-theme-organism__palette">
                ${neutral.tokens.map(paletteItemMarkup).join("")}
              </div>
            </div>
          </div>

          <div class="jestei-theme-organism__copy">
            <div class="jestei-theme-organism__track-viewport">
              <ul class="jestei-theme-organism__track" data-theme-track>
                ${JESTEI_THEME_DEFINITIONS.map(themeCardMarkup).join("")}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>`;
}
