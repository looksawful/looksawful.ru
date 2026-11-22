import { storybookInventory } from "../storybook/inventory.ts";
import { escapeHtml } from "../../utils/html.ts";

// Reuse the same canonical fixtures shown by the private Lab. Do not create
// parallel page content, component markup or fixtures for Storybook.
const grouped = {
  template: storybookInventory.filter((fixture) => fixture.kind === "template"),
  composition: storybookInventory.filter((fixture) => fixture.kind === "composition"),
  page: storybookInventory.filter((fixture) => fixture.kind === "page"),
};

function fixtureArgTypes(kind) {
  return {
    fixtureId: {
      description: `Canonical ${kind} fixture, derived from the live page manifest and section content`,
      control: { type: "select" },
      options: grouped[kind].map((fixture) => fixture.id),
    },
  };
}

function renderCanonicalFixture(kind, { fixtureId }) {
  const fixture = grouped[kind].find((candidate) => candidate.id === fixtureId);
  if (!fixture) throw new Error(`Unknown production fixture: ${kind}/${fixtureId}`);
  return `<div data-story-fixture="${escapeHtml(fixture.id)}" data-fixture-kind="${kind}">
    <header class="stack" style="padding:1.5rem;max-width:72rem">
      <p>${escapeHtml(fixture.kind)} · ${escapeHtml(fixture.variant)}</p>
      <h2>${escapeHtml(fixture.label)}</h2>
      <p>${escapeHtml(fixture.owner)}</p>
    </header>
    ${fixture.render()}
  </div>`;
}

const meta = {
  title: "05 Patterns & Templates/Production Entities",
  tags: ["autodocs", "stable"],
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/lab/storybook/inventory.ts",
        "src/content/pages/index.ts",
        "src/site/renderers/entity/section.ts",
        "src/site/renderers/entity/entity-shell.ts",
        "src/site/pages/entity-presentation.ts",
      ],
      layer: "template",
      policy: "composition",
      canonical: true,
      state: "ready",
      visibility: ["always"],
      interaction: ["default"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component: "Live production entity fixtures, not duplicate markup. Switch the fixtureId control to inspect all source sections, complete entity compositions and representative standalone page archetypes. This does not assert that interactions, specialized sections or all responsive states have passed visual QA.",
      },
    },
  },
};

export default meta;

export const Sections = {
  args: { fixtureId: grouped.template[0].id },
  argTypes: fixtureArgTypes("template"),
  render: (args) => renderCanonicalFixture("template", args),
};

export const Compositions = {
  args: { fixtureId: grouped.composition[0].id },
  argTypes: fixtureArgTypes("composition"),
  render: (args) => renderCanonicalFixture("composition", args),
};

export const PageArchetypes = {
  args: { fixtureId: grouped.page[0].id },
  argTypes: fixtureArgTypes("page"),
  parameters: {
    looksawful: { layer: "page", policy: "page" },
  },
  render: (args) => renderCanonicalFixture("page", args),
};
