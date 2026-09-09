/** @type {import("stylelint").Config} */
export default {
  rules: {
    "at-rule-no-unknown": true,
    "color-no-invalid-hex": true,
    "media-feature-name-no-unknown": true,
    "named-grid-areas-no-invalid": true,
    "property-no-unknown": true,
    "selector-pseudo-class-no-unknown": [
      true,
      { ignorePseudoClasses: ["target-current"] },
    ],
    "selector-pseudo-element-no-unknown": true,
    "unit-no-unknown": true,
  },
};
