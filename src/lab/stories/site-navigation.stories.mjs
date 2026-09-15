import { initSiteNavigation } from "../../components/site-navigation.ts";
import { sitePages } from "../../site/pages/manifest.ts";
import { renderSiteNavigation } from "../../site/shell/navigation.ts";

const homePage = sitePages.find((page) => page.id === "home");
const motionEnabled = { isReduced: () => false, allowsMotion: () => true, subscribe: () => () => {} };
const reducedMotion = { isReduced: () => true, allowsMotion: () => false, subscribe: () => () => {} };

const initialize = ({ canvasElement }, motion = motionEnabled) => initSiteNavigation(canvasElement, motion);
const openMenu = (context, motion = motionEnabled) => {
  initialize(context, motion);
  const toggle = context.canvasElement.querySelector("[data-site-menu-toggle]");
  if (toggle instanceof HTMLButtonElement) toggle.click();
};

const meta = {
  title: "03 Organisms/Site Navigation",
  tags: ["autodocs", "stable", "a11y-reviewed"],
  render: () => renderSiteNavigation(homePage),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: ["src/components/site-navigation.ts", "src/site/shell/navigation.ts", "src/site/pages/manifest.ts"],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "menu-closed",
      visibility: ["disclosure", "input-capability"],
      interaction: ["closed", "focus-visible"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: { review: ["desktop", "tablet", "mobile"], conditions: ["(hover: hover) and (pointer: fine)"] },
      routeDiscovery: { listed: true, indexable: true },
    },
  },
};

export default meta;
export const Closed = { play: (context) => initialize(context) };
export const Open = {
  play: (context) => openMenu(context),
  parameters: { looksawful: { state: "menu-open", visibility: ["disclosure", "overlay", "input-capability"], interaction: ["open", "focus-visible"] } },
};
export const ReducedMotionOpen = {
  play: (context) => openMenu(context, reducedMotion),
  parameters: { looksawful: { state: "menu-open-reduced-motion", visibility: ["disclosure", "overlay", "input-capability"], interaction: ["open", "focus-visible"], motion: ["reduced-motion"] } },
};
