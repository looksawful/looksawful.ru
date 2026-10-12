import { escapeHtml } from "../../utils/html.ts";
import type {
  AllServicesPageDefinition,
  ServicesPageDefinition,
} from "../pages/types.ts";
import {
  allServiceGroups,
  fastGraphicDesign,
  mainServiceGroups,
  type MainServiceCard,
} from "../pages/services-content.ts";
import { renderPageShell } from "../shell/page-shell.ts";

const CONTACT_HREF = "mailto:i@lookawful.ru";

function renderContactCta(label: string): string {
  return `<footer class="contact services-contact">
  <a href="${CONTACT_HREF}">${escapeHtml(label)}</a>
</footer>`;
}

function renderProof(card: MainServiceCard): string {
  if (!card.proof) return "";
  return `<p class="services-card__proof">Кейс: <a href="${escapeHtml(card.proof.href)}">${escapeHtml(card.proof.label)}</a></p>`;
}

function renderMainCard(card: MainServiceCard): string {
  return `<article class="services-card" data-service-card="${escapeHtml(card.id)}">
  <h3 class="services-card__title">${escapeHtml(card.title)}</h3>
  <p class="services-card__result">${escapeHtml(card.result)}</p>
  <ul class="services-card__deliverables">
    ${card.deliverables.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>
  ${renderProof(card)}
  ${renderContactCta("Обсудить проект")}
</article>`;
}

function renderMainGroup(group: (typeof mainServiceGroups)[number]): string {
  return `<section class="services-group" data-service-group="${escapeHtml(group.id)}">
  <header class="services-group__header">
    <h2>${escapeHtml(group.title)}</h2>
  </header>
  <div class="services-grid">
    ${group.cards.map(renderMainCard).join("\n    ")}
  </div>
</section>`;
}

function renderFastGraphicDesign(): string {
  return `<section class="services-fast" data-fast-graphic-design>
  <header>
    <h2>${escapeHtml(fastGraphicDesign.title)}</h2>
    <p>${escapeHtml(fastGraphicDesign.result)}</p>
  </header>
  <ul class="services-fast__items">
    ${fastGraphicDesign.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n    ")}
  </ul>
  ${renderContactCta("Есть небольшая задача")}
</section>`;
}

function renderAllServiceGroup(group: (typeof allServiceGroups)[number]): string {
  return `<section class="services-group services-group--catalog" data-all-service-group="${escapeHtml(group.id)}">
  <h2>${escapeHtml(group.title)}</h2>
  <div class="services-catalog">
    ${group.sections.map((section) => `<section class="services-catalog__section">
      <h3>${escapeHtml(section.title)}</h3>
      <ul>
        ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n        ")}
      </ul>
    </section>`).join("\n    ")}
  </div>
</section>`;
}

export function renderServicesPage(page: ServicesPageDefinition): string {
  return renderPageShell({
    page,
    title: "Услуги — Иван Крушинский",
    description: "Дизайн, 3D, AI, frontend и визуальное производство для брендов, продуктов и музыкантов.",
    content: `<article class="services-page" data-services-page>
  <header class="services-intro">
    <p class="services-intro__eyebrow">services</p>
    <h1>Услуги</h1>
    <p>Основные направления работы: дизайн, 3D, AI, разработка и визуальное производство для музыкантов.</p>
  </header>
  ${mainServiceGroups.map(renderMainGroup).join("\n")}
  ${renderFastGraphicDesign()}
  <p class="services-all-link"><a href="/services/all/">Все услуги</a></p>
</article>`,
  });
}

export function renderAllServicesPage(page: AllServicesPageDefinition): string {
  return renderPageShell({
    page,
    title: "Все услуги — Иван Крушинский",
    description: "Полный каталог услуг Ивана Крушинского по дизайну, 3D, AI, разработке и музыкальным визуальным проектам.",
    content: `<article class="services-page services-page--all" data-all-services-page>
  <header class="services-intro">
    <p class="services-intro__eyebrow">all services</p>
    <h1>Все услуги</h1>
    <p>Полный каталог подтверждённых направлений. Основные услуги собраны отдельно на <a href="/services/">странице Services</a>.</p>
  </header>
  ${allServiceGroups.map(renderAllServiceGroup).join("\n")}
  ${renderContactCta("Обсудить проект")}
</article>`,
  });
}
