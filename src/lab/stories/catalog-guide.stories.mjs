import { storybookInventory } from "../storybook/inventory.ts";
const categories = [
  ["Foundations", "Fonts, type scales, color, surfaces, borders, radii, shadows, spacing and motion tokens."],
  ["Atoms", "Divider, client logo and canonical media primitives."],
  ["Molecules", "Project and subproject cards, labels, chips, filter controls and content elements."],
  ["Organisms", "Navigation, galleries, model viewers, audio playback and complete interface modules."],
  ["Layout", "Containers, responsive grids, typographic rhythm and production CSS patterns."],
  ["Patterns & Templates", storybookInventory.filter((item) => item.kind === "template").length + " production-backed sections and " + storybookInventory.filter((item) => item.kind === "composition").length + " complete entity compositions."],
  ["Pages", "Enabled site routes, full page content and page archetypes."],
  ["Motion", "Existing reveal behavior, motion preferences and animation contracts."],
  ["Feedback", "Loading and error states; unimplemented component families are labelled as gaps."],
];

const meta = {
  title: "00 Foundations/Start Here",
  tags: ["autodocs", "stable"],
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/site/pages/manifest.ts", "src/styles/tokens.css", "src/lab/storybook/inventory.ts"],
      layer: "foundation",
      policy: "isolated",
      canonical: false,
    },
    docs: { description: { component: "One source-backed Storybook for the current site. The catalog documents existing code, not a second UI kit." } },
  },
};
export default meta;

export const CatalogMap = {
  render: () => '<main class="wrapper stack" style="--stack-space:var(--size-400);padding-block:var(--size-600)">' +
    '<h1>Looksawful · Design System</h1>' +
    '<p>Actual site tokens, components, page renderers, interactions and work in progress. Use the Storybook sidebar to open a specimen, change its controls and compare desktop, tablet and mobile.</p>' +
    '<ol class="grid" style="--grid-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr));--grid-gap:var(--size-400);padding-inline-start:var(--size-400)">' +
    categories.map(([name, description]) =>
      '<li class="stack" style="--stack-space:var(--size-100)"><strong>' + name + '</strong><p>' + description + '</p></li>'
    ).join("") +
    '</ol><p>Source-backed specimens use production CSS and renderers. Experimental prototypes are separated under Experimental. Missing production systems are identified as gaps, not invented as components.</p></main>',
};
