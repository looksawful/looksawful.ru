import { expect } from "storybook/test";
import { initProjectNavigationBackToTop } from "../../components/project-navigation.ts";

const renderProjectNavigation = () => `<main><section class="hero"></section><nav data-projects-navigation><div class="project-nav__inner"><div class="project-nav__list"><a class="project-nav__link" href="#one">one</a><a class="project-nav__link" href="#two">two</a></div></div></nav><section class="projects"><section id="one"></section><section id="two"></section></section></main>`;
const evidence = (state) => ({ looksawful: { sources: ["src/components/project-navigation.ts"], layer: "organism", policy: "behavior-fixture", canonical: true, state, visibility: ["breakpoint"], responsive: { review: ["desktop", "tablet", "mobile"] } } });
const meta = { title: "03 Organisms/Project Navigation", render: renderProjectNavigation, parameters: evidence("ready") };
export default meta;

export const Ready = { play: async ({ canvasElement }) => {
  const destroy = initProjectNavigationBackToTop(canvasElement);
  const top = canvasElement.querySelector(".project-nav__top");
  expect(top).toBeInTheDocument();
  expect(top).toHaveAttribute("href", "#top");
  destroy();
  expect(canvasElement.querySelector(".project-nav__top")).not.toBeInTheDocument();
} };
