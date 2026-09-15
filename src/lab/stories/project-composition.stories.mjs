import {
  renderEntityIntro,
  renderPortfolioEntityCard,
  renderResourceLinks,
  renderSectionIntro,
} from "../../components/composition/index.ts";
import { entityPageContents } from "../../content/pages/index.ts";
import { projectCardPresentations } from "../../data/projects.ts";
import { shootingCardGroups } from "../../data/subproject-cards.ts";
import { renderContentBlock } from "../../site/renderers/entity/content-block.ts";
import { renderSubprojectCard } from "../../templates/subproject-card.ts";

function allSections() {
  return entityPageContents.flatMap((page) => page.sections);
}

function firstSectionWith(key) {
  const section = allSections().find((candidate) => candidate[key]);
  if (!section) throw new Error(`Storybook parity: no production section with ${key}`);
  return section;
}

function firstBlock(type) {
  for (const section of allSections()) {
    if (section.type === "content" || section.type === "project") {
      const match = section.blocks.find((block) => block.type === type);
      if (match) return match;
    }
    if (section.type === "project-group") {
      for (const item of section.items) {
        const match = item.blocks.find((block) => block.type === type);
        if (match) return match;
      }
    }
  }
  throw new Error(`Storybook parity: no production block for ${type}`);
}

const pageWithIntro = entityPageContents.find((page) => page.intro);
if (!pageWithIntro) throw new Error("Storybook parity: no canonical entity intro found");

const projectCard = projectCardPresentations.find((card) => card.visible) ?? projectCardPresentations[0];
const subprojectCard = shootingCardGroups[0]?.cards[0];
if (!projectCard || !subprojectCard) throw new Error("Storybook parity: missing production card fixtures");

const meta = {
  title: "03 Organisms/Project Composition/Production Parity",
  tags: ["lab", "production-source"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Canonical composition and card renderers fed by production content. ResponsiveImage is covered through an actual media-figure render because it is an attribute helper, not a standalone DOM component.",
      },
    },
    looksawful: {
      layer: "organisms",
      policy: "canonical",
      sources: [
        "src/components/composition/index.ts",
        "src/content/pages/index.ts",
        "src/data/projects.ts",
        "src/data/subproject-cards.ts",
      ],
    },
  },
};

export default meta;

export const EntityIntro = {
  render: () => `<article class="project">${renderEntityIntro(pageWithIntro.intro, { headingLevel: 1 })}</article>`,
};

export const SectionIntro = {
  render: () => `<section class="project__section wrapper">${renderSectionIntro(firstSectionWith("intro").intro, { reveal: false })}</section>`,
};

export const ResourceLinks = {
  render: () => `<section class="project__section wrapper">${renderResourceLinks(firstSectionWith("resources").resources, { reveal: false })}</section>`,
};

export const PortfolioEntityCard = {
  render: () => `<ul class="project-list">${renderPortfolioEntityCard(projectCard)}</ul>`,
};

export const ProjectCard = {
  render: () => `<ul class="project-list">${renderPortfolioEntityCard(projectCard)}</ul>`,
};

export const SubprojectCard = {
  render: () => `<div class="subproject-grid">${renderSubprojectCard(subprojectCard)}</div>`,
};

export const ResponsiveImage = {
  render: () => `<div class="wrapper">${renderContentBlock(firstBlock("media-figure"), { reveal: false })}</div>`,
};
