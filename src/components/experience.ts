import { getClient, getEngagement } from "../data/catalog/lookup.ts";
import type { EngagementId } from "../data/catalog/engagements.ts";
import type { EngagementData } from "../types/engagement.ts";

const experienceEngagementIds = [
  "jestei-pool-2024-2026",
  "styx-jewel-2021-2025",
  "sensetique-2016-2018",
  "mad-cow-films-2019",
  "li-ne-agency-2017",
  "progress-tradition-2013-2015",
  "moskovskie-novosti-2012",
] as const satisfies readonly EngagementId[];

function getExperienceLabel(engagement: EngagementData): string {
  if (engagement.displayName) return engagement.displayName;

  const clientId = engagement.clientIds?.[0];
  if (!clientId) {
    throw new Error(`Experience engagement "${engagement.id}" has no display name or client.`);
  }

  return getClient(clientId).name;
}

function renderExperienceItem(id: EngagementId): string {
  const engagement = getEngagement(id);
  const period = engagement.date;

  if (!period) {
    throw new Error(`Experience engagement "${engagement.id}" has no date.`);
  }

  return `
    <li class="experience__item">
      <span class="experience__period">[${period}]</span>
      <span class="experience__arrow" aria-hidden="true">→</span>
      <span class="experience__place">${getExperienceLabel(engagement)}</span>
    </li>`;
}

function renderExperience(): string {
  return `
    <h2 id="experience-title">Места работы</h2>
    <ol class="experience__list">
      ${experienceEngagementIds.map(renderExperienceItem).join("\n")}
    </ol>`;
}

export function mountExperience(root: ParentNode = document): void {
  const section = root.querySelector<HTMLElement>(".experience");

  if (!section) return;

  const visibility = section.dataset.experienceVisibility ?? "hidden";
  section.dataset.experienceVisibility = visibility;

  if (visibility === "hidden") {
    section.hidden = true;
    return;
  }

  section.setAttribute("aria-labelledby", "experience-title");
  section.removeAttribute("aria-label");
  section.innerHTML = renderExperience();
  section.hidden = false;
}
