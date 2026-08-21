import type { ClientLogoData } from "../data/clients.ts";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

export function renderClientLogo(logo: ClientLogoData): string {
  const alt = logo.alt ?? logo.name;

  const src = `/media/clients/logo-wall/client-logo-${logo.file}.webp`;

  return `
    <figure
      class="media portfolio-logo-wall__item"
      data-lightbox="off"
      data-infinite-reel-item
      aria-label="${escapeHtml(alt)}"
    >
      <div
        class="media__surface"
        style="--media-ratio: 1200 / 496"
      >
        <img
          alt="${escapeHtml(alt)}"
          decoding="async"
          height="496"
          src="${escapeHtml(src)}"
          width="1200"
        >
      </div>
    </figure>
  `;
}
