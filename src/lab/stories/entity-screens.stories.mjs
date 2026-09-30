import { storybookInventory } from "../storybook/inventory.ts";
import { initMotion } from "../../motion.ts";
const screens = storybookInventory.filter((fixture) => fixture.kind === "composition");
let cleanup = () => {};
export default {
  title: "05 Pages/Entity Screens", tags: ["autodocs", "stable"],
  args: { screen: screens[0].id },
  argTypes: { screen: { options: screens.map(({ id }) => id), control: "select" } },
  render: ({ screen }) => {
    const fixture = screens.find(({ id }) => id === screen);
    if (!fixture) throw new Error("Unknown canonical entity screen");
    return fixture.render();
  },
  play: ({ canvasElement }) => { cleanup(); cleanup = initMotion({ root: canvasElement }); },
  beforeEach: () => { cleanup(); return () => cleanup(); },
  parameters: { layout: "fullscreen", looksawful: {
    sources: ["src/lab/storybook/inventory.ts", "src/site/renderers/entity/entity-shell.ts", "src/site/renderers/entity/section.ts", "src/content/pages/index.ts", "src/site/pages/entity-presentation.ts"],
    layer: "page", policy: "composition", canonical: true,
    state: "enabled-entity-compositions", visibility: ["always"],
    responsive: { review: ["desktop", "tablet", "mobile"] },
  }, docs: { description: { component: "Current enabled entity compositions from the production manifest. This is layout/content review; specialized interactive behavior is reviewed in its owning stories." } } },
};
export const Current = {};
export const Mobile = { globals: { viewport: { value: "mobile", isRotated: false } } };
export const Tablet = { globals: { viewport: { value: "tablet", isRotated: false } } };
export const Desktop = { globals: { viewport: { value: "desktop", isRotated: false } } };
