import { renderRevealAttribute } from "../../motion-contract.ts";
import type { ResourceLinkData, ResourceLinksData } from "../../types/content.ts";
import { escapeHtml } from "../../utils/html.ts";

export interface ResourceLinksRenderOptions {
  reveal?: boolean;
}

function renderResourceLink(link: ResourceLinkData): string {
  const target = link.target ? ` target="${escapeHtml(link.target)}"` : "";
  const rel = link.rel ? ` rel="${escapeHtml(link.rel)}"` : "";
  const download = link.download ? ` download="${escapeHtml(link.download)}"` : "";

  return `<a class="resource-row__action" href="${escapeHtml(link.href)}"${target}${rel}${download}>${escapeHtml(link.label)}</a>`;
}

export function renderResourceLinks(
  data: ResourceLinksData,
  options: ResourceLinksRenderOptions = {},
): string {
  const reveal = options.reveal ?? true;
  const links = data.links
    .map((link, index) => {
      const separator = index > 0 ? '<span aria-hidden="true">/</span>' : "";
      return `${separator}${renderResourceLink(link)}`;
    })
    .join("\n");

  return `
    <div class="resource-row cluster">
      <p class="resource-row__copy"${renderRevealAttribute(reveal ? "copy" : false)}>${escapeHtml(data.text)}</p>
      <span class="cluster" style="--cluster-space: 0.35em">
        ${links}
      </span>
    </div>
  `;
}
