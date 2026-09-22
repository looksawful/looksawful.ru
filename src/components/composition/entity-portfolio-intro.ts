import type { EntityPortfolioIntroData } from "../../content/contracts/page-content.ts";
import { renderRevealAttribute, renderRevealGroupAttribute } from "../../motion-contract.ts";
import { escapeHtml } from "../../utils/html.ts";

interface PortfolioIntroField {
  label: string;
  value: string;
}

function fieldsFor(data: EntityPortfolioIntroData): readonly PortfolioIntroField[] {
  switch (data.kind) {
    case "case":
      return [
        { label: "Role", value: data.role },
        { label: "Task", value: data.task },
        { label: "Contribution", value: data.contribution },
        { label: "Result", value: data.result },
      ];
    case "project":
      return [
        { label: "What", value: data.what },
        { label: "Role", value: data.role },
        { label: "Result", value: data.result },
      ];
    case "collection":
      return [
        { label: "Role", value: data.role },
        { label: "Period", value: data.period },
        { label: "Contents", value: data.contents },
      ];
  }
}

export function renderEntityPortfolioIntro(data?: EntityPortfolioIntroData): string {
  if (!data) return "";

  const fields = fieldsFor(data)
    .map(({ label, value }) => `<div class="project__portfolio-intro-item"${renderRevealAttribute("copy")}>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>`)
    .join("\n");

  return `<section class="project__portfolio-intro wrapper" data-portfolio-intro-kind="${escapeHtml(data.kind)}" aria-label="Project summary"${renderRevealGroupAttribute()}>
    <dl class="project__portfolio-intro-list">
      ${fields}
    </dl>
  </section>`;
}
