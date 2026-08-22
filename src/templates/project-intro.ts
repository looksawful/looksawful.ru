import { logoFiles, logoUsages, type LogoFileId, type LogoUsageId } from "../data/logos/index.ts";

import { getMediaAsset, type MediaAssetId } from "../data/media/index.ts";

import type {
  ProjectIntroData,
  ProjectIntroHeadData,
  ProjectIntroLinkData,
  ProjectIntroTitleData,
} from "../types/content.ts";

import type { LogoFileData, LogoUsageData } from "../types/logo.ts";

import { escapeHtml } from "../utils/html.ts";

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

function renderLogo(usageId: LogoUsageId): string {
  const logo = resolveLogoUsage(usageId);

  return `<img src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.alt)}">`;
}

function renderHead(head?: ProjectIntroHeadData<LogoUsageId>): string {
  if (!head) {
    return "";
  }

  if (head.type === "text") {
    return `<p class="project__name">${escapeHtml(head.text)}</p>`;
  }

  const logo = renderLogo(head.logoUsageId);

  if (head.wrapper === "name") {
    return `<p class="project__name">${logo}</p>`;
  }

  return logo;
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
    >
      ${data.links.map(renderLink).join("\n")}
    </nav>
  `;
}

export function renderProjectIntro(data: ProjectIntroData<LogoUsageId>): string {
  const role = data.role ? `<p class="project__role">${escapeHtml(data.role)}</p>` : "";

  const period = data.period ? `<p class="project__period">${escapeHtml(data.period)}</p>` : "";

  const summary = data.summary ? `<p class="project__summary">${escapeHtml(data.summary)}</p>` : "";

  const lead = data.lead ? `<p class="project__lead">${escapeHtml(data.lead)}</p>` : "";

  return `
    <div class="project__head">
      ${renderHead(data.head)}
      ${role}
      ${period}
    </div>

    <header class="project__intro wrapper prose editorial-grid">
      <h2 class="project__title">
        ${renderTitle(data.title)}
      </h2>

      ${summary}
      ${lead}
      ${renderLinks(data)}
    </header>
  `;
}
