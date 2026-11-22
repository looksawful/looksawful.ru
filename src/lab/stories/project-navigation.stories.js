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
  tags: ["autodocs"],
  render: () => projectsSection,
  parameters: {
    layout: "fullscreen",
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
