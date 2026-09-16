import { expect, userEvent } from "storybook/test";
import { initSiteNavigation } from "../../components/site-navigation.ts";
import { sitePages } from "../../site/pages/manifest.ts";
import { renderSiteNavigation } from "../../site/shell/navigation.ts";

const page = sitePages.find((item) => item.id === "case:jestei-pool") ?? sitePages[0];
const sources = ["src/components/site-navigation.ts", "src/site/shell/navigation.ts"];
const evidence = (state, visibility = ["desktop", "tablet", "mobile"]) => ({ looksawful: { sources, layer: "organism", policy: "isolated", canonical: true, state, visibility } });
const motion = (allowed) => ({ isReduced: () => !allowed, allowsMotion: () => allowed, subscribe: () => () => {} });
const meta = { title: "03 Organisms/Site Navigation", render: () => `<main tabindex="-1"></main>${renderSiteNavigation(page)}`, parameters: evidence("closed", ["desktop", "tablet", "mobile", "reduced-motion"]) };
export default meta;

export const Closed = { play: async ({ canvasElement }) => {
  initSiteNavigation(canvasElement.ownerDocument, motion(true));
  const toggle = canvasElement.querySelector("[data-site-menu-toggle]");
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  await userEvent.tab();
  expect(canvasElement.ownerDocument.activeElement).not.toBe(canvasElement.ownerDocument.body);
} };
export const OpenEscape = { parameters: evidence("open-escape"), play: async ({ canvasElement }) => {
  initSiteNavigation(canvasElement.ownerDocument, motion(true));
  const toggle = canvasElement.querySelector("[data-site-menu-toggle]");
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(canvasElement.querySelector("[data-site-menu]")).not.toHaveAttribute("hidden");
  await userEvent.keyboard("{Escape}");
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveFocus();
} };
export const ReducedMotion = { parameters: evidence("reduced-motion", ["desktop", "tablet", "mobile", "reduced-motion"]), play: async ({ canvasElement }) => {
  initSiteNavigation(canvasElement.ownerDocument, motion(false));
  const toggle = canvasElement.querySelector("[data-site-menu-toggle]");
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(canvasElement.querySelector("[data-site-menu]")).not.toHaveAttribute("hidden");
} };
