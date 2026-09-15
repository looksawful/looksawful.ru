import { escapeHtml } from "../../utils/html.ts";
import { storybookInventory, storybookInventoryEvidence, type StorybookFixture } from "./inventory.ts";

function renderDiscovery(fixture: StorybookFixture): string {
  if (!fixture.route) return "";
  return `<dl class="lab-story__meta"><div><dt>route</dt><dd>${escapeHtml(fixture.route.path)}</dd></div><div><dt>listed</dt><dd>${String(fixture.route.listed)}</dd></div><div><dt>indexable</dt><dd>${String(fixture.route.indexable)}</dd></div></dl>`;
}

function renderFixture(fixture: StorybookFixture): string {
  return `<article class="lab-story" data-story-kind="${fixture.kind}" data-story-variant="${fixture.variant}">
    <header class="lab-story__head">
      <p>${escapeHtml(fixture.kind)} · ${escapeHtml(fixture.variant)}</p>
      <h3>${escapeHtml(fixture.label)}</h3>
      <small>${escapeHtml(fixture.owner)}</small>
      ${renderDiscovery(fixture)}
    </header>
    <div class="lab-story__viewports">
      ${fixture.viewports.map((viewport) => `<section class="lab-story__viewport" data-story-viewport="${viewport}"><strong>${viewport}</strong><div class="lab-story__canvas">${fixture.render()}</div></section>`).join("")}
    </div>
  </article>`;
}

export function renderStorybook(): string {
  const groups = (["template", "composition", "page"] as const).map((kind) => {
    const fixtures = storybookInventory.filter((fixture) => fixture.kind === kind);
    return `<section class="lab-storybook__group"><h2>${kind}s</h2>${fixtures.map(renderFixture).join("")}</section>`;
  });

  return `<header class="lab-storybook__summary"><p>production inventory · ${storybookInventoryEvidence.fixtureCount} fixtures · ${storybookInventoryEvidence.routeCount} entity routes</p></header>${groups.join("")}`;
}
