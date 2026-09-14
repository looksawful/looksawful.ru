import { petProjectCards } from "../../data/pet-project-cards.ts";
import { renderPetProjectCards } from "../../templates/subproject-card.ts";
import "../../styles/subproject-cards.css";
import "./pet-projects.stories.css";

function renderSection(cards) {
  return `
    <div class="lab-pet-projects-story">
      <section class="pet-projects" aria-labelledby="lab-pet-projects-title">
        <h2 id="lab-pet-projects-title">Полезное</h2>
        <div class="pet-projects__grid" aria-label="Полезные проекты">
          ${renderPetProjectCards(cards)}
        </div>
      </section>
    </div>
  `;
}

const liveNewCard = [
  {
    ...petProjectCards[0],
    id: "awful-cases-new-fixture",
    badge: "new",
  },
];

const { href: _awfulStudioHref, ...awfulStudioWithoutHref } = petProjectCards[3];
const comingSoonCard = [
  {
    ...awfulStudioWithoutHref,
    id: "awful-studio-coming-soon-fixture",
    state: "coming-soon",
  },
];

const largeSyntheticSet = Array.from({ length: 12 }, (_, index) => {
  const source = petProjectCards[index % petProjectCards.length];
  return {
    ...source,
    id: `${source.id}-fixture-${index + 1}`,
    href: `${source.href}?fixture=${index + 1}`,
    badge: index === 4 ? "new" : source.badge,
  };
});

const meta = {
  title: "03 Organisms/Pet Projects",
  tags: ["autodocs", "lab", "production-source"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Approval surface backed by the production Pet Projects data, renderer and CSS. Narrow containers use a centered snap reel; wider containers resolve to 2-column and 4-column grids without JavaScript layout calculations.",
      },
    },
  },
};

export default meta;

export const CurrentFour = {
  render: () => renderSection(petProjectCards),
};

export const LiveWithNew = {
  render: () => renderSection(liveNewCard),
};

export const ComingSoon = {
  render: () => renderSection(comingSoonCard),
};

export const LargeSet = {
  render: () => renderSection(largeSyntheticSet),
};
