import homeHtml from "../../../index.html?raw";
import {
  initProjectNavigationDock,
  initProjectNavigationFallback,
} from "../../components/project-navigation.ts";
import { extractElementContainingMarker } from "../../site/rendering/html.ts";

const projectsSection = extractElementContainingMarker(
  homeHtml,
  "section",
  "data-projects-navigation",
);

const initialize = ({ canvasElement }) => {
  const destroyDock = initProjectNavigationDock(canvasElement);
  const destroyFallback = initProjectNavigationFallback(canvasElement);
  return () => { destroyFallback(); destroyDock(); };
};

const meta = {
  title: "03 Organisms/Project Navigation",
  tags: ["autodocs", "stable", "a11y-reviewed"],
  render: () => projectsSection,
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/components/project-navigation.ts",
        "index.html",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "undocked",
      visibility: ["conditional", "offscreen-or-virtualized"],
      interaction: ["default", "selected"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
  },
};

export default meta;
export const Undocked = { play: initialize };
export const Docked = {
  play: (context) => {
    initialize(context);
    const nav = context.canvasElement.querySelector("[data-projects-navigation]");
    const inner = nav?.querySelector(".project-nav__inner");
    if (nav instanceof HTMLElement && inner instanceof HTMLElement) {
      nav.setAttribute("data-project-nav-docked", "");
      inner.inert = false;
      inner.removeAttribute("aria-hidden");
    }
  },
  parameters: { looksawful: { state: "docked", interaction: ["selected"] } },
};
