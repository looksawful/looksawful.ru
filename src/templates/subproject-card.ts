import type { PetProjectCardData } from "../data/pet-project-cards.ts";
import type {
  SubprojectCardData,
  SubprojectCardGroupData,
} from "../data/subproject-cards.ts";
import { renderRevealAttribute } from "../motion-contract.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderMediaElement } from "./media-figure.ts";

interface RenderSubprojectCardOptions {
  reveal?: boolean;
}

function renderCardBody(card: SubprojectCardData, badge?: string): string {
  const media = renderMediaElement(card.coverEntryId, {
    loading: "lazy",
    video: {
      autoplay: true,
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata",
    },
  });

  return `
    <figure class="subproject-card__figure">
      <div class="subproject-card__media">
        ${badge ? `<span class="subproject-card__badge">${escapeHtml(badge)}</span>` : ""}
        ${media}
      </div>
      <figcaption class="subproject-card__caption">
        <h3 class="subproject-card__title">${escapeHtml(card.title)}</h3>
        <p class="subproject-card__description">${escapeHtml(card.description)}</p>
      </figcaption>
    </figure>
  `;
}

function renderCardAttributes(
  card: SubprojectCardData,
  options: RenderSubprojectCardOptions = {},
  state?: PetProjectCardData["state"],
): string {
  const reveal = renderRevealAttribute(options.reveal ? "card" : false);
  const stateAttribute = state ? ` data-card-state="${state}"` : "";

  return `class="subproject-card" data-shape="${card.shape}" data-subproject-id="${escapeHtml(card.id)}"${stateAttribute}${reveal}`;
}

export function renderSubprojectCard(
  card: SubprojectCardData,
  options: RenderSubprojectCardOptions = {},
): string {
  const body = renderCardBody(card);
  const attributes = renderCardAttributes(card, options);

  if (!card.href) {
    return `<article ${attributes}>${body}</article>`;
  }

  const external = /^https?:\/\//.test(card.href);
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";

  return `<a ${attributes} href="${escapeHtml(card.href)}"${target}>${body}</a>`;
}

function getPetProjectBadge(card: PetProjectCardData): string | undefined {
  if (card.state === "coming-soon") return "COMING SOON";
  if (card.badge === "new") return "NEW";
  return undefined;
}

function renderPetProjectCard(card: PetProjectCardData): string {
  const body = renderCardBody(card, getPetProjectBadge(card));
  const attributes = renderCardAttributes(card, { reveal: true }, card.state);

  if (card.state === "coming-soon") {
    return `<article ${attributes}>${body}</article>`;
  }

  const external = /^https?:\/\//.test(card.href);
  const target = external ? ' target="_blank" rel="noopener noreferrer"' : "";

  return `<a ${attributes} href="${escapeHtml(card.href)}"${target}>${body}</a>`;
}

export function renderSubprojectCardGroup(group: SubprojectCardGroupData): string {
  return `
    <section class="subproject-group" id="${escapeHtml(group.id)}" aria-labelledby="${escapeHtml(group.id)}-title">
      <header class="subproject-group__head">
        <h2 class="subproject-group__title" id="${escapeHtml(group.id)}-title">${escapeHtml(group.title)}</h2>
        ${group.description ? `<p class="subproject-group__description">${escapeHtml(group.description)}</p>` : ""}
      </header>
      <div class="subproject-grid">
        ${group.cards.map((card) => renderSubprojectCard(card)).join("\n")}
      </div>
    </section>
  `;
}

export function renderSubprojectCardGroups(groups: readonly SubprojectCardGroupData[]): string {
  return groups.map(renderSubprojectCardGroup).join("\n");
}

export function renderPetProjectCards(cards: readonly PetProjectCardData[]): string {
  return cards.map(renderPetProjectCard).join("\n");
}
