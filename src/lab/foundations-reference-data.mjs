// Numeric values supplied by the owner, 21 Nov 2026. Reference-only.
const extracted = {
  color: [
    "#fff", "#000", "#007a7a", "#4f4f4f", "#2f5bff", "#2b3440",
    "#98a2b0", "#13171c", "#ff5f57", "#febc2e", "#28c840", "#748092",
    "#c7c7c7", "#e4e4e4", "#edc9a1", "#301b03", "#f08000", "#814705",
  ],
  text: ["8.8rem", "1rem", ".875rem", ".82em", ".72rem", ".6875rem"],
  space: [".0625rem", ".1875rem", ".35rem", ".45em", "10px", ".85rem", "1em"],
  radius: [".5rem", ".75rem", ".8rem"],
  shadow: [
    "var(--shadow-surface-elevated)", "var(--shadow-control)",
    ".8rem 0 0 var(--mockup-detail), 1.6rem 0 0 var(--mockup-detail)",
    "0 1rem 2.5rem #00000038,0 .35rem 1rem #00000029",
  ],
};

export const referenceTokens = Object.freeze(
  Object.entries(extracted).flatMap(([kind, values]) =>
    values.map((value, index) => Object.freeze({ kind, name: `--${kind}-${index + 1}`, value })),
  ),
);
