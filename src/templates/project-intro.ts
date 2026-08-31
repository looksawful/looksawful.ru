import { logoFiles, logoUsages, type LogoFileId, type LogoUsageId } from "../data/logos/index.ts";

import { getMediaAsset, type MediaAssetId } from "../data/media/index.ts";

import type {
  ProjectIntroData,
  ProjectIntroHeadData,
  ProjectIntroLinkData,
  ProjectIntroTitleData,
} from "../types/content.ts";

import type { LogoFileData, LogoUsageData } from "../types/logo.ts";

import { renderRevealAttribute, renderRevealGroupAttribute } from "../motion-contract.ts";
import { escapeHtml } from "../utils/html.ts";

export interface ProjectIntroRenderOptions {
  headingLevel?: 1 | 2;
}

function getLogoUsage(id: LogoUsageId): LogoUsageData<LogoFileId> {
  const usage = logoUsages.find((candidate) => candidate.id === id);

  if (!usage) {
    throw new Error(`Unknown LogoUsage: ${id}`);
  }

  return usage;
}

function getLogoFile(id: LogoFileId): LogoFileData {
  const file = logoFiles.find((candidate) => candidate.id === id);

  if (!file) {
    throw new Error(`Unknown LogoFile: ${id}`);
  }

  return file;
}

function resolveLogoUsage(usageId: LogoUsageId): {
  src: string;
  alt: string;
} {
  const usage = getLogoUsage(usageId);
  const file = getLogoFile(usage.fileId);

  let src = file.src;

  if (!src && file.mediaAssetId) {
    src = getMediaAsset(file.mediaAssetId as MediaAssetId).src;
  }

  if (!src) {
    throw new Error(`LogoUsage "${usageId}" has no resolvable file`);
  }

  return {
    src,
    alt: usage.alt ?? "",
  };
}

function renderLogo(usageId: LogoUsageId, attributes = ""): string {
  const logo = resolveLogoUsage(usageId);

  return `<img${attributes} src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.alt)}">`;
}

function renderHead(head?: ProjectIntroHeadData<LogoUsageId>): string {
  if (!head) {
    return "";
  }

  if (head.type === "text") {
    if (!head.text) return "";
    return `<p class="project__name"${renderRevealAttribute("copy")}>${escapeHtml(head.text)}</p>`;
  }

  const logo = renderLogo(head.logoUsageId);

  if (head.wrapper === "name") {
    return `<p class="project__name"${renderRevealAttribute("copy")}>${logo}</p>`;
  }

  return renderLogo(head.logoUsageId, renderRevealAttribute("copy"));
}

function renderTitle(title: ProjectIntroTitleData<LogoUsageId>): string {
  if (title.type === "logo") {
    return renderLogo(title.logoUsageId);
  }

  return escapeHtml(title.text);
}

function renderLink(link: ProjectIntroLinkData): string {
  const rel = link.rel ? ` rel="${escapeHtml(link.rel)}"` : "";

  const target = link.target ? ` target="${escapeHtml(link.target)}"` : "";

  return `<a href="${escapeHtml(link.href)}"${rel}${target}>${escapeHtml(link.label)}</a>`;
}

function renderLinks(data: ProjectIntroData<LogoUsageId>): string {
  if (!data.links?.length) {
    return "";
  }

  const label = data.linksLabel ?? "Ссылки проекта";

  return `
    <nav
      aria-label="${escapeHtml(label)}"
      class="project__links cluster"
      ${renderRevealAttribute("copy")}
    >
      ${data.links.map(renderLink).join("\n")}
    </nav>
  `;
}

export function renderProjectIntro(
  data: ProjectIntroData<LogoUsageId>,
  options: ProjectIntroRenderOptions = {},
): string {
  const role = data.role ? `<p class="project__role"${renderRevealAttribute("copy")}>${escapeHtml(data.role)}</p>` : "";

  const period = data.period ? `<p class="project__period"${renderRevealAttribute("copy")}>${escapeHtml(data.period)}</p>` : "";

  const summary = data.summary ? `<p class="project__summary"${renderRevealAttribute("copy")}>${escapeHtml(data.summary)}</p>` : "";

  const lead = data.lead ? `<p class="project__lead"${renderRevealAttribute("copy")}>${escapeHtml(data.lead)}</p>` : "";
  const headingTag = options.headingLevel === 1 ? "h1" : "h2";
  const head = renderHead(data.head);
  const projectHead = head || role || period
    ? `
    <div class="project__head"${renderRevealGroupAttribute()}>
      ${head}
      ${role}
      ${period}
    </div>
  `
    : "";
  const title = renderTitle(data.title);
  const titleHtml = title
    ? `<${headingTag} class="project__title"${renderRevealAttribute("copy")}>
        ${title}
      </${headingTag}>`
    : "";
  const links = renderLinks(data);
  const projectIntro = titleHtml || summary || lead || links
    ? `
    <header class="project__intro wrapper prose editorial-grid"${renderRevealGroupAttribute()}>
      ${titleHtml}

      ${summary}
      ${lead}
      ${links}
    </header>
  `
    : "";

  if (!projectHead && !projectIntro) return "";

  return `
    ${projectHead}
    ${projectIntro}
  `;
}
