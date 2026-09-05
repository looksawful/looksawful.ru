import path from "node:path";

export const OUTPUT_ROOT = path.join("_local", "design-capture");

export const PAGE_VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
];

export const PAGE_EXCLUSIONS = [
  "/fixtures/",
  "/__fixtures__/",
  "/test/",
  "/tests/",
  "/tools/",
];

export const COMPONENTS = [
  {
    name: "site-nav",
    route: "/",
    selector: ".site-nav",
    selectorHints: [".site-nav"],
    stylesheetHints: ["src/styles/components.css"],
  },
  {
    name: "projects-navigation",
    route: "/",
    selector: "[data-projects-navigation]",
    selectorHints: [".projects-navigation", "[data-projects-navigation]"],
    stylesheetHints: ["src/styles/components.css", "src/styles/patterns.css"],
  },
  {
    name: "project-header",
    route: "/",
    selector: ".project__head",
    selectorHints: [".project__head", ".project__name", ".project__role", ".project__period"],
    stylesheetHints: ["src/styles/components.css"],
  },
  {
    name: "media-caption",
    route: "/",
    selector: ".media__caption",
    selectorHints: [".media__caption"],
    stylesheetHints: ["src/styles/captions.css"],
    breakpoints: [672],
    optional: true,
  },
];

export const COMPONENT_VIEWPORT_HEIGHT = 1000;
export const MIN_COMPONENT_WIDTH = 320;
export const MAX_COMPONENT_WIDTH = 1920;
