import { usePublishedAssetUrls } from "../storybook/published-assets.mjs";
import { jesteiThemeOrganismMockup } from "../../data/content/jestei-theme-organism.ts";
import { renderJesteiThemeOrganismMockup } from "../../templates/jestei-theme-organism.ts";
import { renderJesteiTrackFilter } from "../../components/specialized/jestei-track-filter-canonical.ts";

const meta = {
  title: "02 Molecules/Chips Badges & Filter Controls",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: "Real Jestei Pool theme chips and badges, plus the native radio/tab group from the existing playlist filter. No invented UI variants." } },
  },
};
export default meta;

// The composed DOM comes from the production theme renderer; Storybook exposes
// the already-authored chip and badge elements without duplicating their markup.
export const ThemeChipsAndBadges = {
  args: { theme: "neutral" },
  argTypes: { theme: { control: "select", options: jesteiThemeOrganismMockup.themes.map((theme) => theme.name) } },
  render: ({ theme }) => {
    const source = document.createElement("div");
    source.innerHTML = renderJesteiThemeOrganismMockup(jesteiThemeOrganismMockup);
    const original = source.querySelector(".jestei-theme-organism");
    const instance = original.cloneNode(true);
    instance.dataset.themeActive = theme;
    instance.dataset.motionPreference = "reduce";
    instance.querySelectorAll(".jestei-theme-organism__badge").forEach((badge) => {
      badge.dataset.active = String(badge.dataset.themeChip === theme);
    });
    const host = document.createElement("main");
    host.className = "wrapper";
    host.style.paddingBlock = "var(--size-400)";
    host.append(instance);
    return host;
  },
};

export const TrackStateTabs = {
  render: () => {
    const root = document.createElement("main");
    root.innerHTML = usePublishedAssetUrls(renderJesteiTrackFilter({
      type: "specialized", kind: "jestei-track-filter", id: "jestei-track-filter",
      projectId: "jestei-track-filter",
    }));
    // HTML-string renderers cannot activate declarative Shadow DOM via innerHTML.
    // Mount the production template as a live shadow root for this specimen.
    const workflow = root.querySelector("playlist-filter-workflow");
    const template = workflow?.querySelector('template[shadowrootmode="open"]');
    if (workflow && template instanceof HTMLTemplateElement) {
      workflow.attachShadow({ mode: "open" }).append(template.content.cloneNode(true));
      template.remove();
    }
    return root;
  },
  parameters: { docs: { description: { story: "Production playlist filter in a real shadow root. Native downloaded/listened radios are visible and keyboard accessible." } } },
};


export const ThemeBadges = {
  args: { theme: "neutral" },
  argTypes: { theme: { control: "select", options: jesteiThemeOrganismMockup.themes.map((item) => item.name) } },
  render: ({ theme }) => {
    const source = document.createElement("div");
    source.innerHTML = renderJesteiThemeOrganismMockup(jesteiThemeOrganismMockup);
    const badgeRow = source.querySelector(".jestei-theme-organism__chips");
    if (!badgeRow) throw new Error("Production theme badges are missing");
    const root = document.createElement("main");
    root.className = "jestei-theme-organism wrapper";
    root.dataset.themeActive = theme;
    root.style.cssText = "padding-block:var(--size-500);min-block-size:8rem";
    const row = badgeRow.cloneNode(true);
    row.querySelectorAll("[data-theme-chip]").forEach((badge) => {
      badge.dataset.active = String(badge.dataset.themeChip === theme);
    });
    root.append(row);
    return root;
  },
  parameters: { docs: { description: { story: "Isolated, production-authored Jestei badges; select an active theme in Controls." } } },
};
