import { entityPageContents } from "../../content/pages/index.ts";
import { renderContentBlock } from "../../site/renderers/entity/content-block.ts";

function collectBlocks() {
  const blocks = [];

  for (const page of entityPageContents) {
    for (const section of page.sections) {
      if (section.type === "content" || section.type === "project") {
        blocks.push(...section.blocks);
        continue;
      }

      if (section.type === "project-group") {
        for (const item of section.items) blocks.push(...item.blocks);
      }
    }
  }

  return blocks;
}

const productionBlocks = collectBlocks();

function representative(type) {
  const block = productionBlocks.find((candidate) => candidate.type === type);
  if (!block) throw new Error(`Storybook parity: no production representative for ${type}`);
  return block;
}

function renderRepresentative(type) {
  return `<div class="wrapper stack" data-lab-project-surface="${type}">${renderContentBlock(representative(type), { reveal: false })}</div>`;
}

const meta = {
  title: "03 Organisms/Project Content Blocks/Production Parity",
  tags: ["lab", "production-source"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Production-backed approval stories. Every fixture is selected from the canonical EntityPage content registry and rendered by the production content-block renderer.",
      },
    },
    looksawful: {
      layer: "organisms",
      policy: "canonical",
      canonical: "src/site/renderers/entity/content-block.ts",
      sources: [
        "src/site/renderers/entity/content-block.ts",
        "src/content/pages/index.ts",
        "src/content/contracts/project-component-surfaces.ts",
      ],
    },
  },
};

export default meta;

export const MediaFigure = { render: () => renderRepresentative("media-figure") };
export const MediaGroup = { render: () => renderRepresentative("media-group") };
export const MediaSlider = { render: () => renderRepresentative("media-slider") };
export const Mockup = { render: () => renderRepresentative("mockup") };
export const MockupDeck = { render: () => renderRepresentative("mockup-deck") };
export const PageFlip = { render: () => renderRepresentative("page-flip") };
export const JesteiTheme = { render: () => renderRepresentative("jestei-theme") };
export const AwfulCasesGame = { render: () => renderRepresentative("awful-cases-game") };
