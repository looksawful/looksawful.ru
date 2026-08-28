import type {
  SubprojectCardData,
  SubprojectCardGroupData,
} from "../data/subproject-cards.ts";
import { escapeHtml } from "../utils/html.ts";
import { renderMediaElement } from "./media-figure.ts";

function renderCardBody(card: SubprojectCardData): string {
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
        ${media}
      </div>
      <figcaption class="subproject-card__caption">
        <h3 class="subproject-card__title">${escapeHtml(card.title)}</h3>
        <p class="subproject-card__description">${escapeHtml(card.description)}</p>
      </figcaption>
    </figure>
  `;
}

export function renderSubprojectCard(card: SubprojectCardData): string {
  const body = renderCardBody(card);
  const attributes = `class="subproject-card" data-shape="${card.shape}" data-subproject-id="${escapeHtml(card.id)}"`;

  if (!card.href) {
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
        ${group.cards.map(renderSubprojectCard).join("\n")}
      </div>
    </section>
  `;
}

export function renderSubprojectCardGroups(groups: readonly SubprojectCardGroupData[]): string {
  return groups.map(renderSubprojectCardGroup).join("\n");
}

export function renderPetProjectCards(cards: readonly SubprojectCardData[]): string {
  return cards.map(renderSubprojectCard).join("\n");
}
