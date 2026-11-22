import homeHtml from "../../../index.html?raw";
import { isHomeSectionVisible } from "../../data/content/home-visibility.ts";
import {
  applyClientLogoWallVisibility,
} from "../../site/renderers/home/home-slots.ts";
import { extractElementContainingMarker } from "../../site/rendering/html.ts";

const clientLogoWallSection = extractElementContainingMarker(
  homeHtml,
  "section",
  'aria-labelledby="portfolio-clients-title"',
);
const authoredVisible = isHomeSectionVisible("client-logo-wall");

const meta = {
  title: "03 Organisms/Home Section Visibility",
  tags: ["autodocs"],
  render: () => applyClientLogoWallVisibility(clientLogoWallSection, authoredVisible),
  parameters: {
    layout: "padded",
  },
};

export default meta;
export const Authored = {};
export const Hidden = {
  render: () => applyClientLogoWallVisibility(clientLogoWallSection, false),
  parameters: { looksawful: { state: "section-hidden" } },
};
export const Visible = {
  render: () => applyClientLogoWallVisibility(clientLogoWallSection, true),
  parameters: { looksawful: { state: "section-visible" } },
};
