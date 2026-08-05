const PET_PREVIEW_OVERRIDES = Object.freeze({
  "awful-cases": Object.freeze({
    useInlineSource: false,
    localPaths: [
      "pets/awful-cases/index.html",
      "/pets/awful-cases/index.html",
    ],
    bridgeStyle: `
      :host {
        background: var(--desktop, #008080);
        color: var(--black, #000);
        font-family: var(
          --sys,
          "Pixelated MS Sans Serif",
          "MS Sans Serif",
          Tahoma,
          Arial,
          sans-serif
        );
      }

      [data-source-body] {
        margin: 0;
        min-inline-size: 320px;
        background:
          linear-gradient(
            135deg,
            var(--desktop, #008080),
            var(--desktop-dark, #006c6c)
          );
        color: var(--black, #000);
        font: 12px/1.4 var(
          --sys,
          "Pixelated MS Sans Serif",
          "MS Sans Serif",
          Tahoma,
          Arial,
          sans-serif
        );
      }
    `,
  }),
  "berserk-timer": Object.freeze({
    useInlineSource: false,
    localPaths: [
      "pets/berserk-timer/index.html",
      "/pets/berserk-timer/index.html",
    ],
    bridgeStyle: `
      :host {
        background: var(--bg, #050505);
        color: var(--text, #e8e3d4);
        font-family: var(
          --sans,
          Rubik,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif
        );
      }

      [data-source-body] {
        margin: 0;
        min-inline-size: 320px;
        background:
          radial-gradient(
            circle at 14% 0%,
            rgba(182, 255, 109, 0.08),
            transparent 30rem
          ),
          linear-gradient(180deg, #060606, #030303);
        color: var(--text, #e8e3d4);
        font-family: var(
          --sans,
          Rubik,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif
        );
      }

      .logo pre,
      .screen-body pre,
      .term pre {
        font-family: var(
          --mono,
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          "Liberation Mono",
          monospace
        );
        font-variant-ligatures: none;
        white-space: pre;
      }
    `,
  }),
});

function getPetPreviewOverride(project) {
  return PET_PREVIEW_OVERRIDES[project] ?? null;
}

export { getPetPreviewOverride };
