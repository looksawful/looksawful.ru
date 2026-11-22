import { shootingCardGroups, petProjectCards } from "../../data/subproject-cards.ts";
import { renderSubprojectCard, renderSubprojectCardGroup } from "../../templates/subproject-card.ts";

const cards = shootingCardGroups.flatMap((group) => group.cards);
const sampleCards = cards.filter((card) => ["landscape", "square", "portrait"].includes(card.shape));
const cardIds = [...new Set(sampleCards.map((card) => card.id))];

const meta = {
  title: "02 Molecules/Subproject Cards",
  tags: ["autodocs", "stable"],
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/data/subproject-cards.ts", "src/templates/subproject-card.ts", "src/styles/subproject-cards.css"],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "The same card data, media, badge and responsive layout as the public portfolio. No Storybook card implementation." } },
  },
};
export default meta;

export const SelectedCard = {
  args: { cardId: cardIds[0] },
  argTypes: { cardId: { control: "select", options: cardIds } },
  render: ({ cardId }) => {
    const card = sampleCards.find((candidate) => candidate.id === cardId) ?? sampleCards[0];
    return '<main class="wrapper" style="--wrapper-max-width:34rem;padding-block:var(--size-400)">' +
      renderSubprojectCard(card) + '</main>';
  },
};

export const ProductionGroup = {
  render: () => '<main class="wrapper" style="padding-block:var(--size-400)">' +
    renderSubprojectCardGroup(shootingCardGroups[0]) + '</main>',
};

export const PetProjects = {
  render: () => '<main class="pet-projects"><div class="pet-projects__grid">' +
    petProjectCards.slice(0, 4).map((card) => renderSubprojectCard(card, { reveal: false })).join("") +
    '</div></main>',
};
