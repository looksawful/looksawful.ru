import { clientLogos } from "../../../data/clients.ts";
import { portfolioSensetiqueStrip } from "../../../data/content/sensetique.ts";
import { portfolioShootingsStrip } from "../../../data/content/shootings.ts";
import { portfolioScanographyStrip } from "../../../data/content/styx.ts";
import { getVisibleProjectCardPresentations } from "../../../data/projects.ts";

import {
  renderClientLogo,
  renderPortfolioEntityCard,
} from "../../../components/composition/index.ts";
import { renderMediaGroup } from "../../../components/content/index.ts";
import {
  replaceRequiredSlots,
  type HtmlSlot,
} from "../../rendering/html.ts";

export function createHomepageSlots(): readonly HtmlSlot[] {
  const projectCards = getVisibleProjectCardPresentations()
    .map(renderPortfolioEntityCard)
    .join("\n");
  const logos = clientLogos.map(renderClientLogo).join("\n");

  return [
    ["<!-- PROJECT_CARDS -->", projectCards],
    ["<!-- CLIENT_LOGOS -->", logos],
    ["<!-- PORTFOLIO_SHOOTINGS_STRIP -->", renderMediaGroup(portfolioShootingsStrip)],
    ["<!-- PORTFOLIO_SENSETIQUE_STRIP -->", renderMediaGroup(portfolioSensetiqueStrip)],
    ["<!-- PORTFOLIO_SCANOGRAPHY_STRIP -->", renderMediaGroup(portfolioScanographyStrip)],
  ] as const;
}

export function renderHomepage(html: string): string {
  return replaceRequiredSlots(html, createHomepageSlots());
}
