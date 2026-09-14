import { createMediaDecks } from "../../components/media-deck.ts";
import { createMotionPreference } from "../../components/motion-preference.ts";
import { createJesteiThemeOrganisms } from "../../components/jestei-theme-organism/jestei-theme-organism.js";
import { homepageEntries } from "../../site/pages/homepage.ts";
import { renderCompactHomepageEntity } from "../../site/renderers/home/home-page.ts";

const entry = (id) => {
  const match = homepageEntries.find((candidate) => candidate.entity.id === id);
  if (!match) throw new Error(`Missing compact homepage entry: ${id}`);
  return match;
};

const initialize = ({ canvasElement }) => {
  const motion = createMotionPreference();
  const destroyDecks = createMediaDecks({ root: canvasElement, motion });
  const themes = createJesteiThemeOrganisms({ root: canvasElement, motion });
  return () => {
    themes?.destroy();
    destroyDecks();
    motion.destroy();
  };
};

const meta = {
  title: "05 Pages/Home Compact Projects",
  tags: ["autodocs", "lab", "homepage", "issue:834"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Real homepage compact renderer for issue #834. Reuses canonical project content, strips compact-only text/captions, and keeps the production CTA.",
      },
    },
  },
};

export default meta;

export const Jestei = {
  render: () => renderCompactHomepageEntity(entry("jestei-pool")),
  play: initialize,
};

export const Styx = {
  render: () => renderCompactHomepageEntity(entry("styx")),
  play: initialize,
};

export const Sensetique = {
  render: () => renderCompactHomepageEntity(entry("sensetique")),
  play: initialize,
};
