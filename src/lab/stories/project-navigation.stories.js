import {
  initProjectNavigationDock,
  initProjectNavigationFallback,
} from "../../components/project-navigation.ts";

const render = () => `
  <section class="hero" id="top"></section>
  <section class="projects">
    <nav class="project-nav wrapper" aria-label="Проекты" data-projects-navigation>
      <div class="project-nav__inner">
        <ol class="project-nav__list reel">
          <li><a class="project-nav__link" href="#project-a">A</a></li>
          <li><a class="project-nav__link" href="#project-b">B</a></li>
        </ol>
      </div>
    </nav>
    <section id="project-a"></section>
    <section id="project-b"></section>
  </section>`;

const initialize = ({ canvasElement }) => {
  const destroyDock = initProjectNavigationDock(canvasElement);
  const destroyFallback = initProjectNavigationFallback(canvasElement);
  return () => { destroyFallback(); destroyDock(); };
};

const meta = {
  title: "03 Organisms/Project Navigation",
  tags: ["autodocs", "stable", "a11y-reviewed"],
  render,
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: ["src/components/project-navigation.ts"],
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
