import { sitePages } from "../../site/pages/manifest.ts";
import { storybookInventory } from "../storybook/inventory.ts";
import { escapeHtml } from "../../utils/html.ts";

const pages = sitePages.filter((page) => page.enabled);
const entityCompositions = storybookInventory.filter((fixture) => fixture.kind === "composition");

const meta = {
  title: "06 Pages/Site Pages",
  tags: ["autodocs", "stable"],
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: ["src/site/pages/manifest.ts", "src/lab/storybook/inventory.ts", "src/site/renderers/entity-page.ts"],
      layer: "page",
      policy: "page",
      canonical: true,
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "All enabled public site identities come from the canonical page manifest. Entity compositions use the production renderer. Static routes are linked to their canonical public pages, not mocked." } },
  },
};
export default meta;

export const RouteIndex = {
  render: () => '<main class="wrapper stack" style="--stack-space:var(--size-400);padding-block:var(--size-500)">' +
    '<h1>Live site pages</h1><p>All enabled routes from the code-owned manifest. Some public project pages intentionally are not indexed by search engines.</p>' +
    '<ul class="grid" style="--grid-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr));--grid-gap:var(--size-300)">' +
    pages.map((page) => '<li class="stack" style="--stack-space:var(--size-100);min-inline-size:0">' +
      '<strong>' + escapeHtml(page.id) + '</strong>' +
      '<a href="https://www.looksawful.ru' + escapeHtml(page.path) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(page.path) + '</a>' +
      '<span>' + escapeHtml(page.type) + (page.discovery.indexable ? " · indexed" : " · unlisted") + '</span></li>'
    ).join("") + '</ul></main>',
};

export const EntityPage = {
  args: { fixtureId: entityCompositions[0].id },
  argTypes: { fixtureId: { control: "select", options: entityCompositions.map((fixture) => fixture.id) } },
  render: ({ fixtureId }) => {
    const fixture = entityCompositions.find((entry) => entry.id === fixtureId);
    if (!fixture) throw new Error("Unknown enabled page: " + fixtureId);
    return '<main data-story-page="' + escapeHtml(fixture.id) + '">' + fixture.render() + '</main>';
  },
};
